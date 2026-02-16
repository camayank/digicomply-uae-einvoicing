# Copyright (c) 2024, DigiComply and contributors
# License: MIT

import csv
import json
from io import StringIO

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import cstr, flt, now_datetime, cint


class BulkImportLog(Document):
    """
    Bulk Import Log - Handle bulk data imports with progress tracking

    Supports importing:
    - Customers
    - Suppliers
    - Items
    - TRN Registry entries
    - Companies
    - Invoices
    - ASP Data
    """

    def validate(self):
        """Validate document before save"""
        if self.file and not self.file_name:
            self.extract_file_name()

    def extract_file_name(self):
        """Extract filename from file URL"""
        if self.file:
            # Get just the filename from the path
            self.file_name = self.file.split("/")[-1] if "/" in self.file else self.file

    @frappe.whitelist()
    def start_import(self):
        """Start the import process - enqueues background job"""
        if self.status not in ["Pending", "Failed", "Cancelled"]:
            frappe.throw(_("Import can only be started from Pending, Failed, or Cancelled status"))

        # Update status to Validating
        self.db_set("status", "Validating")
        self.db_set("started_at", now_datetime())
        self.db_set("error_log", None)
        self.db_set("processed_rows", 0)
        self.db_set("success_count", 0)
        self.db_set("error_count", 0)
        self.db_set("warning_count", 0)
        self.db_set("progress_percent", 0)
        frappe.db.commit()

        # Publish realtime event
        frappe.publish_realtime(
            "bulk_import_progress",
            {"import_log": self.name, "status": "Validating", "progress": 0},
            user=frappe.session.user
        )

        # Enqueue background job
        frappe.enqueue(
            "digicomply.digicomply.doctype.bulk_import_log.bulk_import_log.process_import",
            import_log=self.name,
            queue="long",
            timeout=3600,
            now=frappe.conf.developer_mode  # Run immediately in dev mode
        )

        return {"status": "started", "message": _("Import started. You will be notified when complete.")}

    def update_progress(self, processed, success, errors, warnings):
        """Update import progress counters and publish realtime event"""
        total = self.total_rows or 1
        progress = min(100, (processed / total) * 100) if total > 0 else 0

        self.db_set("processed_rows", processed)
        self.db_set("success_count", success)
        self.db_set("error_count", errors)
        self.db_set("warning_count", warnings)
        self.db_set("progress_percent", flt(progress, 2))

        # Publish realtime event for progress updates
        frappe.publish_realtime(
            "bulk_import_progress",
            {
                "import_log": self.name,
                "status": self.status,
                "progress": progress,
                "processed": processed,
                "total": total,
                "success": success,
                "errors": errors,
                "warnings": warnings
            },
            user=frappe.session.user
        )

    def complete(self, status, error_log=None, result_summary=None):
        """Mark import as complete with final status"""
        self.db_set("status", status)
        self.db_set("completed_at", now_datetime())
        self.db_set("progress_percent", 100)

        if error_log:
            self.db_set("error_log", json.dumps(error_log, indent=2, default=str))

        # Generate result summary HTML
        if not result_summary:
            result_summary = self._generate_result_summary()

        # Publish completion event
        frappe.publish_realtime(
            "bulk_import_complete",
            {
                "import_log": self.name,
                "status": status,
                "success_count": self.success_count,
                "error_count": self.error_count,
                "warning_count": self.warning_count
            },
            user=frappe.session.user
        )

    def _generate_result_summary(self):
        """Generate HTML summary of import results"""
        status_class = {
            "Completed": "success",
            "Completed with Errors": "warning",
            "Failed": "danger",
            "Cancelled": "secondary"
        }.get(self.status, "info")

        html = f"""
        <div class="dc-import-summary">
            <div class="dc-summary-header {status_class}">
                <div class="dc-summary-icon">
                    {self._get_status_icon()}
                </div>
                <div class="dc-summary-text">
                    <h4>{self.status}</h4>
                    <p>Processed {self.processed_rows} of {self.total_rows} rows</p>
                </div>
            </div>
            <div class="dc-summary-stats">
                <div class="dc-stat success">
                    <span class="dc-stat-value">{self.success_count}</span>
                    <span class="dc-stat-label">Successful</span>
                </div>
                <div class="dc-stat danger">
                    <span class="dc-stat-value">{self.error_count}</span>
                    <span class="dc-stat-label">Errors</span>
                </div>
                <div class="dc-stat warning">
                    <span class="dc-stat-value">{self.warning_count}</span>
                    <span class="dc-stat-label">Warnings</span>
                </div>
            </div>
        </div>
        """
        return html

    def _get_status_icon(self):
        """Get SVG icon based on status"""
        icons = {
            "Completed": '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
            "Completed with Errors": '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
            "Failed": '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
            "Cancelled": '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>'
        }
        return icons.get(self.status, icons["Completed"])

    @frappe.whitelist()
    def cancel_import(self):
        """Cancel a running import"""
        if self.status not in ["Validating", "Processing"]:
            frappe.throw(_("Only Validating or Processing imports can be cancelled"))

        self.db_set("status", "Cancelled")
        self.db_set("completed_at", now_datetime())
        frappe.db.commit()

        frappe.publish_realtime(
            "bulk_import_complete",
            {"import_log": self.name, "status": "Cancelled"},
            user=frappe.session.user
        )

        return {"status": "cancelled", "message": _("Import cancelled")}

    def get_error_report_csv(self):
        """Generate CSV content for error report download"""
        if not self.error_log:
            return None

        try:
            errors = json.loads(self.error_log)
        except (json.JSONDecodeError, TypeError):
            return None

        if not errors:
            return None

        # Build CSV
        output = StringIO()
        writer = csv.writer(output)

        # Header
        writer.writerow(["Row", "Field", "Error", "Value"])

        for error in errors:
            writer.writerow([
                error.get("row", ""),
                error.get("field", ""),
                error.get("error", ""),
                error.get("value", "")
            ])

        return output.getvalue()


