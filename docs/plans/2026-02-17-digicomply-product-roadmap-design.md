# DigiComply Product Roadmap Design

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan phase-by-phase.

**Date:** 2026-02-17
**Status:** Approved
**Version:** 1.0

---

## Executive Summary

**Vision:** The definitive UAE e-invoicing compliance platform for enterprises

**Target Market:** Large corporations with multiple TRNs, 5000+ invoices/month

**Differentiator:** Bulk operations everywhere + Universal ASP connector

**Approach:** Core-First (Phased public releases)

---

## Strategic Decisions

| Aspect | Decision |
|--------|----------|
| Target Customer | Enterprises (5000+ invoices, multi-TRN) |
| Key Differentiator | Bulk operations everywhere |
| ASP Strategy | Universal connector (ClearTax, Cygnet, Zoho, Tabadul) |
| Scope | Complete compliance suite (VAT + Audit + TRN + FTA + Archival) |
| Timeline | Phased public releases |
| Approach | Core-First - ship reconciliation fast, expand iteratively |

---

## UI/UX Core Principles (MANDATORY)

> **CRITICAL:** These principles apply to EVERY screen, component, and line of code across ALL phases.

### 1. Complete White-Labeling

| Rule | Implementation |
|------|----------------|
| **No "Frappe" anywhere** | Remove from all UI text, tooltips, error messages, console logs |
| **No "ERPNext" anywhere** | Replace with "DigiComply" or remove entirely |
| **No legacy branding** | No default Frappe colors, logos, or styling |
| **Custom domain feel** | App should feel like standalone DigiComply product |

### 2. Ease of Usage

| Principle | Implementation |
|-----------|----------------|
| **3-click rule** | Any task completable in 3 clicks or less |
| **Zero training** | New user can start reconciliation without documentation |
| **Guided workflows** | Step-by-step wizards for complex tasks |
| **Smart defaults** | Pre-fill everything possible |
| **Bulk-first** | Always show bulk action option before single-record |
| **Progress indicators** | Always show progress for long operations |
| **Inline help** | Contextual help tooltips, not external docs |

### 3. Modern UI Standards

