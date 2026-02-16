// Copyright (c) 2024, DigiComply and contributors
// License: MIT

frappe.ui.form.on('Reconciliation Run', {
    refresh: function(frm) {
        // Add CSS for color-coded rows
        frm.trigger('add_custom_styles');

        // Add visual dashboard summary
        frm.trigger('add_visual_dashboard');

        // Add Run Reconciliation button handler
        if (frm.fields_dict.run_reconciliation && frm.fields_dict.run_reconciliation.$input) {
            frm.fields_dict.run_reconciliation.$input.off('click').on('click', function() {
                if (frm.doc.status === 'Completed') {
                    frappe.confirm(
                        __('Reconciliation already completed. Run again?'),
                        function() {
                            frm.trigger('do_reconciliation');
                        }
                    );
                } else {
                    frm.trigger('do_reconciliation');
                }
            });
        }

        // Add Generate Report button handler
        if (frm.fields_dict.generate_report && frm.fields_dict.generate_report.$input) {
            frm.fields_dict.generate_report.$input.off('click').on('click', function() {
                if (frm.doc.status !== 'Completed') {
                    frappe.msgprint(__('Please run reconciliation first'));
                    return;
                }
                frappe.call({
                    method: 'generate_report',
                    doc: frm.doc,
                    callback: function(r) {
                        if (r.message) {
                            frappe.msgprint(__('Report generated successfully'));
                        }
                    }
                });
            });
        }

        // Color code results summary and rows
        if (frm.doc.status === 'Completed') {
            frm.trigger('highlight_results');
            frm.trigger('add_filter_buttons');
            setTimeout(() => frm.trigger('color_code_rows'), 300);
        }

        // Style action buttons
        frm.trigger('style_action_buttons');
    },

    add_visual_dashboard: function(frm) {
        // Remove existing dashboard
        frm.$wrapper.find('.dc-reconciliation-dashboard').remove();

        // Only show if we have results
        if (frm.doc.status !== 'Completed' && frm.doc.status !== 'In Progress') {
            return;
        }

        let total = frm.doc.total_invoices || 0;
        let matched = frm.doc.matched_count || 0;
        let mismatched = frm.doc.mismatched_count || 0;
        let missingAsp = frm.doc.missing_in_asp || 0;
        let missingErp = frm.doc.missing_in_erp || 0;
        let matchPct = frm.doc.match_percentage || 0;

        // Calculate percentages for progress bar
        let matchedPct = total > 0 ? (matched / total * 100) : 0;
        let mismatchedPct = total > 0 ? (mismatched / total * 100) : 0;
        let missingPct = total > 0 ? ((missingAsp + missingErp) / total * 100) : 0;

        // Determine score class
        let scoreClass = matchPct >= 90 ? 'high' : (matchPct >= 70 ? 'medium' : 'low');
        let statusText = matchPct >= 90 ? 'Excellent' : (matchPct >= 70 ? 'Needs Review' : 'Action Required');

        let $dashboard = $(`
            <div class="dc-reconciliation-dashboard dc-fade-in">
                <div class="dc-recon-header">
                    <div class="dc-recon-score">
                        <div class="dc-score-circle ${scoreClass}">
                            ${Math.round(matchPct)}%
                        </div>
                        <div class="dc-score-label">${statusText}</div>
                    </div>
                    <div class="dc-recon-metrics">
                        <div class="dc-metric-item success">
                            <div class="dc-metric-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                                    <polyline points="22 4 12 14.01 9 11.01"/>
                                </svg>
                            </div>
                            <div class="dc-metric-data">
                                <div class="dc-metric-value">${matched}</div>
                                <div class="dc-metric-label">Matched</div>
                            </div>
                        </div>
                        <div class="dc-metric-item warning">
                            <div class="dc-metric-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"/>
                                    <line x1="12" y1="8" x2="12" y2="12"/>
                                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                                </svg>
                            </div>
                            <div class="dc-metric-data">
                                <div class="dc-metric-value">${mismatched}</div>
                                <div class="dc-metric-label">Mismatched</div>
                            </div>
                        </div>
                        <div class="dc-metric-item danger">
                            <div class="dc-metric-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"/>
                                    <line x1="15" y1="9" x2="9" y2="15"/>
                                    <line x1="9" y1="9" x2="15" y2="15"/>
                                </svg>
                            </div>
                            <div class="dc-metric-data">
                                <div class="dc-metric-value">${missingAsp + missingErp}</div>
                                <div class="dc-metric-label">Missing</div>
                            </div>
                        </div>
                        <div class="dc-metric-item primary">
                            <div class="dc-metric-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                    <polyline points="14 2 14 8 20 8"/>
                                    <line x1="16" y1="13" x2="8" y2="13"/>
                                    <line x1="16" y1="17" x2="8" y2="17"/>
                                </svg>
                            </div>
                            <div class="dc-metric-data">
                                <div class="dc-metric-value">${total}</div>
                                <div class="dc-metric-label">Total Invoices</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="dc-recon-progress">
                    <div class="dc-progress-label">
                        <span>Reconciliation Distribution</span>
                    </div>
                    <div class="dc-progress-bar">
                        ${matchedPct > 0 ? `<div class="segment green" style="width: ${matchedPct}%">${matchedPct >= 10 ? Math.round(matchedPct) + '%' : ''}</div>` : ''}
                        ${mismatchedPct > 0 ? `<div class="segment yellow" style="width: ${mismatchedPct}%">${mismatchedPct >= 10 ? Math.round(mismatchedPct) + '%' : ''}</div>` : ''}
                        ${missingPct > 0 ? `<div class="segment red" style="width: ${missingPct}%">${missingPct >= 10 ? Math.round(missingPct) + '%' : ''}</div>` : ''}
                    </div>
                    <div class="dc-progress-legend">
                        <span class="legend-item"><span class="dot green"></span> Matched</span>
                        <span class="legend-item"><span class="dot yellow"></span> Mismatched</span>
                        <span class="legend-item"><span class="dot red"></span> Missing</span>
                    </div>
                </div>
            </div>
        `);

        // Insert after form header
        frm.$wrapper.find('.form-page').first().prepend($dashboard);
    },

    style_action_buttons: function(frm) {
        // Style the Run Reconciliation button
        if (frm.fields_dict.run_reconciliation && frm.fields_dict.run_reconciliation.$input) {
            frm.fields_dict.run_reconciliation.$input
                .removeClass('btn-default btn-xs')
                .addClass('btn-primary')
                .css({
                    'padding': '10px 24px',
                    'font-size': '14px',
                    'font-weight': '600'
                });
        }

        // Style the Generate Report button
        if (frm.fields_dict.generate_report && frm.fields_dict.generate_report.$input) {
            frm.fields_dict.generate_report.$input
                .removeClass('btn-default btn-xs')
                .addClass('btn-secondary')
                .css({
                    'padding': '10px 24px',
                    'font-size': '14px',
                    'font-weight': '600',
                    'margin-left': '10px'
                });
        }
    },

    add_custom_styles: function(frm) {
        if ($('#reconciliation-styles').length) return;

        $('head').append(`
            <style id="reconciliation-styles">
                /* Visual Dashboard */
                .dc-reconciliation-dashboard {
                    background: linear-gradient(135deg, #a404e4 0%, #8501b9 100%);
                    border-radius: 16px;
                    padding: 24px;
                    margin-bottom: 24px;
                    color: white;
                    box-shadow: 0 4px 14px rgba(164, 4, 228, 0.25);
                }

                .dc-recon-header {
                    display: flex;
                    align-items: center;
                    gap: 32px;
                    margin-bottom: 24px;
                }

                .dc-recon-score {
                    text-align: center;
                    flex-shrink: 0;
                }

                .dc-recon-score .dc-score-circle {
                    width: 100px;
                    height: 100px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.75rem;
                    font-weight: 700;
                    margin-bottom: 8px;
                    border: 4px solid rgba(255,255,255,0.3);
                }

                .dc-recon-score .dc-score-circle.high {
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                }

                .dc-recon-score .dc-score-circle.medium {
                    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                }

                .dc-recon-score .dc-score-circle.low {
                    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                }

                .dc-score-label {
                    font-size: 0.875rem;
                    font-weight: 600;
                    opacity: 0.9;
                }

                .dc-recon-metrics {
                    display: flex;
                    gap: 16px;
                    flex: 1;
                }

                .dc-metric-item {
                    background: rgba(255,255,255,0.1);
                    border-radius: 12px;
                    padding: 16px;
                    flex: 1;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    transition: all 0.2s;
                }

                .dc-metric-item:hover {
                    background: rgba(255,255,255,0.15);
                    transform: translateY(-2px);
                }

                .dc-metric-icon {
                    width: 44px;
                    height: 44px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(255,255,255,0.2);
                }

                .dc-metric-item.success .dc-metric-icon { background: rgba(16,185,129,0.3); }
                .dc-metric-item.warning .dc-metric-icon { background: rgba(245,158,11,0.3); }
                .dc-metric-item.danger .dc-metric-icon { background: rgba(239,68,68,0.3); }
                .dc-metric-item.primary .dc-metric-icon { background: rgba(59,130,246,0.3); }

                .dc-metric-data {
                    flex: 1;
                }

                .dc-metric-value {
                    font-size: 1.5rem;
                    font-weight: 700;
                    line-height: 1.2;
                }

                .dc-metric-label {
                    font-size: 0.75rem;
                    opacity: 0.8;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .dc-recon-progress {
                    background: rgba(255,255,255,0.1);
                    border-radius: 12px;
                    padding: 16px;
                }

                .dc-progress-label {
                    font-size: 0.8125rem;
                    font-weight: 600;
                    margin-bottom: 10px;
                    opacity: 0.9;
                }

                .dc-reconciliation-dashboard .dc-progress-bar {
                    display: flex;
                    height: 28px;
                    border-radius: 14px;
                    overflow: hidden;
                    background: rgba(255,255,255,0.2);
                }

                .dc-reconciliation-dashboard .dc-progress-bar .segment {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: white;
                    transition: width 0.5s ease;
                }

                .dc-reconciliation-dashboard .dc-progress-bar .segment.green { background: #10b981; }
                .dc-reconciliation-dashboard .dc-progress-bar .segment.yellow { background: #f59e0b; }
                .dc-reconciliation-dashboard .dc-progress-bar .segment.red { background: #ef4444; }

                .dc-progress-legend {
                    display: flex;
                    gap: 20px;
                    margin-top: 10px;
                    font-size: 0.75rem;
                }

                .legend-item {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .legend-item .dot {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                }

                .legend-item .dot.green { background: #10b981; }
                .legend-item .dot.yellow { background: #f59e0b; }
                .legend-item .dot.red { background: #ef4444; }

                /* Row color coding */
                .reconciliation-row-matched {
                    background-color: #dcfce7 !important;
                }
                .reconciliation-row-mismatched {
                    background-color: #fef9c3 !important;
                }
                .reconciliation-row-missing {
                    background-color: #fee2e2 !important;
                }

                /* Filter buttons */
                .reconciliation-filters {
                    margin-bottom: 15px;
                    display: flex;
                    gap: 10px;
                    flex-wrap: wrap;
                    padding: 12px;
                    background: #f8fafc;
                    border-radius: 12px;
                }
                .reconciliation-filter-btn {
                    padding: 8px 16px;
                    border-radius: 20px;
                    border: 2px solid #e5e7eb;
                    background: white;
                    cursor: pointer;
                    font-size: 13px;
                    font-weight: 600;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .reconciliation-filter-btn:hover {
                    border-color: #a404e4;
                    transform: translateY(-1px);
                }
                .reconciliation-filter-btn.active {
                    background: #a404e4;
                    color: white;
                    border-color: #a404e4;
                }
                .reconciliation-filter-btn .count {
                    background: rgba(0,0,0,0.08);
                    padding: 2px 10px;
                    border-radius: 10px;
                    font-size: 12px;
                    font-weight: 700;
                }
                .reconciliation-filter-btn.active .count {
                    background: rgba(255,255,255,0.25);
                }
                .reconciliation-filter-btn.matched { border-color: #10b981; color: #065f46; }
                .reconciliation-filter-btn.matched.active { background: #10b981; border-color: #10b981; color: white; }
                .reconciliation-filter-btn.mismatched { border-color: #f59e0b; color: #92400e; }
                .reconciliation-filter-btn.mismatched.active { background: #f59e0b; border-color: #f59e0b; color: white; }
                .reconciliation-filter-btn.missing { border-color: #ef4444; color: #991b1b; }
                .reconciliation-filter-btn.missing.active { background: #ef4444; border-color: #ef4444; color: white; }

                /* Difference display */
                .difference-inline {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }
                .difference-item {
                    background: #fef3c7;
                    border: 1px solid #f59e0b;
                    border-radius: 4px;
                    padding: 4px 8px;
                    font-size: 12px;
                }
                .difference-item .field-name {
                    font-weight: 600;
                    color: #92400e;
                }
                .difference-item .values {
                    color: #78350f;
                }

                /* Hide default results section when dashboard is shown */
                .dc-reconciliation-dashboard ~ .form-section[data-fieldname="section_results"] .section-body {
                    display: none;
                }

                /* Mobile responsive */
                @media (max-width: 768px) {
                    .dc-recon-header {
                        flex-direction: column;
                        gap: 20px;
                    }
                    .dc-recon-metrics {
                        flex-wrap: wrap;
                    }
                    .dc-metric-item {
                        flex: 1 1 45%;
                    }
                }
            </style>
        `);
    },

    add_filter_buttons: function(frm) {
        // Remove existing filter buttons
        frm.fields_dict.section_items.$wrapper.find('.reconciliation-filters').remove();

        // Count by status
        let counts = {
            all: frm.doc.items ? frm.doc.items.length : 0,
            matched: 0,
            mismatched: 0,
            missing: 0
        };

        (frm.doc.items || []).forEach(item => {
            if (item.match_status === 'Matched') counts.matched++;
            else if (item.match_status === 'Mismatched') counts.mismatched++;
            else counts.missing++;
        });

        // Create filter buttons
        let $filters = $(`
            <div class="reconciliation-filters">
                <button class="reconciliation-filter-btn active" data-filter="all">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="18" height="18" rx="2"/>
                        <path d="M3 9h18"/>
                        <path d="M9 21V9"/>
                    </svg>
                    All <span class="count">${counts.all}</span>
                </button>
                <button class="reconciliation-filter-btn matched" data-filter="matched">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                    Matched <span class="count">${counts.matched}</span>
                </button>
                <button class="reconciliation-filter-btn mismatched" data-filter="mismatched">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    Mismatched <span class="count">${counts.mismatched}</span>
                </button>
                <button class="reconciliation-filter-btn missing" data-filter="missing">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="15" y1="9" x2="9" y2="15"/>
                        <line x1="9" y1="9" x2="15" y2="15"/>
                    </svg>
                    Missing <span class="count">${counts.missing}</span>
                </button>
            </div>
        `);

        // Insert before items table
        frm.fields_dict.section_items.$wrapper.find('.section-head').after($filters);

        // Handle filter clicks
        $filters.find('.reconciliation-filter-btn').on('click', function() {
            $filters.find('.reconciliation-filter-btn').removeClass('active');
            $(this).addClass('active');

            let filter = $(this).data('filter');
            frm.trigger('apply_row_filter', filter);
        });
    },

    apply_row_filter: function(frm, filter) {
        let $grid = frm.fields_dict.items.$wrapper;

        $grid.find('.frappe-control[data-name]').each(function() {
            let $row = $(this);
            let rowName = $row.data('name');
            let item = (frm.doc.items || []).find(i => i.name === rowName);

            if (!item) return;

            let show = false;
            if (filter === 'all') {
                show = true;
            } else if (filter === 'matched' && item.match_status === 'Matched') {
                show = true;
            } else if (filter === 'mismatched' && item.match_status === 'Mismatched') {
                show = true;
            } else if (filter === 'missing' && (item.match_status === 'Missing in ASP' || item.match_status === 'Missing in ERP')) {
                show = true;
            }

            $row.toggle(show);
        });
    },

    color_code_rows: function(frm) {
        let $grid = frm.fields_dict.items.$wrapper;

        // Color code each row based on match_status
        $grid.find('[data-name]').each(function() {
            let $row = $(this);
            let rowName = $row.data('name');
            let item = (frm.doc.items || []).find(i => i.name === rowName);

            if (!item) return;

            // Remove existing classes
            $row.removeClass('reconciliation-row-matched reconciliation-row-mismatched reconciliation-row-missing');

            // Add appropriate class
            if (item.match_status === 'Matched') {
                $row.addClass('reconciliation-row-matched');
            } else if (item.match_status === 'Mismatched') {
                $row.addClass('reconciliation-row-mismatched');
            } else {
                $row.addClass('reconciliation-row-missing');
            }
        });
    },

    company: function(frm) {
        // Clear csv_import when company changes
        frm.set_value('csv_import', '');
        frm.trigger('set_csv_import_filter');
    },

    onload: function(frm) {
        frm.trigger('set_csv_import_filter');
    },

    set_csv_import_filter: function(frm) {
        // Filter CSV Import by selected company
        frm.set_query('csv_import', function() {
            if (frm.doc.company) {
                return {
                    filters: {
                        company: frm.doc.company,
                        status: 'Completed'
                    }
                };
            }
            return {
                filters: {
                    status: 'Completed'
                }
            };
        });
    },

    do_reconciliation: function(frm) {
        frappe.call({
            method: 'run_reconciliation',
            doc: frm.doc,
            freeze: true,
            freeze_message: __('Running reconciliation...'),
            callback: function(r) {
                if (r.message && r.message.status === 'success') {
                    frm.reload_doc();
                    frappe.show_alert({
                        message: __('Reconciliation completed successfully'),
                        indicator: 'green'
                    });
                }
            }
        });
    },

    highlight_results: function(frm) {
        // Add visual indicators to results
        let $matched = frm.fields_dict.matched_count.$wrapper;
        let $mismatched = frm.fields_dict.mismatched_count.$wrapper;
        let $missing_asp = frm.fields_dict.missing_in_asp.$wrapper;
        let $missing_erp = frm.fields_dict.missing_in_erp.$wrapper;

        $matched.find('.control-value').css({
            'color': '#16a34a',
            'font-weight': 'bold'
        });

        if (frm.doc.mismatched_count > 0) {
            $mismatched.find('.control-value').css({
                'color': '#ca8a04',
                'font-weight': 'bold'
            });
        }

        if (frm.doc.missing_in_asp > 0 || frm.doc.missing_in_erp > 0) {
            $missing_asp.find('.control-value').css({
                'color': '#dc2626',
                'font-weight': 'bold'
            });
            $missing_erp.find('.control-value').css({
                'color': '#dc2626',
                'font-weight': 'bold'
            });
        }
    }
});
