# Copyright (c) 2024, DigiComply and contributors
# License: MIT

import csv
from io import StringIO

import frappe
from frappe import _
from frappe.model.document import Document


class ImportTemplate(Document):
    """
    Import Template - Define column mappings for bulk imports

    Features:
    - Define CSV column to DocType field mappings
    - Set field types for proper data conversion
    - Mark required fields and set default values
    - Generate sample CSV files
    - One default template per import type
    """

    def validate(self):
        """Validate template configuration"""
        self.validate_unique_default()
        self.validate_columns()

    def validate_unique_default(self):
        """Ensure only one default template per import type"""
        if self.is_default:
            existing_default = frappe.db.get_value(
                "Import Template",
                {
                    "import_type": self.import_type,
                    "is_default": 1,
                    "name": ("!=", self.name)
                },
                "name"
            )

            if existing_default:
                # Clear the old default
                frappe.db.set_value("Import Template", existing_default, "is_default", 0)
                frappe.msgprint(
                    _("Removed default status from template: {0}").format(existing_default),
                    indicator="orange"
                )

    def validate_columns(self):
        """Validate column configurations"""
        if not self.columns:
            frappe.throw(_("At least one column mapping is required"))

        column_names = []
        field_names = []

        for col in self.columns:
            # Check for duplicate column names
            if col.column_name in column_names:
                frappe.throw(_("Duplicate column name: {0}").format(col.column_name))
            column_names.append(col.column_name)

            # Check for duplicate field names
            if col.field_name in field_names:
                frappe.throw(_("Duplicate field name: {0}").format(col.field_name))
            field_names.append(col.field_name)

            # Validate regex if provided
            if col.validation_regex:
                try:
                    import re
                    re.compile(col.validation_regex)
                except re.error as e:
                    frappe.throw(_("Invalid regex for column {0}: {1}").format(
                        col.column_name, str(e)
                    ))

    def on_update(self):
        """After save, generate sample file"""
        self.generate_sample_csv()

    def generate_sample_csv(self):
        """Generate a sample CSV file from template columns"""
        if not self.columns:
            return

        output = StringIO()
        writer = csv.writer(output)

        # Write header row
        headers = [col.column_name for col in self.columns]
        writer.writerow(headers)

        # Write sample data row with defaults or placeholders
        sample_row = []
        for col in self.columns:
            if col.default_value:
                sample_row.append(col.default_value)
            else:
                # Generate placeholder based on field type
                placeholder = self._get_placeholder(col.field_type, col.column_name, col.is_required)
                sample_row.append(placeholder)

        writer.writerow(sample_row)

        # Write a second sample row
        sample_row_2 = []
        for col in self.columns:
            placeholder = self._get_placeholder_alt(col.field_type, col.column_name)
            sample_row_2.append(placeholder)

        writer.writerow(sample_row_2)

        csv_content = output.getvalue()

        # Save as file
        file_name = f"{self.template_name.lower().replace(' ', '_')}_sample.csv"

        # Check if file already exists
        existing_file = frappe.db.get_value(
            "File",
            {
                "attached_to_doctype": "Import Template",
                "attached_to_name": self.name,
                "file_name": file_name
            },
            "name"
        )

        if existing_file:
            # Update existing file
            file_doc = frappe.get_doc("File", existing_file)
            file_doc.content = csv_content.encode("utf-8")
            file_doc.save(ignore_permissions=True)
        else:
            # Create new file
            file_doc = frappe.get_doc({
                "doctype": "File",
                "file_name": file_name,
                "attached_to_doctype": "Import Template",
                "attached_to_name": self.name,
                "content": csv_content.encode("utf-8"),
                "is_private": 0
            })
            file_doc.insert(ignore_permissions=True)

        # Update sample_file field
        self.db_set("sample_file", file_doc.file_url)

    def _get_placeholder(self, field_type, column_name, is_required):
        """Get placeholder value for field type"""
        suffix = " (required)" if is_required else ""

        placeholders = {
            "Data": f"Sample {column_name}{suffix}",
            "Int": "1",
            "Float": "1.00",
            "Currency": "100.00",
            "Date": "2024-01-01",
            "Datetime": "2024-01-01 00:00:00",
            "Check": "1"
        }
        return placeholders.get(field_type, f"Sample {column_name}")

    def _get_placeholder_alt(self, field_type, column_name):
        """Get alternative placeholder value for second sample row"""
        placeholders = {
            "Data": f"Example {column_name}",
            "Int": "2",
            "Float": "2.50",
            "Currency": "250.00",
            "Date": "2024-01-15",
            "Datetime": "2024-01-15 12:30:00",
            "Check": "0"
        }
        return placeholders.get(field_type, f"Example {column_name}")

    @frappe.whitelist()
    def download_template(self):
        """Download the sample CSV file"""
        if not self.sample_file:
            self.generate_sample_csv()
            self.reload()

        if self.sample_file:
            return {"file_url": self.sample_file}
        else:
            frappe.throw(_("Could not generate sample file"))


