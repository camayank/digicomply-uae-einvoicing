# Copyright (c) 2026, DigiComply and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import now_datetime, time_diff_in_seconds
import json


class SyncRun(Document):
    def before_save(self):
        # Calculate duration if completed
        if self.started_at and self.completed_at:
            self.duration_seconds = int(
                time_diff_in_seconds(self.completed_at, self.started_at)
            )

        # Generate summary
        if self.run_status in ["Completed", "Completed with Errors", "Failed"]:
            self.generate_summary()

    def generate_summary(self):
        """Generate a summary of the sync run"""
        parts = []

        if self.records_fetched:
            parts.append(f"Fetched: {self.records_fetched}")
        if self.records_pushed:
            parts.append(f"Pushed: {self.records_pushed}")
        if self.records_created:
            parts.append(f"Created: {self.records_created}")
        if self.records_updated:
            parts.append(f"Updated: {self.records_updated}")
        if self.records_failed:
            parts.append(f"Failed: {self.records_failed}")
        if self.records_skipped:
            parts.append(f"Skipped: {self.records_skipped}")

        if self.duration_seconds:
            parts.append(f"Duration: {self.duration_seconds}s")

        self.summary = " | ".join(parts) if parts else "No records processed"

    @frappe.whitelist()
    def cancel_run(self):
        """Cancel a running sync"""
        if self.run_status not in ["Pending", "Running"]:
            frappe.throw("Can only cancel pending or running syncs")

        self.run_status = "Cancelled"
        self.completed_at = now_datetime()
        self.save()

        return {"success": True, "message": "Sync cancelled"}

    def add_error(self, record_type, record_id, error_message, error_code=None):
        """Add an error to the sync run"""
        self.append("sync_errors", {
            "record_type": record_type,
            "record_id": record_id,
            "error_message": error_message[:500] if error_message else None,
            "error_code": error_code,
            "occurred_at": now_datetime()
        })
        self.records_failed = (self.records_failed or 0) + 1

    def update_progress(self, processed, total):
        """Update progress percentage"""
        if total > 0:
            self.progress_percent = round((processed / total) * 100, 2)
            self.save()


def create_sync_run(connection, schedule=None, direction="Pull",
                    trigger_type="Manual", triggered_by=None):
    """Create a new sync run"""
    run = frappe.get_doc({
        "doctype": "Sync Run",
        "asp_connection": connection,
        "sync_schedule": schedule,
        "sync_direction": direction,
        "trigger_type": trigger_type,
        "triggered_by": triggered_by or frappe.session.user,
        "run_status": "Pending",
        "started_at": now_datetime()
    })
    run.insert(ignore_permissions=True)
    frappe.db.commit()

    return run


def complete_sync_run(run_name, success=True, error_details=None):
    """Mark a sync run as complete"""
    run = frappe.get_doc("Sync Run", run_name)
    run.completed_at = now_datetime()

    if success:
        if run.records_failed > 0:
            run.run_status = "Completed with Errors"
        else:
            run.run_status = "Completed"
    else:
        run.run_status = "Failed"
        if error_details:
            run.error_details = json.dumps(error_details, indent=2)

    run.progress_percent = 100
    run.save(ignore_permissions=True)
    frappe.db.commit()

    return run


@frappe.whitelist()
def get_sync_history(connection=None, limit=50):
    """Get sync run history"""
    filters = {}
    if connection:
        filters["asp_connection"] = connection

    runs = frappe.get_all(
        "Sync Run",
        filters=filters,
        fields=[
            "name", "asp_connection", "sync_direction", "run_status",
            "trigger_type", "started_at", "completed_at", "duration_seconds",
            "records_fetched", "records_pushed", "records_created",
            "records_updated", "records_failed", "summary"
        ],
        order_by="started_at desc",
        limit=limit
    )

    return runs


@frappe.whitelist()
def get_sync_stats(connection=None, days=30):
    """Get sync statistics"""
    from frappe.utils import add_to_date

    filters = {
        "started_at": [">=", add_to_date(now_datetime(), days=-days)]
    }
    if connection:
        filters["asp_connection"] = connection

    stats = frappe.db.sql("""
        SELECT
            run_status,
            COUNT(*) as count,
            SUM(records_fetched) as total_fetched,
            SUM(records_pushed) as total_pushed,
            SUM(records_created) as total_created,
            SUM(records_updated) as total_updated,
            SUM(records_failed) as total_failed,
            AVG(duration_seconds) as avg_duration
        FROM `tabSync Run`
        WHERE started_at >= %(start_date)s
        {connection_filter}
        GROUP BY run_status
    """.format(
        connection_filter="AND asp_connection = %(connection)s" if connection else ""
    ), {
        "start_date": add_to_date(now_datetime(), days=-days),
        "connection": connection
    }, as_dict=True)

    return stats
