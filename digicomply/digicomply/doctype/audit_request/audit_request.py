# Copyright (c) 2026, DigiComply and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import now_datetime


class AuditRequest(Document):
    """Audit Request from External Auditors"""

    def after_insert(self):
        """Update auditor access request count"""
        if self.auditor_access:
            frappe.db.set_value(
                "Auditor Access",
                self.auditor_access,
                "requests_count",
                frappe.db.count("Audit Request", {"auditor_access": self.auditor_access})
            )

    @frappe.whitelist()
    def mark_completed(self):
        """Mark request as completed"""
        self.status = "Completed"
        self.completed_date = now_datetime()
        self.save()

        from digicomply.digicomply.doctype.audit_log.audit_log import AuditLog
        AuditLog.log_event(
            event_type="Document Modified",
            document_type="Audit Request",
            document_name=self.name,
            description="Audit request completed"
        )


@frappe.whitelist()
def get_auditor_requests(auditor_access):
    """Get all requests for an auditor"""
    return frappe.get_all(
        "Audit Request",
        filters={"auditor_access": auditor_access},
        fields=["name", "request_subject", "status", "priority", "request_date", "due_date"],
        order_by="creation desc"
    )
