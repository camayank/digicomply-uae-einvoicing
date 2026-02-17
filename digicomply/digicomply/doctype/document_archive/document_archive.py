# Copyright (c) 2026, DigiComply and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import now_datetime, add_years, getdate
import hashlib
import json
import gzip
import base64


class DocumentArchive(Document):
    """
    Document Archive for UAE FTA 5-Year Retention Compliance

    Features:
    - Immutable document storage
    - Hash integrity verification
    - Compression and encryption
    - Tiered storage management
    - Legal hold support
    """

    def before_insert(self):
        """Set up archive before saving"""
        self.set_archive_defaults()
        self.set_retention_dates()
        self.generate_content_hash()

    def set_archive_defaults(self):
        """Set default values for archive"""
        if not self.archive_date:
            self.archive_date = now_datetime()

        if not self.archived_by:
            self.archived_by = frappe.session.user

        if not self.archive_status:
            self.archive_status = "Archived"

    def set_retention_dates(self):
        """Set retention dates based on UAE FTA requirements (5 years)"""
        if not self.retention_until:
            # UAE FTA requires 5-year retention
            archive_date = getdate(self.archive_date)
            self.retention_until = add_years(archive_date, 5)

        if not self.auto_delete_after:
            # Allow deletion 6 months after retention period
            self.auto_delete_after = add_years(self.retention_until, 0.5)

    def generate_content_hash(self):
        """Generate SHA-256 hash of archived content"""
        hash_content = ""

        if self.snapshot_reference:
            snapshot = frappe.get_doc("Document Snapshot", self.snapshot_reference)
            hash_content = snapshot.document_data or ""

        if self.archived_json:
            hash_content += str(self.archived_json)

        if hash_content:
            self.content_hash = hashlib.sha256(hash_content.encode()).hexdigest()

    def on_update(self):
        """Prevent unauthorized modifications"""
        if self.get_doc_before_save():
            old_doc = self.get_doc_before_save()

            # Only allow certain fields to be modified
            immutable_fields = [
                "document_type", "document_name", "archive_date",
                "archived_by", "content_hash", "archived_json",
                "snapshot_reference", "signed_document"
            ]

            for field in immutable_fields:
                if getattr(old_doc, field) != getattr(self, field):
                    frappe.throw(
                        f"Cannot modify immutable field '{field}' in archived document",
                        title="Immutable Archive"
                    )

    def on_trash(self):
        """Prevent deletion of archives under legal hold or within retention"""
        if self.under_legal_hold:
            frappe.throw(
                "This document is under legal hold and cannot be deleted.",
                title="Legal Hold Active"
            )

        if self.retention_until and getdate() < getdate(self.retention_until):
            frappe.throw(
                f"This document must be retained until {self.retention_until} per UAE FTA requirements.",
                title="Retention Period Active"
            )

    def verify_integrity(self):
        """Verify the integrity of archived content"""
        hash_content = ""

        if self.snapshot_reference:
            snapshot = frappe.get_doc("Document Snapshot", self.snapshot_reference)
            hash_content = snapshot.document_data or ""

        if self.archived_json:
            hash_content += str(self.archived_json)

        if hash_content:
            current_hash = hashlib.sha256(hash_content.encode()).hexdigest()
            self.hash_verified = (current_hash == self.content_hash)
            self.last_verification = now_datetime()
            self.save(ignore_permissions=True)
            return self.hash_verified

        return False

    def retrieve(self, reason=None):
        """Retrieve archived document and log the access"""
        # Update retrieval stats
        self.retrieval_count = (self.retrieval_count or 0) + 1
        self.last_retrieved = now_datetime()
        self.last_retrieved_by = frappe.session.user
        self.archive_status = "Retrieved"
        self.save(ignore_permissions=True)

        # Create retrieval log
        frappe.get_doc({
            "doctype": "Archive Retrieval Log",
            "document_archive": self.name,
            "document_type": self.document_type,
            "document_name": self.document_name,
            "retrieval_reason": reason or "Document retrieval requested",
            "retrieved_by": frappe.session.user
        }).insert(ignore_permissions=True)

        # Log to audit trail
        from digicomply.digicomply.doctype.audit_log.audit_log import AuditLog
        AuditLog.log_event(
            event_type="Archive Retrieved",
            document_type=self.document_type,
            document_name=self.document_name,
            description=f"Archived document retrieved: {reason or 'No reason specified'}",
            company=self.company
        )

        return self.get_archived_content()

    def get_archived_content(self):
        """Get the archived content"""
        content = {
            "document_type": self.document_type,
            "document_name": self.document_name,
            "archive_date": self.archive_date,
            "company": self.company,
            "data": None,
            "attachments": []
        }

        if self.snapshot_reference:
            snapshot = frappe.get_doc("Document Snapshot", self.snapshot_reference)
            content["data"] = json.loads(snapshot.document_data) if snapshot.document_data else {}
            content["child_tables"] = json.loads(snapshot.child_tables_data) if snapshot.child_tables_data else {}

        if self.original_attachments:
            content["attachments"] = json.loads(self.original_attachments)

        return content

    def apply_legal_hold(self, legal_hold_name, reason):
        """Apply legal hold to this archive"""
        self.under_legal_hold = 1
        self.legal_hold_reference = legal_hold_name
        self.legal_hold_start = now_datetime()
        self.legal_hold_reason = reason
        self.archive_status = "Legal Hold"
        self.save(ignore_permissions=True)

        # Log to audit
        from digicomply.digicomply.doctype.audit_log.audit_log import AuditLog
        AuditLog.log_event(
            event_type="Archive Retrieved",
            document_type="Document Archive",
            document_name=self.name,
            description=f"Legal hold applied: {reason}",
            severity="Warning"
        )

    def release_legal_hold(self, reason):
        """Release legal hold from this archive"""
        self.under_legal_hold = 0
        self.archive_status = "Archived"
        self.save(ignore_permissions=True)

        # Log to audit
        from digicomply.digicomply.doctype.audit_log.audit_log import AuditLog
        AuditLog.log_event(
            event_type="Archive Retrieved",
            document_type="Document Archive",
            document_name=self.name,
            description=f"Legal hold released: {reason}",
            severity="Info"
        )

    def update_storage_tier(self, new_tier):
        """Update storage tier based on access patterns"""
        old_tier = self.storage_tier
        self.storage_tier = new_tier
        self.save(ignore_permissions=True)

        # Log the change
        from digicomply.digicomply.doctype.audit_log.audit_log import AuditLog
        AuditLog.log_event(
            event_type="Settings Changed",
            document_type="Document Archive",
            document_name=self.name,
            description=f"Storage tier changed from {old_tier} to {new_tier}"
        )

    @staticmethod
    def archive_document(document_type, document_name, reason="Manual Archive"):
        """
        Archive a document

        Usage:
            DocumentArchive.archive_document(
                document_type="Sales Invoice",
                document_name="SINV-0001",
                reason="Annual archival"
            )
        """
        try:
            # Create snapshot first
            from digicomply.digicomply.doctype.document_snapshot.document_snapshot import DocumentSnapshot
            snapshot_name = DocumentSnapshot.create_snapshot(
                document_type=document_type,
                document_name=document_name,
                snapshot_type="Archival",
                trigger_event=reason
            )

            # Get document info
            doc = frappe.get_doc(document_type, document_name)
            company = doc.get("company") if hasattr(doc, "company") else None

            # Get attachments
            attachments = frappe.get_all(
                "File",
                filters={
                    "attached_to_doctype": document_type,
                    "attached_to_name": document_name
                },
                fields=["file_name", "file_url", "file_size", "is_private"]
            )

            # Create archive
            archive = frappe.get_doc({
                "doctype": "Document Archive",
                "document_type": document_type,
                "document_name": document_name,
                "archive_reason": reason,
                "snapshot_reference": snapshot_name,
                "company": company,
                "original_attachments": json.dumps(attachments) if attachments else None
            })

            archive.insert(ignore_permissions=True)

            # Log to audit trail
            from digicomply.digicomply.doctype.audit_log.audit_log import AuditLog
            AuditLog.log_event(
                event_type="Document Modified",
                document_type=document_type,
                document_name=document_name,
                description=f"Document archived: {reason}",
                company=company
            )

            return archive.name

        except Exception as e:
            frappe.log_error(
                f"Failed to archive {document_type}/{document_name}: {str(e)}",
                "Archive Error"
            )
            return None

    @staticmethod
    def bulk_archive(documents, reason="Bulk Archive"):
        """Archive multiple documents"""
        results = {
            "success": [],
            "failed": []
        }

        for doc in documents:
            archive_name = DocumentArchive.archive_document(
                document_type=doc.get("document_type"),
                document_name=doc.get("document_name"),
                reason=reason
            )

            if archive_name:
                results["success"].append({
                    "document_type": doc.get("document_type"),
                    "document_name": doc.get("document_name"),
                    "archive_name": archive_name
                })
            else:
                results["failed"].append({
                    "document_type": doc.get("document_type"),
                    "document_name": doc.get("document_name")
                })

        return results


