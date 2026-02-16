# Copyright (c) 2024, DigiComply and contributors
# License: MIT

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import now_datetime


class TRNRegistry(Document):
    """
    TRN Registry - Central store for UAE Tax Registration Numbers

    Features:
    - TRN format validation (15 digits, starts with 100, Luhn checksum)
    - Primary TRN management per company
    - Validation status tracking
    """

    def validate(self):
        """Run all validations before save"""
        self.validate_trn_format()
        self.validate_unique_primary()
        self.set_validation_status()

    def validate_trn_format(self):
        """
        Validate UAE TRN format:
        - Must be exactly 15 digits
        - Must start with '100'
        - Must pass Luhn checksum validation
        """
        if not self.trn:
            frappe.throw(_("TRN is required"))

        # Remove any spaces or dashes
        trn = self.trn.replace(" ", "").replace("-", "")
        self.trn = trn

        # Check if all digits
        if not trn.isdigit():
            frappe.throw(_("TRN must contain only digits. Got: {0}").format(self.trn))

        # Check length (15 digits)
        if len(trn) != 15:
            frappe.throw(
                _("TRN must be exactly 15 digits. Got {0} digits.").format(len(trn))
            )

        # Check prefix (must start with 100)
        if not trn.startswith("100"):
            frappe.throw(
                _("UAE TRN must start with '100'. Got: {0}").format(trn[:3])
            )

        # Validate Luhn checksum
        if not self._validate_luhn(trn):
            frappe.throw(
                _("TRN failed checksum validation. Please verify the TRN is correct.")
            )

    def _validate_luhn(self, number):
        """
        Validate number using Luhn algorithm (mod 10 checksum)
        Used for validating UAE TRN numbers
        """
        def digits_of(n):
            return [int(d) for d in str(n)]

        digits = digits_of(number)
        odd_digits = digits[-1::-2]
        even_digits = digits[-2::-2]

        checksum = sum(odd_digits)
        for d in even_digits:
            checksum += sum(digits_of(d * 2))

        return checksum % 10 == 0

    def validate_unique_primary(self):
        """
        Ensure only one TRN is marked as primary per company
        """
        if self.is_primary:
            # Check if another primary exists for this company
            existing_primary = frappe.db.exists(
                "TRN Registry",
                {
                    "company": self.company,
                    "is_primary": 1,
                    "name": ("!=", self.name or "")
                }
            )

            if existing_primary:
                frappe.throw(
                    _("Company {0} already has a primary TRN: {1}. "
                      "Please unmark it first before setting a new primary.").format(
                        self.company, existing_primary
                    )
                )

    def set_validation_status(self):
        """
        Set validation status based on format validation
        This is called after successful format validation
        """
        # If we reached here, format validation passed
        # Set to Valid (FTA API validation will be in Phase 2)
        if self.validation_status in ("Not Validated", "Invalid"):
            self.validation_status = "Valid"
            self.last_validated = now_datetime()

    def before_save(self):
        """Actions before saving the document"""
        # Check expiry status
        if self.fta_expiry_date:
            from frappe.utils import getdate, today
            if getdate(self.fta_expiry_date) < getdate(today()):
                self.validation_status = "Expired"


def get_primary_trn(company):
    """Get the primary TRN for a company"""
    return frappe.db.get_value(
        "TRN Registry",
        {"company": company, "is_primary": 1, "is_active": 1},
        "trn"
    )


def get_company_trns(company, active_only=True):
    """Get all TRNs for a company"""
    filters = {"company": company}
    if active_only:
        filters["is_active"] = 1

    return frappe.get_all(
        "TRN Registry",
        filters=filters,
        fields=["name", "trn", "entity_name", "entity_type", "is_primary", "validation_status"]
    )


@frappe.whitelist()
def validate_trn_bulk(trns):
    """
    Validate multiple TRNs at once

    Args:
        trns: JSON string or list of TRNs to validate

    Returns:
        dict with validation results for each TRN
    """
    import json

    if isinstance(trns, str):
        trns = json.loads(trns)

    results = {}

    for trn in trns:
        result = validate_single_trn(trn)
        results[trn] = result

    return results


def validate_single_trn(trn):
    """
    Validate a single TRN without creating a document

    Args:
        trn: The TRN string to validate

    Returns:
        dict with validation result
    """
    result = {
        "trn": trn,
        "valid": False,
        "errors": []
    }

    # Clean the TRN
    clean_trn = trn.replace(" ", "").replace("-", "")

    # Check if all digits
    if not clean_trn.isdigit():
        result["errors"].append("TRN must contain only digits")
        return result

    # Check length
    if len(clean_trn) != 15:
        result["errors"].append(f"TRN must be 15 digits, got {len(clean_trn)}")
        return result

    # Check prefix
    if not clean_trn.startswith("100"):
        result["errors"].append("UAE TRN must start with '100'")
        return result

    # Validate Luhn checksum
    def digits_of(n):
        return [int(d) for d in str(n)]

    digits = digits_of(clean_trn)
    odd_digits = digits[-1::-2]
    even_digits = digits[-2::-2]

    checksum = sum(odd_digits)
    for d in even_digits:
        checksum += sum(digits_of(d * 2))

    if checksum % 10 != 0:
        result["errors"].append("TRN failed checksum validation")
        return result

    # All validations passed
    result["valid"] = True
    result["formatted_trn"] = clean_trn

    return result


@frappe.whitelist()
def get_trn_status(trn):
    """
    Get the validation status of a TRN from the registry

    Args:
        trn: The TRN to check

    Returns:
        dict with TRN details or None if not found
    """
    trn_doc = frappe.db.get_value(
        "TRN Registry",
        {"trn": trn},
        ["name", "trn", "entity_name", "company", "validation_status", "last_validated", "is_active"],
        as_dict=True
    )

    return trn_doc


@frappe.whitelist()
def set_primary_trn(trn_name):
    """
    Set a TRN as the primary for its company

    Args:
        trn_name: The document name of the TRN Registry entry
    """
    trn_doc = frappe.get_doc("TRN Registry", trn_name)

    # Unset any existing primary for this company
    frappe.db.sql("""
        UPDATE `tabTRN Registry`
        SET is_primary = 0
        WHERE company = %s AND is_primary = 1
    """, (trn_doc.company,))

    # Set this one as primary
    trn_doc.is_primary = 1
    trn_doc.save()

    frappe.msgprint(_("TRN {0} set as primary for {1}").format(trn_doc.trn, trn_doc.company))

    return {"status": "success"}
