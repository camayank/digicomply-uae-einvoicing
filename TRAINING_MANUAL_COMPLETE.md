# DigiComply - Complete Training Manual
## UAE E-Invoicing Compliance Platform

**Version**: 1.0.0
**Last Updated**: February 2025
**Document Type**: End-User Training Guide

---

# Table of Contents

1. [Getting Started](#part-1-getting-started)
2. [Platform Overview](#part-2-platform-overview)
3. [User Interface Guide](#part-3-user-interface-guide)
4. [Feature Walkthroughs](#part-4-feature-walkthroughs)
5. [Form Reference](#part-5-form-reference)
6. [Workflows & Processes](#part-6-workflows--processes)
7. [Troubleshooting](#part-7-troubleshooting)
8. [Technical Reference](#part-8-technical-reference)

---

# PART 1: GETTING STARTED

## 1.1 What is DigiComply?

DigiComply is a UAE-focused compliance platform that helps businesses:

- **Stay FTA Compliant**: Automated e-invoice submission with IRN, QR codes, digital signatures
- **Reconcile Data**: Match ERP invoices against ASP (Accredited Service Provider) records
- **Prepare VAT Returns**: Auto-calculate VAT with reverse charge support
- **Track Deadlines**: Never miss an FTA filing deadline
- **Avoid Penalties**: Real-time penalty exposure monitoring

## 1.2 Accessing the Platform

**URL**: `http://digicomply.localhost:8000`

**Login Process**:
1. Navigate to the login URL
2. Enter your email address
3. Enter your password
4. Click "Sign In to DigiComply"

**First-Time Users**:
- Contact your administrator for credentials
- Complete the onboarding wizard at `/app/compliance_onboarding`

## 1.3 User Roles

| Role | Access Level | Can Do |
|------|-------------|--------|
| **DigiComply Admin** | Full | Everything including settings |
| **Compliance Manager** | Multi-company | Run reconciliations, generate reports |
| **Company Accountant** | Single company | Day-to-day compliance tasks |
| **Company Reviewer** | Read-only | View reports and data |
| **External Auditor** | Temporary | Access granted documents only |

## 1.4 Keyboard Shortcuts

Learn these shortcuts to work faster:

| Shortcut | Action |
|----------|--------|
| `Alt + D` | Go to Dashboard |
| `Alt + N` | New Reconciliation |
| `Alt + U` | Upload CSV |
| `Alt + S` | Open Search |
| `Ctrl + S` | Save current form |
| `Ctrl + E` | Toggle Edit mode |
| `Escape` | Close dialog/modal |

---

# PART 2: PLATFORM OVERVIEW

## 2.1 Navigation Structure

```
┌─────────────────────────────────────────────────────────────┐
│  NAVBAR                                                      │
│  [Logo] DIGICOMPLY    [Search...]    [Notifications] [User] │
├──────────────┬──────────────────────────────────────────────┤
│   SIDEBAR    │                                               │
│              │                                               │
│ Dashboard    │           MAIN CONTENT AREA                  │
│ Calendar     │                                               │
│ Analytics    │    Forms, Lists, Reports, Dashboards         │
│ TRN Health   │                                               │
│ Bulk Import  │                                               │
│ Penalty Calc │                                               │
│ Multi-Co     │                                               │
│ Auditor      │                                               │
│ Setup        │                                               │
│              │                                               │
└──────────────┴──────────────────────────────────────────────┘
```

## 2.2 Main Pages

### Compliance Dashboard (`/app/compliance_dashboard`)
Your command center showing:
- FTA deadline countdown
- Compliance score
- Recent reconciliation results
- Quick action buttons
- Penalty exposure

### Compliance Calendar (`/app/compliance_calendar`)
Visual calendar showing:
- Upcoming deadlines (purple dots)
- Due soon items (orange dots)
- Overdue items (red dots)
- Filed items (green dots)

### TRN Health Center (`/app/trn_health_center`)
TRN management showing:
- Validation status of all TRNs
- Expiry tracking
- Bulk validation tools
- Blacklist management

### Bulk Import Center (`/app/bulk_import_center`)
Data import hub for:
- CSV file uploads
- Template selection
- Preview and validation
- Batch processing

### Penalty Calculator (`/app/penalty_calculator`)
Risk assessment showing:
- Potential penalties
- Missing invoice counts
- Scenario planning
- Remediation guidance

## 2.3 Color Coding

DigiComply uses consistent colors throughout:

| Color | Meaning | Usage |
|-------|---------|-------|
| 🟣 Purple (#a404e4) | Primary/Brand | Buttons, links, active states |
| 🟢 Green | Success/Good | Matched, filed, valid |
| 🟡 Yellow/Orange | Warning/Attention | Due soon, mismatched |
| 🔴 Red | Danger/Critical | Overdue, missing, invalid |
| ⚪ Gray | Neutral/Inactive | Draft, pending |
| 🔵 Blue | Information | Submitted, in progress |

## 2.4 Status Indicators

**Reconciliation Status**:
- `Pending` (gray) - Not yet processed
- `In Progress` (blue) - Currently running
- `Completed` (green) - Successfully finished
- `Failed` (red) - Errors occurred

**E-Invoice Status**:
- `Draft` (gray) - Created, not submitted
- `Validated` (blue) - Passed validation
- `Submitted` (blue) - Sent to ASP
- `Accepted` (green) - IRN received
- `Rejected` (red) - ASP rejected
- `Cancelled` (red) - IRN cancelled

**VAT Return Status**:
- `Draft` (gray) - In preparation
- `Prepared` (blue) - Ready to file
- `Under Review` (yellow) - Being reviewed
- `Filed` (green) - Submitted to FTA
- `Acknowledged` (dark green) - FTA confirmed

---

# PART 3: USER INTERFACE GUIDE

## 3.1 Navbar

The top navigation bar contains:

```
┌────────────────────────────────────────────────────────────┐
│ [✓] DIGICOMPLY     [🔍 Search DigiComply...]  [🔔] [👤]   │
└────────────────────────────────────────────────────────────┘
     │                        │                    │    │
     │                        │                    │    └── User menu
     │                        │                    └── Notifications
     │                        └── Search bar (Alt+S)
     └── Click to go to dashboard
```

**User Menu Options**:
- My Settings
- View Profile
- About DigiComply
- Keyboard Shortcuts
- Logout

## 3.2 Sidebar

The left sidebar shows navigation:

```
┌──────────────────┐
│ DIGICOMPLY       │ ← Section header
├──────────────────┤
│ 📊 Dashboard     │ ← Active (purple background)
│ 📅 Calendar      │
│ 📈 Analytics     │
│ 🏥 TRN Health    │
│ 📦 Bulk Import   │
│ 🧮 Penalty Calc  │
│ 🏢 Multi-Company │
│ 👁️ Auditor Portal│
│ ⚙️ Setup         │
├──────────────────┤
│ ACCOUNTING       │ ← Section header
├──────────────────┤
│ 📒 Accounts      │
│ 📄 Invoices      │
└──────────────────┘
```

**Sidebar Behavior**:
- Click item to navigate
- Active item has purple background
- Hover shows light purple highlight
- On mobile: sidebar collapses to icons

## 3.3 Dashboard Layout

```
┌────────────────────────────────────────────────────────────┐
│                    FTA DEADLINE CARD                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  📅 FTA E-Invoice Filing Deadline                    │  │
│  │                                                       │  │
│  │  January 2025                    12 DAYS              │  │
│  │  Due: 28 Feb 2025               remaining             │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  QUICK ACTIONS                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ New      │ │ Upload   │ │ View     │ │ All      │       │
│  │ Recon    │ │ CSV      │ │ Invoices │ │ Recons   │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                                                             │
│  METRICS                                                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │  125     │ │   98%    │ │   3      │ │  AED 0   │       │
│  │ Invoices │ │ Match    │ │ Missing  │ │ Penalty  │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                                                             │
│  STATUS BAR                                                 │
│  ████████████████████░░░░░                                 │
│  Matched: 120  |  Mismatched: 2  |  Missing: 3             │
│                                                             │
│  RECENT RECONCILIATIONS                                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Company A  |  Jan 2025  |  98%  |  Completed  ✓     │  │
│  │ Company B  |  Jan 2025  |  95%  |  Completed  ✓     │  │
│  │ Company C  |  Dec 2024  |  92%  |  Completed  ✓     │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

## 3.4 Forms

### Form Structure

```
┌────────────────────────────────────────────────────────────┐
│  PAGE TITLE                           [Save] [Submit]      │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─ SECTION 1 ─────────────────────────────────────────┐   │
│  │                                                      │   │
│  │  Company *              [Select your company...  ▼]  │   │
│  │                                                      │   │
│  │  ASP Provider *         [ClearTax              ▼]    │   │
│  │                                                      │   │
│  │  From Date *            [📅 01-01-2025        ]      │   │
│  │                                                      │   │
│  │  To Date *              [📅 31-01-2025        ]      │   │
│  │                                                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─ SECTION 2 (Collapsed) ──────────────────────────── ▶   │
│                                                             │
│  ┌─ SECTION 3 (Collapsed) ──────────────────────────── ▶   │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### Form Elements

**Required Fields**:
- Marked with red asterisk (*)
- Cannot save without filling
- Shows error if empty on submit

**Field Types**:
| Type | Appearance | Usage |
|------|------------|-------|
| Link | Dropdown with search | Select related record |
| Data | Text input | Free text entry |
| Date | Calendar picker | Date selection |
| Currency | Number with AED | Money amounts |
| Check | Checkbox | Yes/No options |
| Select | Dropdown | Fixed choices |
| Table | Grid with rows | Child items |

**Section Behavior**:
- Click section header to expand/collapse
- Purple bar indicates active section
- Gray header = collapsed section

## 3.5 List Views

```
┌────────────────────────────────────────────────────────────┐
│  Reconciliation Run                    [+ New] [Filters]   │
├────────────────────────────────────────────────────────────┤
│  [Filters: Status = Completed ×]                           │
├────────────────────────────────────────────────────────────┤
│  □  NAME          COMPANY      DATE        STATUS   MATCH  │
├────────────────────────────────────────────────────────────┤
│  □  RR-00125      Company A    28 Jan      ✓ Done   98%   │
│  □  RR-00124      Company B    27 Jan      ✓ Done   95%   │
│  □  RR-00123      Company A    26 Jan      ⚠ Fail   -     │
│  □  RR-00122      Company C    25 Jan      ✓ Done   100%  │
├────────────────────────────────────────────────────────────┤
│  Showing 1-20 of 125                    [< Prev] [Next >]  │
└────────────────────────────────────────────────────────────┘
```

**List Actions**:
- Click row to open record
- Checkbox to select multiple
- Bulk actions appear when selected
- Filter by clicking column headers
- Sort by clicking column headers

## 3.6 Dialogs & Modals

### Confirmation Dialog
```
┌──────────────────────────────────────┐
│  ⚠️ Confirm Action                   │
├──────────────────────────────────────┤
│                                      │
│  Are you sure you want to submit     │
│  this reconciliation?                │
│                                      │
│  This action cannot be undone.       │
│                                      │
├──────────────────────────────────────┤
│              [Cancel]  [Confirm]     │
└──────────────────────────────────────┘
```

### Error Dialog
```
┌──────────────────────────────────────┐
│  ❌ Error                            │
├──────────────────────────────────────┤
│                                      │
│  Company is required.                │
│  Please select a company to          │
│  continue.                           │
│                                      │
├──────────────────────────────────────┤
│                           [OK]       │
└──────────────────────────────────────┘
```

### Success Dialog
```
┌──────────────────────────────────────┐
│  ✅ Success                          │
├──────────────────────────────────────┤
│                                      │
│  Reconciliation completed            │
│  successfully.                       │
│                                      │
│  Matched: 120 of 125 invoices        │
│                                      │
├──────────────────────────────────────┤
│                           [OK]       │
└──────────────────────────────────────┘
```

## 3.7 Floating Action Buttons (FAB)

Located at bottom-right of screen:

```
                                    ┌─────┐
                                    │ 📊  │ ← Dashboard (purple)
                                    └─────┘
                                    ┌─────┐
                                    │  +  │ ← New Reconciliation (green)
                                    └─────┘
```

**FAB Behavior**:
- Always visible (fixed position)
- Hover shows tooltip
- Click to perform action
- On mobile: smaller size, higher position

## 3.8 Mobile Interface

On screens smaller than 768px:

**Changes**:
- Sidebar collapses to hamburger menu
- Forms stack vertically
- Tables scroll horizontally
- FABs move to avoid thumb zone
- Modals take full width

**Touch Targets**:
- All buttons minimum 44x44px
- Adequate spacing between tappable elements
- Swipe gestures on lists

---

# PART 4: FEATURE WALKTHROUGHS

## 4.1 Running a Reconciliation

### Step 1: Prepare Your Data

Before starting, ensure you have:
- [ ] CSV export from your ASP (ClearTax/Cygnet/Zoho)
- [ ] Date range to reconcile
- [ ] Company selected

### Step 2: Upload CSV

1. Click **"Upload CSV"** (or press `Alt+U`)
2. Select **ASP Provider** from dropdown
3. Click **"Attach"** and select your CSV file
4. Wait for preview to appear
5. Verify column mapping is correct
6. Click **"Save"**

```
CSV Import Preview:
┌──────────────┬────────────┬──────────┬─────────┐
│ Invoice No   │ Date       │ Amount   │ VAT     │
├──────────────┼────────────┼──────────┼─────────┤
│ INV-001      │ 2025-01-15 │ 1,050.00 │ 50.00   │
│ INV-002      │ 2025-01-16 │ 2,100.00 │ 100.00  │
│ INV-003      │ 2025-01-17 │ 525.00   │ 25.00   │
└──────────────┴────────────┴──────────┴─────────┘
```

### Step 3: Create Reconciliation Run

1. Click **"New Reconciliation"** (or press `Alt+N`)
2. Fill in the form:
   - **Company**: Select your company
   - **ASP Provider**: Match your CSV source
   - **From Date**: Start of period
   - **To Date**: End of period
   - **Tolerance**: Leave at 0.5 AED (or adjust)
   - **Fuzzy Matching**: Enable for better matching
3. Click **"Save"**

### Step 4: Run Reconciliation

1. Click **"Submit"** button
2. Wait for processing (progress shown)
3. View results when complete

### Step 5: Review Results

```
Reconciliation Results:
┌─────────────────────────────────────────────────────────┐
│  Match Rate: 98%                                        │
│  ████████████████████░░                                │
├─────────────────────────────────────────────────────────┤
│  ✅ Matched:        120                                 │
│  ⚠️ Mismatched:       2                                 │
│  ❌ Missing in ASP:   3                                 │
│  ❌ Missing in ERP:   0                                 │
└─────────────────────────────────────────────────────────┘
```

### Step 6: Handle Mismatches

For each mismatched item:
1. Click to expand details
2. Review differences:
   - Amount variance
   - Date differences
   - TRN mismatches
3. Take corrective action in source system
4. Re-run reconciliation if needed

## 4.2 Submitting an E-Invoice

### Step 1: Create E-Invoice

**Automatic** (if enabled):
- E-Invoice auto-creates when Sales Invoice is submitted

**Manual**:
1. Go to E-Invoice list
2. Click **"+ New"**
3. Select **Sales Invoice** to link
4. Fields auto-populate
5. Click **"Save"**

### Step 2: Validate

1. Review all fields:
   - Supplier TRN ✓
   - Buyer TRN (if required) ✓
   - Items and amounts ✓
2. Click **"Validate for Submission"**
3. Fix any errors shown
4. Proceed when validation passes

### Step 3: Submit to ASP

1. Click **"Submit to ASP"** button
2. Wait for ASP response
3. On success:
   - IRN displayed
   - QR code generated
   - Status changes to "Accepted"

### Step 4: Verify

Check the following are present:
- [ ] IRN (Invoice Reference Number)
- [ ] QR Code image
- [ ] Digital signature validated
- [ ] Status = "Accepted"

## 4.3 Preparing VAT Return

### Step 1: Create VAT Return

1. Go to VAT Return list
2. Click **"+ New"**
3. Fill in:
   - **Company**: Select company
   - **Tax Period**: Monthly or Quarterly
   - **From Date**: Period start
   - **To Date**: Period end
4. Click **"Save"**

### Step 2: Auto-Generate from Books

1. Click **"Generate from Books"** button
2. System calculates:
   - Output VAT from Sales Invoices
   - Input VAT from Purchase Invoices
   - Reverse charge amounts
3. Review calculated figures

### Step 3: Review & Adjust

```
VAT Return Summary:
┌─────────────────────────────────────────┐
│ Output VAT (Box 1-3)        AED 52,500  │
│ Input VAT (Box 6-9)         AED 31,200  │
│ Reverse Charge              AED  5,000  │
│ Adjustments                 AED      0  │
├─────────────────────────────────────────┤
│ NET VAT DUE                 AED 21,300  │
└─────────────────────────────────────────┘
```

### Step 4: Add Adjustments (if needed)

1. Go to VAT Adjustments section
2. Click **"Add Row"**
3. Enter:
   - Adjustment type
   - Amount
   - Reason
4. Save

### Step 5: Submit

1. Click **"Submit"** when ready
2. Status changes to "Prepared"
3. Generate FTA report for filing

## 4.4 Validating TRNs

### Single TRN Validation

1. Go to **TRN Health Center**
2. Enter TRN in search box
3. Click **"Validate"**
4. View results:
   - ✅ Valid - Active registration
   - ❌ Invalid - Format error or not found
   - ⚠️ Expired - Registration expired

### Bulk TRN Validation

1. Go to **TRN Health Center**
2. Click **"Bulk Validate"**
3. Upload CSV with TRN column
4. Click **"Process"**
5. Download results

### TRN Format Rules

Valid UAE TRN:
- Exactly 15 digits
- Starts with 100-999
- Passes Luhn checksum

Example: `100123456789012`

---

# PART 5: FORM REFERENCE

## 5.1 Reconciliation Run

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| company | Link | Yes | Company to reconcile |
| asp_provider | Select | Yes | ClearTax/Cygnet/Zoho/Tabadul/Other |
| company_group | Link | No | For multi-company reconciliation |
| from_date | Date | Yes | Period start date |
| to_date | Date | Yes | Period end date |
| tolerance_amount | Currency | No | Variance tolerance (default 0.5 AED) |
| use_fuzzy_matching | Check | No | Enable fuzzy invoice matching |
| batch_size | Int | No | Records per batch (default 1000) |
| status | Select | Auto | Pending/In Progress/Completed/Failed |
| total_invoices | Int | Auto | Total invoice count |
| matched_count | Int | Auto | Matched invoice count |
| mismatched_count | Int | Auto | Mismatched count |
| missing_in_asp | Int | Auto | Not reported to ASP |
| missing_in_erp | Int | Auto | In ASP but not ERP |
| match_percentage | Percent | Auto | Overall match rate |

## 5.2 E-Invoice

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| sales_invoice | Link | Yes | Source Sales Invoice |
| company | Link | Auto | From Sales Invoice |
| customer | Link | Auto | Customer name |
| supplier_trn | Data | Auto | Company TRN |
| customer_trn | Data | Conditional | Required above threshold |
| irn | Data | Auto | Invoice Reference Number |
| irn_status | Select | Auto | IRN status |
| qr_code_data | Text | Auto | Base64 QR code |
| e_invoice_status | Select | Auto | Current status |
| signature_valid | Check | Auto | Signature verification |
| asp_connection | Link | No | ASP to submit to |
| submission_date | Datetime | Auto | When submitted |

## 5.3 VAT Return

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| company | Link | Yes | Company |
| trn | Data | Auto | Tax Registration Number |
| tax_period | Select | Yes | Monthly/Quarterly |
| from_date | Date | Yes | Period start |
| to_date | Date | Yes | Period end |
| total_sales_standard | Currency | Auto | Standard-rated sales |
| total_sales_zero_rated | Currency | Auto | Zero-rated sales |
| output_vat_amount | Currency | Auto | Output VAT due |
| input_vat_recoverable | Currency | Auto | Recoverable input VAT |
| reverse_charge_amount | Currency | Auto | Reverse charge VAT |
| net_vat_due | Currency | Auto | Net VAT payable |
| status | Select | Auto | Current status |
| filed_date | Datetime | Auto | Filing date |
| fta_reference | Data | Auto | FTA reference number |

## 5.4 CSV Import

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| asp_provider | Select | Yes | Source ASP |
| file | Attach | Yes | CSV file |
| status | Select | Auto | Processing status |
| row_count | Int | Auto | Number of rows |
| invoice_no_column | Data | No | Custom column name |
| date_column | Data | No | Custom column name |
| total_column | Data | No | Custom column name |
| vat_column | Data | No | Custom column name |
| preview_html | HTML | Auto | Data preview |

## 5.5 TRN Registry

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| trn | Data | Yes | 15-digit TRN |
| company | Link | No | Associated company |
| entity_name | Data | Auto | Registered entity name |
| entity_type | Select | Auto | Company/Individual |
| validation_status | Select | Auto | Valid/Invalid/Expired |
| fta_registration_date | Date | Auto | Registration date |
| fta_expiry_date | Date | Auto | Expiry date |

---

# PART 6: WORKFLOWS & PROCESSES

## 6.1 Monthly Compliance Cycle

```
Day 1-5: Previous month data collection
    │
    ▼
Day 5-10: Run reconciliations
    │
    ▼
Day 10-15: Resolve mismatches
    │
    ▼
Day 15-20: Prepare VAT return
    │
    ▼
Day 20-25: Review and adjustments
    │
    ▼
Day 25-28: File with FTA
    │
    ▼
FTA DEADLINE: 28th of month
```

## 6.2 E-Invoice Flow

```
Sales Invoice Created
        │
        ▼
┌───────────────────┐
│ Auto-create       │──No──┐
│ enabled?          │      │
└─────────┬─────────┘      │
          │ Yes            │
          ▼                ▼
┌───────────────────┐  Manual Create
│ Create E-Invoice  │◄─────┘
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Validate Fields   │
│ • TRN format      │
│ • Required fields │
│ • Amounts         │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐     ┌───────────────┐
│ Validation        │──No─│ Fix Errors    │
│ Passed?           │     └───────┬───────┘
└─────────┬─────────┘             │
          │ Yes                   │
          ▼                       │
┌───────────────────┐             │
│ Submit to ASP     │◄────────────┘
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ ASP Response      │
└─────────┬─────────┘
          │
    ┌─────┴─────┐
    │           │
    ▼           ▼
Accepted    Rejected
    │           │
    ▼           ▼
Store IRN   Log Error
Store QR    Notify User
```

## 6.3 Reconciliation Flow

```
Upload CSV from ASP
        │
        ▼
Create Reconciliation Run
        │
        ▼
Submit (triggers processing)
        │
        ▼
┌───────────────────────────────────────┐
│           MATCHING ENGINE             │
│                                       │
│  Pass 1: Exact Match                  │
│  ├── Match by Invoice Number          │
│  └── Compare Amounts                  │
│                                       │
│  Pass 2: Fuzzy Match (if enabled)     │
│  ├── Similarity scoring               │
│  └── Amount tolerance check           │
│                                       │
│  Result Classification:               │
│  ├── ✅ Matched                       │
│  ├── ⚠️ Mismatched                    │
│  ├── ❌ Missing in ASP                │
│  └── ❌ Missing in ERP                │
└───────────────────────────────────────┘
        │
        ▼
Generate Results & Report
        │
        ▼
Update Dashboard Metrics
```

## 6.4 VAT Return Flow

```
Create VAT Return
        │
        ▼
Generate from Books
        │
        ▼
┌───────────────────────────────────────┐
│         CALCULATION ENGINE            │
│                                       │
│  Fetch Sales Invoices ──────────────┐ │
│  ├── Standard rated × 5%            │ │
│  ├── Zero rated (no VAT)            │ │
│  └── Exempt (no VAT)                │ │
│                                     │ │
│  Fetch Purchase Invoices ───────────┤ │
│  ├── Standard rated × 5%            │ │
│  └── Reverse charge                 │ │
│                                     │ │
│  Calculate:                         │ │
│  Output VAT = Sales VAT             │ │
│  Input VAT = Purchase VAT           │ │
│  Net Due = Output - Input           │ │
└─────────────────────────────────────┘ │
        │
        ▼
Review & Adjust
        │
        ▼
Submit VAT Return
        │
        ▼
Generate FTA Report
        │
        ▼
File with FTA Portal
```

---

# PART 7: TROUBLESHOOTING

## 7.1 Common Errors

### "Company is required"
**Cause**: No company selected
**Solution**: Select a company from the dropdown

### "Invalid TRN format"
**Cause**: TRN is not 15 digits or fails checksum
**Solution**: Verify TRN is exactly 15 digits starting with 100-999

### "Date range exceeds limit"
**Cause**: From/To date span is too large
**Solution**: Use date range within 365 days

### "No CSV import found"
**Cause**: CSV not uploaded for selected period
**Solution**: Upload CSV before running reconciliation

### "ASP connection failed"
**Cause**: API credentials invalid or network issue
**Solution**:
1. Check ASP Connection settings
2. Verify API credentials
3. Test connection

### "IRN generation failed"
**Cause**: ASP rejected the invoice
**Solution**:
1. Check error message from ASP
2. Verify all required fields
3. Ensure TRN is valid
4. Retry submission

## 7.2 Reconciliation Issues

### Low Match Rate

**Possible Causes**:
1. Invoice number format differences
2. Date format mismatches
3. Amount rounding differences

**Solutions**:
1. Enable fuzzy matching
2. Increase tolerance amount
3. Check CSV column mapping
4. Verify invoice number formats match

### Missing in ASP

**Meaning**: Invoice exists in ERP but not reported to ASP

**Risk**: FTA penalty (AED 5,000 per invoice)

**Action**:
1. Verify invoice was submitted to ASP
2. Check ASP submission logs
3. Re-submit missing invoices

### Missing in ERP

**Meaning**: Invoice in ASP but not in ERP

**Possible Causes**:
1. Invoice created directly in ASP
2. Data entry error
3. Timing difference

**Action**:
1. Verify with ASP records
2. Create missing invoice in ERP
3. Re-run reconciliation

## 7.3 Performance Issues

### Slow Dashboard Loading

**Solutions**:
1. Refresh browser cache (Ctrl+Shift+R)
2. Clear site cache (Admin only)
3. Reduce date range for metrics

### Form Saving Slowly

**Solutions**:
1. Check network connection
2. Reduce number of line items
3. Save more frequently

### CSV Import Timeout

**Solutions**:
1. Split large files into smaller batches
2. Increase batch_size setting
3. Check file format (UTF-8 recommended)

## 7.4 Access Issues

### "Permission Denied"

**Cause**: User role doesn't have access

**Solution**: Contact administrator to:
1. Assign correct role
2. Add User Permission for company

### "Page Not Found"

**Cause**: Page doesn't exist or no access

**Solution**:
1. Check URL is correct
2. Verify user has page access
3. Clear browser cache

### "Session Expired"

**Cause**: Inactive too long

**Solution**: Log in again

---

# PART 8: TECHNICAL REFERENCE

## 8.1 System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      BROWSER                             │
│  ┌─────────────────────────────────────────────────┐    │
│  │              DigiComply UI                       │    │
│  │  • digicomply.js (1,953 lines)                  │    │
│  │  • digicomply.css (1,800+ lines)                │    │
│  │  • Page-specific JS files                        │    │
│  └─────────────────────────────────────────────────┘    │
└───────────────────────────┬─────────────────────────────┘
                            │ HTTP/REST API
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    FRAPPE SERVER                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │              DigiComply Backend                  │    │
│  │  • 49 DocTypes                                   │    │
│  │  • 12 Custom Pages                               │    │
│  │  • API Endpoints                                 │    │
│  │  • Background Jobs                               │    │
│  └─────────────────────────────────────────────────┘    │
└───────────────────────────┬─────────────────────────────┘
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │  MySQL   │  │  Redis   │  │  Files   │
        │ Database │  │  Cache   │  │ Storage  │
        └──────────┘  └──────────┘  └──────────┘
```

## 8.2 External Integrations

```
┌─────────────┐         ┌─────────────┐
│  DigiComply │◄───────►│  ClearTax   │
│             │         └─────────────┘
│             │         ┌─────────────┐
│             │◄───────►│   Cygnet    │
│             │         └─────────────┘
│             │         ┌─────────────┐
│             │◄───────►│    Zoho     │
│             │         └─────────────┘
│             │         ┌─────────────┐
│             │◄───────►│  Tabadul    │
│             │         └─────────────┘
│             │         ┌─────────────┐
│             │◄───────►│   FTA API   │
└─────────────┘         └─────────────┘
```

## 8.3 Data Flow

### Reconciliation Data Flow
```
CSV File ──► CSV Import ──► Parsed Data
                               │
ERP Data ──────────────────────┤
                               ▼
                      Matching Engine
                               │
                               ▼
                    Reconciliation Items
                               │
                               ▼
                      Mismatch Report
```

### E-Invoice Data Flow
```
Sales Invoice ──► E-Invoice ──► Validation
                                    │
                                    ▼
                              ASP Submission
                                    │
                                    ▼
                              ASP Response
                                    │
                         ┌──────────┴──────────┐
                         ▼                     ▼
                    IRN + QR              Error Log
                    Stored                 Created
```

## 8.4 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/method/digicomply.api.get_dashboard_data` | GET | Dashboard metrics |
| `/api/method/digicomply.api.quick_reconcile` | POST | Quick reconciliation |
| `/api/method/digicomply.api.validate_trn_with_fta` | POST | TRN validation |
| `/api/method/digicomply.api.generate_audit_pack` | POST | Generate PDF report |
| `/api/resource/Reconciliation Run` | CRUD | Reconciliation records |
| `/api/resource/E Invoice` | CRUD | E-invoice records |
| `/api/resource/VAT Return` | CRUD | VAT return records |

## 8.5 File Locations

| Component | Path |
|-----------|------|
| JavaScript | `public/js/digicomply.js` |
| CSS | `public/css/digicomply.css` |
| DocTypes | `digicomply/doctype/*/` |
| Pages | `digicomply/page/*/` |
| API | `digicomply/api/` |
| Templates | `templates/` |
| Error Pages | `www/` |

## 8.6 Configuration Files

| File | Purpose |
|------|---------|
| `hooks.py` | App hooks and settings |
| `boot.py` | Session initialization |
| `modules.txt` | Module registration |
| `patches.txt` | Database patches |

---

# APPENDICES

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| **ASP** | Accredited Service Provider - Government-authorized e-invoice processor |
| **FTA** | Federal Tax Authority - UAE tax authority |
| **IRN** | Invoice Reference Number - Unique ID from ASP |
| **TRN** | Tax Registration Number - 15-digit VAT registration |
| **QR Code** | Quick Response code containing invoice data |
| **TLV** | Tag-Length-Value encoding format for QR codes |
| **VAT** | Value Added Tax - Currently 5% in UAE |
| **Reverse Charge** | Buyer self-assesses VAT (Article 37) |
| **FAF** | FTA Audit File - Compliance report format |

## Appendix B: FTA Deadlines

| Filing | Deadline | Frequency |
|--------|----------|-----------|
| E-Invoice | 28th of following month | Monthly |
| VAT Return (Monthly) | 28th of following month | Monthly |
| VAT Return (Quarterly) | 28th of month after quarter | Quarterly |
| FAF Submission | Upon FTA request | As needed |

## Appendix C: Penalty Reference

| Violation | Penalty |
|-----------|---------|
| Unreported invoice | AED 5,000 per invoice |
| Late VAT filing | AED 1,000 first time, AED 2,000+ repeat |
| Incorrect VAT return | 50% of unpaid tax |
| Missing e-invoice | AED 5,000 per invoice |

## Appendix D: Support

**Email**: support@digicomply.ae

**Common Support Requests**:
1. Password reset
2. Role assignment
3. Company access
4. API credentials
5. Training sessions

---

**End of Training Manual**

*DigiComply - UAE E-Invoicing Compliance Platform*
*Version 1.0.0*