def process_import(import_log):
    """
    Background job to process the import

    Args:
        import_log: Name of the Bulk Import Log document
    """
    doc = frappe.get_doc("Bulk Import Log", import_log)

    # Check if cancelled
    if doc.status == "Cancelled":
        return

    errors = []
    warnings = []
    success_count = 0
    error_count = 0
    warning_count = 0

    try:
        # Get file content
        file_doc = frappe.get_doc("File", {"file_url": doc.file})
        content = file_doc.get_content()

        # Decode if bytes
        if isinstance(content, bytes):
            content = content.decode("utf-8-sig")  # Handle BOM

        # Parse CSV
        rows = parse_csv_content(content)

        if not rows:
            doc.complete("Failed", [{"row": 0, "error": "No data found in file"}])
            frappe.db.commit()
            return

        # Extract header and data
        header = [h.strip().lower().replace(" ", "_") for h in rows[0]]
        data_rows = rows[1:]

        # Update total rows
        doc.db_set("total_rows", len(data_rows))
        doc.db_set("status", "Processing")
        frappe.db.commit()

        # Get import handler
        handler = get_import_handler(doc.import_type)

        if not handler:
            doc.complete("Failed", [{"row": 0, "error": f"No handler for import type: {doc.import_type}"}])
            frappe.db.commit()
            return

        # Process each row
        for idx, row in enumerate(data_rows, start=2):  # Start at 2 (1-indexed + header)
            # Check for cancellation
            doc.reload()
            if doc.status == "Cancelled":
                break

            try:
                # Create row dict
                row_data = dict(zip(header, row))

                # Process row
                result = handler(row_data, doc, idx)

                if result.get("status") == "success":
                    success_count += 1
                elif result.get("status") == "warning":
                    warning_count += 1
                    if result.get("message"):
                        warnings.append({
                            "row": idx,
                            "warning": result.get("message"),
                            "field": result.get("field", "")
                        })
                elif result.get("status") == "error":
                    error_count += 1
                    errors.append({
                        "row": idx,
                        "error": result.get("message", "Unknown error"),
                        "field": result.get("field", ""),
                        "value": result.get("value", "")
                    })
                elif result.get("status") == "skipped":
                    # Dry run - count as success for validation
                    success_count += 1

            except Exception as e:
                error_count += 1
                errors.append({
                    "row": idx,
                    "error": str(e),
                    "field": "",
                    "value": ""
                })
                frappe.log_error(
                    title=f"Bulk Import Error - Row {idx}",
                    message=str(e)
                )

            # Update progress every 10 rows
            if idx % 10 == 0 or idx == len(data_rows) + 1:
                processed = idx - 1  # Subtract 1 for header offset
                doc.update_progress(processed, success_count, error_count, warning_count)
                frappe.db.commit()

        # Determine final status
        if doc.status == "Cancelled":
            final_status = "Cancelled"
        elif error_count > 0 and success_count > 0:
            final_status = "Completed with Errors"
        elif error_count > 0 and success_count == 0:
            final_status = "Failed"
        else:
            final_status = "Completed"

        # Combine errors and warnings
        all_issues = errors + [{"row": w["row"], "error": f"Warning: {w['warning']}", "field": w.get("field", "")} for w in warnings]

        doc.complete(final_status, all_issues if all_issues else None)
        frappe.db.commit()

    except Exception as e:
        frappe.log_error(title="Bulk Import Failed", message=str(e))
        doc.complete("Failed", [{"row": 0, "error": str(e)}])
        frappe.db.commit()


