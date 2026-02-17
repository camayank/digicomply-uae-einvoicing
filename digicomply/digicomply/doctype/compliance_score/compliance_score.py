# Copyright (c) 2024, DigiComply and contributors
# License: MIT

import frappe
from frappe import _
from frappe.model.document import Document


class ComplianceScore(Document):
    """
    Compliance Score - Stores calculated DigiComply Score for a company.

    Score Components (100 points total):
    - TRN Health: 30 points
    - Reconciliation Health: 30 points
    - Filing Compliance: 25 points
    - Data Integrity: 15 points
    """

    def validate(self):
        """Validate score values"""
        self.validate_score_ranges()
        self.calculate_total()
        self.set_risk_level()

    def validate_score_ranges(self):
        """Ensure component scores are within valid ranges"""
        if self.trn_health_score < 0 or self.trn_health_score > 30:
            frappe.throw(_("TRN Health Score must be between 0 and 30"))
        if self.reconciliation_score < 0 or self.reconciliation_score > 30:
            frappe.throw(_("Reconciliation Score must be between 0 and 30"))
        if self.filing_compliance_score < 0 or self.filing_compliance_score > 25:
            frappe.throw(_("Filing Compliance Score must be between 0 and 25"))
        if self.data_integrity_score < 0 or self.data_integrity_score > 15:
            frappe.throw(_("Data Integrity Score must be between 0 and 15"))

    def calculate_total(self):
        """Calculate total score from components"""
        self.total_score = (
            (self.trn_health_score or 0) +
            (self.reconciliation_score or 0) +
            (self.filing_compliance_score or 0) +
            (self.data_integrity_score or 0)
        )

    def set_risk_level(self):
        """Set risk level based on total score"""
        if self.total_score < 40:
            self.risk_level = "Critical Risk"
        elif self.total_score < 60:
            self.risk_level = "At Risk"
        elif self.total_score < 80:
            self.risk_level = "Improving"
        elif self.total_score < 90:
            self.risk_level = "Compliant"
        else:
            self.risk_level = "Fully Compliant"


def get_latest_score(company):
    """Get the most recent compliance score for a company"""
    return frappe.db.get_value(
        "Compliance Score",
        {"company": company},
        ["total_score", "risk_level", "penalty_exposure", "score_date"],
        order_by="score_date desc",
        as_dict=True
    )


def get_score_trend(company, days=30):
    """Get score trend for the last N days"""
    return frappe.get_all(
        "Compliance Score",
        filters={"company": company},
        fields=["score_date", "total_score", "risk_level"],
        order_by="score_date desc",
        limit=days
    )
