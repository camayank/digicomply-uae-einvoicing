frappe.pages['compliance-calendar'].on_page_load = function(wrapper) {
    var page = frappe.ui.make_app_page({
        parent: wrapper,
        title: __('Compliance Calendar'),
        single_column: true
    });

    // Add page actions
    page.set_primary_action(__('Generate Calendar'), function() {
        new GenerateCalendarDialog();
    }, 'add');

    page.set_secondary_action(__('New Deadline'), function() {
        frappe.new_doc('Compliance Calendar');
    }, 'calendar');

    // Initialize calendar
    new DCComplianceCalendar(page);
};

/**
 * Generate Calendar Dialog
 */
class GenerateCalendarDialog {
    constructor() {
        this.show();
    }

    show() {
        let d = new frappe.ui.Dialog({
            title: __('Generate Calendar Entries'),
            fields: [
                {
                    fieldtype: 'Link',
                    fieldname: 'company',
                    label: __('Company'),
                    options: 'Company',
                    reqd: 1
                },
                {
                    fieldtype: 'Int',
                    fieldname: 'year',
                    label: __('Year'),
                    default: new Date().getFullYear(),
                    reqd: 1
                },
                {
                    fieldtype: 'Select',
                    fieldname: 'filing_type',
                    label: __('Filing Type'),
                    options: 'VAT Return Quarterly\nVAT Return Monthly',
                    default: 'VAT Return Quarterly',
                    reqd: 1
                }
            ],
            primary_action_label: __('Generate'),
            primary_action: (values) => {
                d.hide();
                this.generate(values);
            }
        });
        d.show();
    }

    generate(values) {
        frappe.call({
            method: 'digicomply.digicomply.page.compliance_calendar.compliance_calendar.generate_calendar_entries',
            args: {
                company: values.company,
                year: values.year,
                filing_type: values.filing_type
            },
            freeze: true,
            freeze_message: __('Generating calendar entries...'),
            callback: (r) => {
                if (r.message) {
                    let msg = __('Created {0} entries, skipped {1}', [
                        r.message.created_count,
                        r.message.skipped_count
                    ]);
                    frappe.msgprint({
                        title: __('Calendar Generated'),
                        indicator: 'green',
                        message: msg
                    });
                    // Refresh the calendar
                    if (window.dc_compliance_calendar) {
                        window.dc_compliance_calendar.load_data();
                    }
                }
            }
        });
    }
}

/**
 * Main Compliance Calendar Class
 */
class DCComplianceCalendar {
    constructor(page) {
        this.page = page;
        this.wrapper = $(page.body);
        this.current_date = new Date();
        this.current_year = this.current_date.getFullYear();
        this.current_month = this.current_date.getMonth() + 1; // 1-12
        this.selected_company = null;
        this.selected_status = null;

        // Store reference for external access
        window.dc_compliance_calendar = this;

        this.render();
        this.load_data();
    }

