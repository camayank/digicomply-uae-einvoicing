// ============================================
// DigiComply - UAE E-Invoicing Compliance Platform
// Complete UX transformation for business users
// ============================================

frappe.provide("digicomply");

// ============================================
// CONFIGURATION
// ============================================
digicomply.config = {
    ALLOWED_WORKSPACES: ["DigiComply", "Accounting", "Selling", "Buying", "Home"],
    HIDE_MODULES: [
        "Stock", "Assets", "Manufacturing", "Quality", "Projects",
        "Support", "Users", "Website", "CRM", "Tools", "Build",
        "ERPNext", "Integrations", "HR", "Payroll", "Regional",
        "Education", "Healthcare", "Agriculture", "Hospitality",
        "E Commerce", "Utilities", "Telephony", "Non Profit", "Portal"
    ],
    DASHBOARD_URL: "/app/compliance_dashboard",
    BRAND_NAME: "DigiComply",
    BRAND_TAGLINE: "UAE E-Invoicing Compliance"
};

// ============================================
// IMMEDIATE CSS INJECTION (runs before DOM ready)
// Critical styles injected directly to ensure they load
// ============================================
(function() {
    const style = document.createElement('style');
    style.id = 'digicomply-critical';
    style.textContent = `
        /* ===== NAVBAR - Purple Gradient ===== */
        .navbar {
            background: linear-gradient(135deg, #a404e4 0%, #8501b9 100%) !important;
            box-shadow: 0 4px 14px rgba(164, 4, 228, 0.25) !important;
            border-bottom: none !important;
        }
        .navbar .nav-link, .navbar .navbar-nav .nav-link {
            color: rgba(255,255,255,0.9) !important;
        }
        .navbar .nav-link:hover {
            color: white !important;
            background: rgba(255,255,255,0.15) !important;
        }
        .navbar .navbar-brand img, .navbar .navbar-brand .app-logo {
            display: none !important;
        }
        .navbar-brand::before {
            display: none !important;
        }
        .navbar-brand::after {
            display: none !important;
        }

        /* ===== BUTTONS - Purple Theme ===== */
        .btn-primary, .btn-primary-dark, .primary-action {
            background: linear-gradient(135deg, #a404e4 0%, #8501b9 100%) !important;
            border: none !important;
            color: white !important;
        }
        .btn-primary:hover, .btn-primary-dark:hover {
            background: linear-gradient(135deg, #8501b9 0%, #6b0199 100%) !important;
        }

        /* ===== SIDEBAR - Clean Style ===== */
        .desk-sidebar .sidebar-menu a.active, .desk-sidebar .sidebar-menu a.selected {
            background: #a404e4 !important;
            color: white !important;
        }
        .desk-sidebar .sidebar-menu a:hover {
            background: #faf5ff !important;
            color: #a404e4 !important;
        }

        /* ===== CARDS & FORMS ===== */
        .frappe-card, .form-section {
            border-radius: 12px !important;
            border: 1px solid #e2e8f0 !important;
        }
        .form-section .section-head {
            background: linear-gradient(to right, #faf5ff, transparent) !important;
            color: #a404e4 !important;
            font-weight: 600 !important;
        }

        /* ===== WORKSPACE SHORTCUTS ===== */
        .shortcut-widget-box, .widget.shortcut-widget-box {
            background: white !important;
            border: 1px solid #e2e8f0 !important;
            border-radius: 12px !important;
            transition: all 0.2s ease !important;
        }
        .shortcut-widget-box:hover {
            border-color: #a404e4 !important;
            box-shadow: 0 4px 14px rgba(164, 4, 228, 0.15) !important;
            transform: translateY(-2px) !important;
        }

        /* ===== INDICATORS ===== */
        .indicator-pill.green { background: #d1fae5 !important; color: #065f46 !important; }
        .indicator-pill.red { background: #fee2e2 !important; color: #991b1b !important; }
        .indicator-pill.yellow, .indicator-pill.orange { background: #fef3c7 !important; color: #92400e !important; }
        .indicator-pill.blue { background: #f3e8ff !important; color: #a404e4 !important; }

        /* ===== HIDE SYSTEM BRANDING ===== */
        .powered-by-frappe, .footer-powered, .setup-wizard-brand,
        a[href*="/app/stock"], a[href*="/app/assets"],
        a[href*="/app/manufacturing"], a[href*="/app/quality"],
        a[href*="/app/projects"], a[href*="/app/support"],
        a[href*="/app/users"], a[href*="/app/website"],
        a[href*="/app/crm"], a[href*="/app/tools"],
        a[href*="/app/build"], a[href*="/app/erpnext-settings"],
        a[href*="/app/integrations"], a[href*="/app/erpnext-integrations"],
        a[href*="/app/hr"], a[href*="/app/payroll"],
        a[href*="/app/education"], a[href*="/app/healthcare"] {
            display: none !important;
        }

        /* ===== LOADING SPINNER ===== */
        .splash {
            background: linear-gradient(135deg, #a404e4 0%, #8501b9 100%) !important;
        }

        /* ===== FONTS ===== */
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        body {
            font-family: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif !important;
        }
    `;
    document.head.appendChild(style);
})();

