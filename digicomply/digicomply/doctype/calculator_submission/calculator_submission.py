# Copyright (c) 2024, DigiComply and contributors
# License: MIT

import frappe
from frappe import _
from frappe.model.document import Document


class CalculatorSubmission(Document):
    """
    Calculator Submission - Stores penalty calculator submissions for lead generation.

    Captures visitor inputs and calculated results for follow-up.
    """

    def validate(self):
        """Validate email format if provided"""
        if self.email:
            from frappe.utils import validate_email_address
            if not validate_email_address(self.email):
                frappe.throw(_("Please enter a valid email address"))

    def mark_converted(self):
        """Mark this submission as converted to trial"""
        from frappe.utils import today
        self.converted_to_trial = 1
        self.conversion_date = today()
        self.save(ignore_permissions=True)


def get_conversion_stats():
    """Get calculator conversion statistics"""
    total = frappe.db.count("Calculator Submission")
    converted = frappe.db.count("Calculator Submission", {"converted_to_trial": 1})

    return {
        "total_submissions": total,
        "conversions": converted,
        "conversion_rate": (converted / total * 100) if total > 0 else 0
    }


def get_submissions_by_risk(risk_level=None):
    """Get submissions filtered by risk level"""
    filters = {}
    if risk_level:
        filters["risk_level"] = risk_level

    return frappe.get_all(
        "Calculator Submission",
        filters=filters,
        fields=["name", "company_name", "email", "penalty_exposure", "risk_level", "creation"],
        order_by="creation desc"
    )
