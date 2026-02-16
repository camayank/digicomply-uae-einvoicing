# Copyright (c) 2024, DigiComply and contributors
# License: MIT

"""
DigiComply API - Public endpoints for dashboard and integrations
"""

import frappe
from frappe import _
from frappe.utils import flt, getdate, today, add_months, get_first_day, get_last_day
from datetime import datetime, timedelta


def get_fta_deadline_info():
    """
    Calculate next FTA filing deadline and days remaining.
    UAE e-invoicing requires monthly filing by the 28th of following month.
    """
    today_date = getdate(today())
    current_month = today_date.month
    current_year = today_date.year

    # Deadline is 28th of current month for previous month's invoices
    # If today is past 28th, deadline is next month's 28th
    if today_date.day <= 28:
        deadline_date = today_date.replace(day=28)
        reporting_month = add_months(today_date, -1)
    else:
        next_month = add_months(today_date, 1)
        deadline_date = getdate(next_month).replace(day=28)
        reporting_month = today_date

    days_remaining = (deadline_date - today_date).days

    # Determine urgency level
    if days_remaining <= 3:
        urgency = "critical"
    elif days_remaining <= 7:
        urgency = "warning"
    else:
        urgency = "normal"

    return {
        "deadline_date": str(deadline_date),
        "days_remaining": days_remaining,
        "reporting_period": reporting_month.strftime("%B %Y"),
        "urgency": urgency,
    }


@frappe.whitelist()
def get_dashboard_data(company=None):
    """
    Get dashboard summary data

    Args:
        company: Optional company filter

    Returns:
        dict with summary metrics and recent runs
    """
    filters = {"status": ["in", ["Completed", "In Progress"]]}
    if company:
        filters["company"] = company

    # Get all completed reconciliation runs
    runs = frappe.get_all(
        "Reconciliation Run",
        filters=filters,
        fields=[
            "name",
            "company",
            "posting_date",
            "status",
            "total_invoices",
            "matched_count",
            "mismatched_count",
            "missing_in_asp",
            "missing_in_erp",
            "match_percentage",
            "from_date",
            "to_date",
        ],
        order_by="posting_date desc",
        limit=20
    )

    # Aggregate totals from most recent run per company
    # or sum across all if no company filter
    if runs:
        # Use totals from most recent run
        latest = runs[0]
        total_invoices = latest.total_invoices or 0
        matched_count = latest.matched_count or 0
        mismatched_count = latest.mismatched_count or 0
        missing_in_asp = latest.missing_in_asp or 0
        missing_in_erp = latest.missing_in_erp or 0

        if total_invoices > 0:
            compliance_score = (matched_count / total_invoices) * 100
        else:
            compliance_score = 0
    else:
        total_invoices = 0
        matched_count = 0
        mismatched_count = 0
        missing_in_asp = 0
        missing_in_erp = 0
        compliance_score = 0

    # Get FTA deadline info
    fta_deadline = get_fta_deadline_info()

    # Get pending CSV imports count
    pending_imports = frappe.db.count("CSV Import", {"status": "Pending"})

    return {
        "total_invoices": total_invoices,
        "matched_count": matched_count,
        "mismatched_count": mismatched_count,
        "missing_in_asp": missing_in_asp,
        "missing_in_erp": missing_in_erp,
        "compliance_score": flt(compliance_score, 2),
        "recent_runs": runs[:10],
        "fta_deadline": fta_deadline,
        "pending_imports": pending_imports,
        "potential_penalty": (missing_in_asp + mismatched_count) * 5000,  # AED 5000 per issue
    }


@frappe.whitelist()
def get_compliance_summary(company, from_date, to_date):
    """
    Get compliance summary for date range

    Args:
        company: Company name
        from_date: Start date
        to_date: End date

    Returns:
        dict with compliance metrics
    """
    # Get reconciliation runs in date range
    runs = frappe.get_all(
        "Reconciliation Run",
        filters={
            "company": company,
            "from_date": [">=", from_date],
            "to_date": ["<=", to_date],
            "docstatus": 1,
        },
        fields=[
            "name",
            "total_invoices",
            "matched_count",
            "mismatched_count",
            "missing_in_asp",
            "match_percentage",
        ]
    )

    if not runs:
        return {
            "status": "no_data",
            "message": _("No reconciliations found for this period")
        }

    # Aggregate
    total = sum(r.total_invoices or 0 for r in runs)
    matched = sum(r.matched_count or 0 for r in runs)
    mismatched = sum(r.mismatched_count or 0 for r in runs)
    missing = sum(r.missing_in_asp or 0 for r in runs)

    return {
        "status": "success",
        "total_invoices": total,
        "matched": matched,
        "mismatched": mismatched,
        "missing_in_asp": missing,
        "compliance_score": flt((matched / total * 100) if total else 0, 2),
        "potential_penalty": missing * 5000,  # AED 5000 per unreported invoice
        "run_count": len(runs),
    }


@frappe.whitelist()
def quick_reconcile(company, asp_provider, csv_file):
    """
    Quick reconciliation - one-click reconcile

    Args:
        company: Company name
        asp_provider: ASP provider name
        csv_file: Uploaded CSV file URL

    Returns:
        dict with reconciliation result
    """
    from frappe.utils import today

    # Create CSV Import
    csv_doc = frappe.get_doc({
        "doctype": "CSV Import",
        "asp_provider": asp_provider,
        "file": csv_file,
    })
    csv_doc.insert(ignore_permissions=True)

    # Get date range from CSV data
    # For MVP, use last 30 days
    from datetime import timedelta
    from_date = (frappe.utils.getdate(today()) - timedelta(days=30)).strftime("%Y-%m-%d")
    to_date = today()

    # Create Reconciliation Run
    rec_doc = frappe.get_doc({
        "doctype": "Reconciliation Run",
        "company": company,
        "asp_provider": asp_provider,
        "csv_import": csv_doc.name,
        "from_date": from_date,
        "to_date": to_date,
        "posting_date": today(),
    })
    rec_doc.insert(ignore_permissions=True)
    rec_doc.submit()

    return {
        "status": "success",
        "reconciliation_run": rec_doc.name,
        "csv_import": csv_doc.name,
        "matched": rec_doc.matched_count,
        "mismatched": rec_doc.mismatched_count,
        "missing_in_asp": rec_doc.missing_in_asp,
        "compliance_score": rec_doc.match_percentage,
    }


@frappe.whitelist()
def generate_audit_pack(reconciliation_run):
    """
    Generate PDF audit pack for a reconciliation run

    Args:
        reconciliation_run: Reconciliation Run name

    Returns:
        dict with report details and PDF URL
    """
    from digicomply.digicomply.doctype.mismatch_report.mismatch_report import create_report

    report_name = create_report(reconciliation_run)
    report = frappe.get_doc("Mismatch Report", report_name)

    return {
        "status": "success",
        "report_name": report_name,
        "pdf_url": report.pdf_file,
        "compliance_score": report.compliance_score,
        "total_issues": report.total_issues,
        "potential_penalty": report.potential_penalty,
    }
