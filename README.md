# DigiComply - UAE E-Invoicing Compliance Platform

A Frappe app for UAE PINT AE e-invoicing reconciliation and compliance management.

## MVP Features (Connor's 3-Feature Rule)

1. **Upload & Reconcile** - CSV upload, match ERP invoices against ASP data
2. **Mismatch Dashboard** - Red/yellow/green visual compliance status
3. **PDF Audit Pack** - One-click compliance report generation

## Installation

```bash
# In your frappe-bench directory
cd ~/frappe-bench

# Get the app
bench get-app /path/to/digicomply

# Install on site
bench --site your-site install-app digicomply

# Run migrations
bench --site your-site migrate
```

## DocTypes

| DocType | Purpose |
|---------|---------|
| `Reconciliation Run` | One reconciliation session - matches ERP vs ASP |
| `Reconciliation Item` | Individual invoice match result (child table) |
| `CSV Import` | Handle ASP data uploads (ClearTax, Cygnet, Zoho) |
| `Mismatch Report` | Generated audit findings with PDF |
| `DigiComply Settings` | ASP credentials, alerts, compliance thresholds |

## Quick Start

1. **Configure ASP**: Setup > DigiComply Settings
   - Enter ClearTax or Cygnet credentials
   - Set compliance thresholds
   - Configure email alerts

2. **Upload ASP Data**: CSV Import > New
   - Select ASP provider
   - Upload CSV export from your ASP
   - System auto-maps columns

3. **Run Reconciliation**: Reconciliation Run > New
   - Select company and date range
   - Link to CSV Import
   - Submit to run reconciliation

4. **Review Results**: Compliance Dashboard
   - Green = Matched
   - Yellow = Mismatched (data differs)
   - Red = Missing (not reported)

5. **Generate Report**: Mismatch Report
   - Creates PDF audit pack
   - Shows penalty exposure
   - Actionable recommendations

## API Endpoints

```python
# Get dashboard data
frappe.call('digicomply.api.get_dashboard_data', { company: 'My Company' })

# Quick reconcile (one-click)
frappe.call('digicomply.api.quick_reconcile', {
    company: 'My Company',
    asp_provider: 'ClearTax',
    csv_file: '/files/asp-export.csv'
})

# Generate audit pack
frappe.call('digicomply.api.generate_audit_pack', {
    reconciliation_run: 'REC-2024-00001'
})
```

## Custom Fields Added

On `Sales Invoice`:
- `pint_ae_status` - Submission status (Pending/Submitted/Accepted/Rejected)
- `asp_submission_id` - ASP reference ID
- `reconciliation_status` - Reconciliation result
- `last_reconciliation` - Link to Reconciliation Run

## Compliance Score Calculation

```
Score = (Matched Invoices / Total Invoices) × 100

Excellent: 95%+ (Green)
Good: 85-94% (Blue)
Warning: 70-84% (Yellow)
Critical: <70% (Red)
```

## Penalty Calculation

```
Potential Penalty = Missing in ASP × AED 5,000
```

FTA can impose penalties of AED 5,000+ per unreported invoice.

## Supported ASPs

| ASP | Status | Notes |
|-----|--------|-------|
| ClearTax | ✅ Supported | CSV import, API ready |
| Cygnet | ✅ Supported | CSV import, API ready |
| Zoho | ✅ Supported | CSV import |
| Tabadul | ✅ Supported | CSV import |
| Other | ✅ Custom mapping | User defines columns |

## File Structure

```
digicomply/
├── digicomply/
│   ├── __init__.py
│   ├── hooks.py                    # App configuration
│   ├── api.py                      # Public API endpoints
│   ├── utils.py                    # Utility functions
│   ├── notifications.py            # Alert configuration
│   ├── digicomply/                 # Module
│   │   ├── doctype/
│   │   │   ├── reconciliation_run/
│   │   │   ├── reconciliation_item/
│   │   │   ├── csv_import/
│   │   │   ├── mismatch_report/
│   │   │   └── digicomply_settings/
│   │   └── page/
│   │       └── compliance_dashboard/
│   ├── setup/
│   │   └── install.py              # Installation hooks
│   └── public/
│       ├── css/digicomply.css
│       └── js/digicomply.js
├── setup.py
├── requirements.txt
└── README.md
```

## Requirements

- Frappe >= 15.0.0
- ERPNext >= 15.0.0 (for Sales Invoice integration)
- Python >= 3.10

## License

MIT License - See LICENSE file

## Support

- Documentation: [docs.digicomply.ae](https://docs.digicomply.ae)
- Issues: [github.com/digicomply/digicomply](https://github.com/digicomply/digicomply)
- Email: support@digicomply.ae

---

Built following Connor's 6 Rules for Startups:
1. Simple app, 3 features, great onboarding
2. Modified existing idea = validated
3. 90% of users see only onboarding
4. Design data structures BEFORE coding
5. Influencer → UGC → paid ads
6. Ship in 2 weeks, iterate
