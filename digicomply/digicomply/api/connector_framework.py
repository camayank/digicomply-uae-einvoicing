# Copyright (c) 2026, DigiComply and contributors
# For license information, please see license.txt

"""
Connector Framework API
Central orchestrator for ASP (Accredited Service Provider) interactions
"""

import frappe
from frappe.utils import now_datetime
import requests
import json
import time
from functools import wraps


class ConnectorFramework:
    """Main framework class for managing ASP connections and sync operations"""

    def __init__(self, connection_name):
        self.connection = frappe.get_doc("ASP Connection", connection_name)
        self.connector = self._get_connector()
        self.rate_limiter = RateLimiter(self.connection.name)

    def _get_connector(self):
        """Get the ASP connector configuration"""
        connector = frappe.get_all(
            "ASP Connector",
            filters={
                "asp_provider": self.connection.asp_provider,
                "enabled": 1
            },
            limit=1
        )
        if connector:
            return frappe.get_doc("ASP Connector", connector[0].name)
        return None

    def _get_headers(self):
        """Get authentication headers for API requests"""
        return self.connection._get_auth_headers()

    def _make_request(self, method, endpoint, data=None, params=None, sync_run=None):
        """Make an API request with logging and rate limiting"""
        from digicomply.digicomply.doctype.api_log.api_log import (
            create_api_log, update_api_log
        )

        # Check rate limit
        self.rate_limiter.wait_if_needed()

        url = f"{self.connection.base_url}{endpoint}"
        headers = self._get_headers()

        # Create log entry
        log_name = create_api_log(
            connection=self.connection.name,
            endpoint=endpoint,
            method=method,
            request_headers=headers,
            request_body=data,
            sync_run=sync_run
        )

        start_time = time.time()

        try:
            response = requests.request(
                method=method,
                url=url,
                headers=headers,
                json=data if method in ["POST", "PUT", "PATCH"] else None,
                params=params,
                timeout=self.connection.timeout_seconds or 30
            )

            response_time_ms = int((time.time() - start_time) * 1000)

            # Determine response status
            if response.status_code in [200, 201, 202, 204]:
                response_status = "Success"
            elif response.status_code == 429:
                response_status = "Rate Limited"
                self.rate_limiter.record_limit_hit()
            else:
                response_status = "Error"

            # Try to parse JSON response
            try:
                response_body = response.json()
            except Exception:
                response_body = response.text

            # Update log
            update_api_log(
                log_name=log_name,
                status_code=response.status_code,
                response_status=response_status,
                response_headers=dict(response.headers),
                response_body=response_body,
                response_time_ms=response_time_ms
            )

            self.rate_limiter.record_request()

            return {
                "success": response_status == "Success",
                "status_code": response.status_code,
                "data": response_body,
                "headers": dict(response.headers)
            }

        except requests.exceptions.Timeout:
            update_api_log(
                log_name=log_name,
                status_code=0,
                response_status="Timeout",
                error_type="Timeout",
                error_message="Request timed out",
                response_time_ms=int((time.time() - start_time) * 1000)
            )
            return {"success": False, "error": "Timeout"}

        except requests.exceptions.RequestException as e:
            update_api_log(
                log_name=log_name,
                status_code=0,
                response_status="Error",
                error_type=type(e).__name__,
                error_message=str(e),
                response_time_ms=int((time.time() - start_time) * 1000)
            )
            return {"success": False, "error": str(e)}

    def fetch_invoices(self, filters=None, page=1, page_size=100, sync_run=None):
        """Fetch invoices from ASP"""
        if not self.connector:
            return {"success": False, "error": "No connector configured"}

        endpoint = self.connector.fetch_invoice_endpoint
        if not endpoint:
            return {"success": False, "error": "Fetch invoice endpoint not configured"}

        params = filters or {}
        if self.connector.supports_pagination:
            params["page"] = page
            params["page_size"] = min(page_size, self.connector.page_size_limit or 100)

        return self._make_request("GET", endpoint, params=params, sync_run=sync_run)

    def push_invoice(self, invoice_data, sync_run=None):
        """Push invoice to ASP"""
        if not self.connector:
            return {"success": False, "error": "No connector configured"}

        endpoint = self.connector.push_invoice_endpoint
        if not endpoint:
            return {"success": False, "error": "Push invoice endpoint not configured"}

        # Apply transform rules
        from digicomply.digicomply.doctype.transform_rule.transform_rule import apply_transforms
        transformed_data = apply_transforms(
            invoice_data,
            self.connector.name if self.connector else None,
            "Invoice",
            "Outbound"
        )

        return self._make_request("POST", endpoint, data=transformed_data, sync_run=sync_run)

    def get_invoice_status(self, invoice_id, sync_run=None):
        """Get invoice status from ASP"""
        if not self.connector:
            return {"success": False, "error": "No connector configured"}

        endpoint = self.connector.status_endpoint
        if not endpoint:
            return {"success": False, "error": "Status endpoint not configured"}

        # Replace placeholder with actual ID
        endpoint = endpoint.replace("{id}", str(invoice_id))
        endpoint = endpoint.replace("{irn}", str(invoice_id))
        endpoint = endpoint.replace("{uuid}", str(invoice_id))

        return self._make_request("GET", endpoint, sync_run=sync_run)

    def fetch_customers(self, filters=None, page=1, page_size=100, sync_run=None):
        """Fetch customers from ASP"""
        if not self.connector:
            return {"success": False, "error": "No connector configured"}

        endpoint = self.connector.fetch_customer_endpoint
        if not endpoint:
            return {"success": False, "error": "Fetch customer endpoint not configured"}

        params = filters or {}
        if self.connector.supports_pagination:
            params["page"] = page
            params["page_size"] = min(page_size, self.connector.page_size_limit or 100)

        return self._make_request("GET", endpoint, params=params, sync_run=sync_run)

    def push_customer(self, customer_data, sync_run=None):
        """Push customer to ASP"""
        if not self.connector:
            return {"success": False, "error": "No connector configured"}

        endpoint = self.connector.push_customer_endpoint
        if not endpoint:
            return {"success": False, "error": "Push customer endpoint not configured"}

        # Apply transform rules
        from digicomply.digicomply.doctype.transform_rule.transform_rule import apply_transforms
        transformed_data = apply_transforms(
            customer_data,
            self.connector.name if self.connector else None,
            "Customer",
            "Outbound"
        )

        return self._make_request("POST", endpoint, data=transformed_data, sync_run=sync_run)


