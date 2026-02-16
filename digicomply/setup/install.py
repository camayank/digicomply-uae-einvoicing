# Copyright (c) 2024, DigiComply and contributors
# License: MIT

"""
DigiComply Installation & Setup
"""

import frappe
from frappe import _


def after_install():
    """Run after app installation"""
    create_custom_fields()
    create_default_settings()
    add_desk_icons()
    frappe.db.commit()
    print("DigiComply installed successfully!")


def before_uninstall():
    """Run before app uninstallation"""
    # Clean up custom fields
    delete_custom_fields()
    frappe.db.commit()


def after_migrate():
    """Run after migrations"""
    create_custom_fields()
    frappe.db.commit()


def create_custom_fields():
    """Create custom fields on Sales Invoice for PINT AE tracking"""
    from frappe.custom.doctype.custom_field.custom_field import create_custom_fields

    custom_fields = {
        "Sales Invoice": [
            {
                "fieldname": "digicomply_section",
                "fieldtype": "Section Break",
                "label": "DigiComply E-Invoicing",
                "insert_after": "amended_from",
                "collapsible": 1,
            },
            {
                "fieldname": "pint_ae_status",
                "fieldtype": "Select",
                "label": "PINT AE Status",
                "options": "\nPending\nSubmitted\nAccepted\nRejected\nCancelled",
                "insert_after": "digicomply_section",
                "read_only": 1,
            },
            {
                "fieldname": "asp_submission_id",
                "fieldtype": "Data",
                "label": "ASP Submission ID",
                "insert_after": "pint_ae_status",
                "read_only": 1,
            },
            {
                "fieldname": "asp_submission_date",
                "fieldtype": "Datetime",
                "label": "ASP Submission Date",
                "insert_after": "asp_submission_id",
                "read_only": 1,
            },
            {
                "fieldname": "column_break_digicomply",
                "fieldtype": "Column Break",
                "insert_after": "asp_submission_date",
            },
            {
                "fieldname": "reconciliation_status",
                "fieldtype": "Select",
                "label": "Reconciliation Status",
                "options": "\nNot Reconciled\nMatched\nMismatched\nMissing",
                "insert_after": "column_break_digicomply",
                "read_only": 1,
            },
            {
                "fieldname": "last_reconciliation",
                "fieldtype": "Link",
                "label": "Last Reconciliation",
                "options": "Reconciliation Run",
                "insert_after": "reconciliation_status",
                "read_only": 1,
            },
        ]
    }

    create_custom_fields(custom_fields)


def delete_custom_fields():
    """Remove custom fields on uninstall"""
    fields_to_delete = [
        "Sales Invoice-digicomply_section",
        "Sales Invoice-pint_ae_status",
        "Sales Invoice-asp_submission_id",
        "Sales Invoice-asp_submission_date",
        "Sales Invoice-column_break_digicomply",
        "Sales Invoice-reconciliation_status",
        "Sales Invoice-last_reconciliation",
    ]

    for field in fields_to_delete:
        if frappe.db.exists("Custom Field", field):
            frappe.delete_doc("Custom Field", field, ignore_permissions=True)


def create_default_settings():
    """Create default DigiComply Settings"""
    if not frappe.db.exists("DigiComply Settings"):
        settings = frappe.get_doc({
            "doctype": "DigiComply Settings",
            "compliance_target": 95,
            "penalty_per_invoice": 5000,
            "fta_deadline_reminder_days": 7,
            "enable_email_alerts": 1,
            "alert_threshold": 85,
        })
        settings.insert(ignore_permissions=True)


def add_desk_icons():
    """Add desktop icons for DigiComply"""
    icons = [
        {
            "module_name": "DigiComply",
            "label": "Compliance Dashboard",
            "link": "compliance_dashboard",
            "type": "page",
            "icon": "fa fa-check-circle",
            "color": "#2563eb",
        },
        {
            "module_name": "DigiComply",
            "label": "Reconciliation",
            "link": "List/Reconciliation Run",
            "type": "link",
            "icon": "fa fa-refresh",
            "color": "#059669",
        },
        {
            "module_name": "DigiComply",
            "label": "CSV Import",
            "link": "List/CSV Import",
            "type": "link",
            "icon": "fa fa-upload",
            "color": "#d97706",
        },
        {
            "module_name": "DigiComply",
            "label": "Mismatch Reports",
            "link": "List/Mismatch Report",
            "type": "link",
            "icon": "fa fa-file-pdf-o",
            "color": "#dc2626",
        },
    ]

    for icon in icons:
        name = f"{icon['module_name']}-{icon['label']}"
        if not frappe.db.exists("Desktop Icon", name):
            try:
                doc = frappe.get_doc({
                    "doctype": "Desktop Icon",
                    "module_name": icon["module_name"],
                    "label": icon["label"],
                    "link": icon["link"],
                    "type": icon["type"],
                    "icon": icon["icon"],
                    "color": icon["color"],
                    "standard": 1,
                })
                doc.insert(ignore_permissions=True)
            except Exception:
                pass  # Desktop Icon might not exist in all Frappe versions
