// Copyright (c) 2024, DigiComply and contributors
// License: MIT

frappe.ui.form.on('VAT Adjustment', {
    refresh: function(frm) {
        // Add custom styles
        frm.trigger('add_custom_styles');

        // Add visual adjustment card
        frm.trigger('add_adjustment_card');

        // Add action buttons based on status
        frm.trigger('add_action_buttons');
    },

    add_custom_styles: function(frm) {
        if ($('#dc-vat-adjustment-styles').length) return;

        $('head').append(`
            <style id="dc-vat-adjustment-styles">
                /* VAT Adjustment Card */
                .dc-adjustment-card {
                    background: linear-gradient(135deg, #a404e4 0%, #8501b9 100%);
                    border-radius: 16px;
                    padding: 24px;
                    margin-bottom: 24px;
                    color: white;
                    box-shadow: 0 4px 14px rgba(164, 4, 228, 0.25);
                    font-family: 'Poppins', var(--font-stack);
                }

                .dc-adjustment-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 20px;
                }

                .dc-adjustment-title {
                    font-size: 1.125rem;
                    font-weight: 600;
                    opacity: 0.9;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .dc-adjustment-type {
                    font-size: 0.875rem;
                    opacity: 0.8;
                    margin-top: 4px;
                }

                .dc-adjustment-status-badge {
                    padding: 6px 14px;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .dc-adjustment-status-badge.draft { background: rgba(255,255,255,0.2); }
                .dc-adjustment-status-badge.approved { background: #3b82f6; }
                .dc-adjustment-status-badge.applied { background: #10b981; }
                .dc-adjustment-status-badge.cancelled { background: #ef4444; }

                .dc-adjustment-main-amount {
                    text-align: center;
                    padding: 20px 0;
                    border-top: 1px solid rgba(255,255,255,0.2);
                    border-bottom: 1px solid rgba(255,255,255,0.2);
                }

                .dc-adjustment-main-label {
                    font-size: 0.875rem;
                    opacity: 0.85;
                    margin-bottom: 8px;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .dc-adjustment-main-value {
                    font-size: 2.5rem;
                    font-weight: 700;
                    line-height: 1.2;
                }

                .dc-adjustment-main-value.positive { color: #fcd34d; }
                .dc-adjustment-main-value.negative { color: #86efac; }
                .dc-adjustment-main-value.zero { color: white; }

                .dc-adjustment-breakdown {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 16px;
                    margin-top: 20px;
                }

                .dc-adjustment-breakdown-item {
                    background: rgba(255,255,255,0.1);
                    border-radius: 12px;
                    padding: 16px;
                    text-align: center;
                    transition: all 0.2s ease;
                }

                .dc-adjustment-breakdown-item:hover {
                    background: rgba(255,255,255,0.15);
                    transform: translateY(-2px);
                }

                .dc-adjustment-breakdown-label {
                    font-size: 0.75rem;
                    opacity: 0.8;
                    text-transform: uppercase;
                    letter-spacing: 0.03em;
                    margin-bottom: 6px;
                }

                .dc-adjustment-breakdown-value {
                    font-size: 1.125rem;
                    font-weight: 600;
                }

                .dc-adjustment-description {
                    margin-top: 20px;
                    padding: 16px;
                    background: rgba(255,255,255,0.1);
                    border-radius: 12px;
                }

                .dc-adjustment-description-label {
                    font-size: 0.75rem;
                    opacity: 0.8;
                    text-transform: uppercase;
                    letter-spacing: 0.03em;
                    margin-bottom: 8px;
                }

                .dc-adjustment-description-text {
                    font-size: 0.875rem;
                    line-height: 1.5;
                    opacity: 0.95;
                }

                /* Action Buttons */
                .dc-adjustment-actions {
                    display: flex;
                    gap: 12px;
                    margin-bottom: 20px;
                }

                .dc-adjustment-action-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 12px 24px;
                    border-radius: 10px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    border: none;
                }

                .dc-adjustment-action-btn.primary {
                    background: linear-gradient(135deg, #a404e4 0%, #8501b9 100%);
                    color: white;
                    box-shadow: 0 2px 8px rgba(164, 4, 228, 0.3);
                }

                .dc-adjustment-action-btn.primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(164, 4, 228, 0.4);
                }

                .dc-adjustment-action-btn.secondary {
                    background: white;
                    color: #a404e4;
                    border: 2px solid #a404e4;
                }

                .dc-adjustment-action-btn.secondary:hover {
                    background: #f8f5ff;
                }

                .dc-adjustment-action-btn.success {
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    color: white;
                    box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
                }

                .dc-adjustment-action-btn.success:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
                }

                .dc-adjustment-action-btn.danger {
                    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                    color: white;
                    box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
                }

                .dc-adjustment-action-btn.danger:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
                }

                .dc-adjustment-action-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    transform: none !important;
                }

                /* Mobile responsive */
                @media (max-width: 768px) {
                    .dc-adjustment-breakdown {
                        grid-template-columns: 1fr;
                    }

                    .dc-adjustment-actions {
                        flex-direction: column;
                    }
                }
            </style>
        `);
    },

    add_adjustment_card: function(frm) {
        // Remove existing card
        frm.$wrapper.find('.dc-adjustment-card').remove();

        // Only show for saved documents
        if (frm.is_new()) return;

        // Escape helper function for security
        const escapeHtml = (text) => {
            const div = document.createElement('div');
            div.textContent = text || '';
            return div.innerHTML;
        };

        // Format currency
        const formatCurrency = (amount) => {
            const num = parseFloat(amount) || 0;
            return format_currency(num, frm.doc.currency || 'AED');
        };

        // Determine status class
        let statusClass = 'draft';
        const status = frm.doc.status || 'Draft';
        if (status === 'Approved') statusClass = 'approved';
        else if (status === 'Applied') statusClass = 'applied';
        else if (status === 'Cancelled') statusClass = 'cancelled';

        // Determine VAT amount styling
        const vatAmount = parseFloat(frm.doc.vat_amount) || 0;
        let vatClass = 'zero';
        if (vatAmount > 0) {
            vatClass = 'positive';
        } else if (vatAmount < 0) {
            vatClass = 'negative';
        }

        // Format date
        const adjustmentDate = frm.doc.adjustment_date ?
            frappe.datetime.str_to_user(frm.doc.adjustment_date) : '';

        // Build VAT Return info
        let vatReturnInfo = '';
        if (frm.doc.vat_return) {
            vatReturnInfo = `
                <div class="dc-adjustment-breakdown-item">
                    <div class="dc-adjustment-breakdown-label">Applied To</div>
                    <div class="dc-adjustment-breakdown-value">${escapeHtml(frm.doc.vat_return)}</div>
                </div>
            `;
        }

        const $card = $(`
            <div class="dc-adjustment-card dc-fade-in">
                <div class="dc-adjustment-header">
                    <div>
                        <div class="dc-adjustment-title">VAT Adjustment</div>
                        <div class="dc-adjustment-type">${escapeHtml(frm.doc.adjustment_type)} - ${escapeHtml(adjustmentDate)}</div>
                    </div>
                    <div class="dc-adjustment-status-badge ${statusClass}">${escapeHtml(status)}</div>
                </div>
                <div class="dc-adjustment-main-amount">
                    <div class="dc-adjustment-main-label">VAT Adjustment Amount</div>
                    <div class="dc-adjustment-main-value ${vatClass}">${formatCurrency(vatAmount)}</div>
                </div>
                <div class="dc-adjustment-breakdown">
                    <div class="dc-adjustment-breakdown-item">
                        <div class="dc-adjustment-breakdown-label">Base Amount</div>
                        <div class="dc-adjustment-breakdown-value">${formatCurrency(frm.doc.base_amount)}</div>
                    </div>
                    <div class="dc-adjustment-breakdown-item">
                        <div class="dc-adjustment-breakdown-label">VAT Rate</div>
                        <div class="dc-adjustment-breakdown-value">${flt(frm.doc.vat_rate)}%</div>
                    </div>
                    ${vatReturnInfo || `
                    <div class="dc-adjustment-breakdown-item">
                        <div class="dc-adjustment-breakdown-label">Reference</div>
                        <div class="dc-adjustment-breakdown-value">${escapeHtml(frm.doc.reference_document) || '-'}</div>
                    </div>
                    `}
                </div>
                ${frm.doc.description ? `
                <div class="dc-adjustment-description">
                    <div class="dc-adjustment-description-label">Description</div>
                    <div class="dc-adjustment-description-text">${escapeHtml(frm.doc.description)}</div>
                </div>
                ` : ''}
            </div>
        `);

        // Insert after form header
        frm.$wrapper.find('.form-page').first().prepend($card);
    },

    add_action_buttons: function(frm) {
        // Remove existing action buttons container
        frm.$wrapper.find('.dc-adjustment-actions').remove();

        // Only show for saved documents
        if (frm.is_new()) return;

        const status = frm.doc.status || 'Draft';
        let buttons = [];

        // Approve button (Draft status only)
        if (status === 'Draft') {
            buttons.push({
                label: 'Approve',
                icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
                class: 'success',
                action: 'approve_adjustment'
            });
            buttons.push({
                label: 'Cancel',
                icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
                class: 'danger',
                action: 'cancel_adjustment'
            });
        }

        // Apply to VAT Return button (Approved status only)
        if (status === 'Approved') {
            buttons.push({
                label: 'Apply to VAT Return',
                icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>',
                class: 'primary',
                action: 'apply_to_vat_return'
            });
            buttons.push({
                label: 'Cancel',
                icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
                class: 'danger',
                action: 'cancel_adjustment'
            });
        }

        if (buttons.length === 0) return;

        // Escape helper function for security
        const escapeHtml = (text) => {
            const div = document.createElement('div');
            div.textContent = text || '';
            return div.innerHTML;
        };

        let buttonsHtml = buttons.map(btn => `
            <button class="dc-adjustment-action-btn ${btn.class}" data-action="${escapeHtml(btn.action)}">
                ${btn.icon}
                ${escapeHtml(btn.label)}
            </button>
        `).join('');

        const $actions = $(`<div class="dc-adjustment-actions">${buttonsHtml}</div>`);

        // Insert after card
        const $card = frm.$wrapper.find('.dc-adjustment-card');
        if ($card.length) {
            $card.after($actions);
        } else {
            frm.$wrapper.find('.form-page').first().prepend($actions);
        }

        // Bind click handlers
        $actions.find('.dc-adjustment-action-btn').on('click', function() {
            const action = $(this).data('action');
            frm.trigger(action);
        });
    },

    approve_adjustment: function(frm) {
        frappe.confirm(
            __('Are you sure you want to approve this VAT Adjustment?'),
            function() {
                frappe.call({
                    method: 'digicomply.digicomply.doctype.vat_adjustment.vat_adjustment.approve_adjustment',
                    args: {
                        docname: frm.doc.name
                    },
                    freeze: true,
                    freeze_message: __('Approving adjustment...'),
                    callback: function(r) {
                        if (r.message && r.message.status === 'success') {
                            frm.reload_doc();
                            frappe.show_alert({
                                message: __('VAT Adjustment approved successfully'),
                                indicator: 'green'
                            });
                        }
                    }
                });
            }
        );
    },

    apply_to_vat_return: function(frm) {
        // Show dialog to select VAT Return
        const d = new frappe.ui.Dialog({
            title: __('Apply to VAT Return'),
            fields: [
                {
                    label: __('VAT Return'),
                    fieldname: 'vat_return',
                    fieldtype: 'Link',
                    options: 'VAT Return',
                    reqd: 1,
                    get_query: function() {
                        return {
                            filters: {
                                company: frm.doc.company,
                                status: ['not in', ['Filed', 'Acknowledged']]
                            }
                        };
                    },
                    description: __('Select a VAT Return that is not yet filed')
                }
            ],
            primary_action_label: __('Apply'),
            primary_action: function(values) {
                frappe.call({
                    method: 'digicomply.digicomply.doctype.vat_adjustment.vat_adjustment.apply_to_vat_return',
                    args: {
                        docname: frm.doc.name,
                        vat_return: values.vat_return
                    },
                    freeze: true,
                    freeze_message: __('Applying adjustment to VAT Return...'),
                    callback: function(r) {
                        if (r.message && r.message.status === 'success') {
                            d.hide();
                            frm.reload_doc();
                            frappe.show_alert({
                                message: __('VAT Adjustment applied to {0}', [values.vat_return]),
                                indicator: 'green'
                            });
                        }
                    }
                });
            }
        });
        d.show();
    },

    cancel_adjustment: function(frm) {
        frappe.confirm(
            __('Are you sure you want to cancel this VAT Adjustment?'),
            function() {
                frappe.call({
                    method: 'digicomply.digicomply.doctype.vat_adjustment.vat_adjustment.cancel_adjustment',
                    args: {
                        docname: frm.doc.name
                    },
                    freeze: true,
                    freeze_message: __('Cancelling adjustment...'),
                    callback: function(r) {
                        if (r.message && r.message.status === 'success') {
                            frm.reload_doc();
                            frappe.show_alert({
                                message: __('VAT Adjustment cancelled'),
                                indicator: 'orange'
                            });
                        }
                    }
                });
            }
        );
    },

    base_amount: function(frm) {
        frm.trigger('calculate_vat_amount');
    },

    vat_rate: function(frm) {
        frm.trigger('calculate_vat_amount');
    },

    calculate_vat_amount: function(frm) {
        // Calculate VAT amount from base amount and rate
        const baseAmount = flt(frm.doc.base_amount) || 0;
        const vatRate = flt(frm.doc.vat_rate) || 5;

        if (baseAmount) {
            const vatAmount = flt(baseAmount * (vatRate / 100), 2);
            frm.set_value('vat_amount', vatAmount);
        }
    }
});
