# Copyright (c) 2026, DigiComply and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import now_datetime
import json
import uuid


class APILog(Document):
    pass


def create_api_log(connection, endpoint, method, request_headers=None,
                   request_body=None, sync_run=None):
    """Create a new API log entry for a request"""
    # Sanitize headers (remove sensitive data)
    safe_headers = sanitize_headers(request_headers) if request_headers else None

    log = frappe.get_doc({
        "doctype": "API Log",
        "asp_connection": connection,
        "endpoint": endpoint,
        "method": method,
        "request_timestamp": now_datetime(),
        "request_id": str(uuid.uuid4()),
        "sync_run": sync_run,
        "request_headers": json.dumps(safe_headers, indent=2) if safe_headers else None,
        "request_body": json.dumps(request_body, indent=2) if request_body else None
    })
    log.insert(ignore_permissions=True)
    frappe.db.commit()

    return log.name


def update_api_log(log_name, status_code, response_status, response_headers=None,
                   response_body=None, response_time_ms=None, error_type=None,
                   error_message=None, stack_trace=None):
    """Update API log with response data"""
    log = frappe.get_doc("API Log", log_name)

    log.status_code = status_code
    log.response_status = response_status
    log.response_timestamp = now_datetime()
    log.response_time_ms = response_time_ms

    if response_headers:
        log.response_headers = json.dumps(dict(response_headers), indent=2)

    if response_body:
        # Truncate large responses
        body_str = json.dumps(response_body, indent=2) if isinstance(response_body, dict) else str(response_body)
        if len(body_str) > 50000:
            body_str = body_str[:50000] + "\n... [truncated]"
        log.response_body = body_str

    if error_type:
        log.error_type = error_type
    if error_message:
        log.error_message = error_message[:1000] if error_message else None
    if stack_trace:
        log.stack_trace = stack_trace[:5000] if stack_trace else None

    log.save(ignore_permissions=True)
    frappe.db.commit()


def sanitize_headers(headers):
    """Remove sensitive information from headers"""
    if not headers:
        return None

    sensitive_keys = [
        "authorization", "x-api-key", "api-key", "token",
        "x-cleartax-auth-token", "cookie", "set-cookie"
    ]

    safe_headers = {}
    for key, value in headers.items():
        if key.lower() in sensitive_keys:
            safe_headers[key] = "[REDACTED]"
        else:
            safe_headers[key] = value

    return safe_headers


@frappe.whitelist()
def get_api_logs_summary(connection=None, days=7):
    """Get summary of API logs"""
    from frappe.utils import add_to_date

    filters = {}
    if connection:
        filters["asp_connection"] = connection

    filters["request_timestamp"] = [">=", add_to_date(now_datetime(), days=-days)]

    logs = frappe.get_all(
        "API Log",
        filters=filters,
        fields=[
            "response_status",
            "count(*) as count",
            "avg(response_time_ms) as avg_response_time"
        ],
        group_by="response_status"
    )

    return logs


@frappe.whitelist()
def cleanup_old_logs(days=30):
    """Delete API logs older than specified days"""
    from frappe.utils import add_to_date

    cutoff_date = add_to_date(now_datetime(), days=-days)

    deleted = frappe.db.delete(
        "API Log",
        filters={"request_timestamp": ["<", cutoff_date]}
    )

    frappe.db.commit()
    return {"deleted": deleted}
