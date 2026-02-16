app_name = "digicomply"
app_title = "DigiComply"
app_publisher = "DigiComply"
app_description = "UAE E-Invoicing Compliance & Reconciliation Platform"
app_email = "hello@digicomply.ae"
app_license = "MIT"
app_version = "0.1.0"

# App Logo
app_logo_url = "/assets/digicomply/images/logo.png"

# Required Apps
required_apps = ["frappe"]

# App Includes
app_include_css = "/assets/digicomply/css/digicomply.css"
app_include_js = "/assets/digicomply/js/digicomply.js"

# Website Route Rules
website_route_rules = [
    {"from_route": "/compliance-dashboard", "to_route": "compliance_dashboard"},
]

# Home Page
home_page = "setup-wizard" if False else "compliance_dashboard"

# Desk Notifications
notification_config = "digicomply.notifications.get_notification_config"

# DocType Events
doc_events = {
    "Reconciliation Run": {
        "on_submit": "digicomply.digicomply.doctype.reconciliation_run.reconciliation_run.run_reconciliation",
    },
    "CSV Import": {
        "after_insert": "digicomply.digicomply.doctype.csv_import.csv_import.process_csv",
    },
}

# Scheduled Tasks
scheduler_events = {
    "daily": [
        "digicomply.reconciliation.tasks.check_pending_reconciliations",
    ],
    "weekly": [
        "digicomply.reconciliation.tasks.generate_weekly_summary",
    ],
}

# Fixtures - Export on install
fixtures = [
    {
        "dt": "Custom Field",
        "filters": [["module", "=", "DigiComply"]],
    },
    {
        "dt": "Property Setter",
        "filters": [["module", "=", "DigiComply"]],
    },
]

# Jinja Environment
jenv = {
    "methods": [
        "digicomply.utils.format_trn:format_trn",
        "digicomply.utils.format_aed:format_aed",
    ],
}

# Installation
after_install = "digicomply.setup.install.after_install"
before_uninstall = "digicomply.setup.install.before_uninstall"

# Migration
after_migrate = "digicomply.setup.install.after_migrate"

# Permissions
has_permission = {
    "Reconciliation Run": "digicomply.digicomply.doctype.reconciliation_run.reconciliation_run.has_permission",
}

# Document Naming
naming_rule = {
    "Reconciliation Run": "REC-.YYYY.-.#####",
    "Reconciliation Item": "REC-ITEM-.YYYY.-.#####",
    "CSV Import": "CSV-.YYYY.-.#####",
    "Mismatch Report": "MIS-.YYYY.-.#####",
}

# Default Print Formats
default_print_formats = {
    "Mismatch Report": "Mismatch Report PDF",
}