    render() {
        this.wrapper.html(`
            <div class="dc-compliance-calendar">
                <style>
                    .dc-compliance-calendar {
                        padding: 20px;
                        max-width: 1400px;
                        margin: 0 auto;
                    }

                    /* Filter Bar */
                    .dc-calendar-filters {
                        display: flex;
                        gap: 16px;
                        margin-bottom: 24px;
                        flex-wrap: wrap;
                        align-items: flex-end;
                    }
                    .dc-filter-group {
                        min-width: 200px;
                    }
                    .dc-filter-group label {
                        display: block;
                        font-size: 12px;
                        font-weight: 500;
                        color: #6b7280;
                        margin-bottom: 4px;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }

                    /* Summary Cards */
                    .dc-summary-cards {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
                        gap: 16px;
                        margin-bottom: 24px;
                    }
                    .dc-summary-card {
                        background: white;
                        border-radius: 12px;
                        padding: 20px;
                        text-align: center;
                        border: 1px solid #f3f4f6;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                        transition: all 0.2s;
                        cursor: pointer;
                    }
                    .dc-summary-card:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                    }
                    .dc-summary-card.active {
                        border-color: #a404e4;
                        box-shadow: 0 0 0 2px rgba(164, 4, 228, 0.2);
                    }
                    .dc-summary-count {
                        font-size: 32px;
                        font-weight: 700;
                        line-height: 1;
                        margin-bottom: 8px;
                    }
                    .dc-summary-label {
                        font-size: 12px;
                        color: #6b7280;
                        font-weight: 500;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }
                    .dc-count-purple { color: #a404e4; }
                    .dc-count-yellow { color: #d97706; }
                    .dc-count-red { color: #dc2626; }
                    .dc-count-green { color: #059669; }

                    /* Calendar Container */
                    .dc-calendar-container {
                        display: grid;
                        grid-template-columns: 1fr 350px;
                        gap: 24px;
                    }
                    @media (max-width: 1000px) {
                        .dc-calendar-container {
                            grid-template-columns: 1fr;
                        }
                    }

                    /* Calendar Box */
                    .dc-calendar-box {
                        background: white;
                        border-radius: 12px;
                        padding: 24px;
                        border: 1px solid #f3f4f6;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                    }

                    /* Calendar Header */
                    .dc-calendar-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 20px;
                    }
                    .dc-calendar-title {
                        font-size: 20px;
                        font-weight: 600;
                        color: #1f2937;
                    }
                    .dc-calendar-nav {
                        display: flex;
                        gap: 8px;
                    }
                    .dc-nav-btn {
                        width: 36px;
                        height: 36px;
                        border: 1px solid #e5e7eb;
                        background: white;
                        border-radius: 8px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 16px;
                        transition: all 0.2s;
                    }
                    .dc-nav-btn:hover {
                        border-color: #a404e4;
                        background: #faf5ff;
                        color: #a404e4;
                    }
                    .dc-nav-today {
                        width: auto;
                        padding: 0 12px;
                        font-size: 13px;
                        font-weight: 500;
                    }

                    /* Calendar Grid */
                    .dc-calendar-grid {
                        display: grid;
                        grid-template-columns: repeat(7, 1fr);
                        gap: 4px;
                    }
                    .dc-weekday {
                        text-align: center;
                        font-size: 12px;
                        font-weight: 600;
                        color: #9ca3af;
                        padding: 8px 4px;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }
                    .dc-day {
                        aspect-ratio: 1;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        border-radius: 8px;
                        cursor: pointer;
                        transition: all 0.2s;
                        position: relative;
                        min-height: 50px;
                    }
                    .dc-day:hover {
                        background: #f9fafb;
                    }
                    .dc-day.dc-empty {
                        cursor: default;
                    }
                    .dc-day.dc-empty:hover {
                        background: transparent;
                    }
                    .dc-day-number {
                        font-size: 14px;
                        font-weight: 500;
                        color: #374151;
                    }
                    .dc-day.dc-today .dc-day-number {
                        background: #a404e4;
                        color: white;
                        width: 28px;
                        height: 28px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    .dc-day.dc-selected {
                        background: #faf5ff;
                        border: 2px solid #a404e4;
                    }

                    /* Deadline Indicators */
                    .dc-deadline-dots {
                        display: flex;
                        gap: 3px;
                        margin-top: 4px;
                    }
                    .dc-deadline-dot {
                        width: 6px;
                        height: 6px;
                        border-radius: 50%;
                    }
                    .dc-dot-upcoming { background: #a404e4; }
                    .dc-dot-due-soon { background: #f59e0b; }
                    .dc-dot-overdue { background: #ef4444; }
                    .dc-dot-filed { background: #10b981; }
                    .dc-dot-acknowledged { background: #059669; }

                    /* Day with deadlines styling */
                    .dc-day.dc-has-deadline {
                        background: #faf5ff;
                    }
                    .dc-day.dc-has-overdue {
                        background: #fef2f2;
                    }
                    .dc-day.dc-has-due-soon {
                        background: #fffbeb;
                    }

                    /* Deadline Panel */
                    .dc-deadline-panel {
                        background: white;
                        border-radius: 12px;
                        padding: 24px;
                        border: 1px solid #f3f4f6;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                    }
                    .dc-panel-title {
                        font-size: 16px;
                        font-weight: 600;
                        color: #1f2937;
                        margin-bottom: 16px;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }
                    .dc-panel-date {
                        font-size: 13px;
                        font-weight: 400;
                        color: #6b7280;
                    }

                    /* Deadline Item */
                    .dc-deadline-item {
                        padding: 12px;
                        border-radius: 8px;
                        margin-bottom: 12px;
                        border-left: 4px solid #a404e4;
                        background: #faf5ff;
                        cursor: pointer;
                        transition: all 0.2s;
                    }
                    .dc-deadline-item:hover {
                        transform: translateX(4px);
                        box-shadow: 0 2px 8px rgba(164, 4, 228, 0.15);
                    }
                    .dc-deadline-item.dc-status-overdue {
                        border-left-color: #ef4444;
                        background: #fef2f2;
                    }
                    .dc-deadline-item.dc-status-due-soon {
                        border-left-color: #f59e0b;
                        background: #fffbeb;
                    }
                    .dc-deadline-item.dc-status-filed,
                    .dc-deadline-item.dc-status-acknowledged {
                        border-left-color: #10b981;
                        background: #f0fdf4;
                    }
                    .dc-deadline-company {
                        font-weight: 600;
                        color: #1f2937;
                        font-size: 14px;
                        margin-bottom: 4px;
                    }
                    .dc-deadline-period {
                        font-size: 13px;
                        color: #6b7280;
                        margin-bottom: 4px;
                    }
                    .dc-deadline-meta {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    .dc-deadline-status {
                        font-size: 11px;
                        padding: 3px 8px;
                        border-radius: 12px;
                        font-weight: 500;
                        text-transform: uppercase;
                        letter-spacing: 0.3px;
                    }
                    .dc-status-upcoming { background: #ede9fe; color: #7c3aed; }
                    .dc-status-due-soon-badge { background: #fef3c7; color: #d97706; }
                    .dc-status-overdue-badge { background: #fee2e2; color: #dc2626; }
                    .dc-status-filed-badge { background: #d1fae5; color: #059669; }
                    .dc-status-acknowledged-badge { background: #a7f3d0; color: #047857; }
                    .dc-deadline-days {
                        font-size: 12px;
                        font-weight: 500;
                        color: #6b7280;
                    }

                    /* Empty state */
                    .dc-empty-panel {
                        text-align: center;
                        padding: 40px 20px;
                        color: #9ca3af;
                    }
                    .dc-empty-icon {
                        font-size: 48px;
                        margin-bottom: 12px;
                    }
                    .dc-empty-text {
                        font-size: 14px;
                    }

                    /* Deadline List Table */
                    .dc-deadline-list {
                        margin-top: 24px;
                    }
                    .dc-list-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 16px;
                    }
                    .dc-list-title {
                        font-size: 18px;
                        font-weight: 600;
                        color: #1f2937;
                    }
                    .dc-deadline-table {
                        width: 100%;
                        background: white;
                        border-radius: 12px;
                        overflow: hidden;
                        border: 1px solid #f3f4f6;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                    }
                    .dc-deadline-table th {
                        background: #f9fafb;
                        padding: 12px 16px;
                        text-align: left;
                        font-size: 12px;
                        font-weight: 600;
                        color: #6b7280;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        border-bottom: 1px solid #e5e7eb;
                    }
                    .dc-deadline-table td {
                        padding: 14px 16px;
                        border-bottom: 1px solid #f3f4f6;
                        font-size: 14px;
                        color: #374151;
                    }
                    .dc-deadline-table tr:last-child td {
                        border-bottom: none;
                    }
                    .dc-deadline-table tr:hover td {
                        background: #faf5ff;
                    }
                    .dc-table-link {
                        color: #a404e4;
                        font-weight: 500;
                        cursor: pointer;
                    }
                    .dc-table-link:hover {
                        text-decoration: underline;
                    }

                    /* Legend */
                    .dc-legend {
                        display: flex;
                        gap: 20px;
                        margin-top: 16px;
                        padding-top: 16px;
                        border-top: 1px solid #f3f4f6;
                        flex-wrap: wrap;
                    }
                    .dc-legend-item {
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        font-size: 12px;
                        color: #6b7280;
                    }
                    .dc-legend-dot {
                        width: 10px;
                        height: 10px;
                        border-radius: 50%;
                    }

                    /* Loading state */
                    .dc-loading {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        padding: 60px;
                        color: #9ca3af;
                    }
                </style>

                <!-- Filter Bar -->
                <div class="dc-calendar-filters">
                    <div class="dc-filter-group">
                        <label>${frappe.utils.escape_html(__('Company'))}</label>
                        <div class="dc-company-filter"></div>
                    </div>
                    <div class="dc-filter-group">
                        <label>${frappe.utils.escape_html(__('Year'))}</label>
                        <div class="dc-year-filter"></div>
                    </div>
                    <div class="dc-filter-group">
                        <label>${frappe.utils.escape_html(__('Status'))}</label>
                        <div class="dc-status-filter"></div>
                    </div>
                </div>

                <!-- Summary Cards -->
                <div class="dc-summary-cards">
                    <div class="dc-summary-card" data-status="upcoming">
                        <div class="dc-summary-count dc-count-purple" id="dc-upcoming-count">-</div>
                        <div class="dc-summary-label">${frappe.utils.escape_html(__('Upcoming'))}</div>
                    </div>
                    <div class="dc-summary-card" data-status="due_soon">
                        <div class="dc-summary-count dc-count-yellow" id="dc-due-soon-count">-</div>
                        <div class="dc-summary-label">${frappe.utils.escape_html(__('Due Soon'))}</div>
                    </div>
                    <div class="dc-summary-card" data-status="overdue">
                        <div class="dc-summary-count dc-count-red" id="dc-overdue-count">-</div>
                        <div class="dc-summary-label">${frappe.utils.escape_html(__('Overdue'))}</div>
                    </div>
                    <div class="dc-summary-card" data-status="filed">
                        <div class="dc-summary-count dc-count-green" id="dc-filed-count">-</div>
                        <div class="dc-summary-label">${frappe.utils.escape_html(__('Filed'))}</div>
                    </div>
                </div>

                <!-- Calendar Container -->
                <div class="dc-calendar-container">
                    <!-- Calendar Grid -->
                    <div class="dc-calendar-box">
                        <div class="dc-calendar-header">
                            <div class="dc-calendar-title" id="dc-calendar-title">-</div>
                            <div class="dc-calendar-nav">
                                <button class="dc-nav-btn dc-nav-today" id="dc-nav-today">${frappe.utils.escape_html(__('Today'))}</button>
                                <button class="dc-nav-btn" id="dc-nav-prev">&lt;</button>
                                <button class="dc-nav-btn" id="dc-nav-next">&gt;</button>
                            </div>
                        </div>
                        <div class="dc-calendar-grid" id="dc-calendar-grid">
                            <div class="dc-loading">${frappe.utils.escape_html(__('Loading...'))}</div>
                        </div>
                        <div class="dc-legend">
                            <div class="dc-legend-item">
                                <div class="dc-legend-dot dc-dot-upcoming"></div>
                                <span>${frappe.utils.escape_html(__('Upcoming'))}</span>
                            </div>
                            <div class="dc-legend-item">
                                <div class="dc-legend-dot dc-dot-due-soon"></div>
                                <span>${frappe.utils.escape_html(__('Due Soon'))}</span>
                            </div>
                            <div class="dc-legend-item">
                                <div class="dc-legend-dot dc-dot-overdue"></div>
                                <span>${frappe.utils.escape_html(__('Overdue'))}</span>
                            </div>
                            <div class="dc-legend-item">
                                <div class="dc-legend-dot dc-dot-filed"></div>
                                <span>${frappe.utils.escape_html(__('Filed'))}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Deadline Panel -->
                    <div class="dc-deadline-panel">
                        <div class="dc-panel-title">
                            ${frappe.utils.escape_html(__('Deadlines'))}
                            <span class="dc-panel-date" id="dc-panel-date"></span>
                        </div>
                        <div id="dc-deadline-list">
                            <div class="dc-empty-panel">
                                <div class="dc-empty-icon">&#128197;</div>
                                <div class="dc-empty-text">${frappe.utils.escape_html(__('Select a day to view deadlines'))}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Deadline List Table -->
                <div class="dc-deadline-list">
                    <div class="dc-list-header">
                        <div class="dc-list-title">${frappe.utils.escape_html(__('All Deadlines This Month'))}</div>
                    </div>
                    <table class="dc-deadline-table">
                        <thead>
                            <tr>
                                <th>${frappe.utils.escape_html(__('Company'))}</th>
                                <th>${frappe.utils.escape_html(__('Period'))}</th>
                                <th>${frappe.utils.escape_html(__('Filing Type'))}</th>
                                <th>${frappe.utils.escape_html(__('Due Date'))}</th>
                                <th>${frappe.utils.escape_html(__('Status'))}</th>
                                <th>${frappe.utils.escape_html(__('Days'))}</th>
                            </tr>
                        </thead>
                        <tbody id="dc-deadline-tbody">
                            <tr>
                                <td colspan="6" style="text-align:center;color:#9ca3af;padding:40px;">
                                    ${frappe.utils.escape_html(__('Loading deadlines...'))}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `);

        this.setup_filters();
        this.setup_events();
    }

