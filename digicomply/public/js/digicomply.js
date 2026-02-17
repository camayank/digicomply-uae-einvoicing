// ============================================
// DigiComply - UAE E-Invoicing Compliance Platform
// Complete White-Label UX Transformation
// Version 1.0.0 - Full Branding Override
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
        "E Commerce", "Utilities", "Telephony", "Non Profit", "Portal",
        "ERPNext Settings", "ERPNext Integrations", "Frappe HR"
    ],
    BLOCKED_ROUTES: [
        "system-console", "background_jobs", "recorder",
        "logs", "server-script", "client-script",
        "erpnext-settings", "erpnext-integrations"
    ],
    DASHBOARD_URL: "/app/compliance_dashboard",
    BRAND_NAME: "DigiComply",
    BRAND_TAGLINE: "UAE E-Invoicing Compliance",
    BRAND_COLOR: "#a404e4",
    BRAND_COLOR_DARK: "#8501b9",
    BRAND_COLOR_LIGHT: "#c44df7",
    VERSION: "1.0.0",
    SUPPORT_EMAIL: "support@digicomply.ae",
    SUPPORT_URL: "https://digicomply.ae/support"
};

// ============================================
// IMMEDIATE CSS INJECTION (runs before DOM ready)
// ============================================
(function() {
    // Guard: Only inject once
    if (document.getElementById('digicomply-critical')) return;

    const style = document.createElement('style');
    style.id = 'digicomply-critical';
    style.textContent = `
        /* ===== GLOBAL FONTS ===== */
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

        body, .frappe-control, .modal, .msgprint {
            font-family: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif !important;
        }

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
        .navbar-brand::before, .navbar-brand::after {
            display: none !important;
        }
        .navbar .dropdown-menu {
            border: 1px solid #e2e8f0 !important;
            box-shadow: 0 10px 40px rgba(0,0,0,0.12) !important;
        }

        /* ===== BUTTONS - Purple Theme ===== */
        .btn-primary, .btn-primary-dark, .primary-action {
            background: linear-gradient(135deg, #a404e4 0%, #8501b9 100%) !important;
            border: none !important;
            color: white !important;
        }
        .btn-primary:hover, .btn-primary-dark:hover {
            background: linear-gradient(135deg, #8501b9 0%, #6b0199 100%) !important;
            transform: translateY(-1px);
        }
        .btn-primary:focus, .btn-primary:active {
            box-shadow: 0 0 0 3px rgba(164, 4, 228, 0.3) !important;
        }
        a, .text-primary {
            color: #a404e4 !important;
        }
        a:hover {
            color: #8501b9 !important;
        }

        /* ===== SIDEBAR - Clean Style ===== */
        .desk-sidebar .sidebar-menu a.active,
        .desk-sidebar .sidebar-menu a.selected,
        .standard-sidebar-item.selected {
            background: #a404e4 !important;
            color: white !important;
        }
        .desk-sidebar .sidebar-menu a:hover,
        .standard-sidebar-item:hover {
            background: #faf5ff !important;
            color: #a404e4 !important;
        }
        .sidebar-menu .sidebar-label {
            color: #64748b !important;
            text-transform: uppercase !important;
            font-size: 10px !important;
            font-weight: 600 !important;
            letter-spacing: 0.5px !important;
        }

        /* ===== CARDS & FORMS ===== */
        .frappe-card, .form-section, .widget {
            border-radius: 12px !important;
            border: 1px solid #e2e8f0 !important;
        }
        .form-section .section-head {
            background: linear-gradient(to right, #faf5ff, transparent) !important;
            color: #a404e4 !important;
            font-weight: 600 !important;
            border-radius: 8px 8px 0 0 !important;
        }
        .frappe-control.has-error input {
            border-color: #ef4444 !important;
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
        .indicator-pill.green, .indicator.green { background: #d1fae5 !important; color: #065f46 !important; }
        .indicator-pill.red, .indicator.red { background: #fee2e2 !important; color: #991b1b !important; }
        .indicator-pill.yellow, .indicator-pill.orange, .indicator.yellow, .indicator.orange { background: #fef3c7 !important; color: #92400e !important; }
        .indicator-pill.blue, .indicator.blue { background: #f3e8ff !important; color: #a404e4 !important; }
        .indicator-pill.purple, .indicator.purple { background: #f3e8ff !important; color: #a404e4 !important; }

        /* ===== HIDE ALL SYSTEM BRANDING ===== */
        .powered-by-frappe,
        .footer-powered,
        .setup-wizard-brand,
        .erpnext-footer,
        [data-page-container] .footer,
        .app-logo,
        .frappe-brand,
        .navbar-brand img,
        .modal-footer .text-muted:contains('Frappe'),
        .help-links a[href*="frappe"],
        .help-links a[href*="erpnext"],
        a[href*="frappecloud.com"],
        a[href*="erpnext.com"],
        a[href*="frappe.io"],
        .about-app .text-muted,
        /* Hide ERPNext modules */
        a[href*="/app/stock"], a[href*="/app/assets"],
        a[href*="/app/manufacturing"], a[href*="/app/quality"],
        a[href*="/app/projects"], a[href*="/app/support"],
        a[href*="/app/website"], a[href*="/app/crm"],
        a[href*="/app/tools"], a[href*="/app/build"],
        a[href*="/app/erpnext-settings"], a[href*="/app/erpnext-integrations"],
        a[href*="/app/integrations"],
        a[href*="/app/hr"], a[href*="/app/payroll"],
        a[href*="/app/education"], a[href*="/app/healthcare"],
        a[href*="/app/non-profit"], a[href*="/app/agriculture"],
        /* Hide system consoles */
        a[href*="/app/system-console"],
        a[href*="/app/background_jobs"],
        a[href*="/app/recorder"],
        a[href*="/app/server-script"],
        a[href*="/app/client-script"],
        a[href*="/app/logs"] {
            display: none !important;
        }

        /* ===== LOADING SPLASH ===== */
        .splash, .splash-screen {
            background: linear-gradient(135deg, #a404e4 0%, #8501b9 100%) !important;
        }
        .splash .splash-text, .splash-screen .splash-text {
            color: white !important;
        }

        /* ===== MODALS ===== */
        .modal-header {
            background: linear-gradient(to right, #faf5ff, white) !important;
            border-bottom: 1px solid #e2e8f0 !important;
        }
        .modal-title {
            color: #1e293b !important;
            font-weight: 600 !important;
        }
        .modal-content {
            border-radius: 16px !important;
            border: none !important;
            box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25) !important;
        }

        /* ===== NOTIFICATIONS ===== */
        .desk-alert, .alert, .frappe-alert {
            border-radius: 8px !important;
            border-left: 4px solid #a404e4 !important;
        }
        .toast {
            border-radius: 8px !important;
            font-family: 'Poppins', sans-serif !important;
        }

        /* ===== LOGIN PAGE ===== */
        .for-login .page-card {
            border-radius: 16px !important;
            box-shadow: 0 25px 50px -12px rgba(0,0,0,0.15) !important;
        }
        .for-login .page-card-head {
            background: linear-gradient(135deg, #a404e4 0%, #8501b9 100%) !important;
            color: white !important;
            border-radius: 16px 16px 0 0 !important;
        }
        .for-login .page-card-head .page-title {
            color: white !important;
        }
        .for-login .btn-primary {
            width: 100% !important;
            padding: 12px !important;
            font-weight: 600 !important;
        }
        .for-login .app-logo,
        .for-login .navbar-brand img,
        .for-login .powered-by {
            display: none !important;
        }

        /* ===== ERROR PAGES ===== */
        .page-not-found, .error-page, .permission-error {
            background: linear-gradient(135deg, #faf5ff 0%, white 100%) !important;
        }

        /* ===== PRINT STYLES ===== */
        @media print {
            .powered-by-frappe, .footer-powered, .frappe-brand,
            .erpnext-footer, [class*="frappe"], [class*="erpnext"] {
                display: none !important;
            }
            .print-heading::after {
                content: "DigiComply" !important;
            }
        }

        /* ===== PDF EXPORT OVERRIDE ===== */
        .print-format-builder .footer,
        .print-format .footer {
            font-family: 'Poppins', sans-serif !important;
        }

        /* ===== MOBILE RESPONSIVE ===== */
        @media (max-width: 768px) {
            .navbar-brand span {
                font-size: 0.9rem !important;
            }
            .desk-sidebar {
                width: 260px !important;
            }
            .shortcut-widget-box {
                min-width: auto !important;
            }
            #dc-quick-nav {
                bottom: 70px !important;
            }
            .form-section {
                padding: 12px !important;
            }
            .page-container {
                padding: 8px !important;
            }
            .modal-dialog {
                margin: 10px !important;
            }
            .frappe-card {
                margin-bottom: 12px !important;
            }
        }

        @media (max-width: 480px) {
            .navbar-brand span span:last-child {
                display: none !important;
            }
            .dc-getting-started > div {
                flex-direction: column !important;
            }
            #dc-quick-nav .dc-fab {
                width: 40px !important;
                height: 40px !important;
            }
        }

        /* ===== AWESOMEBAR ===== */
        .awesomebar-container {
            border-radius: 8px !important;
        }
        .awesomebar input {
            font-family: 'Poppins', sans-serif !important;
        }

        /* ===== HELP DROPDOWN OVERRIDE ===== */
        .dropdown-help .dropdown-menu a[href*="docs.erpnext"],
        .dropdown-help .dropdown-menu a[href*="discuss.frappe"],
        .dropdown-help .dropdown-menu a[href*="frappecloud"],
        .dropdown-help .dropdown-menu a[href*="frappe.io"],
        .help-menu a[href*="docs.erpnext"],
        .help-menu a[href*="discuss.frappe"] {
            display: none !important;
        }

        /* ===== CUSTOM SCROLLBAR ===== */
        ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }
        ::-webkit-scrollbar-track {
            background: #f1f5f9;
        }
        ::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: #a404e4;
        }

        /* ===== DATATABLE ===== */
        .dt-header {
            background: #faf5ff !important;
        }
        .dt-row-selected {
            background: rgba(164, 4, 228, 0.1) !important;
        }
        .dt-cell--highlight {
            background: rgba(164, 4, 228, 0.05) !important;
        }

        /* ===== FRAPPE CHAT OVERRIDE ===== */
        .chat-bubble.sender {
            background: #a404e4 !important;
        }

        /* ===== ONBOARDING ===== */
        .onboarding-success .icon {
            color: #a404e4 !important;
        }
    `;
    document.head.appendChild(style);
})();

