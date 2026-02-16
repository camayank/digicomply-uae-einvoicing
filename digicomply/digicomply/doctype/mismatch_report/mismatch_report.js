// Copyright (c) 2024, DigiComply and contributors
// License: MIT

frappe.ui.form.on('Mismatch Report', {
    refresh: function(frm) {
        // Add DigiComply form wrapper class
        frm.$wrapper.find('.form-page').addClass('dc-form-wrapper');

        // Add custom styles
        frm.trigger('add_custom_styles');

        // Show report summary card
        frm.trigger('show_summary_card');

        // Add action buttons
        if (!frm.is_new() && frm.doc.reconciliation_run) {
            frm.add_custom_button(__('View Reconciliation'), function() {
                frappe.set_route('Form', 'Reconciliation Run', frm.doc.reconciliation_run);
            }, __('Actions'));

            frm.add_custom_button(__('Regenerate Report'), function() {
                frm.trigger('regenerate_report');
            }, __('Actions'));
        }
    },

    add_custom_styles: function(frm) {
        if ($('#mismatch-report-styles').length) return;

        $('head').append(`
            <style id="mismatch-report-styles">
                /* DigiComply Form Wrapper */
                .dc-form-wrapper {
                    font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                /* Summary Card */
                .dc-report-card {
                    background: linear-gradient(135deg, #a404e4 0%, #8501b9 100%);
                    border-radius: 16px;
                    padding: 24px;
                    margin-bottom: 24px;
                    color: white;
                    box-shadow: 0 4px 14px rgba(164, 4, 228, 0.25);
                }

                .dc-report-card.score-high {
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    box-shadow: 0 4px 14px rgba(16, 185, 129, 0.25);
                }

                .dc-report-card.score-medium {
                    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                    box-shadow: 0 4px 14px rgba(245, 158, 11, 0.25);
                }

                .dc-report-card.score-low {
                    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                    box-shadow: 0 4px 14px rgba(239, 68, 68, 0.25);
                }

                .dc-report-header {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    margin-bottom: 20px;
                }

                .dc-report-icon {
                    width: 64px;
                    height: 64px;
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .dc-report-info {
                    flex: 1;
                }

                .dc-report-title {
                    font-size: 1.25rem;
                    font-weight: 700;
                    margin-bottom: 4px;
                }

                .dc-report-subtitle {
                    font-size: 0.875rem;
                    opacity: 0.9;
                }

                .dc-score-display {
                    text-align: center;
                }

                .dc-score-value {
                    font-size: 2.5rem;
                    font-weight: 700;
                    line-height: 1;
                }

                .dc-score-label {
                    font-size: 0.75rem;
                    opacity: 0.9;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .dc-report-stats {
                    display: flex;
                    gap: 24px;
                    padding-top: 16px;
                    border-top: 1px solid rgba(255, 255, 255, 0.2);
                }

                .dc-report-stat {
                    flex: 1;
                    text-align: center;
                }

                .dc-report-stat-value {
                    font-size: 1.5rem;
                    font-weight: 700;
                    margin-bottom: 4px;
                }

                .dc-report-stat-label {
                    font-size: 0.6875rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    opacity: 0.8;
                }

                /* Status Badge */
                .dc-status-badge {
                    display: inline-block;
                    padding: 6px 14px;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .dc-status-badge.draft { background: #e5e7eb; color: #4b5563; }
                .dc-status-badge.generated { background: #f3e8ff; color: #a404e4; }
                .dc-status-badge.reviewed { background: #fef3c7; color: #92400e; }
                .dc-status-badge.actioned { background: #dcfce7; color: #166534; }

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
                    .dc-report-header {
                        flex-direction: column;
                        text-align: center;
                    }

                    .dc-report-stats {
                        flex-direction: column;
                        gap: 12px;
                    }
                }
            </style>
        `);
    },

    show_summary_card: function(frm) {
        // Remove existing card
        frm.$wrapper.find('.dc-report-card').remove();

        // Only show for saved documents
        if (frm.is_new()) return;

        // Determine score class
        let score = frm.doc.compliance_score || 0;
        let score_class = '';
        if (score >= 90) score_class = 'score-high';
        else if (score >= 70) score_class = 'score-medium';
        else score_class = 'score-low';

        // Status class
        let status_class = (frm.doc.status || 'draft').toLowerCase();

        // Report icon
        let report_icon = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
        </svg>`;

        // Build card
        let $card = $(`
            <div class="dc-report-card ${score_class} dc-fade-in">
                <div class="dc-report-header">
                    <div class="dc-report-icon">${report_icon}</div>
                    <div class="dc-report-info">
                        <div class="dc-report-title">Mismatch Report</div>
                        <div class="dc-report-subtitle">
                            ${frm.doc.company || 'N/A'} &bull; ${frm.doc.report_date || 'N/A'}
                            <span class="dc-status-badge ${status_class}" style="margin-left: 12px;">${frm.doc.status || 'Draft'}</span>
                        </div>
                    </div>
                    <div class="dc-score-display">
                        <div class="dc-score-value">${score.toFixed(1)}%</div>
                        <div class="dc-score-label">Compliance</div>
                    </div>
                </div>
                <div class="dc-report-stats">
                    <div class="dc-report-stat">
                        <div class="dc-report-stat-value">${frm.doc.total_issues || 0}</div>
                        <div class="dc-report-stat-label">Total Issues</div>
                    </div>
                    <div class="dc-report-stat">
                        <div class="dc-report-stat-value">${frm.doc.critical_issues || 0}</div>
                        <div class="dc-report-stat-label">Critical</div>
                    </div>
                    <div class="dc-report-stat">
                        <div class="dc-report-stat-value">AED ${frappe.format(frm.doc.potential_penalty || 0, {fieldtype: 'Currency'})}</div>
                        <div class="dc-report-stat-label">Potential Penalty</div>
                    </div>
                </div>
            </div>
        `);

        // Insert card at top of form
        frm.$wrapper.find('.form-page').first().prepend($card);
    },

    regenerate_report: function(frm) {
        frappe.confirm(
            __('This will regenerate the report from the linked reconciliation run. Continue?'),
            function() {
                frappe.call({
                    method: 'digicomply.digicomply.doctype.mismatch_report.mismatch_report.generate_report',
                    args: {
                        reconciliation_run: frm.doc.reconciliation_run
                    },
                    freeze: true,
                    freeze_message: __('Generating report...'),
                    callback: function(r) {
                        if (r.message) {
                            frm.reload_doc();
                            frappe.show_alert({
                                message: __('Report regenerated successfully'),
                                indicator: 'green'
                            });
                        }
                    }
                });
            }
        );
    }
});
