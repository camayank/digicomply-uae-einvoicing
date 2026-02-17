# Copyright (c) 2026, DigiComply and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import now_datetime, getdate, flt
import json
import hashlib
import base64
from io import BytesIO

# QR code generation import
try:
    import qrcode
    HAS_QRCODE = True
except ImportError:
    HAS_QRCODE = False


class EInvoice(Document):
    def validate(self):
        self.validate_sales_invoice()
        self.populate_from_sales_invoice()
        self.validate_trn()
        self.calculate_totals()

    def validate_sales_invoice(self):
        """Validate linked Sales Invoice"""
        if not self.sales_invoice:
            return

        invoice = frappe.get_doc("Sales Invoice", self.sales_invoice)

        if invoice.docstatus != 1:
            frappe.throw("Sales Invoice must be submitted before creating E-Invoice")

        # Check if E-Invoice already exists
        existing = frappe.db.exists(
            "E-Invoice",
            {"sales_invoice": self.sales_invoice, "name": ["!=", self.name]}
        )
        if existing:
            frappe.throw(f"E-Invoice already exists for this Sales Invoice: {existing}")

    def populate_from_sales_invoice(self):
        """Populate fields from Sales Invoice"""
        if not self.sales_invoice:
            return

        invoice = frappe.get_doc("Sales Invoice", self.sales_invoice)

        # Basic info
        self.sales_invoice_date = invoice.posting_date
        self.company = invoice.company
        self.customer = invoice.customer
        self.currency = invoice.currency
        self.exchange_rate = invoice.conversion_rate or 1

        # Amounts
        self.net_amount = invoice.net_total
        self.tax_amount = invoice.total_taxes_and_charges
        self.gross_amount = invoice.grand_total
        self.total_discount = invoice.discount_amount or 0

        # Supplier details from Company
        company = frappe.get_doc("Company", invoice.company)
        self.supplier_name = company.company_name
        self.supplier_trn = company.tax_id

        # Get company address
        company_address = self._get_company_address(invoice.company)
        if company_address:
            self.supplier_address = company_address.get("address_line1", "")
            self.supplier_city = company_address.get("city", "")
            self.supplier_state = company_address.get("state", "")
            self.supplier_country = company_address.get("country", "United Arab Emirates")
            self.supplier_postal_code = company_address.get("pincode", "")

        # Buyer details from Customer
        customer = frappe.get_doc("Customer", invoice.customer)
        self.buyer_name = customer.customer_name
        self.buyer_trn = customer.tax_id
        self.customer_trn = customer.tax_id

        # Get customer address
        customer_address = self._get_customer_address(invoice.customer, invoice.customer_address)
        if customer_address:
            self.buyer_address = customer_address.get("address_line1", "")
            self.buyer_city = customer_address.get("city", "")
            self.buyer_state = customer_address.get("state", "")
            self.buyer_country = customer_address.get("country", "United Arab Emirates")
            self.buyer_postal_code = customer_address.get("pincode", "")

        # Tax details
        if invoice.taxes and len(invoice.taxes) > 0:
            tax = invoice.taxes[0]
            self.tax_rate = tax.rate or 5

        # Populate items if not already done
        if not self.items:
            self._populate_items(invoice)

    def _get_company_address(self, company):
        """Get primary address for company"""
        address = frappe.db.get_value(
            "Dynamic Link",
            {"link_doctype": "Company", "link_name": company, "parenttype": "Address"},
            "parent"
        )
        if address:
            return frappe.db.get_value(
                "Address",
                address,
                ["address_line1", "city", "state", "country", "pincode"],
                as_dict=True
            )
        return None

    def _get_customer_address(self, customer, address_name=None):
        """Get customer address"""
        if address_name:
            return frappe.db.get_value(
                "Address",
                address_name,
                ["address_line1", "city", "state", "country", "pincode"],
                as_dict=True
            )

        address = frappe.db.get_value(
            "Dynamic Link",
            {"link_doctype": "Customer", "link_name": customer, "parenttype": "Address"},
            "parent"
        )
        if address:
            return frappe.db.get_value(
                "Address",
                address,
                ["address_line1", "city", "state", "country", "pincode"],
                as_dict=True
            )
        return None

    def _populate_items(self, invoice):
        """Populate line items from Sales Invoice"""
        for item in invoice.items:
            self.append("items", {
                "item_code": item.item_code,
                "item_name": item.item_name,
                "description": item.description,
                "quantity": item.qty,
                "uom": item.uom,
                "unit_price": item.rate,
                "discount_amount": item.discount_amount or 0,
                "net_amount": item.net_amount,
                "tax_rate": self.tax_rate or 5,
                "tax_amount": flt(item.net_amount * (self.tax_rate or 5) / 100, 2),
                "gross_amount": item.amount
            })

    def validate_trn(self):
        """Validate TRN format"""
        if self.supplier_trn:
            if not self._is_valid_trn(self.supplier_trn):
                frappe.throw(f"Invalid Supplier TRN format: {self.supplier_trn}")

        if self.buyer_trn:
            if not self._is_valid_trn(self.buyer_trn):
                frappe.msgprint(f"Warning: Buyer TRN format may be invalid: {self.buyer_trn}")

    def _is_valid_trn(self, trn):
        """Validate UAE TRN format (15 digits)"""
        if not trn:
            return False
        clean_trn = trn.replace(" ", "").replace("-", "")
        return len(clean_trn) == 15 and clean_trn.isdigit()

    def calculate_totals(self):
        """Recalculate totals from items"""
        if not self.items:
            return

        self.net_amount = sum(flt(item.net_amount) for item in self.items)
        self.tax_amount = sum(flt(item.tax_amount) for item in self.items)
        self.gross_amount = self.net_amount + self.tax_amount

    @frappe.whitelist()
    def validate_for_submission(self):
        """Validate e-invoice before submission to ASP"""
        errors = []
        warnings = []

        # Required fields
        if not self.supplier_trn:
            errors.append("Supplier TRN is required")
        if not self.supplier_name:
            errors.append("Supplier Name is required")
        if not self.invoice_type_code:
            errors.append("Invoice Type Code is required")
        if not self.items or len(self.items) == 0:
            errors.append("At least one line item is required")

        # TRN validation
        if self.supplier_trn and not self._is_valid_trn(self.supplier_trn):
            errors.append("Supplier TRN is not in valid UAE format (15 digits)")

        # Amount validation
        if flt(self.gross_amount) <= 0:
            errors.append("Invoice amount must be greater than zero")

        # Tax validation
        if self.tax_rate == 0 and not self.tax_exemption_reason:
            warnings.append("Tax exemption reason should be provided for zero-rated invoices")

        # B2B TRN requirement (if buyer is business)
        if flt(self.gross_amount) > 10000 and not self.buyer_trn:
            warnings.append("Buyer TRN recommended for invoices above AED 10,000")

        # Item validations
        for idx, item in enumerate(self.items, 1):
            if not item.item_name:
                errors.append(f"Item {idx}: Item name is required")
            if flt(item.quantity) <= 0:
                errors.append(f"Item {idx}: Quantity must be greater than zero")
            if flt(item.unit_price) < 0:
                errors.append(f"Item {idx}: Unit price cannot be negative")

        if errors:
            self.validation_status = "Invalid"
            self.last_error = "\n".join(errors)
            return {"valid": False, "errors": errors, "warnings": warnings}
        elif warnings:
            self.validation_status = "Warnings"
            return {"valid": True, "errors": [], "warnings": warnings}
        else:
            self.validation_status = "Valid"
            return {"valid": True, "errors": [], "warnings": []}

    @frappe.whitelist()
    def submit_to_asp(self):
        """Submit e-invoice to ASP for processing"""
        # Validate first
        validation = self.validate_for_submission()
        if not validation.get("valid"):
            return {
                "success": False,
                "message": "Validation failed",
                "errors": validation.get("errors")
            }

        # Get ASP connection
        if not self.asp_connection:
            # Get default connection for company
            connection = frappe.db.get_value(
                "ASP Connection",
                {"company": self.company, "enabled": 1, "is_default": 1},
                "name"
            )
            if not connection:
                connection = frappe.db.get_value(
                    "ASP Connection",
                    {"company": self.company, "enabled": 1},
                    "name"
                )
            if not connection:
                return {"success": False, "message": "No ASP connection configured for this company"}
            self.asp_connection = connection

        asp = frappe.get_doc("ASP Connection", self.asp_connection)
        self.asp_provider = asp.asp_provider

        # Update status
        self.e_invoice_status = "Pending Submission"
        self.submission_date = now_datetime()
        self.submission_attempts = (self.submission_attempts or 0) + 1

        # Prepare invoice data
        invoice_data = self._prepare_invoice_data()

        try:
            from digicomply.digicomply.api.connector_framework import ConnectorFramework

            framework = ConnectorFramework(self.asp_connection)
            result = framework.push_invoice(invoice_data)

            self.response_date = now_datetime()

            if result.get("success"):
                response_data = result.get("data", {})
                self._process_asp_response(response_data)
                self.e_invoice_status = "Accepted"
                self.last_error = None
                self.error_code = None
            else:
                self.e_invoice_status = "Error"
                self.last_error = result.get("error", "Unknown error")
                self.error_code = result.get("error_code")

            self.asp_response = json.dumps(result, indent=2)
            self._add_to_history("submission", result)
            self.save()

            return result

        except Exception as e:
            self.e_invoice_status = "Error"
            self.last_error = str(e)[:500]
            self.response_date = now_datetime()
            self._add_to_history("error", {"error": str(e)})
            self.save()

            return {"success": False, "message": str(e)}

    def _prepare_invoice_data(self):
        """Prepare invoice data in PINT AE format for ASP"""
        return {
            "invoice_number": self.sales_invoice,
            "invoice_type_code": self.invoice_type_code,
            "issue_date": str(self.sales_invoice_date),
            "issue_time": now_datetime().strftime("%H:%M:%S"),
            "currency_code": self.currency,
            "supplier": {
                "name": self.supplier_name,
                "trn": self.supplier_trn,
                "address": {
                    "street": self.supplier_address,
                    "city": self.supplier_city,
                    "state": self.supplier_state,
                    "country": self.supplier_country,
                    "postal_code": self.supplier_postal_code
                }
            },
            "buyer": {
                "name": self.buyer_name,
                "trn": self.buyer_trn,
                "address": {
                    "street": self.buyer_address,
                    "city": self.buyer_city,
                    "state": self.buyer_state,
                    "country": self.buyer_country,
                    "postal_code": self.buyer_postal_code
                }
            },
            "totals": {
                "net_amount": flt(self.net_amount, 2),
                "tax_amount": flt(self.tax_amount, 2),
                "gross_amount": flt(self.gross_amount, 2),
                "discount": flt(self.total_discount, 2)
            },
            "tax_details": {
                "category_code": self.tax_category_code,
                "rate": self.tax_rate,
                "exemption_reason": self.tax_exemption_reason,
                "reverse_charge": self.reverse_charge
            },
            "line_items": [
                {
                    "line_number": idx + 1,
                    "item_code": item.item_code,
                    "item_name": item.item_name,
                    "description": item.description,
                    "quantity": flt(item.quantity, 3),
                    "unit_code": item.uom,
                    "unit_price": flt(item.unit_price, 2),
                    "discount": flt(item.discount_amount, 2),
                    "net_amount": flt(item.net_amount, 2),
                    "tax_rate": flt(item.tax_rate, 2),
                    "tax_amount": flt(item.tax_amount, 2),
                    "gross_amount": flt(item.gross_amount, 2)
                }
                for idx, item in enumerate(self.items)
            ]
        }

    def _process_asp_response(self, response_data):
        """Process successful ASP response"""
        # Extract IRN
        self.irn = response_data.get("irn") or response_data.get("invoice_reference_number")
        self.irn_status = "Generated" if self.irn else "Pending"
        self.irn_generation_date = now_datetime()

        # Acknowledgement
        self.ack_number = response_data.get("ack_number") or response_data.get("acknowledgement_number")
        self.ack_date = response_data.get("ack_date")

        # ASP reference
        self.asp_reference_id = response_data.get("reference_id") or response_data.get("transaction_id")

        # QR Code
        qr_code = response_data.get("qr_code") or response_data.get("qr_code_data")
        if qr_code:
            self.qr_code_data = qr_code
            self.qr_code_text = response_data.get("qr_code_text")

        # Signed document
        self.signed_invoice_xml = response_data.get("signed_xml") or response_data.get("signed_invoice")
        self.signed_invoice_json = response_data.get("signed_json")
        self.document_hash = response_data.get("document_hash") or response_data.get("hash")
        self.signature_value = response_data.get("signature") or response_data.get("digital_signature")

        # Peppol details
        self.peppol_message_id = response_data.get("peppol_message_id")
        self.peppol_transmission_date = response_data.get("peppol_transmission_date")

    def _add_to_history(self, event_type, data):
        """Add entry to submission history"""
        history = json.loads(self.submission_history or "[]")
        history.append({
            "timestamp": str(now_datetime()),
            "event": event_type,
            "data": data
        })
        self.submission_history = json.dumps(history, indent=2)

    @frappe.whitelist()
    def cancel_irn(self, reason):
        """Cancel the IRN"""
        if self.irn_status != "Generated":
            return {"success": False, "message": "IRN not generated or already cancelled"}

        try:
            from digicomply.digicomply.api.connector_framework import ConnectorFramework

            framework = ConnectorFramework(self.asp_connection)
            result = framework._make_request(
                "POST",
                f"/cancel/{self.irn}",
                data={"reason": reason, "irn": self.irn}
            )

            if result.get("success"):
                self.irn_status = "Cancelled"
                self.irn_cancel_date = now_datetime()
                self.e_invoice_status = "Cancelled"
                self._add_to_history("cancellation", {"reason": reason})
                self.save()

            return result

        except Exception as e:
            return {"success": False, "message": str(e)}

    @frappe.whitelist()
    def generate_document_hash(self):
        """Generate SHA256 hash of the invoice data"""
        data = self._prepare_invoice_data()
        data_string = json.dumps(data, sort_keys=True)
        self.document_hash = hashlib.sha256(data_string.encode()).hexdigest()
        return self.document_hash

    @frappe.whitelist()
    def generate_qr_code(self):
        """
        Generate QR code per UAE e-invoicing specification
        Uses TLV (Tag-Length-Value) encoding as required by FTA

        TLV Tags:
        - Tag 1: Seller Name
        - Tag 2: VAT Registration Number (TRN)
        - Tag 3: Invoice Date/Time (ISO 8601)
        - Tag 4: Invoice Total (with VAT)
        - Tag 5: VAT Amount
        - Tag 6: Document Hash (SHA-256)

        Returns:
            str: Base64 encoded QR code data URL
        """
        if not HAS_QRCODE:
            frappe.throw("qrcode library is required for QR code generation. Please install it using: pip install qrcode[pil]")

        def tlv_encode(tag, value):
            """Encode a single TLV field per UAE specification"""
            value_str = str(value) if value else ''
            value_bytes = value_str.encode('utf-8')
            return bytes([tag, len(value_bytes)]) + value_bytes

        # Generate document hash if not already present
        if not self.document_hash:
            self.generate_document_hash()

        # Get invoice date/time in ISO 8601 format
        invoice_datetime = self.sales_invoice_date
        if invoice_datetime:
            if hasattr(invoice_datetime, 'isoformat'):
                invoice_datetime_str = invoice_datetime.isoformat()
            else:
                invoice_datetime_str = str(invoice_datetime)
        else:
            invoice_datetime_str = str(now_datetime())

        # Build TLV data per UAE specification
        tlv_data = b''
        tlv_data += tlv_encode(1, self.supplier_name or '')
        tlv_data += tlv_encode(2, self.supplier_trn or '')
        tlv_data += tlv_encode(3, invoice_datetime_str)
        tlv_data += tlv_encode(4, f"{flt(self.gross_amount, 2):.2f}")
        tlv_data += tlv_encode(5, f"{flt(self.tax_amount, 2):.2f}")

        # Add document hash (Tag 6) if available
        if self.document_hash:
            tlv_data += tlv_encode(6, self.document_hash)

        # Base64 encode the TLV data
        qr_content = base64.b64encode(tlv_data).decode('ascii')

        # Store the decoded content for verification
        self.qr_code_text = qr_content

        # Generate QR code image
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(qr_content)
        qr.make(fit=True)

        # Convert to PNG image
        img = qr.make_image(fill_color="black", back_color="white")
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)

        # Store as base64 data URL
        img_base64 = base64.b64encode(buffer.read()).decode()
        self.qr_code_data = f"data:image/png;base64,{img_base64}"
        self.qr_code_generated_locally = 1

        return self.qr_code_data

    def before_submit(self):
        """Generate document hash and QR code before submission"""
        # Generate document hash
        self.generate_document_hash()

        # Generate QR code if not already present from ASP
        if not self.qr_code_data:
            try:
                self.generate_qr_code()
            except Exception as e:
                frappe.log_error(
                    f"Failed to generate QR code for {self.name}: {str(e)}",
                    "E-Invoice QR Generation Error"
                )