// ============================================
// BLOCK SYSTEM ROUTES (Admin only pages)
// ============================================
digicomply.security = {
    blockSystemRoutes: function() {
        // Don't block for System Manager
        if (frappe.user_roles && frappe.user_roles.includes("System Manager")) {
            return;
        }

        const currentRoute = frappe.get_route_str();
        const blockedRoutes = digicomply.config.BLOCKED_ROUTES;

        for (const route of blockedRoutes) {
            if (currentRoute.includes(route)) {
                frappe.msgprint({
                    title: __("Access Restricted"),
                    message: __("This page is not available. Please contact your administrator."),
                    indicator: "red"
                });
                frappe.set_route("app");
                return;
            }
        }
    },

    hideAdminLinks: function() {
        // Hide admin-only links for non-System Managers
        if (frappe.user_roles && !frappe.user_roles.includes("System Manager")) {
            $('a[href*="system-console"], a[href*="background_jobs"], a[href*="recorder"]').remove();
            $('a[href*="server-script"], a[href*="client-script"]').remove();
        }
    }
};

// ============================================
// WORKSPACE FILTERING
// ============================================
digicomply.filter = {
    hideUnwanted: function() {
        const config = digicomply.config;

        // Hide sidebar items by text
        $(".desk-sidebar .sidebar-item-container, .sidebar-menu .sidebar-item-container, .standard-sidebar-item").each(function() {
            const text = $(this).text().trim();
            let allowed = config.ALLOWED_WORKSPACES.some(w => text.includes(w)) ||
                         text.includes("Accounts") || text === "";

            if (!allowed && text.length > 0) {
                $(this).remove();
            }
        });

        // Hide by specific module names
        $(".desk-sidebar a, .sidebar-menu a, .standard-sidebar-item a").each(function() {
            const text = $(this).text().trim();
            if (config.HIDE_MODULES.includes(text)) {
                $(this).closest(".sidebar-item-container, .standard-sidebar-item").remove();
                $(this).parent().remove();
            }
        });

        // Hide module cards on workspace pages
        $(".module-card, .widget.shortcut-widget-box").each(function() {
            const text = $(this).text().trim();
            let shouldHide = config.HIDE_MODULES.some(m => text.includes(m));
            if (shouldHide) {
                $(this).hide();
            }
        });

        // Hide by href patterns
        config.HIDE_MODULES.forEach(item => {
            const slug = item.toLowerCase().replace(/ /g, '-');
            $(`a[href*="/app/${slug}"]`).closest(".sidebar-item-container, .standard-sidebar-item, .widget").remove();
        });

        // Hide empty sections
        $(".standard-sidebar-section, .sidebar-section").each(function() {
            if ($(this).find("a:visible").length === 0) {
                $(this).hide();
            }
        });

        // Hide help links pointing to Frappe/ERPNext
        $('a[href*="docs.erpnext.com"], a[href*="discuss.frappe.io"], a[href*="frappe.io"]').remove();
    }
};

