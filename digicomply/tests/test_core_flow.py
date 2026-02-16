# Copyright (c) 2024, DigiComply
# Test script for core reconciliation flow

"""
DigiComply Core Flow Test

This script tests the complete reconciliation flow:
1. Setup test data (Company, Customers, Sales Invoices)
2. Import ASP CSV data
3. Run reconciliation
4. Verify results

Run with: bench --site [sitename] execute digicomply.tests.test_core_flow.run_test
"""

import frappe
from frappe.utils import today, add_days, getdate
import os


def run_test():
    """Main test function"""
    print("\n" + "=" * 60)
    print("DigiComply Core Flow Test")
    print("=" * 60)

    # Step 1: Setup test data
    print("\n[Step 1] Setting up test data...")
    company = setup_company()
    customers = setup_customers(company)
    invoices = setup_invoices(company, customers)
    print(f"  Created {len(invoices)} Sales Invoices")

    # Step 2: Import CSV (using actual invoice names from ERP)
    print("\n[Step 2] Importing ASP CSV data...")
    csv_import = create_csv_import_from_invoices(company, invoices)
    print(f"  CSV Import: {csv_import.name}")
    print(f"  Rows imported: {csv_import.row_count}")

    # Step 3: Run reconciliation
    print("\n[Step 3] Running reconciliation...")
    recon = run_reconciliation(company, csv_import)
    print(f"  Reconciliation Run: {recon.name}")

    # Step 4: Show results
    print("\n[Step 4] Results Summary")
    print("-" * 40)
    print(f"  Total Invoices:    {recon.total_invoices}")
    print(f"  Matched:           {recon.matched_count} (green)")
    print(f"  Mismatched:        {recon.mismatched_count} (yellow)")
    print(f"  Missing in ASP:    {recon.missing_in_asp} (red)")
    print(f"  Missing in ERP:    {recon.missing_in_erp} (red)")
    print(f"  Match Percentage:  {recon.match_percentage}%")

    # Show details
    print("\n[Details]")
    for item in recon.items[:10]:  # Show first 10 only
        status_icon = {
            "Matched": "✓",
            "Mismatched": "!",
            "Missing in ASP": "✗",
            "Missing in ERP": "?"
        }.get(item.match_status, "-")
        print(f"  {status_icon} {item.invoice_no}: {item.match_status}")
        if item.differences:
            print(f"      Differences: {item.differences}")

    print("\n" + "=" * 60)
    print("Test completed successfully!")
    print(f"View reconciliation at: /app/reconciliation-run/{recon.name}")
    print("=" * 60 + "\n")

    return recon


def setup_company():
    """Get or create test company"""
    company_name = "DigiComply Test Company"

    if frappe.db.exists("Company", company_name):
        return frappe.get_doc("Company", company_name)

    company = frappe.get_doc({
        "doctype": "Company",
        "company_name": company_name,
        "abbr": "DCTC",
        "country": "United Arab Emirates",
        "default_currency": "AED",
        "tax_id": "100000000000001",
    })
    company.insert(ignore_permissions=True)
    frappe.db.commit()
    print(f"  Created company: {company_name}")
    return company


def setup_customers(company):
    """Create test customers"""
    customers_data = [
        {"name": "ABC Trading LLC", "trn": "100123456789012"},
        {"name": "XYZ Enterprises", "trn": "100234567890123"},
        {"name": "Gulf Services Co", "trn": "100345678901234"},
        {"name": "Dubai Supplies FZE", "trn": "100456789012345"},
        {"name": "Emirates Corp", "trn": "100567890123456"},
        {"name": "Al Majid Group", "trn": "100678901234567"},
        {"name": "Noor Holdings", "trn": "100789012345678"},
        {"name": "Falcon Industries", "trn": "100890123456789"},
        {"name": "Test Missing", "trn": "100999999999999"},
        {"name": "ERP Only Customer", "trn": "100111111111111"},
    ]

    customers = []
    for c in customers_data:
        if not frappe.db.exists("Customer", c["name"]):
            customer = frappe.get_doc({
                "doctype": "Customer",
                "customer_name": c["name"],
                "customer_type": "Company",
                "customer_group": "Commercial",
                "territory": "United Arab Emirates",
                "tax_id": c["trn"],
            })
            customer.insert(ignore_permissions=True)
        else:
            customer = frappe.get_doc("Customer", c["name"])
        customers.append(customer)

    frappe.db.commit()
    return customers


