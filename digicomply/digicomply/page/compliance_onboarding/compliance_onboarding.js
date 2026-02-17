// Copyright (c) 2024, DigiComply and contributors
// License: MIT

frappe.pages['compliance-onboarding'].on_page_load = function(wrapper) {
    var page = frappe.ui.make_app_page({
        parent: wrapper,
        title: 'Compliance Assessment',
        single_column: true
    });

    // Store state
    var state = {
        step: 1,
        company: null,
        penaltyData: null,
        scoreData: null
    };

    // Add styles
    $('head').append(`
        <style id="onboarding-styles">
            .dc-onboard-wrapper {
                font-family: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif;
                max-width: 700px;
                margin: 0 auto;
                padding: 24px;
                min-height: 80vh;
            }

            .dc-onboard-progress {
                display: flex;
                justify-content: center;
                gap: 8px;
                margin-bottom: 32px;
            }

            .dc-onboard-dot {
                width: 12px;
                height: 12px;
                border-radius: 50%;
                background: #e2e8f0;
                transition: all 0.3s;
            }

            .dc-onboard-dot.active {
                background: #a404e4;
                transform: scale(1.2);
            }

            .dc-onboard-dot.complete {
                background: #10b981;
            }

            .dc-onboard-step {
                display: none;
                animation: fadeIn 0.4s ease-out;
            }

            .dc-onboard-step.active {
                display: block;
            }

            .dc-onboard-card {
                background: white;
                border-radius: 20px;
                padding: 40px;
                box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
            }

            .dc-onboard-title {
                font-size: 1.75rem;
                font-weight: 700;
                color: #1e293b;
                text-align: center;
                margin-bottom: 8px;
            }

            .dc-onboard-subtitle {
                color: #64748b;
                text-align: center;
                margin-bottom: 32px;
            }

            .dc-onboard-form-group {
                margin-bottom: 24px;
            }

            .dc-onboard-label {
                display: block;
                font-weight: 600;
                color: #1e293b;
                margin-bottom: 8px;
            }

            .dc-onboard-select,
            .dc-onboard-input {
                width: 100%;
                padding: 14px 18px;
                border: 2px solid #e2e8f0;
                border-radius: 12px;
                font-size: 1rem;
                transition: border-color 0.2s;
            }

            .dc-onboard-select:focus,
            .dc-onboard-input:focus {
                outline: none;
                border-color: #a404e4;
            }

            .dc-onboard-btn {
                width: 100%;
                padding: 16px 32px;
                background: linear-gradient(135deg, #a404e4 0%, #8501b9 100%);
                color: white;
                border: none;
                border-radius: 12px;
                font-size: 1.125rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
                margin-top: 16px;
            }

            .dc-onboard-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 20px rgba(164, 4, 228, 0.3);
            }

            .dc-onboard-btn:disabled {
                opacity: 0.6;
                cursor: not-allowed;
                transform: none;
            }

            /* Shock Screen */
            .dc-shock-card {
                background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%);
                border-radius: 20px;
                padding: 48px 40px;
                color: white;
                text-align: center;
            }

            .dc-shock-icon {
                font-size: 3rem;
                margin-bottom: 16px;
            }

            .dc-shock-label {
                font-size: 0.875rem;
                text-transform: uppercase;
                letter-spacing: 0.15em;
                opacity: 0.9;
                margin-bottom: 8px;
            }

            .dc-shock-amount {
                font-size: 3.5rem;
                font-weight: 700;
                margin-bottom: 16px;
            }

            .dc-shock-breakdown {
                background: rgba(255, 255, 255, 0.15);
                border-radius: 12px;
                padding: 20px;
                margin-top: 24px;
                text-align: left;
            }

            .dc-shock-item {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                border-bottom: 1px solid rgba(255, 255, 255, 0.2);
            }

            .dc-shock-item:last-child {
                border-bottom: none;
            }

            /* Score Screen */
            .dc-score-card {
                text-align: center;
                padding: 40px;
            }

            .dc-score-gauge {
                position: relative;
                width: 200px;
                height: 200px;
                margin: 0 auto 24px;
            }

            .dc-score-circle {
                width: 100%;
                height: 100%;
                border-radius: 50%;
                background: conic-gradient(
                    var(--score-color) calc(var(--score) * 3.6deg),
                    #e2e8f0 0deg
                );
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .dc-score-inner {
                width: 160px;
                height: 160px;
                background: white;
                border-radius: 50%;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
            }

            .dc-score-number {
                font-size: 3rem;
                font-weight: 700;
                color: #1e293b;
                line-height: 1;
            }

            .dc-score-max {
                font-size: 1rem;
                color: #64748b;
            }

            .dc-score-risk {
                font-size: 1.25rem;
                font-weight: 600;
                padding: 8px 20px;
                border-radius: 20px;
                display: inline-block;
                margin-bottom: 24px;
            }

            .dc-score-risk.critical { background: #fee2e2; color: #991b1b; }
            .dc-score-risk.atrisk { background: #fef3c7; color: #92400e; }
            .dc-score-risk.improving { background: #fef9c3; color: #854d0e; }
            .dc-score-risk.compliant { background: #dcfce7; color: #166534; }
            .dc-score-risk.full { background: #d1fae5; color: #065f46; }

            .dc-score-breakdown {
                text-align: left;
                margin-top: 24px;
            }

            .dc-score-row {
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 12px;
            }

            .dc-score-row-label {
                width: 140px;
                font-weight: 500;
                color: #64748b;
            }

            .dc-score-row-bar {
                flex: 1;
                height: 8px;
                background: #e2e8f0;
                border-radius: 4px;
                overflow: hidden;
            }

            .dc-score-row-fill {
                height: 100%;
                background: #a404e4;
                border-radius: 4px;
                transition: width 0.5s ease-out;
            }

            .dc-score-row-value {
                width: 50px;
                text-align: right;
                font-weight: 600;
                color: #1e293b;
            }

            /* Action Plan */
            .dc-action-card {
                padding: 32px;
            }

            .dc-action-week {
                margin-bottom: 24px;
            }

            .dc-action-week-title {
                font-weight: 700;
                color: #1e293b;
                margin-bottom: 12px;
            }

            .dc-action-item {
                display: flex;
                align-items: flex-start;
                gap: 12px;
                padding: 12px 0;
                border-bottom: 1px solid #e2e8f0;
            }

            .dc-action-item:last-child {
                border-bottom: none;
            }

            .dc-action-check {
                width: 24px;
                height: 24px;
                border: 2px solid #cbd5e1;
                border-radius: 6px;
                flex-shrink: 0;
            }

            .dc-action-text {
                flex: 1;
                color: #1e293b;
            }

            .dc-action-lock {
                color: #64748b;
                font-size: 1.25rem;
            }

            .dc-action-item.locked {
                opacity: 0.6;
            }

            .dc-trial-box {
                background: linear-gradient(135deg, #a404e4 0%, #8501b9 100%);
                border-radius: 16px;
                padding: 32px;
                color: white;
                text-align: center;
                margin-top: 24px;
            }

            .dc-trial-title {
                font-size: 1.25rem;
                font-weight: 700;
                margin-bottom: 8px;
            }

            .dc-trial-desc {
                opacity: 0.9;
                margin-bottom: 20px;
            }

            .dc-trial-btn {
                display: inline-block;
                padding: 14px 32px;
                background: white;
                color: #a404e4;
                border-radius: 10px;
                font-weight: 600;
                text-decoration: none;
                margin-right: 12px;
                cursor: pointer;
                border: none;
                font-size: 1rem;
            }

            .dc-trial-btn.secondary {
                background: transparent;
                border: 2px solid white;
                color: white;
            }

            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }

            @keyframes countUp {
                from { opacity: 0; }
                to { opacity: 1; }
            }
        </style>
    `);

    // Render initial view
    $(wrapper).find('.layout-main-section').html(`
        <div class="dc-onboard-wrapper">
            <div class="dc-onboard-progress">
                <div class="dc-onboard-dot active" data-step="1"></div>
                <div class="dc-onboard-dot" data-step="2"></div>
                <div class="dc-onboard-dot" data-step="3"></div>
                <div class="dc-onboard-dot" data-step="4"></div>
            </div>

            <!-- Step 1: Company Scan -->
            <div class="dc-onboard-step active" data-step="1">
                <div class="dc-onboard-card">
                    <h1 class="dc-onboard-title">Let's assess your compliance risk</h1>
                    <p class="dc-onboard-subtitle">Answer a few questions to get your personalized score</p>

                    <div class="dc-onboard-form-group">
                        <label class="dc-onboard-label">Select your company</label>
                        <select class="dc-onboard-select" id="ob-company">
                            <option value="">-- Select Company --</option>
                        </select>
                    </div>

                    <button class="dc-onboard-btn" id="ob-step1-next">
                        Run Free Compliance Scan
                    </button>
                </div>
            </div>

            <!-- Step 2: Shock (Penalty Exposure) -->
            <div class="dc-onboard-step" data-step="2">
                <div class="dc-shock-card">
                    <div class="dc-shock-icon">⚠️</div>
                    <div class="dc-shock-label">Your Penalty Exposure</div>
                    <div class="dc-shock-amount" id="ob-penalty-amount">AED 0</div>
                    <div class="dc-shock-breakdown" id="ob-penalty-breakdown"></div>
                </div>
                <button class="dc-onboard-btn" id="ob-step2-next" style="margin-top: 24px;">
                    See Your Compliance Score
                </button>
            </div>

            <!-- Step 3: Relief (Score) -->
            <div class="dc-onboard-step" data-step="3">
                <div class="dc-onboard-card dc-score-card">
                    <h1 class="dc-onboard-title">Your DigiComply Score</h1>

                    <div class="dc-score-gauge">
                        <div class="dc-score-circle" id="ob-score-circle" style="--score: 0; --score-color: #ef4444;">
                            <div class="dc-score-inner">
                                <div class="dc-score-number" id="ob-score-number">0</div>
                                <div class="dc-score-max">/ 100</div>
                            </div>
                        </div>
                    </div>

                    <div class="dc-score-risk critical" id="ob-score-risk">Critical Risk</div>

                    <div class="dc-score-breakdown" id="ob-score-breakdown"></div>

                    <button class="dc-onboard-btn" id="ob-step3-next">
                        Show Me How to Fix This
                    </button>
                </div>
            </div>

            <!-- Step 4: Action Plan (Paywall) -->
            <div class="dc-onboard-step" data-step="4">
                <div class="dc-onboard-card dc-action-card">
                    <h1 class="dc-onboard-title">Your 30-Day Compliance Roadmap</h1>
                    <p class="dc-onboard-subtitle" id="ob-action-subtitle">4 actions to reach 100% compliance</p>

                    <div class="dc-action-week">
                        <div class="dc-action-week-title">Week 1: TRN Validation</div>
                        <div class="dc-action-item">
                            <div class="dc-action-check"></div>
                            <div class="dc-action-text">Validate company TRNs with FTA</div>
                        </div>
                        <div class="dc-action-item">
                            <div class="dc-action-check"></div>
                            <div class="dc-action-text">Bulk verify customer TRNs</div>
                        </div>
                    </div>

                    <div class="dc-action-week">
                        <div class="dc-action-week-title">Week 2: Reconciliation</div>
                        <div class="dc-action-item locked">
                            <div class="dc-action-check"></div>
                            <div class="dc-action-text">Auto-reconcile invoices</div>
                            <div class="dc-action-lock">🔒</div>
                        </div>
                        <div class="dc-action-item locked">
                            <div class="dc-action-check"></div>
                            <div class="dc-action-text">Resolve mismatches</div>
                            <div class="dc-action-lock">🔒</div>
                        </div>
                    </div>

                    <div class="dc-action-week">
                        <div class="dc-action-week-title">Week 3-4: Filing & Audit</div>
                        <div class="dc-action-item locked">
                            <div class="dc-action-check"></div>
                            <div class="dc-action-text">Generate VAT returns</div>
                            <div class="dc-action-lock">🔒</div>
                        </div>
                        <div class="dc-action-item locked">
                            <div class="dc-action-check"></div>
                            <div class="dc-action-text">Build audit trail</div>
                            <div class="dc-action-lock">🔒</div>
                        </div>
                    </div>

                    <div class="dc-trial-box">
                        <div class="dc-trial-title">Unlock Your Compliance Roadmap</div>
                        <div class="dc-trial-desc">Start your 14-day free trial. No credit card required.</div>
                        <button class="dc-trial-btn" id="ob-start-trial">Start Free Trial</button>
                        <button class="dc-trial-btn secondary" id="ob-talk-sales">Talk to Sales</button>
                    </div>
                </div>
            </div>
        </div>
    `);

    // Load companies
    frappe.call({
        method: 'frappe.client.get_list',
        args: {
            doctype: 'Company',
            fields: ['name'],
            limit_page_length: 0
        },
        callback: function(r) {
            if (r.message) {
                var $select = $(wrapper).find('#ob-company');
                r.message.forEach(function(c) {
                    $select.append('<option value="' + c.name + '">' + c.name + '</option>');
                });
            }
        }
    });

    // Step 1: Company selection
    $(wrapper).find('#ob-step1-next').on('click', function() {
        var company = $(wrapper).find('#ob-company').val();
        if (!company) {
            frappe.msgprint({
                title: __('Required'),
                indicator: 'orange',
                message: __('Please select a company')
            });
            return;
        }

        state.company = company;
        var $btn = $(this);
        $btn.prop('disabled', true).text('Scanning...');

        // Get penalty exposure
        frappe.call({
            method: 'digicomply.digicomply.api.compliance_score.get_penalty_breakdown',
            args: { company: company },
            callback: function(r) {
                if (r.message) {
                    state.penaltyData = r.message;
                    showPenaltyScreen(wrapper, r.message);
                    goToStep(wrapper, state, 2);
                }
                $btn.prop('disabled', false).text('Run Free Compliance Scan');
            },
            error: function() {
                $btn.prop('disabled', false).text('Run Free Compliance Scan');
            }
        });
    });

    // Step 2: See score
    $(wrapper).find('#ob-step2-next').on('click', function() {
        var $btn = $(this);
        $btn.prop('disabled', true).text('Calculating Score...');

        frappe.call({
            method: 'digicomply.digicomply.api.compliance_score.calculate_compliance_score',
            args: { company: state.company },
            callback: function(r) {
                if (r.message) {
                    state.scoreData = r.message;
                    showScoreScreen(wrapper, r.message);
                    goToStep(wrapper, state, 3);
                }
                $btn.prop('disabled', false).text('See Your Compliance Score');
            },
            error: function() {
                $btn.prop('disabled', false).text('See Your Compliance Score');
            }
        });
    });

    // Step 3: Show action plan
    $(wrapper).find('#ob-step3-next').on('click', function() {
        goToStep(wrapper, state, 4);
    });

    // Trial buttons
    $(wrapper).find('#ob-start-trial').on('click', function() {
        frappe.msgprint({
            title: __('Trial Started!'),
            indicator: 'green',
            message: __('Your 14-day free trial is now active. Welcome to DigiComply!')
        });
        setTimeout(function() {
            window.location.href = '/app/compliance-score-dashboard';
        }, 2000);
    });

    $(wrapper).find('#ob-talk-sales').on('click', function() {
        frappe.msgprint({
            title: __('Contact Sales'),
            indicator: 'blue',
            message: __('Our team will reach out to you shortly. Email: sales@digicomply.ae')
        });
    });

    function goToStep(wrapper, state, step) {
        state.step = step;

        // Update progress dots
        $(wrapper).find('.dc-onboard-dot').each(function() {
            var dotStep = parseInt($(this).data('step'));
            $(this).removeClass('active complete');
            if (dotStep < step) {
                $(this).addClass('complete');
            } else if (dotStep === step) {
                $(this).addClass('active');
            }
        });

        // Show step
        $(wrapper).find('.dc-onboard-step').removeClass('active');
        $(wrapper).find('.dc-onboard-step[data-step="' + step + '"]').addClass('active');
    }

    function showPenaltyScreen(wrapper, data) {
        // Animate penalty amount
        var $amount = $(wrapper).find('#ob-penalty-amount');
        animateValue($amount, 0, data.total, 1500);

        // Build breakdown
        var html = '';
        data.breakdown.forEach(function(item) {
            html += `
                <div class="dc-shock-item">
                    <span>${item.category}</span>
                    <span>AED ${formatNumber(item.amount)}</span>
                </div>
            `;
        });
        $(wrapper).find('#ob-penalty-breakdown').html(html);
    }

    function showScoreScreen(wrapper, data) {
        var score = data.score;

        // Determine color
        var color = '#ef4444';
        var riskClass = 'critical';
        if (score >= 90) { color = '#10b981'; riskClass = 'full'; }
        else if (score >= 80) { color = '#84cc16'; riskClass = 'compliant'; }
        else if (score >= 60) { color = '#eab308'; riskClass = 'improving'; }
        else if (score >= 40) { color = '#f59e0b'; riskClass = 'atrisk'; }

        // Animate score
        var $circle = $(wrapper).find('#ob-score-circle');
        var $number = $(wrapper).find('#ob-score-number');
        var $risk = $(wrapper).find('#ob-score-risk');

        $circle.css('--score-color', color);
        $risk.attr('class', 'dc-score-risk ' + riskClass).text(data.risk_level);

        // Animate
        $({ val: 0 }).animate({ val: score }, {
            duration: 1500,
            easing: 'swing',
            step: function(now) {
                $circle.css('--score', now);
                $number.text(Math.round(now));
            }
        });

        // Build breakdown bars
        var breakdown = data.breakdown;
        var html = '';

        var categories = [
            { key: 'trn_health', label: 'TRN Health', max: 30 },
            { key: 'reconciliation', label: 'Reconciliation', max: 30 },
            { key: 'filing', label: 'Filing Compliance', max: 25 },
            { key: 'data_integrity', label: 'Data Integrity', max: 15 }
        ];

        categories.forEach(function(cat) {
            var catData = breakdown[cat.key];
            var pct = (catData.score / cat.max) * 100;
            html += `
                <div class="dc-score-row">
                    <div class="dc-score-row-label">${cat.label}</div>
                    <div class="dc-score-row-bar">
                        <div class="dc-score-row-fill" style="width: ${pct}%"></div>
                    </div>
                    <div class="dc-score-row-value">${catData.score}/${cat.max}</div>
                </div>
            `;
        });

        $(wrapper).find('#ob-score-breakdown').html(html);
    }

    function animateValue($el, start, end, duration) {
        $({ val: start }).animate({ val: end }, {
            duration: duration,
            easing: 'swing',
            step: function(now) {
                $el.text('AED ' + formatNumber(Math.round(now)));
            }
        });
    }

    function formatNumber(num) {
        return new Intl.NumberFormat('en-AE').format(num);
    }
};