// ============================================
// BRANDING - Complete Override
// ============================================
digicomply.branding = {
    apply: function() {
        // Page title - replace all generic branding
        document.title = document.title
            .replace(/Frappe/gi, digicomply.config.BRAND_NAME)
            .replace(/ERPNext/gi, digicomply.config.BRAND_NAME)
            .replace(/Desk/gi, digicomply.config.BRAND_NAME);

        // Navbar brand - complete replacement
        if ($(".navbar-brand").length && !$(".navbar-brand").hasClass("dc-branded")) {
            $(".navbar-brand")
                .addClass("dc-branded")
                .empty()
                .html(`
                    <div style="display:flex;align-items:center;gap:12px;cursor:pointer;" onclick="frappe.set_route('app')">
                        <div style="width:36px;height:36px;background:rgba(255,255,255,0.2);border-radius:10px;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);">
                            <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
                                <path d="M9 16 L13 20 L23 10" stroke="white" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                        <span style="font-family:'Poppins',sans-serif;font-weight:700;font-size:1.15rem;letter-spacing:0.5px;">
                            <span style="color:white;">DIGI</span><span style="color:rgba(255,255,255,0.85);">COMPLY</span>
                        </span>
                    </div>
                `);
        }

        // Replace any remaining Frappe/ERPNext text in visible elements
        this.replaceTextNodes();

        // Search placeholder
        $("input[data-doctype='Search'], .search-bar input, .awesomebar input").attr("placeholder", "Search DigiComply...");

        // Remove all system footers and branding elements
        $(".powered-by-frappe, .footer-powered, .frappe-brand, .erpnext-footer").remove();

        // Fix any "App Logo" text
        $(".navbar-brand").contents().filter(function() {
            return this.nodeType === 3 && (this.textContent.includes("App Logo") || this.textContent.includes("Frappe"));
        }).remove();

        // Override favicon
        this.setFavicon();
    },

    replaceTextNodes: function() {
        // Replace text in visible elements only (performance optimization)
        const elementsToCheck = document.querySelectorAll('.page-title, .title-text, h1, h2, h3, .modal-title, .msgprint-dialog .modal-title');
        elementsToCheck.forEach(el => {
            if (el.childNodes) {
                el.childNodes.forEach(node => {
                    if (node.nodeType === 3) { // Text node
                        node.textContent = node.textContent
                            .replace(/Frappe/gi, digicomply.config.BRAND_NAME)
                            .replace(/ERPNext/gi, digicomply.config.BRAND_NAME);
                    }
                });
            }
        });
    },

    setFavicon: function() {
        // Set custom favicon
        let link = document.querySelector("link[rel*='icon']");
        if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
        }
        link.type = 'image/svg+xml';
        link.href = '/assets/digicomply/images/favicon.svg';
    }
};

// ============================================
// OVERRIDE DIALOGS - Complete White-Label
// ============================================
digicomply.dialogs = {
    overrideAbout: function() {
        if (frappe.ui && frappe.ui.toolbar) {
            // Override show_about
            frappe.ui.toolbar.show_about = function() {
                frappe.msgprint({
                    title: __("About DigiComply"),
                    message: `
                        <div style="text-align:center;padding:24px 16px;">
                            <div style="width:72px;height:72px;background:linear-gradient(135deg, #a404e4 0%, #8501b9 100%);border-radius:16px;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">
                                <svg width="40" height="40" viewBox="0 0 32 32" fill="none">
                                    <path d="M9 16 L13 20 L23 10" stroke="white" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </div>
                            <h3 style="color:#1e293b;margin:0 0 4px 0;font-weight:700;">DigiComply</h3>
                            <p style="color:#64748b;margin:0 0 8px 0;font-size:14px;">UAE E-Invoicing Compliance Platform</p>
                            <p style="color:#94a3b8;font-size:12px;margin:0 0 20px 0;">Version ${digicomply.config.VERSION}</p>
                            <div style="background:#f8fafc;border-radius:12px;padding:16px;text-align:left;">
                                <p style="color:#475569;font-size:13px;margin:0 0 12px 0;line-height:1.6;">
                                    DigiComply helps UAE businesses stay compliant with FTA e-invoicing requirements through automated reconciliation and ASP integration.
                                </p>
                                <div style="display:flex;gap:12px;flex-wrap:wrap;">
                                    <a href="mailto:${digicomply.config.SUPPORT_EMAIL}" style="color:#a404e4;font-size:12px;text-decoration:none;">
                                        📧 ${digicomply.config.SUPPORT_EMAIL}
                                    </a>
                                </div>
                            </div>
                            <p style="color:#cbd5e1;font-size:11px;margin:20px 0 0 0;">
                                © ${new Date().getFullYear()} DigiComply. All rights reserved.
                            </p>
                        </div>
                    `,
                    indicator: "purple"
                });
            };
        }
    },

    overrideHelp: function() {
        // Override help menu items
        if (frappe.ui && frappe.ui.toolbar && frappe.ui.toolbar.setup_help) {
            const originalSetupHelp = frappe.ui.toolbar.setup_help;
            frappe.ui.toolbar.setup_help = function() {
                // Call original but then modify
                if (originalSetupHelp) originalSetupHelp.call(this);

                // Remove Frappe/ERPNext help links
                setTimeout(() => {
                    $('.dropdown-help a[href*="frappe"], .dropdown-help a[href*="erpnext"]').remove();
                    $('.help-menu a[href*="frappe"], .help-menu a[href*="erpnext"]').remove();
                }, 100);
            };
        }

        // Override keyboard shortcuts modal
        if (frappe.ui && frappe.ui.toolbar) {
            frappe.ui.toolbar.show_shortcuts = function() {
                frappe.msgprint({
                    title: __("Keyboard Shortcuts"),
                    message: `
                        <div style="padding:8px 0;">
                            <table style="width:100%;font-size:13px;">
                                <tr><td style="padding:8px 0;"><kbd style="background:#f1f5f9;padding:4px 8px;border-radius:4px;">Alt + D</kbd></td><td style="padding:8px 0;color:#64748b;">Go to Dashboard</td></tr>
                                <tr><td style="padding:8px 0;"><kbd style="background:#f1f5f9;padding:4px 8px;border-radius:4px;">Alt + N</kbd></td><td style="padding:8px 0;color:#64748b;">New Reconciliation</td></tr>
                                <tr><td style="padding:8px 0;"><kbd style="background:#f1f5f9;padding:4px 8px;border-radius:4px;">Alt + U</kbd></td><td style="padding:8px 0;color:#64748b;">Upload CSV</td></tr>
                                <tr><td style="padding:8px 0;"><kbd style="background:#f1f5f9;padding:4px 8px;border-radius:4px;">Alt + S</kbd></td><td style="padding:8px 0;color:#64748b;">Open Search</td></tr>
                                <tr><td style="padding:8px 0;"><kbd style="background:#f1f5f9;padding:4px 8px;border-radius:4px;">Ctrl + E</kbd></td><td style="padding:8px 0;color:#64748b;">Edit Mode</td></tr>
                                <tr><td style="padding:8px 0;"><kbd style="background:#f1f5f9;padding:4px 8px;border-radius:4px;">Ctrl + S</kbd></td><td style="padding:8px 0;color:#64748b;">Save</td></tr>
                            </table>
                        </div>
                    `,
                    indicator: "blue"
                });
            };
        }
    },

    overrideErrorDialogs: function() {
        // Override error handling to remove Frappe branding
        if (frappe.throw) {
            const originalThrow = frappe.throw;
            frappe.throw = function(msg) {
                if (typeof msg === 'string') {
                    msg = msg.replace(/Frappe/gi, 'DigiComply').replace(/ERPNext/gi, 'DigiComply');
                }
                return originalThrow.call(this, msg);
            };
        }

        // Override msgprint to clean messages
        if (frappe.msgprint) {
            const originalMsgprint = frappe.msgprint;
            frappe.msgprint = function(msg, title) {
                if (typeof msg === 'string') {
                    msg = msg.replace(/Frappe/gi, 'DigiComply').replace(/ERPNext/gi, 'DigiComply');
                } else if (msg && msg.message) {
                    msg.message = msg.message.replace(/Frappe/gi, 'DigiComply').replace(/ERPNext/gi, 'DigiComply');
                }
                if (title) {
                    title = title.replace(/Frappe/gi, 'DigiComply').replace(/ERPNext/gi, 'DigiComply');
                }
                return originalMsgprint.call(this, msg, title);
            };
        }
    }
};

