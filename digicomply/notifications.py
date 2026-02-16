# Copyright (c) 2024, DigiComply and contributors
# License: MIT

"""
DigiComply Notification Configuration
"""

import frappe


def get_notification_config():
    """
    Return notification configuration for DigiComply

    This enables desk notifications for:
    - New reconciliation results
    - Critical compliance issues
    - ASP sync status updates
    """
    return {
        "for_doctype": {
            "Reconciliation Run": {
                "status": ("in", ("Failed", "Completed")),
            },
            "Mismatch Report": {
                "critical_issues": (">", 0),
            },
            "CSV Import": {
                "status": ("in", ("Failed", "Completed")),
            },
        },
        "for_module_doctypes": {
            "DigiComply": [
                "Reconciliation Run",
                "Reconciliation Item",
                "CSV Import",
                "Mismatch Report",
            ],
        },
        "for_other": {
            "Compliance Alert": get_compliance_alerts,
        },
    }


def get_compliance_alerts():
    """
    Get count of compliance alerts

    Returns:
        int: Number of unresolved compliance issues
    """
    # Count reconciliation runs with issues
    critical_count = frappe.db.count(
        "Reconciliation Run",
        filters={
            "docstatus": 1,
            "missing_in_asp": (">", 0),
        }
    )

    return critical_count


def send_compliance_alert(reconciliation_run: str):
    """
    Send email alert for compliance issues

    Args:
        reconciliation_run: Reconciliation Run name
    """
    settings = frappe.get_single("DigiComply Settings")

    if not settings.enable_email_alerts:
        return

    doc = frappe.get_doc("Reconciliation Run", reconciliation_run)

    # Only alert if below threshold
    if doc.match_percentage >= settings.alert_threshold:
        return

    recipients = [r.strip() for r in (settings.alert_recipients or "").split(",") if r.strip()]

    if not recipients:
        return

    subject = f"[DigiComply] Compliance Alert: {doc.company} - {doc.match_percentage:.1f}%"

    message = f"""
    <h2>Compliance Alert</h2>

    <p>A reconciliation run has completed with a compliance score below the threshold.</p>

    <table style="border-collapse: collapse; width: 100%;">
        <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Company</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">{doc.company}</td>
        </tr>
        <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Period</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">{doc.from_date} to {doc.to_date}</td>
        </tr>
        <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Compliance Score</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">{doc.match_percentage:.1f}%</td>
        </tr>
        <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Missing in ASP</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd; color: red;">{doc.missing_in_asp}</td>
        </tr>
        <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Mismatched</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd; color: orange;">{doc.mismatched_count}</td>
        </tr>
    </table>

    <p>
        <a href="{frappe.utils.get_url()}/app/reconciliation-run/{doc.name}">
            View Reconciliation Details
        </a>
    </p>

    <p style="color: #666; font-size: 12px;">
        This alert was sent because the compliance score ({doc.match_percentage:.1f}%)
        is below the configured threshold ({settings.alert_threshold}%).
    </p>
    """

    frappe.sendmail(
        recipients=recipients,
        subject=subject,
        message=message,
        reference_doctype="Reconciliation Run",
        reference_name=doc.name,
    )
