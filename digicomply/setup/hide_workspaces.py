# Copyright (c) 2024, DigiComply
# Hide unwanted workspaces for focused UX

import frappe


ALLOWED_WORKSPACES = [
    "DigiComply",
    "Accounting",
    "Selling",
    "Buying",
    "Home",
]


def hide_unwanted_workspaces():
    """
    Hide all workspaces except the allowed ones.
    Sets public=0 for hidden workspaces.
    """
    all_workspaces = frappe.get_all(
        "Workspace",
        fields=["name", "public", "module"],
        filters={"public": 1}
    )

    hidden_count = 0
    for ws in all_workspaces:
        if ws.name not in ALLOWED_WORKSPACES:
            frappe.db.set_value("Workspace", ws.name, "public", 0)
            hidden_count += 1
            print(f"Hidden: {ws.name}")

    frappe.db.commit()
    print(f"\nHidden {hidden_count} workspaces. Kept {len(ALLOWED_WORKSPACES)} visible.")


def show_all_workspaces():
    """Restore all workspaces to public (for debugging)."""
    frappe.db.sql("UPDATE `tabWorkspace` SET public = 1")
    frappe.db.commit()
    print("All workspaces restored to public.")


def execute():
    """Entry point for bench execute."""
    hide_unwanted_workspaces()
