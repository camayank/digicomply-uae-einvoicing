// Copyright (c) 2024, DigiComply and contributors
// License: MIT

frappe.ui.form.on('TRN Validation Log', {
    refresh: function(frm) {
        // Add DigiComply form wrapper class
        frm.$wrapper.find('.form-page').addClass('dc-form-wrapper');

        // Add custom styles
        frm.trigger('add_custom_styles');

        // Show status indicator
        frm.trigger('show_status_indicator');

        // Show validation status card
        frm.trigger('show_validation_card');

        // Add View TRN Registry button if linked
        if (!frm.is_new() && frm.doc.trn_registry) {
            frm.add_custom_button(__('View TRN Registry'), function() {
                frappe.set_route('Form', 'TRN Registry', frm.doc.trn_registry);
            }, __('Actions'));
        }

        // Add View History button
        if (!frm.is_new() && frm.doc.trn) {
            frm.add_custom_button(__('View History'), function() {
                frappe.call({
                    method: 'digicomply.digicomply.doctype.trn_validation_log.trn_validation_log.get_validation_history',
                    args: {
                        trn: frm.doc.trn
                    },
                    callback: function(r) {
                        if (r.message && r.message.length > 0) {
                            frm.trigger('show_history_dialog', r.message);
                        } else {
                            frappe.msgprint(__('No validation history found for this TRN'));
                        }
                    }
                });
            }, __('Actions'));
        }
    },

    show_history_dialog: function(frm, history) {
        let rows = history.map(log => {
            let status_color = frm.events.get_status_color(log.validation_status);
            return `
                <tr>
                    <td>${frappe.datetime.str_to_user(log.validation_date)}</td>
                    <td><span class="indicator-pill ${status_color}">${log.validation_status || '-'}</span></td>
                    <td>${log.validation_type || '-'}</td>
                    <td>${log.validation_source || '-'}</td>
                    <td>${log.response_message || '-'}</td>
                </tr>
            `;
        }).join('');

        let dialog = new frappe.ui.Dialog({
            title: __('Validation History for {0}', [frm.doc.trn]),
            size: 'extra-large',
            fields: [{
                fieldtype: 'HTML',
                fieldname: 'history_table',
                options: `
                    <div class="dc-history-table-wrapper">
                        <table class="table table-bordered dc-history-table">
                            <thead>
                                <tr>
                                    <th>${__('Date')}</th>
                                    <th>${__('Status')}</th>
                                    <th>${__('Type')}</th>
                                    <th>${__('Source')}</th>
                                    <th>${__('Message')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${rows}
                            </tbody>
                        </table>
                    </div>
                `
            }]
        });

        dialog.show();
    },

    get_status_color: function(status) {
        const color_map = {
            'Valid': 'green',
            'Invalid': 'red',
            'Expired': 'orange',
            'Not Found': 'grey',
            'API Error': 'red',
            'Pending': 'blue'
        };
        return color_map[status] || 'grey';
    },

    add_custom_styles: function(frm) {
        if ($('#trn-validation-log-styles').length) return;

        $('head').append(`
            <style id="trn-validation-log-styles">
                /* DigiComply Form Wrapper */
                .dc-form-wrapper {
                    font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                /* Validation Status Card */
                .dc-validation-card {
                    background: linear-gradient(135deg, #a404e4 0%, #8501b9 100%);
                    border-radius: 16px;
                    padding: 24px;
                    margin-bottom: 24px;
                    color: white;
                    box-shadow: 0 4px 14px rgba(164, 4, 228, 0.25);
                }

                .dc-validation-card.status-valid {
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    box-shadow: 0 4px 14px rgba(16, 185, 129, 0.25);
                }

                .dc-validation-card.status-invalid,
                .dc-validation-card.status-api-error {
                    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                    box-shadow: 0 4px 14px rgba(239, 68, 68, 0.25);
                }

                .dc-validation-card.status-expired {
                    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                    box-shadow: 0 4px 14px rgba(245, 158, 11, 0.25);
                }

                .dc-validation-card.status-pending,
                .dc-validation-card.status-not-found {
                    background: linear-gradient(135deg, #a404e4 0%, #8501b9 100%);
                    box-shadow: 0 4px 14px rgba(164, 4, 228, 0.25);
                }

                .dc-validation-header {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    margin-bottom: 20px;
                }

                .dc-validation-icon {
                    width: 64px;
                    height: 64px;
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .dc-validation-info {
                    flex: 1;
                }

                .dc-validation-trn {
                    font-size: 1.5rem;
                    font-weight: 700;
                    font-family: 'Monaco', 'Consolas', monospace;
                    letter-spacing: 2px;
                    margin-bottom: 4px;
                }

                .dc-validation-subtitle {
                    font-size: 0.875rem;
                    opacity: 0.9;
                }

                .dc-validation-status-badge {
                    background: rgba(255, 255, 255, 0.25);
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .dc-validation-details {
                    display: flex;
                    gap: 24px;
                    padding-top: 16px;
                    border-top: 1px solid rgba(255, 255, 255, 0.2);
                    flex-wrap: wrap;
                }

                .dc-validation-detail-item {
                    flex: 1;
                    min-width: 120px;
                }

                .dc-validation-detail-label {
                    font-size: 0.6875rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    opacity: 0.8;
                    margin-bottom: 4px;
                }

                .dc-validation-detail-value {
                    font-size: 0.875rem;
                    font-weight: 600;
                }

                /* Response Message Box */
                .dc-response-message {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    padding: 12px 16px;
                    margin-top: 16px;
                    font-size: 0.875rem;
                    line-height: 1.5;
                }

                .dc-response-message-label {
                    font-size: 0.6875rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    opacity: 0.8;
                    margin-bottom: 8px;
                }

                /* History Table */
                .dc-history-table-wrapper {
                    max-height: 400px;
                    overflow-y: auto;
                }

                .dc-history-table {
                    font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                .dc-history-table th {
                    background: #f8f9fa;
                    font-weight: 600;
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: #6b7280;
                }

                .dc-history-table td {
                    vertical-align: middle;
                    font-size: 0.875rem;
                }

                /* Indicator Pills */
                .dc-form-wrapper .indicator-pill.green,
                .dc-history-table .indicator-pill.green {
                    background: #dcfce7;
                    color: #166534;
                }

                .dc-form-wrapper .indicator-pill.red,
                .dc-history-table .indicator-pill.red {
                    background: #fee2e2;
                    color: #991b1b;
                }

                .dc-form-wrapper .indicator-pill.orange,
                .dc-history-table .indicator-pill.orange {
                    background: #fef3c7;
                    color: #92400e;
                }

                .dc-form-wrapper .indicator-pill.blue,
                .dc-history-table .indicator-pill.blue {
                    background: #f3e8ff;
                    color: #a404e4;
                }

                .dc-form-wrapper .indicator-pill.grey,
                .dc-history-table .indicator-pill.grey {
                    background: #f3f4f6;
                    color: #6b7280;
                }

                /* Animation */
                .dc-fade-in {
                    animation: dcFadeIn 0.3s ease-out;
                }

                @keyframes dcFadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                /* Mobile responsive */
                @media (max-width: 768px) {
                    .dc-validation-header {
                        flex-direction: column;
                        text-align: center;
                    }

                    .dc-validation-details {
                        flex-direction: column;
                        gap: 12px;
                    }

                    .dc-validation-detail-item {
                        min-width: 100%;
                    }
                }
            </style>
        `);
    },

    show_status_indicator: function(frm) {
        if (!frm.doc.validation_status) return;

        let indicator_color = frm.events.get_status_color(frm.doc.validation_status);
        frm.page.set_indicator(frm.doc.validation_status, indicator_color);
    },

    show_validation_card: function(frm) {
        // Remove existing card
        frm.$wrapper.find('.dc-validation-card').remove();

        // Only show for saved documents
        if (frm.is_new() || !frm.doc.trn) return;

        // Determine status class
        let status_class = '';
        let status_icon = '';

        switch(frm.doc.validation_status) {
            case 'Valid':
                status_class = 'status-valid';
                status_icon = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>`;
                break;
            case 'Invalid':
            case 'API Error':
                status_class = frm.doc.validation_status === 'Invalid' ? 'status-invalid' : 'status-api-error';
                status_icon = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>`;
                break;
            case 'Expired':
                status_class = 'status-expired';
                status_icon = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                </svg>`;
                break;
            case 'Not Found':
                status_class = 'status-not-found';
                status_icon = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                    <circle cx="11" cy="11" r="8"/>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    <line x1="8" y1="11" x2="14" y2="11"/>
                </svg>`;
                break;
            case 'Pending':
            default:
                status_class = 'status-pending';
                status_icon = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                </svg>`;
        }

        // Format TRN with spaces for readability
        let formatted_trn = frm.doc.trn;
        if (frm.doc.trn && frm.doc.trn.length === 15) {
            formatted_trn = frm.doc.trn.replace(/(\d{3})(\d{4})(\d{4})(\d{4})/, '$1 $2 $3 $4');
        }

        // Response message section
        let response_message_html = '';
        if (frm.doc.response_message) {
            response_message_html = `
                <div class="dc-response-message">
                    <div class="dc-response-message-label">Response Message</div>
                    ${frm.doc.response_message}
                </div>
            `;
        }

        // Build card
        let $card = $(`
            <div class="dc-validation-card ${status_class} dc-fade-in">
                <div class="dc-validation-header">
                    <div class="dc-validation-icon">${status_icon}</div>
                    <div class="dc-validation-info">
                        <div class="dc-validation-trn">${formatted_trn}</div>
                        <div class="dc-validation-subtitle">
                            ${frm.doc.fta_entity_name || (frm.doc.trn_registry ? 'Linked to Registry' : 'Standalone Validation')}
                        </div>
                    </div>
                    <div class="dc-validation-status-badge">${frm.doc.validation_status || 'Unknown'}</div>
                </div>
                <div class="dc-validation-details">
                    <div class="dc-validation-detail-item">
                        <div class="dc-validation-detail-label">Validation Type</div>
                        <div class="dc-validation-detail-value">${frm.doc.validation_type || '-'}</div>
                    </div>
                    <div class="dc-validation-detail-item">
                        <div class="dc-validation-detail-label">Source</div>
                        <div class="dc-validation-detail-value">${frm.doc.validation_source || '-'}</div>
                    </div>
                    <div class="dc-validation-detail-item">
                        <div class="dc-validation-detail-label">Validation Date</div>
                        <div class="dc-validation-detail-value">${frm.doc.validation_date ? frappe.datetime.str_to_user(frm.doc.validation_date) : '-'}</div>
                    </div>
                    ${frm.doc.response_code ? `
                    <div class="dc-validation-detail-item">
                        <div class="dc-validation-detail-label">Response Code</div>
                        <div class="dc-validation-detail-value">${frm.doc.response_code}</div>
                    </div>
                    ` : ''}
                    ${frm.doc.fta_registration_date ? `
                    <div class="dc-validation-detail-item">
                        <div class="dc-validation-detail-label">FTA Registration</div>
                        <div class="dc-validation-detail-value">${frappe.datetime.str_to_user(frm.doc.fta_registration_date)}</div>
                    </div>
                    ` : ''}
                    ${frm.doc.fta_expiry_date ? `
                    <div class="dc-validation-detail-item">
                        <div class="dc-validation-detail-label">FTA Expiry</div>
                        <div class="dc-validation-detail-value">${frappe.datetime.str_to_user(frm.doc.fta_expiry_date)}</div>
                    </div>
                    ` : ''}
                </div>
                ${response_message_html}
            </div>
        `);

        // Insert card at top of form
        frm.$wrapper.find('.form-page').first().prepend($card);
    }
});
