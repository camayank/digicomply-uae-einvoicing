# Copyright (c) 2024, DigiComply and contributors
# License: MIT

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import flt, getdate, now_datetime


class VATReturn(Document):
    """
    VAT Return - UAE VAT 201 Form Preparation

    Manages VAT return preparation for UAE FTA compliance.
    Calculates output VAT from sales and input VAT from purchases,
    handles adjustments, and tracks filing status.
    """

    def validate(self):
        """Validate the VAT Return document"""
        self.validate_dates()
        self.validate_company_trn()
        self.calculate_totals()

    def validate_dates(self):
        """Ensure from_date is before to_date"""
        if self.from_date and self.to_date:
            if getdate(self.from_date) > getdate(self.to_date):
                frappe.throw(_("From Date cannot be after To Date"))

    def validate_company_trn(self):
        """Ensure company has TRN configured"""
        if self.company:
            company_doc = frappe.get_doc("Company", self.company)
            if not company_doc.tax_id:
                frappe.throw(
                    _("Company {0} does not have a Tax Registration Number (TRN) configured. "
                      "Please update the company record before creating a VAT Return.").format(self.company)
                )

    def calculate_totals(self):
        """
        Calculate VAT totals:
        - Output VAT = 5% of standard rated sales
        - Input VAT Recoverable = 5% of standard rated purchases
        - Total Adjustments = Sum of adjustment VAT amounts
        - Net VAT Due = Output VAT - Input VAT Recoverable + Adjustments
        """
        # UAE standard VAT rate
        vat_rate = 0.05

        # Calculate Output VAT (5% of standard rated sales)
        self.output_vat_amount = flt(flt(self.total_sales_standard) * vat_rate, 2)

        # Calculate Input VAT Recoverable (5% of standard rated purchases)
        self.input_vat_recoverable = flt(flt(self.total_purchases_standard) * vat_rate, 2)

        # Calculate total adjustments from child table
        total_adj = 0
        for adj in self.adjustments or []:
            total_adj += flt(adj.vat_amount)
        self.total_adjustments = flt(total_adj, 2)

        # Calculate Net VAT Due
        # Positive = Payable to FTA, Negative = Refundable
        self.net_vat_due = flt(
            self.output_vat_amount - self.input_vat_recoverable + self.total_adjustments,
            2
        )

    def on_submit(self):
        """Update status when submitted"""
        self.db_set("status", "Prepared")
        self.db_set("prepared_by", frappe.session.user)
        self.db_set("prepared_date", now_datetime())

    def on_cancel(self):
        """Reset status when cancelled"""
        self.db_set("status", "Draft")

    @frappe.whitelist()
    def generate_from_books(self):
        """
        Fetch invoices from the accounting system and calculate VAT automatically.

        This method:
        1. Fetches Sales Invoices for output VAT calculation
        2. Fetches Purchase Invoices for input VAT calculation
        3. Categorizes by tax type (standard, zero-rated, exempt)
        4. Updates the VAT return figures
        """
        # Permission check
        if not frappe.has_permission("VAT Return", "write", self.name):
            frappe.throw(_("Not permitted to modify this VAT Return"))

        if self.docstatus != 0:
            frappe.throw(_("Cannot regenerate figures for a submitted VAT Return"))

        # Get Sales Invoice data (Output VAT)
        sales_data = self._get_sales_invoice_data()

        # Get Purchase Invoice data (Input VAT)
        purchase_data = self._get_purchase_invoice_data()

        # Update the document
        self.total_sales_standard = flt(sales_data.get("standard", 0), 2)
        self.total_sales_zero_rated = flt(sales_data.get("zero_rated", 0), 2)
        self.total_sales_exempt = flt(sales_data.get("exempt", 0), 2)

        self.total_purchases_standard = flt(purchase_data.get("standard", 0), 2)
        self.total_purchases_zero_rated = flt(purchase_data.get("zero_rated", 0), 2)
        self.total_purchases_exempt = flt(purchase_data.get("exempt", 0), 2)

        # Recalculate totals
        self.calculate_totals()

        # Save the document
        self.save()

        return {
            "status": "success",
            "message": _("VAT figures generated successfully from books"),
            "sales": sales_data,
            "purchases": purchase_data,
            "output_vat": self.output_vat_amount,
            "input_vat_recoverable": self.input_vat_recoverable,
            "net_vat_due": self.net_vat_due
        }

    def _get_sales_invoice_data(self):
        """
        Fetch and categorize Sales Invoice data by tax type.

        Returns dict with:
        - standard: Total of standard rated sales (5%)
        - zero_rated: Total of zero rated sales
        - exempt: Total of exempt sales
        """
        result = {
            "standard": 0,
            "zero_rated": 0,
            "exempt": 0
        }

        # Get all submitted Sales Invoices for the company in date range
        invoices = frappe.get_all(
            "Sales Invoice",
            filters={
                "company": self.company,
                "posting_date": ["between", [self.from_date, self.to_date]],
                "docstatus": 1,
            },
            fields=["name", "net_total", "total_taxes_and_charges", "grand_total"]
        )

        for inv in invoices:
            # Get tax details for categorization
            tax_details = self._categorize_invoice_tax(inv.name, "Sales Invoice")

            if tax_details["tax_type"] == "standard":
                result["standard"] += flt(inv.net_total)
            elif tax_details["tax_type"] == "zero_rated":
                result["zero_rated"] += flt(inv.net_total)
            else:
                result["exempt"] += flt(inv.net_total)

        return result

    def _get_purchase_invoice_data(self):
        """
        Fetch and categorize Purchase Invoice data by tax type.

        Returns dict with:
        - standard: Total of standard rated purchases (5%)
        - zero_rated: Total of zero rated purchases
        - exempt: Total of exempt purchases
        """
        result = {
            "standard": 0,
            "zero_rated": 0,
            "exempt": 0
        }

        # Get all submitted Purchase Invoices for the company in date range
        invoices = frappe.get_all(
            "Purchase Invoice",
            filters={
                "company": self.company,
                "posting_date": ["between", [self.from_date, self.to_date]],
                "docstatus": 1,
            },
            fields=["name", "net_total", "total_taxes_and_charges", "grand_total"]
        )

        for inv in invoices:
            # Get tax details for categorization
            tax_details = self._categorize_invoice_tax(inv.name, "Purchase Invoice")

            if tax_details["tax_type"] == "standard":
                result["standard"] += flt(inv.net_total)
            elif tax_details["tax_type"] == "zero_rated":
                result["zero_rated"] += flt(inv.net_total)
            else:
                result["exempt"] += flt(inv.net_total)

        return result

    def _categorize_invoice_tax(self, invoice_name, invoice_type):
        """
        Categorize an invoice based on its tax template.

        Checks the taxes and charges to determine:
        - standard: Has 5% VAT
        - zero_rated: Has 0% VAT explicitly set
        - exempt: No VAT applied

        Args:
            invoice_name: Name of the invoice
            invoice_type: "Sales Invoice" or "Purchase Invoice"

        Returns:
            dict with tax_type and tax_rate
        """
        child_table = "Sales Taxes and Charges" if invoice_type == "Sales Invoice" else "Purchase Taxes and Charges"

        taxes = frappe.get_all(
            child_table,
            filters={"parent": invoice_name, "parenttype": invoice_type},
            fields=["rate", "tax_amount", "account_head"]
        )

        if not taxes:
            # No taxes = exempt or zero-rated (treating as exempt for UAE)
            return {"tax_type": "exempt", "tax_rate": 0}

        # Check for standard rate (5%)
        for tax in taxes:
            rate = flt(tax.rate)
            # UAE standard VAT is 5%
            if 4.5 <= rate <= 5.5:
                return {"tax_type": "standard", "tax_rate": rate}
            # Zero rated
            elif rate == 0 and flt(tax.tax_amount) == 0:
                return {"tax_type": "zero_rated", "tax_rate": 0}

        # If we have taxes but none match standard/zero, treat as exempt
        return {"tax_type": "exempt", "tax_rate": 0}

    @frappe.whitelist()
    def mark_as_filed(self, fta_reference=None):
        """
        Mark the VAT Return as filed with FTA.

        Can only be called when status is "Under Review".
        Updates status to "Filed" and records the filing date.

        Args:
            fta_reference: Optional FTA acknowledgment reference number
        """
        # Permission check
        if not frappe.has_permission("VAT Return", "write", self.name):
            frappe.throw(_("Not permitted to modify this VAT Return"))

        if self.status != "Under Review":
            frappe.throw(
                _("VAT Return must be in 'Under Review' status to mark as filed. "
                  "Current status: {0}").format(self.status)
            )

        # Update status and dates
        self.db_set("status", "Filed")
        self.db_set("filed_date", getdate())

        if fta_reference:
            self.db_set("fta_reference", fta_reference)

        frappe.msgprint(_("VAT Return marked as filed successfully"), indicator="green")

        return {
            "status": "success",
            "filed_date": str(getdate()),
            "fta_reference": fta_reference
        }

    @frappe.whitelist()
    def set_under_review(self):
        """
        Set the VAT Return status to Under Review.

        Can only be called when status is "Prepared".
        """
        # Permission check
        if not frappe.has_permission("VAT Return", "write", self.name):
            frappe.throw(_("Not permitted to modify this VAT Return"))

        if self.status != "Prepared":
            frappe.throw(
                _("VAT Return must be in 'Prepared' status to set for review. "
                  "Current status: {0}").format(self.status)
            )

        self.db_set("status", "Under Review")
        frappe.msgprint(_("VAT Return is now under review"), indicator="blue")

        return {"status": "success"}

    @frappe.whitelist()
    def acknowledge_filing(self, fta_reference=None):
        """
        Mark the VAT Return as acknowledged by FTA.

        Can only be called when status is "Filed".
        """
        # Permission check
        if not frappe.has_permission("VAT Return", "write", self.name):
            frappe.throw(_("Not permitted to modify this VAT Return"))

        if self.status != "Filed":
            frappe.throw(
                _("VAT Return must be in 'Filed' status to acknowledge. "
                  "Current status: {0}").format(self.status)
            )

        self.db_set("status", "Acknowledged")

        if fta_reference:
            self.db_set("fta_reference", fta_reference)

        frappe.msgprint(_("VAT Return acknowledged successfully"), indicator="green")

        return {"status": "success", "fta_reference": fta_reference}