// ============================================
// LOGIN PAGE BRANDING
// ============================================
digicomply.login = {
    brand: function() {
        if (!$("body").hasClass("for-login")) return;

        // Replace login page title
        $(".page-card-head .page-title").html(`
            <div style="display:flex;align-items:center;justify-content:center;gap:12px;">
                <div style="width:40px;height:40px;background:rgba(255,255,255,0.2);border-radius:10px;display:flex;align-items:center;justify-content:center;">
                    <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
                        <path d="M9 16 L13 20 L23 10" stroke="white" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                <span style="font-weight:700;font-size:1.5rem;">DigiComply</span>
            </div>
        `);

        // Add tagline
        if (!$(".dc-login-tagline").length) {
            $(".page-card-head").append(`
                <p class="dc-login-tagline" style="color:rgba(255,255,255,0.8);font-size:13px;margin:8px 0 0 0;text-align:center;">
                    UAE E-Invoicing Compliance Platform
                </p>
            `);
        }

        // Remove powered by
        $(".for-login .powered-by, .for-login .text-muted").remove();

        // Style the login button
        $(".for-login .btn-primary").text("Sign In to DigiComply");
    }
};

// ============================================
// ERROR PAGES BRANDING
// ============================================
digicomply.errorPages = {
    brand: function() {
        // 404 page
        if ($(".page-not-found").length || $("body").text().includes("Page not found")) {
            this.show404();
        }

        // Permission error
        if ($(".permission-error").length) {
            this.showPermissionError();
        }
    },

    show404: function() {
        $(".page-container").html(`
            <div style="text-align:center;padding:80px 20px;">
                <div style="font-size:120px;color:#e2e8f0;font-weight:700;line-height:1;">404</div>
                <h2 style="color:#1e293b;margin:24px 0 8px 0;">Page Not Found</h2>
                <p style="color:#64748b;margin:0 0 32px 0;">The page you're looking for doesn't exist in DigiComply.</p>
                <a href="/app" class="btn btn-primary">Go to Dashboard</a>
            </div>
        `);
    },

    showPermissionError: function() {
        $(".permission-error").html(`
            <div style="text-align:center;padding:80px 20px;">
                <div style="width:80px;height:80px;background:#fee2e2;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 24px;">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                </div>
                <h2 style="color:#1e293b;margin:0 0 8px 0;">Access Denied</h2>
                <p style="color:#64748b;margin:0 0 32px 0;">You don't have permission to access this page.</p>
                <a href="/app" class="btn btn-primary">Return to Dashboard</a>
            </div>
        `);
    }
};

// ============================================
// PDF & PRINT OVERRIDE
// ============================================
digicomply.print = {
    overrideFooter: function() {
        // Override print footer
        if (frappe.render_page) {
            const originalRender = frappe.render_page;
            frappe.render_page = function() {
                const result = originalRender.apply(this, arguments);
                // Replace any Frappe/ERPNext in print output
                if (typeof result === 'string') {
                    return result
                        .replace(/Powered by Frappe/gi, 'Generated by DigiComply')
                        .replace(/Powered by ERPNext/gi, 'Generated by DigiComply')
                        .replace(/frappe\.io/gi, 'digicomply.ae')
                        .replace(/erpnext\.com/gi, 'digicomply.ae');
                }
                return result;
            };
        }

        // Add custom print footer style
        if (!$("#dc-print-style").length) {
            $("head").append(`
                <style id="dc-print-style">
                    @media print {
                        .print-format::after {
                            content: "Generated by DigiComply - UAE E-Invoicing Compliance Platform";
                            display: block;
                            text-align: center;
                            font-size: 10px;
                            color: #94a3b8;
                            margin-top: 20px;
                            padding-top: 10px;
                            border-top: 1px solid #e2e8f0;
                        }
                        .powered-by-frappe, .frappe-brand, .erpnext-footer {
                            display: none !important;
                        }
                    }
                </style>
            `);
        }
    }
};

// ============================================
// NOTIFICATIONS OVERRIDE
// ============================================
digicomply.notifications = {
    style: function() {
        // Style system notifications
        $(".desk-alert").each(function() {
            const text = $(this).text();
            if (text.includes("Frappe") || text.includes("ERPNext")) {
                $(this).html($(this).html()
                    .replace(/Frappe/gi, 'DigiComply')
                    .replace(/ERPNext/gi, 'DigiComply'));
            }
        });
    }
};

// ============================================
// NAVIGATION ENHANCEMENTS
// ============================================
digicomply.navigation = {
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

    addQuickNav: function() {
        if ($("#dc-quick-nav").length) return;

        const quickNav = $(`
            <div id="dc-quick-nav" style="
                position: fixed;
                bottom: 24px;
                right: 24px;
                display: flex;
                gap: 10px;
                z-index: 1000;
            ">
                <button class="btn btn-primary btn-sm dc-fab" onclick="frappe.set_route('compliance_dashboard')" title="Dashboard (Alt+D)">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="7" height="7"></rect>
                        <rect x="14" y="3" width="7" height="7"></rect>
                        <rect x="14" y="14" width="7" height="7"></rect>
                        <rect x="3" y="14" width="7" height="7"></rect>
                    </svg>
                </button>
                <button class="btn dc-fab" style="background:#10b981;border:none;color:white;" onclick="frappe.new_doc('Reconciliation Run')" title="New Reconciliation (Alt+N)">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                </button>
            </div>
        `);

        if (!$("#dc-fab-style").length) {
            $("head").append(`
                <style id="dc-fab-style">
                    .dc-fab {
                        width: 48px !important;
                        height: 48px !important;
                        border-radius: 14px !important;
                        padding: 0 !important;
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        box-shadow: 0 4px 14px rgba(0,0,0,0.15) !important;
                        transition: all 0.2s ease !important;
                    }
                    .dc-fab:hover {
                        transform: translateY(-3px) !important;
                        box-shadow: 0 8px 20px rgba(0,0,0,0.2) !important;
                    }
                </style>
            `);
        }

        $("body").append(quickNav);
    }
};

