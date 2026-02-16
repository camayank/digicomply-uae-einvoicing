// Copyright (c) 2024, DigiComply and contributors
// License: MIT

frappe.ui.form.on('Bulk Import Log', {
    refresh: function(frm) {
        // Add custom styles
        frm.trigger('add_custom_styles');

        // Add form wrapper class
        frm.$wrapper.find('.form-page').addClass('dc-form-wrapper');

        // Show status indicator
        frm.trigger('show_status_indicator');

        // Show progress visualization
        frm.trigger('show_progress_card');

        // Add action buttons based on status
        frm.trigger('add_action_buttons');

        // Subscribe to realtime events
        frm.trigger('setup_realtime');

        // Show result summary if completed
        if (frm.doc.status && frm.doc.status.startsWith('Completed') || frm.doc.status === 'Failed') {
            frm.trigger('show_result_summary');
        }
    },

    add_custom_styles: function(frm) {
        if ($('#bulk-import-styles').length) return;

        $('head').append(`
            <style id="bulk-import-styles">
                /* Form wrapper */
                .dc-form-wrapper {
                    max-width: 1200px;
                    margin: 0 auto;
                }

                /* Progress Card */
                .dc-progress-card {
                    background: linear-gradient(135deg, #a404e4 0%, #8501b9 100%);
                    border-radius: 16px;
                    padding: 24px;
                    margin-bottom: 24px;
                    color: white;
                    box-shadow: 0 4px 14px rgba(164, 4, 228, 0.25);
                }

                .dc-progress-card.pending {
                    background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
                }

                .dc-progress-card.processing {
                    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                }

                .dc-progress-card.completed {
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                }

                .dc-progress-card.error {
                    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                }

                .dc-progress-card.failed {
                    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                }

                .dc-progress-header {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    margin-bottom: 20px;
                }

                .dc-progress-icon {
                    width: 64px;
                    height: 64px;
                    background: rgba(255,255,255,0.2);
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .dc-progress-info {
                    flex: 1;
                }

                .dc-progress-title {
                    font-size: 1.25rem;
                    font-weight: 700;
                    margin-bottom: 4px;
                }

                .dc-progress-subtitle {
                    opacity: 0.9;
                    font-size: 0.875rem;
                }

                .dc-progress-bar-container {
                    background: rgba(255,255,255,0.2);
                    border-radius: 12px;
                    height: 24px;
                    overflow: hidden;
                    margin-bottom: 16px;
                }

                .dc-progress-bar-fill {
                    height: 100%;
                    background: rgba(255,255,255,0.9);
                    border-radius: 12px;
                    transition: width 0.3s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.75rem;
                    font-weight: 700;
                    color: #1e293b;
                    min-width: 40px;
                }

                .dc-progress-stats {
                    display: flex;
                    gap: 16px;
                    flex-wrap: wrap;
                }

                .dc-stat-item {
                    background: rgba(255,255,255,0.1);
                    border-radius: 10px;
                    padding: 12px 16px;
                    flex: 1;
                    min-width: 100px;
                    text-align: center;
                }

                .dc-stat-value {
                    font-size: 1.5rem;
                    font-weight: 700;
                    line-height: 1.2;
                }

                .dc-stat-label {
                    font-size: 0.75rem;
                    opacity: 0.8;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .dc-stat-item.success { border-left: 4px solid #10b981; }
                .dc-stat-item.error { border-left: 4px solid #ef4444; }
                .dc-stat-item.warning { border-left: 4px solid #f59e0b; }
                .dc-stat-item.info { border-left: 4px solid #3b82f6; }

                /* Action Buttons */
                .dc-action-buttons {
                    display: flex;
                    gap: 12px;
                    flex-wrap: wrap;
                    margin: 20px 0;
                    padding: 16px;
                    background: #f8fafc;
                    border-radius: 12px;
                }

                .dc-btn {
                    padding: 12px 24px;
                    border-radius: 10px;
                    font-weight: 600;
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.2s;
                    border: none;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                }

                .dc-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                }

                .dc-btn-primary {
                    background: linear-gradient(135deg, #a404e4 0%, #8501b9 100%);
                    color: white;
                }

                .dc-btn-secondary {
                    background: #e2e8f0;
                    color: #475569;
                }

                .dc-btn-success {
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    color: white;
                }

                .dc-btn-danger {
                    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                    color: white;
                }

                .dc-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    transform: none;
                }

                /* Result Summary */
                .dc-import-summary {
                    background: #f8fafc;
                    border-radius: 12px;
                    overflow: hidden;
                    margin-top: 16px;
                }

                .dc-summary-header {
                    padding: 20px;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    color: white;
                }

                .dc-summary-header.success { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
                .dc-summary-header.warning { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
                .dc-summary-header.danger { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); }
                .dc-summary-header.secondary { background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); }

                .dc-summary-icon {
                    width: 48px;
                    height: 48px;
                    background: rgba(255,255,255,0.2);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .dc-summary-text h4 {
                    margin: 0 0 4px 0;
                    font-size: 1.125rem;
                    font-weight: 700;
                }

                .dc-summary-text p {
                    margin: 0;
                    opacity: 0.9;
                    font-size: 0.875rem;
                }

                .dc-summary-stats {
                    display: flex;
                    padding: 16px;
                    gap: 16px;
                }

                .dc-stat {
                    flex: 1;
                    text-align: center;
                    padding: 12px;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                }

                .dc-stat-value {
                    font-size: 1.5rem;
                    font-weight: 700;
                    display: block;
                }

                .dc-stat.success .dc-stat-value { color: #10b981; }
                .dc-stat.danger .dc-stat-value { color: #ef4444; }
                .dc-stat.warning .dc-stat-value { color: #f59e0b; }

                .dc-stat-label {
                    font-size: 0.75rem;
                    color: #64748b;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                /* Import type selector styling */
                .frappe-control[data-fieldname="import_type"] select {
                    font-weight: 600;
                }

                /* File upload styling */
                .frappe-control[data-fieldname="file"] .attached-file-row {
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    padding: 12px 16px !important;
                }

                /* Spinner animation */
                @keyframes dc-spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                .dc-spin {
                    animation: dc-spin 1s linear infinite;
                }

                /* Pulse animation for processing */
                @keyframes dc-pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }

                .dc-pulse {
                    animation: dc-pulse 2s ease-in-out infinite;
                }

                /* Mobile responsive */
                @media (max-width: 768px) {
                    .dc-progress-header {
                        flex-direction: column;
                        text-align: center;
                    }

                    .dc-progress-stats {
                        flex-direction: column;
                    }

                    .dc-action-buttons {
                        flex-direction: column;
                    }

                    .dc-btn {
                        width: 100%;
                        justify-content: center;
                    }
                }
            </style>
        `);
    },

    show_status_indicator: function(frm) {
        if (!frm.doc.status) return;

        let indicator = {
            'Pending': 'grey',
            'Validating': 'blue',
            'Processing': 'blue',
            'Completed': 'green',
            'Completed with Errors': 'orange',
            'Failed': 'red',
            'Cancelled': 'grey'
        }[frm.doc.status] || 'grey';

        frm.page.set_indicator(frm.doc.status, indicator);
    },

    show_progress_card: function(frm) {
        // Remove existing
        frm.$wrapper.find('.dc-progress-card').remove();

        if (!frm.doc.file) return;

        let status = frm.doc.status || 'Pending';
        let statusClass = status.toLowerCase().replace(/ /g, '-');

        // Simplify class
        if (statusClass === 'completed-with-errors') statusClass = 'error';
        if (statusClass === 'validating' || statusClass === 'processing') statusClass = 'processing';

        let icon = frm.trigger('get_status_icon', status);
        let title = frm.trigger('get_status_title', status);
        let subtitle = frm.trigger('get_status_subtitle', status);

        let progress = frm.doc.progress_percent || 0;
        let processed = frm.doc.processed_rows || 0;
        let total = frm.doc.total_rows || 0;
        let success = frm.doc.success_count || 0;
        let errors = frm.doc.error_count || 0;
        let warnings = frm.doc.warning_count || 0;

        let $card = $(`
            <div class="dc-progress-card ${statusClass} dc-fade-in">
                <div class="dc-progress-header">
                    <div class="dc-progress-icon ${statusClass === 'processing' ? 'dc-pulse' : ''}">
                        ${icon}
                    </div>
                    <div class="dc-progress-info">
                        <div class="dc-progress-title">${title}</div>
                        <div class="dc-progress-subtitle">${subtitle}</div>
                    </div>
                </div>

                ${status !== 'Pending' ? `
                <div class="dc-progress-bar-container">
                    <div class="dc-progress-bar-fill" style="width: ${Math.max(progress, 5)}%">
                        ${Math.round(progress)}%
                    </div>
                </div>

                <div class="dc-progress-stats">
                    <div class="dc-stat-item info">
                        <div class="dc-stat-value">${processed}/${total}</div>
                        <div class="dc-stat-label">Processed</div>
                    </div>
                    <div class="dc-stat-item success">
                        <div class="dc-stat-value">${success}</div>
                        <div class="dc-stat-label">Success</div>
                    </div>
                    <div class="dc-stat-item error">
                        <div class="dc-stat-value">${errors}</div>
                        <div class="dc-stat-label">Errors</div>
                    </div>
                    <div class="dc-stat-item warning">
                        <div class="dc-stat-value">${warnings}</div>
                        <div class="dc-stat-label">Warnings</div>
                    </div>
                </div>
                ` : ''}
            </div>
        `);

        frm.$wrapper.find('.form-page').first().prepend($card);
    },

    get_status_icon: function(frm, status) {
        const icons = {
            'Pending': `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
            </svg>`,
            'Validating': `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" class="dc-spin">
                <path d="M21 12a9 9 0 11-6.219-8.56"/>
            </svg>`,
            'Processing': `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" class="dc-spin">
                <path d="M21 12a9 9 0 11-6.219-8.56"/>
            </svg>`,
            'Completed': `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>`,
            'Completed with Errors': `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>`,
            'Failed': `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>`,
            'Cancelled': `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="8" y1="12" x2="16" y2="12"/>
            </svg>`
        };
        return icons[status] || icons['Pending'];
    },

    get_status_title: function(frm, status) {
        const titles = {
            'Pending': 'Ready to Import',
            'Validating': 'Validating Data...',
            'Processing': 'Processing Import...',
            'Completed': 'Import Complete',
            'Completed with Errors': 'Completed with Errors',
            'Failed': 'Import Failed',
            'Cancelled': 'Import Cancelled'
        };
        return titles[status] || status;
    },

    get_status_subtitle: function(frm, status) {
        const subtitles = {
            'Pending': `${frm.doc.import_type} import ready to start`,
            'Validating': 'Checking data format and validity',
            'Processing': 'Creating and updating records',
            'Completed': `Successfully imported ${frm.doc.success_count || 0} records`,
            'Completed with Errors': `${frm.doc.success_count || 0} successful, ${frm.doc.error_count || 0} errors`,
            'Failed': 'Import could not be completed',
            'Cancelled': 'Import was cancelled by user'
        };
        return subtitles[status] || '';
    },

    add_action_buttons: function(frm) {
        // Remove existing custom buttons container
        frm.$wrapper.find('.dc-action-buttons').remove();

        // Clear standard custom buttons
        frm.clear_custom_buttons();

        let status = frm.doc.status || 'Pending';
        let $container = $('<div class="dc-action-buttons"></div>');
        let hasButtons = false;

        // Start Import button (for Pending, Failed, or Cancelled)
        if (['Pending', 'Failed', 'Cancelled'].includes(status) && frm.doc.file) {
            hasButtons = true;
            let $startBtn = $(`
                <button class="dc-btn dc-btn-primary">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                    Start Import
                </button>
            `);

            $startBtn.on('click', function() {
                frm.trigger('do_start_import', false);
            });

            $container.append($startBtn);

            // Validate Only button
            let $validateBtn = $(`
                <button class="dc-btn dc-btn-secondary">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                    Validate Only
                </button>
            `);

            $validateBtn.on('click', function() {
                frm.trigger('do_start_import', true);
            });

            $container.append($validateBtn);
        }

        // Cancel button (for Validating or Processing)
        if (['Validating', 'Processing'].includes(status)) {
            hasButtons = true;
            let $cancelBtn = $(`
                <button class="dc-btn dc-btn-danger">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="15" y1="9" x2="9" y2="15"/>
                        <line x1="9" y1="9" x2="15" y2="15"/>
                    </svg>
                    Cancel Import
                </button>
            `);

            $cancelBtn.on('click', function() {
                frm.trigger('do_cancel_import');
            });

            $container.append($cancelBtn);
        }

        // Download Error Report button (for Completed with Errors)
        if (status === 'Completed with Errors' && frm.doc.error_log) {
            hasButtons = true;
            let $downloadBtn = $(`
                <button class="dc-btn dc-btn-secondary">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    Download Error Report
                </button>
            `);

            $downloadBtn.on('click', function() {
                frm.trigger('download_error_report');
            });

            $container.append($downloadBtn);
        }

        if (hasButtons) {
            frm.fields_dict.section_options.$wrapper.before($container);
        }
    },

    do_start_import: function(frm, dry_run) {
        // Set dry_run flag if doing validation only
        if (dry_run) {
            frm.set_value('dry_run', 1);
        } else {
            frm.set_value('dry_run', 0);
        }

        // Save first to ensure file is attached
        frm.save().then(() => {
            frappe.call({
                method: 'digicomply.digicomply.doctype.bulk_import_log.bulk_import_log.start_import',
                args: {
                    import_log: frm.doc.name
                },
                freeze: true,
                freeze_message: dry_run ? __('Starting validation...') : __('Starting import...'),
                callback: function(r) {
                    if (r.message && r.message.status === 'started') {
                        frappe.show_alert({
                            message: r.message.message,
                            indicator: 'blue'
                        }, 5);
                        frm.reload_doc();
                    }
                },
                error: function(r) {
                    frappe.show_alert({
                        message: __('Failed to start import'),
                        indicator: 'red'
                    });
                }
            });
        });
    },

    do_cancel_import: function(frm) {
        frappe.confirm(
            __('Are you sure you want to cancel this import?'),
            function() {
                frappe.call({
                    method: 'digicomply.digicomply.doctype.bulk_import_log.bulk_import_log.cancel_import',
                    args: {
                        import_log: frm.doc.name
                    },
                    freeze: true,
                    freeze_message: __('Cancelling import...'),
                    callback: function(r) {
                        if (r.message && r.message.status === 'cancelled') {
                            frappe.show_alert({
                                message: __('Import cancelled'),
                                indicator: 'orange'
                            });
                            frm.reload_doc();
                        }
                    }
                });
            }
        );
    },

    download_error_report: function(frm) {
        window.open(
            `/api/method/digicomply.digicomply.doctype.bulk_import_log.bulk_import_log.get_error_report?import_log=${frm.doc.name}`,
            '_blank'
        );
    },

    setup_realtime: function(frm) {
        // Unsubscribe from previous subscriptions
        frappe.realtime.off('bulk_import_progress');
        frappe.realtime.off('bulk_import_complete');

        // Subscribe to progress updates
        frappe.realtime.on('bulk_import_progress', function(data) {
            if (data.import_log === frm.doc.name) {
                // Update progress bar
                frm.$wrapper.find('.dc-progress-bar-fill')
                    .css('width', Math.max(data.progress, 5) + '%')
                    .text(Math.round(data.progress) + '%');

                // Update stats
                if (data.processed !== undefined) {
                    frm.$wrapper.find('.dc-stat-item.info .dc-stat-value')
                        .text(data.processed + '/' + (data.total || 0));
                }
                if (data.success !== undefined) {
                    frm.$wrapper.find('.dc-stat-item.success .dc-stat-value')
                        .text(data.success);
                }
                if (data.errors !== undefined) {
                    frm.$wrapper.find('.dc-stat-item.error .dc-stat-value')
                        .text(data.errors);
                }
                if (data.warnings !== undefined) {
                    frm.$wrapper.find('.dc-stat-item.warning .dc-stat-value')
                        .text(data.warnings);
                }
            }
        });

        // Subscribe to completion events
        frappe.realtime.on('bulk_import_complete', function(data) {
            if (data.import_log === frm.doc.name) {
                let indicator = data.status === 'Completed' ? 'green' :
                               data.status === 'Cancelled' ? 'orange' : 'red';

                frappe.show_alert({
                    message: __('Import {0}', [data.status.toLowerCase()]),
                    indicator: indicator
                }, 5);

                // Reload to get final state
                frm.reload_doc();
            }
        });
    },

    show_result_summary: function(frm) {
        // Result summary is handled by the HTML field and progress card
        // This method can add additional UI elements if needed
    },

    file: function(frm) {
        // When file is uploaded, extract filename
        if (frm.doc.file) {
            let filename = frm.doc.file.split('/').pop();
            frm.set_value('file_name', filename);

            frappe.show_alert({
                message: __('File ready. Click "Start Import" to begin.'),
                indicator: 'blue'
            }, 5);
        }
    },

    import_type: function(frm) {
        // Show type-specific help
        frm.trigger('show_import_help');
    },

    show_import_help: function(frm) {
        // Remove existing help
        frm.fields_dict.import_type.$wrapper.find('.dc-import-help').remove();

        if (!frm.doc.import_type) return;

        const help_text = {
            'Customer': `
                <strong>Required columns:</strong> customer_name<br>
                <strong>Optional:</strong> customer_type, customer_group, territory, tax_id, email_id, mobile_no
            `,
            'Supplier': `
                <strong>Required columns:</strong> supplier_name<br>
                <strong>Optional:</strong> supplier_type, supplier_group, country, tax_id
            `,
            'Item': `
                <strong>Required columns:</strong> item_code<br>
                <strong>Optional:</strong> item_name, item_group, description, stock_uom, is_stock_item, standard_rate
            `,
            'TRN Registry': `
                <strong>Required columns:</strong> trn, entity_name, company<br>
                <strong>Optional:</strong> entity_type, fta_registration_date, fta_expiry_date, is_primary, is_active, notes
            `,
            'Company': `
                <strong>Required columns:</strong> company_name<br>
                <strong>Optional:</strong> abbr, default_currency, country, tax_id
            `,
            'Invoice': `
                <strong>Required columns:</strong> invoice_no, customer<br>
                <strong>Optional:</strong> posting_date, due_date, item_code, qty, rate
            `,
            'ASP Data': `
                <strong>Required columns:</strong> invoice_no<br>
                <strong>Optional:</strong> posting_date, customer, trn, grand_total, vat_amount
            `
        };

        let help = help_text[frm.doc.import_type];
        if (help) {
            let $help = $(`
                <div class="dc-import-help" style="
                    background: #f0f9ff;
                    border: 1px solid #bae6fd;
                    border-radius: 8px;
                    padding: 12px;
                    margin-top: 10px;
                    font-size: 0.8125rem;
                    color: #0c4a6e;
                ">
                    ${help}
                </div>
            `);

            frm.fields_dict.import_type.$wrapper.append($help);
        }
    }
});