class RateLimiter:
    """Rate limiter for API requests"""

    def __init__(self, connection_name):
        self.connection_name = connection_name
        self.cache_key = f"rate_limit_{connection_name}"

    def get_current_count(self):
        """Get current request count for the minute"""
        return frappe.cache().get_value(self.cache_key) or 0

    def record_request(self):
        """Record a request"""
        count = self.get_current_count()
        frappe.cache().set_value(self.cache_key, count + 1, expires_in_sec=60)

    def record_limit_hit(self):
        """Record that we hit the rate limit"""
        frappe.cache().set_value(f"{self.cache_key}_limited", True, expires_in_sec=60)

    def is_limited(self):
        """Check if we're currently rate limited"""
        return frappe.cache().get_value(f"{self.cache_key}_limited")

    def wait_if_needed(self):
        """Wait if we're approaching or at the rate limit"""
        connection = frappe.get_doc("ASP Connection", self.connection_name)
        limit = connection.rate_limit_per_minute or 60

        count = self.get_current_count()
        if count >= limit or self.is_limited():
            # Wait for the rest of the minute
            time.sleep(2)


# API Methods

@frappe.whitelist()
def run_sync(connection_name, direction="Pull", trigger_type="Manual"):
    """Run a sync for a connection"""
    from digicomply.digicomply.doctype.sync_run.sync_run import (
        create_sync_run, complete_sync_run
    )

    # Create sync run
    sync_run = create_sync_run(
        connection=connection_name,
        direction=direction,
        trigger_type=trigger_type
    )

    try:
        sync_run.run_status = "Running"
        sync_run.save()
        frappe.db.commit()

        framework = ConnectorFramework(connection_name)

        if direction in ["Pull", "Bidirectional"]:
            _run_pull_sync(framework, sync_run)

        if direction in ["Push", "Bidirectional"]:
            _run_push_sync(framework, sync_run)

        complete_sync_run(sync_run.name, success=True)

        # Update connection stats
        connection = frappe.get_doc("ASP Connection", connection_name)
        connection.update_sync_stats(success=True)

        return {
            "success": True,
            "sync_run": sync_run.name,
            "summary": sync_run.summary
        }

    except Exception as e:
        complete_sync_run(sync_run.name, success=False, error_details={"error": str(e)})

        connection = frappe.get_doc("ASP Connection", connection_name)
        connection.update_sync_stats(success=False)

        frappe.log_error(f"Sync failed for {connection_name}: {str(e)}")

        return {
            "success": False,
            "sync_run": sync_run.name,
            "error": str(e)
        }


