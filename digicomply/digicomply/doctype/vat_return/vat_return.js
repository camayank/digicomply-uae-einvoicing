// Copyright (c) 2024, DigiComply and contributors
// License: MIT

frappe.ui.form.on('VAT Return', {
    refresh: function(frm) {
        // Add custom styles
        frm.trigger('add_custom_styles');

        // Add visual VAT summary card
        frm.trigger('add_vat_summary_card');

        // Add status indicator
        frm.trigger('add_status_indicator');

        // Add action buttons based on status
        frm.trigger('add_action_buttons');
    },

    add_custom_styles: function(frm) {
        if ($('#dc-vat-return-styles').length) return;

        $('head').append(`
            <style id="dc-vat-return-styles">
                /* VAT Summary Card */
                .dc-vat-summary-card {
                    background: linear-gradient(135deg, #a404e4 0%, #8501b9 100%);
                    border-radius: 16px;
                    padding: 24px;
                    margin-bottom: 24px;
                    color: white;
                    box-shadow: 0 4px 14px rgba(164, 4, 228, 0.25);
                    font-family: 'Poppins', var(--font-stack);
                }

                .dc-vat-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 20px;
                }

                .dc-vat-title {
                    font-size: 1.125rem;
                    font-weight: 600;
                    opacity: 0.9;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .dc-vat-period {
                    font-size: 0.875rem;
                    opacity: 0.8;
                    margin-top: 4px;
                }

                .dc-vat-status-badge {
                    padding: 6px 14px;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .dc-vat-status-badge.draft { background: rgba(255,255,255,0.2); }
                .dc-vat-status-badge.prepared { background: #3b82f6; }
                .dc-vat-status-badge.under-review { background: #f59e0b; }
                .dc-vat-status-badge.filed { background: #10b981; }
                .dc-vat-status-badge.acknowledged { background: #059669; }

                .dc-vat-main-amount {
                    text-align: center;
                    padding: 20px 0;
                    border-top: 1px solid rgba(255,255,255,0.2);
                    border-bottom: 1px solid rgba(255,255,255,0.2);
                }

                .dc-vat-main-label {
                    font-size: 0.875rem;
                    opacity: 0.85;
                    margin-bottom: 8px;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .dc-vat-main-value {
                    font-size: 2.5rem;
                    font-weight: 700;
                    line-height: 1.2;
                }

                .dc-vat-main-value.positive { color: #fcd34d; }
                .dc-vat-main-value.negative { color: #86efac; }
                .dc-vat-main-value.zero { color: white; }

                .dc-vat-indicator {
                    font-size: 0.875rem;
                    margin-top: 6px;
                    opacity: 0.9;
                }

                .dc-vat-breakdown {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 16px;
                    margin-top: 20px;
                }

                .dc-vat-breakdown-item {
                    background: rgba(255,255,255,0.1);
                    border-radius: 12px;
                    padding: 16px;
                    text-align: center;
                    transition: all 0.2s ease;
                }

                .dc-vat-breakdown-item:hover {
                    background: rgba(255,255,255,0.15);
                    transform: translateY(-2px);
                }

                .dc-vat-breakdown-label {
                    font-size: 0.75rem;
                    opacity: 0.8;
                    text-transform: uppercase;
                    letter-spacing: 0.03em;
                    margin-bottom: 6px;
                }

                .dc-vat-breakdown-value {
                    font-size: 1.25rem;
                    font-weight: 600;
                }

                .dc-vat-breakdown-item.output .dc-vat-breakdown-value { color: #fcd34d; }
                .dc-vat-breakdown-item.input .dc-vat-breakdown-value { color: #86efac; }
                .dc-vat-breakdown-item.adjustments .dc-vat-breakdown-value { color: #93c5fd; }

                /* Status Indicator Bar */
                .dc-status-indicator-bar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: #f8fafc;
                    border-radius: 12px;
                    padding: 16px 24px;
                    margin-bottom: 20px;
                    position: relative;
                }

                .dc-status-indicator-bar::before {
                    content: '';
                    position: absolute;
                    top: 50%;
                    left: 60px;
                    right: 60px;
                    height: 3px;
                    background: #e5e7eb;
                    transform: translateY(-50%);
                    z-index: 0;
                }

                .dc-status-step {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    z-index: 1;
                }

                .dc-status-dot {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: #e5e7eb;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 6px;
                    transition: all 0.3s ease;
                }

                .dc-status-dot.completed {
                    background: #10b981;
                    color: white;
                }

                .dc-status-dot.current {
                    background: #a404e4;
                    color: white;
                    box-shadow: 0 0 0 4px rgba(164, 4, 228, 0.2);
                }

                .dc-status-dot svg {
                    width: 16px;
                    height: 16px;
                }

                .dc-status-label {
                    font-size: 0.75rem;
                    font-weight: 500;
                    color: #6b7280;
                }

                .dc-status-step.completed .dc-status-label,
                .dc-status-step.current .dc-status-label {
                    color: #374151;
                    font-weight: 600;
                }

                /* Action Buttons */
                .dc-vat-actions {
                    display: flex;
                    gap: 12px;
                    margin-bottom: 20px;
                }

                .dc-vat-action-btn {
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

                .dc-vat-action-btn.primary {
                    background: linear-gradient(135deg, #a404e4 0%, #8501b9 100%);
                    color: white;
                    box-shadow: 0 2px 8px rgba(164, 4, 228, 0.3);
                }

                .dc-vat-action-btn.primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(164, 4, 228, 0.4);
                }

                .dc-vat-action-btn.secondary {
                    background: white;
                    color: #a404e4;
                    border: 2px solid #a404e4;
                }

                .dc-vat-action-btn.secondary:hover {
                    background: #f8f5ff;
                }

                .dc-vat-action-btn.success {
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    color: white;
                    box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
                }

                .dc-vat-action-btn.success:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
                }

                .dc-vat-action-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    transform: none !important;
                }

                /* Mobile responsive */
                @media (max-width: 768px) {
                    .dc-vat-breakdown {
                        grid-template-columns: 1fr;
                    }

                    .dc-status-indicator-bar {
                        flex-wrap: wrap;
                        gap: 16px;
                    }

                    .dc-status-indicator-bar::before {
                        display: none;
                    }

                    .dc-vat-actions {
                        flex-direction: column;
                    }
                }
            </style>
        `);
    },

    add_vat_summary_card: function(frm) {
        // Remove existing card
        frm.$wrapper.find('.dc-vat-summary-card').remove();

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
        if (status === 'Prepared') statusClass = 'prepared';
        else if (status === 'Under Review') statusClass = 'under-review';
        else if (status === 'Filed') statusClass = 'filed';
        else if (status === 'Acknowledged') statusClass = 'acknowledged';

        // Determine net VAT styling
        const netVat = parseFloat(frm.doc.net_vat_due) || 0;
        let vatClass = 'zero';
        let vatIndicator = 'No VAT Due';
        if (netVat > 0) {
            vatClass = 'positive';
            vatIndicator = 'Payable to FTA';
        } else if (netVat < 0) {
            vatClass = 'negative';
            vatIndicator = 'Refundable from FTA';
        }

        // Format period
        const fromDate = frm.doc.from_date ? frappe.datetime.str_to_user(frm.doc.from_date) : '';
        const toDate = frm.doc.to_date ? frappe.datetime.str_to_user(frm.doc.to_date) : '';

        const $card = $(`
            <div class="dc-vat-summary-card dc-fade-in">
                <div class="dc-vat-header">
                    <div>
                        <div class="dc-vat-title">UAE VAT Return (Form 201)</div>
                        <div class="dc-vat-period">${escapeHtml(fromDate)} - ${escapeHtml(toDate)}</div>
                    </div>
                    <div class="dc-vat-status-badge ${statusClass}">${escapeHtml(status)}</div>
                </div>
                <div class="dc-vat-main-amount">
                    <div class="dc-vat-main-label">Net VAT Due</div>
                    <div class="dc-vat-main-value ${vatClass}">${formatCurrency(Math.abs(netVat))}</div>
                    <div class="dc-vat-indicator">${escapeHtml(vatIndicator)}</div>
                </div>
                <div class="dc-vat-breakdown">
                    <div class="dc-vat-breakdown-item output">
                        <div class="dc-vat-breakdown-label">Output VAT</div>
                        <div class="dc-vat-breakdown-value">${formatCurrency(frm.doc.output_vat_amount)}</div>
                    </div>
                    <div class="dc-vat-breakdown-item input">
                        <div class="dc-vat-breakdown-label">Input VAT Recoverable</div>
                        <div class="dc-vat-breakdown-value">${formatCurrency(frm.doc.input_vat_recoverable)}</div>
                    </div>
                    <div class="dc-vat-breakdown-item adjustments">
                        <div class="dc-vat-breakdown-label">Adjustments</div>
                        <div class="dc-vat-breakdown-value">${formatCurrency(frm.doc.total_adjustments)}</div>
                    </div>
                </div>
            </div>
        `);

        // Insert after form header
        frm.$wrapper.find('.form-page').first().prepend($card);
    },

    add_status_indicator: function(frm) {
        // Remove existing indicator
        frm.$wrapper.find('.dc-status-indicator-bar').remove();

        // Only show for saved documents
        if (frm.is_new()) return;

        const statuses = ['Draft', 'Prepared', 'Under Review', 'Filed', 'Acknowledged'];
        const currentIndex = statuses.indexOf(frm.doc.status || 'Draft');

        // Escape helper function for security
        const escapeHtml = (text) => {
            const div = document.createElement('div');
            div.textContent = text || '';
            return div.innerHTML;
        };

        let stepsHtml = '';
        statuses.forEach((status, index) => {
            let stepClass = '';
            let dotContent = index + 1;

            if (index < currentIndex) {
                stepClass = 'completed';
                dotContent = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>';
            } else if (index === currentIndex) {
                stepClass = 'current';
            }

            stepsHtml += `
                <div class="dc-status-step ${stepClass}">
                    <div class="dc-status-dot ${stepClass}">${dotContent}</div>
                    <div class="dc-status-label">${escapeHtml(status)}</div>
                </div>
            `;
        });

        const $indicator = $(`
            <div class="dc-status-indicator-bar">
                ${stepsHtml}
            </div>
        `);

        // Insert after summary card
        const $card = frm.$wrapper.find('.dc-vat-summary-card');
        if ($card.length) {
            $card.after($indicator);
        } else {
            frm.$wrapper.find('.form-page').first().prepend($indicator);
        }
    },

    add_action_buttons: function(frm) {
        // Remove existing action buttons container
        frm.$wrapper.find('.dc-vat-actions').remove();

        // Only show for saved, non-submitted documents or specific statuses
        if (frm.is_new()) return;

        const status = frm.doc.status || 'Draft';
        const docstatus = frm.doc.docstatus || 0;
        let buttons = [];

        // Generate from Books button (Draft status only)
        if (status === 'Draft' && docstatus === 0) {
            buttons.push({
                label: 'Generate from Books',
                icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
                class: 'primary',
                action: 'generate_from_books'
            });
        }

        // Set Under Review button (Prepared status, after submit)
        if (status === 'Prepared' && docstatus === 1) {
            buttons.push({
                label: 'Set Under Review',
                icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
                class: 'secondary',
                action: 'set_under_review'
            });
        }

        // Mark as Filed button (Under Review status only)
        if (status === 'Under Review') {
            buttons.push({
                label: 'Mark as Filed',
                icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
                class: 'success',
                action: 'mark_as_filed'
            });
        }

        // Acknowledge Filing button (Filed status only)
        if (status === 'Filed') {
            buttons.push({
                label: 'Acknowledge Filing',
                icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
                class: 'success',
                action: 'acknowledge_filing'
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
            <button class="dc-vat-action-btn ${btn.class}" data-action="${escapeHtml(btn.action)}">
                ${btn.icon}
                ${escapeHtml(btn.label)}
            </button>
        `).join('');

        const $actions = $(`<div class="dc-vat-actions">${buttonsHtml}</div>`);

        // Insert after status indicator
        const $indicator = frm.$wrapper.find('.dc-status-indicator-bar');
        if ($indicator.length) {
            $indicator.after($actions);
        } else {
            const $card = frm.$wrapper.find('.dc-vat-summary-card');
            if ($card.length) {
                $card.after($actions);
            }
        }

        // Bind click handlers
        $actions.find('.dc-vat-action-btn').on('click', function() {
            const action = $(this).data('action');
            frm.trigger(action);
        });
    },

    generate_from_books: function(frm) {
        frappe.confirm(
            __('This will fetch all Sales and Purchase Invoices from the selected date range and calculate VAT figures automatically. Existing figures will be overwritten. Continue?'),
            function() {
                frappe.call({
                    method: 'generate_from_books',
                    doc: frm.doc,
                    freeze: true,
                    freeze_message: __('Generating VAT figures from books...'),
                    callback: function(r) {
                        if (r.message && r.message.status === 'success') {
                            frm.reload_doc();
                            frappe.show_alert({
                                message: __('VAT figures generated successfully'),
                                indicator: 'green'
                            });
                        }
                    }
                });
            }
        );
    },

    set_under_review: function(frm) {
        frappe.confirm(
            __('Set this VAT Return for review before filing?'),
            function() {
                frappe.call({
                    method: 'set_under_review',
                    doc: frm.doc,
                    freeze: true,
                    freeze_message: __('Updating status...'),
                    callback: function(r) {
                        if (r.message && r.message.status === 'success') {
                            frm.reload_doc();
                        }
                    }
                });
            }
        );
    },

    mark_as_filed: function(frm) {
        frappe.prompt([
            {
                label: __('FTA Reference Number'),
                fieldname: 'fta_reference',
                fieldtype: 'Data',
                description: __('Enter the reference number received from FTA (optional)')
            }
        ],
        function(values) {
            frappe.call({
                method: 'mark_as_filed',
                doc: frm.doc,
                args: {
                    fta_reference: values.fta_reference
                },
                freeze: true,
                freeze_message: __('Marking as filed...'),
                callback: function(r) {
                    if (r.message && r.message.status === 'success') {
                        frm.reload_doc();
                    }
                }
            });
        },
        __('Mark VAT Return as Filed'),
        __('Mark as Filed'));
    },

    acknowledge_filing: function(frm) {
        frappe.prompt([
            {
                label: __('FTA Reference Number'),
                fieldname: 'fta_reference',
                fieldtype: 'Data',
                default: frm.doc.fta_reference || '',
                description: __('Update the FTA reference number if needed')
            }
        ],
        function(values) {
            frappe.call({
                method: 'acknowledge_filing',
                doc: frm.doc,
                args: {
                    fta_reference: values.fta_reference
                },
                freeze: true,
                freeze_message: __('Acknowledging filing...'),
                callback: function(r) {
                    if (r.message && r.message.status === 'success') {
                        frm.reload_doc();
                    }
                }
            });
        },
        __('Acknowledge VAT Filing'),
        __('Acknowledge'));
    },

    company: function(frm) {
        // Fetch TRN when company changes
        if (frm.doc.company) {
            frappe.db.get_value('Company', frm.doc.company, 'tax_id', function(r) {
                if (r && r.tax_id) {
                    frm.set_value('trn', r.tax_id);
                } else {
                    frm.set_value('trn', '');
                    frappe.msgprint({
                        title: __('Missing TRN'),
                        message: __('The selected company does not have a Tax Registration Number (TRN) configured. Please update the company record.'),
                        indicator: 'orange'
                    });
                }
            });
        }
    },

    total_sales_standard: function(frm) {
        frm.trigger('calculate_totals');
    },

    total_purchases_standard: function(frm) {
        frm.trigger('calculate_totals');
    },

    calculate_totals: function(frm) {
        // UAE VAT rate
        const vatRate = 0.05;

        // Calculate Output VAT
        const outputVat = flt(frm.doc.total_sales_standard || 0) * vatRate;
        frm.set_value('output_vat_amount', flt(outputVat, 2));

        // Calculate Input VAT Recoverable
        const inputVat = flt(frm.doc.total_purchases_standard || 0) * vatRate;
        frm.set_value('input_vat_recoverable', flt(inputVat, 2));

        // Calculate total adjustments
        let totalAdj = 0;
        (frm.doc.adjustments || []).forEach(function(row) {
            totalAdj += flt(row.vat_amount || 0);
        });
        frm.set_value('total_adjustments', flt(totalAdj, 2));

        // Calculate Net VAT Due
        const netVat = outputVat - inputVat + totalAdj;
        frm.set_value('net_vat_due', flt(netVat, 2));
    }
});

// Child table event handlers
frappe.ui.form.on('VAT Return Line', {
    vat_amount: function(frm, cdt, cdn) {
        frm.trigger('calculate_totals');
    },

    adjustments_remove: function(frm, cdt, cdn) {
        frm.trigger('calculate_totals');
    }
});
