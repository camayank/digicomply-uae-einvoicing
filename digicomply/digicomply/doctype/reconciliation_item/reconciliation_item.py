# Copyright (c) 2024, DigiComply and contributors
# License: MIT

from frappe.model.document import Document


class ReconciliationItem(Document):
    """
    Reconciliation Item - Child table for Reconciliation Run

    Stores individual invoice match results with status:
    - Matched (green): ERP and ASP data match
    - Mismatched (yellow): Data differs between systems
    - Missing in ASP (red): Invoice in ERP but not reported to ASP
    - Missing in ERP (red): Invoice in ASP but not in ERP (potential fraud?)
    """

    def get_status_color(self):
        """Return status indicator color for dashboard"""
        colors = {
            "Matched": "green",
            "Mismatched": "yellow",
            "Missing in ASP": "red",
            "Missing in ERP": "red",
        }
        return colors.get(self.match_status, "gray")

    def get_difference_amount(self):
        """Calculate total difference if both amounts present"""
        if self.erp_grand_total and self.asp_grand_total:
            return abs(float(self.erp_grand_total) - float(self.asp_grand_total))
        return 0
