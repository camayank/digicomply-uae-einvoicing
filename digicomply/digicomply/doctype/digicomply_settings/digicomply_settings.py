# Copyright (c) 2024, DigiComply and contributors
# License: MIT

import frappe
from frappe.model.document import Document


class DigiComplySettings(Document):
    """
    DigiComply Settings - Single DocType for app configuration

    Stores:
    - ASP credentials (ClearTax, Cygnet, etc.)
    - Sync settings
    - Notification preferences
    - Compliance thresholds
    """

    def validate(self):
        self.validate_api_credentials()

    def validate_api_credentials(self):
        """Ensure API credentials are provided if integration is enabled"""
        if self.cleartax_enabled:
            if not self.cleartax_api_key:
                frappe.throw("ClearTax API Key is required when ClearTax is enabled")

        if self.cygnet_enabled:
            if not self.cygnet_username or not self.cygnet_password:
                frappe.throw("Cygnet username and password are required when Cygnet is enabled")


def get_settings():
    """Get DigiComply Settings singleton"""
    return frappe.get_single("DigiComply Settings")


@frappe.whitelist()
def test_cleartax_connection():
    """Test ClearTax API connection"""
    settings = get_settings()

    if not settings.cleartax_enabled:
        return {"status": "error", "message": "ClearTax is not enabled"}

    # TODO: Implement actual API test
    # For MVP, just validate credentials exist
    if settings.cleartax_api_key and settings.cleartax_api_secret:
        return {"status": "success", "message": "Credentials configured"}
    else:
        return {"status": "error", "message": "Missing API credentials"}


@frappe.whitelist()
def test_cygnet_connection():
    """Test Cygnet API connection"""
    settings = get_settings()

    if not settings.cygnet_enabled:
        return {"status": "error", "message": "Cygnet is not enabled"}

    if settings.cygnet_username and settings.cygnet_password:
        return {"status": "success", "message": "Credentials configured"}
    else:
        return {"status": "error", "message": "Missing credentials"}
