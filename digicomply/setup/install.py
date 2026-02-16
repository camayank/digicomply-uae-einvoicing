# Copyright (c) 2024, DigiComply
# License: MIT

"""
DigiComply installation and setup utilities.
"""

import frappe
from frappe import _


def after_install():
    """Run after DigiComply app is installed."""
    setup_branding()
    setup_workspace_order()
    hide_unwanted_workspaces()
    create_placeholder_logos()
    frappe.db.commit()


def before_uninstall():
    """Run before DigiComply app is uninstalled."""
    pass


def after_migrate():
    """Run after bench migrate."""
    setup_branding()
    hide_unwanted_workspaces()
    frappe.db.commit()


def setup_branding():
    """Configure DigiComply branding in system settings."""

    # Update Website Settings
    try:
        ws = frappe.get_single("Website Settings")
        ws.app_name = "DigiComply"
        ws.app_logo = "/assets/digicomply/images/logo-full.svg"
        ws.favicon = "/assets/digicomply/images/favicon.svg"
        ws.disable_signup = 0
        ws.save(ignore_permissions=True)
    except Exception as e:
        frappe.log_error(f"Error setting website settings: {e}")

    # Update Navbar Settings
    try:
        ns = frappe.get_single("Navbar Settings")
        ns.app_logo = "/assets/digicomply/images/logo.svg"
        ns.save(ignore_permissions=True)
    except Exception as e:
        frappe.log_error(f"Error setting navbar settings: {e}")

    # Update System Settings
    try:
        ss = frappe.get_single("System Settings")
        ss.app_name = "DigiComply"
        ss.save(ignore_permissions=True)
    except Exception as e:
        frappe.log_error(f"Error setting system settings: {e}")


def hide_unwanted_workspaces():
    """Hide all workspaces except DigiComply-relevant ones."""
    from digicomply.setup.hide_workspaces import hide_unwanted_workspaces as do_hide
    try:
        do_hide()
    except Exception as e:
        frappe.log_error(f"Error hiding workspaces: {e}")


def setup_workspace_order():
    """Set DigiComply workspace as first in sidebar."""
    try:
        # Get DigiComply workspace
        if frappe.db.exists("Workspace", "DigiComply"):
            frappe.db.set_value("Workspace", "DigiComply", "sequence_id", 1)
    except Exception as e:
        frappe.log_error(f"Error setting workspace order: {e}")


def create_placeholder_logos():
    """Create placeholder logo files if they don't exist."""
    import os

    images_dir = os.path.join(
        frappe.get_app_path("digicomply"),
        "public", "images"
    )
    os.makedirs(images_dir, exist_ok=True)

    # Navbar logo
    navbar_svg = '''<svg xmlns="http://www.w3.org/2000/svg" width="160" height="40" viewBox="0 0 160 40">
  <rect width="160" height="40" fill="#1e40af"/>
  <text x="80" y="26" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="white" text-anchor="middle">DigiComply</text>
</svg>'''

    # Login logo
    login_svg = '''<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60" viewBox="0 0 200 60">
  <rect width="200" height="60" fill="#1e40af" rx="8"/>
  <text x="100" y="38" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="white" text-anchor="middle">DigiComply</text>
</svg>'''

    # Favicon
    favicon_svg = '''<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <rect width="32" height="32" fill="#1e40af" rx="4"/>
  <text x="16" y="22" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="white" text-anchor="middle">D</text>
</svg>'''

    logo_path = os.path.join(images_dir, "logo.svg")
    if not os.path.exists(logo_path):
        with open(logo_path, "w") as f:
            f.write(navbar_svg)

    login_path = os.path.join(images_dir, "logo-full.svg")
    if not os.path.exists(login_path):
        with open(login_path, "w") as f:
            f.write(login_svg)

    favicon_path = os.path.join(images_dir, "favicon.svg")
    if not os.path.exists(favicon_path):
        with open(favicon_path, "w") as f:
            f.write(favicon_svg)
