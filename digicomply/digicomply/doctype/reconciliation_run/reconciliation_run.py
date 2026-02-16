# Copyright (c) 2024, DigiComply and contributors
# License: MIT

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import flt, cint, getdate, now_datetime


class ReconciliationRun(Document):
    """
    Reconciliation Run - Core MVP DocType

    Matches ERP invoices against ASP (Accredited Service Provider) data
    to identify compliance gaps before FTA deadlines.
    """

    def validate(self):
        self.validate_dates()
        self.validate_company()

    def validate_dates(self):
        """Ensure from_date <= to_date"""
        if self.from_date and self.to_date:
            if getdate(self.from_date) > getdate(self.to_date):
                frappe.throw(_("From Date cannot be after To Date"))

    def validate_company(self):
        """Ensure company has TRN configured"""
        if self.company:
            company_doc = frappe.get_doc("Company", self.company)
            if not company_doc.tax_id:
                frappe.msgprint(
                    _("Warning: Company {0} does not have a Tax ID (TRN) configured").format(self.company),
                    alert=True
                )

    def on_submit(self):
        """Run reconciliation when submitted"""
        self.run_reconciliation()

    @frappe.whitelist()
    def run_reconciliation(self):
        """
        Main reconciliation logic - MVP Version

        1. Fetch ERP invoices for date range
        2. Fetch ASP data (from CSV or API)
        3. Match by invoice number
        4. Identify mismatches and missing
        5. Update summary counts
        """
        self.db_set("status", "In Progress")
        frappe.db.commit()

        try:
            # Step 1: Get ERP invoices
            erp_invoices = self.get_erp_invoices()

            # Step 2: Get ASP data
            asp_invoices = self.get_asp_invoices()

            # Step 3: Perform matching
            results = self.match_invoices(erp_invoices, asp_invoices)

            # Step 4: Create reconciliation items
            self.create_reconciliation_items(results)

            # Step 5: Update summary
            self.update_summary(results)

            self.db_set("status", "Completed")
            frappe.db.commit()

            return {"status": "success", "results": results}

        except Exception as e:
            self.db_set("status", "Failed")
            frappe.db.commit()
            frappe.log_error(title="Reconciliation Failed", message=str(e))
            frappe.throw(_("Reconciliation failed: {0}").format(str(e)))

    def get_erp_invoices(self):
        """Fetch Sales Invoices from ERPNext"""
        filters = {
            "company": self.company,
            "posting_date": ["between", [self.from_date, self.to_date]],
            "docstatus": 1,  # Submitted only
        }

        invoices = frappe.get_all(
            "Sales Invoice",
            filters=filters,
            fields=[
                "name",
                "posting_date",
                "customer",
                "customer_name",
                "grand_total",
                "total_taxes_and_charges",
                "tax_id",  # Customer TRN
            ]
        )

        # Create lookup dict by invoice number
        return {inv.name: inv for inv in invoices}

    def get_asp_invoices(self):
        """
        Fetch ASP data - MVP version uses CSV Import
        Future: Direct API integration with ClearTax, Cygnet, etc.
        """
        if not self.csv_import:
            return {}

        csv_doc = frappe.get_doc("CSV Import", self.csv_import)
        return csv_doc.get_invoice_data()

    def match_invoices(self, erp_invoices: dict, asp_invoices: dict) -> dict:
        """
        Match ERP invoices against ASP data

        Returns dict with:
        - matched: List of matching invoice pairs
        - mismatched: List of invoices with differences
        - missing_in_asp: ERP invoices not in ASP
        - missing_in_erp: ASP invoices not in ERP
        """
        results = {
            "matched": [],
            "mismatched": [],
            "missing_in_asp": [],
            "missing_in_erp": [],
        }

        # Track which ASP invoices we've seen
        asp_seen = set()

        for inv_no, erp_inv in erp_invoices.items():
            if inv_no in asp_invoices:
                asp_inv = asp_invoices[inv_no]
                asp_seen.add(inv_no)

                # Compare key fields
                differences = self.compare_invoices(erp_inv, asp_inv)

                if differences:
                    results["mismatched"].append({
                        "invoice_no": inv_no,
                        "erp_data": erp_inv,
                        "asp_data": asp_inv,
                        "differences": differences,
                    })
                else:
                    results["matched"].append({
                        "invoice_no": inv_no,
                        "erp_data": erp_inv,
                        "asp_data": asp_inv,
                    })
            else:
                results["missing_in_asp"].append({
                    "invoice_no": inv_no,
                    "erp_data": erp_inv,
                })

        # Find ASP invoices not in ERP
        for inv_no, asp_inv in asp_invoices.items():
            if inv_no not in asp_seen:
                results["missing_in_erp"].append({
                    "invoice_no": inv_no,
                    "asp_data": asp_inv,
                })

        return results

    def compare_invoices(self, erp_inv: dict, asp_inv: dict) -> list:
        """
        Compare ERP invoice with ASP data
        Returns list of differences
        """
        differences = []

        # Compare grand total (with tolerance for rounding)
        erp_total = flt(erp_inv.get("grand_total"), 2)
        asp_total = flt(asp_inv.get("grand_total") or asp_inv.get("total"), 2)

        if abs(erp_total - asp_total) > 0.01:
            differences.append({
                "field": "Grand Total",
                "erp_value": erp_total,
                "asp_value": asp_total,
                "difference": erp_total - asp_total,
            })

        # Compare VAT amount
        erp_vat = flt(erp_inv.get("total_taxes_and_charges"), 2)
        asp_vat = flt(asp_inv.get("vat_amount") or asp_inv.get("tax_amount"), 2)

        if abs(erp_vat - asp_vat) > 0.01:
            differences.append({
                "field": "VAT Amount",
                "erp_value": erp_vat,
                "asp_value": asp_vat,
                "difference": erp_vat - asp_vat,
            })

        # Compare posting date
        erp_date = str(erp_inv.get("posting_date"))
        asp_date = str(asp_inv.get("posting_date") or asp_inv.get("invoice_date") or "")

        if erp_date and asp_date and erp_date != asp_date:
            differences.append({
                "field": "Invoice Date",
                "erp_value": erp_date,
                "asp_value": asp_date,
            })

        return differences

    def create_reconciliation_items(self, results: dict):
        """Create Reconciliation Item child records"""
        # Clear existing items
        self.items = []

        # Add matched items (green)
        for item in results["matched"]:
            self.append("items", {
                "invoice_no": item["invoice_no"],
                "match_status": "Matched",
                "erp_grand_total": item["erp_data"].get("grand_total"),
                "asp_grand_total": item["asp_data"].get("grand_total") or item["asp_data"].get("total"),
                "customer": item["erp_data"].get("customer_name"),
                "posting_date": item["erp_data"].get("posting_date"),
            })

        # Add mismatched items (yellow)
        for item in results["mismatched"]:
            differences_html = self.format_differences_html(item["differences"])
            self.append("items", {
                "invoice_no": item["invoice_no"],
                "match_status": "Mismatched",
                "erp_grand_total": item["erp_data"].get("grand_total"),
                "asp_grand_total": item["asp_data"].get("grand_total") or item["asp_data"].get("total"),
                "customer": item["erp_data"].get("customer_name"),
                "posting_date": item["erp_data"].get("posting_date"),
                "differences": frappe.as_json(item["differences"]),
                "differences_html": differences_html,
            })

        # Add missing in ASP (red)
        for item in results["missing_in_asp"]:
            self.append("items", {
                "invoice_no": item["invoice_no"],
                "match_status": "Missing in ASP",
                "erp_grand_total": item["erp_data"].get("grand_total"),
                "customer": item["erp_data"].get("customer_name"),
                "posting_date": item["erp_data"].get("posting_date"),
            })

        # Add missing in ERP (red)
        for item in results["missing_in_erp"]:
            self.append("items", {
                "invoice_no": item["invoice_no"],
                "match_status": "Missing in ERP",
                "asp_grand_total": item["asp_data"].get("grand_total") or item["asp_data"].get("total"),
            })

        self.save()

    def format_differences_html(self, differences: list) -> str:
        """Format differences as readable HTML"""
        if not differences:
            return ""

        html_parts = ['<div style="display: flex; flex-wrap: wrap; gap: 8px;">']

        for diff in differences:
            field = diff.get("field", "Unknown")
            erp_val = diff.get("erp_value", "-")
            asp_val = diff.get("asp_value", "-")

            # Format currency values
            if isinstance(erp_val, (int, float)):
                erp_val = f"{erp_val:,.2f}"
            if isinstance(asp_val, (int, float)):
                asp_val = f"{asp_val:,.2f}"

            html_parts.append(f'''
                <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 4px; padding: 6px 10px; font-size: 12px;">
                    <span style="font-weight: 600; color: #92400e;">{field}:</span>
                    <span style="color: #78350f;">ERP {erp_val} vs ASP {asp_val}</span>
                </div>
            ''')

        html_parts.append('</div>')
        return "".join(html_parts)

    def update_summary(self, results: dict):
        """Update summary counts"""
        total = (
            len(results["matched"]) +
            len(results["mismatched"]) +
            len(results["missing_in_asp"]) +
            len(results["missing_in_erp"])
        )

        self.db_set("total_invoices", total)
        self.db_set("matched_count", len(results["matched"]))
        self.db_set("mismatched_count", len(results["mismatched"]))
        self.db_set("missing_in_asp", len(results["missing_in_asp"]))
        self.db_set("missing_in_erp", len(results["missing_in_erp"]))

        if total > 0:
            match_pct = (len(results["matched"]) / total) * 100
            self.db_set("match_percentage", flt(match_pct, 2))

    @frappe.whitelist()
    def generate_report(self):
        """Generate PDF Mismatch Report"""
        from digicomply.digicomply.doctype.mismatch_report.mismatch_report import create_report
        return create_report(self.name)


def has_permission(doc, ptype, user):
    """Custom permission check"""
    if ptype == "read":
        # Users can read reconciliations for their company
        user_companies = frappe.get_all(
            "User Permission",
            filters={"user": user, "allow": "Company"},
            pluck="for_value"
        )
        if user_companies and doc.company in user_companies:
            return True
    return None


@frappe.whitelist()
def run_reconciliation(docname):
    """API endpoint to run reconciliation"""
    doc = frappe.get_doc("Reconciliation Run", docname)
    return doc.run_reconciliation()


def on_submit_handler(doc, method):
    """Hook handler for on_submit event"""
    doc.run_reconciliation()
