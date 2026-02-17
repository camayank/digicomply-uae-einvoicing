# Copyright (c) 2026, DigiComply and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class AuditResponse(Document):
    """Response to Audit Requests"""

    def after_insert(self):
        """Update request response count"""
        if self.audit_request:
            count = frappe.db.count("Audit Response", {"audit_request": self.audit_request})
            frappe.db.set_value("Audit Request", self.audit_request, "response_count", count)

    @frappe.whitelist()
    def approve(self):
        """Approve the response"""
        self.approved_by = frappe.session.user
        self.approval_date = frappe.utils.now_datetime()
        self.save()
