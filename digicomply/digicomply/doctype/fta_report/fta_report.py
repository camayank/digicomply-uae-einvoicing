# Copyright (c) 2026, DigiComply and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import now_datetime, getdate, flt
import json


class FTAReport(Document):
    """
    FTA Report Generation for UAE VAT Compliance

    Supports:
    - VAT 201 Return
    - VAT 301 Voluntary Disclosure
    - VAT Audit File (FAF)
    - Various compliance reports
    """

    def before_save(self):
        """Validate and calculate before saving"""
        self.validate_dates()
        self.set_trn_from_company()
        if self.report_type == "VAT 201":
            self.calculate_vat_totals()

    def validate_dates(self):
        """Validate date range"""
        if getdate(self.from_date) > getdate(self.to_date):
            frappe.throw("From Date cannot be after To Date")

    def set_trn_from_company(self):
        """Set TRN from company if not provided"""
        if not self.trn and self.company:
            self.trn = frappe.db.get_value("Company", self.company, "tax_id")

    def calculate_vat_totals(self):
        """Calculate VAT 201 totals"""
        # Output VAT
        self.total_output_vat = flt(
            flt(self.box1a_vat) +
            flt(self.box1b_vat)
        )

        # Input VAT
        self.total_input_vat = flt(
            flt(self.box6_recoverable_vat) +
            flt(self.box7_vat) +
            flt(self.box8_adjustments)
        )

        # Net payable
        self.net_vat_payable = flt(self.total_output_vat - self.total_input_vat)

    @frappe.whitelist()
    def generate_report(self):
        """Generate the report based on type"""
        self.generation_date = now_datetime()
        self.generated_by = frappe.session.user
        self.status = "Generated"

        if self.report_type == "VAT 201":
            self._generate_vat_201()
        elif self.report_type == "VAT 301":
            self._generate_vat_301()
        elif self.report_type == "VAT Audit File (FAF)":
            self._generate_faf()
        elif self.report_type == "Transaction Listing":
            self._generate_transaction_listing()
        elif self.report_type == "Exempt Supply Report":
            self._generate_exempt_supply_report()
        elif self.report_type == "TRN Health Report":
            self._generate_trn_health_report()
        else:
            self._generate_generic_report()

        self.save()

        # Log to audit trail
        from digicomply.digicomply.doctype.audit_log.audit_log import AuditLog
        AuditLog.log_event(
            event_type="Report Generated",
            document_type="FTA Report",
            document_name=self.name,
            description=f"Generated {self.report_type} for {self.tax_period}",
            company=self.company
        )

        return self

    def _generate_vat_201(self):
        """Generate VAT 201 Return data"""
        # Get sales invoices for the period
        sales_data = self._get_sales_data()
        purchase_data = self._get_purchase_data()

        # Box 1a: Standard Rated Supplies
        self.box1a_standard_rated = sales_data.get("standard_rated_amount", 0)
        self.box1a_vat = sales_data.get("standard_rated_vat", 0)

        # Box 2: Zero Rated Supplies
        self.box2_zero_rated = sales_data.get("zero_rated_amount", 0)

        # Box 3: Exempt Supplies
        self.box3_exempt_supplies = sales_data.get("exempt_amount", 0)

        # Box 6: Standard Rated Expenses
        self.box6_standard_rated_expenses = purchase_data.get("standard_rated_amount", 0)
        self.box6_recoverable_vat = purchase_data.get("recoverable_vat", 0)

        # Box 7: Imports
        self.box7_imports = purchase_data.get("imports_amount", 0)
        self.box7_vat = purchase_data.get("imports_vat", 0)

        # Totals
        self.total_transactions = (
            sales_data.get("transaction_count", 0) +
            purchase_data.get("transaction_count", 0)
        )
        self.total_amount = flt(
            self.box1a_standard_rated + self.box2_zero_rated +
            self.box3_exempt_supplies + self.box6_standard_rated_expenses
        )

        self.calculate_vat_totals()

        # Calculate data quality
        self._calculate_data_quality()

    def _get_sales_data(self):
        """Get sales invoice data for the period"""
        data = {
            "standard_rated_amount": 0,
            "standard_rated_vat": 0,
            "zero_rated_amount": 0,
            "exempt_amount": 0,
            "transaction_count": 0
        }

        # Query Sales Invoices
        invoices = frappe.db.sql("""
            SELECT
                si.name,
                si.grand_total,
                si.total_taxes_and_charges,
                si.net_total
            FROM `tabSales Invoice` si
            WHERE si.company = %(company)s
            AND si.posting_date BETWEEN %(from_date)s AND %(to_date)s
            AND si.docstatus = 1
        """, {
            "company": self.company,
            "from_date": self.from_date,
            "to_date": self.to_date
        }, as_dict=True)

        for inv in invoices:
            data["transaction_count"] += 1
            # Simplified: treat all as standard rated
            # In production, would check tax categories
            data["standard_rated_amount"] += flt(inv.net_total)
            data["standard_rated_vat"] += flt(inv.total_taxes_and_charges)

        return data

    def _get_purchase_data(self):
        """Get purchase invoice data for the period"""
        data = {
            "standard_rated_amount": 0,
            "recoverable_vat": 0,
            "imports_amount": 0,
            "imports_vat": 0,
            "transaction_count": 0
        }

        # Query Purchase Invoices
        invoices = frappe.db.sql("""
            SELECT
                pi.name,
                pi.grand_total,
                pi.total_taxes_and_charges,
                pi.net_total
            FROM `tabPurchase Invoice` pi
            WHERE pi.company = %(company)s
            AND pi.posting_date BETWEEN %(from_date)s AND %(to_date)s
            AND pi.docstatus = 1
        """, {
            "company": self.company,
            "from_date": self.from_date,
            "to_date": self.to_date
        }, as_dict=True)

        for inv in invoices:
            data["transaction_count"] += 1
            data["standard_rated_amount"] += flt(inv.net_total)
            data["recoverable_vat"] += flt(inv.total_taxes_and_charges)

        return data

    def _generate_vat_301(self):
        """Generate VAT 301 Voluntary Disclosure"""
        # Similar structure to VAT 201 but for corrections
        self._generate_vat_201()
        self.report_title = f"VAT 301 - Voluntary Disclosure - {self.tax_period}"

    def _generate_faf(self):
        """Generate FTA Audit File (FAF) in XML format"""
        faf_data = {
            "header": {
                "trn": self.trn,
                "company_name": self.company,
                "from_date": str(self.from_date),
                "to_date": str(self.to_date),
                "generation_date": str(now_datetime())
            },
            "sales": [],
            "purchases": [],
            "general_ledger": []
        }

        # Get Sales data
        sales = frappe.db.sql("""
            SELECT
                si.name, si.posting_date, si.customer, si.customer_name,
                si.grand_total, si.net_total, si.total_taxes_and_charges
            FROM `tabSales Invoice` si
            WHERE si.company = %(company)s
            AND si.posting_date BETWEEN %(from_date)s AND %(to_date)s
            AND si.docstatus = 1
        """, {
            "company": self.company,
            "from_date": self.from_date,
            "to_date": self.to_date
        }, as_dict=True)

        faf_data["sales"] = sales

        # Get Purchase data
        purchases = frappe.db.sql("""
            SELECT
                pi.name, pi.posting_date, pi.supplier, pi.supplier_name,
                pi.grand_total, pi.net_total, pi.total_taxes_and_charges
            FROM `tabPurchase Invoice` pi
            WHERE pi.company = %(company)s
            AND pi.posting_date BETWEEN %(from_date)s AND %(to_date)s
            AND pi.docstatus = 1
        """, {
            "company": self.company,
            "from_date": self.from_date,
            "to_date": self.to_date
        }, as_dict=True)

        faf_data["purchases"] = purchases

        # Save as JSON (XML generation would require a template)
        self.total_transactions = len(sales) + len(purchases)

        # Store the JSON data
        json_content = json.dumps(faf_data, indent=2, default=str)
        file_doc = frappe.get_doc({
            "doctype": "File",
            "file_name": f"FAF_{self.company}_{self.from_date}_{self.to_date}.json",
            "attached_to_doctype": "FTA Report",
            "attached_to_name": self.name,
            "content": json_content,
            "is_private": 1
        })
        file_doc.save(ignore_permissions=True)
        self.report_json = file_doc.file_url

    def _generate_transaction_listing(self):
        """Generate transaction listing report"""
        transactions = []

        # Get all transactions
        sales = frappe.get_all(
            "Sales Invoice",
            filters={
                "company": self.company,
                "posting_date": ["between", [self.from_date, self.to_date]],
                "docstatus": 1
            },
            fields=["name", "posting_date", "customer_name", "grand_total", "total_taxes_and_charges"]
        )

        purchases = frappe.get_all(
            "Purchase Invoice",
            filters={
                "company": self.company,
                "posting_date": ["between", [self.from_date, self.to_date]],
                "docstatus": 1
            },
            fields=["name", "posting_date", "supplier_name", "grand_total", "total_taxes_and_charges"]
        )

        self.total_transactions = len(sales) + len(purchases)
        self.total_amount = sum(s.grand_total for s in sales) + sum(p.grand_total for p in purchases)
        self.total_vat = sum(s.total_taxes_and_charges for s in sales) + sum(p.total_taxes_and_charges for p in purchases)

    def _generate_exempt_supply_report(self):
        """Generate exempt/zero-rated supply report"""
        # Would query invoices with exempt/zero-rated items
        self.total_transactions = 0
        self.total_amount = 0
        self._calculate_data_quality()

    def _generate_trn_health_report(self):
        """Generate TRN health report"""
        # Query customers/suppliers with TRN issues
        invalid_count = frappe.db.count(
            "Customer",
            filters={
                "company": self.company,
                "tax_id": ["is", "not set"]
            }
        )

        self.exceptions_count = invalid_count
        self._calculate_data_quality()

    def _generate_generic_report(self):
        """Generate generic report"""
        self._calculate_data_quality()

    def _calculate_data_quality(self):
        """Calculate data quality score"""
        if self.total_transactions == 0:
            self.data_quality_score = 100
            return

        # Simple calculation based on exceptions
        if self.exceptions_count:
            error_rate = (self.exceptions_count / self.total_transactions) * 100
            self.data_quality_score = max(0, 100 - error_rate)
        else:
            self.data_quality_score = 100

    @frappe.whitelist()
    def mark_reviewed(self, comments=None):
        """Mark report as reviewed"""
        self.status = "Reviewed"
        self.reviewed_by = frappe.session.user
        self.review_date = now_datetime()
        if comments:
            self.review_comments = comments
        self.save()

    @frappe.whitelist()
    def mark_submitted_to_fta(self, reference_number=None):
        """Mark report as submitted to FTA"""
        self.status = "Submitted"
        self.submitted_to_fta = 1
        self.fta_submission_date = now_datetime()
        self.fta_submission_status = "Pending"
        if reference_number:
            self.fta_reference_number = reference_number
        self.save()

        # Log to audit
        from digicomply.digicomply.doctype.audit_log.audit_log import AuditLog
        AuditLog.log_event(
            event_type="Document Submitted",
            document_type="FTA Report",
            document_name=self.name,
            description=f"Report submitted to FTA: {reference_number or 'No ref'}",
            company=self.company
        )


