# Copyright (c) 2026, DigiComply and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import now_datetime, time_diff_in_seconds
import re


class UserSessionLog(Document):
    """
    User Session Log for Security Audit Compliance

    Features:
    - Tracks user login/logout events
    - Captures device and location info
    - Monitors activity during session
    - Detects suspicious patterns
    """

    def before_insert(self):
        """Set up session log before saving"""
        self.set_user_info()
        self.parse_user_agent()
        self.check_suspicious_activity()

    def set_user_info(self):
        """Capture user information"""
        if self.user and not self.user_full_name:
            self.user_full_name = frappe.db.get_value("User", self.user, "full_name")

        if not self.login_time:
            self.login_time = now_datetime()

        if not self.last_activity:
            self.last_activity = self.login_time

    def parse_user_agent(self):
        """Parse user agent string to extract device info"""
        if not self.user_agent:
            return

        ua = self.user_agent.lower()

        # Detect device type
        if any(x in ua for x in ["mobile", "android", "iphone", "ipod"]):
            self.device_type = "Mobile"
        elif any(x in ua for x in ["tablet", "ipad"]):
            self.device_type = "Tablet"
        elif any(x in ua for x in ["windows", "macintosh", "linux", "x11"]):
            self.device_type = "Desktop"
        else:
            self.device_type = "Unknown"

        # Detect browser
        if "chrome" in ua and "edg" not in ua:
            self.browser = "Chrome"
        elif "firefox" in ua:
            self.browser = "Firefox"
        elif "safari" in ua and "chrome" not in ua:
            self.browser = "Safari"
        elif "edg" in ua:
            self.browser = "Edge"
        elif "opera" in ua or "opr" in ua:
            self.browser = "Opera"
        else:
            self.browser = "Other"

        # Detect OS
        if "windows" in ua:
            self.os = "Windows"
        elif "macintosh" in ua or "mac os" in ua:
            self.os = "macOS"
        elif "linux" in ua and "android" not in ua:
            self.os = "Linux"
        elif "android" in ua:
            self.os = "Android"
        elif "iphone" in ua or "ipad" in ua:
            self.os = "iOS"
        else:
            self.os = "Other"

    def check_suspicious_activity(self):
        """Check for suspicious login patterns"""
        if not self.user or not self.ip_address:
            return

        # Check for multiple active sessions from different IPs
        active_sessions = frappe.db.count(
            "User Session Log",
            filters={
                "user": self.user,
                "session_status": "Active",
                "ip_address": ["!=", self.ip_address]
            }
        )

        if active_sessions > 2:
            self.suspicious_activity = 1

        # Check for rapid location changes (impossible travel)
        recent_session = frappe.db.get_value(
            "User Session Log",
            filters={
                "user": self.user,
                "name": ["!=", self.name or ""]
            },
            fieldname=["ip_address", "login_time", "geo_location"],
            order_by="login_time desc",
            as_dict=True
        )

        if recent_session and recent_session.ip_address != self.ip_address:
            # Different IP in short time span could be suspicious
            if recent_session.login_time:
                time_diff = time_diff_in_seconds(now_datetime(), recent_session.login_time)
                if time_diff < 300:  # Less than 5 minutes
                    self.suspicious_activity = 1

        # Count failed attempts
        self.failed_attempts_before = frappe.db.count(
            "Activity Log",
            filters={
                "user": self.user,
                "operation": "Login",
                "status": "Failed",
                "creation": [">=", frappe.utils.add_days(now_datetime(), -1)]
            }
        )

        if self.failed_attempts_before > 5:
            self.suspicious_activity = 1

    def on_trash(self):
        """Prevent deletion of session logs"""
        frappe.throw(
            "User Session Logs cannot be deleted. "
            "This is required for security audit compliance.",
            title="Cannot Delete Session Log"
        )

    def end_session(self, reason="User Logout"):
        """End the session and calculate duration"""
        self.logout_time = now_datetime()
        self.session_status = "Logout" if reason == "User Logout" else reason

        if self.login_time:
            duration_seconds = time_diff_in_seconds(self.logout_time, self.login_time)
            self.session_duration = duration_seconds

        self.logout_reason = reason
        self.save(ignore_permissions=True)

    def update_activity(self, activity_type="page_visit"):
        """Update session activity counters"""
        self.last_activity = now_datetime()

        activity_map = {
            "page_visit": "pages_visited",
            "document_create": "documents_created",
            "document_modify": "documents_modified",
            "report_generate": "reports_generated",
            "data_export": "data_exported",
            "api_call": "api_calls"
        }

        field = activity_map.get(activity_type)
        if field:
            current_value = getattr(self, field, 0) or 0
            setattr(self, field, current_value + 1)

        self.save(ignore_permissions=True)

    @staticmethod
    def log_login(user, session_id=None, login_type="Web"):
        """Log a new user login"""
        try:
            ip_address = None
            user_agent = None

            if hasattr(frappe.local, 'request_ip'):
                ip_address = frappe.local.request_ip

            if hasattr(frappe.local, 'request') and frappe.local.request:
                user_agent = frappe.local.request.headers.get('User-Agent', '')[:500]

            session_log = frappe.get_doc({
                "doctype": "User Session Log",
                "user": user,
                "session_id": session_id or frappe.session.sid,
                "login_type": login_type,
                "ip_address": ip_address,
                "user_agent": user_agent,
                "session_status": "Active"
            })

            session_log.insert(ignore_permissions=True)
            return session_log.name

        except Exception as e:
            frappe.log_error(f"Failed to log session: {str(e)}", "Session Log Error")
            return None

    @staticmethod
    def log_logout(user=None, session_id=None, reason="User Logout"):
        """Log user logout"""
        filters = {"session_status": "Active"}

        if session_id:
            filters["session_id"] = session_id
        elif user:
            filters["user"] = user
        else:
            filters["user"] = frappe.session.user

        session_name = frappe.db.get_value("User Session Log", filters, "name")

        if session_name:
            session = frappe.get_doc("User Session Log", session_name)
            session.end_session(reason)
            return session_name

        return None

    @staticmethod
    def get_active_sessions(user=None):
        """Get all active sessions, optionally filtered by user"""
        filters = {"session_status": "Active"}
        if user:
            filters["user"] = user

        return frappe.get_all(
            "User Session Log",
            filters=filters,
            fields=[
                "name", "user", "user_full_name", "login_time",
                "last_activity", "ip_address", "device_type",
                "browser", "os", "suspicious_activity"
            ],
            order_by="login_time desc"
        )

    @staticmethod
    def force_logout(session_name, reason="Forced Logout by Admin"):
        """Force logout a session (admin action)"""
        session = frappe.get_doc("User Session Log", session_name)
        session.end_session(reason)

        # Also invalidate the actual session if possible
        if session.session_id:
            frappe.db.delete("Sessions", {"sid": session.session_id})

        return True


