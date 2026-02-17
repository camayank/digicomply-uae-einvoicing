# Copyright (c) 2024, DigiComply and contributors
# License: MIT

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import cint


class TaxCategoryRule(Document):
    """
    Tax Category Rule - Auto-assign UAE tax categories to transactions

    Rules are evaluated by priority (lower number = higher priority).
    When a document matches a rule's conditions, the corresponding
    tax category and template are applied.
    """

    def validate(self):
        """Validate the Tax Category Rule document"""
        self.validate_at_least_one_condition()
        self.validate_tax_template()

    def validate_at_least_one_condition(self):
        """Ensure at least one condition is set (besides apply_to which is always set)"""
        conditions = [
            self.item_group,
            self.customer_group,
            self.supplier_group,
            self.emirate
        ]

        if not any(conditions):
            frappe.throw(
                _("At least one condition must be set: Item Group, Customer Group, "
                  "Supplier Group, or Emirate. Rules without specific conditions "
                  "would match all transactions.")
            )

    def validate_tax_template(self):
        """Validate that tax template matches the apply_to document type"""
        if not self.tax_template:
            return

        template_doctype = self.get_tax_template_doctype()
        if not template_doctype:
            return

        # Check if the template exists
        if not frappe.db.exists(template_doctype, self.tax_template):
            frappe.throw(
                _("Tax Template '{0}' does not exist in {1}").format(
                    self.tax_template, template_doctype
                )
            )

    def get_tax_template_doctype(self):
        """Get the appropriate tax template doctype based on apply_to"""
        if self.apply_to == "Sales Invoice":
            return "Sales Taxes and Charges Template"
        elif self.apply_to == "Purchase Invoice":
            return "Purchase Taxes and Charges Template"
        elif self.apply_to == "Both":
            # For 'Both', we cannot determine which template type - return None
            return None
        return None


def get_tax_template_doctype(doc):
    """
    Get the appropriate tax template doctype based on apply_to field.
    Used by Dynamic Link field.
    """
    if doc.apply_to == "Sales Invoice":
        return "Sales Taxes and Charges Template"
    elif doc.apply_to == "Purchase Invoice":
        return "Purchase Taxes and Charges Template"
    # For 'Both', return Sales template as default (user can still select)
    return "Sales Taxes and Charges Template"


@frappe.whitelist()
def get_applicable_rule(doctype, doc_data):
    """
    Find the matching rule for a document.

    Args:
        doctype: The document type (Sales Invoice or Purchase Invoice)
        doc_data: Dictionary with document fields including:
            - company: Company name
            - item_group: Item Group (optional, for item-level matching)
            - customer_group: Customer Group (for Sales Invoice)
            - supplier_group: Supplier Group (for Purchase Invoice)
            - emirate: Emirate name (optional)

    Returns:
        Dictionary with rule details or None if no rule matches
    """
    # Permission check
    if not frappe.has_permission("Tax Category Rule", "read"):
        frappe.throw(_("Not permitted to access Tax Category Rules"))

    # Parse doc_data if it's a string
    if isinstance(doc_data, str):
        import json
        doc_data = json.loads(doc_data)

    company = doc_data.get("company")
    if not company:
        return None

    # Determine apply_to filter
    apply_to_filters = [doctype, "Both"]

    # Build filters for active rules
    filters = {
        "is_active": 1,
        "company": company,
        "apply_to": ["in", apply_to_filters]
    }

    # Get all matching rules ordered by priority
    rules = frappe.get_all(
        "Tax Category Rule",
        filters=filters,
        fields=[
            "name", "rule_name", "priority", "tax_category", "tax_template",
            "item_group", "customer_group", "supplier_group", "emirate", "apply_to"
        ],
        order_by="priority asc"
    )

    if not rules:
        return None

    # Evaluate each rule against the document data
    for rule in rules:
        if _rule_matches_document(rule, doc_data, doctype):
            return {
                "rule_name": rule.name,
                "tax_category": rule.tax_category,
                "tax_template": rule.tax_template,
                "priority": rule.priority
            }

    return None