def parse_csv_content(content):
    """Parse CSV string into list of rows"""
    rows = []

    # Try different delimiters
    for delimiter in [",", ";", "\t"]:
        try:
            reader = csv.reader(StringIO(content), delimiter=delimiter)
            rows = list(reader)
            if rows and len(rows[0]) > 1:
                break
        except Exception:
            continue

    # Filter out empty rows
    rows = [row for row in rows if any(cell.strip() for cell in row)]

    return rows


def get_import_handler(import_type):
    """Get the appropriate import handler for the import type"""
    handlers = {
        "Customer": import_customer,
        "Supplier": import_supplier,
        "Item": import_item,
        "TRN Registry": import_trn_registry,
        "Company": import_company,
        "Invoice": import_invoice,
        "ASP Data": import_asp_data,
    }
    return handlers.get(import_type)


# =============================================================================
# Import Handlers
# =============================================================================

def import_customer(row_data, import_log, row_num):
    """
    Import a Customer record

    Expected columns:
    - customer_name (required)
    - customer_type (Individual/Company)
    - customer_group
    - territory
    - tax_id (TRN)
    - email_id
    - mobile_no
    """
    customer_name = cstr(row_data.get("customer_name", "")).strip()

    if not customer_name:
        return {"status": "error", "message": "Customer name is required", "field": "customer_name"}

    # Check if exists
    existing = frappe.db.exists("Customer", {"customer_name": customer_name})

    if existing and not import_log.update_existing:
        return {"status": "warning", "message": f"Customer '{customer_name}' already exists", "field": "customer_name"}

    # Dry run check
    if import_log.dry_run:
        if existing:
            return {"status": "skipped", "message": "Would update existing customer"}
        return {"status": "skipped", "message": "Would create new customer"}

    try:
        if existing:
            # Update existing
            doc = frappe.get_doc("Customer", existing)
        else:
            # Create new
            doc = frappe.new_doc("Customer")
            doc.customer_name = customer_name

        # Map fields
        doc.customer_type = row_data.get("customer_type") or "Company"
        if row_data.get("customer_group"):
            doc.customer_group = row_data.get("customer_group")
        if row_data.get("territory"):
            doc.territory = row_data.get("territory")
        if row_data.get("tax_id"):
            doc.tax_id = row_data.get("tax_id")

        # Validate if not skipping
        if not import_log.skip_validation:
            doc.flags.ignore_validate = False
        else:
            doc.flags.ignore_validate = True
            doc.flags.ignore_mandatory = True

        doc.save(ignore_permissions=True)

        return {"status": "success", "message": f"{'Updated' if existing else 'Created'} customer: {customer_name}"}

    except Exception as e:
        return {"status": "error", "message": str(e), "field": "customer_name", "value": customer_name}


