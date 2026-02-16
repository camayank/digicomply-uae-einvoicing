# DigiComply Branding & Customization Design

## Overview

Transform the Frappe/ERPNext experience into a DigiComply-branded UAE e-invoicing compliance platform using hook-based customization (no core modifications).

## Requirements

- **Modules**: Full Finance (Accounting, Selling, Buying, Receivables, Payables) + DigiComply
- **Branding**: DigiComply Primary - no Frappe/ERPNext branding visible anywhere
- **Setup**: Custom DigiComply wizard focused on UAE compliance

## Approach

Hook-based customization using Frappe's built-in extension points. Clean, upgrade-safe, follows best practices.

---

## Section 1: Branding & Logo

### Logo Files
Add to `public/images/`:
- `logo.png` - navbar (40px height)
- `logo-full.png` - login page (200px width)
- `favicon.png` - browser tab

### Fixtures (auto-configured on install)
- Website Settings: `app_logo`, `app_name` = "DigiComply"
- Navbar Settings: `app_logo`, `brand_html` = "DigiComply"
- System Settings: `app_name` = "DigiComply"

### CSS Brand Colors
- Primary: `#1e40af` (UAE blue)
- Accent: `#dc2626` (UAE red)

### Remove Frappe Branding
- Remove "Powered by Frappe" footer
- Override page titles
- Hide About dialog Frappe version
- Remove Frappe help links

### Files
- `hooks.py` - fixtures
- `setup/install.py` - configure settings
- `public/css/digicomply.css` - brand colors
- `public/images/` - logos
- `templates/pages/login.html` - custom login

---

## Section 2: Module Visibility

### Hide Workspaces
Via `boot_session` hook, hide:
- Manufacturing, Stock, Assets, CRM, Projects, Quality, Support, HR

### Keep Workspaces
- Accounting, Selling, Buying, Receivables, Payables, Home

### DigiComply Workspace
New workspace with shortcuts:
- Compliance Dashboard
- Reconciliation Run
- CSV Import
- Mismatch Report
- DigiComply Settings

### Files
- `hooks.py` - `boot_session` hook
- `digicomply/boot.py` - filter modules
- `digicomply/workspace/digicomply/digicomply.json`

---

## Section 3: Custom Setup Wizard

### Steps
1. **Company** - Name, TRN, Logo
2. **Currency** - AED pre-selected, fiscal year
3. **ASP Connection** - Select provider (ClearTax, Zoho, Cygnet)
4. **Users** - Add team members
5. **Complete** - Show dashboard

### UAE Defaults (auto-configured)
- Country: United Arab Emirates
- Currency: AED
- Chart of Accounts: UAE Standard
- VAT rate: 5%
- Date format: dd-mm-yyyy

### Files
- `digicomply/page/digicomply_setup/` - wizard page
- `hooks.py` - redirect setup-wizard
- `setup/defaults.py` - UAE defaults

---

## Section 4: Home Page & Navigation

### Default Home
- After login → `/app/compliance-dashboard`
- Show compliance score, recent reconciliations, pending actions

### Navbar
- Left: DigiComply logo
- Center: Search bar
- Right: Notifications, User menu
- Remove: Help link to Frappe docs

### Sidebar Order
1. DigiComply (first)
2. Accounting
3. Selling
4. Buying
5. Receivables
6. Payables

### User Menu
- Remove: Documentation, About
- Keep: Settings, Logout

### Files
- `hooks.py` - `home_page`
- `boot.py` - navbar customization
- `public/js/digicomply.js` - override help/about

---

## File Summary

| File | Purpose |
|------|---------|
| `hooks.py` | All hook configurations |
| `boot.py` | Boot session customization |
| `setup/install.py` | Post-install configuration |
| `setup/defaults.py` | UAE default values |
| `public/css/digicomply.css` | Brand colors, styling |
| `public/js/digicomply.js` | JS overrides for branding |
| `public/images/logo.png` | Navbar logo |
| `public/images/logo-full.png` | Login page logo |
| `public/images/favicon.png` | Browser favicon |
| `templates/pages/login.html` | Custom login page |
| `page/digicomply_setup/` | Custom setup wizard |
| `workspace/digicomply/` | DigiComply workspace |

---

## Success Criteria

1. User sees only "DigiComply" branding throughout
2. No Frappe/ERPNext names visible anywhere
3. Only relevant finance modules visible
4. Custom setup wizard collects UAE compliance info
5. Dashboard is default landing page after login