// ============================================
// FORM ENHANCEMENTS - Simplified & Modern
// ============================================
digicomply.forms = {
    // PROTECTED DOCTYPES - Never hide any fields on these DocTypes
    PROTECTED_DOCTYPES: [
        "E Invoice", "VAT Return", "FTA Report", "Reconciliation Run",
        "Reconciliation Result", "ASP Connection", "TRN Validation",
        "DigiComply Settings", "Compliance Dashboard", "CSV Import",
        "Bank Reconciliation Run", "Bank Statement", "Bank Statement Line"
    ],

    // PROTECTED FIELDS - Never hide these (DigiComply-specific)
    PROTECTED_FIELDS: [
        // Core compliance fields
        "trn", "tax_registration_number", "vat_registration", "supplier_trn", "customer_trn",
        "e_invoice_status", "irn", "qr_code", "qr_code_data", "signature_valid",
        "reconciliation_status", "compliance_status", "fta_status",
        // Invoice essentials
        "posting_date", "due_date", "grand_total", "net_total", "total_taxes_and_charges",
        "customer", "supplier", "customer_name", "supplier_name", "company",
        // VAT fields
        "vat_amount", "vat_rate", "tax_amount", "is_reverse_charge",
        "output_vat", "input_vat", "vat_due",
        // DigiComply DocType fields
        "asp_connection", "submission_status", "submission_date", "response_data",
        "document_hash", "validation_status", "sync_status"
    ],

    // PROTECTED SECTIONS - Never collapse these
    PROTECTED_SECTIONS: [
        "compliance_section", "e_invoice_section", "vat_section",
        "tax_section", "totals_section", "items_section"
    ],

    // Fields to hide across all DocTypes (ERPNext/Frappe internal fields)
    GLOBAL_HIDDEN_FIELDS: [
        // ERPNext internal fields
        "naming_series", "amended_from", "is_internal_customer", "is_internal_supplier",
        "represents_company", "inter_company_order_reference", "is_subcontracted",
        "scan_barcode", "set_warehouse", "set_target_warehouse", "set_from_warehouse",
        "party_account_currency", "conversion_rate", "buying_price_list", "price_list_currency",
        "plc_conversion_rate", "ignore_pricing_rule", "is_internal_transfer",
        // System fields
        "letter_head", "select_print_heading", "language", "group_same_items",
        "auto_repeat", "update_auto_repeat_reference", "subscription",
        // Accounting internal
        "use_company_roundoff_cost_center", "cost_center", "project",
        // Timestamps shown elsewhere
        "creation", "modified", "owner", "modified_by"
    ],

    // Fields to hide per DocType
    DOCTYPE_HIDDEN_FIELDS: {
        "Sales Invoice": [
            "is_pos", "pos_profile", "is_consolidated", "is_return", "is_debit_note",
            "update_outstanding_for_self", "return_against", "update_stock",
            "is_opening", "unrealized_profit_loss_account", "against_income_account",
            "c_form_applicable", "c_form_no", "write_off_outstanding_amount_automatically",
            "write_off_account", "write_off_cost_center", "allocate_advances_automatically",
            "get_advances", "inter_company_invoice_reference", "campaign", "source",
            "customer_group", "territory", "shipping_rule", "tc_name", "terms"
        ],
        "Purchase Invoice": [
            "is_return", "return_against", "apply_tds", "is_opening", "unrealized_profit_loss_account",
            "is_subcontracted", "supplier_warehouse", "update_stock", "rejected_warehouse",
            "is_old_subcontracting_flow", "write_off_account", "write_off_cost_center",
            "allocate_advances_automatically", "get_advances", "inter_company_invoice_reference",
            "on_hold", "hold_comment", "release_date", "supplier_group", "tc_name", "terms"
        ],
        "Customer": [
            "lead_name", "opportunity_name", "account_manager", "default_bank_account",
            "is_internal_customer", "represents_company", "website", "print_language",
            "companies", "customer_group", "territory", "image"
        ],
        "Supplier": [
            "supplier_type", "is_transporter", "image", "supplier_group", "is_internal_supplier",
            "represents_company", "default_bank_account", "print_language", "website", "companies"
        ],
        "Item": [
            "naming_series", "item_group", "stock_uom", "disabled", "allow_alternative_item",
            "is_stock_item", "has_variants", "include_item_in_manufacturing", "opening_stock",
            "valuation_rate", "standard_rate", "is_fixed_asset", "auto_create_assets",
            "asset_category", "asset_naming_series", "end_of_life", "default_material_request_type",
            "safety_stock", "lead_time_days", "shelf_life_in_days", "has_serial_no",
            "serial_no_series", "has_batch_no", "create_new_batch", "batch_number_series",
            "has_expiry_date", "retain_sample", "sample_quantity", "manufacturer",
            "manufacturer_part_no", "inspection_required_before_purchase",
            "inspection_required_before_delivery", "is_customer_provided_item", "customer"
        ]
    },

    // Sections to collapse by default
    COLLAPSED_SECTIONS: [
        "more_info_section", "accounting_details_section", "terms_section",
        "more_information", "additional_info", "other_details", "other_info",
        "currency_and_price_list", "accounting_dimensions_section", "contact_and_address",
        "subscription_section", "auto_repeat_section", "printing_settings",
        "accounting_entries_section", "tax_break_up_section", "connections_tab"
    ],

    enhance: function() {
        // Placeholder improvements
        $("input[data-fieldname='company']").attr("placeholder", "Select your company...");
        $("input[data-fieldname='customer']").attr("placeholder", "Search customer...");
        $("input[data-fieldname='supplier']").attr("placeholder", "Search supplier...");
        $("input[data-fieldname='item_code']").attr("placeholder", "Search item...");
        $(".form-control.reqd").addClass("dc-required");

        // Apply field hiding (with protection for DigiComply fields)
        this.hideGlobalFields();
        this.hideDocTypeFields();
        this.collapseSections();

        // CRITICAL: Ensure DigiComply fields are NEVER hidden
        this.ensureProtectedVisible();

        this.modernizeFormLayout();
    },

    hideGlobalFields: function() {
        const doctype = cur_frm && cur_frm.doctype;
        // Skip hiding on DigiComply DocTypes - show everything
        if (doctype && this.PROTECTED_DOCTYPES.includes(doctype)) return;

        const protected = this.PROTECTED_FIELDS;
        this.GLOBAL_HIDDEN_FIELDS.forEach(field => {
            // Never hide protected DigiComply fields
            if (protected.includes(field)) return;
            $(`.frappe-control[data-fieldname="${field}"]`).addClass("dc-hidden-field").hide();
        });
    },

    hideDocTypeFields: function() {
        const doctype = cur_frm && cur_frm.doctype;
        if (!doctype) return;

        // Skip hiding on DigiComply DocTypes - show everything
        if (this.PROTECTED_DOCTYPES.includes(doctype)) return;

        if (!this.DOCTYPE_HIDDEN_FIELDS[doctype]) return;

        const protected = this.PROTECTED_FIELDS;
        this.DOCTYPE_HIDDEN_FIELDS[doctype].forEach(field => {
            // Never hide protected DigiComply fields
            if (protected.includes(field)) return;
            $(`.frappe-control[data-fieldname="${field}"]`).addClass("dc-hidden-field").hide();
        });
    },

    collapseSections: function() {
        const protectedSections = this.PROTECTED_SECTIONS;
        this.COLLAPSED_SECTIONS.forEach(section => {
            // Never collapse protected compliance sections
            if (protectedSections.some(ps => section.includes(ps))) return;
            const $section = $(`.section-head[data-fieldname="${section}"], .form-section[data-fieldname="${section}"]`);
            if ($section.length && !$section.hasClass("dc-collapsed")) {
                $section.addClass("dc-collapsed collapsed");
                $section.find(".section-body").hide();
            }
        });
    },

    // Ensure protected fields are always visible
    ensureProtectedVisible: function() {
        this.PROTECTED_FIELDS.forEach(field => {
            $(`.frappe-control[data-fieldname="${field}"]`).removeClass("dc-hidden-field").show();
        });
        this.PROTECTED_SECTIONS.forEach(section => {
            $(`.section-head[data-fieldname="${section}"], .form-section[data-fieldname="${section}"]`)
                .removeClass("dc-collapsed collapsed")
                .find(".section-body").show();
        });
    },

    modernizeFormLayout: function() {
        // Add modern spacing and styling to forms
        if (!$("#dc-form-modern-style").length) {
            $("head").append(`
                <style id="dc-form-modern-style">
                    /* === SIMPLIFIED FORM LAYOUT === */
                    .dc-hidden-field {
                        display: none !important;
                    }

                    /* Form page wrapper */
                    .form-page {
                        background: #f8fafc !important;
                    }

                    /* Form card styling */
                    .form-layout, .form-section {
                        background: white !important;
                        border-radius: 12px !important;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.08) !important;
                        margin-bottom: 16px !important;
                        overflow: hidden;
                    }

                    /* Section headers - clean modern look */
                    .section-head {
                        background: linear-gradient(to right, #faf5ff, #ffffff) !important;
                        padding: 14px 20px !important;
                        font-weight: 600 !important;
                        font-size: 14px !important;
                        color: #a404e4 !important;
                        border-bottom: 1px solid #f1f5f9 !important;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }

                    .section-head::before {
                        content: "";
                        width: 4px;
                        height: 18px;
                        background: linear-gradient(to bottom, #a404e4, #c44df7);
                        border-radius: 2px;
                    }

                    .section-head.collapsed {
                        background: #f8fafc !important;
                        color: #64748b !important;
                    }

                    .section-head.collapsed::before {
                        background: #cbd5e1;
                    }

                    /* Section body padding */
                    .section-body {
                        padding: 20px !important;
                    }

                    /* Form control labels */
                    .control-label {
                        font-size: 12px !important;
                        font-weight: 500 !important;
                        color: #64748b !important;
                        text-transform: uppercase !important;
                        letter-spacing: 0.5px !important;
                        margin-bottom: 6px !important;
                    }

                    /* Required field indicator */
                    .control-label .text-danger,
                    .control-label .reqd {
                        color: #ef4444 !important;
                    }

                    /* Form inputs modern styling */
                    .form-control, .input-with-feedback {
                        border-radius: 8px !important;
                        border: 1px solid #e2e8f0 !important;
                        padding: 10px 14px !important;
                        font-size: 14px !important;
                        transition: all 0.2s ease !important;
                    }

                    .form-control:focus, .input-with-feedback:focus {
                        border-color: #a404e4 !important;
                        box-shadow: 0 0 0 3px rgba(164, 4, 228, 0.1) !important;
                        outline: none !important;
                    }

                    /* Select dropdowns */
                    select.form-control {
                        appearance: none;
                        background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
                        background-position: right 10px center;
                        background-repeat: no-repeat;
                        background-size: 20px;
                        padding-right: 36px !important;
                    }

                    /* Link fields with icon */
                    .control-input-wrapper .link-btn,
                    .control-input-wrapper .btn-open {
                        border-radius: 0 8px 8px 0 !important;
                        background: #f8fafc !important;
                        border-left: 1px solid #e2e8f0 !important;
                    }

                    /* Checkbox modern styling */
                    .checkbox .disp-area {
                        width: 20px !important;
                        height: 20px !important;
                        border-radius: 6px !important;
                        border: 2px solid #e2e8f0 !important;
                    }

                    input[type="checkbox"]:checked + .disp-area {
                        background: #a404e4 !important;
                        border-color: #a404e4 !important;
                    }

                    /* Form timeline - hide for cleaner look */
                    .form-sidebar .form-shared,
                    .form-sidebar .form-sidebar-stats,
                    .form-sidebar .sidebar-info {
                        display: none !important;
                    }

                    /* Form actions bar */
                    .page-actions {
                        background: white !important;
                        border-radius: 0 0 12px 12px !important;
                        box-shadow: 0 -1px 3px rgba(0,0,0,0.05) !important;
                        padding: 12px 20px !important;
                    }

                    /* Tab navigation modern */
                    .form-tabs .nav-link {
                        font-size: 13px !important;
                        font-weight: 500 !important;
                        padding: 10px 16px !important;
                        border-radius: 8px 8px 0 0 !important;
                        color: #64748b !important;
                    }

                    .form-tabs .nav-link.active {
                        color: #a404e4 !important;
                        background: white !important;
                        border-bottom: 2px solid #a404e4 !important;
                    }

                    /* Table fields - cleaner */
                    .frappe-control[data-fieldtype="Table"] .form-grid {
                        border-radius: 8px !important;
                        overflow: hidden !important;
                        border: 1px solid #e2e8f0 !important;
                    }

                    .form-grid .grid-heading-row {
                        background: #f8fafc !important;
                    }

                    .form-grid .grid-row {
                        border-bottom: 1px solid #f1f5f9 !important;
                    }

                    /* Comment box hide */
                    .comment-box {
                        display: none !important;
                    }

                    /* Quick Entry modal simplified */
                    .modal-dialog.modal-lg .modal-content {
                        border-radius: 16px !important;
                    }

                    /* Empty state for tables */
                    .grid-empty {
                        padding: 40px !important;
                        color: #94a3b8 !important;
                        font-style: italic;
                    }
                </style>
            `);
        }
    }
};