@frappe.whitelist()
def create_e_invoice_from_sales_invoice(sales_invoice):
    """Create E-Invoice from Sales Invoice"""
    # Check if already exists
    existing = frappe.db.exists("E-Invoice", {"sales_invoice": sales_invoice})
    if existing:
        return frappe.get_doc("E-Invoice", existing)

    # Create new
    e_invoice = frappe.get_doc({
        "doctype": "E-Invoice",
        "sales_invoice": sales_invoice,
        "invoice_type_code": "380"  # Default: Commercial Invoice
    })
    e_invoice.insert()

    return e_invoice


@frappe.whitelist()
def bulk_create_e_invoices(sales_invoices):
    """Create E-Invoices for multiple Sales Invoices"""
    if isinstance(sales_invoices, str):
        sales_invoices = json.loads(sales_invoices)

    results = []
    for inv in sales_invoices:
        try:
            e_inv = create_e_invoice_from_sales_invoice(inv)
            results.append({"invoice": inv, "success": True, "e_invoice": e_inv.name})
        except Exception as e:
            results.append({"invoice": inv, "success": False, "error": str(e)})

    return results


@frappe.whitelist()
def bulk_submit_e_invoices(e_invoices):
    """Submit multiple E-Invoices to ASP"""
    if isinstance(e_invoices, str):
        e_invoices = json.loads(e_invoices)

    results = []
    for inv in e_invoices:
        try:
            e_invoice = frappe.get_doc("E-Invoice", inv)
            result = e_invoice.submit_to_asp()
            results.append({"e_invoice": inv, **result})
        except Exception as e:
            results.append({"e_invoice": inv, "success": False, "error": str(e)})

    return results


