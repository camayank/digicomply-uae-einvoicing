/*
 * DigiComply - UAE E-Invoicing Compliance Platform
 * Global JavaScript
 */

// Extend frappe namespace
frappe.provide('digicomply');

/**
 * Format TRN (Tax Registration Number) for display
 * @param {string} trn - 15-digit TRN
 * @returns {string} Formatted TRN: XXX-XXXX-XXXXXXX-X
 */
digicomply.format_trn = function(trn) {
    if (!trn || trn.length !== 15) return trn;
    return trn.slice(0, 3) + '-' + trn.slice(3, 7) + '-' + trn.slice(7, 14) + '-' + trn.slice(14);
};

/**
 * Format currency amount with AED
 * @param {number} amount - Amount to format
 * @returns {string} Formatted amount
 */
digicomply.format_aed = function(amount) {
    return 'AED ' + (amount || 0).toLocaleString('en-AE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};

/**
 * Get compliance status color class
 * @param {number} score - Compliance percentage
 * @returns {string} CSS class name
 */
digicomply.get_compliance_class = function(score) {
    if (score >= 95) return 'compliance-excellent';
    if (score >= 85) return 'compliance-good';
    if (score >= 70) return 'compliance-warning';
    return 'compliance-critical';
};

/**
 * Show quick reconciliation dialog
 */
digicomply.quick_reconcile = function() {
    let d = new frappe.ui.Dialog({
        title: __('Quick Reconciliation'),
        fields: [
            {
                fieldname: 'company',
                fieldtype: 'Link',
                options: 'Company',
                label: __('Company'),
                reqd: 1
            },
            {
                fieldname: 'asp_provider',
                fieldtype: 'Select',
                options: '\nClearTax\nCygnet\nZoho\nTabadul\nOther',
                label: __('ASP Provider'),
                reqd: 1
            },
            {
                fieldname: 'csv_file',
                fieldtype: 'Attach',
                label: __('ASP Export CSV'),
                reqd: 1
            }
        ],
        primary_action_label: __('Reconcile'),
        primary_action: function(values) {
            frappe.call({
                method: 'digicomply.api.quick_reconcile',
                args: values,
                freeze: true,
                freeze_message: __('Running reconciliation...'),
                callback: function(r) {
                    if (r.message && r.message.status === 'success') {
                        d.hide();
                        frappe.show_alert({
                            message: __('Reconciliation completed! Matched: {0}, Mismatched: {1}',
                                [r.message.matched, r.message.mismatched]),
                            indicator: 'green'
                        });
                        frappe.set_route('Form', 'Reconciliation Run', r.message.reconciliation_run);
                    }
                }
            });
        }
    });
    d.show();
};

// Add menu items when page loads
$(document).ready(function() {
    // Add DigiComply to navbar search suggestions
    if (frappe.search) {
        frappe.search.utils.make_page_link = (function(original) {
            return function(item) {
                // Add compliance dashboard to suggestions
                if (item.label === 'compliance_dashboard') {
                    item.label = __('Compliance Dashboard');
                }
                return original.call(this, item);
            };
        })(frappe.search.utils.make_page_link);
    }
});

// Form event handlers for Reconciliation Run
frappe.ui.form.on('Reconciliation Run', {
    refresh: function(frm) {
        // Add custom buttons
        if (frm.doc.docstatus === 1 && frm.doc.status === 'Completed') {
            frm.add_custom_button(__('Generate Report'), function() {
                frappe.call({
                    method: 'digicomply.api.generate_audit_pack',
                    args: { reconciliation_run: frm.doc.name },
                    freeze: true,
                    callback: function(r) {
                        if (r.message && r.message.pdf_url) {
                            window.open(r.message.pdf_url);
                        }
                    }
                });
            }, __('Actions'));
        }

        // Show status summary
        if (frm.doc.total_invoices > 0) {
            let summary_html = `
                <div style="display:flex; gap:20px; padding:10px 0;">
                    <div><strong style="color:#10b981">${frm.doc.matched_count || 0}</strong> Matched</div>
                    <div><strong style="color:#f59e0b">${frm.doc.mismatched_count || 0}</strong> Mismatched</div>
                    <div><strong style="color:#ef4444">${frm.doc.missing_in_asp || 0}</strong> Missing in ASP</div>
                    <div><strong>${(frm.doc.match_percentage || 0).toFixed(1)}%</strong> Compliance</div>
                </div>
            `;
            frm.set_df_property('section_results', 'description', summary_html);
        }
    },

    run_reconciliation: function(frm) {
        frappe.call({
            method: 'run_reconciliation',
            doc: frm.doc,
            freeze: true,
            freeze_message: __('Running reconciliation...'),
            callback: function(r) {
                frm.reload_doc();
            }
        });
    },

    generate_report: function(frm) {
        frappe.call({
            method: 'generate_report',
            doc: frm.doc,
            freeze: true,
            callback: function(r) {
                if (r.message) {
                    frappe.set_route('Form', 'Mismatch Report', r.message);
                }
            }
        });
    }
});

// Form event handlers for CSV Import
frappe.ui.form.on('CSV Import', {
    refresh: function(frm) {
        if (frm.doc.status === 'Pending' && frm.doc.file) {
            frm.add_custom_button(__('Process CSV'), function() {
                frappe.call({
                    method: 'process_csv',
                    doc: frm.doc,
                    freeze: true,
                    callback: function(r) {
                        frm.reload_doc();
                    }
                });
            });
        }
    }
});

// Form event handlers for Mismatch Report
frappe.ui.form.on('Mismatch Report', {
    refresh: function(frm) {
        if (frm.doc.status !== 'Generated' || !frm.doc.pdf_file) {
            frm.add_custom_button(__('Generate PDF'), function() {
                frappe.call({
                    method: 'generate_pdf',
                    doc: frm.doc,
                    freeze: true,
                    callback: function(r) {
                        frm.reload_doc();
                        if (r.message && r.message.file_url) {
                            window.open(r.message.file_url);
                        }
                    }
                });
            });
        }

        if (frm.doc.pdf_file) {
            frm.add_custom_button(__('Download PDF'), function() {
                window.open(frm.doc.pdf_file);
            });
        }
    },

    generate_pdf: function(frm) {
        frappe.call({
            method: 'generate_pdf',
            doc: frm.doc,
            freeze: true,
            callback: function(r) {
                frm.reload_doc();
            }
        });
    }
});
