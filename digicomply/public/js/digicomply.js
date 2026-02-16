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
