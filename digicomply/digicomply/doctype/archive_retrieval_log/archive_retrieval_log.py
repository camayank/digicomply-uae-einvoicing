# Copyright (c) 2026, DigiComply and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import now_datetime


class ArchiveRetrievalLog(Document):
    """
    Archive Retrieval Log for Audit Compliance

    Features:
    - Tracks all archive access
    - Records purpose and authorization
    - Immutable for audit purposes
    """

    def before_insert(self):
        """Set up log before saving"""
        self.set_defaults()
        self.capture_context()

    def set_defaults(self):
        """Set default values"""
        if not self.retrieval_time:
            self.retrieval_time = now_datetime()

        if not self.retrieved_by:
            self.retrieved_by = frappe.session.user

        if not self.retrieval_status:
            self.retrieval_status = "Success"

    def capture_context(self):
        """Capture context information"""
        if not self.ip_address and hasattr(frappe.local, 'request_ip'):
            self.ip_address = frappe.local.request_ip

        if not self.session_id and hasattr(frappe.session, 'sid'):
            self.session_id = frappe.session.sid

        # Get company and fiscal year from archive
        if self.document_archive:
            archive = frappe.get_doc("Document Archive", self.document_archive)
            if not self.company:
                self.company = archive.company
            if not self.fiscal_year:
                self.fiscal_year = archive.fiscal_year
            if not self.document_type:
                self.document_type = archive.document_type
            if not self.document_name:
                self.document_name = archive.document_name

    def on_update(self):
        """Prevent modifications after creation"""
        if self.get_doc_before_save():
            frappe.throw(
                "Archive Retrieval Logs are immutable and cannot be modified.",
                title="Immutable Record"
            )

    def on_trash(self):
        """Prevent deletion"""
        frappe.throw(
            "Archive Retrieval Logs cannot be deleted. "
            "This is required for audit compliance.",
            title="Cannot Delete"
        )

    @staticmethod
    def log_retrieval(
        document_archive,
        reason=None,
        purpose=None,
        reference_number=None,
        authorized_by=None
    ):
        """
        Create a retrieval log entry

        Usage:
            ArchiveRetrievalLog.log_retrieval(
                document_archive="ARCH-2026-000001",
                reason="Audit Request",
                purpose="FTA audit response",
                reference_number="AUD-2026-001"
            )
        """
        try:
            log = frappe.get_doc({
                "doctype": "Archive Retrieval Log",
                "document_archive": document_archive,
                "retrieval_reason": reason,
                "retrieval_purpose": purpose,
                "reference_number": reference_number,
                "authorized_by": authorized_by
            })

            log.insert(ignore_permissions=True)
            return log.name

        except Exception as e:
            frappe.log_error(
                f"Failed to log retrieval: {str(e)}",
                "Retrieval Log Error"
            )
            return None

    @staticmethod
    def get_retrieval_history(document_archive):
        """Get retrieval history for an archive"""
        return frappe.get_all(
            "Archive Retrieval Log",
            filters={"document_archive": document_archive},
            fields=[
                "name", "retrieval_time", "retrieved_by",
                "retrieval_reason", "retrieval_purpose",
                "retrieval_status", "reference_number"
            ],
            order_by="retrieval_time desc"
        )

    @staticmethod
    def get_user_retrievals(user, from_date=None, to_date=None):
        """Get all retrievals by a user"""
        filters = {"retrieved_by": user}

        if from_date and to_date:
            filters["retrieval_time"] = ["between", [from_date, to_date]]

        return frappe.get_all(
            "Archive Retrieval Log",
            filters=filters,
            fields=[
                "name", "document_archive", "document_type",
                "document_name", "retrieval_time", "retrieval_reason"
            ],
            order_by="retrieval_time desc"
        )


@frappe.whitelist()
def get_retrieval_stats(from_date=None, to_date=None, company=None):
    """Get retrieval statistics for a period"""
    filters = {}

    if from_date and to_date:
        filters["retrieval_time"] = ["between", [from_date, to_date]]
    if company:
        filters["company"] = company

    # Total retrievals
    total = frappe.db.count("Archive Retrieval Log", filters)

    # By reason
    by_reason = frappe.db.sql("""
        SELECT retrieval_reason, COUNT(*) as count
        FROM `tabArchive Retrieval Log`
        WHERE 1=1
        {company_filter}
        {date_filter}
        GROUP BY retrieval_reason
        ORDER BY count DESC
    """.format(
        company_filter=f"AND company = '{company}'" if company else "",
        date_filter=f"AND retrieval_time BETWEEN '{from_date}' AND '{to_date}'" if from_date and to_date else ""
    ), as_dict=True)

    # By user
    by_user = frappe.db.sql("""
        SELECT retrieved_by, COUNT(*) as count
        FROM `tabArchive Retrieval Log`
        WHERE 1=1
        {company_filter}
        {date_filter}
        GROUP BY retrieved_by
        ORDER BY count DESC
        LIMIT 10
    """.format(
        company_filter=f"AND company = '{company}'" if company else "",
        date_filter=f"AND retrieval_time BETWEEN '{from_date}' AND '{to_date}'" if from_date and to_date else ""
    ), as_dict=True)

    return {
        "total_retrievals": total,
        "by_reason": by_reason,
        "top_users": by_user
    }