def import_supplier(row_data, import_log, row_num):
    """
    Import a Supplier record

    Expected columns:
    - supplier_name (required)
    - supplier_type
    - supplier_group
    - country
    - tax_id (TRN)
    """
    supplier_name = cstr(row_data.get("supplier_name", "")).strip()

    if not supplier_name:
        return {"status": "error", "message": "Supplier name is required", "field": "supplier_name"}

    # Check if exists
    existing = frappe.db.exists("Supplier", {"supplier_name": supplier_name})

    if existing and not import_log.update_existing:
        return {"status": "warning", "message": f"Supplier '{supplier_name}' already exists", "field": "supplier_name"}

    # Dry run check
    if import_log.dry_run:
        if existing:
            return {"status": "skipped", "message": "Would update existing supplier"}
        return {"status": "skipped", "message": "Would create new supplier"}

    try:
        if existing:
            doc = frappe.get_doc("Supplier", existing)
        else:
            doc = frappe.new_doc("Supplier")
            doc.supplier_name = supplier_name

        # Map fields
        doc.supplier_type = row_data.get("supplier_type") or "Company"
        if row_data.get("supplier_group"):
            doc.supplier_group = row_data.get("supplier_group")
        if row_data.get("country"):
            doc.country = row_data.get("country")
        if row_data.get("tax_id"):
            doc.tax_id = row_data.get("tax_id")

        if not import_log.skip_validation:
            doc.flags.ignore_validate = False
        else:
            doc.flags.ignore_validate = True
            doc.flags.ignore_mandatory = True

        doc.save(ignore_permissions=True)

        return {"status": "success", "message": f"{'Updated' if existing else 'Created'} supplier: {supplier_name}"}

    except Exception as e:
        return {"status": "error", "message": str(e), "field": "supplier_name", "value": supplier_name}


def import_item(row_data, import_log, row_num):
    """
    Import an Item record

    Expected columns:
    - item_code (required)
    - item_name
    - item_group
    - description
    - stock_uom
    - is_stock_item
    - standard_rate
    """
    item_code = cstr(row_data.get("item_code", "")).strip()

    if not item_code:
        return {"status": "error", "message": "Item code is required", "field": "item_code"}

    # Check if exists
    existing = frappe.db.exists("Item", item_code)

    if existing and not import_log.update_existing:
        return {"status": "warning", "message": f"Item '{item_code}' already exists", "field": "item_code"}

    # Dry run check
    if import_log.dry_run:
        if existing:
            return {"status": "skipped", "message": "Would update existing item"}
        return {"status": "skipped", "message": "Would create new item"}

    try:
        if existing:
            doc = frappe.get_doc("Item", existing)
        else:
            doc = frappe.new_doc("Item")
            doc.item_code = item_code

        # Map fields
        doc.item_name = row_data.get("item_name") or item_code
        if row_data.get("item_group"):
            doc.item_group = row_data.get("item_group")
        if row_data.get("description"):
            doc.description = row_data.get("description")
        if row_data.get("stock_uom"):
            doc.stock_uom = row_data.get("stock_uom")
        if row_data.get("is_stock_item"):
            doc.is_stock_item = cint(row_data.get("is_stock_item"))
        if row_data.get("standard_rate"):
            doc.standard_rate = flt(row_data.get("standard_rate"))

        if not import_log.skip_validation:
            doc.flags.ignore_validate = False
        else:
            doc.flags.ignore_validate = True
            doc.flags.ignore_mandatory = True

        doc.save(ignore_permissions=True)

        return {"status": "success", "message": f"{'Updated' if existing else 'Created'} item: {item_code}"}

    except Exception as e:
        return {"status": "error", "message": str(e), "field": "item_code", "value": item_code}


