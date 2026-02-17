frappe.pages['trn-health-center'].on_page_load = function(wrapper) {
    new TRNHealthCenter(wrapper);
};

class TRNHealthCenter {
    constructor(wrapper) {
        this.wrapper = wrapper;
        this.page = frappe.ui.make_app_page({
            parent: wrapper,
            title: __('TRN Health Center'),
            single_column: true
        });

        this.selected_company = null;
        this.trn_data = { summary: {}, trns: [] };

        this.make();
        this.load_data();
    }

    make() {
        this.add_styles();
        this.setup_page_actions();
        this.render_page();
        this.setup_events();
    }

    add_styles() {
        // Add Google Fonts
        if (!$('#dc-google-fonts').length) {
            $('head').append('<link id="dc-google-fonts" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">');
        }

        const styles = `
            <style>
                :root {
                    --dc-primary: #a404e4;
                    --dc-primary-dark: #8501b9;
                    --dc-text-dark: #1e293b;
                    --dc-text-muted: #64748b;
                    --dc-border: #e2e8f0;
                    --dc-success: #10b981;
                    --dc-warning: #f59e0b;
                    --dc-danger: #ef4444;
                    --dc-radius: 12px;
                    --dc-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
                }

                /* TRN Health Center Styles */
                .dc-trn-health-container {
                    padding: 20px;
                    max-width: 1400px;
                    margin: 0 auto;
                    font-family: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif;
                }

                /* Header Section */
                .dc-trn-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 24px;
                    flex-wrap: wrap;
                    gap: 16px;
                }

                .dc-trn-header-left {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }

                .dc-trn-header-right {
                    display: flex;
                    gap: 12px;
                }

                .dc-company-filter {
                    min-width: 280px;
                }

                /* Summary Cards */
                .dc-summary-cards {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 20px;
                    margin-bottom: 32px;
                }

                @media (max-width: 1024px) {
                    .dc-summary-cards {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }

                @media (max-width: 576px) {
                    .dc-summary-cards {
                        grid-template-columns: 1fr;
                    }
                }

                .dc-summary-card {
                    background: #fff;
                    border-radius: 12px;
                    padding: 24px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
                    border-left: 4px solid #e5e7eb;
                    transition: all 0.3s ease;
                }

                .dc-summary-card:hover {
                    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
                    transform: translateY(-2px);
                }

                .dc-summary-card-valid {
                    border-left-color: #10b981;
                }

                .dc-summary-card-invalid {
                    border-left-color: #ef4444;
                }

                .dc-summary-card-expired {
                    border-left-color: #f59e0b;
                }

                .dc-summary-card-not-validated {
                    border-left-color: #a404e4;
                }

                .dc-summary-card-title {
                    font-size: 13px;
                    color: #6b7280;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 8px;
                    font-weight: 500;
                }

                .dc-summary-card-value {
                    font-size: 36px;
                    font-weight: 700;
                    line-height: 1;
                }

                .dc-summary-card-valid .dc-summary-card-value { color: #10b981; }
                .dc-summary-card-invalid .dc-summary-card-value { color: #ef4444; }
                .dc-summary-card-expired .dc-summary-card-value { color: #f59e0b; }
                .dc-summary-card-not-validated .dc-summary-card-value { color: #a404e4; }

                .dc-summary-card-label {
                    font-size: 14px;
                    color: #374151;
                    margin-top: 8px;
                    font-weight: 500;
                }

                /* TRN Table Section */
                .dc-trn-table-section {
                    background: #fff;
                    border-radius: 12px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
                    overflow: hidden;
                }

                .dc-trn-table-header {
                    background: linear-gradient(135deg, #a404e4 0%, #8501b9 100%);
                    color: #fff;
                    padding: 20px 24px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .dc-trn-table-title {
                    font-size: 18px;
                    font-weight: 600;
                    margin: 0;
                }

                .dc-trn-table-count {
                    font-size: 14px;
                    opacity: 0.9;
                }

                .dc-trn-table-wrapper {
                    overflow-x: auto;
                }

                .dc-trn-table {
                    width: 100%;
                    border-collapse: collapse;
                }

                .dc-trn-table th {
                    background: #f9fafb;
                    padding: 14px 16px;
                    text-align: left;
                    font-size: 12px;
                    font-weight: 600;
                    color: #374151;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    border-bottom: 1px solid #e5e7eb;
                }

                .dc-trn-table td {
                    padding: 16px;
                    border-bottom: 1px solid #f3f4f6;
                    font-size: 14px;
                    color: #374151;
                }

                .dc-trn-table tr:hover {
                    background: #faf5ff;
                }

                .dc-trn-table tr:last-child td {
                    border-bottom: none;
                }

                .dc-trn-number {
                    font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
                    font-size: 13px;
                    color: #1f2937;
                    font-weight: 500;
                }

                .dc-trn-entity {
                    font-weight: 500;
                    color: #111827;
                }

                .dc-trn-company {
                    font-size: 13px;
                    color: #6b7280;
                }

                .dc-trn-primary-badge {
                    background: #dbeafe;
                    color: #1d4ed8;
                    font-size: 10px;
                    padding: 2px 6px;
                    border-radius: 4px;
                    margin-left: 8px;
                    font-weight: 600;
                    text-transform: uppercase;
                }

                /* Status Badges */
                .dc-status-badge {
                    display: inline-flex;
                    align-items: center;
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 600;
                    text-transform: capitalize;
                }

                .dc-status-valid {
                    background: #d1fae5;
                    color: #065f46;
                }

                .dc-status-invalid {
                    background: #fee2e2;
                    color: #991b1b;
                }

                .dc-status-expired {
                    background: #fef3c7;
                    color: #92400e;
                }

                .dc-status-not-validated,
                .dc-status-pending-verification {
                    background: #f3e8ff;
                    color: #7c3aed;
                }

                .dc-last-validated {
                    font-size: 13px;
                    color: #6b7280;
                }

                .dc-never-validated {
                    font-style: italic;
                    color: #9ca3af;
                }

                /* Buttons */
                .dc-btn {
                    padding: 10px 20px;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    border: none;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                }

                .dc-btn-primary {
                    background: #a404e4;
                    color: #fff;
                }

                .dc-btn-primary:hover {
                    background: #8a03c2;
                }

                .dc-btn-primary:disabled {
                    background: #d8b4fe;
                    cursor: not-allowed;
                }

                .dc-btn-secondary {
                    background: #f3f4f6;
                    color: #374151;
                    border: 1px solid #e5e7eb;
                }

                .dc-btn-secondary:hover {
                    background: #e5e7eb;
                    border-color: #a404e4;
                    color: #a404e4;
                }

                .dc-btn-sm {
                    padding: 6px 12px;
                    font-size: 12px;
                    border-radius: 6px;
                }

                .dc-btn-validate {
                    background: #faf5ff;
                    color: #a404e4;
                    border: 1px solid #e9d5ff;
                }

                .dc-btn-validate:hover {
                    background: #a404e4;
                    color: #fff;
                    border-color: #a404e4;
                }

                /* Empty State */
                .dc-empty-state {
                    text-align: center;
                    padding: 60px 20px;
                    color: #6b7280;
                }

                .dc-empty-state-icon {
                    font-size: 48px;
                    margin-bottom: 16px;
                    opacity: 0.5;
                }

                .dc-empty-state-title {
                    font-size: 18px;
                    font-weight: 600;
                    color: #374151;
                    margin-bottom: 8px;
                }

                .dc-empty-state-text {
                    font-size: 14px;
                    max-width: 400px;
                    margin: 0 auto;
                }

                /* Loading State */
                .dc-loading {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    padding: 60px 20px;
                }

                .dc-loading-spinner {
                    width: 40px;
                    height: 40px;
                    border: 3px solid #f3e8ff;
                    border-top-color: #a404e4;
                    border-radius: 50%;
                    animation: dc-spin 1s linear infinite;
                }

                @keyframes dc-spin {
                    to { transform: rotate(360deg); }
                }

                /* Responsive adjustments */
                @media (max-width: 768px) {
                    .dc-trn-header {
                        flex-direction: column;
                        align-items: stretch;
                    }

                    .dc-trn-header-left,
                    .dc-trn-header-right {
                        width: 100%;
                    }

                    .dc-company-filter {
                        width: 100%;
                    }

                    .dc-btn {
                        flex: 1;
                        justify-content: center;
                    }

                    .dc-trn-table th:nth-child(3),
                    .dc-trn-table td:nth-child(3) {
                        display: none;
                    }
                }
            </style>
        `;
        $(this.wrapper).prepend(styles);
    }

