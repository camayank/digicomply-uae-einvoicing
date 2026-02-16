# Copyright (c) 2024, DigiComply
# License: MIT

"""
Boot session customization for DigiComply.
Hides unwanted modules/workspaces and customizes the desk experience.

DigiComply 20 Pillars - Visible Modules:
- DigiComply (Core product)
- Accounting (Sales/Purchase invoices)
- Selling (Customer, Sales Invoice source)
- Buying (Supplier, Purchase Invoice source)

Everything else is hidden for a focused compliance experience.
"""

import frappe


def boot_session(bootinfo):
    """
    Customize boot session for DigiComply branding.
    Called via boot_session hook on every page load.
    """
    # Modules to KEEP visible (whitelist approach for clarity)
    visible_modules = [
        "DigiComply",
        "Accounts",
        "Selling",
        "Buying",
        "Setup",  # Needed for basic settings
    ]

    # Hide all modules except visible ones
    if "module_app" in bootinfo:
        bootinfo["module_app"] = {
            k: v for k, v in bootinfo["module_app"].items()
            if k in visible_modules
        }

    # Set DigiComply as app name
    bootinfo["app_name"] = "DigiComply"

    # Override sysdefaults
    if "sysdefaults" not in bootinfo:
        bootinfo["sysdefaults"] = {}
    bootinfo["sysdefaults"]["app_name"] = "DigiComply"

    # Add DigiComply specific boot data
    bootinfo["digicomply"] = {
        "version": "0.1.0",
        "brand_color": "#1e40af",
        "pillars_enabled": [
            "csv_reconciliation",
            "mismatch_dashboard",
            "audit_pack_generator",
        ],
    }


def get_bootinfo(bootinfo):
    """Alternative hook for boot info customization."""
    boot_session(bootinfo)