def import_trn_registry(row_data, import_log, row_num):
    """
    Import a TRN Registry record

    Expected columns:
    - trn (required) - 15-digit UAE Tax Registration Number
    - entity_name (required)
    - company (required)
    - entity_type
    - fta_registration_date
    - fta_expiry_date
    - is_primary
    - is_active
    - notes
    """
    trn = cstr(row_data.get("trn", "")).strip()
    entity_name = cstr(row_data.get("entity_name", "")).strip()
    company = cstr(row_data.get("company", "")).strip() or import_log.company

    if not trn:
        return {"status": "error", "message": "TRN is required", "field": "trn"}

    if not entity_name:
        return {"status": "error", "message": "Entity name is required", "field": "entity_name"}

    if not company:
        return {"status": "error", "message": "Company is required", "field": "company"}

    # Validate TRN format (15 digits)
    trn_clean = "".join(filter(str.isdigit, trn))
    if len(trn_clean) != 15 and not import_log.skip_validation:
        return {
            "status": "error",
            "message": f"TRN must be 15 digits, got {len(trn_clean)}",
            "field": "trn",
            "value": trn
        }

    # Check if exists
    existing = frappe.db.exists("TRN Registry", {"trn": trn})

    if existing and not import_log.update_existing:
        return {"status": "warning", "message": f"TRN '{trn}' already exists", "field": "trn"}

    # Dry run check
    if import_log.dry_run:
        if existing:
            return {"status": "skipped", "message": "Would update existing TRN"}
        return {"status": "skipped", "message": "Would create new TRN"}

    try:
        if existing:
            doc = frappe.get_doc("TRN Registry", existing)
        else:
            doc = frappe.new_doc("TRN Registry")
            doc.trn = trn

        # Map fields
        doc.entity_name = entity_name
        doc.company = company

        if row_data.get("entity_type"):
            doc.entity_type = row_data.get("entity_type")
        if row_data.get("fta_registration_date"):
            doc.fta_registration_date = row_data.get("fta_registration_date")
        if row_data.get("fta_expiry_date"):
            doc.fta_expiry_date = row_data.get("fta_expiry_date")
        if row_data.get("is_primary") is not None:
            doc.is_primary = cint(row_data.get("is_primary"))
        if row_data.get("is_active") is not None:
            doc.is_active = cint(row_data.get("is_active"))
        if row_data.get("notes"):
            doc.notes = row_data.get("notes")

        if not import_log.skip_validation:
            doc.flags.ignore_validate = False
        else:
            doc.flags.ignore_validate = True
            doc.flags.ignore_mandatory = True

        doc.save(ignore_permissions=True)

        return {"status": "success", "message": f"{'Updated' if existing else 'Created'} TRN: {trn}"}

    except Exception as e:
        return {"status": "error", "message": str(e), "field": "trn", "value": trn}


def import_company(row_data, import_log, row_num):
    """
    Import a Company record

    Expected columns:
    - company_name (required)
    - abbr
    - default_currency
    - country
    - tax_id
    """
    company_name = cstr(row_data.get("company_name", "")).strip()

    if not company_name:
        return {"status": "error", "message": "Company name is required", "field": "company_name"}

    # Check if exists
    existing = frappe.db.exists("Company", company_name)

    if existing and not import_log.update_existing:
        return {"status": "warning", "message": f"Company '{company_name}' already exists", "field": "company_name"}

    # Dry run check
    if import_log.dry_run:
        if existing:
            return {"status": "skipped", "message": "Would update existing company"}
        return {"status": "skipped", "message": "Would create new company"}

    try:
        if existing:
            doc = frappe.get_doc("Company", existing)
        else:
            doc = frappe.new_doc("Company")
            doc.company_name = company_name
            # Generate abbreviation if not provided
            doc.abbr = row_data.get("abbr") or "".join([w[0].upper() for w in company_name.split()[:3]])

        # Map fields
        if row_data.get("default_currency"):
            doc.default_currency = row_data.get("default_currency")
        if row_data.get("country"):
            doc.country = row_data.get("country")
        if row_data.get("tax_id"):
            doc.tax_id = row_data.get("tax_id")

        if not import_log.skip_validation:
            doc.flags.ignore_validate = False
        else:
            doc.flags.ignore_validate = True
            doc.flags.ignore_mandatory = True

        doc.save(ignore_permissions=True)

        return {"status": "success", "message": f"{'Updated' if existing else 'Created'} company: {company_name}"}

    except Exception as e:
        return {"status": "error", "message": str(e), "field": "company_name", "value": company_name}


