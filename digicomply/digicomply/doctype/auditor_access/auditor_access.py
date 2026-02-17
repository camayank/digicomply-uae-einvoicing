# Copyright (c) 2026, DigiComply and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import now_datetime, getdate, add_days
import secrets
import string


class AuditorAccess(Document):
    """
    Auditor Access Management

    Features:
    - Time-limited access for external auditors
    - Auto user creation with External Auditor role
    - Scope-based access control
    - Activity tracking
    """

    def validate(self):
        """Validate access configuration"""
        self.validate_dates()
        self.check_auto_expire()

    def validate_dates(self):
        """Validate date ranges"""
        if self.valid_from and self.valid_until:
            if getdate(self.valid_from) > getdate(self.valid_until):
                frappe.throw("Valid From cannot be after Valid Until")

        if self.date_range_from and self.date_range_to:
            if getdate(self.date_range_from) > getdate(self.date_range_to):
                frappe.throw("Date Range From cannot be after Date Range To")

    def check_auto_expire(self):
        """Check if access should be auto-expired"""
        if self.auto_expire and self.valid_until:
            if getdate(self.valid_until) < getdate(now_datetime()):
                self.access_status = "Expired"

    def after_insert(self):
        """Create user account after access is created"""
        if self.access_status == "Active" and not self.auditor_user:
            self.create_auditor_user()

    @frappe.whitelist()
    def approve_access(self):
        """Approve auditor access"""
        self.access_status = "Active"
        self.approved_by = frappe.session.user
        self.approval_date = now_datetime()

        if not self.auditor_user:
            self.create_auditor_user()

        self.save()

        # Log to audit trail
        from digicomply.digicomply.doctype.audit_log.audit_log import AuditLog
        AuditLog.log_event(
            event_type="Auditor Access Granted",
            document_type="Auditor Access",
            document_name=self.name,
            description=f"Access granted to {self.auditor_name} ({self.auditor_email})",
            company=self.company,
            severity="Warning"
        )

        # Send welcome email
        self.send_access_email()

        return self

    @frappe.whitelist()
    def revoke_access(self, reason=None):
        """Revoke auditor access"""
        self.access_status = "Revoked"
        if reason:
            self.internal_notes = (self.internal_notes or "") + f"\n\nRevoked: {reason}"

        # Disable user account
        if self.auditor_user:
            frappe.db.set_value("User", self.auditor_user, "enabled", 0)

        self.save()

        # Log to audit trail
        from digicomply.digicomply.doctype.audit_log.audit_log import AuditLog
        AuditLog.log_event(
            event_type="Auditor Access Revoked",
            document_type="Auditor Access",
            document_name=self.name,
            description=f"Access revoked for {self.auditor_name}: {reason or 'No reason'}",
            company=self.company,
            severity="Warning"
        )

        return self

    @frappe.whitelist()
    def extend_access(self, new_valid_until):
        """Extend access validity"""
        if not self.extension_allowed:
            frappe.throw("Extension is not allowed for this access grant")

        old_valid_until = self.valid_until
        self.valid_until = new_valid_until
        self.access_status = "Active"

        # Re-enable user if disabled
        if self.auditor_user:
            frappe.db.set_value("User", self.auditor_user, "enabled", 1)

        self.save()

        # Log extension
        from digicomply.digicomply.doctype.audit_log.audit_log import AuditLog
        AuditLog.log_event(
            event_type="Settings Changed",
            document_type="Auditor Access",
            document_name=self.name,
            description=f"Access extended from {old_valid_until} to {new_valid_until}",
            company=self.company
        )

        return self

    def create_auditor_user(self):
        """Create a user account for the auditor"""
        if frappe.db.exists("User", self.auditor_email):
            # User exists, just link and add role
            user = frappe.get_doc("User", self.auditor_email)
            if "External Auditor" not in [r.role for r in user.roles]:
                user.append("roles", {"role": "External Auditor"})
                user.save(ignore_permissions=True)
            self.auditor_user = user.name
            return

        # Generate temporary password
        temp_password = self._generate_temp_password()

        # Create user
        user = frappe.get_doc({
            "doctype": "User",
            "email": self.auditor_email,
            "first_name": self.auditor_name.split()[0] if self.auditor_name else "Auditor",
            "last_name": " ".join(self.auditor_name.split()[1:]) if len(self.auditor_name.split()) > 1 else "",
            "enabled": 1,
            "user_type": "Website User",
            "send_welcome_email": 0,
            "new_password": temp_password,
            "roles": [{"role": "External Auditor"}]
        })
        user.insert(ignore_permissions=True)

        self.auditor_user = user.name
        self.save(ignore_permissions=True)

        # Store temp password for email
        self._temp_password = temp_password

    def _generate_temp_password(self):
        """Generate a secure temporary password"""
        alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
        return ''.join(secrets.choice(alphabet) for _ in range(16))

    def send_access_email(self):
        """Send access details to auditor"""
        try:
            temp_password = getattr(self, '_temp_password', None)

            subject = f"DigiComply Auditor Access - {self.company}"
            message = f"""
            <p>Dear {self.auditor_name},</p>

            <p>Your access to DigiComply has been approved for the following audit:</p>

            <ul>
                <li><strong>Company:</strong> {self.company}</li>
                <li><strong>Audit Type:</strong> {self.audit_type}</li>
                <li><strong>Reference:</strong> {self.audit_reference or 'N/A'}</li>
                <li><strong>Valid From:</strong> {self.valid_from}</li>
                <li><strong>Valid Until:</strong> {self.valid_until}</li>
                <li><strong>Access Level:</strong> {self.access_level}</li>
            </ul>

            <p><strong>Login Details:</strong></p>
            <ul>
                <li>Email: {self.auditor_email}</li>
                {'<li>Temporary Password: ' + temp_password + ' (please change on first login)</li>' if temp_password else ''}
            </ul>

            <p>Please access the Auditor Portal to view documents and submit requests.</p>

            <p>Best regards,<br>DigiComply Team</p>
            """

            frappe.sendmail(
                recipients=[self.auditor_email],
                subject=subject,
                message=message,
                delayed=False
            )

        except Exception as e:
            frappe.log_error(f"Failed to send auditor email: {str(e)}", "Auditor Email Error")

    def record_login(self):
        """Record auditor login"""
        self.last_login = now_datetime()
        self.login_count = (self.login_count or 0) + 1
        self.save(ignore_permissions=True)

    def record_document_access(self):
        """Record document access"""
        self.documents_accessed = (self.documents_accessed or 0) + 1
        self.save(ignore_permissions=True)

    def record_export(self):
        """Record data export"""
        self.exports_count = (self.exports_count or 0) + 1
        self.save(ignore_permissions=True)

    def can_access_document(self, doctype, docname):
        """Check if auditor can access a specific document"""
        if self.access_status != "Active":
            return False

        # Check validity period
        now = now_datetime()
        if self.valid_from and now < self.valid_from:
            return False
        if self.valid_until and now > self.valid_until:
            return False

        # Check allowed doctypes
        if self.allowed_doctypes:
            allowed = [d.strip() for d in self.allowed_doctypes.split(",")]
            if doctype not in allowed:
                return False

        # Check excluded doctypes
        if self.excluded_doctypes:
            excluded = [d.strip() for d in self.excluded_doctypes.split(",")]
            if doctype in excluded:
                return False

        # Check date range if document has posting_date
        if self.date_range_from or self.date_range_to:
            doc = frappe.get_doc(doctype, docname)
            posting_date = doc.get("posting_date") or doc.get("transaction_date")
            if posting_date:
                if self.date_range_from and getdate(posting_date) < getdate(self.date_range_from):
                    return False
                if self.date_range_to and getdate(posting_date) > getdate(self.date_range_to):
                    return False

        return True

    @staticmethod
    def get_active_access(user_email):
        """Get active access grant for a user"""
        return frappe.db.get_value(
            "Auditor Access",
            {
                "auditor_email": user_email,
                "access_status": "Active"
            },
            "name"
        )


