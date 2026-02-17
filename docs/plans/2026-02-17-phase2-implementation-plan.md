# Phase 2: TRN Validation + VAT Reports - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build TRN validation system with FTA API integration, VAT return preparation (VAT 201), tax category management, compliance calendar, and compliance reports.

**Architecture:** Extends Phase 1 foundation with new DocTypes for TRN validation logging, VAT returns, tax categories, and compliance calendar. All UI follows DigiComply purple theme (#a404e4) with dc- CSS prefix.

**Tech Stack:** Frappe Framework (Python), MariaDB, Redis background jobs, Custom JS/CSS

---

## Pre-Implementation Setup

### Task 0: Create Phase 2 Development Branch

**Files:**
- None (git operations only)

**Step 1: Ensure on latest main**

```bash
cd "/Users/rakeshanita/digicomply accounting ai/frappe-bench/apps/digicomply"
git checkout main && git pull origin main
```

**Step 2: Create feature branch**

```bash
git checkout -b feature/phase2-vat-compliance
```

**Step 3: Verify branch**

Run: `git branch --show-current`
Expected: `feature/phase2-vat-compliance`

---

## Module 2.1: TRN Validation System

### Task 1: Create TRN Validation Log DocType

**Files:**
- Create: `digicomply/digicomply/doctype/trn_validation_log/__init__.py`
- Create: `digicomply/digicomply/doctype/trn_validation_log/trn_validation_log.json`
- Create: `digicomply/digicomply/doctype/trn_validation_log/trn_validation_log.py`
- Create: `digicomply/digicomply/doctype/trn_validation_log/trn_validation_log.js`

**Step 1: Create DocType directory**

```bash
mkdir -p "/Users/rakeshanita/digicomply accounting ai/frappe-bench/apps/digicomply/digicomply/digicomply/doctype/trn_validation_log"
```

**Step 2: Create __init__.py**

```python
# digicomply/digicomply/doctype/trn_validation_log/__init__.py
# TRN Validation Log - Track all TRN validation attempts
```

**Step 3: Create trn_validation_log.json**

```json
{
    "actions": [],
    "allow_rename": 0,
    "autoname": "TRNVAL-.YYYY.-.#####",
    "creation": "2026-02-17 00:00:00.000000",
    "doctype": "DocType",
    "engine": "InnoDB",
    "field_order": [
        "section_basic",
        "trn",
        "trn_registry",
        "company",
        "column_break_basic",
        "validation_type",
        "validation_source",
        "section_result",
        "validation_status",
        "validation_date",
        "column_break_result",
        "response_code",
        "response_message",
        "section_fta",
        "fta_entity_name",
        "fta_registration_date",
        "column_break_fta",
        "fta_expiry_date",
        "fta_status",
        "section_raw",
        "raw_response"
    ],
    "fields": [
        {
            "fieldname": "section_basic",
            "fieldtype": "Section Break",
            "label": "TRN Information"
        },
        {
            "fieldname": "trn",
            "fieldtype": "Data",
            "in_list_view": 1,
            "in_standard_filter": 1,
            "label": "TRN",
            "reqd": 1
        },
        {
            "fieldname": "trn_registry",
            "fieldtype": "Link",
            "label": "TRN Registry",
            "options": "TRN Registry"
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
            "fieldname": "column_break_basic",
            "fieldtype": "Column Break"
        },
        {
            "fieldname": "validation_type",
            "fieldtype": "Select",
            "in_list_view": 1,
            "in_standard_filter": 1,
            "label": "Validation Type",
            "options": "Format Check\nFTA API\nBulk Validation\nManual Override",
            "reqd": 1
        },
        {
            "fieldname": "validation_source",
            "fieldtype": "Select",
            "label": "Source",
            "options": "TRN Registry\nCustomer\nSupplier\nBulk Import\nManual"
        },
        {
            "fieldname": "section_result",
            "fieldtype": "Section Break",
            "label": "Validation Result"
        },
        {
            "fieldname": "validation_status",
            "fieldtype": "Select",
            "in_list_view": 1,
            "in_standard_filter": 1,
            "label": "Status",
            "options": "Valid\nInvalid\nExpired\nNot Found\nAPI Error\nPending",
            "reqd": 1
        },
        {
            "fieldname": "validation_date",
            "fieldtype": "Datetime",
            "in_list_view": 1,
            "label": "Validation Date",
            "reqd": 1
        },
        {
            "fieldname": "column_break_result",
            "fieldtype": "Column Break"
        },
        {
            "fieldname": "response_code",
            "fieldtype": "Data",
            "label": "Response Code"
        },
        {
            "fieldname": "response_message",
            "fieldtype": "Small Text",
            "label": "Response Message"
        },
        {
            "fieldname": "section_fta",
            "fieldtype": "Section Break",
            "label": "FTA Response Data",
            "collapsible": 1
        },
        {
            "fieldname": "fta_entity_name",
            "fieldtype": "Data",
            "label": "FTA Entity Name"
        },
        {
            "fieldname": "fta_registration_date",
            "fieldtype": "Date",
            "label": "FTA Registration Date"
        },
        {
            "fieldname": "column_break_fta",
            "fieldtype": "Column Break"
        },
        {
            "fieldname": "fta_expiry_date",
            "fieldtype": "Date",
            "label": "FTA Expiry Date"
        },
        {
            "fieldname": "fta_status",
            "fieldtype": "Data",
            "label": "FTA Status"
        },
        {
            "fieldname": "section_raw",
            "fieldtype": "Section Break",
            "label": "Raw Response",
            "collapsible": 1
        },
        {
            "fieldname": "raw_response",
            "fieldtype": "Code",
            "label": "Raw API Response",
            "options": "JSON"
        }
    ],
    "index_web_pages_for_search": 1,
    "links": [],
    "modified": "2026-02-17 00:00:00.000000",
    "modified_by": "Administrator",
    "module": "DigiComply",
    "name": "TRN Validation Log",
    "naming_rule": "Expression (old style)",
    "owner": "Administrator",
    "permissions": [
        {
            "read": 1,
            "role": "System Manager"
        },
        {
            "read": 1,
            "role": "Accounts Manager"
        },
        {
            "read": 1,
            "role": "Accounts User"
        }
    ],
    "search_fields": "trn,company,validation_status",
    "sort_field": "validation_date",
    "sort_order": "DESC",
    "track_changes": 0
}
```

**Step 4: Create trn_validation_log.py**

```python
# Copyright (c) 2026, DigiComply and contributors
# License: MIT

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import now_datetime


class TRNValidationLog(Document):
    """
    TRN Validation Log - Immutable record of all TRN validation attempts
    """

    def before_insert(self):
        """Set validation date on insert"""
        if not self.validation_date:
            self.validation_date = now_datetime()

    def on_update(self):
        """Update TRN Registry if linked"""
        if self.trn_registry and self.validation_status in ("Valid", "Invalid", "Expired"):
            self.update_trn_registry()

    def update_trn_registry(self):
        """Push validation result back to TRN Registry"""
        try:
            trn_doc = frappe.get_doc("TRN Registry", self.trn_registry)
            trn_doc.validation_status = self.validation_status
            trn_doc.last_validated = self.validation_date

            if self.fta_registration_date:
                trn_doc.fta_registration_date = self.fta_registration_date
            if self.fta_expiry_date:
                trn_doc.fta_expiry_date = self.fta_expiry_date

            trn_doc.save(ignore_permissions=True)
        except Exception as e:
            frappe.log_error(f"Failed to update TRN Registry: {e}")


@frappe.whitelist()
def get_validation_history(trn):
    """Get validation history for a TRN"""
    return frappe.get_all(
        "TRN Validation Log",
        filters={"trn": trn},
        fields=["name", "validation_type", "validation_status", "validation_date", "response_message"],
        order_by="validation_date desc",
        limit=20
    )
```

**Step 5: Create trn_validation_log.js**

```javascript
// Copyright (c) 2026, DigiComply and contributors
// License: MIT

frappe.ui.form.on('TRN Validation Log', {
    refresh: function(frm) {
        frm.$wrapper.find('.form-page').addClass('dc-form-wrapper');
        frm.trigger('add_custom_styles');
        frm.trigger('show_status_card');
    },

    add_custom_styles: function(frm) {
        if ($('#trn-validation-log-styles').length) return;

        $('head').append(`
            <style id="trn-validation-log-styles">
                .dc-validation-card {
                    background: linear-gradient(135deg, #a404e4 0%, #8501b9 100%);
                    border-radius: 12px;
                    padding: 20px;
                    margin-bottom: 20px;
                    color: white;
                    box-shadow: 0 4px 14px rgba(164, 4, 228, 0.25);
                }
                .dc-validation-card.status-valid {
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                }
                .dc-validation-card.status-invalid {
                    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                }
                .dc-validation-card.status-expired {
                    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                }
                .dc-validation-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 12px;
                }
                .dc-validation-trn {
                    font-size: 1.25rem;
                    font-weight: 700;
                    font-family: 'Monaco', monospace;
                    letter-spacing: 1px;
                }
                .dc-validation-badge {
                    background: rgba(255,255,255,0.2);
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: uppercase;
                }
            </style>
        `);
    },

    show_status_card: function(frm) {
        frm.$wrapper.find('.dc-validation-card').remove();
        if (frm.is_new()) return;

        let status_class = '';
        if (frm.doc.validation_status === 'Valid') status_class = 'status-valid';
        else if (frm.doc.validation_status === 'Invalid') status_class = 'status-invalid';
        else if (frm.doc.validation_status === 'Expired') status_class = 'status-expired';

        let $card = $(`
            <div class="dc-validation-card ${status_class}">
                <div class="dc-validation-header">
                    <span class="dc-validation-trn">${frm.doc.trn}</span>
                    <span class="dc-validation-badge">${frm.doc.validation_status}</span>
                </div>
                <div style="font-size: 0.875rem; opacity: 0.9;">
                    ${frm.doc.validation_type} - ${frappe.datetime.str_to_user(frm.doc.validation_date)}
                </div>
            </div>
        `);

        frm.$wrapper.find('.form-page').first().prepend($card);
    }
});
```

**Step 6: Commit**

```bash
git add digicomply/digicomply/doctype/trn_validation_log/
git commit -m "feat(trn): add TRN Validation Log DocType

- Track all validation attempts with timestamps
- Support FTA API response storage
- Auto-update TRN Registry on validation"
```

---

### Task 2: Create TRN Blacklist DocType

**Files:**
- Create: `digicomply/digicomply/doctype/trn_blacklist/__init__.py`
- Create: `digicomply/digicomply/doctype/trn_blacklist/trn_blacklist.json`
- Create: `digicomply/digicomply/doctype/trn_blacklist/trn_blacklist.py`
- Create: `digicomply/digicomply/doctype/trn_blacklist/trn_blacklist.js`

**Step 1: Create DocType directory**

```bash
mkdir -p "/Users/rakeshanita/digicomply accounting ai/frappe-bench/apps/digicomply/digicomply/digicomply/doctype/trn_blacklist"
```

**Step 2: Create __init__.py**

```python
# digicomply/digicomply/doctype/trn_blacklist/__init__.py
# TRN Blacklist - Known fraudulent/invalid TRNs
```

**Step 3: Create trn_blacklist.json**

```json
{
    "actions": [],
    "allow_rename": 0,
    "autoname": "field:trn",
    "creation": "2026-02-17 00:00:00.000000",
    "doctype": "DocType",
    "engine": "InnoDB",
    "field_order": [
        "trn",
        "reason",
        "column_break_1",
        "reported_date",
        "reported_by",
        "section_details",
        "entity_name",
        "notes",
        "section_status",
        "is_active",
        "verified"
    ],
    "fields": [
        {
            "fieldname": "trn",
            "fieldtype": "Data",
            "in_list_view": 1,
            "in_standard_filter": 1,
            "label": "TRN",
            "reqd": 1,
            "unique": 1
        },
        {
            "fieldname": "reason",
            "fieldtype": "Select",
            "in_list_view": 1,
            "in_standard_filter": 1,
            "label": "Reason",
            "options": "Fraudulent\nCancelled by FTA\nDuplicate\nInvalid Format\nExpired - Not Renewed\nReported by User",
            "reqd": 1
        },
        {
            "fieldname": "column_break_1",
            "fieldtype": "Column Break"
        },
        {
            "fieldname": "reported_date",
            "fieldtype": "Date",
            "label": "Reported Date",
            "default": "Today"
        },
        {
            "fieldname": "reported_by",
            "fieldtype": "Link",
            "label": "Reported By",
            "options": "User"
        },
        {
            "fieldname": "section_details",
            "fieldtype": "Section Break",
            "label": "Details"
        },
        {
            "fieldname": "entity_name",
            "fieldtype": "Data",
            "label": "Entity Name (if known)"
        },
        {
            "fieldname": "notes",
            "fieldtype": "Text",
            "label": "Notes"
        },
        {
            "fieldname": "section_status",
            "fieldtype": "Section Break"
        },
        {
            "default": "1",
            "fieldname": "is_active",
            "fieldtype": "Check",
            "label": "Is Active"
        },
        {
            "default": "0",
            "fieldname": "verified",
            "fieldtype": "Check",
            "label": "Verified by Admin"
        }
    ],
    "index_web_pages_for_search": 1,
    "modified": "2026-02-17 00:00:00.000000",
    "modified_by": "Administrator",
    "module": "DigiComply",
    "name": "TRN Blacklist",
    "naming_rule": "By fieldname",
    "owner": "Administrator",
    "permissions": [
        {
            "create": 1,
            "delete": 1,
            "read": 1,
            "write": 1,
            "role": "System Manager"
        },
        {
            "read": 1,
            "role": "Accounts Manager"
        }
    ],
    "search_fields": "trn,reason,entity_name",
    "sort_field": "reported_date",
    "sort_order": "DESC",
    "track_changes": 1
}
```

**Step 4: Create trn_blacklist.py**

```python
# Copyright (c) 2026, DigiComply and contributors
# License: MIT

import frappe
from frappe import _
from frappe.model.document import Document


class TRNBlacklist(Document):
    """TRN Blacklist - Known invalid/fraudulent TRNs"""

    def validate(self):
        self.validate_trn_format()

    def validate_trn_format(self):
        """Basic TRN format check"""
        trn = self.trn.replace(" ", "").replace("-", "")
        self.trn = trn

        if not trn.isdigit() or len(trn) != 15:
            frappe.throw(_("TRN must be exactly 15 digits"))


@frappe.whitelist()
def is_blacklisted(trn):
    """Check if a TRN is blacklisted"""
    trn = trn.replace(" ", "").replace("-", "")
    return frappe.db.exists("TRN Blacklist", {"trn": trn, "is_active": 1})


@frappe.whitelist()
def check_trns_bulk(trns):
    """Check multiple TRNs against blacklist"""
    import json
    if isinstance(trns, str):
        trns = json.loads(trns)

    blacklisted = []
    for trn in trns:
        clean_trn = trn.replace(" ", "").replace("-", "")
        if frappe.db.exists("TRN Blacklist", {"trn": clean_trn, "is_active": 1}):
            blacklisted.append(trn)

    return {"blacklisted": blacklisted, "count": len(blacklisted)}
```

**Step 5: Create trn_blacklist.js**

```javascript
// Copyright (c) 2026, DigiComply and contributors
// License: MIT

frappe.ui.form.on('TRN Blacklist', {
    refresh: function(frm) {
        frm.$wrapper.find('.form-page').addClass('dc-form-wrapper');
        frm.trigger('add_custom_styles');

        if (!frm.is_new()) {
            frm.trigger('show_warning_card');
        }
    },

    add_custom_styles: function(frm) {
        if ($('#trn-blacklist-styles').length) return;

        $('head').append(`
            <style id="trn-blacklist-styles">
                .dc-blacklist-warning {
                    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                    border-radius: 12px;
                    padding: 20px;
                    margin-bottom: 20px;
                    color: white;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }
                .dc-blacklist-icon {
                    width: 48px;
                    height: 48px;
                    background: rgba(255,255,255,0.2);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .dc-blacklist-info h4 {
                    margin: 0 0 4px 0;
                    font-size: 1.125rem;
                }
                .dc-blacklist-info p {
                    margin: 0;
                    opacity: 0.9;
                    font-size: 0.875rem;
                }
            </style>
        `);
    },

    show_warning_card: function(frm) {
        frm.$wrapper.find('.dc-blacklist-warning').remove();

        let $card = $(`
            <div class="dc-blacklist-warning">
                <div class="dc-blacklist-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                        <line x1="12" y1="9" x2="12" y2="13"/>
                        <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                </div>
                <div class="dc-blacklist-info">
                    <h4>Blacklisted TRN: ${frm.doc.trn}</h4>
                    <p>Reason: ${frm.doc.reason}</p>
                </div>
            </div>
        `);

        frm.$wrapper.find('.form-page').first().prepend($card);
    }
});
```

**Step 6: Commit**

```bash
git add digicomply/digicomply/doctype/trn_blacklist/
git commit -m "feat(trn): add TRN Blacklist DocType

- Store known fraudulent/invalid TRNs
- Bulk check API for validation
- Visual warning card in UI"
```

---

### Task 3: Enhance TRN Registry with FTA API Integration

**Files:**
- Modify: `digicomply/digicomply/doctype/trn_registry/trn_registry.py`
- Create: `digicomply/digicomply/api/fta_api.py`

**Step 1: Create FTA API module**

```bash
mkdir -p "/Users/rakeshanita/digicomply accounting ai/frappe-bench/apps/digicomply/digicomply/digicomply/api"
touch "/Users/rakeshanita/digicomply accounting ai/frappe-bench/apps/digicomply/digicomply/digicomply/api/__init__.py"
```

**Step 2: Create fta_api.py**

```python
# Copyright (c) 2026, DigiComply and contributors
# License: MIT

"""
FTA API Integration Module

Handles communication with UAE Federal Tax Authority API for TRN validation.
Note: Actual FTA API credentials and endpoints need to be configured in DigiComply Settings.
"""

import frappe
from frappe import _
from frappe.utils import now_datetime
import requests
import json


class FTAAPIError(Exception):
    """Custom exception for FTA API errors"""
    pass


def get_fta_settings():
    """Get FTA API settings from DigiComply Settings"""
    settings = frappe.get_single("DigiComply Settings")

    return {
        "api_url": settings.get("fta_api_url") or "",
        "api_key": settings.get_password("fta_api_key") or "",
        "enabled": settings.get("enable_fta_validation") or False,
        "timeout": settings.get("fta_api_timeout") or 30
    }


@frappe.whitelist()
def validate_trn_with_fta(trn, company=None, trn_registry=None):
    """
    Validate a TRN against FTA API

    Args:
        trn: The TRN to validate
        company: Optional company for logging
        trn_registry: Optional TRN Registry document name

    Returns:
        dict with validation result
    """
    settings = get_fta_settings()

    # Clean TRN
    clean_trn = trn.replace(" ", "").replace("-", "")

    # Check blacklist first
    if frappe.db.exists("TRN Blacklist", {"trn": clean_trn, "is_active": 1}):
        result = {
            "trn": clean_trn,
            "valid": False,
            "status": "Invalid",
            "message": "TRN is blacklisted",
            "source": "Blacklist"
        }
        log_validation(clean_trn, result, company, trn_registry, "Blacklist Check")
        return result

    # If FTA API not enabled, do format validation only
    if not settings["enabled"] or not settings["api_url"]:
        result = validate_trn_format(clean_trn)
        result["source"] = "Format Check"
        log_validation(clean_trn, result, company, trn_registry, "Format Check")
        return result

    # Call FTA API
    try:
        result = call_fta_api(clean_trn, settings)
        result["source"] = "FTA API"
        log_validation(clean_trn, result, company, trn_registry, "FTA API")
        return result
    except FTAAPIError as e:
        result = {
            "trn": clean_trn,
            "valid": False,
            "status": "API Error",
            "message": str(e),
            "source": "FTA API"
        }
        log_validation(clean_trn, result, company, trn_registry, "FTA API")
        return result


def validate_trn_format(trn):
    """Validate TRN format without FTA API"""
    result = {
        "trn": trn,
        "valid": False,
        "status": "Invalid",
        "message": ""
    }

    # Check digits only
    if not trn.isdigit():
        result["message"] = "TRN must contain only digits"
        return result

    # Check length
    if len(trn) != 15:
        result["message"] = f"TRN must be 15 digits, got {len(trn)}"
        return result

    # Check prefix
    if not trn.startswith("100"):
        result["message"] = "UAE TRN must start with '100'"
        return result

    # Luhn checksum
    def digits_of(n):
        return [int(d) for d in str(n)]

    digits = digits_of(trn)
    odd_digits = digits[-1::-2]
    even_digits = digits[-2::-2]

    checksum = sum(odd_digits)
    for d in even_digits:
        checksum += sum(digits_of(d * 2))

    if checksum % 10 != 0:
        result["message"] = "TRN failed checksum validation"
        return result

    result["valid"] = True
    result["status"] = "Valid"
    result["message"] = "Format validation passed"
    return result


def call_fta_api(trn, settings):
    """Make actual FTA API call"""
    try:
        headers = {
            "Authorization": f"Bearer {settings['api_key']}",
            "Content-Type": "application/json"
        }

        response = requests.post(
            f"{settings['api_url']}/validate",
            json={"trn": trn},
            headers=headers,
            timeout=settings["timeout"]
        )

        if response.status_code == 200:
            data = response.json()
            return {
                "trn": trn,
                "valid": data.get("valid", False),
                "status": "Valid" if data.get("valid") else "Invalid",
                "message": data.get("message", ""),
                "entity_name": data.get("entity_name"),
                "registration_date": data.get("registration_date"),
                "expiry_date": data.get("expiry_date"),
                "fta_status": data.get("status"),
                "raw_response": data
            }
        else:
            raise FTAAPIError(f"API returned status {response.status_code}")

    except requests.Timeout:
        raise FTAAPIError("FTA API request timed out")
    except requests.RequestException as e:
        raise FTAAPIError(f"FTA API request failed: {str(e)}")


def log_validation(trn, result, company=None, trn_registry=None, validation_type="FTA API"):
    """Create TRN Validation Log entry"""
    try:
        log = frappe.new_doc("TRN Validation Log")
        log.trn = trn
        log.company = company
        log.trn_registry = trn_registry
        log.validation_type = validation_type
        log.validation_source = "TRN Registry" if trn_registry else "Manual"
        log.validation_status = result.get("status", "Unknown")
        log.validation_date = now_datetime()
        log.response_message = result.get("message", "")

        if result.get("entity_name"):
            log.fta_entity_name = result["entity_name"]
        if result.get("registration_date"):
            log.fta_registration_date = result["registration_date"]
        if result.get("expiry_date"):
            log.fta_expiry_date = result["expiry_date"]
        if result.get("fta_status"):
            log.fta_status = result["fta_status"]
        if result.get("raw_response"):
            log.raw_response = json.dumps(result["raw_response"], indent=2)

        log.insert(ignore_permissions=True)
    except Exception as e:
        frappe.log_error(f"Failed to create TRN Validation Log: {e}")


@frappe.whitelist()
def bulk_validate_trns(trns, company=None):
    """
    Validate multiple TRNs

    Args:
        trns: JSON string or list of TRNs
        company: Optional company for logging

    Returns:
        dict with results for each TRN
    """
    if isinstance(trns, str):
        trns = json.loads(trns)

    results = {
        "valid": [],
        "invalid": [],
        "errors": [],
        "total": len(trns)
    }

    for trn in trns:
        try:
            result = validate_trn_with_fta(trn, company)
            if result.get("valid"):
                results["valid"].append({"trn": trn, "result": result})
            else:
                results["invalid"].append({"trn": trn, "result": result})
        except Exception as e:
            results["errors"].append({"trn": trn, "error": str(e)})

    results["valid_count"] = len(results["valid"])
    results["invalid_count"] = len(results["invalid"])
    results["error_count"] = len(results["errors"])

    return results
```

**Step 3: Update TRN Registry JS to use FTA API**

Add to `trn_registry.js` (modify existing file):

```javascript
// Add this button handler to refresh function (replace existing FTA button):
frm.add_custom_button(__('Validate with FTA'), function() {
    frappe.call({
        method: 'digicomply.digicomply.api.fta_api.validate_trn_with_fta',
        args: {
            trn: frm.doc.trn,
            company: frm.doc.company,
            trn_registry: frm.doc.name
        },
        freeze: true,
        freeze_message: __('Validating with FTA...'),
        callback: function(r) {
            if (r.message) {
                let result = r.message;
                let indicator = result.valid ? 'green' : 'red';
                let title = result.valid ? __('TRN Valid') : __('TRN Invalid');

                frappe.msgprint({
                    title: title,
                    indicator: indicator,
                    message: `
                        <div style="padding: 10px;">
                            <p><strong>Status:</strong> ${result.status}</p>
                            <p><strong>Source:</strong> ${result.source}</p>
                            <p><strong>Message:</strong> ${result.message}</p>
                            ${result.entity_name ? `<p><strong>Entity:</strong> ${result.entity_name}</p>` : ''}
                        </div>
                    `
                });

                frm.reload_doc();
            }
        }
    });
}, __('Actions'));
```

**Step 4: Commit**

```bash
git add digicomply/digicomply/api/
git add digicomply/digicomply/doctype/trn_registry/trn_registry.js
git commit -m "feat(trn): add FTA API integration for TRN validation

- Create fta_api.py module for FTA communication
- Support bulk TRN validation
- Auto-log all validation attempts
- Check blacklist before FTA call"
```

---

### Task 4: Create TRN Health Center Page

**Files:**
- Create: `digicomply/digicomply/page/trn_health_center/__init__.py`
- Create: `digicomply/digicomply/page/trn_health_center/trn_health_center.json`
- Create: `digicomply/digicomply/page/trn_health_center/trn_health_center.html`
- Create: `digicomply/digicomply/page/trn_health_center/trn_health_center.js`

**Step 1: Create page directory**

```bash
mkdir -p "/Users/rakeshanita/digicomply accounting ai/frappe-bench/apps/digicomply/digicomply/digicomply/page/trn_health_center"
```

**Step 2: Create trn_health_center.json**

```json
{
    "content": null,
    "creation": "2026-02-17 00:00:00.000000",
    "doctype": "Page",
    "modified": "2026-02-17 00:00:00.000000",
    "modified_by": "Administrator",
    "module": "DigiComply",
    "name": "trn-health-center",
    "owner": "Administrator",
    "page_name": "trn-health-center",
    "roles": [
        {"role": "System Manager"},
        {"role": "Accounts Manager"},
        {"role": "Accounts User"}
    ],
    "script": null,
    "standard": "Yes",
    "system_page": 0,
    "title": "TRN Health Center"
}
```

**Step 3: Create trn_health_center.html**

```html
<div class="dc-trn-health-center"></div>
```

**Step 4: Create trn_health_center.js** (first part)

```javascript
// Copyright (c) 2026, DigiComply and contributors
// License: MIT

frappe.pages['trn-health-center'].on_page_load = function(wrapper) {
    var page = frappe.ui.make_app_page({
        parent: wrapper,
        title: __('TRN Health Center'),
        single_column: true
    });

    page.main.addClass('dc-trn-health-center');

    new TRNHealthCenter(page);
};

class TRNHealthCenter {
    constructor(page) {
        this.page = page;
        this.company = null;
        this.init();
    }

    init() {
        this.add_styles();
        this.setup_filters();
        this.render_layout();
        this.load_data();
    }

    add_styles() {
        if ($('#trn-health-center-styles').length) return;

        $('head').append(`
            <style id="trn-health-center-styles">
                .dc-trn-health-center {
                    font-family: 'Poppins', sans-serif;
                    padding: 20px;
                }
                .dc-health-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 24px;
                }
                .dc-health-title {
                    font-size: 1.5rem;
                    font-weight: 600;
                    color: #1e293b;
                }
                .dc-health-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 20px;
                    margin-bottom: 24px;
                }
                .dc-health-card {
                    background: white;
                    border-radius: 12px;
                    padding: 20px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }
                .dc-health-card.valid {
                    border-left: 4px solid #10b981;
                }
                .dc-health-card.invalid {
                    border-left: 4px solid #ef4444;
                }
                .dc-health-card.expired {
                    border-left: 4px solid #f59e0b;
                }
                .dc-health-card.pending {
                    border-left: 4px solid #a404e4;
                }
                .dc-health-card-value {
                    font-size: 2rem;
                    font-weight: 700;
                    margin-bottom: 4px;
                }
                .dc-health-card-value.valid { color: #10b981; }
                .dc-health-card-value.invalid { color: #ef4444; }
                .dc-health-card-value.expired { color: #f59e0b; }
                .dc-health-card-value.pending { color: #a404e4; }
                .dc-health-card-label {
                    font-size: 0.875rem;
                    color: #64748b;
                }
                .dc-trn-table {
                    background: white;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }
                .dc-trn-table-header {
                    background: linear-gradient(135deg, #a404e4 0%, #8501b9 100%);
                    color: white;
                    padding: 16px 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .dc-trn-table-title {
                    font-size: 1rem;
                    font-weight: 600;
                }
                .dc-trn-table table {
                    width: 100%;
                    border-collapse: collapse;
                }
                .dc-trn-table th {
                    text-align: left;
                    padding: 12px 16px;
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    color: #64748b;
                    border-bottom: 1px solid #e2e8f0;
                    font-weight: 600;
                }
                .dc-trn-table td {
                    padding: 12px 16px;
                    border-bottom: 1px solid #f1f5f9;
                    font-size: 0.875rem;
                }
                .dc-trn-table tr:hover {
                    background: #f8fafc;
                }
                .dc-status-badge {
                    display: inline-block;
                    padding: 4px 10px;
                    border-radius: 12px;
                    font-size: 0.75rem;
                    font-weight: 600;
                }
                .dc-status-badge.valid {
                    background: #dcfce7;
                    color: #166534;
                }
                .dc-status-badge.invalid {
                    background: #fee2e2;
                    color: #991b1b;
                }
                .dc-status-badge.expired {
                    background: #fef3c7;
                    color: #92400e;
                }
                .dc-status-badge.pending {
                    background: #f3e8ff;
                    color: #a404e4;
                }
                .dc-action-btn {
                    background: linear-gradient(135deg, #a404e4 0%, #8501b9 100%);
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 8px;
                    font-size: 0.875rem;
                    font-weight: 500;
                    cursor: pointer;
                }
                .dc-action-btn:hover {
                    opacity: 0.9;
                }
                @media (max-width: 768px) {
                    .dc-health-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }
            </style>
        `);
    }

    setup_filters() {
        this.page.add_field({
            fieldname: 'company',
            label: __('Company'),
            fieldtype: 'Link',
            options: 'Company',
            change: () => {
                this.company = this.page.fields_dict.company.get_value();
                this.load_data();
            }
        });

        this.page.set_primary_action(__('Bulk Validate'), () => {
            this.bulk_validate();
        }, 'octicon octicon-check');

        this.page.set_secondary_action(__('Refresh'), () => {
            this.load_data();
        }, 'octicon octicon-sync');
    }

    render_layout() {
        this.page.main.html(`
            <div class="dc-health-grid" id="health-cards"></div>
            <div class="dc-trn-table" id="trn-table">
                <div class="dc-trn-table-header">
                    <span class="dc-trn-table-title">All TRNs</span>
                </div>
                <div class="dc-table-content"></div>
            </div>
        `);
    }

    load_data() {
        frappe.call({
            method: 'digicomply.digicomply.page.trn_health_center.trn_health_center.get_trn_health_data',
            args: { company: this.company },
            callback: (r) => {
                if (r.message) {
                    this.render_cards(r.message.summary);
                    this.render_table(r.message.trns);
                }
            }
        });
    }

    render_cards(summary) {
        $('#health-cards').html(`
            <div class="dc-health-card valid">
                <div class="dc-health-card-value valid">${summary.valid || 0}</div>
                <div class="dc-health-card-label">Valid TRNs</div>
            </div>
            <div class="dc-health-card invalid">
                <div class="dc-health-card-value invalid">${summary.invalid || 0}</div>
                <div class="dc-health-card-label">Invalid TRNs</div>
            </div>
            <div class="dc-health-card expired">
                <div class="dc-health-card-value expired">${summary.expired || 0}</div>
                <div class="dc-health-card-label">Expired TRNs</div>
            </div>
            <div class="dc-health-card pending">
                <div class="dc-health-card-value pending">${summary.not_validated || 0}</div>
                <div class="dc-health-card-label">Not Validated</div>
            </div>
        `);
    }

    render_table(trns) {
        if (!trns || !trns.length) {
            $('#trn-table .dc-table-content').html('<p style="padding: 20px; color: #64748b;">No TRNs found</p>');
            return;
        }

        let rows = trns.map(t => `
            <tr>
                <td style="font-family: Monaco, monospace;">${t.trn}</td>
                <td>${t.entity_name || '-'}</td>
                <td>${t.company || '-'}</td>
                <td><span class="dc-status-badge ${t.validation_status.toLowerCase().replace(' ', '-')}">${t.validation_status}</span></td>
                <td>${t.last_validated ? frappe.datetime.str_to_user(t.last_validated) : 'Never'}</td>
                <td>
                    <button class="dc-action-btn" onclick="cur_page.validate_trn('${t.name}')">Validate</button>
                </td>
            </tr>
        `).join('');

        $('#trn-table .dc-table-content').html(`
            <table>
                <thead>
                    <tr>
                        <th>TRN</th>
                        <th>Entity</th>
                        <th>Company</th>
                        <th>Status</th>
                        <th>Last Validated</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        `);
    }

    validate_trn(trn_name) {
        frappe.call({
            method: 'digicomply.digicomply.api.fta_api.validate_trn_with_fta',
            args: { trn_registry: trn_name },
            freeze: true,
            freeze_message: __('Validating...'),
            callback: (r) => {
                if (r.message) {
                    frappe.show_alert({
                        message: `TRN ${r.message.valid ? 'Valid' : 'Invalid'}: ${r.message.message}`,
                        indicator: r.message.valid ? 'green' : 'red'
                    });
                    this.load_data();
                }
            }
        });
    }

    bulk_validate() {
        frappe.confirm(
            __('Validate all TRNs? This may take a while for large datasets.'),
            () => {
                frappe.call({
                    method: 'digicomply.digicomply.page.trn_health_center.trn_health_center.bulk_validate_all',
                    args: { company: this.company },
                    freeze: true,
                    freeze_message: __('Validating all TRNs...'),
                    callback: (r) => {
                        if (r.message) {
                            frappe.msgprint({
                                title: __('Bulk Validation Complete'),
                                message: `Valid: ${r.message.valid_count}, Invalid: ${r.message.invalid_count}, Errors: ${r.message.error_count}`,
                                indicator: 'green'
                            });
                            this.load_data();
                        }
                    }
                });
            }
        );
    }
}

// Make accessible globally for button clicks
frappe.pages['trn-health-center'].on_page_show = function(wrapper) {
    window.cur_page = wrapper.trn_health_center;
};
```

**Step 5: Create Python backend for page**

Create `trn_health_center.py`:

```python
# Copyright (c) 2026, DigiComply and contributors
# License: MIT

import frappe
from frappe import _


@frappe.whitelist()
def get_trn_health_data(company=None):
    """Get TRN health summary and list"""
    filters = {}
    if company:
        filters["company"] = company

    # Get summary counts
    summary = {
        "valid": frappe.db.count("TRN Registry", {"validation_status": "Valid", **filters}),
        "invalid": frappe.db.count("TRN Registry", {"validation_status": "Invalid", **filters}),
        "expired": frappe.db.count("TRN Registry", {"validation_status": "Expired", **filters}),
        "not_validated": frappe.db.count("TRN Registry", {"validation_status": "Not Validated", **filters}),
    }

    # Get TRN list
    trns = frappe.get_all(
        "TRN Registry",
        filters=filters,
        fields=["name", "trn", "entity_name", "company", "validation_status", "last_validated", "is_primary"],
        order_by="validation_status asc, last_validated desc"
    )

    return {"summary": summary, "trns": trns}


@frappe.whitelist()
def bulk_validate_all(company=None):
    """Validate all TRNs"""
    from digicomply.digicomply.api.fta_api import bulk_validate_trns

    filters = {"is_active": 1}
    if company:
        filters["company"] = company

    trns = frappe.get_all("TRN Registry", filters=filters, pluck="trn")

    return bulk_validate_trns(trns, company)
```

**Step 6: Commit**

```bash
git add digicomply/digicomply/page/trn_health_center/
git commit -m "feat(trn): add TRN Health Center page

- Dashboard with validation status summary cards
- TRN list with inline validation buttons
- Bulk validate all TRNs feature
- Company filter support"
```

---

## Module 2.2: VAT Return Preparation

### Task 5: Create VAT Return DocType

**Files:**
- Create: `digicomply/digicomply/doctype/vat_return/__init__.py`
- Create: `digicomply/digicomply/doctype/vat_return/vat_return.json`
- Create: `digicomply/digicomply/doctype/vat_return/vat_return.py`
- Create: `digicomply/digicomply/doctype/vat_return/vat_return.js`

[Content continues in next tasks - this is a large DocType]

---

### Task 6: Create VAT Return Line DocType

[Child table for VAT Return]

---

### Task 7: Create VAT Adjustment DocType

[For manual VAT adjustments]

---

## Module 2.3: Tax Category Management

### Task 8: Create Tax Category Rule DocType

[Auto-assignment rules for tax categories]

---

## Module 2.4: Compliance Calendar

### Task 9: Create Compliance Calendar DocType

[Filing deadlines tracking]

---

### Task 10: Create Filing Status DocType

[Track submission status]

---

### Task 11: Create Compliance Calendar Page

[Visual calendar view]

---

## Module 2.5: Compliance Reports

### Task 12: Create TRN Health Report

[Script report for TRN status]

---

### Task 13: Create VAT Liability Report

[Output - Input = Payable/Refundable]

---

### Task 14: Update DigiComply Settings for Phase 2

[Add FTA API settings, VAT settings]

---

### Task 15: Update Workspace with Phase 2 Links

[Add new shortcuts to workspace]

---

### Task 16: Run Migrations and Final Testing

[Migrate, test all new DocTypes]

---

### Task 17: Final Commit and Push

```bash
git add .
git commit -m "feat: complete Phase 2 - TRN Validation + VAT Reports

Phase 2 includes:
- TRN Validation System (FTA API, Blacklist, Validation Log)
- TRN Health Center page
- VAT Return preparation (VAT 201)
- Tax Category Management
- Compliance Calendar
- Compliance Reports

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"

git push -u origin feature/phase2-vat-compliance
```

---

*Plan created: 2026-02-17*
*Total Tasks: 17*
*Estimated Modules: 5*
