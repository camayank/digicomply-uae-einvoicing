# Phase 1: Bulk Reconciliation + Multi-TRN Foundation - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build enterprise-grade bulk reconciliation with multi-TRN support, bulk master data operations, and custom roles.

**Architecture:** Frappe DocTypes with custom JavaScript controllers, background job processing for bulk operations, and role-based access control. All UI follows DigiComply purple theme with dc- CSS prefix.

**Tech Stack:** Frappe Framework (Python), MariaDB, Redis background jobs, Custom JS/CSS

---

## Pre-Implementation Setup

### Task 0: Create Development Branch

**Files:**
- None (git operations only)

**Step 1: Create feature branch**

```bash
cd "/Users/rakeshanita/digicomply accounting ai/frappe-bench/apps/digicomply"
git checkout -b feature/phase1-bulk-reconciliation
```

**Step 2: Verify branch**

Run: `git branch --show-current`
Expected: `feature/phase1-bulk-reconciliation`

---

## Module 1.1: Company & TRN Management

### Task 1: Create TRN Registry DocType

**Files:**
- Create: `digicomply/digicomply/doctype/trn_registry/__init__.py`
- Create: `digicomply/digicomply/doctype/trn_registry/trn_registry.json`
- Create: `digicomply/digicomply/doctype/trn_registry/trn_registry.py`
- Create: `digicomply/digicomply/doctype/trn_registry/trn_registry.js`

**Step 1: Create DocType directory**

```bash
mkdir -p "/Users/rakeshanita/digicomply accounting ai/frappe-bench/apps/digicomply/digicomply/digicomply/doctype/trn_registry"
```

**Step 2: Create __init__.py**

```python
# digicomply/digicomply/doctype/trn_registry/__init__.py
# TRN Registry - Central registry for UAE Tax Registration Numbers
```

**Step 3: Create trn_registry.json**

```json
{
    "actions": [],
    "allow_rename": 0,
    "autoname": "field:trn",
    "creation": "2026-02-17 00:00:00.000000",
    "doctype": "DocType",
    "engine": "InnoDB",
    "field_order": [
        "section_trn",
        "trn",
        "company",
        "column_break_1",
        "entity_name",
        "entity_type",
        "section_validation",
        "validation_status",
        "last_validated",
        "column_break_2",
        "fta_registration_date",
        "fta_expiry_date",
        "section_settings",
        "is_primary",
        "is_active",
        "notes"
    ],
    "fields": [
        {
            "fieldname": "section_trn",
            "fieldtype": "Section Break",
            "label": "TRN Information"
        },
        {
            "fieldname": "trn",
            "fieldtype": "Data",
            "in_list_view": 1,
            "in_standard_filter": 1,
            "label": "TRN",
            "reqd": 1,
            "unique": 1,
            "description": "15-digit UAE Tax Registration Number"
        },
        {
            "fieldname": "company",
            "fieldtype": "Link",
            "in_list_view": 1,
            "in_standard_filter": 1,
            "label": "Company",
            "options": "Company",
            "reqd": 1
        },
        {
            "fieldname": "column_break_1",
            "fieldtype": "Column Break"
        },
        {
            "fieldname": "entity_name",
            "fieldtype": "Data",
            "in_list_view": 1,
            "label": "Entity Name",
            "reqd": 1
        },
        {
            "fieldname": "entity_type",
            "fieldtype": "Select",
            "label": "Entity Type",
            "options": "\nCompany\nBranch\nGroup Entity\nSubsidiary"
        },
        {
            "fieldname": "section_validation",
            "fieldtype": "Section Break",
            "label": "Validation Status"
        },
        {
            "default": "Not Validated",
            "fieldname": "validation_status",
            "fieldtype": "Select",
            "in_list_view": 1,
            "label": "Validation Status",
            "options": "Not Validated\nValid\nInvalid\nExpired\nPending Verification",
            "read_only": 1
        },
        {
            "fieldname": "last_validated",
            "fieldtype": "Datetime",
            "label": "Last Validated",
            "read_only": 1
        },
        {
            "fieldname": "column_break_2",
            "fieldtype": "Column Break"
        },
        {
            "fieldname": "fta_registration_date",
            "fieldtype": "Date",
            "label": "FTA Registration Date"
        },
        {
            "fieldname": "fta_expiry_date",
            "fieldtype": "Date",
            "label": "FTA Expiry Date"
        },
        {
            "fieldname": "section_settings",
            "fieldtype": "Section Break",
            "label": "Settings"
        },
        {
            "default": "0",
            "fieldname": "is_primary",
            "fieldtype": "Check",
            "label": "Is Primary TRN"
        },
        {
            "default": "1",
            "fieldname": "is_active",
            "fieldtype": "Check",
            "label": "Is Active"
        },
        {
            "fieldname": "notes",
            "fieldtype": "Small Text",
            "label": "Notes"
        }
    ],
    "index_web_pages_for_search": 1,
    "links": [],
    "modified": "2026-02-17 00:00:00.000000",
    "modified_by": "Administrator",
    "module": "DigiComply",
    "name": "TRN Registry",
    "naming_rule": "By fieldname",
    "owner": "Administrator",
    "permissions": [
        {
            "create": 1,
            "delete": 1,
            "email": 1,
            "export": 1,
            "print": 1,
            "read": 1,
            "report": 1,
            "role": "System Manager",
            "share": 1,
            "write": 1
        },
        {
            "create": 1,
            "email": 1,
            "export": 1,
            "print": 1,
            "read": 1,
            "report": 1,
            "role": "Accounts Manager",
            "share": 1,
            "write": 1
        }
    ],
    "sort_field": "modified",
    "sort_order": "DESC",
    "states": [],
    "title_field": "entity_name",
    "track_changes": 1
}
```

**Step 4: Create trn_registry.py with validation**

```python
# digicomply/digicomply/doctype/trn_registry/trn_registry.py
import frappe
from frappe.model.document import Document
from frappe import _
import re


class TRNRegistry(Document):
    def validate(self):
        self.validate_trn_format()
        self.validate_unique_primary()

    def validate_trn_format(self):
        """Validate UAE TRN format: 15 digits, specific checksum"""
        if not self.trn:
            return

        # Remove any spaces or dashes
        clean_trn = re.sub(r'[\s\-]', '', self.trn)
        self.trn = clean_trn

        # Must be exactly 15 digits
        if not re.match(r'^\d{15}$', clean_trn):
            frappe.throw(_("TRN must be exactly 15 digits. Got: {0}").format(len(clean_trn)))

        # UAE TRN starts with 100
        if not clean_trn.startswith('100'):
            frappe.throw(_("UAE TRN must start with '100'. Got: {0}").format(clean_trn[:3]))

        # Validate checksum (last digit)
        if not self.validate_checksum(clean_trn):
            frappe.throw(_("TRN checksum validation failed. Please verify the TRN."))

        self.validation_status = "Valid"
        self.last_validated = frappe.utils.now()

    def validate_checksum(self, trn):
        """UAE TRN uses Luhn algorithm for checksum"""
        digits = [int(d) for d in trn]
        checksum = 0
        for i, digit in enumerate(digits[:-1]):
            if i % 2 == 0:
                doubled = digit * 2
                checksum += doubled if doubled < 10 else doubled - 9
            else:
                checksum += digit
        return (10 - (checksum % 10)) % 10 == digits[-1]

    def validate_unique_primary(self):
        """Only one TRN can be primary per company"""
        if self.is_primary:
            existing = frappe.db.exists(
                "TRN Registry",
                {
                    "company": self.company,
                    "is_primary": 1,
                    "name": ("!=", self.name)
                }
            )
            if existing:
                frappe.throw(
                    _("Company {0} already has a primary TRN: {1}").format(
                        self.company, existing
                    )
                )


@frappe.whitelist()
def validate_trn_bulk(trns):
    """Validate multiple TRNs at once. Returns dict of TRN -> status"""
    import json
    if isinstance(trns, str):
        trns = json.loads(trns)

    results = {}
    for trn in trns:
        try:
            doc = frappe.new_doc("TRN Registry")
            doc.trn = trn
            doc.validate_trn_format()
            results[trn] = {"status": "Valid", "error": None}
        except Exception as e:
            results[trn] = {"status": "Invalid", "error": str(e)}

    return results
```

**Step 5: Create trn_registry.js**

```javascript
// digicomply/digicomply/doctype/trn_registry/trn_registry.js
frappe.ui.form.on('TRN Registry', {
    refresh: function(frm) {
        // Add custom styling
        frm.$wrapper.addClass('dc-form-wrapper');

        // Add validate button
        if (!frm.is_new()) {
            frm.add_custom_button(__('Validate with FTA'), function() {
                frm.trigger('validate_with_fta');
            }, __('Actions'));
        }

        // Show validation status indicator
        frm.trigger('update_status_indicator');
    },

    trn: function(frm) {
        // Auto-format TRN as user types
        if (frm.doc.trn) {
            let clean = frm.doc.trn.replace(/[\s\-]/g, '');
            if (clean !== frm.doc.trn) {
                frm.set_value('trn', clean);
            }
        }
    },

    validate_with_fta: function(frm) {
        frappe.show_alert({
            message: __('FTA API validation will be available in Phase 2'),
            indicator: 'blue'
        });
    },

    update_status_indicator: function(frm) {
        const status = frm.doc.validation_status;
        const colors = {
            'Valid': 'green',
            'Invalid': 'red',
            'Expired': 'orange',
            'Not Validated': 'grey',
            'Pending Verification': 'blue'
        };

        if (status && frm.page) {
            frm.page.set_indicator(status, colors[status] || 'grey');
        }
    }
});
```

**Step 6: Run migrate to create table**

```bash
cd "/Users/rakeshanita/digicomply accounting ai/frappe-bench"
bench --site digicomply.local migrate
```

Expected: Migration successful, TRN Registry table created

**Step 7: Commit**

```bash
cd "/Users/rakeshanita/digicomply accounting ai/frappe-bench/apps/digicomply"
git add digicomply/digicomply/doctype/trn_registry/
git commit -m "feat(trn): add TRN Registry DocType with UAE validation

- 15-digit format validation
- Luhn checksum verification
- Primary TRN per company constraint
- Bulk validation API endpoint"
```

---

### Task 2: Create Company Group DocType

**Files:**
- Create: `digicomply/digicomply/doctype/company_group/__init__.py`
- Create: `digicomply/digicomply/doctype/company_group/company_group.json`
- Create: `digicomply/digicomply/doctype/company_group/company_group.py`
- Create: `digicomply/digicomply/doctype/company_group/company_group.js`

**Step 1: Create DocType directory**

```bash
mkdir -p "/Users/rakeshanita/digicomply accounting ai/frappe-bench/apps/digicomply/digicomply/digicomply/doctype/company_group"
```

**Step 2: Create __init__.py**

```python
# digicomply/digicomply/doctype/company_group/__init__.py
# Company Group - Group related companies for multi-TRN management
```

**Step 3: Create company_group.json**

