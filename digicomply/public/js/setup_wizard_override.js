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
