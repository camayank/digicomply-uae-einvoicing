frappe.pages['compliance_analytics'].on_page_load = function(wrapper) {
    const page = frappe.ui.make_app_page({
        parent: wrapper,
        title: 'Compliance Analytics',
        single_column: true
    });

    new ComplianceAnalytics(page);
};

class ComplianceAnalytics {
    constructor(page) {
        this.page = page;
        this.company = frappe.defaults.get_user_default('company');
        this.make();
    }

    make() {
        this.page.add_field({
            fieldname: 'company',
            label: __('Company'),
            fieldtype: 'Link',
            options: 'Company',
            default: this.company,
            change: () => {
                this.company = this.page.fields_dict.company.get_value();
                this.refresh();
            }
        });

        this.page.add_button(__('Refresh Score'), () => this.refresh_score(), 'primary');

        this.$container = $('<div class="dc-analytics"></div>').appendTo(this.page.body);
        this.render();
        this.refresh();
    }

    render() {
        this.$container.html(`
            <style>
                .dc-analytics { padding: 20px; font-family: 'Poppins', sans-serif; }
                .dc-score-hero {
                    background: linear-gradient(135deg, #a404e4, #8501b9);
                    color: white;
                    padding: 40px;
                    border-radius: 16px;
                    text-align: center;
                    margin-bottom: 24px;
                }
                .dc-score-value {
                    font-size: 72px;
                    font-weight: 700;
                    line-height: 1;
                }
                .dc-score-grade {
                    font-size: 24px;
                    opacity: 0.9;
                    margin-top: 8px;
                }
                .dc-score-change {
                    margin-top: 16px;
                    padding: 8px 16px;
                    background: rgba(255,255,255,0.2);
                    border-radius: 20px;
                    display: inline-block;
                }
                .dc-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 24px; }
                .dc-card {
                    background: white;
                    border-radius: 12px;
                    padding: 20px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                }
                .dc-card h4 {
                    color: #64748b;
                    font-size: 12px;
                    text-transform: uppercase;
                    margin: 0 0 8px 0;
                }
                .dc-card .value {
                    font-size: 28px;
                    font-weight: 600;
                    color: #1e293b;
                }
                .dc-card .max { color: #94a3b8; font-size: 14px; }
                .dc-progress-bar {
                    height: 8px;
                    background: #e2e8f0;
                    border-radius: 4px;
                    margin-top: 12px;
                    overflow: hidden;
                }
                .dc-progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #a404e4, #8501b9);
                    border-radius: 4px;
                    transition: width 0.5s ease;
                }
                .dc-chart-container {
                    background: white;
                    border-radius: 12px;
                    padding: 24px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                }
                .dc-chart-container h3 {
                    margin: 0 0 20px 0;
                    color: #1e293b;
                }
            </style>

            <div class="dc-score-hero">
                <div class="dc-score-value" id="total-score">--</div>
                <div class="dc-score-grade" id="score-grade">Loading...</div>
                <div class="dc-score-change" id="score-change"></div>
            </div>

            <div class="dc-grid" id="score-components">
                <div class="dc-card">
                    <h4>TRN Validity</h4>
                    <div class="value"><span id="trn-score">--</span> <span class="max">/ 20</span></div>
                    <div class="dc-progress-bar"><div class="dc-progress-fill" id="trn-bar" style="width: 0%"></div></div>
                </div>
                <div class="dc-card">
                    <h4>Reconciliation</h4>
                    <div class="value"><span id="recon-score">--</span> <span class="max">/ 25</span></div>
                    <div class="dc-progress-bar"><div class="dc-progress-fill" id="recon-bar" style="width: 0%"></div></div>
                </div>
                <div class="dc-card">
                    <h4>VAT Accuracy</h4>
                    <div class="value"><span id="vat-score">--</span> <span class="max">/ 25</span></div>
                    <div class="dc-progress-bar"><div class="dc-progress-fill" id="vat-bar" style="width: 0%"></div></div>
                </div>
                <div class="dc-card">
                    <h4>Filing Compliance</h4>
                    <div class="value"><span id="filing-score">--</span> <span class="max">/ 20</span></div>
                    <div class="dc-progress-bar"><div class="dc-progress-fill" id="filing-bar" style="width: 0%"></div></div>
                </div>
                <div class="dc-card">
                    <h4>Data Quality</h4>
                    <div class="value"><span id="data-score">--</span> <span class="max">/ 10</span></div>
                    <div class="dc-progress-bar"><div class="dc-progress-fill" id="data-bar" style="width: 0%"></div></div>
                </div>
            </div>

            <div class="dc-chart-container">
                <h3>Score Trend (Last 90 Days)</h3>
                <div id="trend-chart" style="height: 300px;"></div>
            </div>
        `);
    }

    refresh() {
        if (!this.company) return;

        frappe.call({
            method: 'digicomply.digicomply.doctype.score_history.score_history.calculate_current_score',
            args: { company: this.company },
            callback: (r) => {
                if (r.message) this.update_scores(r.message);
            }
        });

        frappe.call({
            method: 'digicomply.digicomply.doctype.score_history.score_history.get_score_trend',
            args: { company: this.company, days: 90 },
            callback: (r) => {
                if (r.message) this.render_trend(r.message);
            }
        });
    }

    update_scores(data) {
        $('#total-score').text(data.total_score.toFixed(1));
        $('#score-grade').text(this.get_grade(data.total_score));

        $('#trn-score').text(data.trn_validity_score.toFixed(1));
        $('#trn-bar').css('width', (data.trn_validity_score / 20 * 100) + '%');

        $('#recon-score').text(data.reconciliation_score.toFixed(1));
        $('#recon-bar').css('width', (data.reconciliation_score / 25 * 100) + '%');

        $('#vat-score').text(data.vat_accuracy_score.toFixed(1));
        $('#vat-bar').css('width', (data.vat_accuracy_score / 25 * 100) + '%');

        $('#filing-score').text(data.filing_compliance_score.toFixed(1));
        $('#filing-bar').css('width', (data.filing_compliance_score / 20 * 100) + '%');

        $('#data-score').text(data.data_quality_score.toFixed(1));
        $('#data-bar').css('width', (data.data_quality_score / 10 * 100) + '%');
    }

    get_grade(score) {
        if (score >= 95) return 'Grade: A+ (Excellent)';
        if (score >= 90) return 'Grade: A (Very Good)';
        if (score >= 85) return 'Grade: B+ (Good)';
        if (score >= 80) return 'Grade: B (Satisfactory)';
        if (score >= 70) return 'Grade: C (Needs Improvement)';
        return 'Grade: D (Poor)';
    }

    render_trend(data) {
        if (!data.length) {
            $('#trend-chart').html('<p class="text-muted text-center">No historical data available</p>');
            return;
        }

        const labels = data.map(d => d.score_date);
        const scores = data.map(d => d.total_score);

        new frappe.Chart('#trend-chart', {
            data: {
                labels: labels,
                datasets: [{
                    name: 'Compliance Score',
                    values: scores
                }]
            },
            type: 'line',
            colors: ['#a404e4'],
            lineOptions: { regionFill: 1 },
            axisOptions: { xIsSeries: true }
        });
    }

    refresh_score() {
        if (!this.company) {
            frappe.msgprint('Please select a company');
            return;
        }

        frappe.call({
            method: 'digicomply.digicomply.doctype.score_history.score_history.refresh_score',
            args: { company: this.company },
            callback: (r) => {
                if (r.message && r.message.success) {
                    frappe.msgprint(`Score updated: ${r.message.score}`);
                    this.refresh();
                }
            }
        });
    }
}
