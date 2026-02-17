# Copyright (c) 2026, DigiComply and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import now_datetime


class LegalHold(Document):
    """Legal Hold to Prevent Document Deletion"""

    @frappe.whitelist()
    def release_hold(self, reason):
        """Release the legal hold"""
        self.status = "Released"
        self.released_by = frappe.session.user
        self.release_date = now_datetime()
        self.release_reason = reason
        self.save()

        # Release archives under this hold
        frappe.db.set_value(
            "Document Archive",
            {"legal_hold_reference": self.name},
            {
                "under_legal_hold": 0,
                "archive_status": "Archived"
            }
        )

        from digicomply.digicomply.doctype.audit_log.audit_log import AuditLog
        AuditLog.log_event(
            event_type="Settings Changed",
            document_type="Legal Hold",
            document_name=self.name,
            description=f"Legal hold released: {reason}",
            severity="Warning"
        )

    def is_document_under_hold(self, doctype, docname):
        """Check if a specific document is under this hold"""
        if self.status != "Active":
            return False

        if self.document_types:
            allowed = [d.strip() for d in self.document_types.split(",")]
            if doctype not in allowed:
                return False

        if self.specific_documents:
            docs = [d.strip() for d in self.specific_documents.split("\n")]
            if docname not in docs:
                return False

        return True


@frappe.whitelist()
def check_hold_status(doctype, docname):
    """Check if document is under any legal hold"""
    holds = frappe.get_all(
        "Legal Hold",
        filters={"status": "Active"},
        fields=["name", "hold_name", "hold_type", "hold_reason"]
    )

    for hold in holds:
        doc = frappe.get_doc("Legal Hold", hold.name)
        if doc.is_document_under_hold(doctype, docname):
            return {"under_hold": True, "hold": hold}

    return {"under_hold": False}
