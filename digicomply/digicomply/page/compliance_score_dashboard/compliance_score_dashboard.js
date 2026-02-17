// Copyright (c) 2024, DigiComply and contributors
// License: MIT

frappe.pages['compliance-score-dashboard'].on_page_load = function(wrapper) {
    var page = frappe.ui.make_app_page({
        parent: wrapper,
        title: 'Compliance Score',
        single_column: true
    });

    // Add company filter
    page.add_field({
        fieldname: 'company',
        label: __('Company'),
        fieldtype: 'Link',
        options: 'Company',
        default: frappe.defaults.get_user_default('Company'),
        change: function() {
            loadDashboard(wrapper, this.get_value());
        }
    });

    // Add refresh button
    page.set_primary_action(__('Recalculate Score'), function() {
        var company = page.fields_dict.company.get_value();
        if (!company) {
            frappe.msgprint(__('Please select a company'));
            return;
        }

        frappe.call({
            method: 'digicomply.digicomply.api.compliance_score.calculate_compliance_score',
            args: { company: company },
            freeze: true,
            freeze_message: __('Calculating compliance score...'),
            callback: function(r) {
                if (r.message) {
                    frappe.show_alert({
                        message: __('Score updated: {0}/100', [r.message.score]),
                        indicator: 'green'
                    });
                    loadDashboard(wrapper, company);
                }
            }
        });
    });

    // Add styles
    $('head').append(`
        <style id="score-dashboard-styles">
            .dc-dashboard-wrapper {
                font-family: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif;
                padding: 24px;
            }

            .dc-dashboard-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 24px;
            }

            @media (max-width: 1024px) {
                .dc-dashboard-grid {
                    grid-template-columns: 1fr;
                }
            }

            .dc-dashboard-card {
                background: white;
                border-radius: 16px;
                padding: 24px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
            }

            .dc-dashboard-card-title {
                font-size: 1rem;
                font-weight: 600;
                color: #64748b;
                margin-bottom: 16px;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }

            /* Main Score Card */
            .dc-main-score-card {
                grid-column: span 2;
                background: linear-gradient(135deg, #a404e4 0%, #8501b9 100%);
                color: white;
                display: flex;
                align-items: center;
                gap: 40px;
                padding: 32px 40px;
            }

            @media (max-width: 1024px) {
                .dc-main-score-card {
                    grid-column: span 1;
                    flex-direction: column;
                    text-align: center;
                }
            }

            .dc-main-score-gauge {
                position: relative;
                width: 180px;
                height: 180px;
                flex-shrink: 0;
            }

            .dc-main-score-circle {
                width: 100%;
                height: 100%;
                border-radius: 50%;
                background: conic-gradient(
                    white calc(var(--score) * 3.6deg),
                    rgba(255,255,255,0.2) 0deg
                );
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .dc-main-score-inner {
                width: 140px;
                height: 140px;
                background: rgba(255,255,255,0.15);
                border-radius: 50%;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
            }

            .dc-main-score-number {
                font-size: 3.5rem;
                font-weight: 700;
                line-height: 1;
            }

            .dc-main-score-max {
                font-size: 1rem;
                opacity: 0.8;
            }

            .dc-main-score-info {
                flex: 1;
            }

            .dc-main-score-title {
                font-size: 1.5rem;
                font-weight: 700;
                margin-bottom: 8px;
            }

            .dc-main-score-risk {
                display: inline-block;
                background: rgba(255,255,255,0.2);
                padding: 6px 16px;
                border-radius: 20px;
                font-weight: 600;
                margin-bottom: 16px;
            }

            .dc-main-score-penalty {
                font-size: 0.875rem;
                opacity: 0.9;
            }

            .dc-main-score-penalty strong {
                font-size: 1.25rem;
            }

            /* Breakdown Card */
            .dc-breakdown-row {
                display: flex;
                align-items: center;
                gap: 16px;
                margin-bottom: 16px;
            }

            .dc-breakdown-row:last-child {
                margin-bottom: 0;
            }

            .dc-breakdown-label {
                width: 130px;
                font-weight: 500;
                color: #1e293b;
            }

            .dc-breakdown-bar-container {
                flex: 1;
                height: 12px;
                background: #e2e8f0;
                border-radius: 6px;
                overflow: hidden;
            }

            .dc-breakdown-bar {
                height: 100%;
                border-radius: 6px;
                transition: width 0.5s ease-out;
            }

            .dc-breakdown-bar.good { background: #10b981; }
            .dc-breakdown-bar.ok { background: #f59e0b; }
            .dc-breakdown-bar.bad { background: #ef4444; }

            .dc-breakdown-value {
                width: 60px;
                text-align: right;
                font-weight: 700;
                color: #1e293b;
            }

            /* Penalty Card */
            .dc-penalty-breakdown {
                margin-top: 16px;
            }

            .dc-penalty-item {
                display: flex;
                justify-content: space-between;
                padding: 12px 0;
                border-bottom: 1px solid #e2e8f0;
            }

            .dc-penalty-item:last-child {
                border-bottom: none;
            }

            .dc-penalty-category {
                font-weight: 500;
                color: #1e293b;
            }

            .dc-penalty-desc {
                font-size: 0.75rem;
                color: #64748b;
            }

            .dc-penalty-amount {
                font-weight: 700;
                color: #ef4444;
            }

            .dc-penalty-total {
                display: flex;
                justify-content: space-between;
                padding-top: 16px;
                border-top: 2px solid #e2e8f0;
                margin-top: 8px;
            }

            .dc-penalty-total-label {
                font-weight: 700;
                color: #1e293b;
            }

            .dc-penalty-total-amount {
                font-size: 1.5rem;
                font-weight: 700;
                color: #ef4444;
            }

            /* Actions Card */
            .dc-action-list {
                list-style: none;
                padding: 0;
                margin: 0;
            }

            .dc-action-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px 0;
                border-bottom: 1px solid #e2e8f0;
                cursor: pointer;
                transition: background 0.2s;
            }

            .dc-action-item:hover {
                background: #f8fafc;
                margin: 0 -24px;
                padding: 12px 24px;
            }

            .dc-action-item:last-child {
                border-bottom: none;
            }

            .dc-action-icon {
                width: 40px;
                height: 40px;
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.25rem;
            }

            .dc-action-icon.trn { background: #fef3c7; }
            .dc-action-icon.recon { background: #dbeafe; }
            .dc-action-icon.filing { background: #f3e8ff; }

            .dc-action-text {
                flex: 1;
            }

            .dc-action-title {
                font-weight: 600;
                color: #1e293b;
            }

            .dc-action-desc {
                font-size: 0.75rem;
                color: #64748b;
            }

            .dc-action-arrow {
                color: #a404e4;
                font-size: 1.25rem;
            }

            /* Empty State */
            .dc-empty-state {
                text-align: center;
                padding: 60px 24px;
            }

            .dc-empty-icon {
                font-size: 4rem;
                margin-bottom: 16px;
            }

            .dc-empty-title {
                font-size: 1.25rem;
                font-weight: 600;
                color: #1e293b;
                margin-bottom: 8px;
            }

            .dc-empty-desc {
                color: #64748b;
                margin-bottom: 24px;
            }

            .dc-empty-btn {
                display: inline-block;
                padding: 12px 24px;
                background: linear-gradient(135deg, #a404e4 0%, #8501b9 100%);
                color: white;
                border-radius: 10px;
                font-weight: 600;
                text-decoration: none;
            }
        </style>
    `);

    // Initial render
    $(wrapper).find('.layout-main-section').html(`
        <div class="dc-dashboard-wrapper">
            <div class="dc-empty-state">
                <div class="dc-empty-icon">📊</div>
                <div class="dc-empty-title">Select a Company</div>
                <div class="dc-empty-desc">Choose a company from the dropdown above to view its compliance score.</div>
            </div>
        </div>
    `);

    // Load default company
    var defaultCompany = frappe.defaults.get_user_default('Company');
    if (defaultCompany) {
        setTimeout(function() {
            loadDashboard(wrapper, defaultCompany);
        }, 500);
    }
};

