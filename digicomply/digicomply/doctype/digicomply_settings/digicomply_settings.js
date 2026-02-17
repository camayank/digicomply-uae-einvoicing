// Copyright (c) 2024, DigiComply and contributors
// License: MIT

frappe.ui.form.on('DigiComply Settings', {
    refresh: function(frm) {
        // Add DigiComply form wrapper class
        frm.$wrapper.find('.form-page').addClass('dc-form-wrapper');

        // Add custom styles
        frm.trigger('add_custom_styles');

        // Show settings header card
        frm.trigger('show_settings_card');

        // Add action buttons
        frm.add_custom_button(__('Test ASP Connection'), function() {
            frm.trigger('test_asp_connection');
        }, __('Actions'));

        frm.add_custom_button(__('Sync Now'), function() {
            frm.trigger('sync_now');
        }, __('Actions'));

        frm.add_custom_button(__('Test FTA Connection'), function() {
            frm.trigger('test_fta_connection');
        }, __('Actions'));
    },

    add_custom_styles: function(frm) {
        if ($('#digicomply-settings-styles').length) return;

        $('head').append(`
            <style id="digicomply-settings-styles">
                /* DigiComply Form Wrapper */
                .dc-form-wrapper {
                    font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                /* Settings Card */
                .dc-settings-card {
                    background: linear-gradient(135deg, #a404e4 0%, #8501b9 100%);
                    border-radius: 16px;
                    padding: 24px;
                    margin-bottom: 24px;
                    color: white;
                    box-shadow: 0 4px 14px rgba(164, 4, 228, 0.25);
                }

                .dc-settings-header {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    margin-bottom: 20px;
                }

                .dc-settings-icon {
                    width: 64px;
                    height: 64px;
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .dc-settings-info {
                    flex: 1;
                }

                .dc-settings-title {
                    font-size: 1.5rem;
                    font-weight: 700;
                    margin-bottom: 4px;
                }

                .dc-settings-subtitle {
                    font-size: 0.875rem;
                    opacity: 0.9;
                }

                .dc-settings-stats {
                    display: flex;
                    gap: 24px;
                    padding-top: 16px;
                    border-top: 1px solid rgba(255, 255, 255, 0.2);
                }

                .dc-settings-stat {
                    flex: 1;
                    text-align: center;
                }

                .dc-settings-stat-value {
                    font-size: 1.25rem;
                    font-weight: 700;
                    margin-bottom: 4px;
                }

                .dc-settings-stat-label {
                    font-size: 0.6875rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    opacity: 0.8;
                }

                /* Integration Status */
                .dc-integration-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    font-weight: 600;
                }

                .dc-integration-badge.enabled {
                    background: rgba(16, 185, 129, 0.2);
                    color: #dcfce7;
                }

                .dc-integration-badge.disabled {
                    background: rgba(255, 255, 255, 0.1);
                    color: rgba(255, 255, 255, 0.7);
                }

                .dc-integration-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                }

                .dc-integration-dot.enabled { background: #10b981; }
                .dc-integration-dot.disabled { background: #6b7280; }

                /* Section styling */
                .dc-form-wrapper .section-head {
                    background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);
                    border-radius: 8px 8px 0 0;
                    padding: 12px 16px;
                    margin-top: 16px;
                    border-bottom: 2px solid #a404e4;
                }

                .dc-form-wrapper .section-head .collapse-indicator {
                    color: #a404e4;
                }

                /* Password field styling */
                .dc-form-wrapper [data-fieldtype="Password"] .control-input {
                    position: relative;
                }

                .dc-form-wrapper [data-fieldtype="Password"] input {
                    padding-right: 40px;
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
                    .dc-settings-header {
                        flex-direction: column;
                        text-align: center;
                    }

                    .dc-settings-stats {
                        flex-direction: column;
                        gap: 12px;
                    }
                }
            </style>
        `);
    },

    show_settings_card: function(frm) {
        // Remove existing card
        frm.$wrapper.find('.dc-settings-card').remove();

        // Settings icon
        let settings_icon = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>`;

        // Integration status badges
        let cleartax_status = frm.doc.cleartax_enabled ? 'enabled' : 'disabled';
        let cygnet_status = frm.doc.cygnet_enabled ? 'enabled' : 'disabled';
        let fta_status = frm.doc.enable_fta_validation ? 'enabled' : 'disabled';
        let auto_sync_status = frm.doc.enable_auto_sync ? 'enabled' : 'disabled';

        // Build card
        let $card = $(`
            <div class="dc-settings-card dc-fade-in">
                <div class="dc-settings-header">
                    <div class="dc-settings-icon">${settings_icon}</div>
                    <div class="dc-settings-info">
                        <div class="dc-settings-title">DigiComply Settings</div>
                        <div class="dc-settings-subtitle">
                            Configure your e-invoicing compliance platform
                        </div>
                    </div>
                </div>
                <div class="dc-settings-stats">
                    <div class="dc-settings-stat">
                        <div class="dc-settings-stat-value">${frm.doc.default_asp_provider || 'Not Set'}</div>
                        <div class="dc-settings-stat-label">ASP Provider</div>
                    </div>
                    <div class="dc-settings-stat">
                        <div class="dc-settings-stat-value">
                            <span class="dc-integration-badge ${fta_status}">
                                <span class="dc-integration-dot ${fta_status}"></span>
                                FTA API
                            </span>
                        </div>
                        <div class="dc-settings-stat-label">Validation</div>
                    </div>
                    <div class="dc-settings-stat">
                        <div class="dc-settings-stat-value">
                            <span class="dc-integration-badge ${cleartax_status}">
                                <span class="dc-integration-dot ${cleartax_status}"></span>
                                ClearTax
                            </span>
                        </div>
                        <div class="dc-settings-stat-label">Integration</div>
                    </div>
                    <div class="dc-settings-stat">
                        <div class="dc-settings-stat-value">
                            <span class="dc-integration-badge ${cygnet_status}">
                                <span class="dc-integration-dot ${cygnet_status}"></span>
                                Cygnet
                            </span>
                        </div>
                        <div class="dc-settings-stat-label">Integration</div>
                    </div>
                    <div class="dc-settings-stat">
                        <div class="dc-settings-stat-value">${frm.doc.default_vat_rate || 5}%</div>
                        <div class="dc-settings-stat-label">VAT Rate</div>
                    </div>
                </div>
            </div>
        `);

        // Insert card at top of form
        frm.$wrapper.find('.form-page').first().prepend($card);
    },

    test_asp_connection: function(frm) {
        frappe.msgprint({
            title: __('ASP Connection Test'),
            indicator: 'blue',
            message: __('ASP API connection testing will be available in Phase 2. ' +
                       'Currently, connections are validated when data is fetched.')
        });
    },

    test_fta_connection: function(frm) {
        if (!frm.doc.enable_fta_validation) {
            frappe.msgprint({
                title: __('FTA API Not Enabled'),
                indicator: 'orange',
                message: __('Please enable FTA API Validation first.')
            });
            return;
        }

        if (!frm.doc.fta_api_url || !frm.doc.fta_api_key) {
            frappe.msgprint({
                title: __('FTA API Configuration Incomplete'),
                indicator: 'orange',
                message: __('Please configure FTA API URL and API Key.')
            });
            return;
        }

        frappe.call({
            method: 'digicomply.digicomply.doctype.digicomply_settings.digicomply_settings.test_fta_connection',
            freeze: true,
            freeze_message: __('Testing FTA API Connection...'),
            callback: function(r) {
                if (r.message && r.message.success) {
                    frappe.msgprint({
                        title: __('Connection Successful'),
                        indicator: 'green',
                        message: __('FTA API connection test passed.')
                    });
                } else {
                    frappe.msgprint({
                        title: __('Connection Failed'),
                        indicator: 'red',
                        message: r.message ? r.message.error : __('Unable to connect to FTA API.')
                    });
                }
            }
        });
    },

    sync_now: function(frm) {
        if (!frm.doc.default_asp_provider) {
            frappe.msgprint({
                title: __('No ASP Configured'),
                indicator: 'orange',
                message: __('Please select a default ASP provider first.')
            });
            return;
        }

        frappe.msgprint({
            title: __('Manual Sync'),
            indicator: 'blue',
            message: __('Manual ASP sync will be available in Phase 2. ' +
                       'Currently, use CSV Import to bring in ASP data.')
        });
    },

    // Update card when FTA validation toggle changes
    enable_fta_validation: function(frm) {
        frm.trigger('show_settings_card');
    },

    // Update card when VAT rate changes
    default_vat_rate: function(frm) {
        frm.trigger('show_settings_card');
    }
});
