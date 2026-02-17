# Copyright (c) 2026, DigiComply and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import now_datetime, add_to_date, get_datetime
from croniter import croniter


class SyncSchedule(Document):
    def validate(self):
        self.validate_timing()
        self.calculate_next_run()

    def validate_timing(self):
        """Validate timing configuration based on frequency"""
        if self.frequency == "Interval":
            if not self.interval_minutes or self.interval_minutes < 5:
                frappe.throw("Interval must be at least 5 minutes")
        elif self.frequency == "Cron":
            if not self.cron_expression:
                frappe.throw("Cron expression is required for Cron frequency")
            try:
                croniter(self.cron_expression)
            except Exception:
                frappe.throw("Invalid cron expression")

    def calculate_next_run(self):
        """Calculate next run time based on frequency"""
        if not self.enabled:
            self.next_run_at = None
            return

        now = now_datetime()

        if self.frequency == "Interval":
            if self.last_run_at:
                self.next_run_at = add_to_date(
                    self.last_run_at,
                    minutes=self.interval_minutes
                )
                if get_datetime(self.next_run_at) < now:
                    self.next_run_at = now
            else:
                self.next_run_at = now

        elif self.frequency == "Hourly":
            self.next_run_at = add_to_date(now, hours=1)

        elif self.frequency == "Daily":
            self.next_run_at = add_to_date(now, days=1)
            if self.start_time:
                next_run = get_datetime(self.next_run_at)
                self.next_run_at = next_run.replace(
                    hour=self.start_time.hour,
                    minute=self.start_time.minute
                )

        elif self.frequency == "Weekly":
            self.next_run_at = add_to_date(now, weeks=1)

        elif self.frequency == "Monthly":
            self.next_run_at = add_to_date(now, months=1)

        elif self.frequency == "Cron":
            cron = croniter(self.cron_expression, now)
            self.next_run_at = cron.get_next()

    @frappe.whitelist()
    def run_now(self):
        """Trigger immediate sync run"""
        from digicomply.digicomply.api.connector_framework import execute_sync_schedule

        return execute_sync_schedule(self.name)

    @frappe.whitelist()
    def pause(self):
        """Pause the schedule"""
        self.schedule_status = "Paused"
        self.save()
        return {"success": True, "message": "Schedule paused"}

    @frappe.whitelist()
    def resume(self):
        """Resume the schedule"""
        self.schedule_status = "Idle"
        self.calculate_next_run()
        self.save()
        return {"success": True, "message": "Schedule resumed"}

    def update_run_stats(self, success, error=None):
        """Update run statistics after a sync"""
        self.total_runs = (self.total_runs or 0) + 1
        self.last_run_at = now_datetime()

        if success:
            self.successful_runs = (self.successful_runs or 0) + 1
            self.schedule_status = "Idle"
            self.last_error = None
        else:
            self.failed_runs = (self.failed_runs or 0) + 1
            self.schedule_status = "Error"
            self.last_error = str(error)[:500] if error else "Unknown error"

        self.calculate_next_run()
        self.save()


@frappe.whitelist()
def get_due_schedules():
    """Get all schedules that are due to run"""
    now = now_datetime()

    schedules = frappe.get_all(
        "Sync Schedule",
        filters={
            "enabled": 1,
            "schedule_status": ["in", ["Idle", "Error"]],
            "next_run_at": ["<=", now]
        },
        fields=["name", "asp_connection", "priority"],
        order_by="priority desc, next_run_at asc"
    )

    return schedules