```json
{
    "actions": [],
    "allow_rename": 1,
    "autoname": "field:group_name",
    "creation": "2026-02-17 00:00:00.000000",
    "doctype": "DocType",
    "engine": "InnoDB",
    "field_order": [
        "section_group",
        "group_name",
        "parent_group",
        "column_break_1",
        "group_type",
        "is_active",
        "section_companies",
        "companies",
        "section_settings",
        "default_asp_provider",
        "reconciliation_tolerance",
        "notes"
    ],
    "fields": [
        {
            "fieldname": "section_group",
            "fieldtype": "Section Break",
            "label": "Group Information"
        },
        {
            "fieldname": "group_name",
            "fieldtype": "Data",
            "in_list_view": 1,
            "label": "Group Name",
            "reqd": 1,
            "unique": 1
        },
        {
            "fieldname": "parent_group",
            "fieldtype": "Link",
            "label": "Parent Group",
            "options": "Company Group"
        },
        {
            "fieldname": "column_break_1",
            "fieldtype": "Column Break"
        },
        {
            "default": "Holding Company",
            "fieldname": "group_type",
            "fieldtype": "Select",
            "label": "Group Type",
            "options": "Holding Company\nRegional Group\nBusiness Unit\nJoint Venture"
        },
        {
            "default": "1",
            "fieldname": "is_active",
            "fieldtype": "Check",
            "label": "Is Active"
        },
        {
            "fieldname": "section_companies",
            "fieldtype": "Section Break",
            "label": "Member Companies"
        },
        {
            "fieldname": "companies",
            "fieldtype": "Table",
            "label": "Companies",
            "options": "Company Group Member"
        },
        {
            "fieldname": "section_settings",
            "fieldtype": "Section Break",
            "label": "Default Settings"
        },
        {
            "fieldname": "default_asp_provider",
            "fieldtype": "Select",
            "label": "Default ASP Provider",
            "options": "\nClearTax\nCygnet\nZoho\nTabadul\nOther"
        },
        {
            "default": "0.5",
            "description": "Default tolerance for reconciliation (in AED)",
            "fieldname": "reconciliation_tolerance",
            "fieldtype": "Currency",
            "label": "Reconciliation Tolerance"
        },
        {
            "fieldname": "notes",
            "fieldtype": "Small Text",
            "label": "Notes"
        }
    ],
    "index_web_pages_for_search": 1,
    "links": [],
    "modified": "2026-02-17 00:00:00.000000",
    "modified_by": "Administrator",
    "module": "DigiComply",
    "name": "Company Group",
    "naming_rule": "By fieldname",
    "owner": "Administrator",
    "permissions": [
        {
            "create": 1,
            "delete": 1,
            "email": 1,
            "export": 1,
            "print": 1,
            "read": 1,
            "report": 1,
            "role": "System Manager",
            "share": 1,
            "write": 1
        }
    ],
    "sort_field": "modified",
    "sort_order": "DESC",
    "states": [],
    "track_changes": 1
}
```

**Step 4: Create Company Group Member child table**

```bash
mkdir -p "/Users/rakeshanita/digicomply accounting ai/frappe-bench/apps/digicomply/digicomply/digicomply/doctype/company_group_member"
```

Create `company_group_member.json`:

```json
{
    "actions": [],
    "allow_rename": 0,
    "creation": "2026-02-17 00:00:00.000000",
    "doctype": "DocType",
    "editable_grid": 1,
    "engine": "InnoDB",
    "field_order": [
        "company",
        "trn",
        "role_in_group",
        "is_primary"
    ],
    "fields": [
        {
            "fieldname": "company",
            "fieldtype": "Link",
            "in_list_view": 1,
            "label": "Company",
            "options": "Company",
            "reqd": 1
        },
        {
            "fieldname": "trn",
            "fieldtype": "Link",
            "in_list_view": 1,
            "label": "TRN",
            "options": "TRN Registry"
        },
        {
            "fieldname": "role_in_group",
            "fieldtype": "Select",
            "in_list_view": 1,
            "label": "Role",
            "options": "Parent\nSubsidiary\nBranch\nAffiliate"
        },
        {
            "default": "0",
            "fieldname": "is_primary",
            "fieldtype": "Check",
            "in_list_view": 1,
            "label": "Is Primary"
        }
    ],
    "index_web_pages_for_search": 0,
    "istable": 1,
    "links": [],
    "modified": "2026-02-17 00:00:00.000000",
    "modified_by": "Administrator",
    "module": "DigiComply",
    "name": "Company Group Member",
    "naming_rule": "Random",
    "owner": "Administrator",
    "permissions": [],
    "sort_field": "modified",
    "sort_order": "DESC",
    "states": [],
    "track_changes": 0
}
```

**Step 5: Create company_group.py**

```python
# digicomply/digicomply/doctype/company_group/company_group.py
import frappe
from frappe.model.document import Document
from frappe import _


class CompanyGroup(Document):
    def validate(self):
        self.validate_no_circular_reference()
        self.validate_unique_companies()

    def validate_no_circular_reference(self):
        """Prevent circular parent-child relationships"""
        if self.parent_group:
            parent = frappe.get_doc("Company Group", self.parent_group)
            visited = {self.name}

            while parent.parent_group:
                if parent.parent_group in visited:
                    frappe.throw(_("Circular reference detected in group hierarchy"))
                visited.add(parent.parent_group)
                parent = frappe.get_doc("Company Group", parent.parent_group)

    def validate_unique_companies(self):
        """Each company can only appear once in a group"""
        companies = [d.company for d in self.companies]
        if len(companies) != len(set(companies)):
            frappe.throw(_("A company cannot appear more than once in a group"))

    def get_all_companies(self):
        """Get all companies including those in child groups"""
        companies = [d.company for d in self.companies]

        # Get child groups
        child_groups = frappe.get_all(
            "Company Group",
            filters={"parent_group": self.name},
            pluck="name"
        )

        for child_group in child_groups:
            child_doc = frappe.get_doc("Company Group", child_group)
            companies.extend(child_doc.get_all_companies())

        return list(set(companies))


@frappe.whitelist()
def get_group_companies(group_name):
    """API to get all companies in a group hierarchy"""
    doc = frappe.get_doc("Company Group", group_name)
    return doc.get_all_companies()
```

**Step 6: Create company_group.js**

```javascript
// digicomply/digicomply/doctype/company_group/company_group.js
frappe.ui.form.on('Company Group', {
    refresh: function(frm) {
        frm.$wrapper.addClass('dc-form-wrapper');

        if (!frm.is_new()) {
            // Add button to view all companies
            frm.add_custom_button(__('View All Companies'), function() {
                frappe.call({
                    method: 'digicomply.digicomply.doctype.company_group.company_group.get_group_companies',
                    args: { group_name: frm.doc.name },
                    callback: function(r) {
                        if (r.message) {
                            frappe.msgprint({
                                title: __('Companies in Group'),
                                message: r.message.join('<br>'),
                                indicator: 'blue'
                            });
                        }
                    }
                });
            });

            // Add button to run reconciliation for all
            frm.add_custom_button(__('Reconcile All'), function() {
                frappe.confirm(
                    __('Run reconciliation for all companies in this group?'),
                    function() {
                        frm.trigger('run_group_reconciliation');
                    }
                );
            }, __('Actions'));
        }
    },

    run_group_reconciliation: function(frm) {
        frappe.show_alert({
            message: __('Multi-company reconciliation will be implemented in Task 8'),
            indicator: 'blue'
        });
    }
});
```

**Step 7: Create __init__.py files**

```bash
touch "/Users/rakeshanita/digicomply accounting ai/frappe-bench/apps/digicomply/digicomply/digicomply/doctype/company_group/__init__.py"
touch "/Users/rakeshanita/digicomply accounting ai/frappe-bench/apps/digicomply/digicomply/digicomply/doctype/company_group_member/__init__.py"
```

**Step 8: Run migrate**

```bash
cd "/Users/rakeshanita/digicomply accounting ai/frappe-bench"
bench --site digicomply.local migrate
```

**Step 9: Commit**

```bash
cd "/Users/rakeshanita/digicomply accounting ai/frappe-bench/apps/digicomply"
git add digicomply/digicomply/doctype/company_group/ digicomply/digicomply/doctype/company_group_member/
git commit -m "feat(company): add Company Group with hierarchy support

- Parent/child group relationships
- Member companies with roles
- API to fetch all companies in hierarchy
- Group-level default settings"
```

---

## Module 1.2: Master Data Bulk Operations

### Task 3: Create Bulk Import Log DocType

**Files:**
- Create: `digicomply/digicomply/doctype/bulk_import_log/__init__.py`
- Create: `digicomply/digicomply/doctype/bulk_import_log/bulk_import_log.json`
- Create: `digicomply/digicomply/doctype/bulk_import_log/bulk_import_log.py`
- Create: `digicomply/digicomply/doctype/bulk_import_log/bulk_import_log.js`

**Step 1: Create DocType directory**

```bash
mkdir -p "/Users/rakeshanita/digicomply accounting ai/frappe-bench/apps/digicomply/digicomply/digicomply/doctype/bulk_import_log"
```

**Step 2: Create bulk_import_log.json**

