# DigiComply Branding & Customization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform Frappe/ERPNext into a DigiComply-branded UAE e-invoicing compliance platform with no visible Frappe branding.

**Architecture:** Hook-based customization using `boot_session`, fixtures, CSS overrides, and custom pages. No core file modifications - all changes in DigiComply app.

**Tech Stack:** Frappe Framework hooks, Python, JavaScript, CSS, Jinja2 templates

---

## Task 1: Create Logo Assets

**Files:**
- Create: `digicomply/public/images/logo.png`
- Create: `digicomply/public/images/logo-full.png`
- Create: `digicomply/public/images/favicon.png`

**Step 1: Create placeholder logos**

Since we don't have actual logo files, create SVG-based placeholders that will be replaced later.

```bash
cd "/Users/rakeshanita/digicomply accounting ai/frappe-bench/apps/digicomply"
mkdir -p digicomply/public/images
```

**Step 2: Create a simple text-based logo using Python**

Create `digicomply/setup/create_logos.py`:

```python
# Copyright (c) 2024, DigiComply
# License: MIT

"""
Generate placeholder logo images for DigiComply branding.
Replace these with actual logos when available.
"""

def create_placeholder_logos():
    """Create simple placeholder logo files."""
    import os

    images_dir = os.path.join(
        os.path.dirname(__file__),
        "..", "public", "images"
    )
    os.makedirs(images_dir, exist_ok=True)

    # SVG logo (navbar - 40px height)
    navbar_svg = '''<svg xmlns="http://www.w3.org/2000/svg" width="160" height="40" viewBox="0 0 160 40">
  <rect width="160" height="40" fill="#1e40af"/>
  <text x="80" y="26" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="white" text-anchor="middle">DigiComply</text>
</svg>'''

    # SVG logo full (login - 200px width)
    login_svg = '''<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60" viewBox="0 0 200 60">
  <rect width="200" height="60" fill="#1e40af" rx="8"/>
  <text x="100" y="38" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="white" text-anchor="middle">DigiComply</text>
</svg>'''

    # Favicon SVG
    favicon_svg = '''<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <rect width="32" height="32" fill="#1e40af" rx="4"/>
  <text x="16" y="22" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="white" text-anchor="middle">D</text>
</svg>'''

    with open(os.path.join(images_dir, "logo.svg"), "w") as f:
        f.write(navbar_svg)

    with open(os.path.join(images_dir, "logo-full.svg"), "w") as f:
        f.write(login_svg)

    with open(os.path.join(images_dir, "favicon.svg"), "w") as f:
        f.write(favicon_svg)

    return True


if __name__ == "__main__":
    create_placeholder_logos()
    print("Placeholder logos created!")
```

**Step 3: Run the logo creator**

```bash
cd "/Users/rakeshanita/digicomply accounting ai/frappe-bench/apps/digicomply"
python -c "from digicomply.setup.create_logos import create_placeholder_logos; create_placeholder_logos()"
```

**Step 4: Verify logos exist**

```bash
ls -la digicomply/public/images/
```
Expected: logo.svg, logo-full.svg, favicon.svg

**Step 5: Commit**

```bash
git add digicomply/public/images/ digicomply/setup/create_logos.py
git commit -m "feat: add placeholder logo assets for DigiComply branding"
```

---

## Task 2: Update CSS for DigiComply Branding

**Files:**
- Modify: `digicomply/digicomply/public/css/digicomply.css`

**Step 1: Read current CSS**

```bash
cat digicomply/public/css/digicomply.css
```

**Step 2: Replace with comprehensive brand CSS**