def setup_invoices(company, customers):
    """Create test Sales Invoices"""
    # Use recent dates (within last month) to avoid validation issues
    base_date = add_days(today(), -15)

    # Invoice data matching ASP CSV (some with differences)
    invoices_data = [
        # Exact matches
        {"name": "INV-2024-001", "customer": "ABC Trading LLC", "date": base_date, "total": 10000, "vat": 500},
        {"name": "INV-2024-002", "customer": "XYZ Enterprises", "date": add_days(base_date, 1), "total": 20000, "vat": 1000},
        {"name": "INV-2024-003", "customer": "Gulf Services Co", "date": add_days(base_date, 2), "total": 5000, "vat": 250},

        # Mismatches (different totals)
        {"name": "INV-2024-004", "customer": "Dubai Supplies FZE", "date": add_days(base_date, 3), "total": 15500, "vat": 775},  # ASP: 15750
        {"name": "INV-2024-005", "customer": "Emirates Corp", "date": add_days(base_date, 4), "total": 31000, "vat": 1550},  # ASP: 31500

        # More exact matches
        {"name": "INV-2024-006", "customer": "Al Majid Group", "date": add_days(base_date, 5), "total": 8000, "vat": 400},
        {"name": "INV-2024-007", "customer": "Noor Holdings", "date": add_days(base_date, 6), "total": 12000, "vat": 600},
        {"name": "INV-2024-008", "customer": "Falcon Industries", "date": add_days(base_date, 7), "total": 18000, "vat": 900},

        # Missing in ASP (exists in ERP but not in CSV)
        {"name": "INV-ERP-ONLY", "customer": "ERP Only Customer", "date": add_days(base_date, 10), "total": 7500, "vat": 375},
    ]

    invoices = []
    for inv_data in invoices_data:
        inv_name = inv_data["name"]

        # Delete if exists
        if frappe.db.exists("Sales Invoice", inv_name):
            frappe.delete_doc("Sales Invoice", inv_name, force=True)

        # Get default income account
        income_account = frappe.db.get_value(
            "Account",
            {"company": company.name, "account_type": "Income Account", "is_group": 0},
            "name"
        )
        if not income_account:
            income_account = frappe.db.get_value(
                "Account",
                {"company": company.name, "root_type": "Income", "is_group": 0},
                "name"
            )

        # Get default tax account
        tax_account = frappe.db.get_value(
            "Account",
            {"company": company.name, "account_type": "Tax", "is_group": 0},
            "name"
        )
        if not tax_account:
            tax_account = frappe.db.get_value(
                "Account",
                {"company": company.name, "account_name": ["like", "%VAT%"], "is_group": 0},
                "name"
            )

        # Get receivable account
        receivable_account = frappe.db.get_value(
            "Account",
            {"company": company.name, "account_type": "Receivable", "is_group": 0},
            "name"
        )

        invoice = frappe.get_doc({
            "doctype": "Sales Invoice",
            "naming_series": "",
            "name": inv_name,
            "customer": inv_data["customer"],
            "company": company.name,
            "posting_date": inv_data["date"],
            "due_date": add_days(inv_data["date"], 30),
            "debit_to": receivable_account,
            "items": [{
                "item_name": "Service",
                "description": "Consulting Service",
                "qty": 1,
                "rate": inv_data["total"],
                "income_account": income_account,
            }],
            "taxes": [{
                "charge_type": "On Net Total",
                "account_head": tax_account,
                "description": "VAT 5%",
                "rate": 5,
            }] if tax_account else [],
        })

        try:
            invoice.insert(ignore_permissions=True)
            invoice.submit()
            invoices.append(invoice)
        except Exception as e:
            print(f"  Warning: Could not create {inv_name}: {e}")

    frappe.db.commit()
    return invoices


