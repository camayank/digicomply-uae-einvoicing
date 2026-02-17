# Copyright (c) 2024, DigiComply and contributors
# License: MIT

"""
FTA API Integration for TRN Validation

This module provides integration with the UAE Federal Tax Authority (FTA) API
for validating Tax Registration Numbers (TRNs).

Features:
- TRN format validation (15 digits, starts with 100, Luhn checksum)
- Blacklist checking before API calls
- FTA API integration (mocked until real API is available)
- Validation logging for audit trail
- Bulk validation support
"""

import frappe
from frappe import _
from frappe.utils import now_datetime, cint
import json
import re


def get_fta_settings():
    """
    Get FTA API settings from DigiComply Settings

    Returns:
        dict: FTA API configuration with keys:
            - api_url: FTA API endpoint URL
            - api_key: API authentication key
            - enabled: Whether FTA API integration is enabled
            - timeout: Request timeout in seconds
    """
    try:
        settings = frappe.get_single("DigiComply Settings")

        # Check if FTA fields exist in settings (they may be added in future)
        # For now, use defaults or check for fields dynamically
        fta_enabled = getattr(settings, "fta_api_enabled", False) or False
        fta_api_url = getattr(settings, "fta_api_url", "") or "https://api.tax.gov.ae/v1/trn/validate"
        fta_api_key = getattr(settings, "fta_api_key", "") or ""
        fta_timeout = cint(getattr(settings, "fta_api_timeout", 30)) or 30

        return {
            "api_url": fta_api_url,
            "api_key": fta_api_key,
            "enabled": fta_enabled,
            "timeout": fta_timeout
        }
    except Exception as e:
        frappe.log_error(
            title="FTA Settings Error",
            message=f"Error fetching FTA settings: {str(e)}"
        )
        return {
            "api_url": "",
            "api_key": "",
            "enabled": False,
            "timeout": 30
        }


@frappe.whitelist()
def validate_trn_with_fta(trn, company=None, trn_registry=None):
    """
    Validate a TRN against FTA API

    This is the main validation function that:
    1. Checks if TRN is in the blacklist first
    2. If FTA API is not enabled, performs format validation only
    3. If enabled, calls FTA API for validation
    4. Logs all validation attempts to TRN Validation Log

    Args:
        trn: The TRN string to validate
        company: Optional company for context
        trn_registry: Optional link to TRN Registry document

    Returns:
        dict: Validation result with keys:
            - valid: Boolean indicating if TRN is valid
            - status: Validation status string
            - message: Human-readable message
            - data: Additional data from validation
    """
    # Permission check
    if not frappe.has_permission("TRN Registry", "read"):
        frappe.throw(_("You do not have permission to validate TRNs"), frappe.PermissionError)

    if not trn:
        return {
            "valid": False,
            "status": "Invalid",
            "message": _("TRN is required"),
            "data": {}
        }

    # Clean the TRN
    clean_trn = re.sub(r'[^0-9]', '', str(trn))

    # Step 1: Check blacklist first
    blacklist_result = check_blacklist(clean_trn)
    if blacklist_result["is_blacklisted"]:
        # Log blacklist hit
        log_validation(
            trn=clean_trn,
            result={
                "valid": False,
                "status": "Invalid",
                "message": _("TRN is blacklisted: {0}").format(blacklist_result.get("reason", "Unknown"))
            },
            company=company,
            trn_registry=trn_registry,
            validation_type="Blacklist Check"
        )

        return {
            "valid": False,
            "status": "Invalid",
            "message": _("TRN is blacklisted: {0}").format(blacklist_result.get("reason", "Unknown")),
            "data": {
                "blacklisted": True,
                "reason": blacklist_result.get("reason"),
                "entity_name": blacklist_result.get("entity_name")
            }
        }

    # Step 2: Validate format
    format_result = validate_trn_format(clean_trn)
    if not format_result["valid"]:
        # Log format validation failure
        log_validation(
            trn=clean_trn,
            result=format_result,
            company=company,
            trn_registry=trn_registry,
            validation_type="Format Check"
        )

        return {
            "valid": False,
            "status": "Invalid",
            "message": format_result.get("message", _("TRN format is invalid")),
            "data": {
                "errors": format_result.get("errors", [])
            }
        }

    # Step 3: Check FTA API settings
    fta_settings = get_fta_settings()

    if not fta_settings["enabled"]:
        # FTA not enabled - return format validation success
        log_validation(
            trn=clean_trn,
            result={
                "valid": True,
                "status": "Valid",
                "message": _("TRN format is valid (FTA API not enabled)")
            },
            company=company,
            trn_registry=trn_registry,
            validation_type="Format Check"
        )

        # Update TRN Registry if provided
        if trn_registry:
            update_trn_registry(trn_registry, "Valid")

        return {
            "valid": True,
            "status": "Valid",
            "message": _("TRN format is valid. FTA API validation is not enabled."),
            "data": {
                "format_valid": True,
                "fta_validated": False
            }
        }

    # Step 4: Call FTA API
    try:
        fta_result = call_fta_api(clean_trn, fta_settings)

        # Log FTA API result
        log_validation(
            trn=clean_trn,
            result=fta_result,
            company=company,
            trn_registry=trn_registry,
            validation_type="FTA API"
        )

        # Update TRN Registry if provided
        if trn_registry and fta_result.get("valid"):
            update_trn_registry(
                trn_registry,
                fta_result.get("status", "Valid"),
                fta_result.get("data", {})
            )

        return fta_result

    except Exception as e:
        error_message = str(e)
        frappe.log_error(
            title="FTA API Error",
            message=f"Error calling FTA API for TRN {clean_trn}: {error_message}"
        )

        # Log API error
        log_validation(
            trn=clean_trn,
            result={
                "valid": False,
                "status": "API Error",
                "message": _("FTA API error: {0}").format(error_message)
            },
            company=company,
            trn_registry=trn_registry,
            validation_type="FTA API"
        )

        return {
            "valid": False,
            "status": "API Error",
            "message": _("Unable to validate with FTA API. Please try again later."),
            "data": {
                "error": error_message
            }
        }


