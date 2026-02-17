// Copyright (c) 2024, DigiComply and contributors
// License: MIT

frappe.pages['penalty-calculator'].on_page_load = function(wrapper) {
    var page = frappe.ui.make_app_page({
        parent: wrapper,
        title: 'UAE VAT Penalty Calculator',
        single_column: true
    });

    // Add styles
    $('head').append(`
        <style id="penalty-calculator-styles">
            .dc-calc-wrapper {
                font-family: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif;
                max-width: 800px;
                margin: 0 auto;
                padding: 24px;
            }

            .dc-calc-hero {
                text-align: center;
                margin-bottom: 32px;
            }

            .dc-calc-hero h1 {
                font-size: 2rem;
                font-weight: 700;
                color: #1e293b;
                margin-bottom: 8px;
            }

            .dc-calc-hero p {
                color: #64748b;
                font-size: 1rem;
            }

            .dc-calc-card {
                background: white;
                border-radius: 16px;
                padding: 32px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
                margin-bottom: 24px;
            }

            .dc-calc-form-group {
                margin-bottom: 24px;
            }

            .dc-calc-label {
                display: block;
                font-weight: 600;
                color: #1e293b;
                margin-bottom: 8px;
                font-size: 0.875rem;
            }

            .dc-calc-input {
                width: 100%;
                padding: 12px 16px;
                border: 2px solid #e2e8f0;
                border-radius: 8px;
                font-size: 1rem;
                transition: border-color 0.2s;
            }

            .dc-calc-input:focus {
                outline: none;
                border-color: #a404e4;
            }

            .dc-calc-select {
                width: 100%;
                padding: 12px 16px;
                border: 2px solid #e2e8f0;
                border-radius: 8px;
                font-size: 1rem;
                background: white;
                cursor: pointer;
            }

            .dc-calc-slider-container {
                display: flex;
                align-items: center;
                gap: 16px;
            }

            .dc-calc-slider {
                flex: 1;
                height: 8px;
                -webkit-appearance: none;
                background: #e2e8f0;
                border-radius: 4px;
                outline: none;
            }

            .dc-calc-slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                width: 24px;
                height: 24px;
                background: #a404e4;
                border-radius: 50%;
                cursor: pointer;
            }

            .dc-calc-slider-value {
                font-weight: 700;
                color: #a404e4;
                min-width: 50px;
                text-align: right;
            }

            .dc-calc-radio-group {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }

            .dc-calc-radio {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px 16px;
                border: 2px solid #e2e8f0;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s;
            }

            .dc-calc-radio:hover {
                border-color: #a404e4;
            }

            .dc-calc-radio.selected {
                border-color: #a404e4;
                background: #faf5ff;
            }

            .dc-calc-radio input {
                display: none;
            }

            .dc-calc-radio-dot {
                width: 20px;
                height: 20px;
                border: 2px solid #cbd5e1;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .dc-calc-radio.selected .dc-calc-radio-dot {
                border-color: #a404e4;
            }

            .dc-calc-radio.selected .dc-calc-radio-dot::after {
                content: '';
                width: 10px;
                height: 10px;
                background: #a404e4;
                border-radius: 50%;
            }

            .dc-calc-btn {
                width: 100%;
                padding: 16px 32px;
                background: linear-gradient(135deg, #a404e4 0%, #8501b9 100%);
                color: white;
                border: none;
                border-radius: 12px;
                font-size: 1.125rem;
                font-weight: 600;
                cursor: pointer;
                transition: transform 0.2s, box-shadow 0.2s;
            }

            .dc-calc-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 20px rgba(164, 4, 228, 0.3);
            }

            .dc-calc-btn:disabled {
                opacity: 0.6;
                cursor: not-allowed;
                transform: none;
            }

            /* Results */
            .dc-calc-results {
                display: none;
            }

            .dc-calc-results.show {
                display: block;
                animation: fadeIn 0.3s ease-out;
            }

            .dc-penalty-card {
                background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                border-radius: 16px;
                padding: 32px;
                color: white;
                text-align: center;
                margin-bottom: 24px;
            }

            .dc-penalty-card.risk-low {
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            }

            .dc-penalty-card.risk-medium {
                background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            }

            .dc-penalty-card.risk-high {
                background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            }

            .dc-penalty-card.risk-critical {
                background: linear-gradient(135deg, #991b1b 0%, #7f1d1d 100%);
            }

            .dc-penalty-label {
                font-size: 0.875rem;
                text-transform: uppercase;
                letter-spacing: 0.1em;
                opacity: 0.9;
                margin-bottom: 8px;
            }

            .dc-penalty-amount {
                font-size: 3rem;
                font-weight: 700;
                margin-bottom: 8px;
            }

            .dc-penalty-risk {
                font-size: 1.125rem;
                font-weight: 600;
            }

            .dc-breakdown-card {
                background: white;
                border-radius: 16px;
                padding: 24px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
                margin-bottom: 24px;
            }

            .dc-breakdown-title {
                font-size: 1.125rem;
                font-weight: 700;
                color: #1e293b;
                margin-bottom: 16px;
            }

            .dc-breakdown-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 0;
                border-bottom: 1px solid #e2e8f0;
            }

            .dc-breakdown-item:last-child {
                border-bottom: none;
            }

            .dc-breakdown-category {
                font-weight: 600;
                color: #1e293b;
            }

            .dc-breakdown-desc {
                font-size: 0.875rem;
                color: #64748b;
            }

            .dc-breakdown-amount {
                font-weight: 700;
                color: #ef4444;
            }

            .dc-breakdown-pct {
                font-size: 0.75rem;
                color: #64748b;
                margin-left: 8px;
            }

            .dc-cta-card {
                background: linear-gradient(135deg, #a404e4 0%, #8501b9 100%);
                border-radius: 16px;
                padding: 32px;
                color: white;
                text-align: center;
            }

            .dc-cta-title {
                font-size: 1.5rem;
                font-weight: 700;
                margin-bottom: 8px;
            }

            .dc-cta-desc {
                opacity: 0.9;
                margin-bottom: 24px;
            }

            .dc-cta-btn {
                display: inline-block;
                padding: 16px 32px;
                background: white;
                color: #a404e4;
                border-radius: 12px;
                font-weight: 600;
                text-decoration: none;
                transition: transform 0.2s;
            }

            .dc-cta-btn:hover {
                transform: translateY(-2px);
            }

            .dc-trust-badges {
                text-align: center;
                margin-top: 32px;
                color: #64748b;
                font-size: 0.875rem;
            }

            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }

            @media (max-width: 768px) {
                .dc-calc-wrapper { padding: 16px; }
                .dc-penalty-amount { font-size: 2rem; }
            }
        </style>
    `);

    // Render calculator
    $(wrapper).find('.layout-main-section').html(`
        <div class="dc-calc-wrapper">
            <div class="dc-calc-hero">
                <h1>UAE VAT Penalty Calculator</h1>
                <p>Free tool for finance teams - Calculate your potential penalty exposure</p>
            </div>

            <!-- Calculator Form -->
            <div class="dc-calc-card dc-calc-form">
                <div class="dc-calc-form-group">
                    <label class="dc-calc-label">Company / Group Name</label>
                    <input type="text" class="dc-calc-input" id="calc-company" placeholder="Enter your company name">
                </div>

                <div class="dc-calc-form-group">
                    <label class="dc-calc-label">Number of TRNs in your group</label>
                    <input type="number" class="dc-calc-input" id="calc-trn-count" value="1" min="1" max="100">
                </div>

                <div class="dc-calc-form-group">
                    <label class="dc-calc-label">Monthly invoice volume</label>
                    <select class="dc-calc-select" id="calc-volume">
                        <option value="<500">Less than 500</option>
                        <option value="500-2K">500 - 2,000</option>
                        <option value="2K-10K">2,000 - 10,000</option>
                        <option value="10K+">More than 10,000</option>
                    </select>
                </div>

                <div class="dc-calc-form-group">
                    <label class="dc-calc-label">Have you filed all VAT returns on time?</label>
                    <div class="dc-calc-radio-group" id="calc-filing-status">
                        <label class="dc-calc-radio selected" data-value="All on time">
                            <input type="radio" name="filing" checked>
                            <span class="dc-calc-radio-dot"></span>
                            <span>Yes, all on time</span>
                        </label>
                        <label class="dc-calc-radio" data-value="Some late">
                            <input type="radio" name="filing">
                            <span class="dc-calc-radio-dot"></span>
                            <span>Some were late</span>
                        </label>
                        <label class="dc-calc-radio" data-value="Pending returns">
                            <input type="radio" name="filing">
                            <span class="dc-calc-radio-dot"></span>
                            <span>We have pending/unfiled returns</span>
                        </label>
                    </div>
                </div>

                <div class="dc-calc-form-group">
                    <label class="dc-calc-label">What % of your TRNs are FTA-validated?</label>
                    <div class="dc-calc-slider-container">
                        <input type="range" class="dc-calc-slider" id="calc-trn-pct" min="0" max="100" value="50">
                        <span class="dc-calc-slider-value" id="calc-trn-pct-value">50%</span>
                    </div>
                </div>

                <div class="dc-calc-form-group">
                    <label class="dc-calc-label">What % of invoices are reconciled?</label>
                    <div class="dc-calc-slider-container">
                        <input type="range" class="dc-calc-slider" id="calc-recon-pct" min="0" max="100" value="70">
                        <span class="dc-calc-slider-value" id="calc-recon-pct-value">70%</span>
                    </div>
                </div>

                <div class="dc-calc-form-group">
                    <label class="dc-calc-label">Email (optional - to receive your report)</label>
                    <input type="email" class="dc-calc-input" id="calc-email" placeholder="your@email.com">
                </div>

                <button class="dc-calc-btn" id="calc-submit">
                    Calculate My Risk
                </button>
            </div>

            <!-- Results (hidden initially) -->
            <div class="dc-calc-results" id="calc-results">
                <div class="dc-penalty-card" id="penalty-card">
                    <div class="dc-penalty-label">Estimated Penalty Exposure</div>
                    <div class="dc-penalty-amount" id="penalty-amount">AED 0</div>
                    <div class="dc-penalty-risk" id="penalty-risk">Risk Level: Low</div>
                </div>

                <div class="dc-breakdown-card">
                    <div class="dc-breakdown-title">Breakdown</div>
                    <div id="penalty-breakdown"></div>
                </div>

                <div class="dc-cta-card">
                    <div class="dc-cta-title">Want to reduce this to AED 0?</div>
                    <div class="dc-cta-desc">Get your free DigiComply Score and see exactly how to become fully compliant.</div>
                    <a href="/app/compliance-onboarding" class="dc-cta-btn">Get Your Free Compliance Score</a>
                </div>
            </div>

            <div class="dc-trust-badges">
                <p>Used by 2,400+ UAE finance teams</p>
            </div>
        </div>
    `);

    // Event handlers
    // Radio buttons
    $(wrapper).find('.dc-calc-radio').on('click', function() {
        $(this).closest('.dc-calc-radio-group').find('.dc-calc-radio').removeClass('selected');
        $(this).addClass('selected');
        $(this).find('input').prop('checked', true);
    });

    // Sliders
    $(wrapper).find('#calc-trn-pct').on('input', function() {
        $(wrapper).find('#calc-trn-pct-value').text($(this).val() + '%');
    });

    $(wrapper).find('#calc-recon-pct').on('input', function() {
        $(wrapper).find('#calc-recon-pct-value').text($(this).val() + '%');
    });

    // Submit
    $(wrapper).find('#calc-submit').on('click', function() {
        var $btn = $(this);
        var company = $(wrapper).find('#calc-company').val().trim();

        if (!company) {
            frappe.msgprint({
                title: __('Required'),
                indicator: 'red',
                message: __('Please enter your company name')
            });
            return;
        }

        var data = {
            company_name: company,
            email: $(wrapper).find('#calc-email').val().trim(),
            trn_count: $(wrapper).find('#calc-trn-count').val() || 1,
            invoice_volume: $(wrapper).find('#calc-volume').val(),
            filing_status: $(wrapper).find('.dc-calc-radio.selected').data('value'),
            trn_validated_pct: $(wrapper).find('#calc-trn-pct').val(),
            reconciled_pct: $(wrapper).find('#calc-recon-pct').val()
        };

        $btn.prop('disabled', true).text('Calculating...');

        frappe.call({
            method: 'digicomply.digicomply.api.compliance_score.submit_calculator',
            args: data,
            callback: function(r) {
                $btn.prop('disabled', false).text('Calculate My Risk');

                if (r.message) {
                    showResults(wrapper, r.message);
                }
            },
            error: function() {
                $btn.prop('disabled', false).text('Calculate My Risk');
                frappe.msgprint({
                    title: __('Error'),
                    indicator: 'red',
                    message: __('An error occurred. Please try again.')
                });
            }
        });
    });

    function showResults(wrapper, data) {
        var $results = $(wrapper).find('#calc-results');
        var $card = $(wrapper).find('#penalty-card');

        // Update penalty amount
        $(wrapper).find('#penalty-amount').text('AED ' + formatNumber(data.penalty_exposure));
        $(wrapper).find('#penalty-risk').text('Risk Level: ' + data.risk_level);

        // Update card color based on risk
        $card.removeClass('risk-low risk-medium risk-high risk-critical');
        $card.addClass('risk-' + data.risk_level.toLowerCase());

        // Build breakdown
        var breakdownHtml = '';
        data.breakdown.forEach(function(item) {
            breakdownHtml += `
                <div class="dc-breakdown-item">
                    <div>
                        <div class="dc-breakdown-category">${item.category}</div>
                        <div class="dc-breakdown-desc">${item.description}</div>
                    </div>
                    <div>
                        <span class="dc-breakdown-amount">AED ${formatNumber(item.amount)}</span>
                        <span class="dc-breakdown-pct">(${item.percentage}%)</span>
                    </div>
                </div>
            `;
        });
        $(wrapper).find('#penalty-breakdown').html(breakdownHtml);

        // Show results
        $results.addClass('show');

        // Scroll to results
        $('html, body').animate({
            scrollTop: $results.offset().top - 100
        }, 500);
    }

    function formatNumber(num) {
        return new Intl.NumberFormat('en-AE').format(Math.round(num));
    }
};
