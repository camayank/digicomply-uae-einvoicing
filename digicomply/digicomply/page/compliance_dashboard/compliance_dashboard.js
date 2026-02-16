frappe.pages['compliance_dashboard'].on_page_load = function(wrapper) {
    var page = frappe.ui.make_app_page({
        parent: wrapper,
        title: 'E-Invoice Compliance Dashboard',
        single_column: true
    });

    // Add page actions
    page.set_primary_action(__('New Reconciliation'), function() {
        frappe.new_doc('Reconciliation Run');
    }, 'add');

    page.set_secondary_action(__('Upload CSV'), function() {
        frappe.new_doc('CSV Import');
    }, 'upload');

    // Initialize dashboard
    new ComplianceDashboard(page);
};

class ComplianceDashboard {
    constructor(page) {
        this.page = page;
        this.wrapper = $(page.body);
        this.render();
        this.load_data();
    }

    render() {
        this.wrapper.html(`
            <div class="compliance-dashboard">
                <style>
                    .compliance-dashboard {
                        padding: 20px;
                        max-width: 1400px;
                        margin: 0 auto;
                    }
                    .dashboard-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 24px;
                    }
                    .company-selector {
                        min-width: 250px;
                    }

                    /* FTA Deadline Card - Purple Theme */
                    .deadline-card {
                        background: linear-gradient(135deg, #a404e4 0%, #8501b9 100%);
                        color: white;
                        border-radius: 12px;
                        padding: 24px;
                        margin-bottom: 24px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        box-shadow: 0 4px 14px rgba(164, 4, 228, 0.25);
                    }
                    .deadline-card.warning {
                        background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%);
                        box-shadow: 0 4px 14px rgba(217, 119, 6, 0.25);
                    }
                    .deadline-card.critical {
                        background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
                        box-shadow: 0 4px 14px rgba(220, 38, 38, 0.25);
                    }
                    .deadline-left h4 {
                        margin: 0 0 4px 0;
                        font-size: 14px;
                        opacity: 0.9;
                        font-weight: 500;
                    }
                    .deadline-left .period {
                        font-size: 24px;
                        font-weight: 700;
                        margin-bottom: 4px;
                    }
                    .deadline-left .date {
                        font-size: 14px;
                        opacity: 0.8;
                    }
                    .deadline-right {
                        text-align: right;
                    }
                    .deadline-days {
                        font-size: 48px;
                        font-weight: 700;
                        line-height: 1;
                    }
                    .deadline-label {
                        font-size: 14px;
                        opacity: 0.9;
                    }

                    /* Quick Actions - Purple Hover */
                    .quick-actions {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
                        gap: 16px;
                        margin-bottom: 24px;
                    }
                    .quick-action-btn {
                        background: white;
                        border: 1px solid #e5e7eb;
                        border-radius: 12px;
                        padding: 20px 16px;
                        text-align: center;
                        cursor: pointer;
                        transition: all 0.2s;
                    }
                    .quick-action-btn:hover {
                        border-color: #a404e4;
                        box-shadow: 0 4px 12px rgba(164, 4, 228, 0.15);
                        transform: translateY(-2px);
                        background: #faf5ff;
                    }
                    .quick-action-icon {
                        font-size: 28px;
                        margin-bottom: 8px;
                    }
                    .quick-action-label {
                        font-weight: 600;
                        color: #374151;
                        font-size: 14px;
                    }
                    .quick-action-desc {
                        font-size: 11px;
                        color: #6b7280;
                        margin-top: 4px;
                    }

                    /* Penalty Warning */
                    .penalty-warning {
                        background: #fef2f2;
                        border: 1px solid #fecaca;
                        border-radius: 12px;
                        padding: 16px 20px;
                        margin-bottom: 24px;
                        display: flex;
                        align-items: center;
                        gap: 16px;
                    }
                    .penalty-warning.hidden { display: none; }
                    .penalty-warning-icon {
                        font-size: 32px;
                    }
                    .penalty-warning-text {
                        color: #991b1b;
                        font-size: 14px;
                    }
                    .penalty-warning-text strong {
                        color: #dc2626;
                        font-size: 18px;
                    }

                    /* Metrics */
                    .metrics-row {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                        gap: 16px;
                        margin-bottom: 24px;
                    }
                    .metric-card {
                        background: white;
                        border-radius: 12px;
                        padding: 20px;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.08);
                        text-align: center;
                        border: 1px solid #f3f4f6;
                    }
                    .metric-value {
                        font-size: 32px;
                        font-weight: 700;
                        margin-bottom: 4px;
                    }
                    .metric-label {
                        font-size: 12px;
                        color: #6b7280;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        font-weight: 500;
                    }
                    .metric-green { color: #059669; }
                    .metric-yellow { color: #d97706; }
                    .metric-red { color: #dc2626; }
                    .metric-purple { color: #a404e4; }

                    /* Status Section */
                    .status-section {
                        background: white;
                        border-radius: 12px;
                        padding: 24px;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.08);
                        margin-bottom: 24px;
                        border: 1px solid #f3f4f6;
                    }
                    .section-title {
                        font-size: 16px;
                        font-weight: 600;
                        margin-bottom: 16px;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        color: #374151;
                    }
                    .status-bar {
                        display: flex;
                        height: 28px;
                        border-radius: 14px;
                        overflow: hidden;
                        margin-bottom: 12px;
                        background: #f3f4f6;
                    }
                    .status-bar-segment {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 12px;
                        font-weight: 600;
                        color: white;
                        min-width: 50px;
                    }
                    .segment-green { background: #10b981; }
                    .segment-yellow { background: #f59e0b; }
                    .segment-red { background: #ef4444; }
                    .segment-gray { background: #9ca3af; }

                    .status-legend {
                        display: flex;
                        gap: 24px;
                        flex-wrap: wrap;
                    }
                    .legend-item {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        font-size: 13px;
                        color: #4b5563;
                    }
                    .legend-dot {
                        width: 12px;
                        height: 12px;
                        border-radius: 50%;
                    }

                    /* Two Column Layout */
                    .two-column {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 24px;
                    }
                    @media (max-width: 900px) {
                        .two-column { grid-template-columns: 1fr; }
                    }

                    /* Recent Section */
                    .recent-section {
                        background: white;
                        border-radius: 12px;
                        padding: 24px;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.08);
                        border: 1px solid #f3f4f6;
                    }
                    .recent-list {
                        list-style: none;
                        padding: 0;
                        margin: 0;
                    }
                    .recent-item {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 12px 0;
                        border-bottom: 1px solid #f3f4f6;
                    }
                    .recent-item:last-child { border-bottom: none; }
                    .recent-item-left {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                    }
                    .status-indicator {
                        width: 10px;
                        height: 10px;
                        border-radius: 50%;
                    }
                    .status-green { background: #10b981; }
                    .status-yellow { background: #f59e0b; }
                    .status-red { background: #ef4444; }
                    .status-gray { background: #9ca3af; }

                    /* CSV Imports Section */
                    .imports-section {
                        background: white;
                        border-radius: 12px;
                        padding: 24px;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.08);
                        border: 1px solid #f3f4f6;
                    }
                    .import-item {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 12px 0;
                        border-bottom: 1px solid #f3f4f6;
                    }
                    .import-item:last-child { border-bottom: none; }
                    .import-status {
                        font-size: 12px;
                        padding: 4px 10px;
                        border-radius: 12px;
                        font-weight: 500;
                    }
                    .import-status.completed { background: #d1fae5; color: #065f46; }
                    .import-status.pending { background: #fef3c7; color: #92400e; }
                    .import-status.failed { background: #fee2e2; color: #991b1b; }

                    /* Empty State */
                    .empty-state {
                        text-align: center;
                        padding: 40px 20px;
                        color: #6b7280;
                    }
                    .empty-state-icon {
                        font-size: 40px;
                        margin-bottom: 12px;
                    }
                    .empty-state-title {
                        font-size: 16px;
                        font-weight: 600;
                        margin-bottom: 4px;
                        color: #374151;
                    }
                    .empty-state-desc {
                        font-size: 13px;
                    }
                </style>

                <div class="dashboard-header">
                    <div>
                        <h3 style="margin:0; font-size: 24px; font-weight: 700; color: #111827;">UAE E-Invoice Compliance</h3>
                        <p style="margin:4px 0 0 0; color:#6b7280; font-size: 14px;">Monitor your PINT AE compliance status</p>
                    </div>
                    <div class="company-selector"></div>
                </div>

                <!-- FTA Deadline Card -->
                <div class="deadline-card" id="deadline-card">
                    <div class="deadline-left">
                        <h4>FTA Filing Deadline</h4>
                        <div class="period" id="deadline-period">Loading...</div>
                        <div class="date" id="deadline-date"></div>
                    </div>
                    <div class="deadline-right">
                        <div class="deadline-days" id="deadline-days">-</div>
                        <div class="deadline-label">days remaining</div>
                    </div>
                </div>

                <!-- Quick Actions -->
                <div class="quick-actions">
                    <div class="quick-action-btn" onclick="frappe.new_doc('Reconciliation Run')">
                        <div class="quick-action-icon">🔄</div>
                        <div class="quick-action-label">New Reconciliation</div>
                        <div class="quick-action-desc">Match Books vs ASP</div>
                    </div>
                    <div class="quick-action-btn" onclick="frappe.new_doc('CSV Import')">
                        <div class="quick-action-icon">📤</div>
                        <div class="quick-action-label">Upload CSV</div>
                        <div class="quick-action-desc">Import ASP data</div>
                    </div>
                    <div class="quick-action-btn" onclick="frappe.set_route('List', 'Sales Invoice')">
                        <div class="quick-action-icon">📄</div>
                        <div class="quick-action-label">View Invoices</div>
                        <div class="quick-action-desc">Sales Invoices</div>
                    </div>
                    <div class="quick-action-btn" onclick="frappe.set_route('List', 'Reconciliation Run')">
                        <div class="quick-action-icon">📊</div>
                        <div class="quick-action-label">All Reconciliations</div>
                        <div class="quick-action-desc">View history</div>
                    </div>
                </div>

                <!-- Penalty Warning -->
                <div class="penalty-warning hidden" id="penalty-warning">
                    <div class="penalty-warning-icon">⚠️</div>
                    <div class="penalty-warning-text">
                        <strong id="penalty-amount">AED 0</strong> potential penalty exposure<br>
                        <span id="penalty-desc">Based on unresolved mismatches and missing invoices</span>
                    </div>
                </div>

                <!-- Metrics -->
                <div class="metrics-row">
                    <div class="metric-card">
                        <div class="metric-value metric-purple" id="total-invoices">-</div>
                        <div class="metric-label">Total Invoices</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value metric-green" id="matched-count">-</div>
                        <div class="metric-label">Matched</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value metric-yellow" id="mismatched-count">-</div>
                        <div class="metric-label">Mismatched</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value metric-red" id="missing-count">-</div>
                        <div class="metric-label">Missing in ASP</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value" id="compliance-score">-</div>
                        <div class="metric-label">Compliance Score</div>
                    </div>
                </div>

                <!-- Status Bar -->
                <div class="status-section">
                    <div class="section-title">
                        <span>📊</span> Reconciliation Status
                    </div>
                    <div class="status-bar" id="status-bar">
                        <div class="status-bar-segment segment-gray" style="width:100%">No Data</div>
                    </div>
                    <div class="status-legend">
                        <div class="legend-item">
                            <div class="legend-dot" style="background:#10b981"></div>
                            <span>Matched</span>
                        </div>
                        <div class="legend-item">
                            <div class="legend-dot" style="background:#f59e0b"></div>
                            <span>Mismatched</span>
                        </div>
                        <div class="legend-item">
                            <div class="legend-dot" style="background:#ef4444"></div>
                            <span>Missing</span>
                        </div>
                    </div>
                </div>

                <!-- Two Column: Recent Runs & CSV Imports -->
                <div class="two-column">
                    <div class="recent-section">
                        <div class="section-title">
                            <span>🕐</span> Recent Reconciliations
                        </div>
                        <ul class="recent-list" id="recent-list">
                            <li class="empty-state">
                                <div class="empty-state-icon">📋</div>
                                <div class="empty-state-title">No reconciliations yet</div>
                                <div class="empty-state-desc">Click "New Reconciliation" to get started</div>
                            </li>
                        </ul>
                    </div>

                    <div class="imports-section">
                        <div class="section-title">
                            <span>📁</span> Recent CSV Imports
                        </div>
                        <ul class="recent-list" id="imports-list">
                            <li class="empty-state">
                                <div class="empty-state-icon">📤</div>
                                <div class="empty-state-title">No imports yet</div>
                                <div class="empty-state-desc">Upload your ASP data CSV</div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        `);

        // Add company selector
        this.company_field = frappe.ui.form.make_control({
            df: {
                fieldtype: 'Link',
                options: 'Company',
                fieldname: 'company',
                placeholder: __('Select Company'),
                change: () => this.load_data()
            },
            parent: this.wrapper.find('.company-selector'),
            render_input: true
        });
    }