def _rule_matches_document(rule, doc_data, doctype):
    """
    Check if a rule matches the document data.

    All specified conditions must match (AND logic).
    Empty conditions are treated as wildcards (match any).
    """
    # Check item_group
    if rule.item_group:
        doc_item_group = doc_data.get("item_group")
        if not doc_item_group:
            return False
        # Check if doc's item group is same or descendant of rule's item group
        if not _is_in_group(doc_item_group, rule.item_group, "Item Group"):
            return False

    # Check customer_group (only for Sales Invoice)
    if rule.customer_group:
        if doctype == "Purchase Invoice":
            # Customer group condition doesn't apply to Purchase Invoice
            pass
        else:
            doc_customer_group = doc_data.get("customer_group")
            if not doc_customer_group:
                return False
            if not _is_in_group(doc_customer_group, rule.customer_group, "Customer Group"):
                return False

    # Check supplier_group (only for Purchase Invoice)
    if rule.supplier_group:
        if doctype == "Sales Invoice":
            # Supplier group condition doesn't apply to Sales Invoice
            pass
        else:
            doc_supplier_group = doc_data.get("supplier_group")
            if not doc_supplier_group:
                return False
            if not _is_in_group(doc_supplier_group, rule.supplier_group, "Supplier Group"):
                return False

    # Check emirate
    if rule.emirate:
        doc_emirate = doc_data.get("emirate")
        if not doc_emirate or doc_emirate != rule.emirate:
            return False

    return True


def _is_in_group(child_group, parent_group, group_type):
    """
    Check if child_group is same as or descendant of parent_group.

    Uses the nested set model (lft/rgt) for efficient hierarchy checking.
    """
    if child_group == parent_group:
        return True

    # Get lft/rgt values for both groups
    try:
        parent_data = frappe.db.get_value(
            group_type, parent_group, ["lft", "rgt"], as_dict=True
        )
        child_data = frappe.db.get_value(
            group_type, child_group, ["lft", "rgt"], as_dict=True
        )

        if not parent_data or not child_data:
            return False

        # Child is descendant if its lft/rgt are within parent's range
        return (child_data.lft >= parent_data.lft and
                child_data.rgt <= parent_data.rgt)
    except Exception:
        return False


@frappe.whitelist()
def apply_rules_bulk(doctype, doc_names):
    """
    Apply tax category rules to multiple documents.

    Args:
        doctype: The document type (Sales Invoice or Purchase Invoice)
        doc_names: List of document names to process

    Returns:
        Dictionary with results:
            - applied: Number of documents where rules were applied
            - skipped: Number of documents where no matching rule was found
            - errors: List of error messages
    """
    # Permission check
    if not frappe.has_permission("Tax Category Rule", "read"):
        frappe.throw(_("Not permitted to access Tax Category Rules"))

    if not frappe.has_permission(doctype, "write"):
        frappe.throw(_("Not permitted to modify {0}").format(doctype))

    # Parse doc_names if it's a string
    if isinstance(doc_names, str):
        import json
        doc_names = json.loads(doc_names)

    results = {
        "applied": 0,
        "skipped": 0,
        "errors": [],
        "details": []
    }

    for doc_name in doc_names:
        try:
            # Get document data
            doc = frappe.get_doc(doctype, doc_name)

            # Build doc_data for rule matching
            doc_data = _build_doc_data(doc, doctype)

            # Find applicable rule
            rule = get_applicable_rule(doctype, doc_data)

            if rule:
                # Apply the rule
                _apply_rule_to_document(doc, rule, doctype)
                results["applied"] += 1
                results["details"].append({
                    "doc_name": doc_name,
                    "rule_applied": rule["rule_name"],
                    "tax_category": rule["tax_category"]
                })
            else:
                results["skipped"] += 1
                results["details"].append({
                    "doc_name": doc_name,
                    "rule_applied": None,
                    "reason": "No matching rule found"
                })

        except Exception as e:
            results["errors"].append({
                "doc_name": doc_name,
                "error": str(e)
            })
            frappe.log_error(
                message=f"Error applying tax rule to {doc_name}: {str(e)}",
                title="Tax Category Rule Error"
            )

    return results


def _build_doc_data(doc, doctype):
    """Build the doc_data dictionary for rule matching from a document."""
    doc_data = {
        "company": doc.company
    }

    # Add customer_group for Sales Invoice
    if doctype == "Sales Invoice" and doc.customer:
        customer_group = frappe.db.get_value("Customer", doc.customer, "customer_group")
        doc_data["customer_group"] = customer_group

    # Add supplier_group for Purchase Invoice
    if doctype == "Purchase Invoice" and doc.supplier:
        supplier_group = frappe.db.get_value("Supplier", doc.supplier, "supplier_group")
        doc_data["supplier_group"] = supplier_group

    # Add emirate if available (custom field or address-based)
    if hasattr(doc, "emirate"):
        doc_data["emirate"] = doc.emirate

    return doc_data


