# Copyright (c) 2026, DigiComply and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import getdate, add_days, flt


class ScoreHistory(Document):
    """Historical Compliance Score Records"""

    def before_insert(self):
        """Calculate grade and change from previous"""
        self.calculate_grade()
        self.calculate_change()

    def calculate_grade(self):
        """Calculate letter grade based on score"""
        score = flt(self.total_score)
        if score >= 95:
            self.score_grade = "A+"
        elif score >= 90:
            self.score_grade = "A"
        elif score >= 85:
            self.score_grade = "B+"
        elif score >= 80:
            self.score_grade = "B"
        elif score >= 75:
            self.score_grade = "C+"
        elif score >= 70:
            self.score_grade = "C"
        elif score >= 60:
            self.score_grade = "D"
        else:
            self.score_grade = "F"

    def calculate_change(self):
        """Calculate change from previous score"""
        previous = frappe.db.get_value(
            "Score History",
            {"company": self.company, "name": ["!=", self.name or ""]},
            ["total_score"],
            order_by="score_date desc"
        )

        if previous:
            self.previous_score = previous
            self.score_change = flt(self.total_score) - flt(previous)

            if self.score_change > 0:
                self.change_direction = "Improved"
            elif self.score_change < 0:
                self.change_direction = "Declined"
            else:
                self.change_direction = "Unchanged"

    @staticmethod
    def calculate_and_store(company):
        """Calculate current compliance score and store in history"""
        score_data = ScoreHistory.calculate_score(company)

        history = frappe.get_doc({
            "doctype": "Score History",
            "company": company,
            "score_date": frappe.utils.today(),
            **score_data
        })
        history.insert(ignore_permissions=True)

        return history

    @staticmethod
    def calculate_score(company):
        """Calculate compliance score for a company"""
        # TRN Validity (20 points)
        total_customers = frappe.db.count("Customer", {"company": company}) or 1
        valid_trn_customers = frappe.db.count("Customer", {"company": company, "tax_id": ["is", "set"]})
        trn_percentage = (valid_trn_customers / total_customers) * 100
        trn_score = (trn_percentage / 100) * 20

        # Reconciliation (25 points)
        total_recons = frappe.db.count("Reconciliation Run", {"company": company}) or 1
        matched_recons = frappe.db.count("Reconciliation Run", {"company": company, "match_percentage": [">=", 95]})
        recon_rate = (matched_recons / total_recons) * 100
        recon_score = (recon_rate / 100) * 25

        # VAT Accuracy (25 points) - simplified
        vat_errors = frappe.db.count("Mismatch Report", {"company": company, "status": "Open"})
        vat_score = max(0, 25 - (vat_errors * 0.5))

        # Filing Compliance (20 points) - simplified
        filing_score = 20  # Default full score

        # Data Quality (10 points)
        data_score = 10  # Default full score

        total_score = trn_score + recon_score + vat_score + filing_score + data_score

        return {
            "total_score": round(total_score, 1),
            "trn_validity_score": round(trn_score, 1),
            "reconciliation_score": round(recon_score, 1),
            "vat_accuracy_score": round(vat_score, 1),
            "filing_compliance_score": round(filing_score, 1),
            "data_quality_score": round(data_score, 1),
            "valid_trn_percentage": round(trn_percentage, 1),
            "reconciliation_match_rate": round(recon_rate, 1),
            "vat_error_count": vat_errors,
            "on_time_filing_rate": 100,
            "data_completeness": 100
        }


@frappe.whitelist()
def get_score_trend(company, days=90):
    """Get score trend for a company"""
    from_date = add_days(getdate(), -days)

    return frappe.get_all(
        "Score History",
        filters={"company": company, "score_date": [">=", from_date]},
        fields=["score_date", "total_score", "score_grade",
                "trn_validity_score", "reconciliation_score",
                "vat_accuracy_score", "filing_compliance_score", "data_quality_score"],
        order_by="score_date asc"
    )


@frappe.whitelist()
def calculate_current_score(company):
    """API to calculate and get current score"""
    return ScoreHistory.calculate_score(company)


@frappe.whitelist()
def refresh_score(company):
    """API to calculate and store new score"""
    history = ScoreHistory.calculate_and_store(company)
    return {"success": True, "name": history.name, "score": history.total_score}