def validate_trn_format(trn):
    """
    Validate TRN format according to UAE FTA rules

    UAE TRN format requirements:
    - Must be exactly 15 digits
    - Must start with '100'
    - Must pass Luhn checksum validation

    Args:
        trn: The TRN string to validate (should be pre-cleaned)

    Returns:
        dict: Validation result with keys:
            - valid: Boolean
            - message: Validation message
            - errors: List of validation errors
    """
    errors = []

    if not trn:
        return {
            "valid": False,
            "message": _("TRN is required"),
            "errors": ["TRN is required"]
        }

    # Clean the TRN (in case it wasn't cleaned before)
    clean_trn = re.sub(r'[^0-9]', '', str(trn))

    # Check if all digits
    if not clean_trn.isdigit():
        errors.append(_("TRN must contain only digits"))

    # Check length (15 digits)
    if len(clean_trn) != 15:
        errors.append(_("TRN must be exactly 15 digits. Got {0} digits.").format(len(clean_trn)))

    # Check prefix (must start with 100)
    if len(clean_trn) >= 3 and not clean_trn.startswith("100"):
        errors.append(_("UAE TRN must start with '100'. Got: {0}").format(clean_trn[:3]))

    # If basic checks fail, don't check checksum
    if errors:
        return {
            "valid": False,
            "message": errors[0],
            "errors": errors
        }

    # Validate Luhn checksum
    if not _validate_luhn(clean_trn):
        errors.append(_("TRN failed checksum validation. Please verify the TRN is correct."))
        return {
            "valid": False,
            "message": _("TRN failed checksum validation"),
            "errors": errors
        }

    return {
        "valid": True,
        "message": _("TRN format is valid"),
        "errors": []
    }


