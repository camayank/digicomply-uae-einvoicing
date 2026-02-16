// Copyright (c) 2024, DigiComply and contributors
// License: MIT

frappe.listview_settings['CSV Import'] = {
    add_fields: ['status', 'row_count', 'asp_provider', 'upload_date'],

    hide_name_column: true,

    get_indicator: function(doc) {
        const status_colors = {
            'Pending': 'orange',
            'Processing': 'blue',
            'Completed': 'green',
            'Failed': 'red'
        };
        return [__(doc.status), status_colors[doc.status] || 'gray', 'status,=,' + doc.status];
    },

    formatters: {
        row_count: function(value, df, doc) {
            if (!value && value !== 0) return '';

            let icon = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" style="vertical-align: middle; margin-right: 4px;">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
            `;

            return `
                <span style="
                    display: inline-flex;
                    align-items: center;
                    background: #f1f5f9;
                    padding: 4px 10px;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: 600;
                    color: #475569;
                ">
                    ${icon}${value} rows
                </span>
            `;
        },

        asp_provider: function(value, df, doc) {
            if (!value) return '';

            const colors = {
                'ClearTax': { bg: '#faf5ff', text: '#a404e4' },
                'Cygnet': { bg: '#fce7f3', text: '#be185d' },
                'Zoho': { bg: '#dcfce7', text: '#166534' },
                'Tabadul': { bg: '#fef3c7', text: '#92400e' },
                'Other': { bg: '#f1f5f9', text: '#475569' }
            };

            let style = colors[value] || colors['Other'];

            return `
                <span style="
                    background: ${style.bg};
                    color: ${style.text};
                    padding: 4px 12px;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: 600;
                ">${value}</span>
            `;
        },

        upload_date: function(value, df, doc) {
            if (!value) return '';

            let date = frappe.datetime.str_to_obj(value);
            let today = frappe.datetime.str_to_obj(frappe.datetime.get_today());
            let diff = frappe.datetime.get_diff(today, date);

            let label = '';
            if (diff === 0) {
                label = 'Today';
            } else if (diff === 1) {
                label = 'Yesterday';
            } else if (diff < 7) {
                label = diff + ' days ago';
            } else {
                label = frappe.datetime.str_to_user(value);
            }

            return `
                <span style="color: #64748b; font-size: 12px;">
                    ${label}
                </span>
            `;
        }
    },

    onload: function(listview) {
        // Add custom header styling
        listview.page.set_title_sub(`
            <span style="font-size: 13px; color: #64748b;">
                Import ASP data from CSV files for reconciliation
            </span>
        `);

        // Add quick action button
        listview.page.add_inner_button(__('Import CSV'), function() {
            frappe.new_doc('CSV Import');
        }, null, 'primary');
    },

    button: {
        show: function(doc) {
            return doc.status === 'Completed';
        },
        get_label: function() {
            return __('Reconcile');
        },
        get_description: function(doc) {
            return __('Start reconciliation with this import');
        },
        action: function(doc) {
            frappe.new_doc('Reconciliation Run', {
                company: doc.company,
                asp_provider: doc.asp_provider,
                csv_import: doc.name
            });
        }
    }
};
