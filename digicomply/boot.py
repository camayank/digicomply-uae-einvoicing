# Copyright (c) 2024, DigiComply
# License: MIT

"""
Boot session customization for DigiComply.
Hides unwanted modules and customizes the desk experience.
"""

import frappe


def boot_session(bootinfo):
    """
    Customize boot session for DigiComply branding.
    Called via boot_session hook on every page load.
    """
    # Hide unwanted workspaces/modules
    hidden_modules = [
        "Manufacturing",
        "Stock",
        "Assets",
        "CRM",
        "Projects",
        "Quality",
        "Support",
        "HR",
        "Loan Management",
        "Payroll",
        "Non Profit",
        "Education",
        "Healthcare",
        "Agriculture",
        "Hospitality",
    ]

    if "module_app" in bootinfo:
        bootinfo["module_app"] = {
            k: v for k, v in bootinfo["module_app"].items()
            if k not in hidden_modules
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
    }


def get_bootinfo(bootinfo):
    """Alternative hook for boot info customization."""
    boot_session(bootinfo)