def _run_pull_sync(framework, sync_run):
    """Execute pull sync operation"""
    connection = framework.connection

    if connection.sync_invoices:
        page = 1
        while True:
            result = framework.fetch_invoices(page=page, sync_run=sync_run.name)

            if not result["success"]:
                sync_run.add_error("Invoice", "fetch", result.get("error", "Unknown error"))
                break

            invoices = result.get("data", {})
            if isinstance(invoices, dict):
                invoices = invoices.get("data", []) or invoices.get("invoices", [])

            if not invoices:
                break

            sync_run.records_fetched = (sync_run.records_fetched or 0) + len(invoices)

            for invoice in invoices:
                try:
                    _process_fetched_invoice(invoice, connection, sync_run)
                except Exception as e:
                    sync_run.add_error("Invoice", invoice.get("id", "unknown"), str(e))

            sync_run.save()
            frappe.db.commit()

            # Check if there are more pages
            if not framework.connector or not framework.connector.supports_pagination:
                break
            if len(invoices) < (framework.connector.page_size_limit or 100):
                break

            page += 1

    if connection.sync_customers:
        result = framework.fetch_customers(sync_run=sync_run.name)
        if result["success"]:
            customers = result.get("data", {})
            if isinstance(customers, dict):
                customers = customers.get("data", []) or customers.get("customers", [])

            for customer in customers:
                try:
                    _process_fetched_customer(customer, connection, sync_run)
                except Exception as e:
                    sync_run.add_error("Customer", customer.get("id", "unknown"), str(e))


def _run_push_sync(framework, sync_run):
    """Execute push sync operation"""
    connection = framework.connection

    if connection.sync_invoices:
        # Get invoices that need to be pushed
        invoices = frappe.get_all(
            "Sales Invoice",
            filters={
                "company": connection.company,
                "docstatus": 1,
                "custom_asp_sync_status": ["in", ["Pending", "Error"]]
            },
            fields=["name"],
            limit=100
        )

        for inv in invoices:
            try:
                invoice_doc = frappe.get_doc("Sales Invoice", inv.name)
                invoice_data = _prepare_invoice_for_push(invoice_doc)

                result = framework.push_invoice(invoice_data, sync_run=sync_run.name)

                if result["success"]:
                    sync_run.records_pushed = (sync_run.records_pushed or 0) + 1
                    _update_invoice_sync_status(inv.name, "Synced", result.get("data"))
                else:
                    sync_run.add_error("Invoice", inv.name, result.get("error"))
                    _update_invoice_sync_status(inv.name, "Error", result.get("error"))

            except Exception as e:
                sync_run.add_error("Invoice", inv.name, str(e))

        sync_run.save()
        frappe.db.commit()


def _process_fetched_invoice(invoice_data, connection, sync_run):
    """Process a fetched invoice"""
    from digicomply.digicomply.doctype.transform_rule.transform_rule import apply_transforms

    # Apply inbound transforms
    if hasattr(connection, 'asp_provider'):
        connector = frappe.get_all(
            "ASP Connector",
            filters={"asp_provider": connection.asp_provider, "enabled": 1},
            limit=1
        )
        if connector:
            invoice_data = apply_transforms(
                invoice_data,
                connector[0].name,
                "Invoice",
                "Inbound"
            )

    # Check if invoice already exists
    existing = frappe.db.exists(
        "Sales Invoice",
        {"custom_asp_reference_id": invoice_data.get("id")}
    )

    if existing:
        sync_run.records_updated = (sync_run.records_updated or 0) + 1
    else:
        sync_run.records_created = (sync_run.records_created or 0) + 1