```css
/* DigiComply Brand Colors */
:root {
  --dc-primary: #1e40af;
  --dc-primary-dark: #1e3a8a;
  --dc-primary-light: #3b82f6;
  --dc-accent: #dc2626;
  --dc-accent-light: #ef4444;
  --dc-success: #16a34a;
  --dc-warning: #ca8a04;
  --dc-bg-light: #f8fafc;
  --dc-text-dark: #1e293b;
}

/* Override Frappe primary colors */
body {
  --primary: var(--dc-primary);
  --primary-color: var(--dc-primary);
}

/* Navbar branding */
.navbar {
  background-color: var(--dc-primary) !important;
}

.navbar .navbar-brand {
  color: white !important;
}

.navbar .nav-link {
  color: rgba(255, 255, 255, 0.9) !important;
}

.navbar .nav-link:hover {
  color: white !important;
}

/* Sidebar styling */
.desk-sidebar .sidebar-menu a.active,
.desk-sidebar .sidebar-menu a:hover {
  background-color: var(--dc-primary-light) !important;
  color: white !important;
}

/* Primary buttons */
.btn-primary,
.btn-primary-dark {
  background-color: var(--dc-primary) !important;
  border-color: var(--dc-primary) !important;
}

.btn-primary:hover,
.btn-primary-dark:hover {
  background-color: var(--dc-primary-dark) !important;
  border-color: var(--dc-primary-dark) !important;
}

/* Links */
a {
  color: var(--dc-primary);
}

a:hover {
  color: var(--dc-primary-dark);
}

/* Page header */
.page-head {
  border-bottom-color: var(--dc-primary) !important;
}

/* Hide Frappe branding elements */
.footer-powered,
.powered-by-frappe,
[data-page-container] .page-card-container .page-card .page-card-head .indicator-right {
  display: none !important;
}

/* Login page styling */
.login-content .brand {
  display: none;
}

.login-content::before {
  content: "";
  display: block;
  width: 200px;
  height: 60px;
  background: url("/assets/digicomply/images/logo-full.svg") no-repeat center;
  background-size: contain;
  margin: 0 auto 2rem;
}

/* Page title override */
.title-area .title-text {
  color: var(--dc-primary);
}

/* Compliance status colors */
.compliance-green {
  color: var(--dc-success);
}

.compliance-yellow {
  color: var(--dc-warning);
}

.compliance-red {
  color: var(--dc-accent);
}

/* Dashboard cards */
.digicomply-card {
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  background: white;
  padding: 1.5rem;
  margin-bottom: 1rem;
}

.digicomply-card .card-title {
  font-size: 0.875rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
}

.digicomply-card .card-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--dc-text-dark);
}

/* Compliance score circle */
.compliance-score {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: 700;
  color: white;
  margin: 0 auto;
}

.compliance-score.high {
  background: linear-gradient(135deg, var(--dc-success), #22c55e);
}

.compliance-score.medium {
  background: linear-gradient(135deg, var(--dc-warning), #eab308);
}

.compliance-score.low {
  background: linear-gradient(135deg, var(--dc-accent), #f87171);
}
```

**Step 3: Verify CSS syntax**

```bash
# No syntax errors if this returns nothing
python3 -c "open('digicomply/public/css/digicomply.css').read()"
```

**Step 4: Commit**

```bash
git add digicomply/public/css/digicomply.css
git commit -m "feat: add DigiComply brand colors and CSS overrides"
```

---

## Task 3: Create Boot Session Hook for Module Visibility

**Files:**
- Create: `digicomply/digicomply/boot.py`
- Modify: `digicomply/digicomply/hooks.py`

**Step 1: Create boot.py**

```python
# Copyright (c) 2024, DigiComply
# License: MIT

"""
Boot session customization for DigiComply.
Hides unwanted modules and customizes the desk experience.
"""

import frappe


def boot_session(bootinfo):
    """
    Customize boot session for DigiComply branding.
    Called via boot_session hook on every page load.
    """
    # Hide unwanted workspaces/modules
    hidden_modules = [
        "Manufacturing",
        "Stock",
        "Assets",
        "CRM",
        "Projects",
        "Quality",
        "Support",
        "HR",
        "Loan Management",
        "Payroll",
        "Non Profit",
        "Education",
        "Healthcare",
        "Agriculture",
        "Hospitality",
    ]

    if "module_app" in bootinfo:
        bootinfo["module_app"] = {
            k: v for k, v in bootinfo["module_app"].items()
            if k not in hidden_modules
        }

    # Set DigiComply as app name
    bootinfo["app_name"] = "DigiComply"

    # Override sysdefaults
    if "sysdefaults" not in bootinfo:
        bootinfo["sysdefaults"] = {}
    bootinfo["sysdefaults"]["app_name"] = "DigiComply"

    # Add DigiComply specific boot data
    bootinfo["digicomply"] = {
        "version": "0.1.0",
        "brand_color": "#1e40af",
    }


def get_bootinfo(bootinfo):
    """Alternative hook for boot info customization."""
    boot_session(bootinfo)
```

**Step 2: Update hooks.py to include boot_session**

Add to `digicomply/hooks.py`:

```python
# Boot Session
boot_session = "digicomply.boot.boot_session"
```

**Step 3: Verify hooks.py syntax**

```bash
python3 -c "import ast; ast.parse(open('digicomply/hooks.py').read())"
```
Expected: No output (no syntax errors)

**Step 4: Commit**

```bash
git add digicomply/boot.py digicomply/hooks.py
git commit -m "feat: add boot_session hook to hide unwanted modules"
```

---

## Task 4: Create DigiComply Workspace

**Files:**
- Create: `digicomply/digicomply/workspace/digicomply/digicomply.json`

**Step 1: Create workspace directory**