def _apply_rule_to_document(doc, rule, doctype):
    """Apply the rule's tax category and template to a document."""
    changes_made = False

    # Set tax category if the document has a tax_category field
    if hasattr(doc, "tax_category"):
        doc.tax_category = rule["tax_category"]
        changes_made = True

    # Set tax template if specified
    if rule.get("tax_template"):
        template_field = _get_template_field(doctype)
        if template_field and hasattr(doc, template_field):
            setattr(doc, template_field, rule["tax_template"])
            changes_made = True

    if changes_made:
        doc.flags.ignore_validate_update_after_submit = True
        doc.save(ignore_permissions=True)


def _get_template_field(doctype):
    """Get the field name for tax template based on doctype."""
    if doctype == "Sales Invoice":
        return "taxes_and_charges"
    elif doctype == "Purchase Invoice":
        return "taxes_and_charges"
    return None


@frappe.whitelist()
def get_rule_preview(rule_name):
    """
    Get a preview of what documents would match this rule.

    Args:
        rule_name: Name of the Tax Category Rule

    Returns:
        Dictionary with counts and sample documents
    """
    # Permission check
    if not frappe.has_permission("Tax Category Rule", "read"):
        frappe.throw(_("Not permitted to access Tax Category Rules"))

    rule = frappe.get_doc("Tax Category Rule", rule_name)

    preview = {
        "sales_invoice": {"count": 0, "samples": []},
        "purchase_invoice": {"count": 0, "samples": []}
    }

    # Build condition filters
    base_filters = {"company": rule.company, "docstatus": ["<", 2]}

    # Preview for Sales Invoice
    if rule.apply_to in ["Sales Invoice", "Both"]:
        si_filters = base_filters.copy()

        # Add customer group filter if specified
        if rule.customer_group:
            customers = _get_entities_in_group(
                "Customer", "customer_group", rule.customer_group, "Customer Group"
            )
            if customers:
                si_filters["customer"] = ["in", customers]
            else:
                si_filters["customer"] = ["=", "NONE"]

        count = frappe.db.count("Sales Invoice", si_filters)
        samples = frappe.get_all(
            "Sales Invoice",
            filters=si_filters,
            fields=["name", "customer", "posting_date", "grand_total"],
            limit=5,
            order_by="posting_date desc"
        )

        preview["sales_invoice"] = {
            "count": count,
            "samples": samples
        }

    # Preview for Purchase Invoice
    if rule.apply_to in ["Purchase Invoice", "Both"]:
        pi_filters = base_filters.copy()

        # Add supplier group filter if specified
        if rule.supplier_group:
            suppliers = _get_entities_in_group(
                "Supplier", "supplier_group", rule.supplier_group, "Supplier Group"
            )
            if suppliers:
                pi_filters["supplier"] = ["in", suppliers]
            else:
                pi_filters["supplier"] = ["=", "NONE"]

        count = frappe.db.count("Purchase Invoice", pi_filters)
        samples = frappe.get_all(
            "Purchase Invoice",
            filters=pi_filters,
            fields=["name", "supplier", "posting_date", "grand_total"],
            limit=5,
            order_by="posting_date desc"
        )

        preview["purchase_invoice"] = {
            "count": count,
            "samples": samples
        }

    return preview


def _get_entities_in_group(entity_type, group_field, group_name, group_type):
    """Get all entities (customers/suppliers) in a group and its descendants."""
    # Get the group and its descendants
    group_data = frappe.db.get_value(
        group_type, group_name, ["lft", "rgt"], as_dict=True
    )

    if not group_data:
        return []

    # Get all groups within the lft/rgt range
    groups = frappe.get_all(
        group_type,
        filters={
            "lft": [">=", group_data.lft],
            "rgt": ["<=", group_data.rgt]
        },
        pluck="name"
    )

    if not groups:
        return []

    # Get all entities in these groups
    entities = frappe.get_all(
        entity_type,
        filters={group_field: ["in", groups]},
        pluck="name"
    )

    return entities
