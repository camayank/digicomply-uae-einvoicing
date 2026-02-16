# Copyright (c) 2024, DigiComply and contributors
# License: MIT

import frappe
from frappe import _
from frappe.model.document import Document


class CompanyGroup(Document):
    """
    Company Group - Groups multiple legal entities for multi-TRN reconciliation

    Features:
    - Hierarchical group structure (parent-child groups)
    - Circular reference prevention
    - Unique company membership validation
    - Recursive company retrieval across hierarchy
    """

    def validate(self):
        """Run all validations before save"""
        self.validate_no_circular_reference()
        self.validate_unique_companies()

    def validate_no_circular_reference(self):
        """
        Prevent circular parent-child relationships.
        A group cannot be its own ancestor.
        """
        if not self.parent_group:
            return

        # Cannot be parent of itself
        if self.parent_group == self.name:
            frappe.throw(
                _("A Company Group cannot be its own parent.")
            )

        # Check for circular reference by traversing up the hierarchy
        visited = set()
        current = self.parent_group

        while current:
            if current in visited:
                frappe.throw(
                    _("Circular reference detected in group hierarchy. "
                      "Group '{0}' appears multiple times in the ancestor chain.").format(current)
                )

            if current == self.name:
                frappe.throw(
                    _("Circular reference detected: '{0}' cannot be a child of '{1}' "
                      "because '{1}' is already a descendant of '{0}'.").format(
                        self.name, self.parent_group
                    )
                )

            visited.add(current)

            # Get parent of current group
            parent = frappe.db.get_value("Company Group", current, "parent_group")
            current = parent

    def validate_unique_companies(self):
        """
        Ensure each company appears only once in this group.
        A company cannot be added to the same group multiple times.
        """
        if not self.companies:
            return

        company_list = []
        for row in self.companies:
            if row.company in company_list:
                frappe.throw(
                    _("Company '{0}' appears multiple times in this group. "
                      "Each company can only be added once.").format(row.company)
                )
            company_list.append(row.company)

    def get_all_companies(self, include_child_groups=True):
        """
        Get all companies in this group, optionally including companies
        from child groups recursively.

        Args:
            include_child_groups: If True, includes companies from all descendant groups

        Returns:
            list: List of dicts with company info
        """
        companies = []

        # Get companies directly in this group
        for row in self.companies:
            companies.append({
                "company": row.company,
                "trn": row.trn,
                "role_in_group": row.role_in_group,
                "is_primary": row.is_primary,
                "group": self.name,
                "group_level": 0
            })

        if include_child_groups:
            # Get all child groups recursively
            child_companies = self._get_child_group_companies(self.name, level=1)
            companies.extend(child_companies)

        return companies

    def _get_child_group_companies(self, group_name, level=1, visited=None):
        """
        Recursively get companies from child groups.

        Args:
            group_name: The parent group name to search under
            level: Current depth level in hierarchy
            visited: Set of already visited groups (prevents infinite loops)

        Returns:
            list: List of company dicts from child groups
        """
        if visited is None:
            visited = set()

        if group_name in visited:
            return []

        visited.add(group_name)
        companies = []

        # Find all child groups
        child_groups = frappe.get_all(
            "Company Group",
            filters={"parent_group": group_name, "is_active": 1},
            fields=["name"]
        )

        for child in child_groups:
            child_doc = frappe.get_doc("Company Group", child.name)

            # Add companies from this child group
            for row in child_doc.companies:
                companies.append({
                    "company": row.company,
                    "trn": row.trn,
                    "role_in_group": row.role_in_group,
                    "is_primary": row.is_primary,
                    "group": child.name,
                    "group_level": level
                })

            # Recursively get companies from grandchild groups
            grandchild_companies = self._get_child_group_companies(
                child.name, level=level + 1, visited=visited
            )
            companies.extend(grandchild_companies)

        return companies

    def get_child_groups(self, recursive=True):
        """
        Get all child groups of this group.

        Args:
            recursive: If True, includes all descendant groups

        Returns:
            list: List of child group names
        """
        child_groups = []
        self._collect_child_groups(self.name, child_groups, recursive)
        return child_groups

    def _collect_child_groups(self, group_name, result, recursive, visited=None):
        """Helper to recursively collect child groups"""
        if visited is None:
            visited = set()

        if group_name in visited:
            return

        visited.add(group_name)

        children = frappe.get_all(
            "Company Group",
            filters={"parent_group": group_name},
            fields=["name"]
        )

        for child in children:
            result.append(child.name)
            if recursive:
                self._collect_child_groups(child.name, result, recursive, visited)


@frappe.whitelist()
def get_group_companies(group_name, include_child_groups=True):
    """
    API endpoint to get all companies in a group hierarchy.

    Args:
        group_name: The name of the Company Group
        include_child_groups: Whether to include companies from child groups (default: True)

    Returns:
        dict: Contains list of companies and summary statistics
    """
    if isinstance(include_child_groups, str):
        include_child_groups = include_child_groups.lower() in ("true", "1", "yes")

    if not frappe.db.exists("Company Group", group_name):
        frappe.throw(_("Company Group '{0}' does not exist.").format(group_name))

    group_doc = frappe.get_doc("Company Group", group_name)
    companies = group_doc.get_all_companies(include_child_groups=include_child_groups)

    # Get unique companies count
    unique_companies = set(c["company"] for c in companies)

    # Get groups involved
    groups_involved = set(c["group"] for c in companies)

    return {
        "companies": companies,
        "total_entries": len(companies),
        "unique_companies": len(unique_companies),
        "groups_involved": list(groups_involved),
        "group_name": group_name,
        "include_child_groups": include_child_groups
    }


@frappe.whitelist()
def get_group_hierarchy(group_name):
    """
    Get the full hierarchy tree for a Company Group.

    Args:
        group_name: The root group name

    Returns:
        dict: Hierarchical structure of groups and companies
    """
    if not frappe.db.exists("Company Group", group_name):
        frappe.throw(_("Company Group '{0}' does not exist.").format(group_name))

    def build_tree(name):
        group_doc = frappe.get_doc("Company Group", name)

        node = {
            "name": group_doc.name,
            "group_name": group_doc.group_name,
            "group_type": group_doc.group_type,
            "is_active": group_doc.is_active,
            "companies": [],
            "children": []
        }

        # Add direct companies
        for row in group_doc.companies:
            node["companies"].append({
                "company": row.company,
                "trn": row.trn,
                "role_in_group": row.role_in_group,
                "is_primary": row.is_primary
            })

        # Add child groups recursively
        child_groups = frappe.get_all(
            "Company Group",
            filters={"parent_group": name},
            fields=["name"]
        )

        for child in child_groups:
            child_tree = build_tree(child.name)
            node["children"].append(child_tree)

        return node

    return build_tree(group_name)