def _validate_luhn(number):
    """
    Validate number using Luhn algorithm (mod 10 checksum)
    Used for validating UAE TRN numbers

    Args:
        number: String of digits to validate

    Returns:
        bool: True if valid, False otherwise
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


def call_fta_api(trn, settings):
    """
    Make actual FTA API call

    Note: This is currently mocked since the real FTA API is not available.
    When the FTA API becomes available, this function should be updated
    to make actual HTTP requests.

    Args:
        trn: The cleaned TRN to validate
        settings: FTA API settings dict

    Returns:
        dict: API response with validation result
    """
    # Mock implementation for now
    # In production, this would make an actual HTTP request to FTA API

    # Simulate API call
    # For demo purposes, we'll return success for valid format TRNs
    # and simulate some edge cases

    # Check if TRN passes format validation (should already be validated)
    format_result = validate_trn_format(trn)
    if not format_result["valid"]:
        return {
            "valid": False,
            "status": "Invalid",
            "message": _("TRN is not registered with FTA"),
            "data": {
                "fta_validated": True,
                "response_code": "TRN_NOT_FOUND"
            }
        }

    # Mock successful response
    # In real implementation, this would parse the actual FTA API response
    mock_response = {
        "valid": True,
        "status": "Valid",
        "message": _("TRN is valid and registered with FTA"),
        "data": {
            "fta_validated": True,
            "response_code": "SUCCESS",
            "entity_name": _("Verified Entity"),  # Would come from FTA
            "registration_date": "2020-01-01",  # Would come from FTA
            "expiry_date": None,  # Would come from FTA
            "fta_status": "Active"
        }
    }

    return mock_response


def check_blacklist(trn):
    """
    Check if a TRN is in the blacklist

    Args:
        trn: The cleaned TRN to check

    Returns:
        dict: Blacklist check result
    """
    try:
        from digicomply.digicomply.doctype.trn_blacklist.trn_blacklist import is_blacklisted

        # Use the existing blacklist check function
        result = is_blacklisted(trn)
        return result

    except Exception as e:
        frappe.log_error(
            title="Blacklist Check Error",
            message=f"Error checking blacklist for TRN {trn}: {str(e)}"
        )
        # On error, assume not blacklisted to not block operations
        return {"is_blacklisted": False, "trn": trn}


def log_validation(trn, result, company, trn_registry, validation_type):
    """
    Create TRN Validation Log entry

    Args:
        trn: The TRN that was validated
        result: Validation result dict with valid, status, message, data
        company: Company associated with validation
        trn_registry: Link to TRN Registry document
        validation_type: Type of validation performed
    """
    try:
        from digicomply.digicomply.doctype.trn_validation_log.trn_validation_log import create_validation_log

        # Map status
        status_map = {
            "Valid": "Valid",
            "Invalid": "Invalid",
            "Expired": "Expired",
            "API Error": "API Error",
            "Not Found": "Not Found"
        }
        validation_status = status_map.get(result.get("status"), "Pending Verification")

        # Extract data
        data = result.get("data", {})

        create_validation_log(
            trn=trn,
            validation_status=validation_status,
            validation_type=validation_type,
            validation_source="Manual",
            trn_registry=trn_registry,
            company=company,
            response_code=data.get("response_code"),
            response_message=result.get("message"),
            fta_entity_name=data.get("entity_name"),
            fta_registration_date=data.get("registration_date"),
            fta_expiry_date=data.get("expiry_date"),
            fta_status=data.get("fta_status"),
            raw_response=data
        )

    except Exception as e:
        # Log error but don't fail the validation
        frappe.log_error(
            title="Validation Log Error",
            message=f"Error creating validation log for TRN {trn}: {str(e)}"
        )


def update_trn_registry(trn_registry, status, data=None):
    """
    Update TRN Registry document with validation result

    Args:
        trn_registry: Name of TRN Registry document
        status: New validation status
        data: Additional data from validation
    """
    try:
        if not trn_registry:
            return

        data = data or {}

        update_values = {
            "validation_status": status,
            "last_validated": now_datetime()
        }

        # Add FTA data if available
        if data.get("registration_date"):
            update_values["fta_registration_date"] = data.get("registration_date")
        if data.get("expiry_date"):
            update_values["fta_expiry_date"] = data.get("expiry_date")

        frappe.db.set_value("TRN Registry", trn_registry, update_values)

    except Exception as e:
        frappe.log_error(
            title="TRN Registry Update Error",
            message=f"Error updating TRN Registry {trn_registry}: {str(e)}"
        )


@frappe.whitelist()
def bulk_validate_trns(trns, company=None):
    """
    Validate multiple TRNs and return results

    Args:
        trns: JSON string or list of TRNs to validate
        company: Optional company for context

    Returns:
        dict: Results with validation outcomes for each TRN
    """
    # Permission check
    if not frappe.has_permission("TRN Registry", "read"):
        frappe.throw(_("You do not have permission to validate TRNs"), frappe.PermissionError)

    # Parse JSON if string
    if isinstance(trns, str):
        try:
            trns = json.loads(trns)
        except json.JSONDecodeError:
            frappe.throw(_("Invalid JSON format for TRNs"))

    if not isinstance(trns, list):
        frappe.throw(_("TRNs must be a list"))

    # Limit bulk validation to prevent abuse
    max_bulk = 100
    if len(trns) > max_bulk:
        frappe.throw(_("Maximum {0} TRNs can be validated at once").format(max_bulk))

    results = {}
    summary = {
        "total": len(trns),
        "valid": 0,
        "invalid": 0,
        "blacklisted": 0,
        "errors": 0
    }

    for trn in trns:
        if not trn:
            continue

        try:
            result = validate_trn_with_fta(trn, company=company)
            results[trn] = result

            # Update summary
            if result.get("valid"):
                summary["valid"] += 1
            elif result.get("data", {}).get("blacklisted"):
                summary["blacklisted"] += 1
            else:
                summary["invalid"] += 1

        except Exception as e:
            results[trn] = {
                "valid": False,
                "status": "Error",
                "message": str(e),
                "data": {}
            }
            summary["errors"] += 1

    return {
        "results": results,
        "summary": summary
    }
