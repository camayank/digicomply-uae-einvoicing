# Copyright (c) 2024, DigiComply and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.utils import flt, formatdate


def execute(filters=None):
    columns = get_columns()
    data = get_data(filters)
    return columns, data


def get_columns():
    return [
        {
            "fieldname": "period",
            "label": _("Period"),
            "fieldtype": "Data",
            "width": 180
        },
        {
            "fieldname": "company",
            "label": _("Company"),
            "fieldtype": "Link",
            "options": "Company",
            "width": 180
        },
        {
            "fieldname": "output_vat",
            "label": _("Output VAT"),
            "fieldtype": "Currency",
            "width": 140
        },
        {
            "fieldname": "input_vat_recoverable",
            "label": _("Input VAT Recoverable"),
            "fieldtype": "Currency",
            "width": 160
        },
        {
            "fieldname": "adjustments",
            "label": _("Adjustments"),
            "fieldtype": "Currency",
            "width": 120
        },
        {
            "fieldname": "net_vat_due",
            "label": _("Net VAT Due"),
            "fieldtype": "Currency",
            "width": 140
        },
        {
            "fieldname": "status",
            "label": _("Status"),
            "fieldtype": "Data",
            "width": 120
        }
    ]


def get_data(filters):
    conditions = get_conditions(filters)

    data = frappe.db.sql("""
        SELECT
            name,
            company,
            from_date,
            to_date,
            tax_period,
            output_vat_amount as output_vat,
            input_vat_recoverable,
            total_adjustments as adjustments,
            net_vat_due,
            status
        FROM `tabVAT Return`
        WHERE docstatus < 2
        {conditions}
        ORDER BY from_date DESC, company ASC
    """.format(conditions=conditions), filters, as_dict=True)

    # Format period and calculate totals
    total_output_vat = 0
    total_input_vat = 0
    total_adjustments = 0
    total_net_vat = 0

    for row in data:
        # Format period as readable string
        from_date_str = formatdate(row.from_date, "dd MMM yyyy") if row.from_date else ""
        to_date_str = formatdate(row.to_date, "dd MMM yyyy") if row.to_date else ""
        row["period"] = f"{from_date_str} - {to_date_str}"

        # Accumulate totals
        total_output_vat += flt(row.output_vat)
        total_input_vat += flt(row.input_vat_recoverable)
        total_adjustments += flt(row.adjustments)
        total_net_vat += flt(row.net_vat_due)

    # Add totals row if there is data
    if data:
        data.append({
            "period": "<b>Total</b>",
            "company": "",
            "output_vat": total_output_vat,
            "input_vat_recoverable": total_input_vat,
            "adjustments": total_adjustments,
            "net_vat_due": total_net_vat,
            "status": "",
            "is_total_row": True
        })

    return data


def get_conditions(filters):
    conditions = []

    if filters.get("company"):
        conditions.append("AND company = %(company)s")

    if filters.get("from_date"):
        conditions.append("AND from_date >= %(from_date)s")

    if filters.get("to_date"):
        conditions.append("AND to_date <= %(to_date)s")

    if filters.get("status"):
        conditions.append("AND status = %(status)s")

    return " ".join(conditions)
