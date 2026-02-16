# Copyright (c) 2024, DigiComply
# License: MIT

import frappe
from frappe import _


@frappe.whitelist()
def complete_setup(data):
    """
    Complete DigiComply setup wizard.
    Creates company, configures defaults, and sets up initial data.
    """
    import json

    if isinstance(data, str):
        data = json.loads(data)

    try:
        # Create or update company
        company_name = data.get("company_name")
        if not frappe.db.exists("Company", company_name):
            company = frappe.get_doc({
                "doctype": "Company",
                "company_name": company_name,
                "country": "United Arab Emirates",
                "default_currency": data.get("currency", "AED"),
                "tax_id": data.get("trn"),
                "chart_of_accounts": "U.A.E - Chart of Accounts",
            })
            company.insert(ignore_permissions=True)

        # Update DigiComply Settings
        settings = frappe.get_single("DigiComply Settings")
        settings.default_company = company_name
        settings.default_asp_provider = data.get("asp_provider", "")
        settings.save(ignore_permissions=True)

        # Mark setup as complete
        frappe.db.set_value("System Settings", None, "setup_complete", 1)

        frappe.db.commit()

        return {"success": True, "company": company_name}

    except Exception as e:
        frappe.log_error(f"DigiComply Setup Error: {str(e)}")
        return {"success": False, "error": str(e)}