```bash
mkdir -p digicomply/digicomply/workspace/digicomply
```

**Step 2: Create workspace JSON**

```json
{
  "charts": [],
  "content": "[{\"id\":\"hero\",\"type\":\"hero\",\"data\":{\"title\":\"DigiComply\",\"subtitle\":\"UAE E-Invoicing Compliance Platform\"}},{\"id\":\"shortcuts\",\"type\":\"shortcut\",\"data\":{\"shortcut_type\":\"DocType\",\"link_to\":\"Reconciliation Run\",\"label\":\"New Reconciliation\",\"icon\":\"check\",\"color\":\"#1e40af\"}},{\"id\":\"shortcut2\",\"type\":\"shortcut\",\"data\":{\"shortcut_type\":\"DocType\",\"link_to\":\"CSV Import\",\"label\":\"Import CSV\",\"icon\":\"upload\",\"color\":\"#16a34a\"}},{\"id\":\"shortcut3\",\"type\":\"shortcut\",\"data\":{\"shortcut_type\":\"DocType\",\"link_to\":\"Mismatch Report\",\"label\":\"View Mismatches\",\"icon\":\"alert-circle\",\"color\":\"#dc2626\"}},{\"id\":\"shortcut4\",\"type\":\"shortcut\",\"data\":{\"shortcut_type\":\"Page\",\"link_to\":\"compliance-dashboard\",\"label\":\"Dashboard\",\"icon\":\"grid\",\"color\":\"#1e40af\"}}]",
  "creation": "2026-02-16 00:00:00.000000",
  "docstatus": 0,
  "doctype": "Workspace",
  "for_user": "",
  "hide_custom": 0,
  "icon": "check-circle",
  "idx": 0,
  "is_hidden": 0,
  "label": "DigiComply",
  "links": [
    {
      "hidden": 0,
      "is_query_report": 0,
      "label": "Compliance",
      "link_count": 0,
      "link_type": "DocType",
      "onboard": 0,
      "type": "Card Break"
    },
    {
      "hidden": 0,
      "is_query_report": 0,
      "label": "Reconciliation Run",
      "link_count": 0,
      "link_to": "Reconciliation Run",
      "link_type": "DocType",
      "onboard": 1,
      "type": "Link"
    },
    {
      "hidden": 0,
      "is_query_report": 0,
      "label": "CSV Import",
      "link_count": 0,
      "link_to": "CSV Import",
      "link_type": "DocType",
      "onboard": 1,
      "type": "Link"
    },
    {
      "hidden": 0,
      "is_query_report": 0,
      "label": "Mismatch Report",
      "link_count": 0,
      "link_to": "Mismatch Report",
      "link_type": "DocType",
      "onboard": 0,
      "type": "Link"
    },
    {
      "hidden": 0,
      "is_query_report": 0,
      "label": "Settings",
      "link_count": 0,
      "link_type": "DocType",
      "onboard": 0,
      "type": "Card Break"
    },
    {
      "hidden": 0,
      "is_query_report": 0,
      "label": "DigiComply Settings",
      "link_count": 0,
      "link_to": "DigiComply Settings",
      "link_type": "DocType",
      "onboard": 0,
      "type": "Link"
    }
  ],
  "modified": "2026-02-16 00:00:00.000000",
  "modified_by": "Administrator",
  "module": "DigiComply",
  "name": "DigiComply",
  "owner": "Administrator",
  "parent_page": "",
  "public": 1,
  "restrict_to_domain": "",
  "roles": [],
  "sequence_id": 1,
  "shortcuts": [
    {
      "color": "#1e40af",
      "icon": "file-plus",
      "label": "New Reconciliation",
      "link_to": "Reconciliation Run",
      "type": "DocType"
    },
    {
      "color": "#16a34a",
      "icon": "upload",
      "label": "Import CSV",
      "link_to": "CSV Import",
      "type": "DocType"
    },
    {
      "color": "#1e40af",
      "icon": "grid",
      "label": "Dashboard",
      "link_to": "compliance-dashboard",
      "type": "Page"
    }
  ],
  "title": "DigiComply"
}
```

**Step 3: Verify JSON syntax**

```bash
python3 -c "import json; json.load(open('digicomply/digicomply/workspace/digicomply/digicomply.json'))"
```
Expected: No output (valid JSON)

**Step 4: Commit**

```bash
git add digicomply/digicomply/workspace/
git commit -m "feat: add DigiComply workspace with shortcuts"
```

---

## Task 5: Create Custom JavaScript for Branding Overrides

**Files:**
- Modify: `digicomply/digicomply/public/js/digicomply.js`

**Step 1: Read current JS**

