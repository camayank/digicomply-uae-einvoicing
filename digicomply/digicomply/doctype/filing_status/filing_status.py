# Copyright (c) 2024, DigiComply and contributors
# License: MIT

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import now_datetime


class FilingStatus(Document):
    """
    Filing Status - Tracks VAT Filing Submission Status

    Records the history and current status of VAT filing submissions
    to the UAE Federal Tax Authority (FTA).
    """

    def validate(self):
        """Validate the Filing Status document"""
        self.validate_status_transition()
        self.set_status_date()

    def validate_status_transition(self):
        """
        Validate that status transitions are valid.
        Valid transitions:
        - Draft -> Prepared -> Filed -> Acknowledged
        - Filed -> Rejected (can happen at any point after filing)
        """
        if self.is_new():
            return

        old_doc = self.get_doc_before_save()
        if not old_doc:
            return

        old_status = old_doc.status
        new_status = self.status

        # Define valid transitions
        valid_transitions = {
            "Draft": ["Prepared"],
            "Prepared": ["Filed", "Draft"],
            "Filed": ["Acknowledged", "Rejected"],
            "Acknowledged": [],  # Final state
            "Rejected": ["Prepared", "Filed"]  # Can resubmit
        }

        if old_status != new_status:
            allowed = valid_transitions.get(old_status, [])
            if new_status not in allowed:
                frappe.throw(
                    _("Cannot change status from {0} to {1}. Valid transitions: {2}").format(
                        old_status, new_status, ", ".join(allowed) or "None"
                    )
                )

    def set_status_date(self):
        """Set status date when status changes"""
        if self.is_new() or self.has_value_changed("status"):
            self.status_date = now_datetime()

    def on_update(self):
        """Update related Compliance Calendar when status changes"""
        self.update_compliance_calendar()

    def update_compliance_calendar(self):
        """
        Update the linked Compliance Calendar based on status.
        """
        if not self.compliance_calendar:
            return

        calendar = frappe.get_doc("Compliance Calendar", self.compliance_calendar)

        # Map Filing Status to Compliance Calendar status
        status_map = {
            "Draft": "Upcoming",
            "Prepared": "Due Soon",
            "Filed": "Filed",
            "Acknowledged": "Acknowledged",
            "Rejected": "Due Soon"  # Needs to be refiled
        }

        new_calendar_status = status_map.get(self.status)
        if new_calendar_status and calendar.status != new_calendar_status:
            calendar.status = new_calendar_status
            calendar.filing_status = self.name
            calendar.save(ignore_permissions=True)

    @frappe.whitelist()
    def update_status(self, new_status, fta_reference=None, fta_response=None, rejection_reason=None):
        """
        Update the filing status with optional FTA details.

        Args:
            new_status: The new status to set
            fta_reference: FTA reference number (for Filed/Acknowledged)
            fta_response: Response message from FTA
            rejection_reason: Reason for rejection (for Rejected status)
        """
        # Permission check
        if not frappe.has_permission("Filing Status", "write", self.name):
            frappe.throw(_("Not permitted to modify this Filing Status"))

        self.status = new_status
        self.status_date = now_datetime()

        if fta_reference:
            self.fta_reference = fta_reference

        if fta_response:
            self.fta_response = fta_response

        if new_status == "Acknowledged":
            self.acknowledged_date = now_datetime()

        if new_status == "Rejected" and rejection_reason:
            self.rejection_reason = rejection_reason

        if new_status == "Filed":
            self.filed_by = frappe.session.user

        self.save()

        frappe.msgprint(
            _("Filing Status updated to {0}").format(new_status),
            indicator="green" if new_status in ["Filed", "Acknowledged"] else "orange"
        )

        return {"status": "success", "new_status": new_status}


@frappe.whitelist()
def get_filing_history(compliance_calendar):
    """
    Get the filing history for a Compliance Calendar entry.

    Args:
        compliance_calendar: Name of the Compliance Calendar

    Returns:
        List of Filing Status records sorted by status_date
    """
    if not frappe.has_permission("Filing Status", "read"):
        frappe.throw(_("Not permitted to read Filing Status"))

    history = frappe.get_all(
        "Filing Status",
        filters={"compliance_calendar": compliance_calendar},
        fields=[
            "name", "status", "status_date", "filed_by",
            "fta_reference", "fta_response", "acknowledged_date",
            "rejection_reason", "notes"
        ],
        order_by="status_date desc"
    )

    return history


@frappe.whitelist()
def create_filing_status(compliance_calendar, status="Draft"):
    """
    Create a new Filing Status record for a Compliance Calendar.

    Args:
        compliance_calendar: Name of the Compliance Calendar
        status: Initial status (default: Draft)

    Returns:
        The created Filing Status document
    """
    if not frappe.has_permission("Filing Status", "create"):
        frappe.throw(_("Not permitted to create Filing Status"))

    filing_status = frappe.get_doc({
        "doctype": "Filing Status",
        "compliance_calendar": compliance_calendar,
        "status": status,
        "status_date": now_datetime()
    })
    filing_status.insert()

    # Update Compliance Calendar with the new filing status
    calendar = frappe.get_doc("Compliance Calendar", compliance_calendar)
    calendar.filing_status = filing_status.name
    calendar.save(ignore_permissions=True)

    return filing_status


def has_permission(doc, ptype, user):
    """Custom permission check for Filing Status"""
    if ptype == "read":
        # Users can read filing status for their permitted companies
        if doc.compliance_calendar:
            calendar = frappe.get_doc("Compliance Calendar", doc.compliance_calendar)
            user_companies = frappe.get_all(
                "User Permission",
                filters={"user": user, "allow": "Company"},
                pluck="for_value"
            )
            if user_companies and calendar.company in user_companies:
                return True
    return None
