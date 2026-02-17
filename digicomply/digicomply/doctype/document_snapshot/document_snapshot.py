# Copyright (c) 2026, DigiComply and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
import hashlib
import json


class DocumentSnapshot(Document):
    """
    Document Snapshot for Point-in-Time State Storage

    Features:
    - Captures complete document state including child tables
    - Generates content hash for integrity verification
    - Tracks changes between snapshots
    - Links to audit logs
    """

    def before_insert(self):
        """Set up snapshot before saving"""
        self.set_triggered_by()
        self.set_snapshot_timestamp()
        self.generate_content_hash()
        self.link_previous_snapshot()
        self.compute_changes()

    def set_triggered_by(self):
        """Set the user who triggered the snapshot"""
        if not self.triggered_by:
            self.triggered_by = frappe.session.user

    def set_snapshot_timestamp(self):
        """Ensure timestamp is set"""
        if not self.snapshot_timestamp:
            self.snapshot_timestamp = frappe.utils.now_datetime()

    def generate_content_hash(self):
        """Generate SHA-256 hash of document data"""
        hash_content = self.document_data or ""
        if self.child_tables_data:
            hash_content += self.child_tables_data

        self.content_hash = hashlib.sha256(hash_content.encode()).hexdigest()

    def link_previous_snapshot(self):
        """Link to the most recent snapshot of the same document"""
        if self.previous_snapshot:
            return

        previous = frappe.db.get_value(
            "Document Snapshot",
            filters={
                "document_type": self.document_type,
                "document_name": self.document_name,
                "name": ["!=", self.name or ""]
            },
            fieldname="name",
            order_by="snapshot_timestamp desc"
        )

        if previous:
            self.previous_snapshot = previous

    def compute_changes(self):
        """Compute differences from previous snapshot"""
        if not self.previous_snapshot or self.changes_from_previous:
            return

        try:
            previous_doc = frappe.get_doc("Document Snapshot", self.previous_snapshot)
            current_data = json.loads(self.document_data) if self.document_data else {}
            previous_data = json.loads(previous_doc.document_data) if previous_doc.document_data else {}

            changes = self._compute_diff(previous_data, current_data)
            self.changes_from_previous = json.dumps(changes, indent=2, default=str)

        except Exception as e:
            frappe.log_error(f"Error computing snapshot diff: {str(e)}", "Snapshot Diff Error")

    def _compute_diff(self, old_data, new_data):
        """Compute differences between two document states"""
        changes = {
            "added": {},
            "removed": {},
            "modified": {}
        }

        # Fields in new but not in old
        for key in new_data:
            if key not in old_data:
                changes["added"][key] = new_data[key]
            elif old_data[key] != new_data[key]:
                changes["modified"][key] = {
                    "old": old_data[key],
                    "new": new_data[key]
                }

        # Fields in old but not in new
        for key in old_data:
            if key not in new_data:
                changes["removed"][key] = old_data[key]

        return changes

    def on_trash(self):
        """Prevent deletion of snapshots"""
        frappe.throw(
            "Document Snapshots cannot be deleted. "
            "This is required for UAE FTA compliance.",
            title="Cannot Delete Snapshot"
        )

    @staticmethod
    def create_snapshot(
        document_type,
        document_name,
        snapshot_type="Manual",
        trigger_event=None
    ):
        """
        Create a snapshot of a document

        Usage:
            DocumentSnapshot.create_snapshot(
                document_type="Sales Invoice",
                document_name="SINV-0001",
                snapshot_type="Before Change"
            )
        """
        try:
            # Get the document
            doc = frappe.get_doc(document_type, document_name)

            # Serialize document data
            document_data = doc.as_dict()

            # Remove internal fields
            internal_fields = [
                "modified", "modified_by", "creation", "owner",
                "_user_tags", "_comments", "_assign", "_liked_by",
                "idx", "docstatus", "_local"
            ]
            for field in internal_fields:
                document_data.pop(field, None)

            # Get child table data
            child_tables = {}
            meta = frappe.get_meta(document_type)
            for df in meta.get_table_fields():
                child_data = doc.get(df.fieldname)
                if child_data:
                    child_tables[df.fieldname] = [
                        {k: v for k, v in row.as_dict().items()
                         if k not in internal_fields}
                        for row in child_data
                    ]

            # Get attachments
            attachments = frappe.get_all(
                "File",
                filters={
                    "attached_to_doctype": document_type,
                    "attached_to_name": document_name
                },
                fields=["file_name", "file_url", "file_size", "is_private"]
            )

            # Get company if available
            company = document_data.get("company") or None

            # Get document version
            version = frappe.db.count(
                "Document Snapshot",
                filters={
                    "document_type": document_type,
                    "document_name": document_name
                }
            ) + 1

            # Create snapshot
            snapshot = frappe.get_doc({
                "doctype": "Document Snapshot",
                "document_type": document_type,
                "document_name": document_name,
                "snapshot_type": snapshot_type,
                "trigger_event": trigger_event,
                "company": company,
                "document_data": json.dumps(document_data, indent=2, default=str),
                "child_tables_data": json.dumps(child_tables, indent=2, default=str) if child_tables else None,
                "attachments_list": json.dumps(attachments, indent=2) if attachments else None,
                "document_version": version
            })

            snapshot.insert(ignore_permissions=True)
            return snapshot.name

        except Exception as e:
            frappe.log_error(
                f"Failed to create snapshot for {document_type}/{document_name}: {str(e)}",
                "Snapshot Creation Error"
            )
            return None

    @staticmethod
    def get_document_history(document_type, document_name):
        """Get all snapshots for a document"""
        return frappe.get_all(
            "Document Snapshot",
            filters={
                "document_type": document_type,
                "document_name": document_name
            },
            fields=[
                "name", "snapshot_type", "snapshot_timestamp",
                "triggered_by", "trigger_event", "document_version",
                "content_hash", "previous_snapshot"
            ],
            order_by="snapshot_timestamp desc"
        )

    @staticmethod
    def compare_snapshots(snapshot1_name, snapshot2_name):
        """Compare two snapshots and return differences"""
        snap1 = frappe.get_doc("Document Snapshot", snapshot1_name)
        snap2 = frappe.get_doc("Document Snapshot", snapshot2_name)

        data1 = json.loads(snap1.document_data) if snap1.document_data else {}
        data2 = json.loads(snap2.document_data) if snap2.document_data else {}

        return {
            "snapshot1": {
                "name": snapshot1_name,
                "timestamp": snap1.snapshot_timestamp,
                "type": snap1.snapshot_type
            },
            "snapshot2": {
                "name": snapshot2_name,
                "timestamp": snap2.snapshot_timestamp,
                "type": snap2.snapshot_type
            },
            "differences": snap1._compute_diff(data1, data2)
        }