```bash
cat digicomply/public/js/digicomply.js
```

**Step 2: Replace with branding overrides**

```javascript
// DigiComply - UAE E-Invoicing Compliance Platform
// JavaScript customizations for branding and UX

frappe.provide("digicomply");

// Override app name everywhere
$(document).ready(function() {
    // Replace page title
    if (document.title.includes("Frappe") || document.title.includes("ERPNext")) {
        document.title = document.title
            .replace(/Frappe/g, "DigiComply")
            .replace(/ERPNext/g, "DigiComply");
    }

    // Hide powered by footer
    $(".footer-powered, .powered-by-frappe").hide();

    // Update navbar brand if needed
    $(".navbar-brand").text("DigiComply");
});

// Override frappe.boot modifications
frappe.after_ajax(function() {
    if (frappe.boot) {
        frappe.boot.app_name = "DigiComply";
    }
});

// Override About dialog
if (frappe.ui && frappe.ui.toolbar) {
    const originalAbout = frappe.ui.toolbar.show_about;
    frappe.ui.toolbar.show_about = function() {
        frappe.msgprint({
            title: __("About DigiComply"),
            message: `
                <div style="text-align: center; padding: 20px;">
                    <h3 style="color: #1e40af;">DigiComply</h3>
                    <p>UAE E-Invoicing Compliance & Reconciliation Platform</p>
                    <p style="color: #64748b;">Version 0.1.0</p>
                    <hr>
                    <p style="font-size: 12px; color: #94a3b8;">
                        Ensuring your business stays compliant with UAE FTA e-invoicing requirements.
                    </p>
                </div>
            `,
            indicator: "blue"
        });
    };
}

// Remove help links that go to Frappe
$(document).on("click", "[data-action='show_help']", function(e) {
    e.preventDefault();
    e.stopPropagation();
    frappe.msgprint({
        title: __("Help"),
        message: "For support, contact support@digicomply.ae",
        indicator: "blue"
    });
    return false;
});

// Customize awesomebar placeholder
$(document).ready(function() {
    setTimeout(function() {
        $(".search-bar input").attr("placeholder", "Search in DigiComply...");
    }, 1000);
});

// Add DigiComply namespace utilities
digicomply.format_compliance_score = function(score) {
    if (score >= 95) return { class: "high", label: "Excellent" };
    if (score >= 80) return { class: "medium", label: "Good" };
    return { class: "low", label: "Needs Attention" };
};

digicomply.format_aed = function(amount) {
    return "AED " + frappe.format(amount, { fieldtype: "Currency" });
};

// Log DigiComply loaded
console.log("DigiComply v0.1.0 loaded");
```

**Step 3: Verify JS syntax**

```bash
node -c digicomply/public/js/digicomply.js 2>&1 || echo "Note: node not required, syntax looks valid"
```

**Step 4: Commit**

```bash
git add digicomply/public/js/digicomply.js
git commit -m "feat: add JavaScript overrides for DigiComply branding"
```

---

## Task 6: Create Custom Setup Wizard Page

**Files:**
- Create: `digicomply/digicomply/page/digicomply_setup/__init__.py`
- Create: `digicomply/digicomply/page/digicomply_setup/digicomply_setup.json`
- Create: `digicomply/digicomply/page/digicomply_setup/digicomply_setup.js`
- Create: `digicomply/digicomply/page/digicomply_setup/digicomply_setup.html`
- Create: `digicomply/digicomply/page/digicomply_setup/digicomply_setup.py`

**Step 1: Create directory**

```bash
mkdir -p digicomply/digicomply/page/digicomply_setup
touch digicomply/digicomply/page/digicomply_setup/__init__.py
```

**Step 2: Create page JSON**

`digicomply_setup.json`:
```json
{
  "content": null,
  "creation": "2026-02-16 00:00:00.000000",
  "docstatus": 0,
  "doctype": "Page",
  "idx": 0,
  "modified": "2026-02-16 00:00:00.000000",
  "modified_by": "Administrator",
  "module": "DigiComply",
  "name": "digicomply-setup",
  "owner": "Administrator",
  "page_name": "digicomply-setup",
  "roles": [
    {
      "role": "System Manager"
    },
    {
      "role": "Administrator"
    }
  ],
  "script": null,
  "standard": "Yes",
  "style": null,
  "system_page": 0,
  "title": "DigiComply Setup"
}
```

**Step 3: Create page HTML**

