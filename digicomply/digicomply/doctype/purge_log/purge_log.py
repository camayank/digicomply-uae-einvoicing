# Copyright (c) 2026, DigiComply and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
import hashlib
import json


class PurgeLog(Document):
    """Immutable Purge Log - Cannot be modified or deleted"""

    def on_update(self):
        if self.get_doc_before_save():
            frappe.throw("Purge logs are immutable and cannot be modified")

    def on_trash(self):
        frappe.throw("Purge logs cannot be deleted - required for compliance")

    @staticmethod
    def log_purge(document_type, document_name, reason, policy=None, backup_file=None):
        """Create a purge log entry"""
        # Get original document data for hash
        try:
            doc = frappe.get_doc(document_type, document_name)
            doc_data = json.dumps(doc.as_dict(), sort_keys=True, default=str)
            data_hash = hashlib.sha256(doc_data.encode()).hexdigest()
            creation_date = doc.creation
        except Exception:
            data_hash = None
            creation_date = None

        log = frappe.get_doc({
            "doctype": "Purge Log",
            "document_type": document_type,
            "document_name": document_name,
            "purge_reason": reason,
            "purged_by": frappe.session.user,
            "retention_policy": policy,
            "backup_created": 1 if backup_file else 0,
            "backup_file": backup_file,
            "document_data_hash": data_hash,
            "original_creation_date": creation_date
        })
        log.insert(ignore_permissions=True)

        from digicomply.digicomply.doctype.audit_log.audit_log import AuditLog
        AuditLog.log_event(
            event_type="Data Purged",
            document_type=document_type,
            document_name=document_name,
            description=f"Document purged: {reason}",
            severity="Critical"
        )

        return log.name
