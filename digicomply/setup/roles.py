# Copyright (c) 2024, DigiComply
# License: MIT

"""
DigiComply role and permission setup utilities.
"""

import frappe
from frappe import _


# DigiComply roles configuration
DIGICOMPLY_ROLES = [
    {
        "role_name": "DigiComply Admin",
        "desk_access": 1,
        "description": "Full access to all DigiComply features including settings and configuration"
    },
    {
        "role_name": "Compliance Manager",
        "desk_access": 1,
        "description": "Access to all companies and operational features, no settings access"
    },
    {
        "role_name": "Company Accountant",
        "desk_access": 1,
        "description": "Full access to single company operations"
    },
    {
        "role_name": "Company Reviewer",
        "desk_access": 1,
        "description": "Read-only access to single company data"
    }
]

# DocTypes that operational roles can access (not settings)
OPERATIONAL_DOCTYPES = [
    "TRN Registry",
    "Company Group",
    "Bulk Import Log",
    "Import Template",
    "Reconciliation Run",
    "CSV Import",
    "Mismatch Report"
]

# Settings DocTypes (admin only)
SETTINGS_DOCTYPES = [
    "DigiComply Settings"
]

# All DigiComply DocTypes
ALL_DOCTYPES = OPERATIONAL_DOCTYPES + SETTINGS_DOCTYPES


def create_digicomply_roles():
    """
    Create DigiComply user roles.

    Creates the following roles:
    - DigiComply Admin: Full access to all DigiComply features
    - Compliance Manager: All companies, no settings access
    - Company Accountant: Single company full access
    - Company Reviewer: Single company read-only access
    """
    for role_config in DIGICOMPLY_ROLES:
        role_name = role_config["role_name"]

        if not frappe.db.exists("Role", role_name):
            role = frappe.get_doc({
                "doctype": "Role",
                "role_name": role_name,
                "desk_access": role_config.get("desk_access", 1),
                "is_custom": 1,
                "disabled": 0
            })
            role.insert(ignore_permissions=True)
            frappe.logger().info(f"Created role: {role_name}")
        else:
            # Update existing role
            role = frappe.get_doc("Role", role_name)
            role.desk_access = role_config.get("desk_access", 1)
            role.disabled = 0
            role.save(ignore_permissions=True)
            frappe.logger().info(f"Updated role: {role_name}")

    frappe.db.commit()


def setup_role_permissions():
    """
    Set up permissions for DigiComply DocTypes.

    Permission matrix:
    - DigiComply Admin: Full access (create, read, write, delete, submit, cancel) to all DocTypes
    - Compliance Manager: Create, read, write, submit to operational DocTypes (not Settings)
    - Company Accountant: Create, read, write, submit to operational DocTypes
    - Company Reviewer: Read-only to operational DocTypes
    """

    # DigiComply Admin - full access to all DocTypes
    for doctype in ALL_DOCTYPES:
        _add_permission(
            doctype=doctype,
            role="DigiComply Admin",
            permlevel=0,
            read=1,
            write=1,
            create=1,
            delete=1,
            submit=1,
            cancel=1,
            amend=1,
            report=1,
            export=1,
            import_=1,
            share=1,
            print_=1,
            email=1
        )

    # Compliance Manager - operational DocTypes only, no settings
    for doctype in OPERATIONAL_DOCTYPES:
        _add_permission(
            doctype=doctype,
            role="Compliance Manager",
            permlevel=0,
            read=1,
            write=1,
            create=1,
            delete=0,
            submit=1,
            cancel=0,
            amend=0,
            report=1,
            export=1,
            import_=0,
            share=1,
            print_=1,
            email=1
        )

    # Company Accountant - operational DocTypes, single company
    for doctype in OPERATIONAL_DOCTYPES:
        _add_permission(
            doctype=doctype,
            role="Company Accountant",
            permlevel=0,
            read=1,
            write=1,
            create=1,
            delete=0,
            submit=1,
            cancel=0,
            amend=0,
            report=1,
            export=1,
            import_=0,
            share=0,
            print_=1,
            email=1
        )

    # Company Reviewer - read-only to operational DocTypes
    for doctype in OPERATIONAL_DOCTYPES:
        _add_permission(
            doctype=doctype,
            role="Company Reviewer",
            permlevel=0,
            read=1,
            write=0,
            create=0,
            delete=0,
            submit=0,
            cancel=0,
            amend=0,
            report=1,
            export=1,
            import_=0,
            share=0,
            print_=1,
            email=0
        )

    frappe.db.commit()


def _add_permission(
    doctype,
    role,
    permlevel=0,
    read=0,
    write=0,
    create=0,
    delete=0,
    submit=0,
    cancel=0,
    amend=0,
    report=0,
    export=0,
    import_=0,
    share=0,
    print_=0,
    email=0
):
    """
    Add or update permission for a role on a DocType.

    Uses Custom DocPerm for custom permissions that persist across migrations.
    """
    # Check if DocType exists
    if not frappe.db.exists("DocType", doctype):
        frappe.logger().warning(f"DocType {doctype} does not exist, skipping permission setup")
        return

    # Check if permission already exists
    existing = frappe.db.exists("Custom DocPerm", {
        "parent": doctype,
        "role": role,
        "permlevel": permlevel
    })

    if existing:
        # Update existing permission
        perm = frappe.get_doc("Custom DocPerm", existing)
        perm.read = read
        perm.write = write
        perm.create = create
        perm.delete = delete
        perm.submit = submit
        perm.cancel = cancel
        perm.amend = amend
        perm.report = report
        perm.export = export
        perm.set("import", import_)
        perm.share = share
        perm.set("print", print_)
        perm.email = email
        perm.save(ignore_permissions=True)
        frappe.logger().info(f"Updated permission: {role} on {doctype}")
    else:
        # Create new permission
        perm = frappe.get_doc({
            "doctype": "Custom DocPerm",
            "parent": doctype,
            "parenttype": "DocType",
            "parentfield": "permissions",
            "role": role,
            "permlevel": permlevel,
            "read": read,
            "write": write,
            "create": create,
            "delete": delete,
            "submit": submit,
            "cancel": cancel,
            "amend": amend,
            "report": report,
            "export": export,
            "import": import_,
            "share": share,
            "print": print_,
            "email": email
        })
        perm.insert(ignore_permissions=True)
        frappe.logger().info(f"Created permission: {role} on {doctype}")


def remove_digicomply_roles():
    """
    Remove all DigiComply roles and their permissions.
    Useful for cleanup during uninstall.
    """
    # Remove custom permissions
    for doctype in ALL_DOCTYPES:
        for role_config in DIGICOMPLY_ROLES:
            role_name = role_config["role_name"]
            existing = frappe.db.get_all("Custom DocPerm", filters={
                "parent": doctype,
                "role": role_name
            }, pluck="name")
            for perm_name in existing:
                frappe.delete_doc("Custom DocPerm", perm_name, ignore_permissions=True)

    # Remove roles
    for role_config in DIGICOMPLY_ROLES:
        role_name = role_config["role_name"]
        if frappe.db.exists("Role", role_name):
            # Check if role is assigned to any users
            user_roles = frappe.db.count("Has Role", {"role": role_name})
            if user_roles > 0:
                frappe.logger().warning(
                    f"Role {role_name} is assigned to {user_roles} users, disabling instead of deleting"
                )
                frappe.db.set_value("Role", role_name, "disabled", 1)
            else:
                frappe.delete_doc("Role", role_name, ignore_permissions=True)
                frappe.logger().info(f"Deleted role: {role_name}")

    frappe.db.commit()