// ============================================
// WORKSPACE FILTERING
// ============================================
digicomply.filter = {
    hideUnwanted: function() {
        const config = digicomply.config;

        // Hide sidebar items
        $(".desk-sidebar .sidebar-item-container, .sidebar-menu .sidebar-item-container").each(function() {
            const text = $(this).text().trim();
            let allowed = config.ALLOWED_WORKSPACES.some(w => text.includes(w)) ||
                         text.includes("Accounts");

            if (!allowed && text.length > 0) {
                $(this).remove();
            }
        });

        // Hide by specific text
        $(".desk-sidebar a, .sidebar-menu a").each(function() {
            const text = $(this).text().trim();
            if (config.HIDE_MODULES.includes(text)) {
                $(this).closest(".sidebar-item-container").remove();
                $(this).remove();
            }
        });

        // Hide module cards on workspace pages
        $(".module-card, .widget.shortcut-widget-box").each(function() {
            const text = $(this).text().trim();
            let allowed = config.ALLOWED_WORKSPACES.some(w => text.includes(w)) ||
                         text.includes("Accounts");

            if (!allowed && text.length > 0) {
                $(this).hide();
            }
        });

        // Hide by href patterns
        config.HIDE_MODULES.forEach(item => {
            const slug = item.toLowerCase().replace(/ /g, '-');
            $(`a[href*="/app/${slug}"]`).closest(".sidebar-item-container").remove();
        });

        // Hide empty sections
        $(".standard-sidebar-section, .sidebar-section").each(function() {
            if ($(this).find("a:visible").length === 0) {
                $(this).hide();
            }
        });
    }
};

// ============================================
// BRANDING
// ============================================
digicomply.branding = {
    apply: function() {
        // Page title - replace generic branding
        document.title = document.title.replace(/Frappe|ERPNext/gi, digicomply.config.BRAND_NAME);

        // Navbar brand - complete replacement matching website style
        if ($(".navbar-brand").length && !$(".navbar-brand").hasClass("dc-branded")) {
            $(".navbar-brand")
                .addClass("dc-branded")
                .empty()
                .html(`
                    <div style="display:flex;align-items:center;gap:12px;">
                        <div style="width:34px;height:34px;background:rgba(255,255,255,0.2);border-radius:8px;display:flex;align-items:center;justify-content:center;">
                            <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
                                <path d="M9 16 L13 20 L23 10" stroke="white" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                        <span style="font-family:'Poppins',sans-serif;font-weight:700;font-size:1.125rem;letter-spacing:0.5px;">
                            <span style="color:white;">DIGI</span><span style="color:rgba(255,255,255,0.85);">COMPLY</span>
                        </span>
                    </div>
                `);
        }

        // Search placeholder
        $("input[data-doctype='Search'], .search-bar input").attr("placeholder", "Search...");

        // Remove system footers and branding
        $(".powered-by-frappe, .footer-powered, .app-logo").remove();

        // Fix any "App Logo" text
        $(".navbar-brand").contents().filter(function() {
            return this.nodeType === 3 && this.textContent.trim() === "App Logo";
        }).remove();
    }
};