def import_invoice(row_data, import_log, row_num):
    """
    Import an Invoice record (Sales Invoice)

    Expected columns:
    - invoice_no (required)
    - customer (required)
    - posting_date
    - due_date
    - grand_total
    - items (JSON or item_code,qty,rate)
    """
    invoice_no = cstr(row_data.get("invoice_no", "")).strip()
    customer = cstr(row_data.get("customer", "")).strip()

    if not invoice_no:
        return {"status": "error", "message": "Invoice number is required", "field": "invoice_no"}

    if not customer:
        return {"status": "error", "message": "Customer is required", "field": "customer"}

    # Check if customer exists
    if not frappe.db.exists("Customer", customer):
        return {"status": "error", "message": f"Customer '{customer}' not found", "field": "customer", "value": customer}

    # Check if invoice exists
    existing = frappe.db.exists("Sales Invoice", invoice_no)

    if existing and not import_log.update_existing:
        return {"status": "warning", "message": f"Invoice '{invoice_no}' already exists", "field": "invoice_no"}

    # Dry run check
    if import_log.dry_run:
        if existing:
            return {"status": "skipped", "message": "Would update existing invoice"}
        return {"status": "skipped", "message": "Would create new invoice"}

    try:
        if existing:
            # Can't update submitted invoices
            doc = frappe.get_doc("Sales Invoice", existing)
            if doc.docstatus == 1:
                return {"status": "warning", "message": f"Invoice '{invoice_no}' is submitted and cannot be updated"}
        else:
            doc = frappe.new_doc("Sales Invoice")
            doc.naming_series = ""  # Use provided invoice_no
            doc.name = invoice_no

        doc.customer = customer
        doc.company = import_log.company

        if row_data.get("posting_date"):
            doc.posting_date = row_data.get("posting_date")
        if row_data.get("due_date"):
            doc.due_date = row_data.get("due_date")

        # Handle items - simplified for MVP
        if row_data.get("item_code"):
            doc.items = []
            doc.append("items", {
                "item_code": row_data.get("item_code"),
                "qty": flt(row_data.get("qty", 1)),
                "rate": flt(row_data.get("rate", 0))
            })

        if not import_log.skip_validation:
            doc.flags.ignore_validate = False
        else:
            doc.flags.ignore_validate = True
            doc.flags.ignore_mandatory = True

        doc.save(ignore_permissions=True)

        return {"status": "success", "message": f"{'Updated' if existing else 'Created'} invoice: {invoice_no}"}

    except Exception as e:
        return {"status": "error", "message": str(e), "field": "invoice_no", "value": invoice_no}


def import_asp_data(row_data, import_log, row_num):
    """
    Import ASP (Accredited Service Provider) data

    This creates CSV Import records for reconciliation.

    Expected columns:
    - invoice_no
    - posting_date
    - customer
    - trn
    - grand_total
    - vat_amount
    """
    invoice_no = cstr(row_data.get("invoice_no", "")).strip()

    if not invoice_no:
        return {"status": "error", "message": "Invoice number is required", "field": "invoice_no"}

    # Dry run check
    if import_log.dry_run:
        return {"status": "skipped", "message": "ASP data validation passed"}

    # ASP data is typically stored for reconciliation
    # For MVP, we just validate the data format
    try:
        # Validate date if provided
        if row_data.get("posting_date"):
            from frappe.utils import getdate
            getdate(row_data.get("posting_date"))

        # Validate amounts
        if row_data.get("grand_total"):
            flt(row_data.get("grand_total"))
        if row_data.get("vat_amount"):
            flt(row_data.get("vat_amount"))

        return {"status": "success", "message": f"ASP data validated: {invoice_no}"}

    except Exception as e:
        return {"status": "error", "message": str(e), "field": "invoice_no", "value": invoice_no}


# =============================================================================
# API Endpoints
# =============================================================================

@frappe.whitelist()
def start_import(import_log):
    """API endpoint to start import"""
    doc = frappe.get_doc("Bulk Import Log", import_log)
    return doc.start_import()


@frappe.whitelist()
def cancel_import(import_log):
    """API endpoint to cancel import"""
    doc = frappe.get_doc("Bulk Import Log", import_log)
    return doc.cancel_import()


@frappe.whitelist()
def get_error_report(import_log):
    """API endpoint to download error report as CSV"""
    doc = frappe.get_doc("Bulk Import Log", import_log)
    csv_content = doc.get_error_report_csv()

    if not csv_content:
        frappe.throw(_("No errors to download"))

    frappe.response["filename"] = f"import_errors_{import_log}.csv"
    frappe.response["filecontent"] = csv_content
    frappe.response["type"] = "download"