function loadDashboard(wrapper, company) {
    if (!company) return;

    var $content = $(wrapper).find('.dc-dashboard-wrapper');
    $content.html('<div style="text-align: center; padding: 60px;"><div class="loading-indicator"></div></div>');

    // Fetch data
    Promise.all([
        new Promise(function(resolve) {
            frappe.call({
                method: 'digicomply.digicomply.api.compliance_score.get_latest_score',
                args: { company: company },
                callback: function(r) { resolve(r.message); }
            });
        }),
        new Promise(function(resolve) {
            frappe.call({
                method: 'digicomply.digicomply.api.compliance_score.get_penalty_breakdown',
                args: { company: company },
                callback: function(r) { resolve(r.message); }
            });
        })
    ]).then(function(results) {
        var scoreData = results[0];
        var penaltyData = results[1];

        if (!scoreData) {
            renderEmptyState($content, company);
        } else {
            renderDashboard($content, scoreData, penaltyData, company);
        }
    });
}

function renderEmptyState($content, company) {
    $content.html(`
        <div class="dc-empty-state">
            <div class="dc-empty-icon">📊</div>
            <div class="dc-empty-title">No Score Yet</div>
            <div class="dc-empty-desc">Calculate your first compliance score to see your dashboard.</div>
            <a href="/app/compliance-onboarding" class="dc-empty-btn">Get Your Score</a>
        </div>
    `);
}