@frappe.whitelist()
def create_manual_snapshot(document_type, document_name, reason=None):
    """API to create a manual snapshot"""
    snapshot_name = DocumentSnapshot.create_snapshot(
        document_type=document_type,
        document_name=document_name,
        snapshot_type="Manual",
        trigger_event=reason or "Manual snapshot requested"
    )

    if snapshot_name:
        frappe.msgprint(f"Snapshot created: {snapshot_name}")
        return snapshot_name
    else:
        frappe.throw("Failed to create snapshot")


@frappe.whitelist()
def get_snapshot_diff(snapshot1, snapshot2):
    """API to compare two snapshots"""
    return DocumentSnapshot.compare_snapshots(snapshot1, snapshot2)


@frappe.whitelist()
def restore_from_snapshot(snapshot_name):
    """
    Get document data from snapshot (for review, not actual restore)
    Actual restoration should be done carefully with proper approvals
    """
    snapshot = frappe.get_doc("Document Snapshot", snapshot_name)

    return {
        "document_type": snapshot.document_type,
        "document_name": snapshot.document_name,
        "snapshot_type": snapshot.snapshot_type,
        "snapshot_timestamp": snapshot.snapshot_timestamp,
        "document_data": json.loads(snapshot.document_data) if snapshot.document_data else {},
        "child_tables_data": json.loads(snapshot.child_tables_data) if snapshot.child_tables_data else {},
        "attachments": json.loads(snapshot.attachments_list) if snapshot.attachments_list else []
    }