    load_data() {
        let company = this.company_field.get_value();

        frappe.call({
            method: 'digicomply.api.get_dashboard_data',
            args: { company: company },
            callback: (r) => {
                if (r.message) {
                    this.update_dashboard(r.message);
                }
            }
        });

        // Also load recent CSV imports
        this.load_csv_imports(company);
    }

    load_csv_imports(company) {
        let filters = {};
        if (company) {
            filters.company = company;
        }

        frappe.call({
            method: 'frappe.client.get_list',
            args: {
                doctype: 'CSV Import',
                filters: filters,
                fields: ['name', 'asp_provider', 'status', 'row_count', 'creation'],
                order_by: 'creation desc',
                limit_page_length: 5
            },
            callback: (r) => {
                if (r.message) {
                    this.update_imports_list(r.message);
                }
            }
        });
    }

    update_dashboard(data) {
        // Update FTA deadline
        this.update_deadline(data.fta_deadline);

        // Update penalty warning
        this.update_penalty_warning(data.potential_penalty);

        // Update metrics
        $('#total-invoices').text(data.total_invoices || 0);
        $('#matched-count').text(data.matched_count || 0);
        $('#mismatched-count').text(data.mismatched_count || 0);
        $('#missing-count').text(data.missing_in_asp || 0);

        let score = data.compliance_score || 0;
        let scoreEl = $('#compliance-score');
        scoreEl.text(score.toFixed(1) + '%');
        scoreEl.removeClass('metric-green metric-yellow metric-red');
        if (score >= 90) {
            scoreEl.addClass('metric-green');
        } else if (score >= 70) {
            scoreEl.addClass('metric-yellow');
        } else {
            scoreEl.addClass('metric-red');
        }

        // Update status bar
        this.update_status_bar(data);

        // Update recent list
        this.update_recent_list(data.recent_runs || []);
    }

