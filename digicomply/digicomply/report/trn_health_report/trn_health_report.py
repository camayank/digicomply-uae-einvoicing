# Copyright (c) 2024, DigiComply and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.utils import now_datetime, date_diff, getdate


def execute(filters=None):
    columns = get_columns()
    data = get_data(filters)
    return columns, data


def get_columns():
    return [
        {
            "fieldname": "name",
            "label": _("TRN"),
            "fieldtype": "Link",
            "options": "TRN Registry",
            "width": 120
        },
        {
            "fieldname": "entity_name",
            "label": _("Entity Name"),
            "fieldtype": "Data",
            "width": 200
        },
        {
            "fieldname": "company",
            "label": _("Company"),
            "fieldtype": "Link",
            "options": "Company",
            "width": 180
        },
        {
            "fieldname": "validation_status",
            "label": _("Validation Status"),
            "fieldtype": "Data",
            "width": 140
        },
        {
            "fieldname": "last_validated",
            "label": _("Last Validated"),
            "fieldtype": "Datetime",
            "width": 160
        },
        {
            "fieldname": "is_primary",
            "label": _("Is Primary"),
            "fieldtype": "Check",
            "width": 90
        },
        {
            "fieldname": "days_since_validation",
            "label": _("Days Since Validation"),
            "fieldtype": "Int",
            "width": 150
        }
    ]


def get_data(filters):
    conditions = get_conditions(filters)

    data = frappe.db.sql("""
        SELECT
            name,
            trn,
            entity_name,
            company,
            validation_status,
            last_validated,
            is_primary
        FROM `tabTRN Registry`
        WHERE is_active = 1
        {conditions}
        ORDER BY
            CASE validation_status
                WHEN 'Invalid' THEN 1
                WHEN 'Expired' THEN 2
                WHEN 'Not Validated' THEN 3
                WHEN 'Pending Verification' THEN 4
                WHEN 'Valid' THEN 5
                ELSE 6
            END,
            last_validated ASC
    """.format(conditions=conditions), filters, as_dict=True)

    # Calculate days since validation
    current_date = getdate(now_datetime())
    for row in data:
        if row.last_validated:
            row["days_since_validation"] = date_diff(current_date, getdate(row.last_validated))
        else:
            row["days_since_validation"] = None

    return data


def get_conditions(filters):
    conditions = []

    if filters.get("company"):
        conditions.append("AND company = %(company)s")

    if filters.get("validation_status"):
        conditions.append("AND validation_status = %(validation_status)s")

    if filters.get("show_only_invalid"):
        conditions.append("AND validation_status IN ('Invalid', 'Expired', 'Not Validated')")

    return " ".join(conditions)
