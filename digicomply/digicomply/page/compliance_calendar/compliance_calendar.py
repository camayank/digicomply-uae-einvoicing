# Copyright (c) 2024, DigiComply and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.utils import getdate, nowdate, add_days, get_first_day, get_last_day, formatdate
from datetime import datetime, date
import calendar


def has_calendar_permission():
    """Check if user has permission to view compliance calendar"""
    return frappe.has_permission("Compliance Calendar", "read")


@frappe.whitelist()
def get_calendar_data(year, month, company=None):
    """
    Get compliance calendar deadlines for a specific month.

    Args:
        year: Year (e.g., 2024)
        month: Month (1-12)
        company: Optional company filter

    Returns:
        dict with calendar data including deadlines grouped by day
    """
    if not has_calendar_permission():
        frappe.throw(_("You don't have permission to view the Compliance Calendar"), frappe.PermissionError)

    year = int(year)
    month = int(month)

    # Get first and last day of the month
    first_day = date(year, month, 1)
    last_day = date(year, month, calendar.monthrange(year, month)[1])

    # Build filters
    filters = [
        ["due_date", ">=", first_day],
        ["due_date", "<=", last_day]
    ]

    if company:
        filters.append(["company", "=", company])

    # Fetch deadlines
    deadlines = frappe.get_all(
        "Compliance Calendar",
        filters=filters,
        fields=[
            "name",
            "company",
            "filing_type",
            "tax_period_start",
            "tax_period_end",
            "due_date",
            "status",
            "vat_return",
            "penalty_amount"
        ],
        order_by="due_date asc, company asc"
    )

    # Group deadlines by day
    deadlines_by_day = {}
    for deadline in deadlines:
        day = getdate(deadline.due_date).day
        if day not in deadlines_by_day:
            deadlines_by_day[day] = []

        # Add formatted period
        deadline["period_label"] = get_period_label(deadline.tax_period_start, deadline.tax_period_end)
        deadline["due_date_formatted"] = formatdate(deadline.due_date)
        deadline["days_until"] = (getdate(deadline.due_date) - getdate(nowdate())).days

        deadlines_by_day[day].append(deadline)

    # Get calendar metadata
    cal = calendar.Calendar(firstweekday=6)  # Start with Sunday
    month_days = list(cal.itermonthdays(year, month))

    return {
        "year": year,
        "month": month,
        "month_name": calendar.month_name[month],
        "days_in_month": calendar.monthrange(year, month)[1],
        "first_weekday": calendar.weekday(year, month, 1),
        "month_days": month_days,
        "deadlines_by_day": deadlines_by_day,
        "deadlines": deadlines,
        "today": getdate(nowdate()).day if getdate(nowdate()).month == month and getdate(nowdate()).year == year else None
    }


@frappe.whitelist()
def get_deadline_summary(company=None, year=None):
    """
    Get summary counts of deadlines by status.

    Args:
        company: Optional company filter
        year: Optional year filter (defaults to current year)

    Returns:
        dict with counts for each status
    """
    if not has_calendar_permission():
        frappe.throw(_("You don't have permission to view the Compliance Calendar"), frappe.PermissionError)

    today = getdate(nowdate())

    if not year:
        year = today.year
    else:
        year = int(year)

    # Base filters
    base_filters = []
    if company:
        base_filters.append(["company", "=", company])

    # Get all deadlines for the year
    year_start = date(year, 1, 1)
    year_end = date(year, 12, 31)

    filters = base_filters + [
        ["due_date", ">=", year_start],
        ["due_date", "<=", year_end]
    ]

    all_deadlines = frappe.get_all(
        "Compliance Calendar",
        filters=filters,
        fields=["name", "status", "due_date"]
    )

    # Count by status
    upcoming = 0
    due_soon = 0
    overdue = 0
    filed = 0
    acknowledged = 0

    for d in all_deadlines:
        status = d.status
        if status in ["Filed", "Acknowledged"]:
            if status == "Filed":
                filed += 1
            else:
                acknowledged += 1
        else:
            # Recalculate status based on due date
            days_until = (getdate(d.due_date) - today).days
            if days_until < 0:
                overdue += 1
            elif days_until <= 7:
                due_soon += 1
            else:
                upcoming += 1

    return {
        "upcoming": upcoming,
        "due_soon": due_soon,
        "overdue": overdue,
        "filed": filed,
        "acknowledged": acknowledged,
        "total": len(all_deadlines),
        "year": year
    }