```json
{
    "actions": [],
    "allow_rename": 0,
    "autoname": "BLK-.YYYY.-.#####",
    "creation": "2026-02-17 00:00:00.000000",
    "doctype": "DocType",
    "engine": "InnoDB",
    "field_order": [
        "section_import",
        "import_type",
        "company",
        "column_break_1",
        "started_at",
        "completed_at",
        "status",
        "section_file",
        "file",
        "file_name",
        "section_progress",
        "total_rows",
        "processed_rows",
        "success_count",
        "column_break_2",
        "error_count",
        "warning_count",
        "progress_percent",
        "section_results",
        "result_summary",
        "error_log",
        "section_settings",
        "skip_validation",
        "update_existing",
        "dry_run"
    ],
    "fields": [
        {
            "fieldname": "section_import",
            "fieldtype": "Section Break",
            "label": "Import Details"
        },
        {
            "fieldname": "import_type",
            "fieldtype": "Select",
            "in_list_view": 1,
            "in_standard_filter": 1,
            "label": "Import Type",
            "options": "\nCustomer\nSupplier\nItem\nTRN Registry\nCompany\nInvoice\nASP Data",
            "reqd": 1
        },
        {
            "fieldname": "company",
            "fieldtype": "Link",
            "in_list_view": 1,
            "in_standard_filter": 1,
            "label": "Company",
            "options": "Company"
        },
        {
            "fieldname": "column_break_1",
            "fieldtype": "Column Break"
        },
        {
            "fieldname": "started_at",
            "fieldtype": "Datetime",
            "in_list_view": 1,
            "label": "Started At",
            "read_only": 1
        },
        {
            "fieldname": "completed_at",
            "fieldtype": "Datetime",
            "label": "Completed At",
            "read_only": 1
        },
        {
            "default": "Pending",
            "fieldname": "status",
            "fieldtype": "Select",
            "in_list_view": 1,
            "in_standard_filter": 1,
            "label": "Status",
            "options": "Pending\nValidating\nProcessing\nCompleted\nCompleted with Errors\nFailed\nCancelled",
            "read_only": 1
        },
        {
            "fieldname": "section_file",
            "fieldtype": "Section Break",
            "label": "Source File"
        },
        {
            "fieldname": "file",
            "fieldtype": "Attach",
            "label": "Import File",
            "reqd": 1
        },
        {
            "fieldname": "file_name",
            "fieldtype": "Data",
            "label": "File Name",
            "read_only": 1
        },
        {
            "fieldname": "section_progress",
            "fieldtype": "Section Break",
            "label": "Progress"
        },
        {
            "default": "0",
            "fieldname": "total_rows",
            "fieldtype": "Int",
            "in_list_view": 1,
            "label": "Total Rows",
            "read_only": 1
        },
        {
            "default": "0",
            "fieldname": "processed_rows",
            "fieldtype": "Int",
            "label": "Processed",
            "read_only": 1
        },
        {
            "default": "0",
            "fieldname": "success_count",
            "fieldtype": "Int",
            "label": "Success",
            "read_only": 1
        },
        {
            "fieldname": "column_break_2",
            "fieldtype": "Column Break"
        },
        {
            "default": "0",
            "fieldname": "error_count",
            "fieldtype": "Int",
            "label": "Errors",
            "read_only": 1
        },
        {
            "default": "0",
            "fieldname": "warning_count",
            "fieldtype": "Int",
            "label": "Warnings",
            "read_only": 1
        },
        {
            "default": "0",
            "fieldname": "progress_percent",
            "fieldtype": "Percent",
            "label": "Progress %",
            "read_only": 1
        },
        {
            "fieldname": "section_results",
            "fieldtype": "Section Break",
            "label": "Results"
        },
        {
            "fieldname": "result_summary",
            "fieldtype": "HTML",
            "label": "Summary"
        },
        {
            "fieldname": "error_log",
            "fieldtype": "Code",
            "label": "Error Log",
            "options": "JSON",
            "read_only": 1
        },
        {
            "collapsible": 1,
            "fieldname": "section_settings",
            "fieldtype": "Section Break",
            "label": "Import Settings"
        },
        {
            "default": "0",
            "description": "Skip validation and import directly",
            "fieldname": "skip_validation",
            "fieldtype": "Check",
            "label": "Skip Validation"
        },
        {
            "default": "1",
            "description": "Update existing records if found",
            "fieldname": "update_existing",
            "fieldtype": "Check",
            "label": "Update Existing"
        },
        {
            "default": "0",
            "description": "Validate only, don't actually import",
            "fieldname": "dry_run",
            "fieldtype": "Check",
            "label": "Dry Run"
        }
    ],
    "index_web_pages_for_search": 1,
    "links": [],
    "modified": "2026-02-17 00:00:00.000000",
    "modified_by": "Administrator",
    "module": "DigiComply",
    "name": "Bulk Import Log",
    "naming_rule": "Expression",
    "owner": "Administrator",
    "permissions": [
        {
            "create": 1,
            "delete": 1,
            "email": 1,
            "export": 1,
            "print": 1,
            "read": 1,
            "report": 1,
            "role": "System Manager",
            "share": 1,
            "write": 1
        },
        {
            "create": 1,
            "email": 1,
            "export": 1,
            "print": 1,
            "read": 1,
            "report": 1,
            "role": "Accounts Manager",
            "share": 1,
            "write": 1
        }
    ],
    "sort_field": "modified",
    "sort_order": "DESC",
    "states": [],
    "track_changes": 1
}
```

**Step 3: Create bulk_import_log.py**

```python
# digicomply/digicomply/doctype/bulk_import_log/bulk_import_log.py
import frappe
from frappe.model.document import Document
from frappe import _
import json
import csv
import io


class BulkImportLog(Document):
    def validate(self):
        if self.file:
            self.file_name = self.file.split('/')[-1] if '/' in self.file else self.file

    def before_save(self):
        if self.is_new():
            self.started_at = frappe.utils.now()

    def start_import(self):
        """Start the bulk import process in background"""
        self.status = "Validating"
        self.save()

        frappe.enqueue(
            'digicomply.digicomply.doctype.bulk_import_log.bulk_import_log.process_import',
            queue='long',
            timeout=3600,
            job_name=f'bulk_import_{self.name}',
            import_log=self.name
        )

    def update_progress(self, processed, success, errors, warnings=0):
        """Update progress counters"""
        self.processed_rows = processed
        self.success_count = success
        self.error_count = errors
        self.warning_count = warnings

        if self.total_rows > 0:
            self.progress_percent = (processed / self.total_rows) * 100

        self.db_update()
        frappe.publish_realtime(
            'bulk_import_progress',
            {
                'import_log': self.name,
                'processed': processed,
                'total': self.total_rows,
                'success': success,
                'errors': errors,
                'percent': self.progress_percent
            },
            doctype=self.doctype,
            docname=self.name
        )

    def complete(self, status="Completed"):
        """Mark import as complete"""
        self.status = status
        self.completed_at = frappe.utils.now()
        self.save()

        frappe.publish_realtime(
            'bulk_import_complete',
            {'import_log': self.name, 'status': status},
            doctype=self.doctype,
            docname=self.name
        )


@frappe.whitelist()
def start_import(import_log):
    """API to start import"""
    doc = frappe.get_doc("Bulk Import Log", import_log)
    doc.start_import()
    return {"status": "started", "job": f"bulk_import_{import_log}"}


@frappe.whitelist()
def cancel_import(import_log):
    """API to cancel running import"""
    doc = frappe.get_doc("Bulk Import Log", import_log)
    doc.status = "Cancelled"
    doc.save()
    # Note: actual job cancellation is handled by Frappe's job system
    return {"status": "cancelled"}


def process_import(import_log):
    """Background job to process the import"""
    doc = frappe.get_doc("Bulk Import Log", import_log)

    try:
        doc.status = "Processing"
        doc.save()

        # Read file content
        file_doc = frappe.get_doc("File", {"file_url": doc.file})
        content = file_doc.get_content()

        # Parse CSV
        if isinstance(content, bytes):
            content = content.decode('utf-8')

        reader = csv.DictReader(io.StringIO(content))
        rows = list(reader)
        doc.total_rows = len(rows)
        doc.save()

        # Get import handler
        handler = get_import_handler(doc.import_type)

        errors = []
        success = 0

        for idx, row in enumerate(rows, 1):
            try:
                if doc.dry_run:
                    handler.validate_row(row, doc)
                else:
                    handler.import_row(row, doc)
                success += 1
            except Exception as e:
                errors.append({
                    "row": idx,
                    "data": row,
                    "error": str(e)
                })

            # Update progress every 100 rows
            if idx % 100 == 0:
                doc.update_progress(idx, success, len(errors))

        # Final update
        doc.error_log = json.dumps(errors, indent=2) if errors else None
        doc.update_progress(len(rows), success, len(errors))

        if errors:
            doc.complete("Completed with Errors")
        else:
            doc.complete("Completed")

    except Exception as e:
        doc.status = "Failed"
        doc.error_log = json.dumps([{"error": str(e)}])
        doc.save()
        frappe.log_error(f"Bulk Import Failed: {import_log}", str(e))


def get_import_handler(import_type):
    """Get the appropriate import handler for the type"""
    handlers = {
        "Customer": CustomerImportHandler(),
        "Supplier": SupplierImportHandler(),
        "Item": ItemImportHandler(),
        "TRN Registry": TRNImportHandler(),
    }
    return handlers.get(import_type, GenericImportHandler())


class GenericImportHandler:
    def validate_row(self, row, doc):
        pass

    def import_row(self, row, doc):
        pass


class CustomerImportHandler(GenericImportHandler):
    def validate_row(self, row, doc):
        if not row.get('customer_name'):
            raise ValueError("customer_name is required")

    def import_row(self, row, doc):
        self.validate_row(row, doc)

        existing = frappe.db.exists("Customer", {"customer_name": row['customer_name']})

        if existing and doc.update_existing:
            customer = frappe.get_doc("Customer", existing)
            customer.update(row)
            customer.save()
        elif not existing:
            customer = frappe.new_doc("Customer")
            customer.update(row)
            customer.insert()


class SupplierImportHandler(GenericImportHandler):
    def validate_row(self, row, doc):
        if not row.get('supplier_name'):
            raise ValueError("supplier_name is required")

    def import_row(self, row, doc):
        self.validate_row(row, doc)

        existing = frappe.db.exists("Supplier", {"supplier_name": row['supplier_name']})

        if existing and doc.update_existing:
            supplier = frappe.get_doc("Supplier", existing)
            supplier.update(row)
            supplier.save()
        elif not existing:
            supplier = frappe.new_doc("Supplier")
            supplier.update(row)
            supplier.insert()


class ItemImportHandler(GenericImportHandler):
    def validate_row(self, row, doc):
        if not row.get('item_code'):
            raise ValueError("item_code is required")

    def import_row(self, row, doc):
        self.validate_row(row, doc)

        existing = frappe.db.exists("Item", row['item_code'])

        if existing and doc.update_existing:
            item = frappe.get_doc("Item", existing)
            item.update(row)
            item.save()
        elif not existing:
            item = frappe.new_doc("Item")
            item.update(row)
            item.insert()


class TRNImportHandler(GenericImportHandler):
    def validate_row(self, row, doc):
        if not row.get('trn'):
            raise ValueError("trn is required")
        if not row.get('entity_name'):
            raise ValueError("entity_name is required")

    def import_row(self, row, doc):
        self.validate_row(row, doc)

        existing = frappe.db.exists("TRN Registry", row['trn'])

        if existing and doc.update_existing:
            trn = frappe.get_doc("TRN Registry", existing)
            trn.update(row)
            trn.save()
        elif not existing:
            trn = frappe.new_doc("TRN Registry")
            trn.update(row)
            trn.company = doc.company or row.get('company')
            trn.insert()
```

**Step 4: Create bulk_import_log.js**

