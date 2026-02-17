# Copyright (c) 2026, DigiComply and contributors
# For license information, please see license.txt

import frappe


@frappe.whitelist()
def get_auditor_info():
    """Get current auditor's access information"""
    user = frappe.session.user

    # Find auditor access for this user
    access = frappe.db.get_value(
        "Auditor Access",
        {"auditor_email": user, "access_status": "Active"},
        ["name", "company", "access_status", "valid_until", "access_level",
         "audit_type", "documents_accessed", "date_range_from", "date_range_to"],
        as_dict=True
    )

    if not access:
        return {
            "access_status": "No Active Access",
            "company": None,
            "available_documents": 0
        }

    # Count available documents
    filters = {"company": access.company}
    if access.date_range_from:
        filters["archive_date"] = [">=", access.date_range_from]

    available_docs = frappe.db.count("Document Archive", filters)

    access["available_documents"] = available_docs
    return access


@frappe.whitelist()
def get_my_requests():
    """Get audit requests for current auditor"""
    user = frappe.session.user

    # Get auditor access
    access_name = frappe.db.get_value(
        "Auditor Access",
        {"auditor_email": user},
        "name"
    )

    if not access_name:
        return []

    return frappe.get_all(
        "Audit Request",
        filters={"auditor_access": access_name},
        fields=["name", "request_subject", "status", "priority", "request_date"],
        order_by="creation desc",
        limit=10
    )


@frappe.whitelist()
def get_available_reports():
    """Get reports available to auditor"""
    user = frappe.session.user

    # Get auditor access
    access = frappe.db.get_value(
        "Auditor Access",
        {"auditor_email": user, "access_status": "Active"},
        ["company", "date_range_from", "date_range_to"],
        as_dict=True
    )

    if not access:
        return []

    filters = {"company": access.company, "status": ["in", ["Generated", "Reviewed", "Submitted"]]}

    if access.date_range_from and access.date_range_to:
        filters["from_date"] = [">=", access.date_range_from]
        filters["to_date"] = ["<=", access.date_range_to]

    return frappe.get_all(
        "FTA Report",
        filters=filters,
        fields=["name", "report_title", "report_type", "from_date", "to_date", "status"],
        order_by="creation desc",
        limit=10
    )
