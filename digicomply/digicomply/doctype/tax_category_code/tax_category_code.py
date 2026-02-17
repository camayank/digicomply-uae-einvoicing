# Copyright (c) 2026, DigiComply and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class TaxCategoryCode(Document):
    pass


def setup_tax_category_codes():
    """Setup standard UN/CEFACT Tax Category Codes for UAE VAT"""
    codes = [
        {
            "code": "S",
            "name_en": "Standard Rate",
            "name_ar": "المعدل القياسي",
            "description": "Standard VAT rate of 5% applies",
            "tax_type": "VAT",
            "default_rate": 5
        },
        {
            "code": "Z",
            "name_en": "Zero Rated",
            "name_ar": "معفى بنسبة صفر",
            "description": "Zero-rated supplies (exports, international transport, etc.)",
            "tax_type": "Zero Rated",
            "default_rate": 0,
            "requires_exemption_reason": 1
        },
        {
            "code": "E",
            "name_en": "Exempt",
            "name_ar": "معفى",
            "description": "VAT exempt supplies (financial services, bare land, etc.)",
            "tax_type": "Exempt",
            "default_rate": 0,
            "requires_exemption_reason": 1
        },
        {
            "code": "O",
            "name_en": "Out of Scope",
            "name_ar": "خارج النطاق",
            "description": "Outside the scope of UAE VAT",
            "tax_type": "Out of Scope",
            "default_rate": 0
        },
        {
            "code": "AE",
            "name_en": "Reverse Charge",
            "name_ar": "الاحتساب العكسي",
            "description": "Reverse charge mechanism applies",
            "tax_type": "VAT",
            "default_rate": 5
        },
        {
            "code": "K",
            "name_en": "Intra-GCC",
            "name_ar": "داخل دول المجلس",
            "description": "Intra-GCC supplies",
            "tax_type": "VAT",
            "default_rate": 0
        },
        {
            "code": "G",
            "name_en": "Export",
            "name_ar": "تصدير",
            "description": "Export of goods outside GCC",
            "tax_type": "Zero Rated",
            "default_rate": 0,
            "requires_exemption_reason": 1
        },
        {
            "code": "AA",
            "name_en": "Lower Rate",
            "name_ar": "معدل منخفض",
            "description": "Lower rate (if applicable)",
            "tax_type": "VAT",
            "default_rate": 0
        },
        {
            "code": "AB",
            "name_en": "Services Outside Scope",
            "name_ar": "خدمات خارج النطاق",
            "description": "Services outside the scope of tax",
            "tax_type": "Out of Scope",
            "default_rate": 0
        },
        {
            "code": "AC",
            "name_en": "Deemed Supply",
            "name_ar": "توريد اعتباري",
            "description": "Deemed supply for VAT purposes",
            "tax_type": "VAT",
            "default_rate": 5
        }
    ]

    for code_data in codes:
        if not frappe.db.exists("Tax Category Code", code_data["code"]):
            doc = frappe.get_doc({
                "doctype": "Tax Category Code",
                **code_data
            })
            doc.insert(ignore_permissions=True)

    frappe.db.commit()
