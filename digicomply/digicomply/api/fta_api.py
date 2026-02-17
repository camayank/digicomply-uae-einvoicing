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
import time
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry


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

        # Get FTA API configuration from settings
        fta_enabled = getattr(settings, "enable_fta_validation", False) or False
        fta_api_url = getattr(settings, "fta_api_url", "") or "https://tax.gov.ae/api/v1"
        fta_api_key = settings.get_password("fta_api_key") if hasattr(settings, "get_password") else ""
        fta_timeout = cint(getattr(settings, "fta_api_timeout", 30)) or 30

        return {
            "api_url": fta_api_url,
            "api_key": fta_api_key or "",
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
            "data": {}
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
    Make actual FTA API call with retry logic and fault tolerance

    Real FTA TRN validation API call with:
    - Exponential backoff retry logic (3 retries, 1s/2s/4s delays)
    - SSL certificate verification
    - Request/response logging for audit trail
    - Timeout handling (30s connect, 60s read)

    Args:
        trn: The cleaned TRN to validate
        settings: FTA API settings dict with api_url, api_key, timeout

    Returns:
        dict: API response with validation result
    """
    # Create session with retry strategy
    session = requests.Session()

    # Retry strategy with exponential backoff
    retry_strategy = Retry(
        total=3,
        backoff_factor=1,  # 1s, 2s, 4s delays
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["HEAD", "GET", "POST", "OPTIONS"]
    )
    adapter = HTTPAdapter(max_retries=retry_strategy)
    session.mount("https://", adapter)
    session.mount("http://", adapter)

    # Get endpoint from settings or use production default
    base_url = settings.get("api_url") or "https://tax.gov.ae/api/v1"
    # Ensure base_url doesn't have trailing slash
    base_url = base_url.rstrip("/")
    endpoint = f"{base_url}/trn/validate"

    # Get timeout from settings (default: 30s connect, 60s read)
    timeout_seconds = cint(settings.get("timeout")) or 30
    timeout = (timeout_seconds, timeout_seconds * 2)  # (connect, read)

    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "DigiComply/1.0"
    }

    # Add authorization if API key is provided
    api_key = settings.get("api_key")
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    request_payload = {"trn": trn}

    # Log the API request for audit trail
    _log_api_request(trn, endpoint, request_payload)

    try:
        response = session.post(
            endpoint,
            json=request_payload,
            headers=headers,
            timeout=timeout,
            verify=True  # SSL verification enabled
        )

        # Log raw response
        _log_api_response(trn, response.status_code, response.text)

        # Handle HTTP errors
        response.raise_for_status()

        # Parse response
        response_data = response.json()

        # Map FTA response to our standard format
        return _parse_fta_response(trn, response_data)

    except requests.exceptions.Timeout as e:
        frappe.log_error(
            title="FTA API Timeout",
            message=f"Timeout calling FTA API for TRN {trn}: {str(e)}"
        )
        return {
            "valid": False,
            "status": "API Error",
            "message": _("FTA API request timed out. Please try again."),
            "data": {
                "error_type": "timeout",
                "error": str(e)
            }
        }

    except requests.exceptions.ConnectionError as e:
        frappe.log_error(
            title="FTA API Connection Error",
            message=f"Connection error calling FTA API for TRN {trn}: {str(e)}"
        )
        return {
            "valid": False,
            "status": "API Error",
            "message": _("Unable to connect to FTA API. Please check your network connection."),
            "data": {
                "error_type": "connection",
                "error": str(e)
            }
        }

    except requests.exceptions.HTTPError as e:
        status_code = e.response.status_code if e.response else None
        frappe.log_error(
            title="FTA API HTTP Error",
            message=f"HTTP error {status_code} calling FTA API for TRN {trn}: {str(e)}"
        )

        # Handle specific HTTP error codes
        if status_code == 401:
            return {
                "valid": False,
                "status": "API Error",
                "message": _("FTA API authentication failed. Please check API credentials."),
                "data": {"error_type": "authentication", "status_code": status_code}
            }
        elif status_code == 403:
            return {
                "valid": False,
                "status": "API Error",
                "message": _("Access denied to FTA API. Please verify permissions."),
                "data": {"error_type": "authorization", "status_code": status_code}
            }
        elif status_code == 404:
            # TRN not found in FTA database
            return {
                "valid": False,
                "status": "Not Found",
                "message": _("TRN not found in FTA database."),
                "data": {"error_type": "not_found", "status_code": status_code}
            }
        elif status_code == 429:
            return {
                "valid": False,
                "status": "API Error",
                "message": _("FTA API rate limit exceeded. Please try again later."),
                "data": {"error_type": "rate_limit", "status_code": status_code}
            }
        else:
            return {
                "valid": False,
                "status": "API Error",
                "message": _("FTA API returned error: {0}").format(status_code),
                "data": {"error_type": "http_error", "status_code": status_code}
            }

    except requests.exceptions.RequestException as e:
        frappe.log_error(
            title="FTA API Request Error",
            message=f"Request error calling FTA API for TRN {trn}: {str(e)}"
        )
        return {
            "valid": False,
            "status": "API Error",
            "message": _("FTA API request failed: {0}").format(str(e)),
            "data": {
                "error_type": "request_error",
                "error": str(e)
            }
        }

    except json.JSONDecodeError as e:
        frappe.log_error(
            title="FTA API Response Parse Error",
            message=f"Failed to parse FTA API response for TRN {trn}: {str(e)}"
        )
        return {
            "valid": False,
            "status": "API Error",
            "message": _("Invalid response from FTA API."),
            "data": {
                "error_type": "parse_error",
                "error": str(e)
            }
        }

    finally:
        session.close()


def _log_api_request(trn, endpoint, payload):
    """Log API request for audit trail"""
    try:
        frappe.logger().info(
            f"FTA API Request - TRN: {trn}, Endpoint: {endpoint}"
        )
    except Exception:
        pass  # Don't fail on logging errors


def _log_api_response(trn, status_code, response_text):
    """Log API response for audit trail"""
    try:
        # Truncate response if too long
        response_preview = response_text[:500] if len(response_text) > 500 else response_text
        frappe.logger().info(
            f"FTA API Response - TRN: {trn}, Status: {status_code}, Response: {response_preview}"
        )
    except Exception:
        pass  # Don't fail on logging errors


def _parse_fta_response(trn, response_data):
    """
    Parse FTA API response into standard format

    Args:
        trn: The TRN that was validated
        response_data: Raw response dict from FTA API

    Returns:
        dict: Standardized validation result
    """
    # FTA API response format (expected):
    # {
    #     "success": true,
    #     "trn": "100000000000003",
    #     "status": "active",
    #     "entityName": "Company Name",
    #     "registrationDate": "2020-01-01",
    #     "expiryDate": null
    # }

    is_valid = response_data.get("success", False) or response_data.get("valid", False)
    fta_status = response_data.get("status", "").lower()

    # Map FTA status to our status
    if is_valid and fta_status in ["active", "valid"]:
        status = "Valid"
        message = _("TRN is valid and registered with FTA")
    elif fta_status == "expired":
        status = "Expired"
        message = _("TRN registration has expired")
        is_valid = False
    elif fta_status == "suspended":
        status = "Invalid"
        message = _("TRN registration is suspended")
        is_valid = False
    elif fta_status == "deregistered":
        status = "Invalid"
        message = _("TRN has been deregistered")
        is_valid = False
    else:
        status = "Invalid" if not is_valid else "Valid"
        message = response_data.get("message", _("TRN validation completed"))

    return {
        "valid": is_valid,
        "status": status,
        "message": message,
        "data": {
            "fta_validated": True,
            "response_code": "SUCCESS" if is_valid else "FAILED",
            "entity_name": response_data.get("entityName") or response_data.get("entity_name"),
            "registration_date": response_data.get("registrationDate") or response_data.get("registration_date"),
            "expiry_date": response_data.get("expiryDate") or response_data.get("expiry_date"),
            "fta_status": response_data.get("status", "").title()
        }
    }


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

    Returns:
        bool: True if update was successful, False otherwise
    """
    try:
        if not trn_registry:
            return False

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
        return True

    except Exception as e:
        frappe.log_error(
            title="TRN Registry Update Error",
            message=f"Error updating TRN Registry {trn_registry}: {str(e)}"
        )
        return False


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

    # Validate each TRN is a non-empty string
    for i, trn in enumerate(trns):
        if not isinstance(trn, str) or not trn.strip():
            frappe.throw(_("TRN at position {0} must be a non-empty string").format(i+1))

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
