# Copyright (c) 2026, DigiComply and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class InvoiceTypeCode(Document):
    pass


def setup_invoice_type_codes():
    """Setup standard UN/CEFACT Invoice Type Codes for UAE e-invoicing"""
    codes = [
        {
            "code": "380",
            "name_en": "Commercial Invoice",
            "name_ar": "فاتورة تجارية",
            "description": "Standard commercial invoice for B2B/B2C transactions",
            "document_type": "Invoice"
        },
        {
            "code": "381",
            "name_en": "Credit Note",
            "name_ar": "إشعار دائن",
            "description": "Credit note related to goods or services",
            "document_type": "Credit Note",
            "is_credit_note": 1
        },
        {
            "code": "383",
            "name_en": "Debit Note",
            "name_ar": "إشعار مدين",
            "description": "Debit note related to goods or services",
            "document_type": "Debit Note",
            "is_debit_note": 1
        },
        {
            "code": "386",
            "name_en": "Prepayment Invoice",
            "name_ar": "فاتورة دفعة مقدمة",
            "description": "Invoice for advance payment",
            "document_type": "Prepayment Invoice"
        },
        {
            "code": "389",
            "name_en": "Self-Billed Invoice",
            "name_ar": "فاتورة ذاتية الإصدار",
            "description": "Invoice issued by buyer on behalf of supplier",
            "document_type": "Self-Billed Invoice"
        },
        {
            "code": "325",
            "name_en": "Proforma Invoice",
            "name_ar": "فاتورة أولية",
            "description": "Preliminary invoice before delivery",
            "document_type": "Invoice"
        },
        {
            "code": "326",
            "name_en": "Partial Invoice",
            "name_ar": "فاتورة جزئية",
            "description": "Invoice for partial delivery or payment",
            "document_type": "Invoice"
        },
        {
            "code": "388",
            "name_en": "Tax Invoice",
            "name_ar": "فاتورة ضريبية",
            "description": "Invoice including tax breakdown",
            "document_type": "Invoice"
        },
        {
            "code": "751",
            "name_en": "Invoice Information",
            "name_ar": "معلومات الفاتورة",
            "description": "For information purposes only",
            "document_type": "Invoice"
        },
        {
            "code": "01",
            "name_en": "Standard Tax Invoice",
            "name_ar": "فاتورة ضريبية قياسية",
            "description": "UAE Standard Tax Invoice (B2B)",
            "document_type": "Invoice"
        },
        {
            "code": "02",
            "name_en": "Simplified Tax Invoice",
            "name_ar": "فاتورة ضريبية مبسطة",
            "description": "UAE Simplified Tax Invoice (B2C under AED 10,000)",
            "document_type": "Invoice"
        }
    ]

    for code_data in codes:
        if not frappe.db.exists("Invoice Type Code", code_data["code"]):
            doc = frappe.get_doc({
                "doctype": "Invoice Type Code",
                **code_data
            })
            doc.insert(ignore_permissions=True)

    frappe.db.commit()
