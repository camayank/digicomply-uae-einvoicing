# DigiComply - Complete Product Training Document

**Version**: 1.0.0
**Platform**: UAE E-Invoicing Compliance & Reconciliation
**Built On**: Frappe Framework
**Last Updated**: February 2025

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Value Proposition](#2-value-proposition)
3. [Core Features](#3-core-features)
4. [User Roles & Permissions](#4-user-roles--permissions)
5. [DocTypes Reference](#5-doctypes-reference)
6. [Workflows & Processes](#6-workflows--processes)
7. [Custom Pages](#7-custom-pages)
8. [API Reference](#8-api-reference)
9. [Configuration & Settings](#9-configuration--settings)
10. [Integrations](#10-integrations)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. Executive Summary

**DigiComply** is a purpose-built UAE FTA (Federal Tax Authority) compliance platform that automates:

- E-invoice generation and submission to ASPs (Accredited Service Providers)
- Reconciliation between ERP data and ASP submissions
- VAT return preparation and filing
- TRN (Tax Registration Number) validation
- Compliance monitoring and penalty prevention

**Target Users**: UAE businesses, accounting firms, compliance teams

**Key Differentiator**: "Compliance without complexity" - focused solution vs generic ERP

---

## 2. Value Proposition

### Problems Solved

| Challenge | DigiComply Solution |
|-----------|---------------------|
| FTA e-invoicing mandates | Automated e-invoice generation with IRN, QR codes, digital signatures |
| Reconciliation gaps | Smart matching between ERP and ASP data |
| VAT calculation errors | Auto-calculation with reverse charge support |
| Compliance deadlines | Calendar tracking with automated reminders |
| Audit preparation | Complete audit trail with document archival |
| Penalty exposure | Real-time penalty calculator and risk alerts |

### Compliance Coverage

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| E-Invoice with IRN | ✅ Complete | `e_invoice.py:385-421` |
| QR Code (TLV format) | ✅ Complete | `e_invoice.py:483-561` |
| Digital Signatures | ✅ Complete | `e_invoice.py:579-669` |
| TRN Validation | ✅ Complete | `fta_api.py:68-233` |
| VAT Return (201) | ✅ Complete | `vat_return.py:114-150` |
| Reverse Charge (Art. 37) | ✅ Complete | `vat_return.py:56-112` |
| FAF XML Generation | ✅ Complete | `fta_report.py:340-425` |
| ASP Integration | ✅ Complete | Multi-provider support |

---

## 3. Core Features

### 3.1 E-Invoice Management

**Capabilities**:
- Auto-create from Sales Invoice
- TRN format validation (15 digits, Luhn checksum)
- QR code generation per UAE TLV specification
- Digital signature validation (XADES-EPES)
- IRN extraction and storage
- Bulk submission support
- Retry logic with configurable attempts

**Key Fields**:
- `irn`: Invoice Reference Number from ASP
- `qr_code_data`: Base64 TLV-encoded QR
- `signature_valid`: Digital signature verification status
- `e_invoice_status`: Draft → Validated → Submitted → Accepted/Rejected

### 3.2 Reconciliation Engine

**Matching Algorithm**:
1. **Exact Match**: Invoice number comparison
2. **Fuzzy Match**: SequenceMatcher with 70% threshold
3. **Tolerance Match**: Amount differences within configurable limit (default 0.5 AED)

**Output Categories**:
- ✅ **Matched**: No action needed
- ⚠️ **Mismatched**: Review differences
- ❌ **Missing in ASP**: NOT REPORTED - penalty risk
- ❌ **Missing in ERP**: Data quality issue

**Multi-Company Support**: Reconcile entire company groups in one run

### 3.3 VAT Return Preparation

**Auto-Calculation**:
- Output VAT from Sales Invoices
- Input VAT from Purchase Invoices
- Reverse charge for imports (Article 37)
- Adjustments and prior period corrections

**VAT Categories**:
- Standard rated (5%)
- Zero-rated
- Exempt
- Out of scope

### 3.4 TRN Validation

**Validation Layers**:
1. Format check (15 digits, starts with 100-999)
2. Luhn checksum verification
3. Blacklist lookup
4. FTA API validation (real-time)

**Features**:
- Bulk validation support
- Expiry tracking
- Validation history/audit trail

### 3.5 Compliance Dashboard

**Metrics Displayed**:
- Overall compliance score
- FTA deadline countdown
- Recent reconciliation results
- Potential penalty exposure
- Trend analysis

---

## 4. User Roles & Permissions

### Role Hierarchy

```
DigiComply Admin (Full Access)
    │
    ├── Compliance Manager (Multi-company operations)
    │       │
    │       ├── Company Accountant (Single company - full operations)
    │       │
    │       └── Company Reviewer (Single company - read only)
    │
    └── External Auditor (Temporary access via Auditor Access)
```

### Permission Matrix

| Action | Admin | Compliance Mgr | Accountant | Reviewer | Auditor |
|--------|-------|----------------|------------|----------|---------|
| View Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ |
| Run Reconciliation | ✅ | ✅ | ✅ | ❌ | ❌ |
| Submit E-Invoice | ✅ | ✅ | ✅ | ❌ | ❌ |
| Generate VAT Return | ✅ | ✅ | ✅ | ❌ | ❌ |
| View Reports | ✅ | ✅ | ✅ | ✅ | ✅ |
| Export Data | ✅ | ✅ | ✅ | ✅ | ✅ |
| Configure Settings | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage Users | ✅ | ❌ | ❌ | ❌ | ❌ |
| Access All Companies | ✅ | ✅ | ❌ | ❌ | ❌ |

### Company-Level Access

- **Accountant/Reviewer**: Restricted to assigned company via User Permission
- **Compliance Manager**: Can access multiple assigned companies
- **Admin**: Full access to all companies

---

## 5. DocTypes Reference

### 5.1 Core Operations (12 DocTypes)

| DocType | Purpose | Submittable |
|---------|---------|-------------|
| **Reconciliation Run** | Main reconciliation execution | Yes |
| **Reconciliation Item** | Individual match results (child) | No |
| **CSV Import** | ASP data upload and parsing | No |
| **Mismatch Report** | PDF audit pack generation | No |
| **E-Invoice** | E-invoice submission to ASP | No |
| **E-Invoice Item** | Line items (child) | No |
| **VAT Return** | VAT 201 preparation | Yes |
| **VAT Return Line** | Adjustment lines (child) | No |
| **VAT Adjustment** | Manual VAT adjustments | Yes |
| **FTA Report** | FTA report generation | No |

### 5.2 Company & TRN Management (5 DocTypes)

| DocType | Purpose |
|---------|---------|
| **Company Group** | Multi-company grouping |
| **Company Group Member** | Group membership (child) |
| **TRN Registry** | TRN tracking and validation status |
| **TRN Blacklist** | Invalid/blocked TRNs |
| **TRN Validation Log** | Validation audit trail |

### 5.3 Integration (6 DocTypes)

| DocType | Purpose |
|---------|---------|
| **ASP Connection** | ASP credentials and config |
| **ASP Connector** | ASP provider templates |
| **Sync Run** | Sync execution records |
| **Sync Schedule** | Automated sync configuration |
| **Sync Error** | Sync error logging |
| **API Log** | API request/response logging |

### 5.4 Audit & Compliance (8 DocTypes)

| DocType | Purpose |
|---------|---------|
| **Audit Log** | Immutable audit trail |
| **Audit Request** | Auditor access requests |
| **Audit Response** | Request responses |
| **Auditor Access** | Temporary access grants |
| **Compliance Calendar** | Deadline tracking |
| **Compliance Score** | Score snapshots |
| **Score History** | Historical scores |
| **Filing Status** | FTA filing tracking |

### 5.5 Data Management (8 DocTypes)

| DocType | Purpose |
|---------|---------|
| **Import Template** | Column mapping templates |
| **Import Template Column** | Column definitions (child) |
| **Bulk Import Log** | Import operation tracking |
| **Transform Rule** | Data transformations |
| **Field Mapping** | Custom field mappings |
| **Document Archive** | Long-term storage |
| **Document Snapshot** | Point-in-time snapshots |
| **Archive Storage** | Storage management |

### 5.6 Configuration (2 DocTypes)

| DocType | Purpose |
|---------|---------|
| **DigiComply Settings** | Global system settings |
| **E-Invoice Settings** | E-invoicing configuration |

---

## 6. Workflows & Processes

### 6.1 E-Invoice Submission Workflow

```
Sales Invoice (Submitted)
        │
        ▼
┌───────────────────┐
│  Create E-Invoice │ ◄── Auto or Manual
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Validate Fields   │
│ - TRN format      │
│ - Required fields │
│ - Amount > 0      │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Generate QR Code  │ ◄── TLV Encoding
│ Generate Hash     │ ◄── SHA256
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Submit to ASP     │ ◄── Via ConnectorFramework
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Process Response  │
│ - Extract IRN     │
│ - Validate Sig    │
│ - Store QR/XML    │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Status: Accepted  │
│ Archive Document  │
└───────────────────┘
```

### 6.2 Reconciliation Workflow

```
┌───────────────────┐
│ Upload CSV (ASP)  │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Create Recon Run  │
│ - Select Company  │
│ - Set Date Range  │
│ - Set Tolerance   │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Fetch ERP Data    │ ◄── Sales Invoices
│ Fetch ASP Data    │ ◄── From CSV Import
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ PASS 1: Exact     │
│ Match by Inv No   │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ PASS 2: Fuzzy     │ ◄── If enabled
│ 70% threshold     │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Compare Amounts   │
│ Within tolerance  │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Generate Results  │
│ - Matched         │
│ - Mismatched      │
│ - Missing in ASP  │
│ - Missing in ERP  │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Create Report     │
│ Calculate Penalty │
│ Score Compliance  │
└───────────────────┘
```

### 6.3 VAT Return Workflow

```
┌───────────────────┐
│ Create VAT Return │
│ - Company         │
│ - Tax Period      │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Auto-Generate     │ ◄── From Books
│ - Sales Invoices  │
│ - Purchase Inv    │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Calculate         │
│ - Output VAT      │
│ - Input VAT       │
│ - Reverse Charge  │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Apply Adjustments │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Net VAT Due =     │
│ Output - Input    │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Generate FTA XML  │
│ Submit to FTA     │
└───────────────────┘
```

---

## 7. Custom Pages

| Page | URL | Purpose | Primary Users |
|------|-----|---------|---------------|
| **Compliance Dashboard** | `/app/compliance_dashboard` | Real-time overview, scores, deadlines | All |
| **TRN Health Center** | `/app/trn_health_center` | TRN validation & management | TRN Admin |
| **Bulk Import Center** | `/app/bulk_import_center` | Data import hub | Data Manager |
| **Compliance Calendar** | `/app/compliance_calendar` | Deadline tracking | All |
| **Penalty Calculator** | `/app/penalty_calculator` | Penalty estimation | Finance |
| **Multi-Company Recon** | `/app/multi_company_recon` | Group reconciliation | Group Manager |
| **Compliance Analytics** | `/app/compliance_analytics` | Advanced reports | Analyst |
| **Auditor Portal** | `/app/auditor_portal` | Auditor access | External Auditor |
| **Sync Dashboard** | `/app/sync_dashboard` | Sync monitoring | Integration Admin |
| **DigiComply Setup** | `/app/digicomply_setup` | Configuration | System Admin |
| **Compliance Onboarding** | `/app/compliance_onboarding` | Initial setup wizard | Admin |

---

## 8. API Reference

### Dashboard APIs

```python
# Get dashboard metrics
get_dashboard_data(company=None)
# Returns: scores, recent runs, deadlines, alerts

# Get FTA deadline info
get_fta_deadline_info()
# Returns: deadline_date, days_remaining, urgency
```

### E-Invoice APIs

```python
# Submit e-invoice to ASP
submit_to_asp()
# Returns: success, irn, qr_code, asp_reference

# Validate before submission
validate_for_submission()
# Returns: {valid: bool, errors: [], warnings: []}

# Generate QR code
generate_qr_code()
# Returns: Base64 data URL

# Bulk create e-invoices
bulk_create_e_invoices(sales_invoices)
# Returns: [{invoice, success, e_invoice/error}]
```

### TRN APIs

```python
# Validate TRN with FTA
validate_trn_with_fta(trn, company=None)
# Returns: {valid: bool, status, message, data}

# Bulk validate
bulk_validate_trns(trns)
# Returns: [{trn, valid, status}]

# Format check only
verify_trn_format(trn)
# Returns: bool
```

### Reconciliation APIs

```python
# Quick reconciliation
quick_reconcile(company, asp_provider, csv_file)
# Returns: run_id, matched/mismatched counts

# Generate audit pack
generate_audit_pack(reconciliation_run)
# Returns: report_name, pdf_url, compliance_score
```

### VAT APIs

```python
# Auto-generate from books
generate_vat_from_books(docname)
# Returns: VAT totals, adjustments, net payable

# Generate FTA report
generate_report()
# Returns: report object with XML content
```

---

## 9. Configuration & Settings

### DigiComply Settings

**Location**: DigiComply Settings (Single DocType)

| Section | Setting | Description | Default |
|---------|---------|-------------|---------|
| **ASP** | default_asp_provider | Default ASP for submissions | - |
| | enable_auto_sync | Auto-sync with ASP | Off |
| | sync_frequency | Sync interval | Daily |
| **FTA** | enable_fta_validation | Enable TRN API validation | Off |
| | fta_api_url | FTA API endpoint | tax.gov.ae |
| | fta_api_key | API authentication | - |
| **VAT** | default_vat_rate | Standard VAT rate | 5% |
| | vat_filing_frequency | Filing period | Monthly |
| **Compliance** | compliance_target | Target score | 95% |
| | penalty_per_invoice | FTA penalty amount | AED 5,000 |
| **Alerts** | enable_filing_reminders | Deadline reminders | On |
| | enable_email_alerts | Score alerts | On |
| | alert_threshold | Alert trigger level | 85% |

### E-Invoice Settings

| Setting | Description | Default |
|---------|-------------|---------|
| enable_e_invoicing | Enable e-invoice features | Off |
| auto_create_e_invoice | Auto-create on Sales Invoice submit | Off |
| auto_submit_to_asp | Auto-submit if valid | Off |
| validate_trn_format | Validate TRN format | On |
| require_buyer_trn_threshold | Require TRN above amount | AED 10,000 |
| max_retry_attempts | Submission retries | 3 |
| archive_signed_documents | Archive signed XMLs | On |

---

## 10. Integrations

### ASP Providers

| Provider | CSV Import | Direct API | Auth Method |
|----------|-----------|------------|-------------|
| **ClearTax** | ✅ | ✅ | API Key |
| **Cygnet** | ✅ | ✅ | OAuth 2.0 |
| **Zoho** | ✅ | Planned | API Key |
| **Tabadul** | ✅ | ✅ | PFX Certificate |

### FTA Integration

- **TRN Validation**: Real-time API with retry logic
- **FAF Generation**: XML format per FTA specification
- **VAT Filing**: Manual (portal) or API (future)

### Data Formats

**Import**: CSV (comma, semicolon, tab delimited)
**Export**: PDF, CSV, JSON, XML, ZIP

---

## 11. Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| TRN validation fails | Invalid format | Check 15 digits, starts with 100 |
| E-invoice rejected | Missing fields | Verify TRN, amounts, items |
| Reconciliation mismatch | Rounding | Increase tolerance amount |
| QR code not generating | Missing library | Install `qrcode` package |
| Signature validation fails | Certificate issue | Check certificate chain |
| Sync timeout | Network/rate limit | Increase timeout, check rate limits |

### Log Locations

- **API Logs**: API Log DocType
- **Sync Errors**: Sync Error DocType
- **Audit Trail**: Audit Log DocType
- **System Logs**: `/sites/[site]/logs/`

### Support

- **Email**: support@digicomply.ae
- **Documentation**: This document
- **Issues**: Contact system administrator

---

## Appendix A: Invoice Type Codes

| Code | Name | Usage |
|------|------|-------|
| 380 | Commercial Invoice | Standard sales |
| 381 | Credit Note | Returns/adjustments |
| 383 | Debit Note | Additional charges |
| 389 | Self-Billing | Buyer-issued invoice |

## Appendix B: Tax Category Codes

| Code | Description | VAT Treatment |
|------|-------------|---------------|
| S | Standard | 5% VAT |
| Z | Zero-rated | 0% VAT |
| E | Exempt | No VAT |
| O | Out of scope | Not applicable |

## Appendix C: Compliance Score Factors

| Factor | Weight | Measurement |
|--------|--------|-------------|
| Reconciliation Match Rate | 40% | Matched / Total |
| E-Invoice Submission Rate | 30% | Submitted / Due |
| TRN Validity | 15% | Valid TRNs / Total |
| Filing Timeliness | 15% | On-time filings |

---

**Document End**

*DigiComply - UAE E-Invoicing Compliance Platform*
*© 2025 DigiComply. All rights reserved.*
