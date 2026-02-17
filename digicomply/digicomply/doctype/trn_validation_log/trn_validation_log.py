# Copyright (c) 2024, DigiComply and contributors
# License: MIT

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import now_datetime


class TRNValidationLog(Document):
    """
    TRN Validation Log - Tracks all TRN validation attempts

    Features:
    - Automatic timestamp on creation
    - Updates linked TRN Registry on status change
    - Provides validation history lookup
    """

    def before_insert(self):
        """Set validation_date if not provided"""
        if not self.validation_date:
            self.validation_date = now_datetime()

    def on_update(self):
        """Update linked TRN Registry record if validation status changed"""
        self.update_trn_registry_status()

    def update_trn_registry_status(self):
        """
        Update the linked TRN Registry record with the validation result

        Only updates for final statuses: Valid, Invalid, Expired
        """
        if not self.trn_registry:
            return

        # Only update for definitive statuses
        if self.validation_status not in ("Valid", "Invalid", "Expired"):
            return

        try:
            new_status = self.validation_status

            # Check if status actually changed
            current_status = frappe.db.get_value("TRN Registry", self.trn_registry, "validation_status")
            if current_status == new_status:
                return

            # Build update dict
            update_values = {
                "validation_status": new_status,
                "last_validated": self.validation_date,
            }

            # Update FTA fields if available
            if self.fta_registration_date:
                update_values["fta_registration_date"] = self.fta_registration_date
            if self.fta_expiry_date:
                update_values["fta_expiry_date"] = self.fta_expiry_date

            frappe.db.set_value(
                "TRN Registry",
                self.trn_registry,
                update_values
            )

        except frappe.DoesNotExistError:
            frappe.log_error(
                title="TRN Validation Log - Registry Update Failed",
                message=f"TRN Registry {self.trn_registry} not found for validation log {self.name}"
            )
        except Exception as e:
            frappe.log_error(
                title="TRN Validation Log - Registry Update Error",
                message=f"Error updating TRN Registry {self.trn_registry}: {str(e)}"
            )


@frappe.whitelist()
def get_validation_history(trn, limit=20):
    """
    Get validation history for a specific TRN

    Args:
        trn: The TRN to get history for
        limit: Maximum number of records to return (default 20, max 100)

    Returns:
        list of validation log records
    """
    frappe.has_permission("TRN Validation Log", throw=True)

    if not trn:
        frappe.throw(_("TRN is required"))

    # Cap the limit to prevent abuse
    limit = min(int(limit or 20), 100)

    # Clean the TRN
    clean_trn = trn.replace(" ", "").replace("-", "")

    logs = frappe.get_all(
        "TRN Validation Log",
        filters={"trn": clean_trn},
        fields=[
            "name",
            "trn",
            "trn_registry",
            "company",
            "validation_type",
            "validation_source",
            "validation_status",
            "validation_date",
            "response_code",
            "response_message",
            "fta_entity_name",
            "fta_status",
            "fta_registration_date",
            "fta_expiry_date"
        ],
        order_by="validation_date desc",
        limit_page_length=limit
    )

    return logs


@frappe.whitelist()
def get_latest_validation(trn):
    """
    Get the most recent validation result for a TRN

    Args:
        trn: The TRN to check

    Returns:
        dict with latest validation details or None
    """
    frappe.has_permission("TRN Validation Log", throw=True)

    if not trn:
        return None

    clean_trn = trn.replace(" ", "").replace("-", "")

    latest = frappe.get_all(
        "TRN Validation Log",
        filters={"trn": clean_trn},
        fields=[
            "name",
            "validation_status",
            "validation_date",
            "validation_type",
            "fta_entity_name",
            "response_message"
        ],
        order_by="validation_date desc",
        limit_page_length=1
    )

    return latest[0] if latest else None


def create_validation_log(
    trn,
    validation_status,
    validation_type="Format Check",
    validation_source="Manual",
    trn_registry=None,
    company=None,
    response_code=None,
    response_message=None,
    fta_entity_name=None,
    fta_registration_date=None,
    fta_expiry_date=None,
    fta_status=None,
    raw_response=None
):
    """
    Create a new TRN Validation Log entry

    Args:
        trn: The TRN that was validated
        validation_status: Result of validation (Valid, Invalid, etc.)
        validation_type: Type of validation performed
        validation_source: Source of the validation request
        trn_registry: Link to TRN Registry document
        company: Company associated with the TRN
        response_code: API response code if applicable
        response_message: Validation message or error details
        fta_entity_name: Entity name from FTA
        fta_registration_date: Registration date from FTA
        fta_expiry_date: Expiry date from FTA
        fta_status: Status from FTA
        raw_response: Complete API response as JSON string

    Returns:
        The created TRN Validation Log document
    """
    import json

    # Clean the TRN
    clean_trn = trn.replace(" ", "").replace("-", "") if trn else ""

    doc = frappe.get_doc({
        "doctype": "TRN Validation Log",
        "trn": clean_trn,
        "trn_registry": trn_registry,
        "company": company,
        "validation_type": validation_type,
        "validation_source": validation_source,
        "validation_status": validation_status,
        "validation_date": now_datetime(),
        "response_code": response_code,
        "response_message": response_message,
        "fta_entity_name": fta_entity_name,
        "fta_registration_date": fta_registration_date,
        "fta_expiry_date": fta_expiry_date,
        "fta_status": fta_status,
        "raw_response": json.dumps(raw_response) if isinstance(raw_response, dict) else raw_response
    })

    doc.flags.ignore_permissions = True
    doc.insert()

    return doc


@frappe.whitelist()
def get_validation_stats(company=None, days=30):
    """
    Get validation statistics for dashboard

    Args:
        company: Filter by company (optional)
        days: Number of days to look back (default 30)

    Returns:
        dict with validation statistics
    """
    from frappe.utils import add_days, getdate, today

    filters = {}
    if company:
        filters["company"] = company

    start_date = add_days(today(), -days)
    filters["validation_date"] = (">=", start_date)

    # Get counts by status
    stats = {
        "total": 0,
        "valid": 0,
        "invalid": 0,
        "expired": 0,
        "not_found": 0,
        "api_error": 0,
        "pending": 0
    }

    results = frappe.get_all(
        "TRN Validation Log",
        filters=filters,
        fields=["validation_status", "count(*) as count"],
        group_by="validation_status"
    )

    for row in results:
        status_key = row.validation_status.lower().replace(" ", "_") if row.validation_status else "pending"
        if status_key in stats:
            stats[status_key] = row.count
        stats["total"] += row.count

    return stats
