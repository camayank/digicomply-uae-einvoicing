// Copyright (c) 2024, DigiComply and contributors
// License: MIT

frappe.ui.form.on('CSV Import', {
    refresh: function(frm) {
        // Add custom styles
        frm.trigger('add_custom_styles');

        // Add help text based on ASP provider
        frm.trigger('update_asp_help');

        // Show upload progress/status card
        frm.trigger('show_status_card');

        // Add process button if file uploaded but not processed
        if (frm.doc.file && frm.doc.status === 'Pending') {
            frm.add_custom_button(__('Process CSV'), function() {
                frm.trigger('process_csv_file');
            }, __('Actions'));

            // Also add a prominent action card
            frm.trigger('add_action_prompt');
        }

        // Show status indicator
        if (frm.doc.status) {
            let indicator = {
                'Pending': 'orange',
                'Processing': 'blue',
                'Completed': 'green',
                'Failed': 'red'
            }[frm.doc.status] || 'grey';

            frm.page.set_indicator(frm.doc.status, indicator);
        }

        // If completed, add quick action to create reconciliation
        if (frm.doc.status === 'Completed') {
            frm.add_custom_button(__('Start Reconciliation'), function() {
                frappe.new_doc('Reconciliation Run', {
                    company: frm.doc.company,
                    asp_provider: frm.doc.asp_provider,
                    csv_import: frm.doc.name
                });
            }, __('Actions'));
        }
    },

    add_custom_styles: function(frm) {
        if ($('#csv-import-styles').length) return;

        $('head').append(`
            <style id="csv-import-styles">
                /* Status Card */
                .dc-status-card {
                    background: linear-gradient(135deg, #a404e4 0%, #8501b9 100%);
                    border-radius: 16px;
                    padding: 24px;
                    margin-bottom: 20px;
                    color: white;
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    box-shadow: 0 4px 14px rgba(164, 4, 228, 0.25);
                }

                .dc-status-card.pending {
                    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                }

                .dc-status-card.completed {
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                }

                .dc-status-card.failed {
                    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                }

                .dc-status-icon {
                    width: 64px;
                    height: 64px;
                    background: rgba(255,255,255,0.2);
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .dc-status-content {
                    flex: 1;
                }

                .dc-status-title {
                    font-size: 1.25rem;
                    font-weight: 700;
                    margin-bottom: 4px;
                }

                .dc-status-subtitle {
                    opacity: 0.9;
                    font-size: 0.875rem;
                }

                .dc-status-meta {
                    text-align: right;
                }

                .dc-status-meta .count {
                    font-size: 2rem;
                    font-weight: 700;
                    line-height: 1;
                }

                .dc-status-meta .label {
                    font-size: 0.75rem;
                    opacity: 0.8;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                /* Action Prompt */
                .dc-action-prompt {
                    background: #fef3c7;
                    border: 2px dashed #f59e0b;
                    border-radius: 12px;
                    padding: 20px;
                    margin: 20px 0;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }

                .dc-action-prompt .icon {
                    width: 48px;
                    height: 48px;
                    background: #fbbf24;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .dc-action-prompt .content {
                    flex: 1;
                }

                .dc-action-prompt .title {
                    font-weight: 700;
                    color: #92400e;
                    font-size: 1rem;
                    margin-bottom: 2px;
                }

                .dc-action-prompt .desc {
                    color: #78350f;
                    font-size: 0.8125rem;
                }

                .dc-action-prompt .btn-process {
                    background: #f59e0b;
                    color: white;
                    border: none;
                    padding: 10px 24px;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .dc-action-prompt .btn-process:hover {
                    background: #d97706;
                    transform: translateY(-1px);
                }

                /* File upload styling */
                .frappe-control[data-fieldname="file"] .attached-file-row {
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    padding: 12px 16px !important;
                }

                .frappe-control[data-fieldname="file"] .attached-file-row .file-name {
                    font-weight: 600;
                    color: #1e293b;
                }

                /* Section styling in CSV Import */
                [data-page-container="CSV Import"] .section-head {
                    background: transparent !important;
                    border-bottom: 2px solid #e2e8f0 !important;
                    padding-bottom: 8px !important;
                    margin-bottom: 16px !important;
                    font-size: 0.9375rem !important;
                }
            </style>
        `);
    },

    show_status_card: function(frm) {
        // Remove existing
        frm.$wrapper.find('.dc-status-card').remove();

        if (!frm.doc.file) return;

        let statusClass = frm.doc.status.toLowerCase();
        let icon, title, subtitle;

        switch(frm.doc.status) {
            case 'Pending':
                icon = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                </svg>`;
                title = 'Ready to Process';
                subtitle = 'File uploaded and waiting for processing';
                break;
            case 'Processing':
                icon = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" class="dc-spin">
                    <path d="M21 12a9 9 0 11-6.219-8.56"/>
                </svg>`;
                title = 'Processing...';
                subtitle = 'Reading and parsing CSV data';
                break;
            case 'Completed':
                icon = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>`;
                title = 'Import Complete';
                subtitle = 'Ready for reconciliation';
                break;
            case 'Failed':
                icon = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>`;
                title = 'Import Failed';
                subtitle = 'Check the error details below';
                break;
        }

        let $card = $(`
            <div class="dc-status-card ${statusClass} dc-fade-in">
                <div class="dc-status-icon">${icon}</div>
                <div class="dc-status-content">
                    <div class="dc-status-title">${title}</div>
                    <div class="dc-status-subtitle">${subtitle}</div>
                </div>
                ${frm.doc.row_count ? `
                <div class="dc-status-meta">
                    <div class="count">${frm.doc.row_count}</div>
                    <div class="label">Rows Imported</div>
                </div>
                ` : ''}
            </div>
        `);

        frm.$wrapper.find('.form-page').first().prepend($card);
    },

    add_action_prompt: function(frm) {
        // Remove existing
        frm.$wrapper.find('.dc-action-prompt').remove();

        if (frm.doc.status !== 'Pending') return;

        let $prompt = $(`
            <div class="dc-action-prompt">
                <div class="icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                        <polyline points="13 17 18 12 13 7"/>
                        <polyline points="6 17 11 12 6 7"/>
                    </svg>
                </div>
                <div class="content">
                    <div class="title">Process this CSV file</div>
                    <div class="desc">Parse and extract invoice data for reconciliation</div>
                </div>
                <button class="btn-process">Process Now</button>
            </div>
        `);

        $prompt.find('.btn-process').on('click', function() {
            frm.trigger('process_csv_file');
        });

        frm.fields_dict.file.$wrapper.after($prompt);
    },

    asp_provider: function(frm) {
        frm.trigger('update_asp_help');
        frm.trigger('set_default_mappings');
    },

    update_asp_help: function(frm) {
        // Define help text for each ASP
        const asp_help = {
            'ClearTax': `
                <div class="asp-help">
                    <h5>ClearTax Export Format</h5>
                    <p>Export your invoice report from ClearTax portal:</p>
                    <ol>
                        <li>Go to <strong>Reports > Invoice Report</strong></li>
                        <li>Select date range and click <strong>Export</strong></li>
                        <li>Choose CSV format</li>
                    </ol>
                    <p><strong>Expected columns:</strong> Invoice Number, Invoice Date, Total Amount, VAT Amount, Customer Name, Customer TRN</p>
                </div>
            `,
            'Cygnet': `
                <div class="asp-help">
                    <h5>Cygnet Export Format</h5>
                    <p>Export transaction data from Cygnet:</p>
                    <ol>
                        <li>Go to <strong>E-Invoices > Transaction Dump</strong></li>
                        <li>Filter by date and export</li>
                    </ol>
                    <p><strong>Expected columns:</strong> Document No, Document Date, Total Value, Tax Value, Party Name, Party TRN</p>
                </div>
            `,
            'Zoho': `
                <div class="asp-help">
                    <h5>Zoho Invoice Export Format</h5>
                    <p>Export from Zoho Invoicing:</p>
                    <ol>
                        <li>Go to <strong>Sales > Invoices</strong></li>
                        <li>Click <strong>Export</strong> button</li>
                        <li>Select date range and CSV format</li>
                    </ol>
                    <p><strong>Expected columns:</strong> Invoice#, Invoice Date, Total, Tax, Customer Name, Customer Tax ID</p>
                </div>
            `,
            'Tabadul': `
                <div class="asp-help">
                    <h5>Tabadul Export Format</h5>
                    <p>Download transaction report from Tabadul portal.</p>
                    <p><strong>Expected columns:</strong> Invoice Number, Date, Grand Total, VAT, Customer, TRN</p>
                </div>
            `,
            'Other': `
                <div class="asp-help">
                    <h5>Custom CSV Format</h5>
                    <p>For other providers, specify your column names in the Column Mapping section below.</p>
                    <p><strong>Required columns:</strong></p>
                    <ul>
                        <li>Invoice Number</li>
                        <li>Invoice Date</li>
                        <li>Total Amount</li>
                        <li>VAT Amount</li>
                    </ul>
                    <p><strong>Optional columns:</strong> Customer Name, Customer TRN</p>
                </div>
            `
        };

        // Show help text
        let help_html = asp_help[frm.doc.asp_provider] || `
            <div class="asp-help">
                <p>Select an ASP Provider to see import instructions.</p>
            </div>
        `;

        // Add CSS if not already added
        if (!$('.asp-help-style').length) {
            $('head').append(`
                <style class="asp-help-style">
                    .asp-help {
                        background: #f0f9ff;
                        border: 1px solid #bae6fd;
                        border-radius: 8px;
                        padding: 15px;
                        margin: 10px 0;
                    }
                    .asp-help h5 {
                        color: #0369a1;
                        margin-bottom: 10px;
                    }
                    .asp-help ol, .asp-help ul {
                        margin-left: 20px;
                    }
                    .asp-help p strong {
                        color: #0c4a6e;
                    }
                </style>
            `);
        }

        // Insert help after asp_provider field
        frm.fields_dict.asp_provider.$wrapper.find('.asp-help-container').remove();
        frm.fields_dict.asp_provider.$wrapper.append(`<div class="asp-help-container">${help_html}</div>`);
    },

    set_default_mappings: function(frm) {
        // Set default column names based on ASP
        const mappings = {
            'ClearTax': {
                invoice_no_column: 'Invoice Number',
                date_column: 'Invoice Date',
                total_column: 'Total Amount',
                vat_column: 'VAT Amount',
                customer_column: 'Customer Name',
                trn_column: 'Customer TRN'
            },
            'Cygnet': {
                invoice_no_column: 'Document No',
                date_column: 'Document Date',
                total_column: 'Total Value',
                vat_column: 'Tax Value',
                customer_column: 'Party Name',
                trn_column: 'Party TRN'
            },
            'Zoho': {
                invoice_no_column: 'Invoice#',
                date_column: 'Invoice Date',
                total_column: 'Total',
                vat_column: 'Tax',
                customer_column: 'Customer Name',
                trn_column: 'Customer Tax ID'
            }
        };

        if (mappings[frm.doc.asp_provider]) {
            Object.entries(mappings[frm.doc.asp_provider]).forEach(([field, value]) => {
                frm.set_value(field, value);
            });
        }
    },

    file: function(frm) {
        // When file is uploaded, show processing prompt
        if (frm.doc.file) {
            frappe.show_alert({
                message: __('File uploaded. Save to process the CSV.'),
                indicator: 'blue'
            }, 5);
        }
    },

    process_csv_file: function(frm) {
        frappe.call({
            method: 'digicomply.digicomply.doctype.csv_import.csv_import.process_csv',
            args: {
                docname: frm.doc.name
            },
            freeze: true,
            freeze_message: __('Processing CSV file...'),
            callback: function(r) {
                if (r.message && r.message.status === 'success') {
                    frm.reload_doc();
                    frappe.show_alert({
                        message: __('CSV processed successfully. {0} rows imported.', [r.message.row_count]),
                        indicator: 'green'
                    });
                }
            },
            error: function(r) {
                frappe.show_alert({
                    message: __('Error processing CSV. Check the error log for details.'),
                    indicator: 'red'
                });
            }
        });
    }
});
