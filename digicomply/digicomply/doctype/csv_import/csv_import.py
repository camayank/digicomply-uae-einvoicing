# Copyright (c) 2024, DigiComply and contributors
# License: MIT

import csv
import json
from io import StringIO

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import cstr, flt, getdate


class CSVImport(Document):
    """
    CSV Import - Handle ASP data uploads

    Supports various ASP export formats:
    - ClearTax: Invoice Report export
    - Cygnet: Transaction dump
    - Zoho: Invoice export
    - Custom: User-defined column mapping
    """

    def validate(self):
        if self.file:
            self.process_csv()

    def after_insert(self):
        """Process CSV after creation"""
        if self.file and self.status == "Pending":
            self.process_csv()

    @frappe.whitelist()
    def process_csv(self):
        """Parse CSV file and extract invoice data"""
        self.db_set("status", "Processing")

        try:
            # Get file content
            file_doc = frappe.get_doc("File", {"file_url": self.file})
            content = file_doc.get_content()

            # Decode if bytes
            if isinstance(content, bytes):
                content = content.decode("utf-8-sig")  # Handle BOM

            # Parse CSV
            rows = self.parse_csv_content(content)

            if not rows:
                frappe.throw(_("No data found in CSV file"))

            # Extract header and data
            header = rows[0]
            data_rows = rows[1:]

            # Map columns to our standard format
            mapped_data = self.map_columns(header, data_rows)

            # Store parsed data
            self.db_set("parsed_data", json.dumps(mapped_data))
            self.db_set("row_count", len(mapped_data))
            self.db_set("status", "Completed")

            # Generate preview
            self.generate_preview(mapped_data[:10])

            frappe.db.commit()
            return {"status": "success", "row_count": len(mapped_data)}

        except Exception as e:
            self.db_set("status", "Failed")
            frappe.db.commit()
            frappe.log_error(title="CSV Import Failed", message=str(e))
            frappe.throw(_("CSV processing failed: {0}").format(str(e)))

    def parse_csv_content(self, content: str) -> list:
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

    def map_columns(self, header: list, data_rows: list) -> list:
        """Map CSV columns to standard format based on ASP provider or custom mapping"""

        # Normalize header names
        header_map = {self.normalize_column_name(h): i for i, h in enumerate(header)}

        # Define standard column mappings per ASP
        asp_mappings = {
            "ClearTax": {
                "invoice_no": ["invoice number", "invoice no", "invoice_number", "document number"],
                "posting_date": ["invoice date", "date", "document date"],
                "grand_total": ["total amount", "grand total", "invoice value", "total"],
                "vat_amount": ["vat amount", "tax amount", "gst amount", "vat"],
                "customer": ["customer name", "buyer name", "party name"],
                "trn": ["customer trn", "buyer trn", "gstin", "vat number"],
            },
            "Cygnet": {
                "invoice_no": ["document no", "invoice no", "inv no"],
                "posting_date": ["document date", "inv date"],
                "grand_total": ["total value", "invoice amount"],
                "vat_amount": ["tax value", "vat"],
                "customer": ["party name", "customer"],
                "trn": ["party trn", "trn"],
            },
            "Zoho": {
                "invoice_no": ["invoice#", "invoice number"],
                "posting_date": ["invoice date", "date"],
                "grand_total": ["total", "amount"],
                "vat_amount": ["tax", "vat"],
                "customer": ["customer name"],
                "trn": ["customer tax id"],
            },
        }

        # Get mapping for this ASP, fallback to custom
        mapping = asp_mappings.get(self.asp_provider, {})

        # Apply custom column overrides
        if self.invoice_no_column:
            mapping["invoice_no"] = [self.normalize_column_name(self.invoice_no_column)]
        if self.date_column:
            mapping["posting_date"] = [self.normalize_column_name(self.date_column)]
        if self.total_column:
            mapping["grand_total"] = [self.normalize_column_name(self.total_column)]
        if self.vat_column:
            mapping["vat_amount"] = [self.normalize_column_name(self.vat_column)]
        if self.customer_column:
            mapping["customer"] = [self.normalize_column_name(self.customer_column)]
        if self.trn_column:
            mapping["trn"] = [self.normalize_column_name(self.trn_column)]

        # Find column indices
        col_indices = {}
        for field, possible_names in mapping.items():
            for name in possible_names:
                if name in header_map:
                    col_indices[field] = header_map[name]
                    break

        # Extract data
        mapped_data = []
        for row in data_rows:
            record = {}
            for field, idx in col_indices.items():
                if idx < len(row):
                    value = row[idx].strip()
                    # Convert to appropriate type
                    if field in ["grand_total", "vat_amount"]:
                        value = self.parse_amount(value)
                    elif field == "posting_date":
                        value = self.parse_date(value)
                    record[field] = value

            # Only include if has invoice number
            if record.get("invoice_no"):
                mapped_data.append(record)

        return mapped_data

    def normalize_column_name(self, name: str) -> str:
        """Normalize column name for matching"""
        return cstr(name).lower().strip().replace("_", " ").replace("-", " ")

    def parse_amount(self, value: str) -> float:
        """Parse amount string to float"""
        if not value:
            return 0.0
        # Remove currency symbols and commas
        cleaned = cstr(value).replace(",", "").replace("AED", "").replace("$", "").strip()
        return flt(cleaned)

    def parse_date(self, value: str) -> str:
        """Parse date string to standard format"""
        if not value:
            return ""
        try:
            # Try common date formats
            from dateutil.parser import parse
            dt = parse(value, dayfirst=True)
            return dt.strftime("%Y-%m-%d")
        except Exception:
            return cstr(value)

    def generate_preview(self, sample_data: list):
        """Generate HTML preview table"""
        if not sample_data:
            self.db_set("preview_html", "<p>No data to preview</p>")
            return

        html = """
        <style>
            .csv-preview { width: 100%; border-collapse: collapse; }
            .csv-preview th, .csv-preview td {
                border: 1px solid #d1d5db;
                padding: 8px;
                text-align: left;
            }
            .csv-preview th { background: #f3f4f6; }
            .csv-preview tr:nth-child(even) { background: #f9fafb; }
        </style>
        <table class="csv-preview">
            <thead>
                <tr>
                    <th>Invoice No</th>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>VAT</th>
                </tr>
            </thead>
            <tbody>
        """

        for row in sample_data:
            html += f"""
                <tr>
                    <td>{row.get('invoice_no', '')}</td>
                    <td>{row.get('posting_date', '')}</td>
                    <td>{row.get('customer', '')}</td>
                    <td>{row.get('grand_total', 0):,.2f}</td>
                    <td>{row.get('vat_amount', 0):,.2f}</td>
                </tr>
            """

        html += """
            </tbody>
        </table>
        """

        if len(sample_data) < self.row_count:
            html += f"<p><em>Showing {len(sample_data)} of {self.row_count} rows</em></p>"

        self.db_set("preview_html", html)

    def get_invoice_data(self) -> dict:
        """Return parsed data as dict keyed by invoice number"""
        if not self.parsed_data:
            return {}

        data = json.loads(self.parsed_data)
        return {row.get("invoice_no"): row for row in data if row.get("invoice_no")}


@frappe.whitelist()
def process_csv(docname):
    """API endpoint to process CSV"""
    doc = frappe.get_doc("CSV Import", docname)
    return doc.process_csv()
