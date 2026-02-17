# Copyright (c) 2026, DigiComply and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
import hashlib
import json
from datetime import datetime


class AuditLog(Document):
    """
    Immutable Audit Log for UAE FTA Compliance

    Features:
    - Cannot be modified or deleted after creation
    - Hash chain integrity for tamper detection
    - Automatic user/session tracking
    - Before/after document snapshots
    """

    def before_insert(self):
        """Set up audit log entry before saving"""
        self.set_user_info()
        self.set_event_timestamp()
        self.set_event_category()
        self.generate_record_hash()
        self.link_previous_hash()

    def set_user_info(self):
        """Capture user information at time of event"""
        if not self.user:
            self.user = frappe.session.user

        if self.user and not self.user_full_name:
            self.user_full_name = frappe.db.get_value("User", self.user, "full_name")

        # Capture IP and session info
        if not self.ip_address:
            self.ip_address = frappe.local.request_ip if hasattr(frappe.local, 'request_ip') else None

        if not self.session_id:
            self.session_id = frappe.session.sid if hasattr(frappe.session, 'sid') else None

        if not self.user_agent and hasattr(frappe.local, 'request'):
            self.user_agent = frappe.local.request.headers.get('User-Agent', '')[:500]

    def set_event_timestamp(self):
        """Ensure event timestamp is set"""
        if not self.event_timestamp:
            self.event_timestamp = frappe.utils.now_datetime()

    def set_event_category(self):
        """Auto-set category based on event type"""
        if self.event_category:
            return

        category_map = {
            "Document Created": "Document",
            "Document Modified": "Document",
            "Document Deleted": "Document",
            "Document Submitted": "Document",
            "Document Cancelled": "Document",
            "Document Amended": "Document",
            "Bulk Import Executed": "Data",
            "Reconciliation Run": "Compliance",
            "ASP Sync Performed": "Integration",
            "Report Generated": "Compliance",
            "Report Exported": "Data",
            "User Login": "User",
            "User Logout": "User",
            "Permission Changed": "Security",
            "Settings Changed": "System",
            "Data Exported": "Data",
            "Data Purged": "Data",
            "Archive Retrieved": "Compliance",
            "Auditor Access Granted": "Security",
            "Auditor Access Revoked": "Security"
        }

        self.event_category = category_map.get(self.event_type, "System")

    def generate_record_hash(self):
        """Generate SHA-256 hash of record for integrity verification"""
        hash_data = {
            "event_type": self.event_type,
            "event_timestamp": str(self.event_timestamp),
            "document_type": self.document_type,
            "document_name": self.document_name,
            "user": self.user,
            "ip_address": self.ip_address,
            "description": self.description,
            "changes_summary": self.changes_summary,
            "affected_records_count": self.affected_records_count
        }

        hash_string = json.dumps(hash_data, sort_keys=True, default=str)
        self.record_hash = hashlib.sha256(hash_string.encode()).hexdigest()

    def link_previous_hash(self):
        """Link to previous audit log hash for chain integrity"""
        previous_log = frappe.db.get_value(
            "Audit Log",
            filters={},
            fieldname=["name", "record_hash"],
            order_by="creation desc",
            as_dict=True
        )

        if previous_log:
            self.previous_hash = previous_log.record_hash

    def on_update(self):
        """Prevent modifications to audit logs"""
        if self.get_doc_before_save():
            frappe.throw(
                "Audit Log records are immutable and cannot be modified. "
                "This is required for FTA compliance.",
                title="Immutable Record"
            )

    def on_trash(self):
        """Prevent deletion of audit logs"""
        frappe.throw(
            "Audit Log records cannot be deleted. "
            "This is required for UAE FTA compliance (5-year retention).",
            title="Cannot Delete Audit Log"
        )

    @staticmethod
    def log_event(
        event_type,
        document_type=None,
        document_name=None,
        description=None,
        changes_summary=None,
        affected_records_count=None,
        company=None,
        trn=None,
        severity="Info",
        request_data=None,
        response_data=None,
        snapshot_before=None,
        snapshot_after=None,
        operation_duration=None
    ):
        """
        Static method to create audit log entries

        Usage:
            AuditLog.log_event(
                event_type="Document Created",
                document_type="Sales Invoice",
                document_name="SINV-0001",
                description="Created new sales invoice"
            )
        """
        try:
            audit_log = frappe.get_doc({
                "doctype": "Audit Log",
                "event_type": event_type,
                "document_type": document_type,
                "document_name": document_name,
                "description": description,
                "changes_summary": changes_summary,
                "affected_records_count": affected_records_count,
                "company": company,
                "trn": trn,
                "severity": severity,
                "request_data": json.dumps(request_data) if request_data else None,
                "response_data": json.dumps(response_data) if response_data else None,
                "snapshot_reference": snapshot_before,
                "after_snapshot_reference": snapshot_after,
                "operation_duration": operation_duration
            })

            audit_log.insert(ignore_permissions=True)
            return audit_log.name

        except Exception as e:
            # Log to error log but don't fail the main operation
            frappe.log_error(
                f"Failed to create audit log: {str(e)}",
                "Audit Log Error"
            )
            return None

    @staticmethod
    def verify_chain_integrity(from_date=None, to_date=None):
        """
        Verify the integrity of the audit log chain

        Returns dict with verification results
        """
        filters = {}
        if from_date:
            filters["event_timestamp"] = [">=", from_date]
        if to_date:
            if "event_timestamp" in filters:
                filters["event_timestamp"] = ["between", [from_date, to_date]]
            else:
                filters["event_timestamp"] = ["<=", to_date]

        logs = frappe.get_all(
            "Audit Log",
            filters=filters,
            fields=["name", "record_hash", "previous_hash", "event_timestamp"],
            order_by="creation asc"
        )

        results = {
            "total_records": len(logs),
            "verified": 0,
            "broken_chain": [],
            "verification_timestamp": frappe.utils.now_datetime()
        }

        previous_hash = None
        for log in logs:
            if previous_hash and log.previous_hash != previous_hash:
                results["broken_chain"].append({
                    "name": log.name,
                    "expected_hash": previous_hash,
                    "actual_hash": log.previous_hash,
                    "timestamp": log.event_timestamp
                })
            else:
                results["verified"] += 1

            previous_hash = log.record_hash

        results["integrity_valid"] = len(results["broken_chain"]) == 0

        return results