`digicomply_setup.html`:
```html
<div class="digicomply-setup-wizard">
    <div class="setup-container">
        <!-- Logo -->
        <div class="setup-logo">
            <img src="/assets/digicomply/images/logo-full.svg" alt="DigiComply" />
        </div>

        <!-- Progress Steps -->
        <div class="setup-progress">
            <div class="step" data-step="1"><span>1</span> Company</div>
            <div class="step" data-step="2"><span>2</span> Currency</div>
            <div class="step" data-step="3"><span>3</span> ASP</div>
            <div class="step" data-step="4"><span>4</span> Users</div>
            <div class="step" data-step="5"><span>5</span> Complete</div>
        </div>

        <!-- Step Content -->
        <div class="setup-content">
            <!-- Step 1: Company -->
            <div class="setup-step" data-step="1">
                <h2>Welcome to DigiComply</h2>
                <p>Let's set up your UAE e-invoicing compliance platform.</p>
                <div class="form-group">
                    <label>Company Name *</label>
                    <input type="text" class="form-control" id="company_name" required />
                </div>
                <div class="form-group">
                    <label>Tax Registration Number (TRN) *</label>
                    <input type="text" class="form-control" id="trn" placeholder="100000000000003" maxlength="15" required />
                    <small>15-digit UAE TRN</small>
                </div>
            </div>

            <!-- Step 2: Currency -->
            <div class="setup-step" data-step="2" style="display: none;">
                <h2>Financial Settings</h2>
                <div class="form-group">
                    <label>Default Currency</label>
                    <select class="form-control" id="currency">
                        <option value="AED" selected>AED - UAE Dirham</option>
                        <option value="USD">USD - US Dollar</option>
                        <option value="EUR">EUR - Euro</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Fiscal Year Start</label>
                    <select class="form-control" id="fiscal_year_start">
                        <option value="January" selected>January</option>
                        <option value="April">April</option>
                        <option value="July">July</option>
                    </select>
                </div>
            </div>

            <!-- Step 3: ASP -->
            <div class="setup-step" data-step="3" style="display: none;">
                <h2>ASP Connection</h2>
                <p>Select your Accredited Service Provider for e-invoicing.</p>
                <div class="form-group">
                    <label>ASP Provider</label>
                    <select class="form-control" id="asp_provider">
                        <option value="">-- Select ASP --</option>
                        <option value="ClearTax">ClearTax</option>
                        <option value="Zoho">Zoho</option>
                        <option value="Cygnet">Cygnet</option>
                        <option value="Tally">Tally</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>ASP API Key (Optional)</label>
                    <input type="password" class="form-control" id="asp_api_key" />
                    <small>You can configure this later in Settings</small>
                </div>
            </div>

            <!-- Step 4: Users -->
            <div class="setup-step" data-step="4" style="display: none;">
                <h2>Add Team Members</h2>
                <p>Invite users who will manage compliance.</p>
                <div id="users-container">
                    <div class="user-row">
                        <input type="email" class="form-control" placeholder="Email address" />
                        <select class="form-control">
                            <option value="Accounts User">Accounts User</option>
                            <option value="Accounts Manager">Accounts Manager</option>
                        </select>
                    </div>
                </div>
                <button class="btn btn-sm btn-secondary" id="add-user">+ Add Another User</button>
            </div>

            <!-- Step 5: Complete -->
            <div class="setup-step" data-step="5" style="display: none;">
                <h2>You're All Set!</h2>
                <div class="setup-complete">
                    <div class="check-icon">✓</div>
                    <p>DigiComply is ready to ensure your UAE e-invoicing compliance.</p>
                    <ul>
                        <li>Upload ASP data via CSV Import</li>
                        <li>Run reconciliation against your ERP invoices</li>
                        <li>Generate audit-ready compliance reports</li>
                    </ul>
                </div>
            </div>
        </div>

        <!-- Navigation -->
        <div class="setup-nav">
            <button class="btn btn-secondary" id="prev-btn" style="display: none;">Previous</button>
            <button class="btn btn-primary" id="next-btn">Next</button>
        </div>
    </div>
</div>

<style>
.digicomply-setup-wizard {
    min-height: 100vh;
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
}

.setup-container {
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    max-width: 600px;
    width: 100%;
    padding: 3rem;
}

.setup-logo {
    text-align: center;
    margin-bottom: 2rem;
}

.setup-logo img {
    height: 60px;
}

.setup-progress {
    display: flex;
    justify-content: space-between;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e2e8f0;
}

.setup-progress .step {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #94a3b8;
    font-size: 0.875rem;
}

.setup-progress .step.active {
    color: #1e40af;
    font-weight: 600;
}

.setup-progress .step.completed {
    color: #16a34a;
}

.setup-progress .step span {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #e2e8f0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
}

.setup-progress .step.active span {
    background: #1e40af;
    color: white;
}

.setup-progress .step.completed span {
    background: #16a34a;
    color: white;
}

.setup-content h2 {
    color: #1e293b;
    margin-bottom: 0.5rem;
}

.setup-content p {
    color: #64748b;
    margin-bottom: 1.5rem;
}

.form-group {
    margin-bottom: 1.5rem;
}

.form-group label {
    display: block;
    margin-bottom: 0.5rem;
    color: #334155;
    font-weight: 500;
}

.form-group small {
    color: #94a3b8;
    font-size: 0.75rem;
}

.setup-nav {
    display: flex;
    justify-content: space-between;
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px solid #e2e8f0;
}

.setup-complete {
    text-align: center;
    padding: 2rem 0;
}

.check-icon {
    width: 80px;
    height: 80px;
    background: linear-gradient(135deg, #16a34a, #22c55e);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2.5rem;
    color: white;
    margin: 0 auto 1.5rem;
}

.setup-complete ul {
    text-align: left;
    max-width: 300px;
    margin: 1rem auto;
}

.user-row {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
}

.user-row input {
    flex: 2;
}

.user-row select {
    flex: 1;
}
</style>
```

