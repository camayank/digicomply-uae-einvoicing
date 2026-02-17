# Copyright (c) 2026, DigiComply and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import now_datetime, add_to_date
import requests
import json


class ASPConnection(Document):
    def validate(self):
        self.set_base_url()
        self.validate_credentials()

    def set_base_url(self):
        """Set base URL based on provider and environment"""
        if not self.base_url:
            urls = {
                "ClearTax": {
                    "Production": "https://api.cleartax.in",
                    "Sandbox": "https://sandbox.cleartax.in",
                    "UAT": "https://uat.cleartax.in"
                },
                "Cygnet": {
                    "Production": "https://api.cygnet.one",
                    "Sandbox": "https://sandbox-api.cygnet.one",
                    "UAT": "https://uat-api.cygnet.one"
                },
                "Zoho": {
                    "Production": "https://invoice.zoho.com/api/v3",
                    "Sandbox": "https://invoice.zoho.com/api/v3",
                    "UAT": "https://invoice.zoho.com/api/v3"
                },
                "Tabadul": {
                    "Production": "https://api.tabadul.ae",
                    "Sandbox": "https://sandbox.tabadul.ae",
                    "UAT": "https://uat.tabadul.ae"
                }
            }
            provider_urls = urls.get(self.asp_provider, {})
            self.base_url = provider_urls.get(self.environment, "")

    def validate_credentials(self):
        """Validate that required credentials are provided"""
        if self.auth_type == "API Key":
            if not self.api_key:
                frappe.throw("API Key is required for API Key authentication")
        elif self.auth_type == "OAuth 2.0":
            if not self.client_id or not self.client_secret:
                frappe.throw("Client ID and Client Secret are required for OAuth 2.0")
        elif self.auth_type == "Basic Auth":
            if not self.api_key or not self.api_secret:
                frappe.throw("Username and Password are required for Basic Auth")

    def before_save(self):
        # Set redirect URI for OAuth
        if self.auth_type == "OAuth 2.0" and not self.redirect_uri:
            site_url = frappe.utils.get_url()
            self.redirect_uri = f"{site_url}/api/method/digicomply.digicomply.doctype.asp_connection.asp_connection.oauth_callback"

        # Calculate next sync time
        if self.auto_sync_enabled and self.sync_interval_minutes:
            if self.last_sync_at:
                self.next_sync_at = add_to_date(
                    self.last_sync_at,
                    minutes=self.sync_interval_minutes
                )
            else:
                self.next_sync_at = now_datetime()

    @frappe.whitelist()
    def test_connection(self):
        """Test the connection to the ASP"""
        try:
            headers = self._get_auth_headers()
            test_endpoint = self._get_test_endpoint()

            response = requests.get(
                f"{self.base_url}{test_endpoint}",
                headers=headers,
                timeout=self.timeout_seconds or 30
            )

            if response.status_code in [200, 201]:
                self.connection_status = "Connected"
                self.last_error = None
                self.save()
                return {
                    "success": True,
                    "message": "Connection successful",
                    "status_code": response.status_code
                }
            else:
                self.connection_status = "Error"
                self.last_error = f"HTTP {response.status_code}: {response.text[:500]}"
                self.save()
                return {
                    "success": False,
                    "message": f"Connection failed: HTTP {response.status_code}",
                    "status_code": response.status_code
                }

        except requests.exceptions.Timeout:
            self.connection_status = "Error"
            self.last_error = "Connection timeout"
            self.save()
            return {"success": False, "message": "Connection timeout"}

        except requests.exceptions.ConnectionError as e:
            self.connection_status = "Error"
            self.last_error = str(e)[:500]
            self.save()
            return {"success": False, "message": f"Connection error: {str(e)}"}

        except Exception as e:
            self.connection_status = "Error"
            self.last_error = str(e)[:500]
            self.save()
            return {"success": False, "message": str(e)}

    def _get_auth_headers(self):
        """Get authentication headers based on auth type"""
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json"
        }

        if self.auth_type == "API Key":
            api_key = self.get_password("api_key")
            if self.asp_provider == "ClearTax":
                headers["x-cleartax-auth-token"] = api_key
            elif self.asp_provider == "Cygnet":
                headers["Authorization"] = f"Bearer {api_key}"
            else:
                headers["X-API-Key"] = api_key

        elif self.auth_type == "OAuth 2.0":
            access_token = self.get_password("access_token")
            if access_token:
                headers["Authorization"] = f"Bearer {access_token}"

        elif self.auth_type == "Basic Auth":
            import base64
            username = self.get_password("api_key")
            password = self.get_password("api_secret")
            credentials = base64.b64encode(f"{username}:{password}".encode()).decode()
            headers["Authorization"] = f"Basic {credentials}"

        return headers

    def _get_test_endpoint(self):
        """Get test endpoint based on provider"""
        endpoints = {
            "ClearTax": "/v1/business",
            "Cygnet": "/api/v1/health",
            "Zoho": "/settings/preferences",
            "Tabadul": "/api/v1/status",
            "Tally": "/health"
        }
        return endpoints.get(self.asp_provider, "/health")

    @frappe.whitelist()
    def initiate_oauth(self):
        """Initiate OAuth 2.0 flow"""
        if self.auth_type != "OAuth 2.0":
            frappe.throw("OAuth is only available for OAuth 2.0 authentication type")

        if not self.authorization_url:
            frappe.throw("Authorization URL is required for OAuth")

        # Store state for CSRF protection
        import secrets
        state = secrets.token_urlsafe(32)
        frappe.cache().set_value(f"oauth_state_{self.name}", state, expires_in_sec=600)

        # Build authorization URL
        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "response_type": "code",
            "state": state,
            "scope": self._get_oauth_scope()
        }

        auth_url = f"{self.authorization_url}?" + "&".join(
            f"{k}={v}" for k, v in params.items()
        )

        return {"authorization_url": auth_url}

    def _get_oauth_scope(self):
        """Get OAuth scope based on provider"""
        scopes = {
            "Zoho": "ZohoInvoice.fullaccess.all",
            "ClearTax": "read write",
            "Cygnet": "einvoice"
        }
        return scopes.get(self.asp_provider, "read")

    @frappe.whitelist()
    def refresh_oauth_token(self):
        """Refresh OAuth 2.0 access token"""
        if self.auth_type != "OAuth 2.0":
            return {"success": False, "message": "Not OAuth connection"}

        refresh_token = self.get_password("refresh_token")
        if not refresh_token:
            return {"success": False, "message": "No refresh token available"}

        try:
            response = requests.post(
                self.token_url,
                data={
                    "grant_type": "refresh_token",
                    "refresh_token": refresh_token,
                    "client_id": self.client_id,
                    "client_secret": self.get_password("client_secret")
                },
                timeout=30
            )

            if response.status_code == 200:
                token_data = response.json()
                self.access_token = token_data.get("access_token")
                if token_data.get("refresh_token"):
                    self.refresh_token = token_data.get("refresh_token")

                expires_in = token_data.get("expires_in", 3600)
                self.token_expiry = add_to_date(now_datetime(), seconds=expires_in)
                self.connection_status = "Connected"
                self.save()

                return {"success": True, "message": "Token refreshed successfully"}
            else:
                self.connection_status = "Expired"
                self.save()
                return {"success": False, "message": f"Token refresh failed: {response.text}"}

        except Exception as e:
            return {"success": False, "message": str(e)}

    @frappe.whitelist()
    def sync_now(self):
        """Trigger immediate sync"""
        from digicomply.digicomply.api.connector_framework import run_sync

        return run_sync(self.name)

    def update_sync_stats(self, success):
        """Update sync statistics"""
        self.total_syncs = (self.total_syncs or 0) + 1
        self.last_sync_at = now_datetime()

        if success:
            self.successful_syncs = (self.successful_syncs or 0) + 1
            self.last_successful_sync = now_datetime()
        else:
            self.failed_syncs = (self.failed_syncs or 0) + 1

        # Calculate next sync time
        if self.auto_sync_enabled and self.sync_interval_minutes:
            self.next_sync_at = add_to_date(
                now_datetime(),
                minutes=self.sync_interval_minutes
            )

        self.save()