```javascript
// digicomply/digicomply/doctype/bulk_import_log/bulk_import_log.js
frappe.ui.form.on('Bulk Import Log', {
    refresh: function(frm) {
        frm.$wrapper.addClass('dc-form-wrapper');

        // Add progress bar visualization
        frm.trigger('render_progress');

        // Add action buttons based on status
        if (frm.doc.status === 'Pending') {
            frm.add_custom_button(__('Start Import'), function() {
                frm.trigger('start_import');
            }).addClass('btn-primary');

            frm.add_custom_button(__('Validate Only'), function() {
                frm.set_value('dry_run', 1);
                frm.save().then(() => {
                    frm.trigger('start_import');
                });
            });
        }

        if (frm.doc.status === 'Processing' || frm.doc.status === 'Validating') {
            frm.add_custom_button(__('Cancel'), function() {
                frm.trigger('cancel_import');
            }).addClass('btn-danger');

            // Subscribe to realtime updates
            frm.trigger('subscribe_to_updates');
        }

        if (frm.doc.status === 'Completed with Errors' && frm.doc.error_log) {
            frm.add_custom_button(__('Download Error Report'), function() {
                frm.trigger('download_errors');
            });
        }
    },

    start_import: function(frm) {
        frappe.call({
            method: 'digicomply.digicomply.doctype.bulk_import_log.bulk_import_log.start_import',
            args: { import_log: frm.doc.name },
            callback: function(r) {
                frappe.show_alert({
                    message: __('Import started. You will be notified when complete.'),
                    indicator: 'blue'
                });
                frm.reload_doc();
            }
        });
    },

    cancel_import: function(frm) {
        frappe.confirm(
            __('Are you sure you want to cancel this import?'),
            function() {
                frappe.call({
                    method: 'digicomply.digicomply.doctype.bulk_import_log.bulk_import_log.cancel_import',
                    args: { import_log: frm.doc.name },
                    callback: function(r) {
                        frm.reload_doc();
                    }
                });
            }
        );
    },

    subscribe_to_updates: function(frm) {
        frappe.realtime.on('bulk_import_progress', function(data) {
            if (data.import_log === frm.doc.name) {
                frm.doc.processed_rows = data.processed;
                frm.doc.success_count = data.success;
                frm.doc.error_count = data.errors;
                frm.doc.progress_percent = data.percent;
                frm.trigger('render_progress');
            }
        });

        frappe.realtime.on('bulk_import_complete', function(data) {
            if (data.import_log === frm.doc.name) {
                frappe.show_alert({
                    message: __('Import completed: {0}', [data.status]),
                    indicator: data.status === 'Completed' ? 'green' : 'orange'
                });
                frm.reload_doc();
            }
        });
    },

    render_progress: function(frm) {
        if (!frm.doc.total_rows) return;

        const percent = frm.doc.progress_percent || 0;
        const html = `
            <div class="dc-progress-container">
                <div class="dc-progress-bar">
                    <div class="dc-progress-fill" style="width: ${percent}%"></div>
                </div>
                <div class="dc-progress-stats">
                    <span class="dc-stat dc-stat-success">
                        <i class="fa fa-check"></i> ${frm.doc.success_count || 0} Success
                    </span>
                    <span class="dc-stat dc-stat-error">
                        <i class="fa fa-times"></i> ${frm.doc.error_count || 0} Errors
                    </span>
                    <span class="dc-stat dc-stat-total">
                        ${frm.doc.processed_rows || 0} / ${frm.doc.total_rows} Processed
                    </span>
                </div>
            </div>
        `;

        frm.set_df_property('result_summary', 'options', html);
        frm.refresh_field('result_summary');
    },

    download_errors: function(frm) {
        if (!frm.doc.error_log) return;

        const errors = JSON.parse(frm.doc.error_log);
        const csv = ['Row,Error,Data'];

        errors.forEach(e => {
            csv.push(`${e.row},"${e.error}","${JSON.stringify(e.data).replace(/"/g, '""')}"`);
        });

        const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${frm.doc.name}_errors.csv`;
        a.click();
    }
});
```

**Step 5: Create __init__.py**

```bash
touch "/Users/rakeshanita/digicomply accounting ai/frappe-bench/apps/digicomply/digicomply/digicomply/doctype/bulk_import_log/__init__.py"
```

**Step 6: Run migrate**

```bash
cd "/Users/rakeshanita/digicomply accounting ai/frappe-bench"
bench --site digicomply.local migrate
```

**Step 7: Commit**

```bash
cd "/Users/rakeshanita/digicomply accounting ai/frappe-bench/apps/digicomply"
git add digicomply/digicomply/doctype/bulk_import_log/
git commit -m "feat(bulk): add Bulk Import Log with background processing

- CSV/Excel parsing
- Progress tracking with realtime updates
- Error logging and export
- Dry run validation mode
- Customer, Supplier, Item, TRN handlers"
```

---

### Task 4: Create Import Template DocType

**Files:**
- Create: `digicomply/digicomply/doctype/import_template/__init__.py`
- Create: `digicomply/digicomply/doctype/import_template/import_template.json`
- Create: `digicomply/digicomply/doctype/import_template/import_template.py`
- Create: `digicomply/digicomply/doctype/import_template/import_template.js`

**Step 1: Create DocType directory**

```bash
mkdir -p "/Users/rakeshanita/digicomply accounting ai/frappe-bench/apps/digicomply/digicomply/digicomply/doctype/import_template"
```

**Step 2: Create import_template.json**

```json
{
    "actions": [],
    "allow_rename": 1,
    "autoname": "field:template_name",
    "creation": "2026-02-17 00:00:00.000000",
    "doctype": "DocType",
    "engine": "InnoDB",
    "field_order": [
        "section_template",
        "template_name",
        "import_type",
        "column_break_1",
        "description",
        "is_default",
        "section_columns",
        "columns",
        "section_preview",
        "sample_file"
    ],
    "fields": [
        {
            "fieldname": "section_template",
            "fieldtype": "Section Break",
            "label": "Template Details"
        },
        {
            "fieldname": "template_name",
            "fieldtype": "Data",
            "in_list_view": 1,
            "label": "Template Name",
            "reqd": 1,
            "unique": 1
        },
        {
            "fieldname": "import_type",
            "fieldtype": "Select",
            "in_list_view": 1,
            "in_standard_filter": 1,
            "label": "Import Type",
            "options": "\nCustomer\nSupplier\nItem\nTRN Registry\nCompany\nInvoice\nASP Data",
            "reqd": 1
        },
        {
            "fieldname": "column_break_1",
            "fieldtype": "Column Break"
        },
        {
            "fieldname": "description",
            "fieldtype": "Small Text",
            "label": "Description"
        },
        {
            "default": "0",
            "fieldname": "is_default",
            "fieldtype": "Check",
            "label": "Is Default Template"
        },
        {
            "fieldname": "section_columns",
            "fieldtype": "Section Break",
            "label": "Column Mapping"
        },
        {
            "fieldname": "columns",
            "fieldtype": "Table",
            "label": "Columns",
            "options": "Import Template Column"
        },
        {
            "fieldname": "section_preview",
            "fieldtype": "Section Break",
            "label": "Sample File"
        },
        {
            "fieldname": "sample_file",
            "fieldtype": "Attach",
            "label": "Sample File"
        }
    ],
    "index_web_pages_for_search": 1,
    "links": [],
    "modified": "2026-02-17 00:00:00.000000",
    "modified_by": "Administrator",
    "module": "DigiComply",
    "name": "Import Template",
    "naming_rule": "By fieldname",
    "owner": "Administrator",
    "permissions": [
        {
            "create": 1,
            "delete": 1,
            "email": 1,
            "export": 1,
            "print": 1,
            "read": 1,
            "report": 1,
            "role": "System Manager",
            "share": 1,
            "write": 1
        }
    ],
    "sort_field": "modified",
    "sort_order": "DESC",
    "states": [],
    "track_changes": 1
}
```

**Step 3: Create Import Template Column child table**

```bash
mkdir -p "/Users/rakeshanita/digicomply accounting ai/frappe-bench/apps/digicomply/digicomply/digicomply/doctype/import_template_column"
```

Create `import_template_column.json`:

```json
{
    "actions": [],
    "allow_rename": 0,
    "creation": "2026-02-17 00:00:00.000000",
    "doctype": "DocType",
    "editable_grid": 1,
    "engine": "InnoDB",
    "field_order": [
        "column_name",
        "field_name",
        "field_type",
        "is_required",
        "default_value",
        "validation_regex"
    ],
    "fields": [
        {
            "fieldname": "column_name",
            "fieldtype": "Data",
            "in_list_view": 1,
            "label": "CSV Column Name",
            "reqd": 1
        },
        {
            "fieldname": "field_name",
            "fieldtype": "Data",
            "in_list_view": 1,
            "label": "DocType Field",
            "reqd": 1
        },
        {
            "default": "Data",
            "fieldname": "field_type",
            "fieldtype": "Select",
            "in_list_view": 1,
            "label": "Type",
            "options": "Data\nInt\nFloat\nCurrency\nDate\nDatetime\nCheck"
        },
        {
            "default": "0",
            "fieldname": "is_required",
            "fieldtype": "Check",
            "in_list_view": 1,
            "label": "Required"
        },
        {
            "fieldname": "default_value",
            "fieldtype": "Data",
            "label": "Default Value"
        },
        {
            "fieldname": "validation_regex",
            "fieldtype": "Data",
            "label": "Validation Pattern"
        }
    ],
    "index_web_pages_for_search": 0,
    "istable": 1,
    "links": [],
    "modified": "2026-02-17 00:00:00.000000",
    "modified_by": "Administrator",
    "module": "DigiComply",
    "name": "Import Template Column",
    "naming_rule": "Random",
    "owner": "Administrator",
    "permissions": [],
    "sort_field": "modified",
    "sort_order": "DESC",
    "states": [],
    "track_changes": 0
}
```

**Step 4: Create import_template.py**

```python
# digicomply/digicomply/doctype/import_template/import_template.py
import frappe
from frappe.model.document import Document
from frappe import _
import csv
import io


class ImportTemplate(Document):
    def validate(self):
        self.validate_unique_default()

    def validate_unique_default(self):
        """Only one default template per import type"""
        if self.is_default:
            existing = frappe.db.exists(
                "Import Template",
                {
                    "import_type": self.import_type,
                    "is_default": 1,
                    "name": ("!=", self.name)
                }
            )
            if existing:
                frappe.db.set_value("Import Template", existing, "is_default", 0)

    def generate_sample_csv(self):
        """Generate a sample CSV file from template"""
        output = io.StringIO()
        writer = csv.writer(output)

        # Header row
        headers = [col.column_name for col in self.columns]
        writer.writerow(headers)

        # Sample data row
        sample_row = []
        for col in self.columns:
            if col.field_type == "Int":
                sample_row.append("123")
            elif col.field_type == "Float" or col.field_type == "Currency":
                sample_row.append("1234.56")
            elif col.field_type == "Date":
                sample_row.append("2026-01-15")
            elif col.field_type == "Check":
                sample_row.append("1")
            else:
                sample_row.append(f"Sample {col.column_name}")

        writer.writerow(sample_row)

        return output.getvalue()


@frappe.whitelist()
def download_template(template_name):
    """API to download template as CSV"""
    doc = frappe.get_doc("Import Template", template_name)
    csv_content = doc.generate_sample_csv()

    frappe.response['filename'] = f'{template_name}_template.csv'
    frappe.response['filecontent'] = csv_content
    frappe.response['type'] = 'download'


@frappe.whitelist()
def get_default_template(import_type):
    """Get the default template for an import type"""
    template = frappe.db.get_value(
        "Import Template",
        {"import_type": import_type, "is_default": 1},
        "name"
    )

    if template:
        return frappe.get_doc("Import Template", template)

    return None


def create_default_templates():
    """Create default templates on install"""
    templates = [
        {
            "template_name": "Customer Import - Standard",
            "import_type": "Customer",
            "is_default": 1,
            "columns": [
                {"column_name": "customer_name", "field_name": "customer_name", "field_type": "Data", "is_required": 1},
                {"column_name": "customer_group", "field_name": "customer_group", "field_type": "Data"},
                {"column_name": "territory", "field_name": "territory", "field_type": "Data"},
                {"column_name": "tax_id", "field_name": "tax_id", "field_type": "Data"},
                {"column_name": "email_id", "field_name": "email_id", "field_type": "Data"},
                {"column_name": "mobile_no", "field_name": "mobile_no", "field_type": "Data"},
            ]
        },
        {
            "template_name": "Supplier Import - Standard",
            "import_type": "Supplier",
            "is_default": 1,
            "columns": [
                {"column_name": "supplier_name", "field_name": "supplier_name", "field_type": "Data", "is_required": 1},
                {"column_name": "supplier_group", "field_name": "supplier_group", "field_type": "Data"},
                {"column_name": "country", "field_name": "country", "field_type": "Data"},
                {"column_name": "tax_id", "field_name": "tax_id", "field_type": "Data"},
            ]
        },
        {
            "template_name": "TRN Import - Standard",
            "import_type": "TRN Registry",
            "is_default": 1,
            "columns": [
                {"column_name": "trn", "field_name": "trn", "field_type": "Data", "is_required": 1, "validation_regex": "^\\d{15}$"},
                {"column_name": "entity_name", "field_name": "entity_name", "field_type": "Data", "is_required": 1},
                {"column_name": "entity_type", "field_name": "entity_type", "field_type": "Data"},
                {"column_name": "fta_registration_date", "field_name": "fta_registration_date", "field_type": "Date"},
            ]
        }
    ]

    for template_data in templates:
        if not frappe.db.exists("Import Template", template_data["template_name"]):
            doc = frappe.new_doc("Import Template")
            doc.template_name = template_data["template_name"]
            doc.import_type = template_data["import_type"]
            doc.is_default = template_data["is_default"]

            for col in template_data["columns"]:
                doc.append("columns", col)

            doc.insert(ignore_permissions=True)
```