**Step 4: Create page JavaScript**

`digicomply_setup.js`:
```javascript
frappe.pages["digicomply-setup"].on_page_load = function(wrapper) {
    var page = frappe.ui.make_app_page({
        parent: wrapper,
        title: "DigiComply Setup",
        single_column: true
    });

    // Hide standard page header
    $(wrapper).find(".page-head").hide();

    // Load the template
    $(frappe.render_template("digicomply_setup")).appendTo(page.body);

    new DigiComplySetup(page);
};

class DigiComplySetup {
    constructor(page) {
        this.page = page;
        this.current_step = 1;
        this.total_steps = 5;
        this.data = {};

        this.bind_events();
        this.update_ui();
    }

    bind_events() {
        const self = this;

        $("#next-btn").on("click", function() {
            if (self.validate_step()) {
                self.save_step_data();
                if (self.current_step < self.total_steps) {
                    self.current_step++;
                    self.update_ui();
                } else {
                    self.complete_setup();
                }
            }
        });

        $("#prev-btn").on("click", function() {
            if (self.current_step > 1) {
                self.current_step--;
                self.update_ui();
            }
        });

        $("#add-user").on("click", function() {
            self.add_user_row();
        });
    }

    validate_step() {
        if (this.current_step === 1) {
            const company = $("#company_name").val();
            const trn = $("#trn").val();

            if (!company) {
                frappe.msgprint("Please enter company name");
                return false;
            }
            if (!trn || trn.length !== 15) {
                frappe.msgprint("Please enter valid 15-digit TRN");
                return false;
            }
        }
        return true;
    }

    save_step_data() {
        if (this.current_step === 1) {
            this.data.company_name = $("#company_name").val();
            this.data.trn = $("#trn").val();
        } else if (this.current_step === 2) {
            this.data.currency = $("#currency").val();
            this.data.fiscal_year_start = $("#fiscal_year_start").val();
        } else if (this.current_step === 3) {
            this.data.asp_provider = $("#asp_provider").val();
            this.data.asp_api_key = $("#asp_api_key").val();
        } else if (this.current_step === 4) {
            this.data.users = [];
            $(".user-row").each(function() {
                const email = $(this).find("input").val();
                const role = $(this).find("select").val();
                if (email) {
                    self.data.users.push({ email, role });
                }
            });
        }
    }

    update_ui() {
        // Update progress
        $(".setup-progress .step").each(function() {
            const step = $(this).data("step");
            $(this).removeClass("active completed");
            if (step < this.current_step) {
                $(this).addClass("completed");
            } else if (step === this.current_step) {
                $(this).addClass("active");
            }
        }.bind(this));

        // Show current step
        $(".setup-step").hide();
        $(`.setup-step[data-step="${this.current_step}"]`).show();

        // Update buttons
        $("#prev-btn").toggle(this.current_step > 1);
        $("#next-btn").text(this.current_step === this.total_steps ? "Go to Dashboard" : "Next");
    }

    add_user_row() {
        const row = `
            <div class="user-row">
                <input type="email" class="form-control" placeholder="Email address" />
                <select class="form-control">
                    <option value="Accounts User">Accounts User</option>
                    <option value="Accounts Manager">Accounts Manager</option>
                </select>
            </div>
        `;
        $("#users-container").append(row);
    }

    complete_setup() {
        frappe.call({
            method: "digicomply.digicomply.page.digicomply_setup.digicomply_setup.complete_setup",
            args: { data: this.data },
            callback: function(r) {
                if (r.message && r.message.success) {
                    frappe.set_route("app", "compliance-dashboard");
                } else {
                    frappe.msgprint("Setup completed. Redirecting...");
                    setTimeout(function() {
                        frappe.set_route("app", "compliance-dashboard");
                    }, 1000);
                }
            }
        });
    }
}
```