    update_deadline(deadline) {
        if (!deadline) return;

        let card = $('#deadline-card');
        card.removeClass('warning critical');
        if (deadline.urgency === 'warning') {
            card.addClass('warning');
        } else if (deadline.urgency === 'critical') {
            card.addClass('critical');
        }

        $('#deadline-period').text(deadline.reporting_period);
        $('#deadline-date').text('Due: ' + deadline.deadline_date);
        $('#deadline-days').text(deadline.days_remaining);
    }

    update_penalty_warning(penalty) {
        let warning = $('#penalty-warning');
        if (penalty && penalty > 0) {
            warning.removeClass('hidden');
            $('#penalty-amount').text('AED ' + penalty.toLocaleString());
        } else {
            warning.addClass('hidden');
        }
    }

    update_status_bar(data) {
        let total = data.total_invoices || 0;
        if (total === 0) {
            $('#status-bar').html('<div class="status-bar-segment segment-gray" style="width:100%">No Data</div>');
            return;
        }

        let matched = data.matched_count || 0;
        let mismatched = data.mismatched_count || 0;
        let missing = (data.missing_in_asp || 0) + (data.missing_in_erp || 0);

        let matchedPct = (matched / total * 100).toFixed(0);
        let mismatchedPct = (mismatched / total * 100).toFixed(0);
        let missingPct = (missing / total * 100).toFixed(0);

        let html = '';
        if (matched > 0) {
            html += `<div class="status-bar-segment segment-green" style="width:${matchedPct}%">${matchedPct}%</div>`;
        }
        if (mismatched > 0) {
            html += `<div class="status-bar-segment segment-yellow" style="width:${mismatchedPct}%">${mismatchedPct}%</div>`;
        }
        if (missing > 0) {
            html += `<div class="status-bar-segment segment-red" style="width:${missingPct}%">${missingPct}%</div>`;
        }

        $('#status-bar').html(html || '<div class="status-bar-segment segment-gray" style="width:100%">No Data</div>');
    }