// ============================================
// LIST VIEW MODERNIZATION
// ============================================
digicomply.listview = {
    enhance: function() {
        this.modernizeListStyle();
        this.enhanceFilters();
        this.addQuickActions();
    },

    modernizeListStyle: function() {
        if ($("#dc-list-modern-style").length) return;

        $("head").append(`
            <style id="dc-list-modern-style">
                /* === MODERN LIST VIEW === */

                /* List page background */
                .page-container[data-page-container="true"] {
                    background: #f8fafc !important;
                    min-height: 100vh;
                }

                /* List header with gradient */
                .list-row-head {
                    background: linear-gradient(to right, #faf5ff, white) !important;
                    border-radius: 12px 12px 0 0 !important;
                    padding: 14px 20px !important;
                    border-bottom: 1px solid #e2e8f0 !important;
                }

                .list-row-head .list-row-col {
                    font-weight: 600 !important;
                    font-size: 12px !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.5px !important;
                    color: #64748b !important;
                }

                /* List container card */
                .frappe-list {
                    background: white !important;
                    border-radius: 12px !important;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.08) !important;
                    overflow: hidden;
                    border: 1px solid #e2e8f0 !important;
                }

                /* List rows */
                .list-row {
                    padding: 16px 20px !important;
                    border-bottom: 1px solid #f1f5f9 !important;
                    transition: all 0.15s ease !important;
                }

                .list-row:hover {
                    background: #faf5ff !important;
                }

                .list-row:last-child {
                    border-bottom: none !important;
                }

                /* List row content */
                .list-row-col {
                    font-size: 14px !important;
                    color: #1e293b !important;
                }

                .list-row-col.ellipsis a {
                    color: #a404e4 !important;
                    font-weight: 500 !important;
                }

                .list-row-col.ellipsis a:hover {
                    color: #8501b9 !important;
                }

                /* Status indicators in list */
                .list-row .indicator-pill {
                    font-size: 11px !important;
                    padding: 4px 10px !important;
                    border-radius: 20px !important;
                    font-weight: 500 !important;
                }

                /* List sidebar (filters) */
                .list-sidebar {
                    background: white !important;
                    border-radius: 12px !important;
                    padding: 16px !important;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.08) !important;
                    margin-right: 20px !important;
                    border: 1px solid #e2e8f0 !important;
                }

                .list-sidebar .list-link {
                    padding: 8px 12px !important;
                    border-radius: 6px !important;
                    margin-bottom: 4px !important;
                }

                .list-sidebar .list-link:hover,
                .list-sidebar .list-link.active {
                    background: #faf5ff !important;
                    color: #a404e4 !important;
                }

                .list-sidebar .sidebar-label {
                    font-size: 10px !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.5px !important;
                    color: #94a3b8 !important;
                    font-weight: 600 !important;
                    padding: 12px 12px 6px !important;
                }

                /* Filter tags */
                .filter-selector .filter-button {
                    border-radius: 20px !important;
                    padding: 6px 14px !important;
                    font-size: 12px !important;
                    background: #f1f5f9 !important;
                    border: none !important;
                    color: #64748b !important;
                }

                .filter-selector .filter-button:hover {
                    background: #e2e8f0 !important;
                }

                /* Active filters */
                .active-tag-container .btn-tag {
                    border-radius: 20px !important;
                    background: #faf5ff !important;
                    border: 1px solid #a404e4 !important;
                    color: #a404e4 !important;
                    font-size: 12px !important;
                    padding: 4px 12px !important;
                }

                .active-tag-container .btn-tag .remove-filter {
                    color: #a404e4 !important;
                }

                /* Pagination modern */
                .list-paging-area {
                    background: white !important;
                    border-radius: 0 0 12px 12px !important;
                    padding: 12px 20px !important;
                    border-top: 1px solid #f1f5f9 !important;
                }

                .btn-paging {
                    border-radius: 6px !important;
                    padding: 6px 12px !important;
                }

                /* Page title bar */
                .page-head {
                    background: transparent !important;
                    padding: 20px 0 !important;
                }

                .page-head .page-title .title-text {
                    font-size: 24px !important;
                    font-weight: 700 !important;
                    color: #1e293b !important;
                }

                /* Primary action button */
                .page-head .primary-action {
                    border-radius: 10px !important;
                    padding: 10px 20px !important;
                    font-weight: 600 !important;
                }

                /* Sort selector */
                .sort-selector .btn-order {
                    border-radius: 6px !important;
                    padding: 6px 12px !important;
                    font-size: 12px !important;
                    color: #64748b !important;
                }

                /* Result count */
                .list-count {
                    font-size: 13px !important;
                    color: #94a3b8 !important;
                }

                /* Empty list state */
                .no-result {
                    padding: 60px 20px !important;
                    text-align: center !important;
                }

                .no-result .text-muted {
                    color: #94a3b8 !important;
                    font-size: 15px !important;
                }

                /* Checkbox styling in list */
                .list-row-checkbox {
                    width: 18px !important;
                    height: 18px !important;
                    border-radius: 4px !important;
                }

                /* Report view styling */
                .report-wrapper {
                    background: white !important;
                    border-radius: 12px !important;
                    padding: 20px !important;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.08) !important;
                }

                /* DataTable in report */
                .dt-scrollable {
                    border-radius: 8px !important;
                    overflow: hidden;
                }

                .dt-header .dt-cell {
                    background: #f8fafc !important;
                    font-weight: 600 !important;
                    font-size: 12px !important;
                    text-transform: uppercase !important;
                    color: #64748b !important;
                }

                .dt-row:hover .dt-cell {
                    background: #faf5ff !important;
                }

                .dt-cell--focus {
                    outline: 2px solid #a404e4 !important;
                    outline-offset: -2px;
                }
            </style>
        `);
    },

    enhanceFilters: function() {
        // Add better filter UX
        $(".filter-selector").each(function() {
            if (!$(this).hasClass("dc-enhanced")) {
                $(this).addClass("dc-enhanced");
            }
        });
    },

    addQuickActions: function() {
        // Add quick action buttons to list if relevant DocType
        const doctype = cur_list && cur_list.doctype;
        if (!doctype) return;

        // Quick actions specific to DigiComply DocTypes could be added here
    }
};