**Step 5: Create import_template.js**

```javascript
// digicomply/digicomply/doctype/import_template/import_template.js
frappe.ui.form.on('Import Template', {
    refresh: function(frm) {
        frm.$wrapper.addClass('dc-form-wrapper');

        if (!frm.is_new()) {
            frm.add_custom_button(__('Download Template'), function() {
                window.open(`/api/method/digicomply.digicomply.doctype.import_template.import_template.download_template?template_name=${frm.doc.name}`);
            }).addClass('btn-primary');

            frm.add_custom_button(__('Start Import'), function() {
                frappe.new_doc('Bulk Import Log', {
                    import_type: frm.doc.import_type
                });
            });
        }
    },

    import_type: function(frm) {
        // Auto-populate columns based on import type
        if (frm.doc.import_type && !frm.doc.columns?.length) {
            frm.trigger('populate_default_columns');
        }
    },

    populate_default_columns: function(frm) {
        const type_columns = {
            'Customer': [
                { column_name: 'customer_name', field_name: 'customer_name', field_type: 'Data', is_required: 1 },
                { column_name: 'customer_group', field_name: 'customer_group', field_type: 'Data' },
                { column_name: 'tax_id', field_name: 'tax_id', field_type: 'Data' },
            ],
            'Supplier': [
                { column_name: 'supplier_name', field_name: 'supplier_name', field_type: 'Data', is_required: 1 },
                { column_name: 'supplier_group', field_name: 'supplier_group', field_type: 'Data' },
                { column_name: 'tax_id', field_name: 'tax_id', field_type: 'Data' },
            ],
            'TRN Registry': [
                { column_name: 'trn', field_name: 'trn', field_type: 'Data', is_required: 1 },
                { column_name: 'entity_name', field_name: 'entity_name', field_type: 'Data', is_required: 1 },
                { column_name: 'entity_type', field_name: 'entity_type', field_type: 'Data' },
            ]
        };

        const columns = type_columns[frm.doc.import_type];
        if (columns) {
            frm.clear_table('columns');
            columns.forEach(col => {
                frm.add_child('columns', col);
            });
            frm.refresh_field('columns');
        }
    }
});
```

**Step 6: Create __init__.py files**

```bash
touch "/Users/rakeshanita/digicomply accounting ai/frappe-bench/apps/digicomply/digicomply/digicomply/doctype/import_template/__init__.py"
touch "/Users/rakeshanita/digicomply accounting ai/frappe-bench/apps/digicomply/digicomply/digicomply/doctype/import_template_column/__init__.py"
```

**Step 7: Run migrate**

```bash
cd "/Users/rakeshanita/digicomply accounting ai/frappe-bench"
bench --site digicomply.local migrate
```

**Step 8: Commit**

```bash
cd "/Users/rakeshanita/digicomply accounting ai/frappe-bench/apps/digicomply"
git add digicomply/digicomply/doctype/import_template/ digicomply/digicomply/doctype/import_template_column/
git commit -m "feat(template): add Import Template with column mapping

- Configurable column mappings
- Sample CSV generation
- Default templates per import type
- Validation patterns"
```

---

## Module 1.3: Enhanced Reconciliation Engine

### Task 5: Add Multi-Company Fields to Reconciliation Run

**Files:**
- Modify: `digicomply/digicomply/doctype/reconciliation_run/reconciliation_run.json`
- Modify: `digicomply/digicomply/doctype/reconciliation_run/reconciliation_run.py`

**Step 1: Add new fields to reconciliation_run.json**

Add these fields to the field_order array (after "asp_provider"):
- `company_group`
- `tolerance_amount`
- `use_fuzzy_matching`
- `batch_size`

Add to fields array:

```json
{
    "fieldname": "company_group",
    "fieldtype": "Link",
    "label": "Company Group",
    "options": "Company Group",
    "description": "Select to reconcile all companies in group"
},
{
    "fieldname": "tolerance_amount",
    "fieldtype": "Currency",
    "label": "Tolerance (AED)",
    "default": "0.5",
    "description": "Acceptable variance for matching"
},
{
    "default": "1",
    "fieldname": "use_fuzzy_matching",
    "fieldtype": "Check",
    "label": "Use Fuzzy Matching",
    "description": "Match similar invoice numbers"
},
{
    "fieldname": "batch_size",
    "fieldtype": "Int",
    "default": "1000",
    "label": "Batch Size",
    "description": "Process invoices in batches of this size"
}
```

**Step 2: Update reconciliation_run.py**

Add tolerance-based matching and fuzzy matching:

```python
# Add to reconciliation_run.py

def run_reconciliation(self):
    """Enhanced reconciliation with tolerance and fuzzy matching"""
    self.status = "In Progress"
    self.save()

    try:
        # Get companies to reconcile
        companies = self.get_companies_to_reconcile()

        erp_invoices = []
        asp_invoices = []

        for company in companies:
            erp_invoices.extend(self.fetch_erp_invoices(company))
            asp_invoices.extend(self.fetch_asp_invoices(company))

        # Clear existing items
        self.items = []

        # Build lookup maps
        erp_map = {inv['invoice_no']: inv for inv in erp_invoices}
        asp_map = {inv['invoice_no']: inv for inv in asp_invoices}

        # Track processed
        matched_erp = set()
        matched_asp = set()

        # Exact and tolerance matching
        for invoice_no, erp_inv in erp_map.items():
            asp_inv = asp_map.get(invoice_no)

            if asp_inv:
                match_status = self.compare_invoices(erp_inv, asp_inv)
                self.append('items', self.create_item(erp_inv, asp_inv, match_status))
                matched_erp.add(invoice_no)
                matched_asp.add(invoice_no)
            elif self.use_fuzzy_matching:
                # Try fuzzy match
                fuzzy_match = self.find_fuzzy_match(erp_inv, asp_map, matched_asp)
                if fuzzy_match:
                    match_status = self.compare_invoices(erp_inv, fuzzy_match)
                    self.append('items', self.create_item(erp_inv, fuzzy_match, match_status))
                    matched_erp.add(invoice_no)
                    matched_asp.add(fuzzy_match['invoice_no'])

        # Missing in ASP
        for invoice_no, erp_inv in erp_map.items():
            if invoice_no not in matched_erp:
                self.append('items', self.create_item(erp_inv, None, "Missing in ASP"))

        # Missing in ERP
        for invoice_no, asp_inv in asp_map.items():
            if invoice_no not in matched_asp:
                self.append('items', self.create_item(None, asp_inv, "Missing in ERP"))

        # Update counters
        self.update_counts()
        self.status = "Completed"
        self.save()

    except Exception as e:
        self.status = "Failed"
        self.save()
        frappe.log_error(f"Reconciliation failed: {self.name}", str(e))
        raise

def get_companies_to_reconcile(self):
    """Get list of companies based on selection"""
    if self.company_group:
        from digicomply.digicomply.doctype.company_group.company_group import get_group_companies
        return get_group_companies(self.company_group)
    return [self.company]

def compare_invoices(self, erp_inv, asp_inv):
    """Compare invoices with tolerance"""
    tolerance = self.tolerance_amount or 0.5

    total_diff = abs((erp_inv.get('grand_total') or 0) - (asp_inv.get('grand_total') or 0))
    vat_diff = abs((erp_inv.get('vat_amount') or 0) - (asp_inv.get('vat_amount') or 0))

    if total_diff <= tolerance and vat_diff <= tolerance:
        return "Matched"
    return "Mismatched"

def find_fuzzy_match(self, erp_inv, asp_map, already_matched):
    """Find fuzzy match for invoice number"""
    from difflib import SequenceMatcher

    erp_no = erp_inv.get('invoice_no', '')
    best_match = None
    best_ratio = 0.8  # Minimum similarity threshold

    for asp_no, asp_inv in asp_map.items():
        if asp_no in already_matched:
            continue

        ratio = SequenceMatcher(None, erp_no, asp_no).ratio()
        if ratio > best_ratio:
            best_ratio = ratio
            best_match = asp_inv

    return best_match

def create_item(self, erp_inv, asp_inv, status):
    """Create reconciliation item dict"""
    return {
        "invoice_no": erp_inv.get('invoice_no') if erp_inv else asp_inv.get('invoice_no'),
        "customer": erp_inv.get('customer') if erp_inv else asp_inv.get('customer'),
        "posting_date": erp_inv.get('posting_date') if erp_inv else asp_inv.get('posting_date'),
        "erp_grand_total": erp_inv.get('grand_total') if erp_inv else 0,
        "asp_grand_total": asp_inv.get('grand_total') if asp_inv else 0,
        "erp_vat_amount": erp_inv.get('vat_amount') if erp_inv else 0,
        "asp_vat_amount": asp_inv.get('vat_amount') if asp_inv else 0,
        "match_status": status
    }

def update_counts(self):
    """Update summary counts"""
    self.total_invoices = len(self.items)
    self.matched_count = len([i for i in self.items if i.match_status == "Matched"])
    self.mismatched_count = len([i for i in self.items if i.match_status == "Mismatched"])
    self.missing_in_asp = len([i for i in self.items if i.match_status == "Missing in ASP"])
    self.missing_in_erp = len([i for i in self.items if i.match_status == "Missing in ERP"])

    if self.total_invoices > 0:
        self.match_percentage = (self.matched_count / self.total_invoices) * 100
```