| Element | Standard |
|---------|----------|
| **Colors** | DigiComply purple (#a404e4) primary, not Frappe blue |
| **Typography** | Poppins font family throughout |
| **Spacing** | Generous whitespace, no cramped forms |
| **Cards** | Modern card-based layouts with shadows |
| **Tables** | Clean tables with row hover, bulk select |
| **Buttons** | Clear primary/secondary hierarchy, purple gradient |
| **Icons** | Consistent icon set (Feather/Lucide style) |
| **Loading** | Skeleton loaders, not spinners |
| **Empty states** | Helpful empty states with call-to-action |

### 4. DigiComply Design System

```
Brand Colors:
├── Primary:     #a404e4 (Purple)
├── Primary Dark: #8501b9
├── Success:     #10b981 (Green)
├── Warning:     #f59e0b (Amber)
├── Danger:      #ef4444 (Red)
├── Background:  #f8fafc
└── Text:        #1e293b

Typography:
├── Font Family: Poppins
├── Headings:    600-700 weight
├── Body:        400-500 weight
└── Labels:      500 weight, uppercase for section headers

Spacing:
├── Section gap: 24px
├── Card padding: 20px
├── Field gap:    16px
└── Border radius: 8-12px

Components to Override:
├── Navbar (purple gradient, DIGI COMPLY branding)
├── Sidebar (clean, minimal)
├── Forms (modern field styling)
├── Tables/Lists (hover states, bulk actions)
├── Modals (rounded, clean)
├── Buttons (gradient primary, outlined secondary)
├── Alerts (soft colors, icons)
└── Empty states (illustrations, CTAs)
```

### 5. Code Standards

| Rule | Implementation |
|------|----------------|
| **No hardcoded "Frappe"** | Use config variables for all brand names |
| **No hardcoded "ERPNext"** | Replace in all strings, comments, logs |
| **CSS class prefix** | Use `dc-` prefix for all custom classes |
| **JS namespace** | Use `digicomply.*` namespace |
| **Error messages** | User-friendly, no technical jargon |
| **Console logs** | No Frappe references in browser console |

### 6. Screen-by-Screen Checklist

Before marking ANY screen complete:
- [ ] No Frappe/ERPNext text visible
- [ ] Purple theme applied
- [ ] Poppins font rendering
- [ ] Mobile responsive
- [ ] Loading states implemented
- [ ] Empty states designed
- [ ] Bulk actions available (where applicable)
- [ ] Tooltips/help text added
- [ ] Error messages are user-friendly
- [ ] 3-click task completion verified

---

## Phase Overview

| Phase | Focus | Timeline | Modules |
|-------|-------|----------|---------|
| **Phase 1** | Bulk Reconciliation + Multi-TRN | 4-6 weeks | 4 modules |
| **Phase 2** | TRN Validation + VAT Reports | 4 weeks | 5 modules |
| **Phase 3** | ASP API Connectors | 6 weeks | 7 modules |
| **Phase 4** | Audit Trail + Archival | 4 weeks | 7 modules |
| **Total** | Complete Platform | **18-20 weeks** | **23 modules** |

---

## Current State (Already Built)

| Module | Status |
|--------|--------|
| CSV Import | ✅ Built |
| Reconciliation Run | ✅ Built |
| Reconciliation Item | ✅ Built |
| Mismatch Report | ✅ Basic |
| Compliance Dashboard | ✅ Built |
| DigiComply Settings | ✅ Basic |

---

# PHASE 1: Bulk Reconciliation + Multi-TRN Foundation

**Target:** 4-6 weeks
**Release Name:** DigiComply Core

## Module 1.1: Company & TRN Management

| Feature | Description |
|---------|-------------|
| Multi-Company Support | Handle multiple legal entities in one instance |
| TRN Registry | Central registry of all company TRNs with validation |
| Company Hierarchy | Parent/subsidiary relationships |
| Bulk Company Import | Upload 100s of companies via Excel/CSV |

**DocTypes:**
- `TRN Registry` - Store and validate TRNs
- `Company Group` - Group related companies

## Module 1.2: Master Data Bulk Operations

| Feature | Description |
|---------|-------------|
| Bulk Customer Upload | Import customers with TRN validation |
| Bulk Supplier Upload | Import suppliers with TRN validation |
| Bulk Item Upload | Import items with tax categories |
| Data Validation Engine | Pre-validate before import, show errors |
| Template Generator | Download Excel templates for each entity |

**DocTypes:**
- `Bulk Import Log` - Track all bulk operations
- `Import Template` - Manage import templates

## Module 1.3: Enhanced Reconciliation Engine

| Feature | Description |
|---------|-------------|
| Bulk Reconciliation | Reconcile 10,000+ invoices in one run |
| Multi-Company Recon | Run across multiple TRNs at once |
| Smart Matching | Fuzzy match on invoice numbers, amounts, dates |
| Tolerance Settings | Configure acceptable variance (±0.5 AED) |
| Bulk Actions | Mark resolved, export, re-reconcile in bulk |
| Progress Tracking | Real-time progress for large jobs |

**Enhance Existing:**
- `Reconciliation Run` - Add multi-company, bulk actions
- `Reconciliation Item` - Add resolution workflow

## Module 1.4: Dashboard & Reporting

| Feature | Description |
|---------|-------------|
| Executive Dashboard | Company-wise compliance scores |
| Drill-down Reports | Click to see details |
| Export Center | Bulk export to Excel, PDF |
| Scheduled Reports | Auto-email daily/weekly summaries |

---

# PHASE 2: TRN Validation + VAT Reports

**Target:** 4 weeks after Phase 1
**Release Name:** DigiComply VAT

## Module 2.1: TRN Validation System

| Feature | Description |
|---------|-------------|
| TRN Format Validation | Validate UAE TRN format (15 digits, checksum) |
| FTA API Integration | Verify TRN against FTA database (if API available) |
| Bulk TRN Verification | Validate 1000s of TRNs in one click |
| TRN Health Report | List all invalid/expired/missing TRNs |
| Auto-flag Transactions | Flag invoices with invalid TRNs |
| Customer/Supplier TRN Sync | Push validated TRNs back to ERPNext masters |

**DocTypes:**
- `TRN Validation Log` - Track all validation attempts
- `TRN Blacklist` - Known fraudulent/invalid TRNs

## Module 2.2: VAT Return Preparation (VAT 201)

| Feature | Description |
|---------|-------------|
| Output VAT Summary | Sales by emirate, tax category |
| Input VAT Summary | Purchases by category, recoverable vs non-recoverable |
| Adjustment Entries | Bad debts, corrections, reversals |
| VAT 201 Form Generator | Auto-fill FTA VAT return format |
| Period Comparison | Compare current vs previous periods |
| Bulk Period Processing | Generate returns for multiple companies |

**DocTypes:**
- `VAT Return` - Store prepared VAT returns
- `VAT Return Line` - Line items for each box
- `VAT Adjustment` - Manual adjustments

## Module 2.3: Tax Category Management

| Feature | Description |
|---------|-------------|
| UAE Tax Categories | Standard (5%), Zero-rated, Exempt, Reverse Charge, Out of Scope |
| Category Rules | Auto-assign based on item/customer/emirate |
| Bulk Category Assignment | Assign categories to 1000s of items |
| Category Validation | Flag incorrect categorizations |

**DocTypes:**
- `Tax Category Rule` - Rules for auto-assignment

## Module 2.4: Compliance Calendar

| Feature | Description |
|---------|-------------|
| Filing Deadlines | Track VAT return due dates (28th monthly/quarterly) |
| Multi-Company Calendar | See all companies' deadlines in one view |
| Reminder System | 14 days, 7 days, 3 days, 1 day alerts |
| Penalty Calculator | Calculate potential late filing penalties |
| Filing Status Tracker | Draft → Prepared → Filed → Acknowledged |

**DocTypes:**
- `Compliance Calendar` - Filing deadlines per company
- `Filing Status` - Track submission status

## Module 2.5: Compliance Reports

| Report | Description |
|--------|-------------|
| TRN Health Report | All entities with TRN status |
| VAT Liability Report | Output - Input = Payable/Refundable |
| Category Analysis | Breakdown by tax treatment |
| Period Comparison | Trend analysis across periods |
| Exception Report | All flagged transactions needing attention |

---

# PHASE 3: ASP API Connectors (Universal Connector)

**Target:** 6 weeks after Phase 2
**Release Name:** DigiComply Connect

## Module 3.1: ASP Connector Framework

| Feature | Description |
|---------|-------------|
| Universal Connector Architecture | Plugin-based system for any ASP |
| Connection Manager | Store API credentials securely per company |
| Rate Limiting | Respect ASP API limits, queue requests |
| Retry Logic | Auto-retry failed requests with backoff |
| Webhook Support | Receive real-time updates from ASPs |
| Sync Scheduler | Auto-sync at configurable intervals |

**DocTypes:**
- `ASP Connection` - Store ASP credentials per company
- `ASP Connector` - Connector plugin configuration
- `Sync Schedule` - Automated sync settings
- `API Log` - Track all API calls for debugging

## Module 3.2: ClearTax Connector

| Feature | Description |
|---------|-------------|
| Authentication | OAuth/API key authentication |
| Pull Invoices | Bulk fetch submitted invoices |
| Pull Status | Get acceptance/rejection status |
| Push Invoices | Submit invoices from ERPNext to ClearTax |
| Pull IRN | Fetch Invoice Reference Numbers |
| Error Handling | Map ClearTax errors to actionable items |

**API Operations:**
```
├── GET  /invoices          (Bulk pull)
├── POST /invoices          (Bulk push)
├── GET  /invoices/status   (Status check)
├── GET  /irn/{invoice_id}  (Fetch IRN)
└── POST /invoices/cancel   (Cancellation)
```

## Module 3.3: Cygnet Connector

| Feature | Description |
|---------|-------------|
| Authentication | Cygnet API authentication |
| Pull Transactions | Bulk fetch e-invoice data |
| Push Transactions | Submit transactions to Cygnet |
| Status Sync | Sync submission status |
| Document Download | Download signed PDFs |

**API Operations:**
```
├── GET  /documents         (Bulk pull)
├── POST /documents         (Bulk push)
├── GET  /documents/status  (Status check)
└── GET  /documents/pdf     (Download PDF)
```

## Module 3.4: Zoho Invoice Connector

| Feature | Description |
|---------|-------------|
| OAuth Integration | Zoho OAuth 2.0 flow |
| Pull Invoices | Fetch from Zoho Invoice |
| Push Invoices | Create invoices in Zoho |
| Customer Sync | Sync customer data bidirectionally |
| Payment Status | Sync payment information |

**API Operations:**
```
├── GET  /invoices          (Bulk pull)
├── POST /invoices          (Bulk push)
├── GET  /contacts          (Customer sync)
└── GET  /payments          (Payment status)
```

## Module 3.5: Tabadul Connector

| Feature | Description |
|---------|-------------|
| Government Auth | UAE Pass / Certificate authentication |
| Pull Submissions | Fetch submitted documents |
| Push Documents | Submit to Tabadul |
| Compliance Status | FTA acceptance status |
| Official Response | Download FTA responses |

**API Operations:**
```
├── GET  /submissions       (Bulk pull)
├── POST /submissions       (Bulk push)
├── GET  /submissions/{id}  (Status)
└── GET  /responses/{id}    (FTA response)
```

## Module 3.6: Sync Dashboard

| Feature | Description |
|---------|-------------|
| Connection Health | Live status of all ASP connections |
| Sync History | View all sync operations |
| Error Queue | Failed syncs requiring attention |
| Manual Sync | Trigger sync on-demand |
| Bulk Retry | Retry all failed operations |
| Sync Analytics | Volume, success rate, latency |

**DocTypes:**
- `Sync Run` - Track each sync operation
- `Sync Error` - Failed items with error details

## Module 3.7: Data Mapping Engine

| Feature | Description |
|---------|-------------|
| Field Mapper | Map ERPNext fields to ASP fields |
| Transform Rules | Data transformation (date formats, etc.) |
| Default Values | Fill missing fields with defaults |
| Validation Rules | Pre-validate before push |
| Custom Mappings | Per-company custom field mappings |

**DocTypes:**
- `Field Mapping` - Store field mappings per ASP
- `Transform Rule` - Data transformation rules

---

# PHASE 4: Audit Trail + Archival + Enterprise Compliance

**Target:** 4 weeks after Phase 3
**Release Name:** DigiComply Enterprise

## Module 4.1: Comprehensive Audit Trail

| Feature | Description |
|---------|-------------|
| Complete Activity Log | Every action tracked with user, timestamp, IP |
| Before/After Snapshots | Full document state before and after changes |
| Immutable Records | Audit logs cannot be edited or deleted |
| User Session Tracking | Login/logout, session duration |
| Bulk Operation Audit | Track who ran bulk operations and what changed |
| Export Audit Trail | Export for external auditors |

**DocTypes:**
- `Audit Log` - Immutable audit records
- `Document Snapshot` - Point-in-time document states
- `User Session Log` - Session tracking

**Tracked Events:**
```
├── Document Created
├── Document Modified (with field-level diff)
├── Document Deleted
├── Document Submitted/Cancelled
├── Bulk Import Executed
├── Reconciliation Run
├── ASP Sync Performed
├── Report Generated
├── User Login/Logout
└── Permission Changed
```

## Module 4.2: Document Archival System

| Feature | Description |
|---------|-------------|
| Legal Archival | Store documents for 5+ years (UAE requirement) |
| Signed Document Storage | Archive digitally signed invoices |
| Compression & Deduplication | Efficient storage for large volumes |
| Archive Search | Full-text search across archived documents |
| Retrieval API | Instant retrieval for audits |
| Archive Integrity | Hash verification to detect tampering |
| Tiered Storage | Hot/warm/cold storage based on age |

**DocTypes:**
- `Document Archive` - Archived document metadata
- `Archive Storage` - Storage location configuration
- `Archive Retrieval Log` - Track who accessed what

## Module 4.3: FTA Reporting Suite

| Report | Description |
|--------|-------------|
| VAT 201 Report | Complete VAT return in FTA format |
| VAT 301 Report | Voluntary disclosure format |
| VAT Audit File (FAF) | FTA Audit File format export |
| Transaction Listing | All transactions for a period |
| Exempt Supply Report | All zero-rated/exempt transactions |
| Import/Export Report | Cross-border transactions |
| Related Party Report | Transactions with related entities |

**DocTypes:**
- `FTA Report` - Generated report records
- `Report Schedule` - Automated report generation

## Module 4.4: Auditor Portal

| Feature | Description |
|---------|-------------|
| Auditor User Role | Read-only access for external auditors |
| Secure Document Sharing | Share specific documents/periods |
| Audit Request Management | Track auditor requests |
| Response Workflow | Prepare and approve responses |
| Auditor Dashboard | Simplified view for auditors |
| Time-Limited Access | Auto-expire auditor access |

**DocTypes:**
- `Auditor Access` - Manage auditor permissions
- `Audit Request` - Track auditor queries
- `Audit Response` - Responses to queries

## Module 4.5: Compliance Scoring & Analytics

| Feature | Description |
|---------|-------------|
| Compliance Score | 0-100 score per company |
| Score Breakdown | By category (TRN, VAT, Filing, etc.) |
| Trend Analysis | Score changes over time |
| Benchmark Comparison | Compare against industry average |
| Risk Indicators | Flag high-risk patterns |
| Recommendations Engine | Actionable improvement suggestions |

**Score Components:**
```
Compliance Score (100 points)
├── TRN Validity (20 pts)
│   ├── All customers have valid TRN
│   └── All suppliers have valid TRN
├── Reconciliation (25 pts)
│   ├── Match percentage > 95%
│   └── No unresolved mismatches > 30 days
├── VAT Accuracy (25 pts)
│   ├── Correct tax categorization
│   └── No calculation errors
├── Filing Compliance (20 pts)
│   ├── On-time filing history
│   └── No pending returns
└── Data Quality (10 pts)
    ├── Complete records
    └── No duplicate entries
```

**DocTypes:**
- `Compliance Score` - Store calculated scores
- `Score History` - Track score over time

## Module 4.6: Data Retention & Purge

| Feature | Description |
|---------|-------------|
| Retention Policies | Configure per document type |
| Legal Hold | Prevent deletion during audits |
| Scheduled Purge | Auto-delete after retention period |
| Purge Approval | Multi-level approval for deletion |
| Purge Audit | Track what was deleted and when |
| Data Export Before Purge | Mandatory export before deletion |

**DocTypes:**
- `Retention Policy` - Define retention rules
- `Legal Hold` - Documents under hold
- `Purge Log` - Deletion records

## Module 4.7: Enterprise Security

| Feature | Description |
|---------|-------------|
| Role-Based Access | Accountant, Manager, Auditor, Admin roles |
| Company-Level Permissions | Users see only their companies |
| Field-Level Security | Hide sensitive fields by role |
| Two-Factor Authentication | Mandatory 2FA for sensitive actions |
| IP Whitelisting | Restrict access by IP |
| Session Management | Force logout, session limits |

**Roles:**
```
├── DigiComply Admin (Full access)
├── Compliance Manager (All companies, no settings)
├── Company Accountant (Single company)
├── Company Reviewer (Read-only single company)
├── External Auditor (Time-limited read-only)
└── API User (System integration)
```

---

# Complete Asset Summary

## All DocTypes (32 New)

### Phase 1 (4 New)
| DocType | Purpose |
|---------|---------|
| `TRN Registry` | Central TRN storage & validation |
| `Company Group` | Group related companies |
| `Bulk Import Log` | Track bulk operations |
| `Import Template` | Manage import templates |

### Phase 2 (8 New)
| DocType | Purpose |
|---------|---------|
| `TRN Validation Log` | Track validation attempts |
| `TRN Blacklist` | Known invalid TRNs |
| `VAT Return` | Prepared VAT returns |
| `VAT Return Line` | Line items per box |
| `VAT Adjustment` | Manual adjustments |
| `Tax Category Rule` | Auto-assignment rules |
| `Compliance Calendar` | Filing deadlines |
| `Filing Status` | Track submissions |

### Phase 3 (8 New)
| DocType | Purpose |
|---------|---------|
| `ASP Connection` | Store ASP credentials |
| `ASP Connector` | Connector configurations |
| `Sync Schedule` | Auto-sync settings |
| `API Log` | Track API calls |
| `Sync Run` | Track sync operations |
| `Sync Error` | Failed sync items |
| `Field Mapping` | ERPNext to ASP mapping |
| `Transform Rule` | Data transformations |

### Phase 4 (12 New)
| DocType | Purpose |
|---------|---------|
| `Audit Log` | Immutable audit records |
| `Document Snapshot` | Point-in-time states |
| `User Session Log` | Session tracking |
| `Document Archive` | Archived documents |
| `Archive Storage` | Storage configuration |
| `Archive Retrieval Log` | Access tracking |
| `FTA Report` | Generated reports |
| `Report Schedule` | Auto-report generation |
| `Auditor Access` | External auditor permissions |
| `Audit Request` | Auditor queries |
| `Audit Response` | Query responses |
| `Compliance Score` | Calculated scores |
| `Retention Policy` | Retention rules |
| `Legal Hold` | Documents under hold |
| `Purge Log` | Deletion records |

## All Pages (11 New)

| Page | Phase | Purpose |
|------|-------|---------|
| Bulk Import Center | Phase 1 | All bulk operations |
| Multi-Company Reconciliation | Phase 1 | Cross-company recon |
| TRN Health Center | Phase 2 | TRN validation hub |
| VAT Return Workspace | Phase 2 | VAT preparation |
| Compliance Calendar | Phase 2 | Deadlines view |
| ASP Connection Manager | Phase 3 | Manage ASP connections |
| Sync Dashboard | Phase 3 | Monitor syncs |
| Audit Trail Viewer | Phase 4 | Browse audit logs |
| Document Archive | Phase 4 | Search archives |
| Auditor Portal | Phase 4 | External auditor view |
| Compliance Analytics | Phase 4 | Scores & trends |

## All Reports (11 New)

| Report | Phase | Type |
|--------|-------|------|
| Bulk Import Summary | Phase 1 | Script |
| TRN Health Report | Phase 2 | Script |
| VAT Liability Report | Phase 2 | Script |
| Category Analysis | Phase 2 | Script |
| Exception Report | Phase 2 | Script |
| Sync Performance Report | Phase 3 | Script |
| API Usage Report | Phase 3 | Script |
| Full Audit Trail | Phase 4 | Script |
| VAT 201 (FTA Format) | Phase 4 | Print |
| VAT Audit File (FAF) | Phase 4 | Export |
| Compliance Score Card | Phase 4 | Script |

## User Roles (6 New)

| Role | Access Level | Phase |
|------|--------------|-------|
| DigiComply Admin | Full system access | Phase 1 |
| Compliance Manager | All companies, no settings | Phase 1 |
| Company Accountant | Single company full access | Phase 1 |
| Company Reviewer | Single company read-only | Phase 1 |
| External Auditor | Time-limited read-only | Phase 4 |
| API User | System integration only | Phase 3 |

---

# Release Milestones

```
Week 0-6:   Phase 1 Release - Bulk Reconciliation MVP
            └── "DigiComply Core"

Week 6-10:  Phase 2 Release - VAT Compliance
            └── "DigiComply VAT"

Week 10-16: Phase 3 Release - ASP Integrations
            └── "DigiComply Connect"

Week 16-20: Phase 4 Release - Enterprise Compliance
            └── "DigiComply Enterprise"
```

---

# Success Metrics

| Metric | Target |
|--------|--------|
| Reconciliation Speed | 10,000 invoices < 2 minutes |
| Match Accuracy | > 99% auto-match rate |
| Bulk Import | 50,000 records < 5 minutes |
| API Sync Latency | < 30 seconds |
| System Uptime | 99.9% |
| Compliance Score Adoption | 80% of users check weekly |

---

# Technology Stack

| Component | Technology |
|-----------|------------|
| Backend | Frappe Framework (Python) |
| Frontend | Frappe UI + Custom JS/CSS |
| Database | MariaDB |
| Queue | Redis + Frappe Background Jobs |
| File Storage | Local / S3 Compatible |
| API | REST + Frappe RPC |

---

# Next Steps

1. Start Phase 1 implementation with `superpowers:writing-plans`
2. Create detailed implementation plan for each module
3. Set up development sprints
4. Begin with TRN Registry and Bulk Import infrastructure

---

*Document created: 2026-02-17*
*Author: DigiComply Team*
*Status: Approved for implementation*