// ============================================
// SIDEBAR CLEANUP & MODERNIZATION
// ============================================
digicomply.sidebar = {
    cleanup: function() {
        this.hideIrrelevantItems();
        this.modernizeStyle();
        this.organizeItems();
    },

    hideIrrelevantItems: function() {
        // Hide ERPNext-specific sidebar items
        const hidePatterns = [
            "Stock", "Assets", "Manufacturing", "Quality", "Projects",
            "Support", "Website", "CRM", "Build", "ERPNext",
            "HR", "Payroll", "Education", "Healthcare", "Agriculture",
            "Hospitality", "E Commerce", "Non Profit", "Portal",
            "Telephony", "Utilities", "Regional"
        ];

        hidePatterns.forEach(pattern => {
            $(`.desk-sidebar a:contains("${pattern}"), .standard-sidebar-item:contains("${pattern}")`).each(function() {
                $(this).closest(".sidebar-item, .standard-sidebar-item").hide();
            });
        });

        // Hide setup wizard prompts
        $(".setup-wizard-message, .onboarding-widget").hide();

        // Hide "Getting Started" if not DigiComply specific
        $(".getting-started:not(.dc-getting-started)").hide();
    },

    modernizeStyle: function() {
        if ($("#dc-sidebar-modern-style").length) return;

        $("head").append(`
            <style id="dc-sidebar-modern-style">
                /* === MODERN SIDEBAR === */

                .desk-sidebar, .standard-sidebar {
                    background: white !important;
                    border-right: 1px solid #e2e8f0 !important;
                    padding: 20px 12px !important;
                }

                /* Sidebar header/brand */
                .desk-sidebar .sidebar-header {
                    padding: 0 12px 20px !important;
                    margin-bottom: 16px !important;
                    border-bottom: 1px solid #f1f5f9 !important;
                }

                /* Sidebar menu items */
                .sidebar-menu .sidebar-item,
                .standard-sidebar-item {
                    margin-bottom: 2px !important;
                }

                .sidebar-menu .sidebar-item > a,
                .standard-sidebar-item > a {
                    padding: 10px 14px !important;
                    border-radius: 8px !important;
                    font-size: 13px !important;
                    color: #475569 !important;
                    display: flex !important;
                    align-items: center !important;
                    gap: 10px !important;
                    transition: all 0.15s ease !important;
                }

                .sidebar-menu .sidebar-item > a:hover,
                .standard-sidebar-item > a:hover {
                    background: #faf5ff !important;
                    color: #a404e4 !important;
                }

                .sidebar-menu .sidebar-item.active > a,
                .standard-sidebar-item.selected > a {
                    background: linear-gradient(135deg, #a404e4 0%, #8501b9 100%) !important;
                    color: white !important;
                    font-weight: 500 !important;
                }

                /* Sidebar section labels */
                .sidebar-label {
                    font-size: 10px !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.5px !important;
                    color: #94a3b8 !important;
                    font-weight: 600 !important;
                    padding: 16px 14px 8px !important;
                }

                /* Sidebar icons */
                .sidebar-menu .sidebar-icon,
                .standard-sidebar-item .sidebar-icon {
                    width: 20px !important;
                    height: 20px !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    color: currentColor !important;
                }

                /* Sidebar collapsed state */
                .desk-sidebar.collapsed {
                    width: 60px !important;
                }

                .desk-sidebar.collapsed .sidebar-item > a span,
                .desk-sidebar.collapsed .sidebar-label {
                    display: none !important;
                }

                /* Workspace header in sidebar */
                .workspace-sidebar-item {
                    font-weight: 600 !important;
                    color: #1e293b !important;
                }

                /* Dividers */
                .sidebar-menu hr {
                    margin: 12px 0 !important;
                    border-color: #f1f5f9 !important;
                }

                /* User dropdown in sidebar */
                .sidebar-user-section {
                    margin-top: auto !important;
                    padding-top: 16px !important;
                    border-top: 1px solid #f1f5f9 !important;
                }
            </style>
        `);
    },

    organizeItems: function() {
        // Reorder sidebar items to prioritize DigiComply items
        const priorityItems = [
            "DigiComply",
            "Dashboard",
            "Reconciliation",
            "E-Invoice",
            "VAT",
            "Compliance",
            "Accounts",
            "Selling",
            "Buying"
        ];

        // Add visual indicators to priority items
        priorityItems.forEach((item, index) => {
            $(`.sidebar-menu a:contains("${item}"), .standard-sidebar-item:contains("${item}")`).each(function() {
                $(this).css("order", index);
            });
        });
    }
};

