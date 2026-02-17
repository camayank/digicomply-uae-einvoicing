# Copyright (c) 2024, DigiComply and contributors
# License: MIT

"""
TRN Health Center - Backend API

Provides endpoints for:
- TRN health summary and listing
- Bulk TRN validation
"""

import frappe
from frappe import _
from frappe.utils import now_datetime, getdate, today


@frappe.whitelist()
def get_trn_health_data(company=None):
    """
    Get TRN health summary and list of TRNs.

    Args:
        company: Optional company filter

    Returns:
        dict: {
            "summary": {
                "valid": count,
                "invalid": count,
                "expired": count,
                "not_validated": count,
                "total": count
            },
            "trns": [list of TRN records]
        }
    """
    # Permission check
    if not frappe.has_permission("TRN Registry", "read"):
        frappe.throw(_("You do not have permission to view TRN data"), frappe.PermissionError)

    # Build filters
    filters = {"is_active": 1}
    if company:
        filters["company"] = company

    # Get all TRNs with the filters
    trns = frappe.get_all(
        "TRN Registry",
        filters=filters,
        fields=[
            "name",
            "trn",
            "entity_name",
            "company",
            "validation_status",
            "last_validated",
            "fta_expiry_date",
            "is_primary",
            "entity_type"
        ],
        order_by="company asc, entity_name asc"
    )

    # Check for expired TRNs and update status
    today_date = getdate(today())
    for trn in trns:
        if trn.fta_expiry_date and getdate(trn.fta_expiry_date) < today_date:
            if trn.validation_status != "Expired":
                # Update status in database
                frappe.db.set_value("TRN Registry", trn.name, "validation_status", "Expired")
                trn.validation_status = "Expired"

    # Calculate summary
    summary = {
        "valid": 0,
        "invalid": 0,
        "expired": 0,
        "not_validated": 0,
        "total": len(trns)
    }

    for trn in trns:
        status = trn.validation_status or "Not Validated"
        if status == "Valid":
            summary["valid"] += 1
        elif status == "Invalid":
            summary["invalid"] += 1
        elif status == "Expired":
            summary["expired"] += 1
        else:  # Not Validated, Pending Verification, etc.
            summary["not_validated"] += 1

    return {
        "summary": summary,
        "trns": trns
    }


@frappe.whitelist()
def bulk_validate_all(company=None):
    """
    Validate all TRNs for a company (or all companies if none specified).

    Args:
        company: Optional company filter

    Returns:
        dict: {
            "success": bool,
            "message": str,
            "results": {
                "total": count,
                "valid": count,
                "invalid": count,
                "errors": count
            }
        }
    """
    # Permission check
    if not frappe.has_permission("TRN Registry", "write"):
        frappe.throw(_("You do not have permission to validate TRNs"), frappe.PermissionError)

    # Build filters
    filters = {"is_active": 1}
    if company:
        filters["company"] = company

    # Get all TRNs to validate
    trns = frappe.get_all(
        "TRN Registry",
        filters=filters,
        fields=["name", "trn", "company"]
    )

    if not trns:
        return {
            "success": True,
            "message": _("No TRNs found to validate"),
            "results": {
                "total": 0,
                "valid": 0,
                "invalid": 0,
                "errors": 0
            }
        }

    # Import the bulk validation function
    from digicomply.digicomply.api.fta_api import bulk_validate_trns

    # Extract TRN numbers
    trn_numbers = [t.trn for t in trns]

    # Perform bulk validation
    try:
        validation_result = bulk_validate_trns(trn_numbers, company=company)

        # Update TRN Registry records with results
        results_map = validation_result.get("results", {})
        for trn_doc in trns:
            trn_result = results_map.get(trn_doc.trn, {})
            if trn_result:
                new_status = "Valid" if trn_result.get("valid") else "Invalid"
                frappe.db.set_value(
                    "TRN Registry",
                    trn_doc.name,
                    {
                        "validation_status": new_status,
                        "last_validated": now_datetime()
                    }
                )

        frappe.db.commit()

        summary = validation_result.get("summary", {})
        return {
            "success": True,
            "message": _("Successfully validated {0} TRNs").format(summary.get("total", 0)),
            "results": {
                "total": summary.get("total", 0),
                "valid": summary.get("valid", 0),
                "invalid": summary.get("invalid", 0) + summary.get("blacklisted", 0),
                "errors": summary.get("errors", 0)
            }
        }

    except Exception as e:
        frappe.log_error(
            title="Bulk TRN Validation Error",
            message=f"Error during bulk validation: {str(e)}"
        )
        return {
            "success": False,
            "message": _("Error during validation: {0}").format(str(e)),
            "results": {
                "total": len(trns),
                "valid": 0,
                "invalid": 0,
                "errors": len(trns)
            }
        }


@frappe.whitelist()
def validate_single_trn(trn_name):
    """
    Validate a single TRN by its document name.

    Args:
        trn_name: The name of the TRN Registry document

    Returns:
        dict: Validation result
    """
    # Permission check
    if not frappe.has_permission("TRN Registry", "write"):
        frappe.throw(_("You do not have permission to validate TRNs"), frappe.PermissionError)

    # Get the TRN document
    trn_doc = frappe.get_doc("TRN Registry", trn_name)

    # Import validation function
    from digicomply.digicomply.api.fta_api import validate_trn_with_fta

    # Validate
    result = validate_trn_with_fta(
        trn=trn_doc.trn,
        company=trn_doc.company,
        trn_registry=trn_name
    )

    # Update the TRN Registry document
    new_status = "Valid" if result.get("valid") else "Invalid"
    if result.get("status") == "Expired":
        new_status = "Expired"

    frappe.db.set_value(
        "TRN Registry",
        trn_name,
        {
            "validation_status": new_status,
            "last_validated": now_datetime()
        }
    )

    frappe.db.commit()

    return {
        "success": result.get("valid", False),
        "status": new_status,
        "message": result.get("message", ""),
        "data": result.get("data", {})
    }