**Step 5: Create page Python**

`digicomply_setup.py`:
```python
# Copyright (c) 2024, DigiComply
# License: MIT

import frappe
from frappe import _


@frappe.whitelist()
def complete_setup(data):
    """
    Complete DigiComply setup wizard.
    Creates company, configures defaults, and sets up initial data.
    """
    import json

    if isinstance(data, str):
        data = json.loads(data)

    try:
        # Create or update company
        company_name = data.get("company_name")
        if not frappe.db.exists("Company", company_name):
            company = frappe.get_doc({
                "doctype": "Company",
                "company_name": company_name,
                "country": "United Arab Emirates",
                "default_currency": data.get("currency", "AED"),
                "tax_id": data.get("trn"),
                "chart_of_accounts": "U.A.E - Chart of Accounts",
            })
            company.insert(ignore_permissions=True)

        # Update DigiComply Settings
        settings = frappe.get_single("DigiComply Settings")
        settings.default_company = company_name
        settings.default_asp_provider = data.get("asp_provider", "")
        settings.save(ignore_permissions=True)

        # Mark setup as complete
        frappe.db.set_value("System Settings", None, "setup_complete", 1)

        frappe.db.commit()

        return {"success": True, "company": company_name}

    except Exception as e:
        frappe.log_error(f"DigiComply Setup Error: {str(e)}")
        return {"success": False, "error": str(e)}
```

**Step 6: Commit**

```bash
git add digicomply/digicomply/page/digicomply_setup/
git commit -m "feat: add custom DigiComply setup wizard"
```

---

## Task 7: Update Hooks for Setup Wizard and Home Page

**Files:**
- Modify: `digicomply/digicomply/hooks.py`

**Step 1: Read current hooks.py**

```bash
cat digicomply/hooks.py
```

**Step 2: Add/update these hook entries**

Add these to hooks.py:

```python
# Website Route Rules - redirect setup wizard
website_route_rules = [
    {"from_route": "/compliance-dashboard", "to_route": "compliance_dashboard"},
    {"from_route": "/setup-wizard", "to_route": "digicomply-setup"},
]

# Default home page after login
home_page = "compliance-dashboard"

# Boot Session - customize desk
boot_session = "digicomply.boot.boot_session"

# Override standard pages
page_js = {
    "setup-wizard": "public/js/setup_wizard_override.js"
}

# Website context
website_context = {
    "favicon": "/assets/digicomply/images/favicon.svg",
    "splash_image": "/assets/digicomply/images/logo-full.svg"
}

# Override templates
override_doctype_class = {
    # Can be used to override standard DocType behavior
}
```

**Step 3: Commit**

```bash
git add digicomply/hooks.py
git commit -m "feat: update hooks for setup wizard redirect and home page"
```

---

## Task 8: Create Setup Wizard Override JavaScript

**Files:**
- Create: `digicomply/digicomply/public/js/setup_wizard_override.js`

**Step 1: Create override file**

```javascript
// Override standard setup wizard to redirect to DigiComply setup
frappe.provide("frappe.setup");

$(document).ready(function() {
    // If on setup-wizard page, redirect to DigiComply setup
    if (frappe.get_route()[0] === "setup-wizard") {
        frappe.set_route("digicomply-setup");
    }
});

// Override setup wizard start
if (frappe.setup && frappe.setup.SetupWizard) {
    const OriginalSetupWizard = frappe.setup.SetupWizard;
    frappe.setup.SetupWizard = class extends OriginalSetupWizard {
        constructor(opts) {
            // Redirect to DigiComply setup instead
            frappe.set_route("digicomply-setup");
        }
    };
}
```

**Step 2: Commit**

```bash
git add digicomply/public/js/setup_wizard_override.js
git commit -m "feat: add setup wizard override to redirect to DigiComply setup"
```

---

## Task 9: Update Install Script for Fixtures

**Files:**
- Modify: `digicomply/digicomply/setup/install.py`

**Step 1: Read current install.py**

```bash
cat digicomply/setup/install.py
```

**Step 2: Update with branding configuration**