# =============================================================================
# API Endpoints
# =============================================================================

@frappe.whitelist()
def download_template(template_name):
    """
    API endpoint to download a template CSV

    Args:
        template_name: Name of the Import Template

    Returns:
        CSV file download
    """
    doc = frappe.get_doc("Import Template", template_name)

    if not doc.sample_file:
        doc.generate_sample_csv()
        doc.reload()

    if not doc.sample_file:
        frappe.throw(_("Could not generate sample file"))

    # Get file content
    file_doc = frappe.get_doc("File", {"file_url": doc.sample_file})
    content = file_doc.get_content()

    if isinstance(content, bytes):
        content = content.decode("utf-8")

    frappe.response["filename"] = f"{template_name.lower().replace(' ', '_')}_template.csv"
    frappe.response["filecontent"] = content
    frappe.response["type"] = "download"


@frappe.whitelist()
def get_default_template(import_type):
    """
    Get the default template for an import type

    Args:
        import_type: Type of import (Customer, Supplier, etc.)

    Returns:
        Template name or None
    """
    template = frappe.db.get_value(
        "Import Template",
        {"import_type": import_type, "is_default": 1},
        "name"
    )

    if template:
        return frappe.get_doc("Import Template", template)

    return None


@frappe.whitelist()
def get_template_columns(template_name):
    """
    Get column configurations for a template

    Args:
        template_name: Name of the Import Template

    Returns:
        List of column configurations
    """
    doc = frappe.get_doc("Import Template", template_name)

    columns = []
    for col in doc.columns:
        columns.append({
            "column_name": col.column_name,
            "field_name": col.field_name,
            "field_type": col.field_type,
            "is_required": col.is_required,
            "default_value": col.default_value,
            "validation_regex": col.validation_regex
        })

    return columns


@frappe.whitelist()
def get_templates_for_type(import_type):
    """
    Get all templates for an import type

    Args:
        import_type: Type of import

    Returns:
        List of template names with default indicator
    """
    templates = frappe.get_all(
        "Import Template",
        filters={"import_type": import_type},
        fields=["name", "template_name", "is_default", "description"],
        order_by="is_default desc, template_name asc"
    )

    return templates


# =============================================================================
# Default Templates Creation
# =============================================================================

def create_default_templates():
    """
    Create default import templates on install

    Called from hooks.py after_install
    """
    templates = get_default_template_definitions()

    for template_def in templates:
        template_name = template_def["template_name"]

        # Skip if already exists
        if frappe.db.exists("Import Template", template_name):
            continue

        doc = frappe.new_doc("Import Template")
        doc.template_name = template_def["template_name"]
        doc.import_type = template_def["import_type"]
        doc.is_default = template_def.get("is_default", 1)
        doc.description = template_def.get("description", "")

        for col in template_def["columns"]:
            doc.append("columns", col)

        doc.insert(ignore_permissions=True)

    frappe.db.commit()