def _process_fetched_customer(customer_data, connection, sync_run):
    """Process a fetched customer"""
    # Check if customer already exists
    existing = frappe.db.exists(
        "Customer",
        {"custom_asp_reference_id": customer_data.get("id")}
    )

    if existing:
        sync_run.records_updated = (sync_run.records_updated or 0) + 1
    else:
        sync_run.records_created = (sync_run.records_created or 0) + 1


def _prepare_invoice_for_push(invoice_doc):
    """Prepare invoice data for pushing to ASP"""
    return {
        "id": invoice_doc.name,
        "invoice_number": invoice_doc.name,
        "date": str(invoice_doc.posting_date),
        "customer": invoice_doc.customer,
        "customer_name": invoice_doc.customer_name,
        "grand_total": invoice_doc.grand_total,
        "net_total": invoice_doc.net_total,
        "taxes": invoice_doc.total_taxes_and_charges,
        "currency": invoice_doc.currency,
        "items": [
            {
                "item_code": item.item_code,
                "item_name": item.item_name,
                "qty": item.qty,
                "rate": item.rate,
                "amount": item.amount
            }
            for item in invoice_doc.items
        ]
    }


def _update_invoice_sync_status(invoice_name, status, response_data=None):
    """Update invoice sync status"""
    frappe.db.set_value(
        "Sales Invoice",
        invoice_name,
        {
            "custom_asp_sync_status": status,
            "custom_asp_sync_time": now_datetime(),
            "custom_asp_response": json.dumps(response_data) if response_data else None
        }
    )


@frappe.whitelist()
def execute_sync_schedule(schedule_name):
    """Execute a sync schedule"""
    schedule = frappe.get_doc("Sync Schedule", schedule_name)

    if not schedule.enabled:
        return {"success": False, "message": "Schedule is disabled"}

    result = run_sync(
        connection_name=schedule.asp_connection,
        direction=schedule.sync_direction or "Pull",
        trigger_type="Scheduled"
    )

    schedule.update_run_stats(result.get("success", False), result.get("error"))

    return result


@frappe.whitelist()
def get_connection_status(connection_name):
    """Get detailed status for a connection"""
    connection = frappe.get_doc("ASP Connection", connection_name)

    # Get recent sync runs
    recent_runs = frappe.get_all(
        "Sync Run",
        filters={"asp_connection": connection_name},
        fields=[
            "name", "run_status", "started_at", "completed_at",
            "records_fetched", "records_pushed", "records_failed"
        ],
        order_by="started_at desc",
        limit=5
    )

    # Get sync stats
    from digicomply.digicomply.doctype.sync_run.sync_run import get_sync_stats
    stats = get_sync_stats(connection_name, days=7)

    return {
        "connection": {
            "name": connection.name,
            "provider": connection.asp_provider,
            "status": connection.connection_status,
            "last_sync": connection.last_sync_at,
            "next_sync": connection.next_sync_at,
            "total_syncs": connection.total_syncs,
            "successful_syncs": connection.successful_syncs,
            "failed_syncs": connection.failed_syncs
        },
        "recent_runs": recent_runs,
        "stats": stats
    }


@frappe.whitelist()
def get_dashboard_data():
    """Get data for the sync dashboard"""
    connections = frappe.get_all(
        "ASP Connection",
        filters={"enabled": 1},
        fields=[
            "name", "asp_provider", "company", "connection_status",
            "last_sync_at", "next_sync_at", "total_syncs",
            "successful_syncs", "failed_syncs"
        ]
    )

    # Get running syncs
    running_syncs = frappe.get_all(
        "Sync Run",
        filters={"run_status": "Running"},
        fields=["name", "asp_connection", "started_at", "progress_percent"]
    )

    # Get recent errors
    recent_errors = frappe.get_all(
        "Sync Run",
        filters={"run_status": ["in", ["Failed", "Completed with Errors"]]},
        fields=["name", "asp_connection", "started_at", "error_details"],
        order_by="started_at desc",
        limit=10
    )

    # Get schedules
    schedules = frappe.get_all(
        "Sync Schedule",
        filters={"enabled": 1},
        fields=[
            "name", "schedule_name", "asp_connection", "frequency",
            "next_run_at", "schedule_status"
        ]
    )

    return {
        "connections": connections,
        "running_syncs": running_syncs,
        "recent_errors": recent_errors,
        "schedules": schedules
    }
