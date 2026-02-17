// Copyright (c) 2024, DigiComply and contributors
// License: MIT

frappe.ui.form.on('TRN Blacklist', {
    refresh: function(frm) {
        // Add DigiComply form wrapper class
        frm.$wrapper.find('.form-page').addClass('dc-form-wrapper');

        // Add custom styles
        frm.trigger('add_custom_styles');

        // Show warning card at top
        frm.trigger('show_warning_card');

        // Show verified badge if applicable
        frm.trigger('show_status_indicator');

        // Add action buttons
        if (!frm.is_new()) {
            // Add Verify button for System Manager if not verified
            if (!frm.doc.verified && frappe.user.has_role('System Manager')) {
                frm.add_custom_button(__('Verify Entry'), function() {
                    frappe.confirm(
                        __('Are you sure you want to verify this blacklist entry? This confirms the TRN has been reviewed and is legitimately blacklisted.'),
                        function() {
                            frappe.call({
                                method: 'digicomply.digicomply.doctype.trn_blacklist.trn_blacklist.verify_blacklist_entry',
                                args: {
                                    trn: frm.doc.trn
                                },
                                callback: function(r) {
                                    if (r.message && r.message.success) {
                                        frappe.show_alert({
                                            message: __('Blacklist entry verified'),
                                            indicator: 'green'
                                        }, 5);
                                        frm.reload_doc();
                                    }
                                }
                            });
                        }
                    );
                }, __('Actions'));
            }

            // Add Deactivate button
            if (frm.doc.is_active) {
                frm.add_custom_button(__('Deactivate'), function() {
                    frappe.confirm(
                        __('Are you sure you want to deactivate this blacklist entry? The TRN will no longer be flagged during validation.'),
                        function() {
                            frappe.call({
                                method: 'digicomply.digicomply.doctype.trn_blacklist.trn_blacklist.remove_from_blacklist',
                                args: {
                                    trn: frm.doc.trn
                                },
                                callback: function(r) {
                                    if (r.message && r.message.success) {
                                        frappe.show_alert({
                                            message: __('Blacklist entry deactivated'),
                                            indicator: 'green'
                                        }, 5);
                                        frm.reload_doc();
                                    }
                                }
                            });
                        }
                    );
                }, __('Actions'));
            }

            // Add Check TRN button to validate against FTA
            frm.add_custom_button(__('Check Related TRNs'), function() {
                frappe.set_route('List', 'TRN Registry', {
                    trn: frm.doc.trn
                });
            }, __('Actions'));
        }
    },

    add_custom_styles: function(frm) {
        if ($('#trn-blacklist-styles').length) return;

        $('head').append(`
            <style id="trn-blacklist-styles">
                /* DigiComply Form Wrapper */
                .dc-form-wrapper {
                    font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                /* Blacklist Warning Card */
                .dc-blacklist-warning-card {
                    background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
                    border-radius: 16px;
                    padding: 24px;
                    margin-bottom: 24px;
                    color: white;
                    box-shadow: 0 4px 14px rgba(220, 38, 38, 0.35);
                }

                .dc-blacklist-warning-card.inactive {
                    background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
                    box-shadow: 0 4px 14px rgba(107, 114, 128, 0.25);
                }

                .dc-blacklist-warning-card.verified {
                    border: 3px solid rgba(255, 255, 255, 0.5);
                }

                .dc-blacklist-header {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    margin-bottom: 20px;
                }

                .dc-blacklist-icon {
                    width: 72px;
                    height: 72px;
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .dc-blacklist-info {
                    flex: 1;
                }

                .dc-blacklist-title {
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    opacity: 0.9;
                    margin-bottom: 8px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .dc-blacklist-trn {
                    font-size: 1.75rem;
                    font-weight: 700;
                    font-family: 'Monaco', 'Consolas', monospace;
                    letter-spacing: 3px;
                    margin-bottom: 8px;
                }

                .dc-blacklist-reason {
                    font-size: 1rem;
                    font-weight: 600;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    background: rgba(255, 255, 255, 0.2);
                    padding: 8px 16px;
                    border-radius: 8px;
                }

                .dc-blacklist-badges {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    align-items: flex-end;
                }

                .dc-blacklist-status-badge {
                    background: rgba(255, 255, 255, 0.25);
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .dc-blacklist-verified-badge {
                    background: rgba(16, 185, 129, 0.3);
                    padding: 6px 12px;
                    border-radius: 16px;
                    font-size: 0.6875rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .dc-blacklist-details {
                    display: flex;
                    gap: 24px;
                    padding-top: 16px;
                    border-top: 1px solid rgba(255, 255, 255, 0.2);
                    flex-wrap: wrap;
                }

                .dc-blacklist-detail-item {
                    flex: 1;
                    min-width: 140px;
                }

                .dc-blacklist-detail-label {
                    font-size: 0.6875rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    opacity: 0.8;
                    margin-bottom: 4px;
                }

                .dc-blacklist-detail-value {
                    font-size: 0.875rem;
                    font-weight: 600;
                }

                /* Warning Message */
                .dc-blacklist-warning-message {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    padding: 12px 16px;
                    margin-top: 16px;
                    font-size: 0.875rem;
                    line-height: 1.5;
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                }

                .dc-blacklist-warning-message svg {
                    flex-shrink: 0;
                    margin-top: 2px;
                }

                /* Form field styling */
                .dc-form-wrapper .frappe-control[data-fieldname="trn"] input {
                    font-family: 'Monaco', 'Consolas', monospace;
                    font-size: 1.125rem;
                    letter-spacing: 2px;
                }

                /* Indicator overrides */
                .dc-form-wrapper .indicator-pill.red {
                    background: #fee2e2;
                    color: #991b1b;
                }

                .dc-form-wrapper .indicator-pill.green {
                    background: #dcfce7;
                    color: #166534;
                }

                .dc-form-wrapper .indicator-pill.grey {
                    background: #f3f4f6;
                    color: #6b7280;
                }

                /* Animation */
                .dc-fade-in {
                    animation: dcFadeIn 0.3s ease-out;
                }

                .dc-pulse {
                    animation: dcPulse 2s ease-in-out infinite;
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

                @keyframes dcPulse {
                    0%, 100% {
                        box-shadow: 0 4px 14px rgba(220, 38, 38, 0.35);
                    }
                    50% {
                        box-shadow: 0 4px 24px rgba(220, 38, 38, 0.55);
                    }
                }

                /* Mobile responsive */
                @media (max-width: 768px) {
                    .dc-blacklist-header {
                        flex-direction: column;
                        text-align: center;
                    }

                    .dc-blacklist-badges {
                        align-items: center;
                    }

                    .dc-blacklist-details {
                        flex-direction: column;
                        gap: 12px;
                    }

                    .dc-blacklist-detail-item {
                        min-width: 100%;
                    }

                    .dc-blacklist-trn {
                        font-size: 1.25rem;
                        letter-spacing: 2px;
                    }
                }
            </style>
        `);
    },

    show_status_indicator: function(frm) {
        if (frm.is_new()) return;

        if (!frm.doc.is_active) {
            frm.page.set_indicator(__('Inactive'), 'grey');
        } else if (frm.doc.verified) {
            frm.page.set_indicator(__('Verified'), 'green');
        } else {
            frm.page.set_indicator(__('Active - Unverified'), 'red');
        }
    },

    show_warning_card: function(frm) {
        // Remove existing card
        frm.$wrapper.find('.dc-blacklist-warning-card').remove();

        // Only show for saved documents
        if (frm.is_new() || !frm.doc.trn) return;

        // Escape user content
        let escaped_trn = frappe.utils.escape_html(frm.doc.trn || '');
        let escaped_reason = frappe.utils.escape_html(frm.doc.reason || 'Unknown');
        let escaped_entity = frappe.utils.escape_html(frm.doc.entity_name || 'Unknown Entity');
        let escaped_notes = frappe.utils.escape_html(frm.doc.notes || '');

        // Format TRN with spaces for readability
        let formatted_trn = escaped_trn;
        if (escaped_trn.length === 15) {
            formatted_trn = escaped_trn.replace(/(\d{3})(\d{4})(\d{4})(\d{4})/, '$1 $2 $3 $4');
        }

        // Determine card classes
        let card_classes = 'dc-blacklist-warning-card dc-fade-in';
        if (!frm.doc.is_active) {
            card_classes += ' inactive';
        } else {
            card_classes += ' dc-pulse';
        }
        if (frm.doc.verified) {
            card_classes += ' verified';
        }

        // Warning icon SVG
        let warning_icon = `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>`;

        // Status badge
        let status_badge = frm.doc.is_active ?
            `<div class="dc-blacklist-status-badge">BLACKLISTED</div>` :
            `<div class="dc-blacklist-status-badge">INACTIVE</div>`;

        // Verified badge
        let verified_badge = frm.doc.verified ? `
            <div class="dc-blacklist-verified-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                Verified
            </div>
        ` : '';

        // Reason icon based on type
        let reason_icon = '';
        switch(frm.doc.reason) {
            case 'Fraudulent':
                reason_icon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>`;
                break;
            case 'Cancelled by FTA':
                reason_icon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                </svg>`;
                break;
            case 'Expired - Not Renewed':
                reason_icon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                </svg>`;
                break;
            default:
                reason_icon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>`;
        }

        // Warning message
        let warning_message = '';
        if (frm.doc.is_active) {
            warning_message = `
                <div class="dc-blacklist-warning-message">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="16" x2="12" y2="12"/>
                        <line x1="12" y1="8" x2="12.01" y2="8"/>
                    </svg>
                    <div>
                        <strong>Warning:</strong> This TRN is actively blacklisted and will be flagged during any validation or reconciliation processes. Any transactions involving this TRN should be carefully reviewed.
                    </div>
                </div>
            `;
        }

        // Notes section
        let notes_html = '';
        if (escaped_notes) {
            notes_html = `
                <div class="dc-blacklist-detail-item" style="min-width: 100%; margin-top: 8px;">
                    <div class="dc-blacklist-detail-label">Notes</div>
                    <div class="dc-blacklist-detail-value">${escaped_notes}</div>
                </div>
            `;
        }

        // Build card
        let $card = $(`
            <div class="${card_classes}">
                <div class="dc-blacklist-header">
                    <div class="dc-blacklist-icon">${warning_icon}</div>
                    <div class="dc-blacklist-info">
                        <div class="dc-blacklist-title">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                            </svg>
                            Blacklisted TRN
                        </div>
                        <div class="dc-blacklist-trn">${formatted_trn}</div>
                        <div class="dc-blacklist-reason">
                            ${reason_icon}
                            ${escaped_reason}
                        </div>
                    </div>
                    <div class="dc-blacklist-badges">
                        ${status_badge}
                        ${verified_badge}
                    </div>
                </div>
                <div class="dc-blacklist-details">
                    <div class="dc-blacklist-detail-item">
                        <div class="dc-blacklist-detail-label">Entity Name</div>
                        <div class="dc-blacklist-detail-value">${escaped_entity}</div>
                    </div>
                    <div class="dc-blacklist-detail-item">
                        <div class="dc-blacklist-detail-label">Reported Date</div>
                        <div class="dc-blacklist-detail-value">${frm.doc.reported_date ? frappe.datetime.str_to_user(frm.doc.reported_date) : '-'}</div>
                    </div>
                    <div class="dc-blacklist-detail-item">
                        <div class="dc-blacklist-detail-label">Reported By</div>
                        <div class="dc-blacklist-detail-value">${frappe.utils.escape_html(frm.doc.reported_by || '-')}</div>
                    </div>
                    <div class="dc-blacklist-detail-item">
                        <div class="dc-blacklist-detail-label">Status</div>
                        <div class="dc-blacklist-detail-value">${frm.doc.is_active ? 'Active' : 'Inactive'} ${frm.doc.verified ? '(Verified)' : '(Unverified)'}</div>
                    </div>
                    ${notes_html}
                </div>
                ${warning_message}
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

    is_active: function(frm) {
        // Refresh the warning card when status changes
        if (!frm.is_new()) {
            frm.trigger('show_warning_card');
            frm.trigger('show_status_indicator');
        }
    },

    verified: function(frm) {
        // Refresh the warning card when verified status changes
        if (!frm.is_new()) {
            frm.trigger('show_warning_card');
            frm.trigger('show_status_indicator');
        }
    }
});
