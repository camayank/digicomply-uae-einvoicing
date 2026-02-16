// Copyright (c) 2024, DigiComply and contributors
// License: MIT

frappe.listview_settings['Reconciliation Run'] = {
    add_fields: ['status', 'match_percentage', 'matched_count', 'mismatched_count', 'missing_in_asp', 'missing_in_erp', 'total_invoices'],

    hide_name_column: true,

    get_indicator: function(doc) {
        const status_colors = {
            'Draft': 'gray',
            'In Progress': 'blue',
            'Completed': doc.match_percentage >= 90 ? 'green' : (doc.match_percentage >= 70 ? 'orange' : 'red'),
            'Failed': 'red'
        };
        return [__(doc.status), status_colors[doc.status] || 'gray', 'status,=,' + doc.status];
    },

    formatters: {
        match_percentage: function(value, df, doc) {
            if (!value && value !== 0) return '';

            let color = value >= 90 ? '#10b981' : (value >= 70 ? '#f59e0b' : '#ef4444');
            let bgColor = value >= 90 ? '#d1fae5' : (value >= 70 ? '#fef3c7' : '#fee2e2');
            let barColor = value >= 90 ? '#10b981' : (value >= 70 ? '#f59e0b' : '#a404e4');

            return `
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="
                        width: 60px;
                        height: 8px;
                        background: #e5e7eb;
                        border-radius: 4px;
                        overflow: hidden;
                    ">
                        <div style="
                            width: ${value}%;
                            height: 100%;
                            background: ${barColor};
                            border-radius: 4px;
                            transition: width 0.3s ease;
                        "></div>
                    </div>
                    <span style="
                        font-weight: 700;
                        font-size: 12px;
                        color: ${color};
                        background: ${bgColor};
                        padding: 2px 8px;
                        border-radius: 10px;
                    ">${Math.round(value)}%</span>
                </div>
            `;
        },

        matched_count: function(value, df, doc) {
            if (!value && value !== 0) return '';
            return `<span style="color: #10b981; font-weight: 600;">${value}</span>`;
        },

        mismatched_count: function(value, df, doc) {
            if (!value && value !== 0) return '';
            if (value === 0) return `<span style="color: #94a3b8;">${value}</span>`;
            return `<span style="color: #f59e0b; font-weight: 600;">${value}</span>`;
        }
    },

    onload: function(listview) {
        // Add custom header styling
        listview.page.set_title_sub(`
            <span style="font-size: 13px; color: #64748b;">
                Track and reconcile invoice data between your Books and ASP provider
            </span>
        `);

        // Add quick action buttons
        listview.page.add_inner_button(__('New Reconciliation'), function() {
            frappe.new_doc('Reconciliation Run');
        }, null, 'primary');

        // Add summary stats after list loads
        listview.$result.on('change', function() {
            listview.render_stat_section();
        });
    },

    render_stat_section: function() {
        // This would render summary stats above the list
    },

    button: {
        show: function(doc) {
            return doc.status === 'Completed';
        },
        get_label: function() {
            return __('View Report');
        },
        get_description: function(doc) {
            return __('View reconciliation report for {0}', [doc.name]);
        },
        action: function(doc) {
            frappe.set_route('Form', 'Reconciliation Run', doc.name);
        }
    }
};
