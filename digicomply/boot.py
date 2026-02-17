# Copyright (c) 2024, DigiComply
# License: MIT

"""
Boot session customization for DigiComply.
Server-side filtering of workspaces and modules.
"""

import frappe


# Workspaces to SHOW (whitelist)
ALLOWED_WORKSPACES = [
    "DigiComply",
    "Accounting",
    "Selling",
    "Buying",
    "Home",
]

# Modules to SHOW
ALLOWED_MODULES = [
    "DigiComply",
    "Accounts",
    "Selling",
    "Buying",
    "Setup",
]


def boot_session(bootinfo):
    """
    Customize boot session for DigiComply.
    Called via boot_session hook on every page load.
    """
    # Filter modules
    if "module_app" in bootinfo:
        bootinfo["module_app"] = {
            k: v for k, v in bootinfo["module_app"].items()
            if k in ALLOWED_MODULES
        }

    # Filter allowed_workspaces if present
    if "allowed_workspaces" in bootinfo:
        bootinfo["allowed_workspaces"] = [
            ws for ws in bootinfo["allowed_workspaces"]
            if ws.get("name") in ALLOWED_WORKSPACES
        ]

    # Filter sidebar_pages if present (Frappe v15+)
    if "sidebar_pages" in bootinfo:
        bootinfo["sidebar_pages"] = [
            page for page in bootinfo["sidebar_pages"]
            if page.get("name") in ALLOWED_WORKSPACES or
               page.get("title") in ALLOWED_WORKSPACES
        ]

    # Set DigiComply branding
    bootinfo["app_name"] = "DigiComply"

    if "sysdefaults" not in bootinfo:
        bootinfo["sysdefaults"] = {}
    bootinfo["sysdefaults"]["app_name"] = "DigiComply"

    # DigiComply specific data - Purple theme matching CSS
    bootinfo["digicomply"] = {
        "version": "1.0.0",
        "brand_color": "#a404e4",
        "brand_color_dark": "#8501b9",
        "brand_color_light": "#c44df7",
        "app_title": "DigiComply",
        "app_tagline": "UAE E-Invoicing Compliance & Reconciliation Platform",
        "allowed_workspaces": ALLOWED_WORKSPACES,
        "hide_frappe_branding": True,
    }


def get_bootinfo(bootinfo):
    """Alternative hook."""
    boot_session(bootinfo)