def auto_create_e_invoice(doc, method):
    """Auto-create E-Invoice on Sales Invoice submit (called from hooks)"""
    from digicomply.digicomply.doctype.e_invoice_settings.e_invoice_settings import (
        get_e_invoice_settings, is_e_invoicing_enabled
    )

    # Check if e-invoicing is enabled
    if not is_e_invoicing_enabled():
        return

    settings = get_e_invoice_settings()

    # Check if auto-create is enabled
    if not settings.auto_create_e_invoice:
        return

    # Check if E-Invoice already exists
    if frappe.db.exists("E-Invoice", {"sales_invoice": doc.name}):
        return

    try:
        # Create E-Invoice
        e_invoice = frappe.get_doc({
            "doctype": "E-Invoice",
            "sales_invoice": doc.name,
            "invoice_type_code": settings.default_invoice_type or "380"
        })
        e_invoice.insert(ignore_permissions=True)

        # Auto-submit to ASP if enabled
        if settings.auto_submit_to_asp:
            # Validate first
            validation = e_invoice.validate_for_submission()
            if validation.get("valid"):
                e_invoice.submit_to_asp()

        frappe.msgprint(
            f"E-Invoice {e_invoice.name} created for {doc.name}",
            indicator="green",
            alert=True
        )

    except Exception as e:
        frappe.log_error(
            f"Failed to create E-Invoice for {doc.name}: {str(e)}",
            "E-Invoice Auto Creation Error"
        )