    setup_filters() {
        // Company filter
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
            parent: this.wrapper.find('.dc-company-filter'),
            render_input: true
        });

        // Year filter
        let current_year = new Date().getFullYear();
        let years = [];
        for (let y = current_year - 2; y <= current_year + 2; y++) {
            years.push(y.toString());
        }

        this.year_field = frappe.ui.form.make_control({
            df: {
                fieldtype: 'Select',
                fieldname: 'year',
                options: years.join('\n'),
                default: current_year.toString(),
                change: () => {
                    this.current_year = parseInt(this.year_field.get_value());
                    this.load_data();
                }
            },
            parent: this.wrapper.find('.dc-year-filter'),
            render_input: true
        });
        this.year_field.set_value(current_year.toString());

        // Status filter
        this.status_field = frappe.ui.form.make_control({
            df: {
                fieldtype: 'Select',
                fieldname: 'status',
                options: '\nUpcoming\nDue Soon\nOverdue\nFiled\nAcknowledged',
                placeholder: __('All Statuses'),
                change: () => {
                    this.selected_status = this.status_field.get_value();
                    this.render_calendar();
                    this.render_deadline_table();
                }
            },
            parent: this.wrapper.find('.dc-status-filter'),
            render_input: true
        });
    }

    setup_events() {
        // Navigation buttons
        this.wrapper.find('#dc-nav-prev').on('click', () => this.navigate_month(-1));
        this.wrapper.find('#dc-nav-next').on('click', () => this.navigate_month(1));
        this.wrapper.find('#dc-nav-today').on('click', () => this.go_to_today());

        // Summary card clicks
        this.wrapper.find('.dc-summary-card').on('click', (e) => {
            let status = $(e.currentTarget).data('status');
            this.filter_by_status(status);
        });
    }

    navigate_month(delta) {
        this.current_month += delta;
        if (this.current_month > 12) {
            this.current_month = 1;
            this.current_year++;
        } else if (this.current_month < 1) {
            this.current_month = 12;
            this.current_year--;
        }
        this.year_field.set_value(this.current_year.toString());
        this.load_calendar_data();
    }

    go_to_today() {
        let today = new Date();
        this.current_year = today.getFullYear();
        this.current_month = today.getMonth() + 1;
        this.year_field.set_value(this.current_year.toString());
        this.load_data();
    }

    filter_by_status(status) {
        // Toggle status filter
        let current = this.status_field.get_value();
        let status_map = {
            'upcoming': 'Upcoming',
            'due_soon': 'Due Soon',
            'overdue': 'Overdue',
            'filed': 'Filed'
        };
        let new_status = status_map[status] || '';

        if (current === new_status) {
            this.status_field.set_value('');
            this.wrapper.find('.dc-summary-card').removeClass('active');
        } else {
            this.status_field.set_value(new_status);
            this.wrapper.find('.dc-summary-card').removeClass('active');
            this.wrapper.find(`.dc-summary-card[data-status="${status}"]`).addClass('active');
        }

        this.selected_status = this.status_field.get_value();
        this.render_calendar();
        this.render_deadline_table();
    }

    load_data() {
        this.load_summary();
        this.load_calendar_data();
    }

    load_summary() {
        frappe.call({
            method: 'digicomply.digicomply.page.compliance_calendar.compliance_calendar.get_deadline_summary',
            args: {
                company: this.selected_company,
                year: this.current_year
            },
            callback: (r) => {
                if (r.message) {
                    this.update_summary(r.message);
                }
            }
        });
    }

    update_summary(data) {
        $('#dc-upcoming-count').text(data.upcoming || 0);
        $('#dc-due-soon-count').text(data.due_soon || 0);
        $('#dc-overdue-count').text(data.overdue || 0);
        $('#dc-filed-count').text((data.filed || 0) + (data.acknowledged || 0));
    }

    load_calendar_data() {
        frappe.call({
            method: 'digicomply.digicomply.page.compliance_calendar.compliance_calendar.get_calendar_data',
            args: {
                year: this.current_year,
                month: this.current_month,
                company: this.selected_company
            },
            callback: (r) => {
                if (r.message) {
                    this.calendar_data = r.message;
                    this.render_calendar();
                    this.render_deadline_table();
                }
            }
        });
    }

    render_calendar() {
        if (!this.calendar_data) return;

        let data = this.calendar_data;
        let title = `${frappe.utils.escape_html(data.month_name)} ${data.year}`;
        $('#dc-calendar-title').text(title);

        // Weekday headers (Sunday first)
        let weekdays = [__('Sun'), __('Mon'), __('Tue'), __('Wed'), __('Thu'), __('Fri'), __('Sat')];
        let html = weekdays.map(d => `<div class="dc-weekday">${frappe.utils.escape_html(d)}</div>`).join('');

        // Calendar days
        let month_days = data.month_days;
        let deadlines_by_day = data.deadlines_by_day || {};

        for (let day of month_days) {
            if (day === 0) {
                html += '<div class="dc-day dc-empty"></div>';
            } else {
                let deadlines = deadlines_by_day[day] || [];
                let filtered_deadlines = this.filter_deadlines(deadlines);
                let classes = ['dc-day'];

                if (day === data.today) {
                    classes.push('dc-today');
                }

                if (filtered_deadlines.length > 0) {
                    classes.push('dc-has-deadline');

                    // Check for priority coloring
                    let has_overdue = filtered_deadlines.some(d => d.status === 'Overdue');
                    let has_due_soon = filtered_deadlines.some(d => d.status === 'Due Soon');

                    if (has_overdue) {
                        classes.push('dc-has-overdue');
                    } else if (has_due_soon) {
                        classes.push('dc-has-due-soon');
                    }
                }

                let dots_html = this.render_deadline_dots(filtered_deadlines);

                html += `
                    <div class="${classes.join(' ')}" data-day="${day}">
                        <div class="dc-day-number">${day}</div>
                        ${dots_html}
                    </div>
                `;
            }
        }

        $('#dc-calendar-grid').html(html);

        // Add day click handlers
        this.wrapper.find('.dc-day:not(.dc-empty)').on('click', (e) => {
            let day = $(e.currentTarget).data('day');
            this.select_day(day);
        });
    }

    filter_deadlines(deadlines) {
        if (!this.selected_status) return deadlines;
        return deadlines.filter(d => d.status === this.selected_status);
    }

    render_deadline_dots(deadlines) {
        if (deadlines.length === 0) return '';

        // Group by status
        let status_counts = {};
        for (let d of deadlines) {
            let status = d.status.toLowerCase().replace(' ', '-');
            status_counts[status] = (status_counts[status] || 0) + 1;
        }

        let dots = [];
        for (let status in status_counts) {
            let count = Math.min(status_counts[status], 3); // Max 3 dots per status
            for (let i = 0; i < count; i++) {
                dots.push(`<div class="dc-deadline-dot dc-dot-${status}"></div>`);
            }
        }

        return `<div class="dc-deadline-dots">${dots.slice(0, 5).join('')}</div>`;
    }

    select_day(day) {
        // Update selection
        this.wrapper.find('.dc-day').removeClass('dc-selected');
        this.wrapper.find(`.dc-day[data-day="${day}"]`).addClass('dc-selected');

        // Show deadlines for this day
        let deadlines = (this.calendar_data.deadlines_by_day || {})[day] || [];
        let filtered = this.filter_deadlines(deadlines);

        // Update panel title
        let date_str = `${this.calendar_data.month_name} ${day}, ${this.calendar_data.year}`;
        $('#dc-panel-date').text(date_str);

        this.render_deadline_panel(filtered);
    }

    render_deadline_panel(deadlines) {
        if (deadlines.length === 0) {
            $('#dc-deadline-list').html(`
                <div class="dc-empty-panel">
                    <div class="dc-empty-icon">&#128197;</div>
                    <div class="dc-empty-text">${frappe.utils.escape_html(__('No deadlines on this day'))}</div>
                </div>
            `);
            return;
        }

        let html = deadlines.map(d => {
            let status_class = 'dc-status-' + d.status.toLowerCase().replace(' ', '-');
            let badge_class = this.get_status_badge_class(d.status);
            let days_text = this.get_days_text(d.days_until);

            return `
                <div class="dc-deadline-item ${status_class}" data-name="${frappe.utils.escape_html(d.name)}">
                    <div class="dc-deadline-company">${frappe.utils.escape_html(d.company)}</div>
                    <div class="dc-deadline-period">${frappe.utils.escape_html(d.period_label)} - ${frappe.utils.escape_html(d.filing_type)}</div>
                    <div class="dc-deadline-meta">
                        <span class="dc-deadline-status ${badge_class}">${frappe.utils.escape_html(d.status)}</span>
                        <span class="dc-deadline-days">${days_text}</span>
                    </div>
                </div>
            `;
        }).join('');

        $('#dc-deadline-list').html(html);

        // Add click handlers
        this.wrapper.find('.dc-deadline-item').on('click', (e) => {
            let name = $(e.currentTarget).data('name');
            frappe.set_route('Form', 'Compliance Calendar', name);
        });
    }

    get_status_badge_class(status) {
        let map = {
            'Upcoming': 'dc-status-upcoming',
            'Due Soon': 'dc-status-due-soon-badge',
            'Overdue': 'dc-status-overdue-badge',
            'Filed': 'dc-status-filed-badge',
            'Acknowledged': 'dc-status-acknowledged-badge'
        };
        return map[status] || 'dc-status-upcoming';
    }

    get_days_text(days) {
        if (days < 0) {
            return frappe.utils.escape_html(__(`${Math.abs(days)} days overdue`));
        } else if (days === 0) {
            return frappe.utils.escape_html(__('Due today'));
        } else if (days === 1) {
            return frappe.utils.escape_html(__('Due tomorrow'));
        } else {
            return frappe.utils.escape_html(__(`${days} days left`));
        }
    }

    render_deadline_table() {
        if (!this.calendar_data || !this.calendar_data.deadlines) {
            $('#dc-deadline-tbody').html(`
                <tr>
                    <td colspan="6" style="text-align:center;color:#9ca3af;padding:40px;">
                        ${frappe.utils.escape_html(__('No deadlines found'))}
                    </td>
                </tr>
            `);
            return;
        }

        let deadlines = this.filter_deadlines(this.calendar_data.deadlines);

        if (deadlines.length === 0) {
            $('#dc-deadline-tbody').html(`
                <tr>
                    <td colspan="6" style="text-align:center;color:#9ca3af;padding:40px;">
                        ${frappe.utils.escape_html(__('No deadlines found'))}
                    </td>
                </tr>
            `);
            return;
        }

        let html = deadlines.map(d => {
            let badge_class = this.get_status_badge_class(d.status);
            let days_text = this.get_days_text(d.days_until);

            return `
                <tr>
                    <td>
                        <span class="dc-table-link" data-name="${frappe.utils.escape_html(d.name)}">
                            ${frappe.utils.escape_html(d.company)}
                        </span>
                    </td>
                    <td>${frappe.utils.escape_html(d.period_label)}</td>
                    <td>${frappe.utils.escape_html(d.filing_type)}</td>
                    <td>${frappe.utils.escape_html(d.due_date_formatted)}</td>
                    <td><span class="dc-deadline-status ${badge_class}">${frappe.utils.escape_html(d.status)}</span></td>
                    <td>${days_text}</td>
                </tr>
            `;
        }).join('');

        $('#dc-deadline-tbody').html(html);

        // Add click handlers for table links
        this.wrapper.find('.dc-table-link').on('click', (e) => {
            let name = $(e.currentTarget).data('name');
            frappe.set_route('Form', 'Compliance Calendar', name);
        });
    }
}
