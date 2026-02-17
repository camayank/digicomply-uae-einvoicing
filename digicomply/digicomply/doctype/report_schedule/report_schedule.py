# Copyright (c) 2026, DigiComply and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import (
    now_datetime, getdate, add_days, add_months, add_years,
    get_first_day, get_last_day, get_quarter_start, get_year_start
)
from datetime import datetime, timedelta


class ReportSchedule(Document):
    """
    Report Schedule for Automated Report Generation

    Features:
    - Flexible scheduling (daily, weekly, monthly, quarterly, annually)
    - Auto email delivery
    - Auto archival
    - Execution tracking
    """

    def validate(self):
        """Validate schedule configuration"""
        self.validate_frequency_settings()
        self.calculate_next_run()

    def validate_frequency_settings(self):
        """Validate frequency-specific settings"""
        if self.frequency == "Weekly" and not self.day_of_week:
            frappe.throw("Day of Week is required for weekly schedules")

        if self.frequency in ["Monthly", "Quarterly", "Annually"]:
            if not self.day_of_month or self.day_of_month < 1 or self.day_of_month > 28:
                frappe.throw("Day of Month must be between 1 and 28")

    def calculate_next_run(self):
        """Calculate the next scheduled run time"""
        if not self.enabled:
            self.next_run = None
            return

        now = now_datetime()
        base_date = getdate(now)

        # Get time of day
        time_parts = str(self.time_of_day or "06:00:00").split(":")
        hour = int(time_parts[0])
        minute = int(time_parts[1]) if len(time_parts) > 1 else 0

        if self.frequency == "Daily":
            next_date = base_date
            if now.hour >= hour and now.minute >= minute:
                next_date = add_days(base_date, 1)

        elif self.frequency == "Weekly":
            days_map = {
                "Monday": 0, "Tuesday": 1, "Wednesday": 2,
                "Thursday": 3, "Friday": 4, "Saturday": 5, "Sunday": 6
            }
            target_day = days_map.get(self.day_of_week, 0)
            current_day = base_date.weekday()
            days_ahead = target_day - current_day
            if days_ahead <= 0:
                days_ahead += 7
            next_date = add_days(base_date, days_ahead)

        elif self.frequency == "Monthly":
            next_date = base_date.replace(day=self.day_of_month)
            if next_date <= base_date:
                next_date = add_months(next_date, 1)

        elif self.frequency == "Quarterly":
            # Find next quarter month
            quarter_months = [1, 4, 7, 10]  # Default Jan, Apr, Jul, Oct
            current_month = base_date.month
            next_month = None
            for m in quarter_months:
                if m > current_month:
                    next_month = m
                    break
            if not next_month:
                next_month = quarter_months[0]
                next_date = base_date.replace(year=base_date.year + 1, month=next_month, day=self.day_of_month)
            else:
                next_date = base_date.replace(month=next_month, day=self.day_of_month)

        elif self.frequency == "Annually":
            next_date = base_date.replace(month=1, day=self.day_of_month)
            if next_date <= base_date:
                next_date = next_date.replace(year=base_date.year + 1)

        else:
            next_date = add_days(base_date, 1)

        self.next_run = datetime.combine(next_date, datetime.min.time().replace(hour=hour, minute=minute))

    def get_report_period(self):
        """Calculate the report period based on period_type"""
        today = getdate(now_datetime())

        if self.period_type == "Previous Day":
            end_date = add_days(today, -1)
            start_date = end_date

        elif self.period_type == "Previous Week":
            # Previous Monday to Sunday
            days_since_monday = today.weekday()
            end_date = add_days(today, -days_since_monday - 1)  # Last Sunday
            start_date = add_days(end_date, -6)  # Previous Monday

        elif self.period_type == "Previous Month":
            first_of_this_month = get_first_day(today)
            end_date = add_days(first_of_this_month, -1)
            start_date = get_first_day(end_date)

        elif self.period_type == "Previous Quarter":
            quarter_start = get_quarter_start(today)
            end_date = add_days(quarter_start, -1)
            start_date = get_quarter_start(end_date)

        elif self.period_type == "Previous Year":
            year_start = get_year_start(today)
            end_date = add_days(year_start, -1)
            start_date = get_year_start(end_date)

        elif self.period_type == "Month to Date":
            start_date = get_first_day(today)
            end_date = today

        elif self.period_type == "Quarter to Date":
            start_date = get_quarter_start(today)
            end_date = today

        elif self.period_type == "Year to Date":
            start_date = get_year_start(today)
            end_date = today

        else:
            # Default to previous month
            first_of_this_month = get_first_day(today)
            end_date = add_days(first_of_this_month, -1)
            start_date = get_first_day(end_date)

        return start_date, end_date

    @frappe.whitelist()
    def run_now(self):
        """Manually trigger the scheduled report"""
        return self.execute_schedule()

    def execute_schedule(self):
        """Execute the scheduled report generation"""
        try:
            start_date, end_date = self.get_report_period()

            # Create FTA Report
            report = frappe.get_doc({
                "doctype": "FTA Report",
                "report_type": self.report_type,
                "report_title": f"{self.report_type} - {self.company} - {start_date} to {end_date}",
                "company": self.company,
                "tax_period": self._get_tax_period(),
                "from_date": start_date,
                "to_date": end_date
            })
            report.insert()

            # Generate the report
            report.generate_report()

            # Update schedule status
            self.last_run = now_datetime()
            self.last_run_status = "Success"
            self.last_report = report.name
            self.run_count = (self.run_count or 0) + 1
            self.last_error = None
            self.calculate_next_run()
            self.save(ignore_permissions=True)

            # Send email if configured
            if self.auto_email and self.email_recipients:
                self._send_report_email(report)

            # Archive if configured
            if self.auto_archive:
                self._archive_report(report)

            return {
                "success": True,
                "report_name": report.name
            }

        except Exception as e:
            self.last_run = now_datetime()
            self.last_run_status = "Failed"
            self.error_count = (self.error_count or 0) + 1
            self.last_error = str(e)[:500]
            self.calculate_next_run()
            self.save(ignore_permissions=True)

            frappe.log_error(
                f"Report schedule {self.name} failed: {str(e)}",
                "Report Schedule Error"
            )

            return {
                "success": False,
                "error": str(e)
            }

    def _get_tax_period(self):
        """Determine tax period based on frequency"""
        if self.frequency in ["Daily", "Weekly"]:
            return "Custom"
        elif self.frequency == "Monthly":
            return "Monthly"
        elif self.frequency == "Quarterly":
            return "Quarterly"
        elif self.frequency == "Annually":
            return "Annual"
        return "Custom"

    def _send_report_email(self, report):
        """Send report via email"""
        try:
            recipients = [r.strip() for r in self.email_recipients.split(",")]

            subject = self.email_subject or "{report_type} Report - {company} - {period}"
            subject = subject.format(
                report_type=self.report_type,
                company=self.company,
                period=f"{report.from_date} to {report.to_date}"
            )

            attachments = []
            if self.attach_pdf and report.report_pdf:
                attachments.append({
                    "fname": f"{report.name}.pdf",
                    "fcontent": frappe.get_doc("File", {"file_url": report.report_pdf}).get_content()
                })

            if self.attach_excel and report.report_excel:
                attachments.append({
                    "fname": f"{report.name}.xlsx",
                    "fcontent": frappe.get_doc("File", {"file_url": report.report_excel}).get_content()
                })

            frappe.sendmail(
                recipients=recipients,
                subject=subject,
                message=f"""
                <p>Your scheduled {self.report_type} report has been generated.</p>
                <p><strong>Company:</strong> {self.company}</p>
                <p><strong>Period:</strong> {report.from_date} to {report.to_date}</p>
                <p><strong>Generated:</strong> {report.generation_date}</p>
                <p>Please find the report attached or access it in DigiComply.</p>
                """,
                attachments=attachments if attachments else None,
                delayed=False
            )

        except Exception as e:
            frappe.log_error(
                f"Failed to send report email: {str(e)}",
                "Report Email Error"
            )

    def _archive_report(self, report):
        """Archive the generated report"""
        try:
            from digicomply.digicomply.doctype.document_archive.document_archive import DocumentArchive
            DocumentArchive.archive_document(
                document_type="FTA Report",
                document_name=report.name,
                reason="Auto-archive from schedule"
            )
        except Exception as e:
            frappe.log_error(
                f"Failed to archive report: {str(e)}",
                "Report Archive Error"
            )


def run_scheduled_reports():
    """
    Cron job to run all due report schedules
    Add to hooks.py scheduler_events
    """
    now = now_datetime()

    schedules = frappe.get_all(
        "Report Schedule",
        filters={
            "enabled": 1,
            "next_run": ["<=", now]
        },
        fields=["name"]
    )

    for schedule in schedules:
        try:
            doc = frappe.get_doc("Report Schedule", schedule.name)
            doc.execute_schedule()
        except Exception as e:
            frappe.log_error(
                f"Failed to execute schedule {schedule.name}: {str(e)}",
                "Scheduler Error"
            )


@frappe.whitelist()
def run_schedule_now(schedule_name):
    """API to manually run a schedule"""
    schedule = frappe.get_doc("Report Schedule", schedule_name)
    return schedule.run_now()


@frappe.whitelist()
def get_schedule_status(schedule_name):
    """Get current status of a schedule"""
    schedule = frappe.get_doc("Report Schedule", schedule_name)
    return {
        "enabled": schedule.enabled,
        "last_run": schedule.last_run,
        "last_run_status": schedule.last_run_status,
        "next_run": schedule.next_run,
        "run_count": schedule.run_count,
        "error_count": schedule.error_count,
        "last_error": schedule.last_error
    }