@frappe.whitelist()
def approve_auditor_access(access_name):
    """API to approve auditor access"""
    access = frappe.get_doc("Auditor Access", access_name)
    access.approve_access()
    return {"success": True}


@frappe.whitelist()
def revoke_auditor_access(access_name, reason=None):
    """API to revoke auditor access"""
    access = frappe.get_doc("Auditor Access", access_name)
    access.revoke_access(reason)
    return {"success": True}


@frappe.whitelist()
def extend_auditor_access(access_name, new_valid_until):
    """API to extend auditor access"""
    access = frappe.get_doc("Auditor Access", access_name)
    access.extend_access(new_valid_until)
    return {"success": True}


def check_expired_access():
    """Cron job to expire access grants"""
    now = now_datetime()

    expired = frappe.get_all(
        "Auditor Access",
        filters={
            "access_status": "Active",
            "auto_expire": 1,
            "valid_until": ["<", now]
        },
        fields=["name"]
    )

    for access in expired:
        doc = frappe.get_doc("Auditor Access", access.name)
        doc.access_status = "Expired"

        # Disable user
        if doc.auditor_user:
            frappe.db.set_value("User", doc.auditor_user, "enabled", 0)

        doc.save(ignore_permissions=True)

        # Log expiration
        from digicomply.digicomply.doctype.audit_log.audit_log import AuditLog
        AuditLog.log_event(
            event_type="Auditor Access Revoked",
            document_type="Auditor Access",
            document_name=doc.name,
            description=f"Access auto-expired for {doc.auditor_name}",
            company=doc.company
        )