    update_recent_list(runs) {
        if (!runs.length) {
            return;
        }

        let html = runs.map(run => {
            let statusClass = 'status-gray';
            if (run.status === 'Completed') {
                if (run.match_percentage >= 90) statusClass = 'status-green';
                else if (run.match_percentage >= 70) statusClass = 'status-yellow';
                else statusClass = 'status-red';
            } else if (run.status === 'Failed') {
                statusClass = 'status-red';
            }

            return `
                <li class="recent-item">
                    <div class="recent-item-left">
                        <div class="status-indicator ${statusClass}"></div>
                        <div>
                            <a href="/app/reconciliation-run/${run.name}" style="font-weight:500; color:#a404e4;">${run.name}</a>
                            <div style="font-size:12px;color:#6b7280;">
                                ${run.company} &bull; ${run.posting_date}
                            </div>
                        </div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-weight:600; font-size:16px;">${(run.match_percentage || 0).toFixed(1)}%</div>
                        <div style="font-size:12px;color:#6b7280;">${run.total_invoices || 0} invoices</div>
                    </div>
                </li>
            `;
        }).join('');

        $('#recent-list').html(html);
    }

    update_imports_list(imports) {
        if (!imports.length) {
            return;
        }

        let html = imports.map(imp => {
            let statusClass = imp.status.toLowerCase();
            return `
                <li class="import-item">
                    <div>
                        <a href="/app/csv-import/${imp.name}" style="font-weight:500; color:#a404e4;">${imp.name}</a>
                        <div style="font-size:12px;color:#6b7280;">
                            ${imp.asp_provider || 'Unknown'} &bull; ${imp.row_count || 0} rows
                        </div>
                    </div>
                    <span class="import-status ${statusClass}">${imp.status}</span>
                </li>
            `;
        }).join('');

        $('#imports-list').html(html);
    }
}
