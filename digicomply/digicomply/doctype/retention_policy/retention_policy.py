# Copyright (c) 2026, DigiComply and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import add_years, add_months, add_days, getdate


class RetentionPolicy(Document):
    """Data Retention Policy for UAE FTA Compliance"""

    def validate(self):
        if self.retention_years < 5:
            frappe.msgprint("UAE FTA requires minimum 5 years retention", indicator="orange")

    def get_retention_date(self, base_date=None):
        """Calculate retention end date"""
        if not base_date:
            base_date = frappe.utils.today()

        date = add_years(getdate(base_date), self.retention_years)
        if self.retention_months:
            date = add_months(date, self.retention_months)
        return date

    def get_eligible_for_purge(self):
        """Get documents eligible for purge under this policy"""
        cutoff_date = add_days(
            add_years(frappe.utils.today(), -self.retention_years),
            -self.grace_period_days
        )

        filters = {self.date_field: ["<", cutoff_date]}
        if self.company:
            filters["company"] = self.company

        return frappe.get_all(
            self.document_type,
            filters=filters,
            fields=["name", self.date_field],
            limit=1000
        )


@frappe.whitelist()
def get_purge_candidates(policy_name):
    """Get documents eligible for purge"""
    policy = frappe.get_doc("Retention Policy", policy_name)
    return policy.get_eligible_for_purge()
