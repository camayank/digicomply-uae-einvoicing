// Copyright (c) 2024, DigiComply and contributors
// License: MIT

frappe.ui.form.on('Filing Status', {
    refresh: function(frm) {
        // Add custom styles
        frm.trigger('add_custom_styles');

        // Add status card
        frm.trigger('add_status_card');

        // Add timeline view
        frm.trigger('add_timeline_view');

        // Add action buttons
        frm.trigger('add_action_buttons');
    },

    add_custom_styles: function(frm) {
        if ($('#dc-filing-status-styles').length) return;

        $('head').append(`
            <style id="dc-filing-status-styles">
                /* Status Card */
                .dc-filing-status-card {
                    background: linear-gradient(135deg, #a404e4 0%, #8501b9 100%);
                    border-radius: 16px;
                    padding: 24px;
                    margin-bottom: 24px;
                    color: white;
                    box-shadow: 0 4px 14px rgba(164, 4, 228, 0.25);
                    font-family: 'Poppins', var(--font-stack);
                }

                .dc-filing-status-card.draft {
                    background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
                    box-shadow: 0 4px 14px rgba(107, 114, 128, 0.25);
                }

                .dc-filing-status-card.prepared {
                    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                    box-shadow: 0 4px 14px rgba(59, 130, 246, 0.25);
                }

                .dc-filing-status-card.filed {
                    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                    box-shadow: 0 4px 14px rgba(245, 158, 11, 0.25);
                }

                .dc-filing-status-card.acknowledged {
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    box-shadow: 0 4px 14px rgba(16, 185, 129, 0.25);
                }

                .dc-filing-status-card.rejected {
                    background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
                    box-shadow: 0 4px 14px rgba(220, 38, 38, 0.25);
                }

                .dc-filing-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 20px;
                }

                .dc-filing-title {
                    font-size: 1.125rem;
                    font-weight: 600;
                    opacity: 0.9;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .dc-filing-subtitle {
                    font-size: 0.875rem;
                    opacity: 0.8;
                    margin-top: 4px;
                }

                .dc-filing-status-badge {
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-size: 0.875rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    background: rgba(255,255,255,0.2);
                }

                .dc-filing-main {
                    text-align: center;
                    padding: 20px 0;
                    border-top: 1px solid rgba(255,255,255,0.2);
                    border-bottom: 1px solid rgba(255,255,255,0.2);
                }

                .dc-filing-status-icon {
                    width: 64px;
                    height: 64px;
                    margin: 0 auto 16px;
                    background: rgba(255,255,255,0.2);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .dc-filing-status-icon svg {
                    width: 32px;
                    height: 32px;
                }

                .dc-filing-status-text {
                    font-size: 1.5rem;
                    font-weight: 700;
                }

                .dc-filing-status-date {
                    font-size: 0.875rem;
                    opacity: 0.85;
                    margin-top: 8px;
                }

                .dc-filing-info {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 16px;
                    margin-top: 20px;
                }

                .dc-filing-info-item {
                    background: rgba(255,255,255,0.1);
                    border-radius: 12px;
                    padding: 16px;
                    text-align: center;
                    transition: all 0.2s ease;
                }

                .dc-filing-info-item:hover {
                    background: rgba(255,255,255,0.15);
                    transform: translateY(-2px);
                }

                .dc-filing-info-label {
                    font-size: 0.75rem;
                    opacity: 0.8;
                    text-transform: uppercase;
                    letter-spacing: 0.03em;
                    margin-bottom: 6px;
                }

                .dc-filing-info-value {
                    font-size: 1rem;
                    font-weight: 600;
                }

                /* Timeline View */
                .dc-timeline-container {
                    background: #f8fafc;
                    border-radius: 12px;
                    padding: 24px;
                    margin-bottom: 24px;
                }

                .dc-timeline-title {
                    font-size: 1rem;
                    font-weight: 600;
                    color: #374151;
                    margin-bottom: 20px;
                }

                .dc-timeline {
                    position: relative;
                    padding-left: 32px;
                }

                .dc-timeline::before {
                    content: '';
                    position: absolute;
                    left: 11px;
                    top: 0;
                    bottom: 0;
                    width: 2px;
                    background: #e5e7eb;
                }

                .dc-timeline-item {
                    position: relative;
                    padding-bottom: 24px;
                }

                .dc-timeline-item:last-child {
                    padding-bottom: 0;
                }

                .dc-timeline-dot {
                    position: absolute;
                    left: -32px;
                    top: 0;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    background: #e5e7eb;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1;
                }

                .dc-timeline-dot.draft { background: #6b7280; color: white; }
                .dc-timeline-dot.prepared { background: #3b82f6; color: white; }
                .dc-timeline-dot.filed { background: #f59e0b; color: white; }
                .dc-timeline-dot.acknowledged { background: #10b981; color: white; }
                .dc-timeline-dot.rejected { background: #dc2626; color: white; }

                .dc-timeline-dot svg {
                    width: 12px;
                    height: 12px;
                }

                .dc-timeline-content {
                    background: white;
                    border-radius: 8px;
                    padding: 16px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }

                .dc-timeline-status {
                    font-weight: 600;
                    color: #374151;
                    margin-bottom: 4px;
                }

                .dc-timeline-date {
                    font-size: 0.75rem;
                    color: #6b7280;
                }

                .dc-timeline-details {
                    margin-top: 8px;
                    font-size: 0.875rem;
                    color: #4b5563;
                }

                /* Action Buttons */
                .dc-filing-actions {
                    display: flex;
                    gap: 12px;
                    margin-bottom: 20px;
                }

                .dc-filing-action-btn {
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

                .dc-filing-action-btn.primary {
                    background: linear-gradient(135deg, #a404e4 0%, #8501b9 100%);
                    color: white;
                    box-shadow: 0 2px 8px rgba(164, 4, 228, 0.3);
                }

                .dc-filing-action-btn.primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(164, 4, 228, 0.4);
                }

                .dc-filing-action-btn.success {
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    color: white;
                    box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
                }

                .dc-filing-action-btn.success:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
                }

                .dc-filing-action-btn.warning {
                    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                    color: white;
                    box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
                }

                .dc-filing-action-btn.warning:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
                }

                .dc-filing-action-btn.danger {
                    background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
                    color: white;
                    box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);
                }

                .dc-filing-action-btn.danger:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);
                }

                .dc-filing-action-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    transform: none !important;
                }

                /* Rejection Alert */
                .dc-rejection-alert {
                    background: #fef2f2;
                    border: 1px solid #fecaca;
                    border-radius: 12px;
                    padding: 16px;
                    margin-top: 16px;
                }

                .dc-rejection-alert-title {
                    font-weight: 600;
                    color: #991b1b;
                    margin-bottom: 8px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .dc-rejection-alert-content {
                    color: #7f1d1d;
                    font-size: 0.875rem;
                }

                /* Mobile responsive */
                @media (max-width: 768px) {
                    .dc-filing-info {
                        grid-template-columns: 1fr;
                    }

                    .dc-filing-actions {
                        flex-direction: column;
                    }
                }
            </style>
        `);
    },

    add_status_card: function(frm) {
        // Remove existing card
        frm.$wrapper.find('.dc-filing-status-card').remove();

        // Only show for saved documents
        if (frm.is_new()) return;

        // Escape helper function for security
        const escapeHtml = (text) => {
            const div = document.createElement('div');
            div.textContent = text || '';
            return div.innerHTML;
        };

        // Determine card class based on status
        const status = frm.doc.status || 'Draft';
        const statusClass = status.toLowerCase().replace(' ', '-');

        // Status icons
        const statusIcons = {
            'Draft': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
            'Prepared': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
            'Filed': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2Z"/></svg>',
            'Acknowledged': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
            'Rejected': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>'
        };

        // Format date
        const statusDate = frm.doc.status_date ? frappe.datetime.str_to_user(frm.doc.status_date) : '-';

        // Build info items
        let infoHtml = '';
        if (frm.doc.fta_reference) {
            infoHtml += `
                <div class="dc-filing-info-item">
                    <div class="dc-filing-info-label">FTA Reference</div>
                    <div class="dc-filing-info-value">${escapeHtml(frm.doc.fta_reference)}</div>
                </div>
            `;
        }
        if (frm.doc.filed_by) {
            infoHtml += `
                <div class="dc-filing-info-item">
                    <div class="dc-filing-info-label">Filed By</div>
                    <div class="dc-filing-info-value">${escapeHtml(frm.doc.filed_by)}</div>
                </div>
            `;
        }
        if (frm.doc.acknowledged_date) {
            infoHtml += `
                <div class="dc-filing-info-item">
                    <div class="dc-filing-info-label">Acknowledged Date</div>
                    <div class="dc-filing-info-value">${escapeHtml(frappe.datetime.str_to_user(frm.doc.acknowledged_date))}</div>
                </div>
            `;
        }

        // Build rejection alert if applicable
        let rejectionHtml = '';
        if (status === 'Rejected' && frm.doc.rejection_reason) {
            rejectionHtml = `
                <div class="dc-rejection-alert">
                    <div class="dc-rejection-alert-title">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="12" y1="8" x2="12" y2="12"/>
                            <line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                        Rejection Reason
                    </div>
                    <div class="dc-rejection-alert-content">${escapeHtml(frm.doc.rejection_reason)}</div>
                </div>
            `;
        }

        const $card = $(`
            <div class="dc-filing-status-card ${statusClass}">
                <div class="dc-filing-header">
                    <div>
                        <div class="dc-filing-title">Filing Status</div>
                        <div class="dc-filing-subtitle">${escapeHtml(frm.doc.compliance_calendar)}</div>
                    </div>
                    <div class="dc-filing-status-badge">${escapeHtml(status)}</div>
                </div>
                <div class="dc-filing-main">
                    <div class="dc-filing-status-icon">
                        ${statusIcons[status] || statusIcons['Draft']}
                    </div>
                    <div class="dc-filing-status-text">${escapeHtml(status)}</div>
                    <div class="dc-filing-status-date">Updated: ${escapeHtml(statusDate)}</div>
                </div>
                ${infoHtml ? `<div class="dc-filing-info">${infoHtml}</div>` : ''}
                ${rejectionHtml}
            </div>
        `);

        // Insert after form header
        frm.$wrapper.find('.form-page').first().prepend($card);
    },

    add_timeline_view: function(frm) {
        // Remove existing timeline
        frm.$wrapper.find('.dc-timeline-container').remove();

        // Only show for saved documents
        if (frm.is_new()) return;

        // Escape helper function for security
        const escapeHtml = (text) => {
            const div = document.createElement('div');
            div.textContent = text || '';
            return div.innerHTML;
        };

        // Fetch filing history
        frappe.call({
            method: 'digicomply.digicomply.doctype.filing_status.filing_status.get_filing_history',
            args: {
                compliance_calendar: frm.doc.compliance_calendar
            },
            async: false,
            callback: function(r) {
                if (!r.message || r.message.length === 0) return;

                const history = r.message;
                let timelineHtml = '';

                history.forEach((item, index) => {
                    const statusClass = item.status.toLowerCase().replace(' ', '-');
                    const date = item.status_date ? frappe.datetime.str_to_user(item.status_date) : '-';

                    let detailsHtml = '';
                    if (item.fta_reference) {
                        detailsHtml += `<div>FTA Ref: ${escapeHtml(item.fta_reference)}</div>`;
                    }
                    if (item.filed_by) {
                        detailsHtml += `<div>Filed by: ${escapeHtml(item.filed_by)}</div>`;
                    }
                    if (item.rejection_reason) {
                        detailsHtml += `<div style="color: #dc2626;">Reason: ${escapeHtml(item.rejection_reason)}</div>`;
                    }

                    const checkIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>';

                    timelineHtml += `
                        <div class="dc-timeline-item">
                            <div class="dc-timeline-dot ${statusClass}">${checkIcon}</div>
                            <div class="dc-timeline-content">
                                <div class="dc-timeline-status">${escapeHtml(item.status)}</div>
                                <div class="dc-timeline-date">${escapeHtml(date)}</div>
                                ${detailsHtml ? `<div class="dc-timeline-details">${detailsHtml}</div>` : ''}
                            </div>
                        </div>
                    `;
                });

                if (timelineHtml) {
                    const $timeline = $(`
                        <div class="dc-timeline-container">
                            <div class="dc-timeline-title">Filing History</div>
                            <div class="dc-timeline">
                                ${timelineHtml}
                            </div>
                        </div>
                    `);

                    // Insert after status card
                    const $card = frm.$wrapper.find('.dc-filing-status-card');
                    if ($card.length) {
                        $card.after($timeline);
                    }
                }
            }
        });
    },

    add_action_buttons: function(frm) {
        // Remove existing action buttons container
        frm.$wrapper.find('.dc-filing-actions').remove();

        // Only show for saved documents
        if (frm.is_new()) return;

        const status = frm.doc.status || 'Draft';
        let buttons = [];

        // Escape helper function for security
        const escapeHtml = (text) => {
            const div = document.createElement('div');
            div.textContent = text || '';
            return div.innerHTML;
        };

        // Define available actions based on status
        if (status === 'Draft') {
            buttons.push({
                label: 'Mark as Prepared',
                icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
                class: 'primary',
                action: 'set_prepared'
            });
        }

        if (status === 'Prepared') {
            buttons.push({
                label: 'Mark as Filed',
                icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2Z"/></svg>',
                class: 'warning',
                action: 'set_filed'
            });
        }

        if (status === 'Filed') {
            buttons.push({
                label: 'Mark as Acknowledged',
                icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
                class: 'success',
                action: 'set_acknowledged'
            });
            buttons.push({
                label: 'Mark as Rejected',
                icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
                class: 'danger',
                action: 'set_rejected'
            });
        }

        if (status === 'Rejected') {
            buttons.push({
                label: 'Resubmit',
                icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>',
                class: 'primary',
                action: 'resubmit'
            });
        }

        if (buttons.length === 0) return;

        let buttonsHtml = buttons.map(btn => `
            <button class="dc-filing-action-btn ${btn.class}" data-action="${escapeHtml(btn.action)}">
                ${btn.icon}
                ${escapeHtml(btn.label)}
            </button>
        `).join('');

        const $actions = $(`<div class="dc-filing-actions">${buttonsHtml}</div>`);

        // Insert after timeline or status card
        const $timeline = frm.$wrapper.find('.dc-timeline-container');
        const $card = frm.$wrapper.find('.dc-filing-status-card');
        if ($timeline.length) {
            $timeline.after($actions);
        } else if ($card.length) {
            $card.after($actions);
        }

        // Bind click handlers
        $actions.find('.dc-filing-action-btn').on('click', function() {
            const action = $(this).data('action');
            frm.trigger(action);
        });
    },

    set_prepared: function(frm) {
        frm.trigger('update_filing_status', 'Prepared');
    },

    set_filed: function(frm) {
        frappe.prompt([
            {
                label: __('FTA Reference'),
                fieldname: 'fta_reference',
                fieldtype: 'Data',
                description: __('FTA transaction reference (optional)')
            }
        ],
        function(values) {
            frappe.call({
                method: 'update_status',
                doc: frm.doc,
                args: {
                    new_status: 'Filed',
                    fta_reference: values.fta_reference
                },
                freeze: true,
                freeze_message: __('Updating status...'),
                callback: function(r) {
                    if (r.message && r.message.status === 'success') {
                        frm.reload_doc();
                    }
                }
            });
        },
        __('Mark as Filed'),
        __('Submit'));
    },

    set_acknowledged: function(frm) {
        frappe.prompt([
            {
                label: __('FTA Reference'),
                fieldname: 'fta_reference',
                fieldtype: 'Data',
                default: frm.doc.fta_reference,
                description: __('FTA acknowledgment reference')
            },
            {
                label: __('FTA Response'),
                fieldname: 'fta_response',
                fieldtype: 'Text',
                description: __('Response message from FTA (optional)')
            }
        ],
        function(values) {
            frappe.call({
                method: 'update_status',
                doc: frm.doc,
                args: {
                    new_status: 'Acknowledged',
                    fta_reference: values.fta_reference,
                    fta_response: values.fta_response
                },
                freeze: true,
                freeze_message: __('Updating status...'),
                callback: function(r) {
                    if (r.message && r.message.status === 'success') {
                        frm.reload_doc();
                    }
                }
            });
        },
        __('Mark as Acknowledged'),
        __('Acknowledge'));
    },

    set_rejected: function(frm) {
        frappe.prompt([
            {
                label: __('Rejection Reason'),
                fieldname: 'rejection_reason',
                fieldtype: 'Text',
                reqd: 1,
                description: __('Reason for rejection from FTA')
            },
            {
                label: __('FTA Response'),
                fieldname: 'fta_response',
                fieldtype: 'Text',
                description: __('Full response message from FTA (optional)')
            }
        ],
        function(values) {
            frappe.call({
                method: 'update_status',
                doc: frm.doc,
                args: {
                    new_status: 'Rejected',
                    rejection_reason: values.rejection_reason,
                    fta_response: values.fta_response
                },
                freeze: true,
                freeze_message: __('Updating status...'),
                callback: function(r) {
                    if (r.message && r.message.status === 'success') {
                        frm.reload_doc();
                    }
                }
            });
        },
        __('Mark as Rejected'),
        __('Reject'));
    },

    resubmit: function(frm) {
        frappe.confirm(
            __('This will change the status back to Prepared for resubmission. Continue?'),
            function() {
                frappe.call({
                    method: 'update_status',
                    doc: frm.doc,
                    args: {
                        new_status: 'Prepared'
                    },
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

    update_filing_status: function(frm, new_status) {
        frappe.call({
            method: 'update_status',
            doc: frm.doc,
            args: {
                new_status: new_status
            },
            freeze: true,
            freeze_message: __('Updating status...'),
            callback: function(r) {
                if (r.message && r.message.status === 'success') {
                    frm.reload_doc();
                }
            }
        });
    }
});
