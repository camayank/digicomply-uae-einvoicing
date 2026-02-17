# Copyright (c) 2026, DigiComply and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
import json


class ASPConnector(Document):
    def validate(self):
        self.validate_endpoints()
        self.validate_rate_limits()

    def validate_endpoints(self):
        """Ensure at least one endpoint is configured"""
        if not any([
            self.fetch_invoice_endpoint,
            self.push_invoice_endpoint,
            self.fetch_customer_endpoint,
            self.push_customer_endpoint
        ]):
            frappe.throw("At least one API endpoint must be configured")

    def validate_rate_limits(self):
        """Validate rate limit settings"""
        if self.rate_limit_per_minute and self.rate_limit_per_minute < 1:
            frappe.throw("Rate limit per minute must be at least 1")
        if self.rate_limit_per_hour and self.rate_limit_per_hour < self.rate_limit_per_minute:
            frappe.throw("Rate limit per hour cannot be less than rate limit per minute")

    def get_endpoint(self, operation):
        """Get endpoint URL for a specific operation"""
        endpoints = {
            "fetch_invoice": self.fetch_invoice_endpoint,
            "push_invoice": self.push_invoice_endpoint,
            "fetch_customer": self.fetch_customer_endpoint,
            "push_customer": self.push_customer_endpoint,
            "status": self.status_endpoint
        }
        return endpoints.get(operation, "")

    def get_field_mapping(self, doctype, direction="outbound"):
        """
        Get field mapping for a doctype
        direction: 'outbound' (Frappe -> ASP) or 'inbound' (ASP -> Frappe)
        """
        if doctype == "Sales Invoice":
            mappings = self.invoice_field_mappings
        elif doctype == "Customer":
            mappings = self.customer_field_mappings
        else:
            return {}

        result = {}
        for mapping in mappings:
            if direction == "outbound":
                result[mapping.source_field] = mapping.target_field
            else:
                result[mapping.target_field] = mapping.source_field

        return result

    def transform_data(self, data, doctype, direction="outbound"):
        """Transform data according to field mappings"""
        mapping = self.get_field_mapping(doctype, direction)
        transformed = {}

        for source_key, target_key in mapping.items():
            if source_key in data:
                transformed[target_key] = data[source_key]

        return transformed


@frappe.whitelist()
def get_connector_for_provider(asp_provider, connector_type=None):
    """Get active connector for an ASP provider"""
    filters = {
        "asp_provider": asp_provider,
        "enabled": 1
    }
    if connector_type:
        filters["connector_type"] = connector_type

    connectors = frappe.get_all(
        "ASP Connector",
        filters=filters,
        fields=["name", "connector_name", "connector_type", "version"]
    )

    return connectors


@frappe.whitelist()
def get_default_connectors():
    """Get default connector configurations for all providers"""
    return {
        "ClearTax": {
            "connector_type": "E-Invoice",
            "fetch_invoice_endpoint": "/v2/eInvoice/download",
            "push_invoice_endpoint": "/v2/eInvoice/generate",
            "status_endpoint": "/v2/eInvoice/status/{irn}",
            "supported_auth_types": "API Key",
            "requires_gstin": 1,
            "rate_limit_per_minute": 100,
            "supports_bulk_fetch": 1,
            "supports_bulk_push": 1,
            "request_format": "JSON",
            "response_format": "JSON"
        },
        "Cygnet": {
            "connector_type": "E-Invoice",
            "fetch_invoice_endpoint": "/api/v1/einvoice/get",
            "push_invoice_endpoint": "/api/v1/einvoice/generate",
            "status_endpoint": "/api/v1/einvoice/status",
            "supported_auth_types": "API Key",
            "requires_gstin": 1,
            "rate_limit_per_minute": 60,
            "supports_bulk_fetch": 1,
            "supports_bulk_push": 1,
            "request_format": "JSON",
            "response_format": "JSON"
        },
        "Zoho": {
            "connector_type": "E-Invoice",
            "fetch_invoice_endpoint": "/invoices",
            "push_invoice_endpoint": "/invoices",
            "status_endpoint": "/invoices/{id}",
            "supported_auth_types": "OAuth 2.0",
            "requires_gstin": 0,
            "rate_limit_per_minute": 100,
            "supports_bulk_fetch": 1,
            "supports_bulk_push": 0,
            "supports_pagination": 1,
            "page_size_limit": 200,
            "request_format": "JSON",
            "response_format": "JSON"
        },
        "Tabadul": {
            "connector_type": "E-Invoice",
            "fetch_invoice_endpoint": "/api/v1/invoices",
            "push_invoice_endpoint": "/api/v1/invoices/submit",
            "status_endpoint": "/api/v1/invoices/{uuid}/status",
            "supported_auth_types": "Certificate",
            "requires_certificate": 1,
            "certificate_type": "PFX",
            "rate_limit_per_minute": 30,
            "supports_bulk_fetch": 1,
            "supports_bulk_push": 1,
            "request_format": "XML",
            "response_format": "XML"
        }
    }