// ============================================
// NAVIGATION ENHANCEMENTS
// ============================================
digicomply.navigation = {
    // Redirect to dashboard after login
    checkRedirect: function() {
        if (frappe.boot && frappe.boot.setup_complete === 0) {
            return; // Don't redirect during setup
        }

        // If on home or default page, go to compliance dashboard
        if (window.location.pathname === "/app" ||
            window.location.pathname === "/app/home") {
            // frappe.set_route("compliance_dashboard");
        }
    },

    // Add keyboard shortcuts
    setupKeyboardShortcuts: function() {
        $(document).on("keydown", function(e) {
            // Alt+D = Go to Dashboard
            if (e.altKey && e.key === "d") {
                e.preventDefault();
                frappe.set_route("compliance_dashboard");
            }
            // Alt+N = New Reconciliation
            if (e.altKey && e.key === "n") {
                e.preventDefault();
                frappe.new_doc("Reconciliation Run");
            }
            // Alt+U = Upload CSV
            if (e.altKey && e.key === "u") {
                e.preventDefault();
                frappe.new_doc("CSV Import");
            }
        });
    },

    // Add quick navigation bar
    addQuickNav: function() {
        if ($("#dc-quick-nav").length) return;

        const quickNav = $(`
            <div id="dc-quick-nav" style="
                position: fixed;
                bottom: 20px;
                right: 20px;
                display: flex;
                gap: 8px;
                z-index: 1000;
            ">
                <button class="btn btn-primary btn-sm dc-fab" onclick="frappe.set_route('compliance_dashboard')" title="Dashboard (Alt+D)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="7" height="7"></rect>
                        <rect x="14" y="3" width="7" height="7"></rect>
                        <rect x="14" y="14" width="7" height="7"></rect>
                        <rect x="3" y="14" width="7" height="7"></rect>
                    </svg>
                </button>
                <button class="btn btn-success btn-sm dc-fab" onclick="frappe.new_doc('Reconciliation Run')" title="New Reconciliation (Alt+N)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                </button>
            </div>
        `);

        // Add styles for FAB buttons
        if (!$("#dc-fab-style").length) {
            $("head").append(`
                <style id="dc-fab-style">
                    .dc-fab {
                        width: 44px !important;
                        height: 44px !important;
                        border-radius: 50% !important;
                        padding: 0 !important;
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
                        transition: transform 0.2s, box-shadow 0.2s !important;
                    }
                    .dc-fab:hover {
                        transform: translateY(-2px) !important;
                        box-shadow: 0 6px 16px rgba(0,0,0,0.2) !important;
                    }
                </style>
            `);
        }

        $("body").append(quickNav);
    }
};

// ============================================
// FORM ENHANCEMENTS
// ============================================
digicomply.forms = {
    enhance: function() {
        // Add helpful placeholders
        $("input[data-fieldname='company']").attr("placeholder", "Select your company...");

        // Highlight required fields
        $(".form-control.reqd").addClass("dc-required");

        // Add field descriptions where helpful
        digicomply.forms.addFieldHelp();
    },

    addFieldHelp: function() {
        // Add contextual help for common fields
        const fieldHelp = {
            "csv_import": "Select the CSV file imported from your ASP provider",
            "from_date": "Start of the reconciliation period",
            "to_date": "End of the reconciliation period",
            "asp_provider": "Your Accredited Service Provider (e.g., ClearTax, Cygnet)"
        };

        for (let [field, help] of Object.entries(fieldHelp)) {
            const $field = $(`.frappe-control[data-fieldname="${field}"]`);
            if ($field.length && !$field.find(".dc-field-help").length) {
                $field.find(".control-label").after(
                    `<small class="dc-field-help" style="color:#64748b;font-size:11px;display:block;margin-bottom:4px;">${help}</small>`
                );
            }
        }
    }
};