**Step 3: Run migrate**

```bash
cd "/Users/rakeshanita/digicomply accounting ai/frappe-bench"
bench --site digicomply.local migrate
```

**Step 4: Commit**

```bash
cd "/Users/rakeshanita/digicomply accounting ai/frappe-bench/apps/digicomply"
git add digicomply/digicomply/doctype/reconciliation_run/
git commit -m "feat(recon): enhance Reconciliation Run with multi-company and tolerance

- Company Group support for multi-TRN reconciliation
- Configurable tolerance amount (AED)
- Fuzzy invoice number matching
- Batch processing for large datasets"
```

---

### Task 6: Add Resolution Workflow to Reconciliation Item

**Files:**
- Modify: `digicomply/digicomply/doctype/reconciliation_item/reconciliation_item.json`

**Step 1: Add resolution fields**

Add to field_order and fields arrays:

```json
{
    "fieldname": "section_resolution",
    "fieldtype": "Section Break",
    "label": "Resolution"
},
{
    "fieldname": "resolution_status",
    "fieldtype": "Select",
    "label": "Resolution Status",
    "options": "\nPending Review\nUnder Investigation\nResolved - ERP Correct\nResolved - ASP Correct\nResolved - Adjustment Made\nWritten Off"
},
{
    "fieldname": "resolution_notes",
    "fieldtype": "Small Text",
    "label": "Resolution Notes"
},
{
    "fieldname": "column_break_res",
    "fieldtype": "Column Break"
},
{
    "fieldname": "resolved_by",
    "fieldtype": "Link",
    "label": "Resolved By",
    "options": "User",
    "read_only": 1
},
{
    "fieldname": "resolved_on",
    "fieldtype": "Datetime",
    "label": "Resolved On",
    "read_only": 1
}
```

**Step 2: Commit**

```bash
cd "/Users/rakeshanita/digicomply accounting ai/frappe-bench/apps/digicomply"
git add digicomply/digicomply/doctype/reconciliation_item/
git commit -m "feat(recon): add resolution workflow to Reconciliation Item

- Resolution status tracking
- Resolution notes
- Audit trail (resolved_by, resolved_on)"
```

---

### Task 7: Add Bulk Actions to Reconciliation Run JS

**Files:**
- Modify: `digicomply/digicomply/doctype/reconciliation_run/reconciliation_run.js`

**Step 1: Add bulk action buttons and handlers**

Add to reconciliation_run.js:

```javascript
// Add to refresh function
if (frm.doc.status === 'Completed' && frm.doc.items && frm.doc.items.length > 0) {
    // Bulk actions menu
    frm.add_custom_button(__('Mark All Matched as Resolved'), function() {
        frm.trigger('bulk_resolve_matched');
    }, __('Bulk Actions'));

    frm.add_custom_button(__('Export Mismatches'), function() {
        frm.trigger('export_mismatches');
    }, __('Bulk Actions'));

    frm.add_custom_button(__('Export All Items'), function() {
        frm.trigger('export_all');
    }, __('Bulk Actions'));

    frm.add_custom_button(__('Re-run Reconciliation'), function() {
        frappe.confirm(
            __('This will clear existing items and re-run. Continue?'),
            function() {
                frm.trigger('rerun_reconciliation');
            }
        );
    }, __('Bulk Actions'));
}

// Bulk resolve matched
bulk_resolve_matched: function(frm) {
    let matched = frm.doc.items.filter(i => i.match_status === 'Matched' && !i.resolution_status);

    if (matched.length === 0) {
        frappe.msgprint(__('No unresolved matched items found.'));
        return;
    }

    frappe.confirm(
        __('Mark {0} matched items as resolved?', [matched.length]),
        function() {
            matched.forEach(item => {
                frappe.model.set_value(item.doctype, item.name, 'resolution_status', 'Resolved - Matched');
            });
            frm.save().then(() => {
                frappe.show_alert({
                    message: __('{0} items marked as resolved', [matched.length]),
                    indicator: 'green'
                });
            });
        }
    );
},

// Export mismatches
export_mismatches: function(frm) {
    let mismatches = frm.doc.items.filter(i => i.match_status !== 'Matched');
    frm.trigger('download_items_csv', mismatches, 'mismatches');
},

// Export all
export_all: function(frm) {
    frm.trigger('download_items_csv', frm.doc.items, 'all_items');
},

// Helper to download CSV
download_items_csv: function(frm, items, filename) {
    if (!items || items.length === 0) {
        frappe.msgprint(__('No items to export.'));
        return;
    }

    const headers = ['Invoice No', 'Customer', 'Date', 'ERP Total', 'ASP Total', 'ERP VAT', 'ASP VAT', 'Status', 'Resolution'];
    const rows = items.map(i => [
        i.invoice_no,
        i.customer,
        i.posting_date,
        i.erp_grand_total,
        i.asp_grand_total,
        i.erp_vat_amount,
        i.asp_vat_amount,
        i.match_status,
        i.resolution_status || ''
    ]);

    let csv = [headers.join(',')];
    rows.forEach(row => {
        csv.push(row.map(v => `"${v || ''}"`).join(','));
    });

    const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${frm.doc.name}_${filename}.csv`;
    a.click();
},

// Re-run reconciliation
rerun_reconciliation: function(frm) {
    frappe.call({
        method: 'digicomply.digicomply.doctype.reconciliation_run.reconciliation_run.run_reconciliation',
        args: { docname: frm.doc.name },
        callback: function(r) {
            frm.reload_doc();
        }
    });
}
```

**Step 2: Commit**

```bash
cd "/Users/rakeshanita/digicomply accounting ai/frappe-bench/apps/digicomply"
git add digicomply/digicomply/doctype/reconciliation_run/
git commit -m "feat(recon): add bulk actions to Reconciliation Run

- Bulk resolve matched items
- Export mismatches to CSV
- Export all items to CSV
- Re-run reconciliation button"
```

---

## Module 1.4: User Roles

### Task 8: Create DigiComply User Roles

**Files:**
- Create: `digicomply/digicomply/doctype/digicomply_admin/__init__.py` (Role, not DocType)
- Modify: `digicomply/fixtures/roles.json` (or create via setup script)

**Step 1: Create roles setup script**

Create `digicomply/setup/roles.py`:

```python
# digicomply/setup/roles.py
import frappe


def create_digicomply_roles():
    """Create DigiComply user roles"""
    roles = [
        {
            "role_name": "DigiComply Admin",
            "desk_access": 1,
            "home_page": "/app/digicomply",
            "restrict_to_domain": "",
            "description": "Full access to all DigiComply features and settings"
        },
        {
            "role_name": "Compliance Manager",
            "desk_access": 1,
            "home_page": "/app/digicomply",
            "description": "Access to all companies, no system settings"
        },
        {
            "role_name": "Company Accountant",
            "desk_access": 1,
            "home_page": "/app/digicomply",
            "description": "Full access to assigned company only"
        },
        {
            "role_name": "Company Reviewer",
            "desk_access": 1,
            "home_page": "/app/digicomply",
            "description": "Read-only access to assigned company"
        }
    ]

    for role_data in roles:
        if not frappe.db.exists("Role", role_data["role_name"]):
            role = frappe.new_doc("Role")
            role.update(role_data)
            role.insert(ignore_permissions=True)
            print(f"Created role: {role_data['role_name']}")
        else:
            print(f"Role already exists: {role_data['role_name']}")

    frappe.db.commit()


def setup_role_permissions():
    """Setup permissions for DigiComply DocTypes"""
    # DigiComply Admin - Full access
    admin_doctypes = [
        "TRN Registry", "Company Group", "Bulk Import Log", "Import Template",
        "Reconciliation Run", "CSV Import", "Mismatch Report", "DigiComply Settings"
    ]

    for dt in admin_doctypes:
        add_permission(dt, "DigiComply Admin", {
            "read": 1, "write": 1, "create": 1, "delete": 1,
            "submit": 1, "cancel": 1, "amend": 1,
            "report": 1, "export": 1, "import": 1, "share": 1
        })

    # Compliance Manager - All except settings
    manager_doctypes = [
        "TRN Registry", "Company Group", "Bulk Import Log", "Import Template",
        "Reconciliation Run", "CSV Import", "Mismatch Report"
    ]

    for dt in manager_doctypes:
        add_permission(dt, "Compliance Manager", {
            "read": 1, "write": 1, "create": 1, "delete": 0,
            "submit": 1, "cancel": 0, "report": 1, "export": 1
        })

    # Company Accountant - Company-restricted
    accountant_doctypes = [
        "TRN Registry", "Bulk Import Log", "Reconciliation Run", "CSV Import", "Mismatch Report"
    ]

    for dt in accountant_doctypes:
        add_permission(dt, "Company Accountant", {
            "read": 1, "write": 1, "create": 1, "delete": 0,
            "submit": 1, "report": 1, "export": 1,
            "if_owner": 0  # Will use User Permission for company restriction
        })

    # Company Reviewer - Read only
    for dt in accountant_doctypes:
        add_permission(dt, "Company Reviewer", {
            "read": 1, "write": 0, "create": 0, "delete": 0,
            "report": 1, "export": 1
        })

    frappe.db.commit()


def add_permission(doctype, role, perms):
    """Add or update permission for a DocType-Role combination"""
    # Check if permission exists
    existing = frappe.db.exists("Custom DocPerm", {
        "parent": doctype,
        "role": role
    })

    if not existing:
        # Get the DocType meta
        meta = frappe.get_meta(doctype)

        # Add custom permission
        perm = frappe.new_doc("Custom DocPerm")
        perm.parent = doctype
        perm.parenttype = "DocType"
        perm.parentfield = "permissions"
        perm.role = role
        perm.permlevel = 0

        for key, value in perms.items():
            if hasattr(perm, key):
                setattr(perm, key, value)

        perm.insert(ignore_permissions=True)
```

**Step 2: Update install.py to call role setup**

Add to `digicomply/setup/install.py`:

```python
def after_install():
    from digicomply.setup.roles import create_digicomply_roles, setup_role_permissions
    from digicomply.digicomply.doctype.import_template.import_template import create_default_templates

    create_digicomply_roles()
    setup_role_permissions()
    create_default_templates()
```

**Step 3: Run the setup**

```bash
cd "/Users/rakeshanita/digicomply accounting ai/frappe-bench"
bench --site digicomply.local execute digicomply.setup.roles.create_digicomply_roles
bench --site digicomply.local execute digicomply.setup.roles.setup_role_permissions
```

**Step 4: Commit**

```bash
cd "/Users/rakeshanita/digicomply accounting ai/frappe-bench/apps/digicomply"
git add digicomply/setup/
git commit -m "feat(roles): add DigiComply user roles with permissions

