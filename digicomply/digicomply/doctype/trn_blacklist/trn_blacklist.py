# Copyright (c) 2024, DigiComply and contributors
# License: MIT

import frappe
from frappe import _
from frappe.model.document import Document
import json
import re


class TRNBlacklist(Document):
    """
    TRN Blacklist - Store fraudulent/invalid TRNs that should be flagged during validation

    Features:
    - TRN format cleaning and validation
    - Reason tracking for blacklisting
    - Admin verification workflow
    - Bulk checking capability
    """

    def validate(self):
        """Run all validations before save"""
        self.clean_trn_format()
        self.validate_trn_format()
        self.set_reported_by()

    def clean_trn_format(self):
        """
        Clean TRN format by removing spaces and dashes
        """
        if self.trn:
            # Remove spaces, dashes, and any other non-digit characters
            cleaned_trn = re.sub(r'[^0-9]', '', self.trn)
            self.trn = cleaned_trn

    def validate_trn_format(self):
        """
        Validate that TRN is exactly 15 digits
        """
        if not self.trn:
            frappe.throw(_("TRN is required"))

        # Check if all digits
        if not self.trn.isdigit():
            frappe.throw(
                _("TRN must contain only digits. Got: {0}").format(self.trn)
            )

        # Check length (15 digits)
        if len(self.trn) != 15:
            frappe.throw(
                _("TRN must be exactly 15 digits. Got {0} digits.").format(len(self.trn))
            )

    def set_reported_by(self):
        """
        Set reported_by to current user if not already set
        """
        if not self.reported_by:
            self.reported_by = frappe.session.user


@frappe.whitelist()
def is_blacklisted(trn):
    """
    Check if a TRN is in the active blacklist

    Args:
        trn: The TRN string to check

    Returns:
        dict with blacklist status and details if blacklisted
    """
    # Permission check
    if not frappe.has_permission("TRN Blacklist", "read"):
        frappe.throw(_("You do not have permission to check TRN blacklist"), frappe.PermissionError)

    if not trn:
        return {"is_blacklisted": False, "trn": trn}

    # Clean the TRN for lookup
    clean_trn = re.sub(r'[^0-9]', '', str(trn))

    # Check if TRN exists in active blacklist
    blacklist_entry = frappe.db.get_value(
        "TRN Blacklist",
        {"trn": clean_trn, "is_active": 1},
        ["name", "trn", "reason", "entity_name", "reported_date", "verified", "notes"],
        as_dict=True
    )

    if blacklist_entry:
        return {
            "is_blacklisted": True,
            "trn": clean_trn,
            "reason": blacklist_entry.reason,
            "entity_name": blacklist_entry.entity_name,
            "reported_date": str(blacklist_entry.reported_date) if blacklist_entry.reported_date else None,
            "verified": blacklist_entry.verified,
            "notes": blacklist_entry.notes
        }

    return {"is_blacklisted": False, "trn": clean_trn}


@frappe.whitelist()
def check_trns_bulk(trns):
    """
    Check multiple TRNs against the blacklist

    Args:
        trns: JSON string or list of TRNs to check

    Returns:
        dict with results for each TRN
    """
    # Permission check
    if not frappe.has_permission("TRN Blacklist", "read"):
        frappe.throw(_("You do not have permission to check TRN blacklist"), frappe.PermissionError)

    # Parse JSON if string
    if isinstance(trns, str):
        try:
            trns = json.loads(trns)
        except json.JSONDecodeError:
            frappe.throw(_("Invalid JSON format for TRNs"))

    if not isinstance(trns, list):
        frappe.throw(_("TRNs must be a list"))

    if len(trns) > 1000:
        frappe.throw(_("Maximum 1000 TRNs can be checked at once"))

    # Clean all TRNs
    clean_trns = []
    trn_mapping = {}  # Map cleaned TRN to original
    for trn in trns:
        if trn:
            clean_trn = re.sub(r'[^0-9]', '', str(trn))
            clean_trns.append(clean_trn)
            trn_mapping[clean_trn] = trn

    if not clean_trns:
        return {"results": {}, "blacklisted_count": 0, "total_checked": 0}

    # Fetch all blacklisted TRNs in one query
    blacklisted_entries = frappe.db.get_all(
        "TRN Blacklist",
        filters={
            "trn": ("in", clean_trns),
            "is_active": 1
        },
        fields=["trn", "reason", "entity_name", "verified"]
    )

    # Create lookup dict
    blacklist_lookup = {entry.trn: entry for entry in blacklisted_entries}

    # Build results
    results = {}
    blacklisted_count = 0

    for clean_trn in clean_trns:
        original_trn = trn_mapping.get(clean_trn, clean_trn)
        if clean_trn in blacklist_lookup:
            entry = blacklist_lookup[clean_trn]
            results[original_trn] = {
                "is_blacklisted": True,
                "trn": clean_trn,
                "reason": entry.reason,
                "entity_name": entry.entity_name,
                "verified": entry.verified
            }
            blacklisted_count += 1
        else:
            results[original_trn] = {
                "is_blacklisted": False,
                "trn": clean_trn
            }

    return {
        "results": results,
        "blacklisted_count": blacklisted_count,
        "total_checked": len(clean_trns)
    }