    setup_page_actions() {
        // Primary action - Bulk Validate
        this.page.set_primary_action(
            __('Bulk Validate'),
            () => this.bulk_validate(),
            'octicon octicon-sync'
        );

        // Secondary action - Refresh
        this.page.set_secondary_action(
            __('Refresh'),
            () => this.load_data(),
            'octicon octicon-refresh'
        );
    }

    render_page() {
        const html = `
            <div class="dc-trn-health-container">
                <div class="dc-trn-header">
                    <div class="dc-trn-header-left">
                        <div class="dc-company-filter"></div>
                    </div>
                </div>

                <div class="dc-summary-cards">
                    <div class="dc-summary-card dc-summary-card-valid">
                        <div class="dc-summary-card-title">Valid TRNs</div>
                        <div class="dc-summary-card-value" id="dc-valid-count">-</div>
                        <div class="dc-summary-card-label">Verified with FTA</div>
                    </div>
                    <div class="dc-summary-card dc-summary-card-invalid">
                        <div class="dc-summary-card-title">Invalid TRNs</div>
                        <div class="dc-summary-card-value" id="dc-invalid-count">-</div>
                        <div class="dc-summary-card-label">Failed validation</div>
                    </div>
                    <div class="dc-summary-card dc-summary-card-expired">
                        <div class="dc-summary-card-title">Expired TRNs</div>
                        <div class="dc-summary-card-value" id="dc-expired-count">-</div>
                        <div class="dc-summary-card-label">Past expiry date</div>
                    </div>
                    <div class="dc-summary-card dc-summary-card-not-validated">
                        <div class="dc-summary-card-title">Not Validated</div>
                        <div class="dc-summary-card-value" id="dc-not-validated-count">-</div>
                        <div class="dc-summary-card-label">Pending verification</div>
                    </div>
                </div>

                <div class="dc-trn-table-section">
                    <div class="dc-trn-table-header">
                        <h3 class="dc-trn-table-title">TRN Registry</h3>
                        <span class="dc-trn-table-count" id="dc-trn-table-count">Loading...</span>
                    </div>
                    <div class="dc-trn-table-content">
                        <div class="dc-loading">
                            <div class="dc-loading-spinner"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        $(this.page.body).html(html);

        // Add company filter control
        this.company_field = frappe.ui.form.make_control({
            df: {
                fieldtype: 'Link',
                options: 'Company',
                fieldname: 'company',
                placeholder: __('All Companies'),
                change: () => {
                    this.selected_company = this.company_field.get_value();
                    this.load_data();
                }
            },
            parent: $(this.page.body).find('.dc-company-filter'),
            render_input: true
        });
    }

    setup_events() {
        const me = this;

        // Validate button click
        $(this.page.body).on('click', '.dc-btn-validate', function() {
            const trn_name = $(this).data('trn');
            me.validate_single(trn_name, $(this));
        });
    }

    load_data() {
        const me = this;

        // Show loading state
        $(this.page.body).find('.dc-trn-table-content').html(`
            <div class="dc-loading">
                <div class="dc-loading-spinner"></div>
            </div>
        `);

        frappe.call({
            method: 'digicomply.digicomply.page.trn_health_center.trn_health_center.get_trn_health_data',
            args: {
                company: this.selected_company || null
            },
            callback: function(r) {
                if (r.message) {
                    me.trn_data = r.message;
                    me.update_summary(r.message.summary);
                    me.render_trn_table(r.message.trns);
                }
            },
            error: function() {
                me.render_error();
            }
        });
    }

    update_summary(summary) {
        $('#dc-valid-count').text(summary.valid || 0);
        $('#dc-invalid-count').text(summary.invalid || 0);
        $('#dc-expired-count').text(summary.expired || 0);
        $('#dc-not-validated-count').text(summary.not_validated || 0);
        $('#dc-trn-table-count').text(__('Total: {0} TRNs', [summary.total || 0]));
    }

    render_trn_table(trns) {
        if (!trns || trns.length === 0) {
            this.render_empty_state();
            return;
        }

        const rows = trns.map(trn => this.render_trn_row(trn)).join('');

        const html = `
            <div class="dc-trn-table-wrapper">
                <table class="dc-trn-table">
                    <thead>
                        <tr>
                            <th>TRN Number</th>
                            <th>Entity</th>
                            <th>Company</th>
                            <th>Status</th>
                            <th>Last Validated</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>
        `;

        $(this.page.body).find('.dc-trn-table-content').html(html);
    }

    render_trn_row(trn) {
        const escaped_name = frappe.utils.escape_html(trn.name);
        const escaped_trn = frappe.utils.escape_html(trn.trn || '');
        const escaped_entity = frappe.utils.escape_html(trn.entity_name || '-');
        const escaped_company = frappe.utils.escape_html(trn.company || '-');

        const status = trn.validation_status || 'Not Validated';
        const status_class = this.get_status_class(status);
        const escaped_status = frappe.utils.escape_html(status);

        const primary_badge = trn.is_primary
            ? '<span class="dc-trn-primary-badge">Primary</span>'
            : '';

        let last_validated = '<span class="dc-never-validated">Never</span>';
        if (trn.last_validated) {
            last_validated = frappe.datetime.prettyDate(trn.last_validated);
        }

        return `
            <tr data-name="${escaped_name}">
                <td>
                    <span class="dc-trn-number">${escaped_trn}</span>
                </td>
                <td>
                    <span class="dc-trn-entity">
                        <a href="/app/trn-registry/${escaped_name}">${escaped_entity}</a>
                    </span>
                    ${primary_badge}
                </td>
                <td>
                    <span class="dc-trn-company">${escaped_company}</span>
                </td>
                <td>
                    <span class="dc-status-badge dc-status-${status_class}">${escaped_status}</span>
                </td>
                <td>
                    <span class="dc-last-validated">${last_validated}</span>
                </td>
                <td>
                    <button class="dc-btn dc-btn-sm dc-btn-validate" data-trn="${escaped_name}">
                        Validate
                    </button>
                </td>
            </tr>
        `;
    }

    get_status_class(status) {
        const status_map = {
            'Valid': 'valid',
            'Invalid': 'invalid',
            'Expired': 'expired',
            'Not Validated': 'not-validated',
            'Pending Verification': 'pending-verification'
        };
        return status_map[status] || 'not-validated';
    }

    render_empty_state() {
        const html = `
            <div class="dc-empty-state">
                <div class="dc-empty-state-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                </div>
                <div class="dc-empty-state-title">No TRNs Found</div>
                <div class="dc-empty-state-text">
                    ${this.selected_company
                        ? __('No TRNs are registered for this company. Add TRNs in the TRN Registry.')
                        : __('No TRNs are registered yet. Start by adding TRNs to the TRN Registry.')}
                </div>
            </div>
        `;
        $(this.page.body).find('.dc-trn-table-content').html(html);
    }

    render_error() {
        const html = `
            <div class="dc-empty-state">
                <div class="dc-empty-state-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="1.5">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                </div>
                <div class="dc-empty-state-title">Error Loading Data</div>
                <div class="dc-empty-state-text">
                    ${__('Unable to load TRN data. Please try refreshing the page.')}
                </div>
            </div>
        `;
        $(this.page.body).find('.dc-trn-table-content').html(html);
    }

    validate_single(trn_name, $button) {
        const original_text = $button.text();
        $button.prop('disabled', true).text(__('Validating...'));

        frappe.call({
            method: 'digicomply.digicomply.page.trn_health_center.trn_health_center.validate_single_trn',
            args: {
                trn_name: trn_name
            },
            callback: (r) => {
                if (r.message) {
                    if (r.message.success) {
                        frappe.show_alert({
                            message: __('TRN validated successfully: {0}', [r.message.status]),
                            indicator: 'green'
                        });
                    } else {
                        frappe.show_alert({
                            message: r.message.message || __('Validation failed'),
                            indicator: 'orange'
                        });
                    }
                    // Reload data to reflect changes
                    this.load_data();
                }
            },
            error: () => {
                frappe.show_alert({
                    message: __('Error validating TRN'),
                    indicator: 'red'
                });
            },
            always: () => {
                $button.prop('disabled', false).text(original_text);
            }
        });
    }

    bulk_validate() {
        const me = this;
        const company_text = this.selected_company
            ? __('for {0}', [this.selected_company])
            : __('for all companies');

        frappe.confirm(
            __('This will validate all TRNs {0}. Continue?', [company_text]),
            function() {
                // Yes
                frappe.show_progress(
                    __('Validating TRNs'),
                    0,
                    100,
                    __('Starting bulk validation...')
                );

                frappe.call({
                    method: 'digicomply.digicomply.page.trn_health_center.trn_health_center.bulk_validate_all',
                    args: {
                        company: me.selected_company || null
                    },
                    callback: function(r) {
                        frappe.hide_progress();

                        if (r.message) {
                            const results = r.message.results || {};
                            if (r.message.success) {
                                frappe.msgprint({
                                    title: __('Bulk Validation Complete'),
                                    message: __('Validated {0} TRNs:<br>- Valid: {1}<br>- Invalid: {2}<br>- Errors: {3}', [
                                        results.total,
                                        results.valid,
                                        results.invalid,
                                        results.errors
                                    ]),
                                    indicator: 'green'
                                });
                            } else {
                                frappe.msgprint({
                                    title: __('Validation Error'),
                                    message: r.message.message,
                                    indicator: 'red'
                                });
                            }
                            // Reload data to reflect changes
                            me.load_data();
                        }
                    },
                    error: function() {
                        frappe.hide_progress();
                        frappe.msgprint({
                            title: __('Error'),
                            message: __('An error occurred during bulk validation.'),
                            indicator: 'red'
                        });
                    }
                });
            },
            function() {
                // No - do nothing
            }
        );
    }
}
