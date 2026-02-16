// Copyright (c) 2024, DigiComply and contributors
// License: MIT

frappe.ui.form.on('TRN Registry', {
    refresh: function(frm) {
        // Add DigiComply form wrapper class
        frm.$wrapper.find('.form-page').addClass('dc-form-wrapper');

        // Add custom styles
        frm.trigger('add_custom_styles');

        // Show status indicator
        frm.trigger('show_status_indicator');

        // Add Validate with FTA button
        if (!frm.is_new()) {
            frm.add_custom_button(__('Validate with FTA'), function() {
                frappe.msgprint({
                    title: __('FTA Validation'),
                    indicator: 'blue',
                    message: __('FTA API integration will be available in Phase 2. ' +
                               'Currently, TRN format validation is performed automatically on save.')
                });
            }, __('Actions'));

            // Add Set as Primary button if not already primary
            if (!frm.doc.is_primary) {
                frm.add_custom_button(__('Set as Primary'), function() {
                    frappe.confirm(
                        __('Set this TRN as the primary TRN for {0}?', [frm.doc.company]),
                        function() {
                            frappe.call({
                                method: 'digicomply.digicomply.doctype.trn_registry.trn_registry.set_primary_trn',
                                args: {
                                    trn_name: frm.doc.name
                                },
                                callback: function(r) {
                                    if (r.message && r.message.status === 'success') {
                                        frm.reload_doc();
                                    }
                                }
                            });
                        }
                    );
                }, __('Actions'));
            }
        }

        // Show TRN validation card
        frm.trigger('show_trn_card');
    },

    add_custom_styles: function(frm) {
        if ($('#trn-registry-styles').length) return;

        $('head').append(`
            <style id="trn-registry-styles">
                /* DigiComply Form Wrapper */
                .dc-form-wrapper {
                    font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                /* TRN Card */
                .dc-trn-card {
                    background: linear-gradient(135deg, #a404e4 0%, #8501b9 100%);
                    border-radius: 16px;
                    padding: 24px;
                    margin-bottom: 24px;
                    color: white;
                    box-shadow: 0 4px 14px rgba(164, 4, 228, 0.25);
                }

                .dc-trn-card.status-valid {
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    box-shadow: 0 4px 14px rgba(16, 185, 129, 0.25);
                }

                .dc-trn-card.status-invalid {
                    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                    box-shadow: 0 4px 14px rgba(239, 68, 68, 0.25);
                }

                .dc-trn-card.status-expired {
                    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                    box-shadow: 0 4px 14px rgba(245, 158, 11, 0.25);
                }

                .dc-trn-card.status-pending {
                    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
                    box-shadow: 0 4px 14px rgba(99, 102, 241, 0.25);
                }

                .dc-trn-header {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    margin-bottom: 20px;
                }

                .dc-trn-icon {
                    width: 64px;
                    height: 64px;
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .dc-trn-info {
                    flex: 1;
                }

                .dc-trn-number {
                    font-size: 1.5rem;
                    font-weight: 700;
                    font-family: 'Monaco', 'Consolas', monospace;
                    letter-spacing: 2px;
                    margin-bottom: 4px;
                }

                .dc-trn-entity {
                    font-size: 0.875rem;
                    opacity: 0.9;
                }

                .dc-trn-status-badge {
                    background: rgba(255, 255, 255, 0.25);
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .dc-trn-details {
                    display: flex;
                    gap: 24px;
                    padding-top: 16px;
                    border-top: 1px solid rgba(255, 255, 255, 0.2);
                }

                .dc-trn-detail-item {
                    flex: 1;
                }

                .dc-trn-detail-label {
                    font-size: 0.6875rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    opacity: 0.8;
                    margin-bottom: 4px;
                }

                .dc-trn-detail-value {
                    font-size: 0.875rem;
                    font-weight: 600;
                }

                /* Primary Badge */
                .dc-primary-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    background: rgba(255, 255, 255, 0.2);
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    margin-left: 12px;
                }

                .dc-primary-badge svg {
                    width: 14px;
                    height: 14px;
                }

                /* Form field styling */
                .dc-form-wrapper .frappe-control[data-fieldname="trn"] input {
                    font-family: 'Monaco', 'Consolas', monospace;
                    font-size: 1.125rem;
                    letter-spacing: 2px;
                }

                /* Status indicator colors */
                .dc-form-wrapper .indicator-pill.green {
                    background: #dcfce7;
                    color: #166534;
                }

                .dc-form-wrapper .indicator-pill.red {
                    background: #fee2e2;
                    color: #991b1b;
                }

                .dc-form-wrapper .indicator-pill.orange {
                    background: #fef3c7;
                    color: #92400e;
                }

                .dc-form-wrapper .indicator-pill.blue {
                    background: #f3e8ff;
                    color: #a404e4;
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
                    .dc-trn-header {
                        flex-direction: column;
                        text-align: center;
                    }

                    .dc-trn-details {
                        flex-direction: column;
                        gap: 12px;
                    }
                }
            </style>
        `);
    },

    show_status_indicator: function(frm) {
        if (!frm.doc.validation_status) return;

        let indicator_map = {
            'Not Validated': 'orange',
            'Valid': 'green',
            'Invalid': 'red',
            'Expired': 'orange',
            'Pending Verification': 'blue'
        };

        let indicator = indicator_map[frm.doc.validation_status] || 'grey';
        frm.page.set_indicator(frm.doc.validation_status, indicator);
    },

    show_trn_card: function(frm) {
        // Remove existing card
        frm.$wrapper.find('.dc-trn-card').remove();

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
                status_class = 'status-invalid';
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
            case 'Pending Verification':
                status_class = 'status-pending';
                status_icon = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>`;
                break;
            default:
                status_icon = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>`;
        }

        // Format TRN with spaces for readability
        let formatted_trn = frm.doc.trn.replace(/(\d{3})(\d{4})(\d{4})(\d{4})/, '$1 $2 $3 $4');

        // Primary badge
        let primary_badge = frm.doc.is_primary ? `
            <span class="dc-primary-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
                Primary
            </span>
        ` : '';

        // Build card
        let $card = $(`
            <div class="dc-trn-card ${status_class} dc-fade-in">
                <div class="dc-trn-header">
                    <div class="dc-trn-icon">${status_icon}</div>
                    <div class="dc-trn-info">
                        <div class="dc-trn-number">${formatted_trn}${primary_badge}</div>
                        <div class="dc-trn-entity">${frm.doc.entity_name || 'Unnamed Entity'}</div>
                    </div>
                    <div class="dc-trn-status-badge">${frm.doc.validation_status}</div>
                </div>
                <div class="dc-trn-details">
                    <div class="dc-trn-detail-item">
                        <div class="dc-trn-detail-label">Company</div>
                        <div class="dc-trn-detail-value">${frm.doc.company}</div>
                    </div>
                    <div class="dc-trn-detail-item">
                        <div class="dc-trn-detail-label">Entity Type</div>
                        <div class="dc-trn-detail-value">${frm.doc.entity_type || 'Not specified'}</div>
                    </div>
                    <div class="dc-trn-detail-item">
                        <div class="dc-trn-detail-label">Last Validated</div>
                        <div class="dc-trn-detail-value">${frm.doc.last_validated ? frappe.datetime.str_to_user(frm.doc.last_validated) : 'Never'}</div>
                    </div>
                    ${frm.doc.fta_expiry_date ? `
                    <div class="dc-trn-detail-item">
                        <div class="dc-trn-detail-label">Expiry Date</div>
                        <div class="dc-trn-detail-value">${frappe.datetime.str_to_user(frm.doc.fta_expiry_date)}</div>
                    </div>
                    ` : ''}
                </div>
            </div>
        `);

        // Insert card at top of form
        frm.$wrapper.find('.form-page').first().prepend($card);
    },

    trn: function(frm) {
        // Format TRN as user types (remove non-digits)
        if (frm.doc.trn) {
            let cleaned = frm.doc.trn.replace(/[^0-9]/g, '');
            if (cleaned !== frm.doc.trn) {
                frm.set_value('trn', cleaned);
            }
        }
    },

    is_primary: function(frm) {
        // Show warning when setting as primary
        if (frm.doc.is_primary && !frm.is_new()) {
            frappe.show_alert({
                message: __('This TRN will be set as the primary TRN for {0}', [frm.doc.company]),
                indicator: 'blue'
            }, 5);
        }
    }
});