@frappe.whitelist()
def add_to_blacklist(trn, reason, entity_name=None, notes=None):
    """
    Add a TRN to the blacklist

    Args:
        trn: The TRN to blacklist
        reason: Reason for blacklisting
        entity_name: Optional entity name
        notes: Optional notes

    Returns:
        dict with the created document name
    """
    # Permission check
    if not frappe.has_permission("TRN Blacklist", "create"):
        frappe.throw(_("You do not have permission to add to TRN blacklist"), frappe.PermissionError)

    # Clean TRN
    clean_trn = re.sub(r'[^0-9]', '', str(trn))

    # Check if already exists
    existing = frappe.db.exists("TRN Blacklist", clean_trn)
    if existing:
        frappe.throw(_("TRN {0} is already in the blacklist").format(clean_trn))

    # Valid reasons
    valid_reasons = [
        "Fraudulent",
        "Cancelled by FTA",
        "Duplicate",
        "Invalid Format",
        "Expired - Not Renewed",
        "Reported by User"
    ]

    if reason not in valid_reasons:
        frappe.throw(_("Invalid reason. Must be one of: {0}").format(", ".join(valid_reasons)))

    # Create the blacklist entry
    doc = frappe.get_doc({
        "doctype": "TRN Blacklist",
        "trn": clean_trn,
        "reason": reason,
        "entity_name": entity_name,
        "notes": notes,
        "is_active": 1,
        "verified": 0
    })
    doc.insert()

    return {
        "success": True,
        "name": doc.name,
        "message": _("TRN {0} added to blacklist").format(clean_trn)
    }


@frappe.whitelist()
def remove_from_blacklist(trn):
    """
    Deactivate a TRN from the blacklist (soft delete)

    Args:
        trn: The TRN to remove from blacklist

    Returns:
        dict with status
    """
    # Permission check
    if not frappe.has_permission("TRN Blacklist", "write"):
        frappe.throw(_("You do not have permission to modify TRN blacklist"), frappe.PermissionError)

    # Clean TRN
    clean_trn = re.sub(r'[^0-9]', '', str(trn))

    # Check if exists
    if not frappe.db.exists("TRN Blacklist", clean_trn):
        frappe.throw(_("TRN {0} is not in the blacklist").format(clean_trn))

    # Deactivate instead of delete
    frappe.db.set_value("TRN Blacklist", clean_trn, "is_active", 0)

    return {
        "success": True,
        "message": _("TRN {0} has been deactivated from the blacklist").format(clean_trn)
    }


@frappe.whitelist()
def verify_blacklist_entry(trn):
    """
    Mark a blacklist entry as verified by admin

    Args:
        trn: The TRN to verify

    Returns:
        dict with status
    """
    # Permission check - only System Manager can verify
    if not frappe.has_permission("TRN Blacklist", "write"):
        frappe.throw(_("You do not have permission to verify blacklist entries"), frappe.PermissionError)

    # Additional check for System Manager role
    if "System Manager" not in frappe.get_roles():
        frappe.throw(_("Only System Manager can verify blacklist entries"), frappe.PermissionError)

    # Clean TRN
    clean_trn = re.sub(r'[^0-9]', '', str(trn))

    # Check if exists
    if not frappe.db.exists("TRN Blacklist", clean_trn):
        frappe.throw(_("TRN {0} is not in the blacklist").format(clean_trn))

    # Mark as verified
    frappe.db.set_value("TRN Blacklist", clean_trn, "verified", 1)

    return {
        "success": True,
        "message": _("TRN {0} has been verified").format(clean_trn)
    }
