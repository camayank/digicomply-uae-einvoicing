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

# App Includes (must be lists)
app_include_css = ["/assets/digicomply/css/digicomply.css"]
app_include_js = ["/assets/digicomply/js/digicomply.js"]

# Website Route Rules
website_route_rules = [
    {"from_route": "/setup-wizard", "to_route": "digicomply-setup"},
]

# Remove home_page override - let users land on workspace then navigate to dashboard

# Override standard pages
page_js = {
    "setup-wizard": "public/js/setup_wizard_override.js"
}

# Website context
website_context = {
    "favicon": "/assets/digicomply/images/favicon.svg",
    "splash_image": "/assets/digicomply/images/logo-full.svg"
}

# Boot Session
boot_session = "digicomply.boot.boot_session"

# Desk Notifications
notification_config = "digicomply.notifications.get_notification_config"

# DocType Events
doc_events = {
    "Reconciliation Run": {
        "on_submit": "digicomply.digicomply.doctype.reconciliation_run.reconciliation_run.on_submit_handler",
    },
    "Sales Invoice": {
        "on_submit": "digicomply.digicomply.doctype.e_invoice.e_invoice.auto_create_e_invoice",
    },
    # CSV Import processes automatically in validate()
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
    {
        "dt": "Invoice Type Code",
    },
    {
        "dt": "Tax Category Code",
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