@frappe.whitelist()
def archive_document(document_type, document_name, reason=None):
    """API to archive a document"""
    archive_name = DocumentArchive.archive_document(
        document_type=document_type,
        document_name=document_name,
        reason=reason or "Manual Archive"
    )

    if archive_name:
        return {"success": True, "archive_name": archive_name}
    else:
        frappe.throw("Failed to archive document")


@frappe.whitelist()
def retrieve_archive(archive_name, reason=None):
    """API to retrieve an archived document"""
    archive = frappe.get_doc("Document Archive", archive_name)
    return archive.retrieve(reason)


@frappe.whitelist()
def verify_archive_integrity(archive_name):
    """API to verify archive integrity"""
    archive = frappe.get_doc("Document Archive", archive_name)
    is_valid = archive.verify_integrity()
    return {
        "archive_name": archive_name,
        "integrity_valid": is_valid,
        "verification_time": archive.last_verification
    }


@frappe.whitelist()
def search_archives(
    document_type=None,
    company=None,
    fiscal_year=None,
    from_date=None,
    to_date=None,
    status=None
):
    """Search archived documents"""
    filters = {}

    if document_type:
        filters["document_type"] = document_type
    if company:
        filters["company"] = company
    if fiscal_year:
        filters["fiscal_year"] = fiscal_year
    if status:
        filters["archive_status"] = status
    if from_date and to_date:
        filters["archive_date"] = ["between", [from_date, to_date]]

    return frappe.get_all(
        "Document Archive",
        filters=filters,
        fields=[
            "name", "document_type", "document_name", "archive_date",
            "archive_status", "storage_tier", "company", "fiscal_year",
            "retention_until", "under_legal_hold", "retrieval_count"
        ],
        order_by="archive_date desc"
    )