def get_default_template_definitions():
    """Return default template definitions"""
    return [
        # Customer Template
        {
            "template_name": "Customer Default Template",
            "import_type": "Customer",
            "is_default": 1,
            "description": "Default template for importing customer data",
            "columns": [
                {
                    "column_name": "Customer Name",
                    "field_name": "customer_name",
                    "field_type": "Data",
                    "is_required": 1
                },
                {
                    "column_name": "Customer Type",
                    "field_name": "customer_type",
                    "field_type": "Data",
                    "is_required": 0,
                    "default_value": "Company"
                },
                {
                    "column_name": "Customer Group",
                    "field_name": "customer_group",
                    "field_type": "Data",
                    "is_required": 0
                },
                {
                    "column_name": "Territory",
                    "field_name": "territory",
                    "field_type": "Data",
                    "is_required": 0
                },
                {
                    "column_name": "Tax ID",
                    "field_name": "tax_id",
                    "field_type": "Data",
                    "is_required": 0
                },
                {
                    "column_name": "Email",
                    "field_name": "email_id",
                    "field_type": "Data",
                    "is_required": 0,
                    "validation_regex": r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
                },
                {
                    "column_name": "Mobile",
                    "field_name": "mobile_no",
                    "field_type": "Data",
                    "is_required": 0
                }
            ]
        },
        # Supplier Template
        {
            "template_name": "Supplier Default Template",
            "import_type": "Supplier",
            "is_default": 1,
            "description": "Default template for importing supplier data",
            "columns": [
                {
                    "column_name": "Supplier Name",
                    "field_name": "supplier_name",
                    "field_type": "Data",
                    "is_required": 1
                },
                {
                    "column_name": "Supplier Type",
                    "field_name": "supplier_type",
                    "field_type": "Data",
                    "is_required": 0,
                    "default_value": "Company"
                },
                {
                    "column_name": "Supplier Group",
                    "field_name": "supplier_group",
                    "field_type": "Data",
                    "is_required": 0
                },
                {
                    "column_name": "Country",
                    "field_name": "country",
                    "field_type": "Data",
                    "is_required": 0
                },
                {
                    "column_name": "Tax ID",
                    "field_name": "tax_id",
                    "field_type": "Data",
                    "is_required": 0
                }
            ]
        },
        # TRN Registry Template
        {
            "template_name": "TRN Registry Default Template",
            "import_type": "TRN Registry",
            "is_default": 1,
            "description": "Default template for importing TRN (Tax Registration Number) data",
            "columns": [
                {
                    "column_name": "TRN",
                    "field_name": "trn",
                    "field_type": "Data",
                    "is_required": 1,
                    "validation_regex": r"^\d{15}$"
                },
                {
                    "column_name": "Entity Name",
                    "field_name": "entity_name",
                    "field_type": "Data",
                    "is_required": 1
                },
                {
                    "column_name": "Company",
                    "field_name": "company",
                    "field_type": "Data",
                    "is_required": 1
                },
                {
                    "column_name": "Entity Type",
                    "field_name": "entity_type",
                    "field_type": "Data",
                    "is_required": 0
                },
                {
                    "column_name": "FTA Registration Date",
                    "field_name": "fta_registration_date",
                    "field_type": "Date",
                    "is_required": 0
                },
                {
                    "column_name": "FTA Expiry Date",
                    "field_name": "fta_expiry_date",
                    "field_type": "Date",
                    "is_required": 0
                },
                {
                    "column_name": "Is Primary",
                    "field_name": "is_primary",
                    "field_type": "Check",
                    "is_required": 0,
                    "default_value": "0"
                },
                {
                    "column_name": "Is Active",
                    "field_name": "is_active",
                    "field_type": "Check",
                    "is_required": 0,
                    "default_value": "1"
                },
                {
                    "column_name": "Notes",
                    "field_name": "notes",
                    "field_type": "Data",
                    "is_required": 0
                }
            ]
        },
        # Item Template
        {
            "template_name": "Item Default Template",
            "import_type": "Item",
            "is_default": 1,
            "description": "Default template for importing item/product data",
            "columns": [
                {
                    "column_name": "Item Code",
                    "field_name": "item_code",
                    "field_type": "Data",
                    "is_required": 1
                },
                {
                    "column_name": "Item Name",
                    "field_name": "item_name",
                    "field_type": "Data",
                    "is_required": 0
                },
                {
                    "column_name": "Item Group",
                    "field_name": "item_group",
                    "field_type": "Data",
                    "is_required": 0
                },
                {
                    "column_name": "Description",
                    "field_name": "description",
                    "field_type": "Data",
                    "is_required": 0
                },
                {
                    "column_name": "Stock UOM",
                    "field_name": "stock_uom",
                    "field_type": "Data",
                    "is_required": 0,
                    "default_value": "Nos"
                },
                {
                    "column_name": "Is Stock Item",
                    "field_name": "is_stock_item",
                    "field_type": "Check",
                    "is_required": 0,
                    "default_value": "1"
                },
                {
                    "column_name": "Standard Rate",
                    "field_name": "standard_rate",
                    "field_type": "Currency",
                    "is_required": 0
                }
            ]
        },
        # Company Template
        {
            "template_name": "Company Default Template",
            "import_type": "Company",
            "is_default": 1,
            "description": "Default template for importing company data",
            "columns": [
                {
                    "column_name": "Company Name",
                    "field_name": "company_name",
                    "field_type": "Data",
                    "is_required": 1
                },
                {
                    "column_name": "Abbreviation",
                    "field_name": "abbr",
                    "field_type": "Data",
                    "is_required": 0
                },
                {
                    "column_name": "Default Currency",
                    "field_name": "default_currency",
                    "field_type": "Data",
                    "is_required": 0,
                    "default_value": "AED"
                },
                {
                    "column_name": "Country",
                    "field_name": "country",
                    "field_type": "Data",
                    "is_required": 0,
                    "default_value": "United Arab Emirates"
                },
                {
                    "column_name": "Tax ID",
                    "field_name": "tax_id",
                    "field_type": "Data",
                    "is_required": 0
                }
            ]
        },
        # Invoice Template
        {
            "template_name": "Invoice Default Template",
            "import_type": "Invoice",
            "is_default": 1,
            "description": "Default template for importing sales invoice data",
            "columns": [
                {
                    "column_name": "Invoice No",
                    "field_name": "invoice_no",
                    "field_type": "Data",
                    "is_required": 1
                },
                {
                    "column_name": "Customer",
                    "field_name": "customer",
                    "field_type": "Data",
                    "is_required": 1
                },
                {
                    "column_name": "Posting Date",
                    "field_name": "posting_date",
                    "field_type": "Date",
                    "is_required": 0
                },
                {
                    "column_name": "Due Date",
                    "field_name": "due_date",
                    "field_type": "Date",
                    "is_required": 0
                },
                {
                    "column_name": "Item Code",
                    "field_name": "item_code",
                    "field_type": "Data",
                    "is_required": 0
                },
                {
                    "column_name": "Quantity",
                    "field_name": "qty",
                    "field_type": "Float",
                    "is_required": 0,
                    "default_value": "1"
                },
                {
                    "column_name": "Rate",
                    "field_name": "rate",
                    "field_type": "Currency",
                    "is_required": 0
                }
            ]
        },
        # ASP Data Template
        {
            "template_name": "ASP Data Default Template",
            "import_type": "ASP Data",
            "is_default": 1,
            "description": "Default template for importing ASP (Accredited Service Provider) data",
            "columns": [
                {
                    "column_name": "Invoice No",
                    "field_name": "invoice_no",
                    "field_type": "Data",
                    "is_required": 1
                },
                {
                    "column_name": "Posting Date",
                    "field_name": "posting_date",
                    "field_type": "Date",
                    "is_required": 0
                },
                {
                    "column_name": "Customer",
                    "field_name": "customer",
                    "field_type": "Data",
                    "is_required": 0
                },
                {
                    "column_name": "TRN",
                    "field_name": "trn",
                    "field_type": "Data",
                    "is_required": 0,
                    "validation_regex": r"^\d{15}$"
                },
                {
                    "column_name": "Grand Total",
                    "field_name": "grand_total",
                    "field_type": "Currency",
                    "is_required": 0
                },
                {
                    "column_name": "VAT Amount",
                    "field_name": "vat_amount",
                    "field_type": "Currency",
                    "is_required": 0
                }
            ]
        }
    ]