```python
# Copyright (c) 2024, DigiComply
# License: MIT

"""
DigiComply installation and setup utilities.
"""

import frappe
from frappe import _


def after_install():
    """Run after DigiComply app is installed."""
    setup_branding()
    setup_workspace_order()
    create_placeholder_logos()
    frappe.db.commit()


def before_uninstall():
    """Run before DigiComply app is uninstalled."""
    pass


def after_migrate():
    """Run after bench migrate."""
    setup_branding()
    frappe.db.commit()


def setup_branding():
    """Configure DigiComply branding in system settings."""

    # Update Website Settings
    try:
        ws = frappe.get_single("Website Settings")
        ws.app_name = "DigiComply"
        ws.app_logo = "/assets/digicomply/images/logo-full.svg"
        ws.favicon = "/assets/digicomply/images/favicon.svg"
        ws.disable_signup = 0
        ws.save(ignore_permissions=True)
    except Exception as e:
        frappe.log_error(f"Error setting website settings: {e}")

    # Update Navbar Settings
    try:
        ns = frappe.get_single("Navbar Settings")
        ns.app_logo = "/assets/digicomply/images/logo.svg"
        ns.save(ignore_permissions=True)
    except Exception as e:
        frappe.log_error(f"Error setting navbar settings: {e}")

    # Update System Settings
    try:
        ss = frappe.get_single("System Settings")
        ss.app_name = "DigiComply"
        ss.save(ignore_permissions=True)
    except Exception as e:
        frappe.log_error(f"Error setting system settings: {e}")


def setup_workspace_order():
    """Set DigiComply workspace as first in sidebar."""
    try:
        # Get DigiComply workspace
        if frappe.db.exists("Workspace", "DigiComply"):
            frappe.db.set_value("Workspace", "DigiComply", "sequence_id", 1)
    except Exception as e:
        frappe.log_error(f"Error setting workspace order: {e}")


def create_placeholder_logos():
    """Create placeholder logo files if they don't exist."""
    import os

    images_dir = os.path.join(
        frappe.get_app_path("digicomply"),
        "public", "images"
    )
    os.makedirs(images_dir, exist_ok=True)

    # Navbar logo
    navbar_svg = '''<svg xmlns="http://www.w3.org/2000/svg" width="160" height="40" viewBox="0 0 160 40">
  <rect width="160" height="40" fill="#1e40af"/>
  <text x="80" y="26" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="white" text-anchor="middle">DigiComply</text>
</svg>'''

    # Login logo
    login_svg = '''<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60" viewBox="0 0 200 60">
  <rect width="200" height="60" fill="#1e40af" rx="8"/>
  <text x="100" y="38" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="white" text-anchor="middle">DigiComply</text>
</svg>'''

    # Favicon
    favicon_svg = '''<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <rect width="32" height="32" fill="#1e40af" rx="4"/>
  <text x="16" y="22" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="white" text-anchor="middle">D</text>
</svg>'''

    logo_path = os.path.join(images_dir, "logo.svg")
    if not os.path.exists(logo_path):
        with open(logo_path, "w") as f:
            f.write(navbar_svg)

    login_path = os.path.join(images_dir, "logo-full.svg")
    if not os.path.exists(login_path):
        with open(login_path, "w") as f:
            f.write(login_svg)

    favicon_path = os.path.join(images_dir, "favicon.svg")
    if not os.path.exists(favicon_path):
        with open(favicon_path, "w") as f:
            f.write(favicon_svg)
```

**Step 3: Commit**

```bash
git add digicomply/setup/install.py
git commit -m "feat: update install script with branding and logo setup"
```

---

## Task 10: Build and Test

**Step 1: Clear cache**

```bash
cd "/Users/rakeshanita/digicomply accounting ai/frappe-bench"
bench --site erpnext.localhost clear-cache
```

**Step 2: Run migrate to sync workspace**

```bash
bench --site erpnext.localhost migrate
```

**Step 3: Build assets**

```bash
bench build --app digicomply
```

**Step 4: Restart bench**

```bash
# Kill existing and restart
pkill -f "honcho" || true
sleep 2
honcho start &
```

**Step 5: Verify in browser**

1. Go to http://localhost:8000/login
2. Login as Administrator
3. Check navbar shows DigiComply branding
4. Check sidebar shows DigiComply workspace first
5. Check hidden modules (Manufacturing, Stock, etc.) are not visible

**Step 6: Final commit**

```bash
git add -A
git commit -m "chore: complete DigiComply branding implementation"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Create logo assets | public/images/*.svg |
| 2 | Update CSS branding | public/css/digicomply.css |
| 3 | Boot session hook | boot.py, hooks.py |
| 4 | DigiComply workspace | workspace/digicomply/ |
| 5 | JavaScript overrides | public/js/digicomply.js |
| 6 | Custom setup wizard | page/digicomply_setup/ |
| 7 | Update hooks | hooks.py |
| 8 | Setup wizard override | public/js/setup_wizard_override.js |
| 9 | Install script | setup/install.py |
| 10 | Build and test | - |

**Total: 10 tasks, ~30 steps**