function renderDashboard($content, scoreData, penaltyData, company) {
    var score = scoreData.total_score;
    var scoreColor = getScoreColor(score);

    var breakdownHtml = buildBreakdownHtml(scoreData);
    var penaltyHtml = buildPenaltyHtml(penaltyData);

    $content.html(`
        <div class="dc-dashboard-grid">
            <!-- Main Score Card -->
            <div class="dc-dashboard-card dc-main-score-card">
                <div class="dc-main-score-gauge">
                    <div class="dc-main-score-circle" style="--score: ${score};">
                        <div class="dc-main-score-inner">
                            <div class="dc-main-score-number">${score}</div>
                            <div class="dc-main-score-max">/ 100</div>
                        </div>
                    </div>
                </div>
                <div class="dc-main-score-info">
                    <div class="dc-main-score-title">DigiComply Score</div>
                    <div class="dc-main-score-risk">${scoreData.risk_level}</div>
                    <div class="dc-main-score-penalty">
                        Penalty Exposure: <strong>AED ${formatNumber(scoreData.penalty_exposure || 0)}</strong>
                    </div>
                </div>
            </div>

            <!-- Score Breakdown -->
            <div class="dc-dashboard-card">
                <div class="dc-dashboard-card-title">Score Breakdown</div>
                ${breakdownHtml}
            </div>

            <!-- Penalty Breakdown -->
            <div class="dc-dashboard-card">
                <div class="dc-dashboard-card-title">Penalty Exposure</div>
                ${penaltyHtml}
            </div>

            <!-- Quick Actions -->
            <div class="dc-dashboard-card" style="grid-column: span 2;">
                <div class="dc-dashboard-card-title">Improve Your Score</div>
                <ul class="dc-action-list">
                    <li class="dc-action-item" onclick="window.location.href='/app/trn-health-center'">
                        <div class="dc-action-icon trn">🔍</div>
                        <div class="dc-action-text">
                            <div class="dc-action-title">Validate TRNs</div>
                            <div class="dc-action-desc">Verify your TRNs with FTA to improve TRN Health score</div>
                        </div>
                        <div class="dc-action-arrow">→</div>
                    </li>
                    <li class="dc-action-item" onclick="window.location.href='/app/multi-company-recon'">
                        <div class="dc-action-icon recon">📋</div>
                        <div class="dc-action-text">
                            <div class="dc-action-title">Run Reconciliation</div>
                            <div class="dc-action-desc">Match invoices to improve Reconciliation score</div>
                        </div>
                        <div class="dc-action-arrow">→</div>
                    </li>
                    <li class="dc-action-item" onclick="window.location.href='/app/compliance-calendar'">
                        <div class="dc-action-icon filing">📅</div>
                        <div class="dc-action-text">
                            <div class="dc-action-title">Check Filing Deadlines</div>
                            <div class="dc-action-desc">Stay on top of VAT return deadlines</div>
                        </div>
                        <div class="dc-action-arrow">→</div>
                    </li>
                </ul>
            </div>
        </div>
    `);
}

function buildBreakdownHtml(scoreData) {
    var categories = [
        { key: 'trn_health_score', label: 'TRN Health', max: 30 },
        { key: 'reconciliation_score', label: 'Reconciliation', max: 30 },
        { key: 'filing_compliance_score', label: 'Filing Compliance', max: 25 },
        { key: 'data_integrity_score', label: 'Data Integrity', max: 15 }
    ];

    var html = '';
    categories.forEach(function(cat) {
        var val = scoreData[cat.key] || 0;
        var pct = (val / cat.max) * 100;
        var barClass = pct >= 70 ? 'good' : (pct >= 40 ? 'ok' : 'bad');

        html += `
            <div class="dc-breakdown-row">
                <div class="dc-breakdown-label">${cat.label}</div>
                <div class="dc-breakdown-bar-container">
                    <div class="dc-breakdown-bar ${barClass}" style="width: ${pct}%"></div>
                </div>
                <div class="dc-breakdown-value">${val}/${cat.max}</div>
            </div>
        `;
    });

    return html;
}

function buildPenaltyHtml(penaltyData) {
    if (!penaltyData || !penaltyData.breakdown || penaltyData.breakdown.length === 0) {
        return `
            <div style="text-align: center; padding: 24px; color: #10b981;">
                <div style="font-size: 2rem; margin-bottom: 8px;">✓</div>
                <div style="font-weight: 600;">No Penalty Exposure</div>
                <div style="font-size: 0.875rem; color: #64748b;">You're fully compliant!</div>
            </div>
        `;
    }

    var html = '<div class="dc-penalty-breakdown">';
    penaltyData.breakdown.forEach(function(item) {
        html += `
            <div class="dc-penalty-item">
                <div>
                    <div class="dc-penalty-category">${item.category}</div>
                    <div class="dc-penalty-desc">${item.description}</div>
                </div>
                <div class="dc-penalty-amount">AED ${formatNumber(item.amount)}</div>
            </div>
        `;
    });

    html += `
        <div class="dc-penalty-total">
            <div class="dc-penalty-total-label">Total Exposure</div>
            <div class="dc-penalty-total-amount">AED ${formatNumber(penaltyData.total)}</div>
        </div>
    </div>`;

    return html;
}

function getScoreColor(score) {
    if (score >= 90) return '#10b981';
    if (score >= 80) return '#84cc16';
    if (score >= 60) return '#eab308';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
}

function formatNumber(num) {
    return new Intl.NumberFormat('en-AE').format(Math.round(num));
}