@frappe.whitelist()
def oauth_callback(code=None, state=None, error=None):
    """Handle OAuth callback"""
    if error:
        frappe.throw(f"OAuth error: {error}")

    if not code or not state:
        frappe.throw("Invalid OAuth callback parameters")

    # Find connection by state
    connections = frappe.get_all(
        "ASP Connection",
        filters={"auth_type": "OAuth 2.0"},
        pluck="name"
    )

    for conn_name in connections:
        stored_state = frappe.cache().get_value(f"oauth_state_{conn_name}")
        if stored_state == state:
            conn = frappe.get_doc("ASP Connection", conn_name)

            # Exchange code for token
            try:
                response = requests.post(
                    conn.token_url,
                    data={
                        "grant_type": "authorization_code",
                        "code": code,
                        "redirect_uri": conn.redirect_uri,
                        "client_id": conn.client_id,
                        "client_secret": conn.get_password("client_secret")
                    },
                    timeout=30
                )

                if response.status_code == 200:
                    token_data = response.json()
                    conn.access_token = token_data.get("access_token")
                    conn.refresh_token = token_data.get("refresh_token")

                    expires_in = token_data.get("expires_in", 3600)
                    conn.token_expiry = add_to_date(now_datetime(), seconds=expires_in)
                    conn.connection_status = "Connected"
                    conn.save()

                    # Clear state
                    frappe.cache().delete_value(f"oauth_state_{conn_name}")

                    frappe.local.response["type"] = "redirect"
                    frappe.local.response["location"] = f"/app/asp-connection/{conn_name}"
                    return

            except Exception as e:
                frappe.throw(f"Token exchange failed: {str(e)}")

    frappe.throw("Invalid OAuth state")


@frappe.whitelist()
def get_connections_for_company(company):
    """Get all ASP connections for a company"""
    return frappe.get_all(
        "ASP Connection",
        filters={"company": company, "enabled": 1},
        fields=["name", "asp_provider", "connection_status", "last_sync_at", "is_default"]
    )