def create_csv_import_from_invoices(company, invoices):
    """Create CSV Import using actual invoice names from ERP"""
    csv_lines = ["Invoice Number,Invoice Date,Customer Name,Grand Total,VAT Amount,Customer TRN"]

    for i, inv in enumerate(invoices):
        # Get invoice details
        inv_doc = frappe.get_doc("Sales Invoice", inv.name)
        customer_trn = frappe.db.get_value("Customer", inv_doc.customer, "tax_id") or ""

        # Modify some values to create mismatches for testing
        grand_total = inv_doc.grand_total
        vat_amount = inv_doc.total_taxes_and_charges

        # Create mismatches for invoices 4 and 5
        if i == 3:  # Invoice 4 - total mismatch
            grand_total = grand_total + 100
        elif i == 4:  # Invoice 5 - VAT mismatch
            vat_amount = vat_amount + 50

        csv_lines.append(
            f"{inv_doc.name},{inv_doc.posting_date},{inv_doc.customer_name},{grand_total:.2f},{vat_amount:.2f},{customer_trn}"
        )

    # Add one extra invoice that doesn't exist in ERP (Missing in ERP)
    csv_lines.append(f"MISSING-IN-ERP-001,{today()},Unknown Customer,5000.00,250.00,100000000000000")

    csv_content = "\n".join(csv_lines)
    return create_csv_import_from_content(company, csv_content)


def create_csv_import_from_content(company, csv_content):

    # Create a File record
    file_doc = frappe.get_doc({
        "doctype": "File",
        "file_name": "sample_asp_data.csv",
        "content": csv_content,
        "is_private": 1,
    })
    file_doc.insert(ignore_permissions=True)

    # Create CSV Import
    csv_import = frappe.get_doc({
        "doctype": "CSV Import",
        "company": company.name,
        "asp_provider": "ClearTax",
        "file": file_doc.file_url,
        "status": "Pending",
    })
    csv_import.insert(ignore_permissions=True)

    frappe.db.commit()
    return frappe.get_doc("CSV Import", csv_import.name)


def run_reconciliation(company, csv_import):
    """Create and run reconciliation"""
    recon = frappe.get_doc({
        "doctype": "Reconciliation Run",
        "company": company.name,
        "asp_provider": "ClearTax",
        "csv_import": csv_import.name,
        "from_date": add_days(today(), -30),
        "to_date": today(),
        "posting_date": today(),
        "status": "Draft",
    })
    recon.insert(ignore_permissions=True)

    # Run reconciliation
    recon.run_reconciliation()

    frappe.db.commit()
    return frappe.get_doc("Reconciliation Run", recon.name)


def cleanup_test_data():
    """Remove all test data (for re-running tests)"""
    print("Cleaning up test data...")

    # Delete reconciliation runs
    for doc in frappe.get_all("Reconciliation Run", filters={"company": "DigiComply Test Company"}):
        frappe.delete_doc("Reconciliation Run", doc.name, force=True)

    # Delete CSV imports
    for doc in frappe.get_all("CSV Import", filters={"company": "DigiComply Test Company"}):
        frappe.delete_doc("CSV Import", doc.name, force=True)

    # Delete sales invoices
    for doc in frappe.get_all("Sales Invoice", filters={"company": "DigiComply Test Company"}):
        frappe.db.set_value("Sales Invoice", doc.name, "docstatus", 2)
        frappe.delete_doc("Sales Invoice", doc.name, force=True)

    frappe.db.commit()
    print("Cleanup complete")


# Entry point
if __name__ == "__main__":
    run_test()
