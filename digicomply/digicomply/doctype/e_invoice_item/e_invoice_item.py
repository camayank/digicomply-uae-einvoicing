# Copyright (c) 2026, DigiComply and contributors
# For license information, please see license.txt

from frappe.model.document import Document
from frappe.utils import flt


class EInvoiceItem(Document):
    def validate(self):
        self.calculate_amounts()

    def calculate_amounts(self):
        """Calculate net, tax, and gross amounts"""
        qty = flt(self.quantity)
        rate = flt(self.unit_price)
        discount = flt(self.discount_amount)

        self.net_amount = flt((qty * rate) - discount, 2)
        self.tax_amount = flt(self.net_amount * flt(self.tax_rate) / 100, 2)
        self.gross_amount = flt(self.net_amount + self.tax_amount, 2)