// ============================================
// WELCOME & ONBOARDING
// ============================================
digicomply.onboarding = {
    showWelcome: function() {
        // Check if first time
        if (localStorage.getItem("dc_welcomed")) return;

        frappe.msgprint({
            title: __("Welcome to DigiComply"),
            message: `
                <div style="text-align:center;padding:20px 0;">
                    <div style="font-size:48px;margin-bottom:16px;">🎉</div>
                    <h4 style="margin-bottom:8px;">Your UAE E-Invoicing Compliance Platform</h4>
                    <p style="color:#64748b;margin-bottom:24px;">
                        Easily reconcile your invoices with ASP data and stay FTA compliant.
                    </p>
                    <div style="text-align:left;background:#f8fafc;padding:16px;border-radius:8px;">
                        <p style="margin-bottom:8px;"><strong>Quick Start:</strong></p>
                        <ol style="margin:0;padding-left:20px;color:#64748b;">
                            <li>Upload your ASP CSV export</li>
                            <li>Create a new Reconciliation Run</li>
                            <li>Review matches and fix discrepancies</li>
                        </ol>
                    </div>
                </div>
            `,
            indicator: "blue",
            primary_action: {
                label: __("Go to Dashboard"),
                action: function() {
                    localStorage.setItem("dc_welcomed", "1");
                    frappe.set_route("compliance_dashboard");
                }
            }
        });
    },

    // Add getting started banner to workspace
    addGettingStartedBanner: function() {
        // Only show on DigiComply workspace
        if (!window.location.pathname.includes("/app/digicomply")) return;
        if ($("#dc-getting-started").length) return;
        if (localStorage.getItem("dc_getting_started_dismissed")) return;

        const banner = $(`
            <div id="dc-getting-started" class="dc-getting-started" style="
                background: linear-gradient(135deg, #eff6ff 0%, #fff 100%);
                border: 1px solid #dbeafe;
                border-radius: 12px;
                padding: 1.5rem;
                margin-bottom: 1.5rem;
                position: relative;
            ">
                <button onclick="digicomply.onboarding.dismissGettingStarted()" style="
                    position: absolute;
                    top: 12px;
                    right: 12px;
                    background: none;
                    border: none;
                    color: #94a3b8;
                    cursor: pointer;
                    font-size: 18px;
                ">&times;</button>
                <h4 style="color:#1e40af;margin:0 0 1rem 0;font-size:1rem;">Getting Started with DigiComply</h4>
                <div style="display:flex;gap:1.5rem;flex-wrap:wrap;">
                    <div style="flex:1;min-width:200px;display:flex;gap:12px;">
                        <div style="width:28px;height:28px;background:#1e40af;color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:600;flex-shrink:0;">1</div>
                        <div>
                            <h5 style="font-size:0.875rem;font-weight:600;margin:0 0 4px 0;">Upload ASP Data</h5>
                            <p style="font-size:0.8125rem;color:#64748b;margin:0;">Import your CSV export from ClearTax, Cygnet, or Zoho</p>
                        </div>
                    </div>
                    <div style="flex:1;min-width:200px;display:flex;gap:12px;">
                        <div style="width:28px;height:28px;background:#1e40af;color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:600;flex-shrink:0;">2</div>
                        <div>
                            <h5 style="font-size:0.875rem;font-weight:600;margin:0 0 4px 0;">Run Reconciliation</h5>
                            <p style="font-size:0.8125rem;color:#64748b;margin:0;">Match your invoices against ASP data automatically</p>
                        </div>
                    </div>
                    <div style="flex:1;min-width:200px;display:flex;gap:12px;">
                        <div style="width:28px;height:28px;background:#1e40af;color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:600;flex-shrink:0;">3</div>
                        <div>
                            <h5 style="font-size:0.875rem;font-weight:600;margin:0 0 4px 0;">Review & Fix</h5>
                            <p style="font-size:0.8125rem;color:#64748b;margin:0;">Identify mismatches and resolve them before FTA deadline</p>
                        </div>
                    </div>
                </div>
                <div style="margin-top:1rem;padding-top:1rem;border-top:1px solid #e2e8f0;">
                    <button class="btn btn-primary btn-sm" onclick="frappe.set_route('compliance_dashboard')">
                        Go to Dashboard
                    </button>
                    <button class="btn btn-default btn-sm" onclick="frappe.new_doc('CSV Import')" style="margin-left:8px;">
                        Upload CSV
                    </button>
                </div>
            </div>
        `);

        // Insert at top of workspace content
        setTimeout(() => {
            const container = $(".workspace-container .layout-main-section, .page-container .layout-main-section").first();
            if (container.length) {
                container.prepend(banner);
            }
        }, 500);
    },

    dismissGettingStarted: function() {
        localStorage.setItem("dc_getting_started_dismissed", "1");
        $("#dc-getting-started").fadeOut(200, function() {
            $(this).remove();
        });
    }
};