@frappe.whitelist()
def verify_audit_chain(from_date=None, to_date=None):
    """API endpoint to verify audit log chain integrity"""
    return AuditLog.verify_chain_integrity(from_date, to_date)


@frappe.whitelist()
def get_audit_trail(document_type, document_name):
    """Get complete audit trail for a specific document"""
    return frappe.get_all(
        "Audit Log",
        filters={
            "document_type": document_type,
            "document_name": document_name
        },
        fields=[
            "name", "event_type", "event_timestamp", "user", "user_full_name",
            "description", "changes_summary", "severity", "ip_address",
            "snapshot_reference", "after_snapshot_reference"
        ],
        order_by="event_timestamp desc"
    )


@frappe.whitelist()
def export_audit_trail(from_date, to_date, document_type=None, event_type=None):
    """Export audit trail for a date range (for external auditors)"""
    filters = {
        "event_timestamp": ["between", [from_date, to_date]]
    }

    if document_type:
        filters["document_type"] = document_type
    if event_type:
        filters["event_type"] = event_type

    logs = frappe.get_all(
        "Audit Log",
        filters=filters,
        fields=[
            "name", "event_type", "event_category", "severity",
            "event_timestamp", "document_type", "document_name",
            "user", "user_full_name", "ip_address",
            "company", "trn", "description", "changes_summary",
            "affected_records_count", "record_hash"
        ],
        order_by="event_timestamp asc"
    )

    # Log the export action
    AuditLog.log_event(
        event_type="Data Exported",
        description=f"Audit trail exported: {from_date} to {to_date}",
        affected_records_count=len(logs)
    )

    return logs