- DigiComply Admin (full access)
- Compliance Manager (all companies, no settings)
- Company Accountant (single company, full access)
- Company Reviewer (single company, read-only)"
```

---

## Module 1.4: Pages

### Task 9: Create Bulk Import Center Page

**Files:**
- Create: `digicomply/digicomply/page/bulk_import_center/__init__.py`
- Create: `digicomply/digicomply/page/bulk_import_center/bulk_import_center.json`
- Create: `digicomply/digicomply/page/bulk_import_center/bulk_import_center.py`
- Create: `digicomply/digicomply/page/bulk_import_center/bulk_import_center.js`
- Create: `digicomply/digicomply/page/bulk_import_center/bulk_import_center.html`

**Step 1: Create page directory**

```bash
mkdir -p "/Users/rakeshanita/digicomply accounting ai/frappe-bench/apps/digicomply/digicomply/digicomply/page/bulk_import_center"
```

**Step 2: Create bulk_import_center.json**

```json
{
    "content": null,
    "creation": "2026-02-17 00:00:00.000000",
    "docstatus": 0,
    "doctype": "Page",
    "icon": "upload",
    "modified": "2026-02-17 00:00:00.000000",
    "modified_by": "Administrator",
    "module": "DigiComply",
    "name": "bulk-import-center",
    "owner": "Administrator",
    "page_name": "bulk-import-center",
    "roles": [
        {"role": "System Manager"},
        {"role": "DigiComply Admin"},
        {"role": "Compliance Manager"},
        {"role": "Company Accountant"}
    ],
    "script": null,
    "standard": "Yes",
    "style": null,
    "system_page": 0,
    "title": "Bulk Import Center"
}
```

**Step 3: Create bulk_import_center.js**

```javascript
// digicomply/digicomply/page/bulk_import_center/bulk_import_center.js
frappe.pages['bulk-import-center'].on_page_load = function(wrapper) {
    const page = frappe.ui.make_app_page({
        parent: wrapper,
        title: 'Bulk Import Center',
        single_column: true
    });

    page.main.addClass('dc-bulk-import-page');

    // Add import type cards
    const $content = $(`
        <div class="dc-import-center">
            <div class="dc-import-header">
                <h2>What would you like to import?</h2>
                <p>Select an import type to get started. Download templates, upload files, and track progress.</p>
            </div>

            <div class="dc-import-cards">
                <div class="dc-import-card" data-type="Customer">
                    <div class="dc-import-icon">
                        <i class="fa fa-users"></i>
                    </div>
                    <h3>Customers</h3>
                    <p>Import customer master data with TRN validation</p>
                    <div class="dc-import-actions">
                        <button class="btn btn-sm btn-secondary dc-download-template">
                            <i class="fa fa-download"></i> Template
                        </button>
                        <button class="btn btn-sm btn-primary dc-start-import">
                            <i class="fa fa-upload"></i> Import
                        </button>
                    </div>
                </div>

                <div class="dc-import-card" data-type="Supplier">
                    <div class="dc-import-icon">
                        <i class="fa fa-truck"></i>
                    </div>
                    <h3>Suppliers</h3>
                    <p>Import supplier data with tax information</p>
                    <div class="dc-import-actions">
                        <button class="btn btn-sm btn-secondary dc-download-template">
                            <i class="fa fa-download"></i> Template
                        </button>
                        <button class="btn btn-sm btn-primary dc-start-import">
                            <i class="fa fa-upload"></i> Import
                        </button>
                    </div>
                </div>

                <div class="dc-import-card" data-type="Item">
                    <div class="dc-import-icon">
                        <i class="fa fa-cube"></i>
                    </div>
                    <h3>Items</h3>
                    <p>Import items with tax categories</p>
                    <div class="dc-import-actions">
                        <button class="btn btn-sm btn-secondary dc-download-template">
                            <i class="fa fa-download"></i> Template
                        </button>
                        <button class="btn btn-sm btn-primary dc-start-import">
                            <i class="fa fa-upload"></i> Import
                        </button>
                    </div>
                </div>

                <div class="dc-import-card" data-type="TRN Registry">
                    <div class="dc-import-icon">
                        <i class="fa fa-id-card"></i>
                    </div>
                    <h3>TRN Registry</h3>
                    <p>Bulk import and validate TRNs</p>
                    <div class="dc-import-actions">
                        <button class="btn btn-sm btn-secondary dc-download-template">
                            <i class="fa fa-download"></i> Template
                        </button>
                        <button class="btn btn-sm btn-primary dc-start-import">
                            <i class="fa fa-upload"></i> Import
                        </button>
                    </div>
                </div>

                <div class="dc-import-card" data-type="ASP Data">
                    <div class="dc-import-icon">
                        <i class="fa fa-file-invoice"></i>
                    </div>
                    <h3>ASP Data</h3>
                    <p>Import invoice data from ASP providers</p>
                    <div class="dc-import-actions">
                        <button class="btn btn-sm btn-secondary dc-download-template">
                            <i class="fa fa-download"></i> Template
                        </button>
                        <button class="btn btn-sm btn-primary dc-start-import">
                            <i class="fa fa-upload"></i> Import
                        </button>
                    </div>
                </div>
            </div>

            <div class="dc-recent-imports">
                <h3>Recent Imports</h3>
                <div class="dc-import-list"></div>
            </div>
        </div>
    `);

    page.main.html($content);

    // Event handlers
    $content.find('.dc-download-template').on('click', function() {
        const type = $(this).closest('.dc-import-card').data('type');
        frappe.call({
            method: 'digicomply.digicomply.doctype.import_template.import_template.get_default_template',
            args: { import_type: type },
            callback: function(r) {
                if (r.message) {
                    window.open(`/api/method/digicomply.digicomply.doctype.import_template.import_template.download_template?template_name=${r.message.name}`);
                } else {
                    frappe.msgprint(__('No template found for {0}. Create one first.', [type]));
                }
            }
        });
    });

    $content.find('.dc-start-import').on('click', function() {
        const type = $(this).closest('.dc-import-card').data('type');
        frappe.new_doc('Bulk Import Log', {
            import_type: type
        });
    });

    // Load recent imports
    frappe.call({
        method: 'frappe.client.get_list',
        args: {
            doctype: 'Bulk Import Log',
            fields: ['name', 'import_type', 'status', 'started_at', 'total_rows', 'success_count', 'error_count'],
            order_by: 'creation desc',
            limit_page_length: 10
        },
        callback: function(r) {
            if (r.message && r.message.length > 0) {
                const $list = $content.find('.dc-import-list');
                r.message.forEach(imp => {
                    const statusClass = {
                        'Completed': 'success',
                        'Failed': 'danger',
                        'Processing': 'info',
                        'Pending': 'secondary'
                    }[imp.status] || 'secondary';

                    $list.append(`
                        <div class="dc-import-item" data-name="${imp.name}">
                            <div class="dc-import-info">
                                <span class="dc-import-name">${imp.name}</span>
                                <span class="dc-import-type">${imp.import_type}</span>
                            </div>
                            <div class="dc-import-stats">
                                <span class="badge badge-${statusClass}">${imp.status}</span>
                                <span>${imp.success_count || 0} / ${imp.total_rows || 0}</span>
                            </div>
                        </div>
                    `);
                });

                $list.find('.dc-import-item').on('click', function() {
                    frappe.set_route('Form', 'Bulk Import Log', $(this).data('name'));
                });
            } else {
                $content.find('.dc-import-list').html('<p class="text-muted">No recent imports</p>');
            }
        }
    });
};
```

**Step 4: Create __init__.py**

```bash
touch "/Users/rakeshanita/digicomply accounting ai/frappe-bench/apps/digicomply/digicomply/digicomply/page/bulk_import_center/__init__.py"
```

**Step 5: Add CSS for the page**

Add to digicomply.css:

```css
/* Bulk Import Center Page */
.dc-import-center {
    padding: 24px;
    max-width: 1200px;
    margin: 0 auto;
}

.dc-import-header {
    text-align: center;
    margin-bottom: 32px;
}

.dc-import-header h2 {
    color: var(--dc-primary);
    margin-bottom: 8px;
}

.dc-import-cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
    margin-bottom: 40px;
}

.dc-import-card {
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    transition: all 0.3s ease;
    border: 1px solid #e2e8f0;
}

.dc-import-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(164, 4, 228, 0.15);
    border-color: var(--dc-primary-light);
}

.dc-import-icon {
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, var(--dc-primary-100), var(--dc-primary-50));
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 16px;
}

.dc-import-icon i {
    font-size: 20px;
    color: var(--dc-primary);
}

.dc-import-card h3 {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 8px;
}

.dc-import-card p {
    color: #64748b;
    font-size: 14px;
    margin-bottom: 16px;
}

.dc-import-actions {
    display: flex;
    gap: 8px;
}

.dc-recent-imports h3 {
    margin-bottom: 16px;
    color: #1e293b;
}

.dc-import-list {
    background: white;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid #e2e8f0;
}

.dc-import-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid #f1f5f9;
    cursor: pointer;
    transition: background 0.2s;
}

.dc-import-item:hover {
    background: #f8fafc;
}

.dc-import-item:last-child {
    border-bottom: none;
}

.dc-import-name {
    font-weight: 500;
    color: var(--dc-primary);
}

.dc-import-type {
    color: #64748b;
    font-size: 13px;
    margin-left: 12px;
}

.dc-import-stats {
    display: flex;
    align-items: center;
    gap: 12px;
}
```

**Step 6: Commit**

```bash
cd "/Users/rakeshanita/digicomply accounting ai/frappe-bench/apps/digicomply"
git add digicomply/digicomply/page/bulk_import_center/ digicomply/public/css/
git commit -m "feat(page): add Bulk Import Center page