// ============================================
// OVERRIDE ABOUT DIALOG
// ============================================
digicomply.overrideAbout = function() {
    if (frappe.ui && frappe.ui.toolbar) {
        frappe.ui.toolbar.show_about = function() {
            frappe.msgprint({
                title: __("About DigiComply"),
                message: `
                    <div style="text-align:center;padding:20px;">
                        <div style="font-size:40px;margin-bottom:12px;">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#1e40af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                        <h3 style="color:#1e40af;margin-bottom:4px;">DigiComply</h3>
                        <p style="color:#64748b;margin-bottom:16px;">UAE E-Invoicing Compliance Platform</p>
                        <p style="font-size:13px;color:#94a3b8;">Version 1.0.0</p>
                        <hr style="margin:16px 0;border-color:#e2e8f0;">
                        <p style="font-size:12px;color:#94a3b8;">
                            Reconcile invoices with ASP data.<br>
                            Stay compliant with FTA requirements.
                        </p>
                    </div>
                `,
                indicator: "blue"
            });
        };
    }
};

// ============================================
// MUTATION OBSERVER
// ============================================
digicomply.observer = {
    instance: null,
    timer: null,

    start: function() {
        if (this.instance) return;

        this.instance = new MutationObserver(() => {
            clearTimeout(this.timer);
            this.timer = setTimeout(() => {
                digicomply.filter.hideUnwanted();
                digicomply.branding.apply();
            }, 100);
        });

        this.instance.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
};

// ============================================
// INITIALIZATION
// ============================================
$(document).ready(function() {
    console.log("DigiComply: Initializing...");

    // Apply immediately
    digicomply.filter.hideUnwanted();
    digicomply.branding.apply();

    // Start observer
    digicomply.observer.start();

    // Setup navigation
    digicomply.navigation.setupKeyboardShortcuts();
    digicomply.navigation.addQuickNav();

    // Override about
    digicomply.overrideAbout();

    // Delayed runs for async content
    setTimeout(() => digicomply.filter.hideUnwanted(), 500);
    setTimeout(() => digicomply.filter.hideUnwanted(), 1500);

    // On page change
    $(document).on("page-change", function() {
        setTimeout(() => {
            digicomply.filter.hideUnwanted();
            digicomply.branding.apply();
            digicomply.forms.enhance();
            digicomply.onboarding.addGettingStartedBanner();
        }, 300);
    });

    // Show getting started on workspace
    setTimeout(() => {
        if (frappe.session && frappe.session.user !== "Guest") {
            digicomply.onboarding.addGettingStartedBanner();
        }
    }, 1000);

    console.log("DigiComply: Ready");
});

// Frappe after_ajax hook
if (typeof frappe !== 'undefined') {
    frappe.after_ajax(function() {
        digicomply.filter.hideUnwanted();
        digicomply.forms.enhance();
    });
}
