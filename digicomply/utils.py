# Copyright (c) 2024, DigiComply and contributors
# License: MIT

"""
DigiComply Utilities
"""

import frappe
from frappe import _
from frappe.utils import cstr


def format_trn(trn: str) -> str:
    """
    Format UAE TRN for display

    Args:
        trn: 15-digit Tax Registration Number

    Returns:
        Formatted TRN: XXX-XXXX-XXXXXXX-X
    """
    if not trn or len(trn) != 15:
        return trn or ""

    return f"{trn[:3]}-{trn[3:7]}-{trn[7:14]}-{trn[14]}"


def format_aed(amount: float) -> str:
    """
    Format amount with AED currency

    Args:
        amount: Numeric amount

    Returns:
        Formatted string: "AED 1,234.56"
    """
    return f"AED {amount:,.2f}"


def validate_trn(trn: str) -> tuple:
    """
    Validate UAE TRN format

    Args:
        trn: Tax Registration Number to validate

    Returns:
        tuple: (is_valid, error_message)
    """
    if not trn:
        return (False, _("TRN is required"))

    trn = cstr(trn).strip()

    if len(trn) != 15:
        return (False, _("TRN must be exactly 15 digits"))

    if not trn.isdigit():
        return (False, _("TRN must contain only digits"))

    if not trn.startswith("100"):
        return (False, _("UAE TRN must start with 100"))

    return (True, None)


def get_profile_execution_id(transaction_type: str) -> str:
    """
    Get ProfileExecutionID for PINT AE based on transaction type

    Args:
        transaction_type: Type of transaction

    Returns:
        8-bit binary string
    """
    # ProfileExecutionID mappings per PINT AE spec
    profiles = {
        "domestic_b2b": "01000000",  # Standard domestic B2B
        "domestic_b2c": "01000001",  # Simplified domestic B2C
        "export": "01000010",  # Export (zero-rated)
        "designated_zone": "01000011",  # Designated zone supply
        "reverse_charge": "01000100",  # Reverse charge mechanism
        "deemed_supply": "01000101",  # Deemed supplies
        "tourist_refund": "01000110",  # Tourist refund scheme
        "credit_note": "01000111",  # Credit note
    }

    return profiles.get(transaction_type, "01000000")


def calculate_penalty_exposure(missing_count: int, settings=None) -> float:
    """
    Calculate potential FTA penalty exposure

    Args:
        missing_count: Number of unreported invoices
        settings: Optional DigiComply Settings doc

    Returns:
        Potential penalty amount in AED
    """
    if not settings:
        settings = frappe.get_single("DigiComply Settings")

    penalty_per_invoice = settings.penalty_per_invoice or 5000
    return missing_count * penalty_per_invoice


def get_compliance_status(score: float) -> dict:
    """
    Get compliance status based on score

    Args:
        score: Compliance percentage

    Returns:
        dict with status, color, and recommendation
    """
    if score >= 95:
        return {
            "status": "Excellent",
            "color": "green",
            "indicator": "green",
            "recommendation": _("Maintain current compliance level"),
        }
    elif score >= 85:
        return {
            "status": "Good",
            "color": "blue",
            "indicator": "blue",
            "recommendation": _("Review mismatches to improve compliance"),
        }
    elif score >= 70:
        return {
            "status": "Warning",
            "color": "yellow",
            "indicator": "yellow",
            "recommendation": _("Address missing invoices before FTA deadline"),
        }
    else:
        return {
            "status": "Critical",
            "color": "red",
            "indicator": "red",
            "recommendation": _("URGENT: Submit missing invoices immediately"),
        }
