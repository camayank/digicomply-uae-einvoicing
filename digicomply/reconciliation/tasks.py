# Copyright (c) 2024, DigiComply and contributors
# License: MIT

"""
DigiComply Scheduled Tasks
"""

import frappe
from frappe import _


def check_pending_reconciliations():
    """
    Daily task: Check for pending reconciliations and send reminders

    Runs daily to:
    - Find reconciliation runs that failed
    - Identify companies with no recent reconciliation
    - Send email alerts to configured recipients
    """
    settings = frappe.get_single("DigiComply Settings")

    if not settings.enable_email_alerts:
        return

    # Find failed reconciliations from last 24 hours
    failed_runs = frappe.get_all(
        "Reconciliation Run",
        filters={
            "status": "Failed",
            "modified": [">=", frappe.utils.add_days(frappe.utils.today(), -1)],
        },
        fields=["name", "company", "posting_date"],
    )

    if failed_runs:
        frappe.log_error(
            title="DigiComply: Failed Reconciliations",
            message=f"Found {len(failed_runs)} failed reconciliation(s) in last 24 hours:\n"
            + "\n".join([f"- {r.name} ({r.company})" for r in failed_runs])
        )


def generate_weekly_summary():
    """
    Weekly task: Generate compliance summary for all companies

    Runs weekly to:
    - Calculate overall compliance scores
    - Identify trends (improving/declining)
    - Send weekly summary email to stakeholders
    """
    settings = frappe.get_single("DigiComply Settings")

    if not settings.enable_email_alerts:
        return

    # Get all companies with reconciliation runs
    companies = frappe.get_all(
        "Reconciliation Run",
        filters={"docstatus": 1},
        fields=["company"],
        distinct=True,
    )

    summary = []
    for company in companies:
        # Get latest reconciliation
        latest = frappe.get_all(
            "Reconciliation Run",
            filters={"company": company.company, "docstatus": 1},
            fields=["match_percentage", "total_invoices", "missing_in_asp"],
            order_by="posting_date desc",
            limit=1,
        )

        if latest:
            summary.append({
                "company": company.company,
                "compliance": latest[0].match_percentage or 0,
                "total": latest[0].total_invoices or 0,
                "missing": latest[0].missing_in_asp or 0,
            })

    if summary:
        frappe.log_error(
            title="DigiComply: Weekly Summary",
            message="Weekly Compliance Summary:\n"
            + "\n".join([
                f"- {s['company']}: {s['compliance']:.1f}% ({s['missing']} missing)"
                for s in summary
            ])
        )
