# Copyright (c) 2026, DigiComply and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class EInvoiceSettings(Document):
    def validate(self):
        if self.retention_years and self.retention_years < 5:
            frappe.throw("Retention period must be at least 5 years per UAE FTA requirements")


def get_e_invoice_settings():
    """Get E-Invoice Settings singleton"""
    return frappe.get_single("E-Invoice Settings")


def is_e_invoicing_enabled():
    """Check if e-invoicing is enabled"""
    settings = get_e_invoice_settings()
    return settings.enable_e_invoicing
