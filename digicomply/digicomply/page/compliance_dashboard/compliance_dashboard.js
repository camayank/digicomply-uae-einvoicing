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
                        margin-bottom: 30px;
                    }
                    .company-selector {
                        min-width: 250px;
                    }
                    .metrics-row {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                        gap: 20px;
                        margin-bottom: 30px;
                    }
                    .metric-card {
                        background: white;
                        border-radius: 12px;
                        padding: 24px;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                        text-align: center;
                    }
                    .metric-value {
                        font-size: 36px;
                        font-weight: 700;
                        margin-bottom: 8px;
                    }
                    .metric-label {
                        font-size: 14px;
                        color: #6b7280;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }
                    .metric-green { color: #059669; }
                    .metric-yellow { color: #d97706; }
                    .metric-red { color: #dc2626; }
                    .metric-blue { color: #2563eb; }

                    .status-section {
                        background: white;
                        border-radius: 12px;
                        padding: 24px;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                        margin-bottom: 20px;
                    }
                    .section-title {
                        font-size: 18px;
                        font-weight: 600;
                        margin-bottom: 20px;
                        display: flex;
                        align-items: center;
                        gap: 10px;
                    }
                    .status-bar {
                        display: flex;
                        height: 24px;
                        border-radius: 12px;
                        overflow: hidden;
                        margin-bottom: 15px;
                    }
                    .status-bar-segment {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 12px;
                        font-weight: 500;
                        color: white;
                        min-width: 40px;
                    }
                    .segment-green { background: #10b981; }
                    .segment-yellow { background: #f59e0b; }
                    .segment-red { background: #ef4444; }

                    .status-legend {
                        display: flex;
                        gap: 24px;
                        flex-wrap: wrap;
                    }
                    .legend-item {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        font-size: 14px;
                    }
                    .legend-dot {
                        width: 12px;
                        height: 12px;
                        border-radius: 50%;
                    }

                    .recent-section {
                        background: white;
                        border-radius: 12px;
                        padding: 24px;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
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

                    .empty-state {
                        text-align: center;
                        padding: 60px 20px;
                        color: #6b7280;
                    }
                    .empty-state-icon {
                        font-size: 48px;
                        margin-bottom: 16px;
                    }
                    .empty-state-title {
                        font-size: 18px;
                        font-weight: 600;
                        margin-bottom: 8px;
                        color: #374151;
                    }
                </style>

                <div class="dashboard-header">
                    <div>
                        <h3 style="margin:0;">UAE E-Invoice Compliance</h3>
                        <p style="margin:0; color:#6b7280;">Monitor your PINT AE compliance status</p>
                    </div>
                    <div class="company-selector"></div>
                </div>

                <div class="metrics-row">
                    <div class="metric-card">
                        <div class="metric-value metric-blue" id="total-invoices">-</div>
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

                <div class="status-section">
                    <div class="section-title">
                        <span>📊</span> Reconciliation Status
                    </div>
                    <div class="status-bar" id="status-bar">
                        <div class="status-bar-segment segment-green" style="width:100%">No Data</div>
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

                <div class="recent-section">
                    <div class="section-title">
                        <span>🕐</span> Recent Reconciliations
                    </div>
                    <ul class="recent-list" id="recent-list">
                        <li class="empty-state">
                            <div class="empty-state-icon">📋</div>
                            <div class="empty-state-title">No reconciliations yet</div>
                            <div>Click "New Reconciliation" to get started</div>
                        </li>
                    </ul>
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
    }

    update_dashboard(data) {
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

    update_status_bar(data) {
        let total = data.total_invoices || 1;
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

        if (!html) {
            html = '<div class="status-bar-segment segment-green" style="width:100%">No Data</div>';
        }

        $('#status-bar').html(html);
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
                            <a href="/app/reconciliation-run/${run.name}">${run.name}</a>
                            <div style="font-size:12px;color:#6b7280;">
                                ${run.company} • ${run.posting_date}
                            </div>
                        </div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-weight:500;">${(run.match_percentage || 0).toFixed(1)}%</div>
                        <div style="font-size:12px;color:#6b7280;">${run.total_invoices || 0} invoices</div>
                    </div>
                </li>
            `;
        }).join('');

        $('#recent-list').html(html);
    }
}