@frappe.whitelist()
def get_upcoming_deadlines(company=None, limit=10):
    """
    Get list of upcoming deadlines sorted by due date.

    Args:
        company: Optional company filter
        limit: Number of deadlines to return

    Returns:
        list of upcoming deadlines
    """
    if not has_calendar_permission():
        frappe.throw(_("You don't have permission to view the Compliance Calendar"), frappe.PermissionError)

    today = nowdate()

    filters = [
        ["due_date", ">=", today],
        ["status", "not in", ["Filed", "Acknowledged"]]
    ]

    if company:
        filters.append(["company", "=", company])

    deadlines = frappe.get_all(
        "Compliance Calendar",
        filters=filters,
        fields=[
            "name",
            "company",
            "filing_type",
            "tax_period_start",
            "tax_period_end",
            "due_date",
            "status",
            "penalty_amount"
        ],
        order_by="due_date asc",
        limit_page_length=int(limit)
    )

    today_date = getdate(today)
    for d in deadlines:
        d["period_label"] = get_period_label(d.tax_period_start, d.tax_period_end)
        d["due_date_formatted"] = formatdate(d.due_date)
        d["days_until"] = (getdate(d.due_date) - today_date).days

        # Determine urgency class
        if d["days_until"] <= 3:
            d["urgency"] = "critical"
        elif d["days_until"] <= 7:
            d["urgency"] = "warning"
        else:
            d["urgency"] = "normal"

    return deadlines


@frappe.whitelist()
def generate_calendar_entries(company, year, filing_type="VAT Return Quarterly"):
    """
    Generate compliance calendar entries for a company and year.

    Args:
        company: Company name
        year: Year to generate entries for
        filing_type: Type of filing (Monthly or Quarterly)

    Returns:
        dict with generation results
    """
    if not frappe.has_permission("Compliance Calendar", "create"):
        frappe.throw(_("You don't have permission to create calendar entries"), frappe.PermissionError)

    year = int(year)
    created = []
    skipped = []

    if filing_type == "VAT Return Quarterly":
        # Q1: Jan-Mar, due April 28
        # Q2: Apr-Jun, due July 28
        # Q3: Jul-Sep, due October 28
        # Q4: Oct-Dec, due January 28 (next year)
        periods = [
            (date(year, 1, 1), date(year, 3, 31), date(year, 4, 28)),
            (date(year, 4, 1), date(year, 6, 30), date(year, 7, 28)),
            (date(year, 7, 1), date(year, 9, 30), date(year, 10, 28)),
            (date(year, 10, 1), date(year, 12, 31), date(year + 1, 1, 28)),
        ]
    else:  # Monthly
        periods = []
        for month in range(1, 13):
            start = date(year, month, 1)
            end = date(year, month, calendar.monthrange(year, month)[1])
            # Due 28th of the following month
            if month == 12:
                due = date(year + 1, 1, 28)
            else:
                due = date(year, month + 1, 28)
            periods.append((start, end, due))

    for start, end, due in periods:
        # Check if entry already exists
        existing = frappe.db.exists("Compliance Calendar", {
            "company": company,
            "tax_period_start": start,
            "tax_period_end": end
        })

        if existing:
            skipped.append({
                "period": f"{formatdate(start)} - {formatdate(end)}",
                "reason": "Already exists"
            })
            continue

        # Determine initial status
        today = getdate(nowdate())
        days_until = (due - today).days

        if days_until < 0:
            status = "Overdue"
        elif days_until <= 7:
            status = "Due Soon"
        else:
            status = "Upcoming"

        # Create the entry
        doc = frappe.get_doc({
            "doctype": "Compliance Calendar",
            "company": company,
            "filing_type": filing_type,
            "tax_period_start": start,
            "tax_period_end": end,
            "due_date": due,
            "status": status
        })
        doc.insert()

        created.append({
            "name": doc.name,
            "period": f"{formatdate(start)} - {formatdate(end)}",
            "due_date": formatdate(due)
        })

    frappe.db.commit()

    return {
        "created": created,
        "skipped": skipped,
        "created_count": len(created),
        "skipped_count": len(skipped)
    }


@frappe.whitelist()
def get_companies_for_calendar():
    """Get list of companies the user has access to"""
    if not has_calendar_permission():
        frappe.throw(_("You don't have permission to view the Compliance Calendar"), frappe.PermissionError)

    return frappe.get_all(
        "Company",
        filters={"is_group": 0},
        fields=["name", "company_name", "abbr"],
        order_by="company_name asc"
    )


def get_period_label(start_date, end_date):
    """Generate a human-readable period label"""
    start = getdate(start_date)
    end = getdate(end_date)

    # Check if it's a quarter
    if start.month in [1, 4, 7, 10] and start.day == 1:
        quarter = (start.month - 1) // 3 + 1
        if (end.month - start.month) == 2:
            return f"Q{quarter} {start.year}"

    # Check if it's a single month
    if start.month == end.month and start.year == end.year:
        return f"{calendar.month_abbr[start.month]} {start.year}"

    # Default to date range
    return f"{formatdate(start_date)} - {formatdate(end_date)}"