// ============================================
// DASHBOARD WIDGETS - Modern Cards
// ============================================
digicomply.dashboard = {
    enhance: function() {
        this.modernizeWidgets();
        this.addStatsCards();
    },

    modernizeWidgets: function() {
        if ($("#dc-dashboard-modern-style").length) return;

        $("head").append(`
            <style id="dc-dashboard-modern-style">
                /* === MODERN DASHBOARD === */

                /* Workspace container */
                .workspace-container {
                    padding: 24px !important;
                    background: #f8fafc !important;
                }

                /* Widget cards */
                .widget {
                    background: white !important;
                    border-radius: 16px !important;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.08) !important;
                    border: 1px solid #e2e8f0 !important;
                    overflow: hidden !important;
                    transition: all 0.2s ease !important;
                }

                .widget:hover {
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
                    transform: translateY(-2px);
                }

                /* Widget header */
                .widget-head {
                    padding: 16px 20px !important;
                    border-bottom: 1px solid #f1f5f9 !important;
                    background: linear-gradient(to right, #faf5ff, white) !important;
                }

                .widget-head .widget-title {
                    font-size: 14px !important;
                    font-weight: 600 !important;
                    color: #1e293b !important;
                }

                .widget-head .widget-control {
                    color: #94a3b8 !important;
                }

                /* Widget body */
                .widget-body {
                    padding: 20px !important;
                }

                /* Shortcut widgets - card grid */
                .shortcut-widget-box {
                    background: white !important;
                    border-radius: 12px !important;
                    padding: 20px !important;
                    border: 1px solid #e2e8f0 !important;
                    transition: all 0.2s ease !important;
                    display: flex !important;
                    flex-direction: column !important;
                    gap: 8px !important;
                }

                .shortcut-widget-box:hover {
                    border-color: #a404e4 !important;
                    box-shadow: 0 4px 14px rgba(164, 4, 228, 0.15) !important;
                    transform: translateY(-2px) !important;
                }

                .shortcut-widget-box .widget-head {
                    padding: 0 !important;
                    border: none !important;
                    background: none !important;
                }

                .shortcut-widget-box .ellipsis {
                    font-weight: 600 !important;
                    font-size: 14px !important;
                    color: #1e293b !important;
                }

                .shortcut-widget-box .widget-subtitle {
                    font-size: 12px !important;
                    color: #64748b !important;
                }

                /* Number cards */
                .number-widget-box {
                    background: linear-gradient(135deg, #a404e4 0%, #8501b9 100%) !important;
                    border-radius: 16px !important;
                    padding: 24px !important;
                    color: white !important;
                }

                .number-widget-box .widget-head {
                    background: none !important;
                    border: none !important;
                    padding: 0 0 12px !important;
                }

                .number-widget-box .widget-title {
                    color: rgba(255,255,255,0.8) !important;
                    font-size: 13px !important;
                }

                .number-widget-box .number {
                    font-size: 36px !important;
                    font-weight: 700 !important;
                    color: white !important;
                }

                /* Chart widgets */
                .chart-widget {
                    padding: 0 !important;
                }

                .chart-widget .widget-head {
                    padding: 16px 20px !important;
                }

                .chart-widget .widget-body {
                    padding: 0 20px 20px !important;
                }

                /* Quick list widget */
                .quick-list-widget-box .widget-body {
                    padding: 0 !important;
                }

                .quick-list-widget-box .quick-list-item {
                    padding: 12px 20px !important;
                    border-bottom: 1px solid #f1f5f9 !important;
                    transition: background 0.15s ease !important;
                }

                .quick-list-widget-box .quick-list-item:hover {
                    background: #faf5ff !important;
                }

                .quick-list-widget-box .quick-list-item:last-child {
                    border-bottom: none !important;
                }

                /* Onboarding/Getting started */
                .onboarding-widget {
                    background: linear-gradient(135deg, #faf5ff 0%, white 100%) !important;
                    border: 2px dashed #a404e4 !important;
                    border-radius: 16px !important;
                    padding: 24px !important;
                }

                /* Empty state */
                .widget-empty {
                    text-align: center !important;
                    padding: 40px 20px !important;
                    color: #94a3b8 !important;
                }

                /* Section headers on workspace */
                .widget-group-head {
                    font-size: 12px !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.5px !important;
                    color: #64748b !important;
                    font-weight: 600 !important;
                    padding: 24px 0 12px !important;
                }
            </style>
        `);
    },

    addStatsCards: function() {
        // Stats cards would be added to custom pages - this provides the styling
        // The actual stats would come from the compliance_dashboard page
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
                digicomply.notifications.style();
                digicomply.security.hideAdminLinks();
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
    console.log("DigiComply v" + digicomply.config.VERSION + ": Initializing Modern UI...");

    // Apply all branding immediately
    digicomply.filter.hideUnwanted();
    digicomply.branding.apply();
    digicomply.login.brand();
    digicomply.errorPages.brand();

    // Override dialogs
    digicomply.dialogs.overrideAbout();
    digicomply.dialogs.overrideHelp();
    digicomply.dialogs.overrideErrorDialogs();

    // Print overrides
    digicomply.print.overrideFooter();

    // Start observer for dynamic content
    digicomply.observer.start();

    // Setup navigation
    digicomply.navigation.setupKeyboardShortcuts();
    digicomply.navigation.addQuickNav();

    // Security
    digicomply.security.blockSystemRoutes();
    digicomply.security.hideAdminLinks();

    // UI Modernization
    digicomply.sidebar.cleanup();
    digicomply.listview.enhance();
    digicomply.dashboard.enhance();
    digicomply.forms.enhance();

    // Delayed runs for async content
    setTimeout(() => {
        digicomply.filter.hideUnwanted();
        digicomply.branding.apply();
        digicomply.sidebar.cleanup();
        digicomply.forms.enhance();
    }, 500);

    setTimeout(() => {
        digicomply.filter.hideUnwanted();
        digicomply.security.hideAdminLinks();
        digicomply.listview.enhance();
    }, 1500);

    // On page change
    $(document).on("page-change", function() {
        setTimeout(() => {
            digicomply.filter.hideUnwanted();
            digicomply.branding.apply();
            digicomply.forms.enhance();
            digicomply.security.blockSystemRoutes();
            digicomply.errorPages.brand();
            digicomply.notifications.style();
            digicomply.sidebar.cleanup();
            digicomply.listview.enhance();
            digicomply.dashboard.enhance();
        }, 300);
    });

    // On route change
    if (frappe.router && frappe.router.on) {
        frappe.router.on("change", function() {
            digicomply.security.blockSystemRoutes();
            digicomply.branding.apply();
            digicomply.forms.enhance();
            digicomply.listview.enhance();
        });
    }

    console.log("DigiComply: Modern UI Ready ✓");
});

// Frappe after_ajax hook
if (typeof frappe !== 'undefined') {
    frappe.after_ajax(function() {
        digicomply.filter.hideUnwanted();
        digicomply.forms.enhance();
        digicomply.notifications.style();
        digicomply.sidebar.cleanup();
    });
}
