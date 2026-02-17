# Copyright (c) 2024, DigiComply and contributors
# License: MIT

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import flt, now_datetime


class VATAdjustment(Document):
    """
    VAT Adjustment - Manual VAT adjustment records

    Records manual VAT adjustments that can be linked to VAT Returns.
    Supports various adjustment types including corrections, bad debt relief,
    and reverse charge scenarios.
    """

    def validate(self):
        """Validate the VAT Adjustment document"""
        self.validate_vat_return_link()
        self.calculate_vat_amount()

    def validate_vat_return_link(self):
        """Ensure VAT Return link is valid if set"""
        if self.vat_return:
            vat_return_doc = frappe.get_doc("VAT Return", self.vat_return)
            # Ensure the VAT Return belongs to the same company
            if vat_return_doc.company != self.company:
                frappe.throw(
                    _("VAT Return {0} belongs to a different company. "
                      "Please select a VAT Return for {1}.").format(
                        self.vat_return, self.company
                    )
                )

    def calculate_vat_amount(self):
        """
        Calculate VAT amount from base_amount and vat_rate if not provided.

        If vat_amount is already set (non-zero), it will be kept.
        Otherwise, it will be calculated as: base_amount * (vat_rate / 100)
        """
        # Only calculate if base_amount is set and vat_amount is not manually set
        if flt(self.base_amount) and not flt(self.vat_amount):
            self.vat_amount = flt(
                flt(self.base_amount) * (flt(self.vat_rate) / 100),
                2
            )

    @frappe.whitelist()
    def approve(self):
        """
        Approve the VAT Adjustment.

        Sets status to Approved and records the approver and approval date.
        Can only be called when status is Draft.
        """
        # Permission check
        if not frappe.has_permission("VAT Adjustment", "write", self.name):
            frappe.throw(_("Not permitted to approve this VAT Adjustment"))

        if self.status != "Draft":
            frappe.throw(
                _("VAT Adjustment must be in 'Draft' status to approve. "
                  "Current status: {0}").format(self.status)
            )

        # Update status and approval details
        self.db_set("status", "Approved")
        self.db_set("approved_by", frappe.session.user)
        self.db_set("approved_date", now_datetime())

        frappe.msgprint(_("VAT Adjustment approved successfully"), indicator="green")

        return {
            "status": "success",
            "approved_by": frappe.session.user,
            "approved_date": str(now_datetime())
        }

    def on_trash(self):
        """Prevent deletion of applied adjustments"""
        if self.status == "Applied":
            frappe.throw(
                _("Cannot delete a VAT Adjustment that has been applied to a VAT Return. "
                  "Please remove it from the VAT Return first.")
            )


@frappe.whitelist()
def approve_adjustment(docname):
    """API endpoint to approve a VAT Adjustment"""
    doc = frappe.get_doc("VAT Adjustment", docname)
    return doc.approve()


@frappe.whitelist()
def apply_to_vat_return(docname, vat_return):
    """
    Apply a VAT Adjustment to a VAT Return.

    Links the adjustment to the specified VAT Return and updates status to Applied.
    Can only be called when status is Approved.

    Args:
        docname: Name of the VAT Adjustment document
        vat_return: Name of the VAT Return to apply the adjustment to
    """
    doc = frappe.get_doc("VAT Adjustment", docname)

    # Permission check
    if not frappe.has_permission("VAT Adjustment", "write", docname):
        frappe.throw(_("Not permitted to modify this VAT Adjustment"))

    if not frappe.has_permission("VAT Return", "write", vat_return):
        frappe.throw(_("Not permitted to modify the selected VAT Return"))

    if doc.status != "Approved":
        frappe.throw(
            _("VAT Adjustment must be 'Approved' before applying to a VAT Return. "
              "Current status: {0}").format(doc.status)
        )

    # Validate VAT Return
    vat_return_doc = frappe.get_doc("VAT Return", vat_return)

    # Ensure same company
    if vat_return_doc.company != doc.company:
        frappe.throw(
            _("VAT Return {0} belongs to a different company. "
              "Please select a VAT Return for {1}.").format(vat_return, doc.company)
        )

    # Ensure VAT Return is not already filed
    if vat_return_doc.status in ("Filed", "Acknowledged"):
        frappe.throw(
            _("Cannot apply adjustment to a VAT Return that has already been filed. "
              "VAT Return status: {0}").format(vat_return_doc.status)
        )

    # Update the adjustment
    doc.db_set("vat_return", vat_return)
    doc.db_set("status", "Applied")

    frappe.msgprint(
        _("VAT Adjustment applied to {0} successfully").format(vat_return),
        indicator="green"
    )

    return {
        "status": "success",
        "vat_return": vat_return,
        "adjustment_name": docname
    }


@frappe.whitelist()
def cancel_adjustment(docname):
    """
    Cancel a VAT Adjustment.

    Sets status to Cancelled. Can be called when status is Draft or Approved.
    Cannot cancel an Applied adjustment.

    Args:
        docname: Name of the VAT Adjustment document
    """
    doc = frappe.get_doc("VAT Adjustment", docname)

    # Permission check
    if not frappe.has_permission("VAT Adjustment", "write", docname):
        frappe.throw(_("Not permitted to cancel this VAT Adjustment"))

    if doc.status == "Applied":
        frappe.throw(
            _("Cannot cancel a VAT Adjustment that has been applied to a VAT Return. "
              "Please remove it from the VAT Return first.")
        )

    if doc.status == "Cancelled":
        frappe.throw(_("VAT Adjustment is already cancelled"))

    doc.db_set("status", "Cancelled")

    frappe.msgprint(_("VAT Adjustment cancelled"), indicator="orange")

    return {"status": "success"}