@frappe.whitelist()
def get_my_sessions():
    """Get current user's active sessions"""
    return UserSessionLog.get_active_sessions(frappe.session.user)


@frappe.whitelist()
def get_all_active_sessions():
    """Get all active sessions (admin only)"""
    if "System Manager" not in frappe.get_roles():
        frappe.throw("Not authorized")
    return UserSessionLog.get_active_sessions()


@frappe.whitelist()
def force_logout_session(session_name, reason=None):
    """Force logout a session (admin only)"""
    if "System Manager" not in frappe.get_roles():
        frappe.throw("Not authorized")

    UserSessionLog.force_logout(
        session_name,
        reason or "Forced Logout by Admin"
    )
    return {"success": True}


@frappe.whitelist()
def get_user_login_history(user, limit=50):
    """Get login history for a user"""
    return frappe.get_all(
        "User Session Log",
        filters={"user": user},
        fields=[
            "name", "login_time", "logout_time", "session_duration",
            "session_status", "ip_address", "device_type", "browser",
            "os", "suspicious_activity", "logout_reason"
        ],
        order_by="login_time desc",
        limit=limit
    )


@frappe.whitelist()
def get_suspicious_sessions(days=7):
    """Get sessions flagged as suspicious"""
    from_date = frappe.utils.add_days(now_datetime(), -days)

    return frappe.get_all(
        "User Session Log",
        filters={
            "suspicious_activity": 1,
            "login_time": [">=", from_date]
        },
        fields=[
            "name", "user", "user_full_name", "login_time",
            "ip_address", "device_type", "failed_attempts_before",
            "session_status"
        ],
        order_by="login_time desc"
    )