- Import type cards with icons
- Template download buttons
- Quick import launch
- Recent imports list with status"
```

---

### Task 10: Create Multi-Company Reconciliation Page

**Files:**
- Create: `digicomply/digicomply/page/multi_company_recon/__init__.py`
- Create: `digicomply/digicomply/page/multi_company_recon/multi_company_recon.json`
- Create: `digicomply/digicomply/page/multi_company_recon/multi_company_recon.js`

**Step 1: Create page directory**

```bash
mkdir -p "/Users/rakeshanita/digicomply accounting ai/frappe-bench/apps/digicomply/digicomply/digicomply/page/multi_company_recon"
```

**Step 2: Create multi_company_recon.json**

```json
{
    "content": null,
    "creation": "2026-02-17 00:00:00.000000",
    "docstatus": 0,
    "doctype": "Page",
    "icon": "organization",
    "modified": "2026-02-17 00:00:00.000000",
    "modified_by": "Administrator",
    "module": "DigiComply",
    "name": "multi-company-recon",
    "owner": "Administrator",
    "page_name": "multi-company-recon",
    "roles": [
        {"role": "System Manager"},
        {"role": "DigiComply Admin"},
        {"role": "Compliance Manager"}
    ],
    "script": null,
    "standard": "Yes",
    "style": null,
    "system_page": 0,
    "title": "Multi-Company Reconciliation"
}
```

**Step 3: Create multi_company_recon.js**

```javascript
// digicomply/digicomply/page/multi_company_recon/multi_company_recon.js
frappe.pages['multi-company-recon'].on_page_load = function(wrapper) {
    const page = frappe.ui.make_app_page({
        parent: wrapper,
        title: 'Multi-Company Reconciliation',
        single_column: true
    });

    // Add filters
    page.add_field({
        fieldname: 'company_group',
        label: 'Company Group',
        fieldtype: 'Link',
        options: 'Company Group',
        change: function() {
            page.trigger('refresh_data');
        }
    });

    page.add_field({
        fieldname: 'from_date',
        label: 'From Date',
        fieldtype: 'Date',
        default: frappe.datetime.add_months(frappe.datetime.get_today(), -1)
    });

    page.add_field({
        fieldname: 'to_date',
        label: 'To Date',
        fieldtype: 'Date',
        default: frappe.datetime.get_today()
    });

    // Add primary action
    page.set_primary_action('Run Reconciliation', function() {
        const group = page.fields_dict.company_group.get_value();
        const from_date = page.fields_dict.from_date.get_value();
        const to_date = page.fields_dict.to_date.get_value();

        if (!group) {
            frappe.throw(__('Please select a Company Group'));
            return;
        }

        frappe.new_doc('Reconciliation Run', {
            company_group: group,
            from_date: from_date,
            to_date: to_date
        });
    }, 'octicon octicon-sync');

    // Content area
    const $content = $(`
        <div class="dc-multi-recon">
            <div class="dc-recon-overview">
                <div class="dc-overview-cards"></div>
            </div>

            <div class="dc-recon-company-grid">
                <h3>Company Status</h3>
                <div class="dc-company-cards"></div>
            </div>

            <div class="dc-recon-history">
                <h3>Recent Reconciliation Runs</h3>
                <div class="dc-history-list"></div>
            </div>
        </div>
    `);

    page.main.html($content);

    // Refresh data function
    page.trigger = function(event) {
        if (event === 'refresh_data') {
            const group = page.fields_dict.company_group.get_value();
            if (group) {
                load_group_data(page, group);
            }
        }
    };

    // Initial load
    load_recent_runs(page);
};

function load_group_data(page, group_name) {
    frappe.call({
        method: 'digicomply.digicomply.doctype.company_group.company_group.get_group_companies',
        args: { group_name: group_name },
        callback: function(r) {
            if (r.message) {
                render_company_cards(page, r.message);
                load_company_stats(page, r.message);
            }
        }
    });
}

function render_company_cards(page, companies) {
    const $cards = page.main.find('.dc-company-cards');
    $cards.empty();

    companies.forEach(company => {
        $cards.append(`
            <div class="dc-company-card" data-company="${company}">
                <div class="dc-company-header">
                    <span class="dc-company-name">${company}</span>
                    <span class="dc-company-status loading">
                        <i class="fa fa-spinner fa-spin"></i>
                    </span>
                </div>
                <div class="dc-company-stats">
                    <span class="dc-stat">Loading...</span>
                </div>
            </div>
        `);
    });
}

function load_company_stats(page, companies) {
    companies.forEach(company => {
        frappe.call({
            method: 'frappe.client.get_list',
            args: {
                doctype: 'Reconciliation Run',
                filters: { company: company },
                fields: ['name', 'match_percentage', 'status', 'posting_date'],
                order_by: 'posting_date desc',
                limit_page_length: 1
            },
            callback: function(r) {
                const $card = page.main.find(`.dc-company-card[data-company="${company}"]`);

                if (r.message && r.message.length > 0) {
                    const run = r.message[0];
                    const pct = Math.round(run.match_percentage || 0);
                    const statusClass = pct >= 95 ? 'success' : pct >= 80 ? 'warning' : 'danger';

                    $card.find('.dc-company-status').html(`
                        <span class="badge badge-${statusClass}">${pct}%</span>
                    `);
                    $card.find('.dc-company-stats').html(`
                        <span>Last run: ${run.posting_date}</span>
                    `);
                } else {
                    $card.find('.dc-company-status').html(`
                        <span class="badge badge-secondary">No data</span>
                    `);
                    $card.find('.dc-company-stats').html(`
                        <span>No reconciliation runs</span>
                    `);
                }
            }
        });
    });
}

function load_recent_runs(page) {
    frappe.call({
        method: 'frappe.client.get_list',
        args: {
            doctype: 'Reconciliation Run',
            fields: ['name', 'company', 'company_group', 'match_percentage', 'status', 'posting_date', 'total_invoices'],
            filters: { company_group: ['is', 'set'] },
            order_by: 'creation desc',
            limit_page_length: 20
        },
        callback: function(r) {
            const $list = page.main.find('.dc-history-list');
            $list.empty();

            if (r.message && r.message.length > 0) {
                r.message.forEach(run => {
                    const pct = Math.round(run.match_percentage || 0);
                    const statusClass = run.status === 'Completed' ?
                        (pct >= 95 ? 'success' : pct >= 80 ? 'warning' : 'danger') :
                        'secondary';

                    $list.append(`
                        <div class="dc-history-item" data-name="${run.name}">
                            <div class="dc-history-info">
                                <span class="dc-history-name">${run.name}</span>
                                <span class="dc-history-group">${run.company_group || run.company}</span>
                            </div>
                            <div class="dc-history-stats">
                                <span class="badge badge-${statusClass}">${pct}% Match</span>
                                <span>${run.total_invoices || 0} invoices</span>
                                <span>${run.posting_date}</span>
                            </div>
                        </div>
                    `);
                });

                $list.find('.dc-history-item').on('click', function() {
                    frappe.set_route('Form', 'Reconciliation Run', $(this).data('name'));
                });
            } else {
                $list.html('<p class="text-muted">No multi-company reconciliation runs yet</p>');
            }
        }
    });
}
```

**Step 4: Create __init__.py and add CSS**

```bash
touch "/Users/rakeshanita/digicomply accounting ai/frappe-bench/apps/digicomply/digicomply/digicomply/page/multi_company_recon/__init__.py"
```

Add to digicomply.css:

```css
/* Multi-Company Reconciliation Page */
.dc-multi-recon {
    padding: 24px;
    max-width: 1400px;
    margin: 0 auto;
}

.dc-company-cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 16px;
    margin-bottom: 32px;
}

.dc-company-card {
    background: white;
    border-radius: 12px;
    padding: 20px;
    border: 1px solid #e2e8f0;
    cursor: pointer;
    transition: all 0.2s;
}

.dc-company-card:hover {
    border-color: var(--dc-primary);
    box-shadow: 0 4px 12px rgba(164, 4, 228, 0.1);
}

.dc-company-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}

.dc-company-name {
    font-weight: 600;
    font-size: 15px;
}

.dc-history-list {
    background: white;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
}

.dc-history-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid #f1f5f9;
    cursor: pointer;
}

.dc-history-item:hover {
    background: #f8fafc;
}

.dc-history-item:last-child {
    border-bottom: none;
}

.dc-history-name {
    font-weight: 500;
    color: var(--dc-primary);
}

.dc-history-group {
    color: #64748b;
    font-size: 13px;
    margin-left: 12px;
}

.dc-history-stats {
    display: flex;
    align-items: center;
    gap: 16px;
    color: #64748b;
    font-size: 13px;
}
```

**Step 5: Commit**

```bash
cd "/Users/rakeshanita/digicomply accounting ai/frappe-bench/apps/digicomply"
git add digicomply/digicomply/page/multi_company_recon/ digicomply/public/css/
git commit -m "feat(page): add Multi-Company Reconciliation page

- Company group selection
- Company status cards with match percentages
- Recent runs history
- Quick run launch"
```

---

### Task 11: Update Workspace with New Links

**Files:**
- Modify: `digicomply/digicomply/workspace/digicomply/digicomply.json`

**Step 1: Add new links to workspace**

Add these links to the workspace JSON under the appropriate sections:

```json
{
    "label": "Bulk Import Center",
    "link_to": "bulk-import-center",
    "link_type": "Page",
    "type": "Link"
},
{
    "label": "Multi-Company Reconciliation",
    "link_to": "multi-company-recon",
    "link_type": "Page",
    "type": "Link"
},
{
    "label": "TRN Registry",
    "link_to": "TRN Registry",
    "link_type": "DocType",
    "type": "Link"
},
{
    "label": "Company Groups",
    "link_to": "Company Group",
    "link_type": "DocType",
    "type": "Link"
},
{
    "label": "Import Templates",
    "link_to": "Import Template",
    "link_type": "DocType",
    "type": "Link"
},
{
    "label": "Bulk Import Logs",
    "link_to": "Bulk Import Log",
    "link_type": "DocType",
    "type": "Link"
}
```

**Step 2: Commit**

```bash
cd "/Users/rakeshanita/digicomply accounting ai/frappe-bench/apps/digicomply"
git add digicomply/digicomply/workspace/
git commit -m "feat(workspace): add Phase 1 links to workspace

- Bulk Import Center page
- Multi-Company Reconciliation page
- TRN Registry, Company Groups
- Import Templates, Import Logs"
```

---

### Task 12: Final Testing and Cleanup

**Step 1: Run full migrate**

```bash
cd "/Users/rakeshanita/digicomply accounting ai/frappe-bench"
bench --site digicomply.local migrate
```

**Step 2: Clear cache and rebuild**

```bash
bench --site digicomply.local clear-cache
bench build --app digicomply
```

**Step 3: Test all features manually**

- [ ] TRN Registry: Create, validate, bulk validate
- [ ] Company Group: Create group, add companies
- [ ] Bulk Import: Upload CSV, track progress
- [ ] Import Template: Download template
- [ ] Reconciliation: Run with tolerance, multi-company
- [ ] Pages: Bulk Import Center, Multi-Company Recon
- [ ] Roles: Test permissions for each role

**Step 4: Create final commit for Phase 1**

```bash
cd "/Users/rakeshanita/digicomply accounting ai/frappe-bench/apps/digicomply"
git add .
git commit -m "feat: complete Phase 1 - Bulk Reconciliation + Multi-TRN

Phase 1 delivers:
- TRN Registry with UAE validation
- Company Groups with hierarchy
- Bulk Import infrastructure
- Import Templates
- Enhanced Reconciliation (tolerance, fuzzy matching)
- Multi-company reconciliation
- User roles (Admin, Manager, Accountant, Reviewer)
- Bulk Import Center page
- Multi-Company Recon page

All features follow DigiComply UI/UX standards:
- Purple theme (#a404e4)
- Poppins font
- dc- CSS prefix
- No Frappe/ERPNext branding"
```

---

## Summary

**Phase 1 delivers:**

| Module | Components |
|--------|-----------|
| **1.1 TRN Management** | TRN Registry (with validation), Company Group |
| **1.2 Bulk Operations** | Bulk Import Log, Import Template, Import handlers |
| **1.3 Reconciliation** | Enhanced matching (tolerance, fuzzy), multi-company, resolution workflow, bulk actions |
| **1.4 Roles & Pages** | 4 roles, Bulk Import Center page, Multi-Company Recon page |

**Total new files:** ~25 files across 8 DocTypes and 2 Pages

**Time estimate:** 4-6 weeks with TDD approach

---

*Plan created: 2026-02-17*
*Author: DigiComply Team*