@frappe.whitelist()
def generate_fta_report(report_name):
    """API to generate FTA report"""
    report = frappe.get_doc("FTA Report", report_name)
    report.generate_report()
    return {"success": True, "name": report.name}


@frappe.whitelist()
def get_vat_summary(company, from_date, to_date):
    """Get quick VAT summary for a period"""
    # Output VAT from Sales
    output_vat = frappe.db.sql("""
        SELECT COALESCE(SUM(total_taxes_and_charges), 0) as total
        FROM `tabSales Invoice`
        WHERE company = %s
        AND posting_date BETWEEN %s AND %s
        AND docstatus = 1
    """, (company, from_date, to_date))[0][0]

    # Input VAT from Purchases
    input_vat = frappe.db.sql("""
        SELECT COALESCE(SUM(total_taxes_and_charges), 0) as total
        FROM `tabPurchase Invoice`
        WHERE company = %s
        AND posting_date BETWEEN %s AND %s
        AND docstatus = 1
    """, (company, from_date, to_date))[0][0]

    return {
        "output_vat": flt(output_vat),
        "input_vat": flt(input_vat),
        "net_vat": flt(output_vat) - flt(input_vat)
    }


@frappe.whitelist()
def create_vat_201_report(company, tax_period, from_date, to_date):
    """Create and generate a VAT 201 report"""
    report = frappe.get_doc({
        "doctype": "FTA Report",
        "report_type": "VAT 201",
        "report_title": f"VAT 201 Return - {tax_period}",
        "company": company,
        "tax_period": tax_period,
        "from_date": from_date,
        "to_date": to_date
    })
    report.insert()
    report.generate_report()

    return {"success": True, "name": report.name}