def has_permission(doc, ptype, user):
    """Custom permission check for VAT Return"""
    if ptype == "read":
        # Users can read VAT returns for their permitted companies
        user_companies = frappe.get_all(
            "User Permission",
            filters={"user": user, "allow": "Company"},
            pluck="for_value"
        )
        if user_companies and doc.company in user_companies:
            return True
    return None


@frappe.whitelist()
def generate_vat_from_books(docname):
    """API endpoint to generate VAT figures from books"""
    doc = frappe.get_doc("VAT Return", docname)
    return doc.generate_from_books()


@frappe.whitelist()
def mark_vat_as_filed(docname, fta_reference=None):
    """API endpoint to mark VAT Return as filed"""
    doc = frappe.get_doc("VAT Return", docname)
    return doc.mark_as_filed(fta_reference=fta_reference)


@frappe.whitelist()
def set_vat_under_review(docname):
    """API endpoint to set VAT Return under review"""
    doc = frappe.get_doc("VAT Return", docname)
    return doc.set_under_review()


@frappe.whitelist()
def acknowledge_vat_filing(docname, fta_reference=None):
    """API endpoint to acknowledge VAT filing"""
    doc = frappe.get_doc("VAT Return", docname)
    return doc.acknowledge_filing(fta_reference=fta_reference)
