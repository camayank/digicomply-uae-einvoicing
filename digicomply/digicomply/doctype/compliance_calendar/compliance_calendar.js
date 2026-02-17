// Copyright (c) 2024, DigiComply and contributors
// License: MIT

frappe.ui.form.on('Compliance Calendar', {
    refresh: function(frm) {
        // Add custom styles
        frm.trigger('add_custom_styles');

        // Add deadline countdown card
        frm.trigger('add_deadline_card');

        // Add status indicator
        frm.trigger('add_status_indicator');

        // Add action buttons based on status
        frm.trigger('add_action_buttons');

        // Add generate calendar button for new forms
        if (frm.is_new()) {
            frm.trigger('add_generate_button');
        }
    },

    add_custom_styles: function(frm) {
        if ($('#dc-compliance-calendar-styles').length) return;

        $('head').append(`
            <style id="dc-compliance-calendar-styles">
                /* Deadline Card */
                .dc-deadline-card {
                    background: linear-gradient(135deg, #a404e4 0%, #8501b9 100%);
                    border-radius: 16px;
                    padding: 24px;
                    margin-bottom: 24px;
                    color: white;
                    box-shadow: 0 4px 14px rgba(164, 4, 228, 0.25);
                    font-family: 'Poppins', var(--font-stack);
                }

                .dc-deadline-card.overdue {
                    background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
                    box-shadow: 0 4px 14px rgba(220, 38, 38, 0.25);
                }

                .dc-deadline-card.due-soon {
                    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                    box-shadow: 0 4px 14px rgba(245, 158, 11, 0.25);
                }

                .dc-deadline-card.filed {
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    box-shadow: 0 4px 14px rgba(16, 185, 129, 0.25);
                }

                .dc-deadline-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 20px;
                }

                .dc-deadline-title {
                    font-size: 1.125rem;
                    font-weight: 600;
                    opacity: 0.9;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .dc-deadline-period {
                    font-size: 0.875rem;
                    opacity: 0.8;
                    margin-top: 4px;
                }

                .dc-deadline-status-badge {
                    padding: 6px 14px;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    background: rgba(255,255,255,0.2);
                }

                .dc-deadline-countdown {
                    text-align: center;
                    padding: 20px 0;
                    border-top: 1px solid rgba(255,255,255,0.2);
                    border-bottom: 1px solid rgba(255,255,255,0.2);
                }

                .dc-deadline-countdown-label {
                    font-size: 0.875rem;
                    opacity: 0.85;
                    margin-bottom: 8px;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .dc-deadline-countdown-value {
                    font-size: 3rem;
                    font-weight: 700;
                    line-height: 1.2;
                }

                .dc-deadline-countdown-unit {
                    font-size: 1rem;
                    opacity: 0.9;
                    margin-top: 4px;
                }

                .dc-deadline-info {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 16px;
                    margin-top: 20px;
                }

                .dc-deadline-info-item {
                    background: rgba(255,255,255,0.1);
                    border-radius: 12px;
                    padding: 16px;
                    text-align: center;
                    transition: all 0.2s ease;
                }

                .dc-deadline-info-item:hover {
                    background: rgba(255,255,255,0.15);
                    transform: translateY(-2px);
                }

                .dc-deadline-info-label {
                    font-size: 0.75rem;
                    opacity: 0.8;
                    text-transform: uppercase;
                    letter-spacing: 0.03em;
                    margin-bottom: 6px;
                }

                .dc-deadline-info-value {
                    font-size: 1rem;
                    font-weight: 600;
                }

                /* Penalty Alert */
                .dc-penalty-alert {
                    background: #fef2f2;
                    border: 1px solid #fecaca;
                    border-radius: 12px;
                    padding: 16px;
                    margin-top: 20px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .dc-penalty-alert-icon {
                    width: 40px;
                    height: 40px;
                    background: #fee2e2;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #dc2626;
                }

                .dc-penalty-alert-content {
                    flex: 1;
                }

                .dc-penalty-alert-title {
                    font-weight: 600;
                    color: #991b1b;
                    margin-bottom: 4px;
                }

                .dc-penalty-alert-amount {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #dc2626;
                }

                /* Status Progress Bar */
                .dc-status-progress {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: #f8fafc;
                    border-radius: 12px;
                    padding: 16px 24px;
                    margin-bottom: 20px;
                    position: relative;
                }

                .dc-status-progress::before {
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
                    font-size: 12px;
                    font-weight: 600;
                    color: #9ca3af;
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

                .dc-status-dot.overdue {
                    background: #dc2626;
                    color: white;
                    box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.2);
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
                .dc-calendar-actions {
                    display: flex;
                    gap: 12px;
                    margin-bottom: 20px;
                }

                .dc-calendar-action-btn {
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

                .dc-calendar-action-btn.primary {
                    background: linear-gradient(135deg, #a404e4 0%, #8501b9 100%);
                    color: white;
                    box-shadow: 0 2px 8px rgba(164, 4, 228, 0.3);
                }

                .dc-calendar-action-btn.primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(164, 4, 228, 0.4);
                }

                .dc-calendar-action-btn.success {
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    color: white;
                    box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
                }

                .dc-calendar-action-btn.success:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
                }

                .dc-calendar-action-btn.secondary {
                    background: white;
                    color: #a404e4;
                    border: 2px solid #a404e4;
                }

                .dc-calendar-action-btn.secondary:hover {
                    background: #f8f5ff;
                }

                .dc-calendar-action-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    transform: none !important;
                }

                /* Reminder Status */
                .dc-reminder-status {
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                    margin-top: 16px;
                }

                .dc-reminder-badge {
                    padding: 4px 10px;
                    border-radius: 12px;
                    font-size: 0.75rem;
                    font-weight: 500;
                }

                .dc-reminder-badge.sent {
                    background: #dcfce7;
                    color: #166534;
                }

                .dc-reminder-badge.pending {
                    background: #f3f4f6;
                    color: #6b7280;
                }

                /* Mobile responsive */
                @media (max-width: 768px) {
                    .dc-deadline-info {
                        grid-template-columns: 1fr;
                    }

                    .dc-status-progress {
                        flex-wrap: wrap;
                        gap: 16px;
                    }

                    .dc-status-progress::before {
                        display: none;
                    }

                    .dc-calendar-actions {
                        flex-direction: column;
                    }
                }
            </style>
        `);
    },

    add_deadline_card: function(frm) {
        // Remove existing card
        frm.$wrapper.find('.dc-deadline-card').remove();

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
            return format_currency(num, 'AED');
        };

        // Calculate days until due
        const today = frappe.datetime.get_today();
        const dueDate = frm.doc.due_date;
        const daysUntilDue = frappe.datetime.get_diff(dueDate, today);

        // Determine card class based on status
        let cardClass = '';
        let countdownLabel = 'Days Until Due';
        let countdownValue = Math.abs(daysUntilDue);
        let countdownUnit = daysUntilDue === 1 || daysUntilDue === -1 ? 'Day' : 'Days';

        const status = frm.doc.status || 'Upcoming';
        if (status === 'Overdue') {
            cardClass = 'overdue';
            countdownLabel = 'Days Overdue';
        } else if (status === 'Due Soon') {
            cardClass = 'due-soon';
        } else if (status === 'Filed' || status === 'Acknowledged') {
            cardClass = 'filed';
            countdownLabel = status === 'Acknowledged' ? 'Acknowledged' : 'Filed';
            countdownValue = '';
            countdownUnit = '';
        }

        // Format dates
        const periodStart = frm.doc.tax_period_start ? frappe.datetime.str_to_user(frm.doc.tax_period_start) : '';
        const periodEnd = frm.doc.tax_period_end ? frappe.datetime.str_to_user(frm.doc.tax_period_end) : '';
        const dueDateFormatted = frm.doc.due_date ? frappe.datetime.str_to_user(frm.doc.due_date) : '';

        // Build penalty alert HTML if applicable
        let penaltyHtml = '';
        if (frm.doc.penalty_amount > 0) {
            penaltyHtml = `
                <div class="dc-penalty-alert">
                    <div class="dc-penalty-alert-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                            <line x1="12" y1="9" x2="12" y2="13"/>
                            <line x1="12" y1="17" x2="12.01" y2="17"/>
                        </svg>
                    </div>
                    <div class="dc-penalty-alert-content">
                        <div class="dc-penalty-alert-title">Late Filing Penalty</div>
                        <div class="dc-penalty-alert-amount">${formatCurrency(frm.doc.penalty_amount)}</div>
                    </div>
                </div>
            `;
        }

        // Build reminder badges
        let reminderHtml = '<div class="dc-reminder-status">';
        const reminders = [
            { field: 'reminder_14_days', label: '14 Days' },
            { field: 'reminder_7_days', label: '7 Days' },
            { field: 'reminder_3_days', label: '3 Days' },
            { field: 'reminder_1_day', label: '1 Day' }
        ];
        reminders.forEach(r => {
            const sent = frm.doc[r.field] ? 'sent' : 'pending';
            const icon = frm.doc[r.field] ? '&#10003;' : '&#8226;';
            reminderHtml += `<span class="dc-reminder-badge ${sent}">${icon} ${escapeHtml(r.label)}</span>`;
        });
        reminderHtml += '</div>';

        const $card = $(`
            <div class="dc-deadline-card ${cardClass}">
                <div class="dc-deadline-header">
                    <div>
                        <div class="dc-deadline-title">${escapeHtml(frm.doc.filing_type || 'VAT Return')}</div>
                        <div class="dc-deadline-period">${escapeHtml(frm.doc.company)}</div>
                    </div>
                    <div class="dc-deadline-status-badge">${escapeHtml(status)}</div>
                </div>
                <div class="dc-deadline-countdown">
                    <div class="dc-deadline-countdown-label">${escapeHtml(countdownLabel)}</div>
                    <div class="dc-deadline-countdown-value">${countdownValue}</div>
                    <div class="dc-deadline-countdown-unit">${escapeHtml(countdownUnit)}</div>
                </div>
                <div class="dc-deadline-info">
                    <div class="dc-deadline-info-item">
                        <div class="dc-deadline-info-label">Tax Period</div>
                        <div class="dc-deadline-info-value">${escapeHtml(periodStart)} - ${escapeHtml(periodEnd)}</div>
                    </div>
                    <div class="dc-deadline-info-item">
                        <div class="dc-deadline-info-label">Due Date</div>
                        <div class="dc-deadline-info-value">${escapeHtml(dueDateFormatted)}</div>
                    </div>
                    <div class="dc-deadline-info-item">
                        <div class="dc-deadline-info-label">VAT Return</div>
                        <div class="dc-deadline-info-value">${frm.doc.vat_return ? escapeHtml(frm.doc.vat_return) : 'Not Linked'}</div>
                    </div>
                </div>
                ${penaltyHtml}
                ${reminderHtml}
            </div>
        `);

        // Insert after form header
        frm.$wrapper.find('.form-page').first().prepend($card);
    },

    add_status_indicator: function(frm) {
        // Remove existing indicator
        frm.$wrapper.find('.dc-status-progress').remove();

        // Only show for saved documents
        if (frm.is_new()) return;

        const statuses = ['Upcoming', 'Due Soon', 'Filed', 'Acknowledged'];
        const currentStatus = frm.doc.status || 'Upcoming';
        let currentIndex = statuses.indexOf(currentStatus);

        // Handle Overdue specially
        const isOverdue = currentStatus === 'Overdue';
        if (isOverdue) {
            currentIndex = 1; // Show as between Due Soon and Filed
        }

        // Escape helper function for security
        const escapeHtml = (text) => {
            const div = document.createElement('div');
            div.textContent = text || '';
            return div.innerHTML;
        };

        let stepsHtml = '';
        statuses.forEach((status, index) => {
            let stepClass = '';
            let dotClass = '';
            let dotContent = index + 1;

            if (isOverdue && index === 1) {
                stepClass = 'current';
                dotClass = 'overdue';
                dotContent = '!';
            } else if (index < currentIndex) {
                stepClass = 'completed';
                dotContent = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>';
            } else if (index === currentIndex) {
                stepClass = 'current';
                dotClass = 'current';
            }

            stepsHtml += `
                <div class="dc-status-step ${stepClass}">
                    <div class="dc-status-dot ${dotClass}">${dotContent}</div>
                    <div class="dc-status-label">${escapeHtml(status)}</div>
                </div>
            `;
        });

        const $indicator = $(`
            <div class="dc-status-progress">
                ${stepsHtml}
            </div>
        `);

        // Insert after deadline card
        const $card = frm.$wrapper.find('.dc-deadline-card');
        if ($card.length) {
            $card.after($indicator);
        } else {
            frm.$wrapper.find('.form-page').first().prepend($indicator);
        }
    },

    add_action_buttons: function(frm) {
        // Remove existing action buttons container
        frm.$wrapper.find('.dc-calendar-actions').remove();

        // Only show for saved documents
        if (frm.is_new()) return;

        const status = frm.doc.status || 'Upcoming';
        let buttons = [];

        // Escape helper function for security
        const escapeHtml = (text) => {
            const div = document.createElement('div');
            div.textContent = text || '';
            return div.innerHTML;
        };

        // Create VAT Return button (if not already linked)
        if (!frm.doc.vat_return && ['Upcoming', 'Due Soon', 'Overdue'].includes(status)) {
            buttons.push({
                label: 'Create VAT Return',
                icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>',
                class: 'primary',
                action: 'create_vat_return'
            });
        }

        // Mark as Filed button
        if (['Upcoming', 'Due Soon', 'Overdue'].includes(status)) {
            buttons.push({
                label: 'Mark as Filed',
                icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
                class: 'success',
                action: 'mark_as_filed'
            });
        }

        // Acknowledge button
        if (status === 'Filed') {
            buttons.push({
                label: 'Acknowledge',
                icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
                class: 'success',
                action: 'mark_as_acknowledged'
            });
        }

        if (buttons.length === 0) return;

        let buttonsHtml = buttons.map(btn => `
            <button class="dc-calendar-action-btn ${btn.class}" data-action="${escapeHtml(btn.action)}">
                ${btn.icon}
                ${escapeHtml(btn.label)}
            </button>
        `).join('');

        const $actions = $(`<div class="dc-calendar-actions">${buttonsHtml}</div>`);

        // Insert after status indicator
        const $indicator = frm.$wrapper.find('.dc-status-progress');
        if ($indicator.length) {
            $indicator.after($actions);
        } else {
            const $card = frm.$wrapper.find('.dc-deadline-card');
            if ($card.length) {
                $card.after($actions);
            }
        }

        // Bind click handlers
        $actions.find('.dc-calendar-action-btn').on('click', function() {
            const action = $(this).data('action');
            frm.trigger(action);
        });
    },

    add_generate_button: function(frm) {
        frm.add_custom_button(__('Generate Calendar for Year'), function() {
            frm.trigger('generate_calendar_dialog');
        });
    },

    generate_calendar_dialog: function(frm) {
        const currentYear = new Date().getFullYear();

        const d = new frappe.ui.Dialog({
            title: __('Generate Compliance Calendar'),
            fields: [
                {
                    label: __('Year'),
                    fieldname: 'year',
                    fieldtype: 'Int',
                    default: currentYear,
                    reqd: 1
                },
                {
                    label: __('Company'),
                    fieldname: 'company',
                    fieldtype: 'Link',
                    options: 'Company',
                    description: __('Leave empty to generate for all companies')
                }
            ],
            primary_action_label: __('Generate'),
            primary_action(values) {
                frappe.call({
                    method: 'digicomply.digicomply.doctype.compliance_calendar.compliance_calendar.generate_calendar_entries',
                    args: {
                        year: values.year,
                        company: values.company
                    },
                    freeze: true,
                    freeze_message: __('Generating calendar entries...'),
                    callback: function(r) {
                        if (r.message && r.message.status === 'success') {
                            frappe.show_alert({
                                message: r.message.message,
                                indicator: 'green'
                            });
                            d.hide();
                            frappe.set_route('List', 'Compliance Calendar');
                        }
                    }
                });
            }
        });

        d.show();
    },

    create_vat_return: function(frm) {
        frappe.new_doc('VAT Return', {
            company: frm.doc.company,
            from_date: frm.doc.tax_period_start,
            to_date: frm.doc.tax_period_end,
            tax_period: frm.doc.filing_type === 'VAT Return Monthly' ? 'Monthly' : 'Quarterly'
        });
    },

    mark_as_filed: function(frm) {
        frappe.prompt([
            {
                label: __('VAT Return'),
                fieldname: 'vat_return',
                fieldtype: 'Link',
                options: 'VAT Return',
                default: frm.doc.vat_return,
                description: __('Link to the filed VAT Return (optional)')
            }
        ],
        function(values) {
            frappe.call({
                method: 'mark_as_filed',
                doc: frm.doc,
                args: {
                    vat_return: values.vat_return
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
        __('Mark as Filed'),
        __('Mark as Filed'));
    },

    mark_as_acknowledged: function(frm) {
        frappe.prompt([
            {
                label: __('FTA Reference'),
                fieldname: 'fta_reference',
                fieldtype: 'Data',
                description: __('FTA acknowledgment reference number')
            }
        ],
        function(values) {
            frappe.call({
                method: 'mark_as_acknowledged',
                doc: frm.doc,
                args: {
                    fta_reference: values.fta_reference
                },
                freeze: true,
                freeze_message: __('Acknowledging...'),
                callback: function(r) {
                    if (r.message && r.message.status === 'success') {
                        frm.reload_doc();
                    }
                }
            });
        },
        __('Acknowledge Filing'),
        __('Acknowledge'));
    },

    tax_period_end: function(frm) {
        // Auto-calculate due date when period end changes
        if (frm.doc.tax_period_end) {
            const periodEnd = frappe.datetime.str_to_obj(frm.doc.tax_period_end);
            const nextMonth = frappe.datetime.add_months(frm.doc.tax_period_end, 1);
            const nextMonthDate = frappe.datetime.str_to_obj(nextMonth);
            const dueDate = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}-28`;
            frm.set_value('due_date', dueDate);
        }
    }
});
