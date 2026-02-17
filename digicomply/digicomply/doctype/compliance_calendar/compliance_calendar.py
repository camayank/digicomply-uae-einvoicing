# Copyright (c) 2024, DigiComply and contributors
# License: MIT

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import flt, getdate, add_months, get_first_day, get_last_day, date_diff, nowdate


class ComplianceCalendar(Document):
    """
    Compliance Calendar - UAE VAT Filing Deadline Tracker

    Tracks VAT filing deadlines and manages reminder notifications.
    Calculates late filing penalties according to UAE FTA rules.
    """

    def validate(self):
        """Validate the Compliance Calendar document"""
        self.validate_dates()
        self.calculate_due_date()
        self.update_status()
        self.calculate_penalty()

    def validate_dates(self):
        """Ensure tax_period_start is before tax_period_end"""
        if self.tax_period_start and self.tax_period_end:
            if getdate(self.tax_period_start) > getdate(self.tax_period_end):
                frappe.throw(_("Tax Period Start cannot be after Tax Period End"))

    def calculate_due_date(self):
        """
        Calculate the filing due date.
        UAE VAT returns are due on the 28th of the month following the tax period end.
        """
        if not self.tax_period_end:
            return

        period_end = getdate(self.tax_period_end)
        # Due date is 28th of the following month
        next_month = add_months(period_end, 1)
        due_date = getdate(f"{next_month.year}-{next_month.month:02d}-28")
        self.due_date = due_date

    def update_status(self):
        """
        Update status based on current date and filing status.
        Status progression: Upcoming -> Due Soon -> Overdue -> Filed -> Acknowledged
        """
        if not self.due_date:
            return

        # If already filed or acknowledged, don't change status
        if self.status in ["Filed", "Acknowledged"]:
            return

        today = getdate(nowdate())
        due_date = getdate(self.due_date)
        days_until_due = date_diff(due_date, today)

        if days_until_due < 0:
            self.status = "Overdue"
        elif days_until_due <= 7:
            self.status = "Due Soon"
        else:
            self.status = "Upcoming"

    def calculate_penalty(self):
        """
        Calculate late filing penalty according to UAE FTA rules.

        UAE Late Filing Penalty Structure:
        - Initial penalty: AED 1,000 for first late filing
        - Additional penalty: AED 1,000 for each additional month (or part thereof)
        - Maximum penalty: AED 20,000
        """
        if not self.due_date or self.status not in ["Overdue"]:
            self.penalty_amount = 0
            return

        today = getdate(nowdate())
        due_date = getdate(self.due_date)
        days_overdue = date_diff(today, due_date)

        if days_overdue <= 0:
            self.penalty_amount = 0
            return

        # Initial penalty
        penalty = 1000

        # Additional monthly penalties (1000 per month or part thereof)
        months_overdue = (days_overdue // 30) + (1 if days_overdue % 30 > 0 else 0)
        additional_penalty = (months_overdue - 1) * 1000 if months_overdue > 1 else 0

        total_penalty = penalty + additional_penalty

        # Cap at AED 20,000
        self.penalty_amount = min(flt(total_penalty, 2), 20000)

    @frappe.whitelist()
    def mark_as_filed(self, vat_return=None):
        """
        Mark the calendar entry as filed.

        Args:
            vat_return: Optional link to VAT Return document
        """
        # Permission check
        if not frappe.has_permission("Compliance Calendar", "write", self.name):
            frappe.throw(_("Not permitted to modify this Compliance Calendar entry"))

        self.status = "Filed"
        if vat_return:
            self.vat_return = vat_return

        self.save()

        # Create a Filing Status record
        filing_status = frappe.get_doc({
            "doctype": "Filing Status",
            "compliance_calendar": self.name,
            "status": "Filed",
            "status_date": frappe.utils.now_datetime(),
            "filed_by": frappe.session.user
        })
        filing_status.insert()
        self.filing_status = filing_status.name
        self.save()

        frappe.msgprint(_("Compliance Calendar marked as filed"), indicator="green")

        return {
            "status": "success",
            "filing_status": filing_status.name
        }

    @frappe.whitelist()
    def mark_as_acknowledged(self, fta_reference=None):
        """
        Mark the calendar entry as acknowledged by FTA.

        Args:
            fta_reference: FTA acknowledgment reference number
        """
        # Permission check
        if not frappe.has_permission("Compliance Calendar", "write", self.name):
            frappe.throw(_("Not permitted to modify this Compliance Calendar entry"))

        if self.status != "Filed":
            frappe.throw(_("Only filed entries can be acknowledged"))

        self.status = "Acknowledged"
        self.save()

        # Update Filing Status record
        if self.filing_status:
            filing_status = frappe.get_doc("Filing Status", self.filing_status)
            filing_status.status = "Acknowledged"
            filing_status.acknowledged_date = frappe.utils.now_datetime()
            if fta_reference:
                filing_status.fta_reference = fta_reference
            filing_status.save()

        frappe.msgprint(_("Compliance Calendar acknowledged"), indicator="green")

        return {"status": "success"}


@frappe.whitelist()
def generate_calendar_entries(year, company=None):
    """
    Generate all Compliance Calendar entries for a year.

    Creates calendar entries for each VAT filing period based on
    the company's filing frequency (monthly or quarterly).

    Args:
        year: The year to generate entries for (e.g., 2024)
        company: Optional specific company, otherwise generates for all companies

    Returns:
        dict with status and count of entries created
    """
    # Permission check
    if not frappe.has_permission("Compliance Calendar", "create"):
        frappe.throw(_("Not permitted to create Compliance Calendar entries"))

    year = int(year)
    entries_created = 0

    # Get companies to process
    if company:
        companies = [{"name": company}]
    else:
        companies = frappe.get_all("Company", filters={"is_group": 0}, fields=["name"])

    for comp in companies:
        company_name = comp["name"]

        # Determine filing type from DigiComply Settings or default to Quarterly
        filing_type = "VAT Return Quarterly"

        # Try to get company-specific settings
        try:
            settings = frappe.get_cached_doc("DigiComply Settings")
            if settings.default_filing_frequency == "Monthly":
                filing_type = "VAT Return Monthly"
        except Exception:
            pass

        if filing_type == "VAT Return Monthly":
            # Generate 12 monthly entries
            for month in range(1, 13):
                period_start = getdate(f"{year}-{month:02d}-01")
                period_end = get_last_day(period_start)

                entry = _create_calendar_entry(
                    company_name, filing_type, period_start, period_end
                )
                if entry:
                    entries_created += 1
        else:
            # Generate 4 quarterly entries
            quarters = [
                (1, 3),   # Q1: Jan-Mar
                (4, 6),   # Q2: Apr-Jun
                (7, 9),   # Q3: Jul-Sep
                (10, 12)  # Q4: Oct-Dec
            ]

            for start_month, end_month in quarters:
                period_start = getdate(f"{year}-{start_month:02d}-01")
                period_end = get_last_day(getdate(f"{year}-{end_month:02d}-01"))

                entry = _create_calendar_entry(
                    company_name, filing_type, period_start, period_end
                )
                if entry:
                    entries_created += 1

    frappe.db.commit()

    return {
        "status": "success",
        "message": _("{0} calendar entries created for year {1}").format(entries_created, year),
        "entries_created": entries_created
    }


def _create_calendar_entry(company, filing_type, period_start, period_end):
    """
    Helper function to create a single calendar entry.
    Returns the created document or None if it already exists.
    """
    # Check if entry already exists
    existing = frappe.db.exists("Compliance Calendar", {
        "company": company,
        "tax_period_start": period_start,
        "tax_period_end": period_end
    })

    if existing:
        return None

    # Calculate due date (28th of following month)
    next_month = add_months(period_end, 1)
    due_date = getdate(f"{next_month.year}-{next_month.month:02d}-28")

    entry = frappe.get_doc({
        "doctype": "Compliance Calendar",
        "company": company,
        "filing_type": filing_type,
        "tax_period_start": period_start,
        "tax_period_end": period_end,
        "due_date": due_date,
        "status": "Upcoming"
    })
    entry.insert(ignore_permissions=True)

    return entry


@frappe.whitelist()
def update_all_statuses():
    """
    Update status for all Compliance Calendar entries.
    Called by scheduler to keep statuses current.
    """
    # Get all non-final status entries
    entries = frappe.get_all(
        "Compliance Calendar",
        filters={"status": ["not in", ["Filed", "Acknowledged"]]},
        fields=["name"]
    )

    updated = 0
    for entry in entries:
        doc = frappe.get_doc("Compliance Calendar", entry.name)
        old_status = doc.status
        doc.update_status()
        doc.calculate_penalty()
        if doc.status != old_status or doc.has_value_changed("penalty_amount"):
            doc.save(ignore_permissions=True)
            updated += 1

    frappe.db.commit()

    return {
        "status": "success",
        "updated": updated
    }


@frappe.whitelist()
def send_reminders():
    """
    Send reminder notifications for upcoming deadlines.
    Called by scheduler daily.
    """
    today = getdate(nowdate())
    reminders_sent = 0

    # Get all non-filed entries
    entries = frappe.get_all(
        "Compliance Calendar",
        filters={"status": ["not in", ["Filed", "Acknowledged"]]},
        fields=["name", "company", "due_date", "reminder_14_days",
                "reminder_7_days", "reminder_3_days", "reminder_1_day"]
    )

    for entry in entries:
        days_until_due = date_diff(getdate(entry.due_date), today)
        doc = frappe.get_doc("Compliance Calendar", entry.name)

        # 14-day reminder
        if days_until_due <= 14 and days_until_due > 7 and not entry.reminder_14_days:
            _send_reminder(doc, 14)
            doc.reminder_14_days = 1
            doc.save(ignore_permissions=True)
            reminders_sent += 1

        # 7-day reminder
        elif days_until_due <= 7 and days_until_due > 3 and not entry.reminder_7_days:
            _send_reminder(doc, 7)
            doc.reminder_7_days = 1
            doc.save(ignore_permissions=True)
            reminders_sent += 1

        # 3-day reminder
        elif days_until_due <= 3 and days_until_due > 1 and not entry.reminder_3_days:
            _send_reminder(doc, 3)
            doc.reminder_3_days = 1
            doc.save(ignore_permissions=True)
            reminders_sent += 1

        # 1-day reminder
        elif days_until_due <= 1 and days_until_due >= 0 and not entry.reminder_1_day:
            _send_reminder(doc, 1)
            doc.reminder_1_day = 1
            doc.save(ignore_permissions=True)
            reminders_sent += 1

    frappe.db.commit()

    return {
        "status": "success",
        "reminders_sent": reminders_sent
    }


def _send_reminder(doc, days):
    """
    Send reminder notification for a compliance deadline.
    """
    subject = _("VAT Filing Reminder: {0} days until deadline").format(days)

    message = _("""
    <h3>VAT Filing Deadline Reminder</h3>
    <p>This is a reminder that the VAT return for <strong>{company}</strong> is due in <strong>{days} days</strong>.</p>
    <p><strong>Tax Period:</strong> {period_start} to {period_end}</p>
    <p><strong>Due Date:</strong> {due_date}</p>
    <p>Please ensure the VAT return is filed before the deadline to avoid penalties.</p>
    """).format(
        company=doc.company,
        days=days,
        period_start=frappe.format(doc.tax_period_start, {"fieldtype": "Date"}),
        period_end=frappe.format(doc.tax_period_end, {"fieldtype": "Date"}),
        due_date=frappe.format(doc.due_date, {"fieldtype": "Date"})
    )

    # Get recipients (Accounts Managers for the company)
    recipients = frappe.get_all(
        "User Permission",
        filters={"allow": "Company", "for_value": doc.company},
        pluck="user"
    )

    # Add System Managers
    sys_managers = frappe.get_all(
        "Has Role",
        filters={"role": "System Manager", "parenttype": "User"},
        pluck="parent"
    )
    recipients.extend(sys_managers)
    recipients = list(set(recipients))  # Remove duplicates

    if recipients:
        frappe.sendmail(
            recipients=recipients,
            subject=subject,
            message=message,
            reference_doctype="Compliance Calendar",
            reference_name=doc.name
        )


def has_permission(doc, ptype, user):
    """Custom permission check for Compliance Calendar"""
    if ptype == "read":
        # Users can read calendar entries for their permitted companies
        user_companies = frappe.get_all(
            "User Permission",
            filters={"user": user, "allow": "Company"},
            pluck="for_value"
        )
        if user_companies and doc.company in user_companies:
            return True
    return None
