// Copyright (c) 2024, DigiComply and contributors
// License: MIT

frappe.ui.form.on('Import Template', {
    refresh: function(frm) {
        // Add custom styles
        frm.trigger('add_custom_styles');

        // Add form wrapper class
        frm.$wrapper.find('.form-page').addClass('dc-form-wrapper');

        // Add action buttons
        frm.trigger('add_action_buttons');

        // Show template info card
        frm.trigger('show_template_info');
    },

    add_custom_styles: function(frm) {
        if ($('#import-template-styles').length) return;

        $('head').append(`
            <style id="import-template-styles">
                /* Form wrapper */
                .dc-form-wrapper {
                    max-width: 1200px;
                    margin: 0 auto;
                }

                /* Template Info Card */
                .dc-template-card {
                    background: linear-gradient(135deg, #a404e4 0%, #8501b9 100%);
                    border-radius: 16px;
                    padding: 24px;
                    margin-bottom: 24px;
                    color: white;
                    box-shadow: 0 4px 14px rgba(164, 4, 228, 0.25);
                }

                .dc-template-header {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    margin-bottom: 16px;
                }

                .dc-template-icon {
                    width: 64px;
                    height: 64px;
                    background: rgba(255,255,255,0.2);
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .dc-template-info {
                    flex: 1;
                }

                .dc-template-title {
                    font-size: 1.25rem;
                    font-weight: 700;
                    margin-bottom: 4px;
                }

                .dc-template-subtitle {
                    opacity: 0.9;
                    font-size: 0.875rem;
                }

                .dc-template-stats {
                    display: flex;
                    gap: 16px;
                    flex-wrap: wrap;
                }

                .dc-template-stat {
                    background: rgba(255,255,255,0.1);
                    border-radius: 10px;
                    padding: 12px 16px;
                    flex: 1;
                    min-width: 100px;
                    text-align: center;
                }

                .dc-template-stat-value {
                    font-size: 1.5rem;
                    font-weight: 700;
                    line-height: 1.2;
                }

                .dc-template-stat-label {
                    font-size: 0.75rem;
                    opacity: 0.8;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .dc-default-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    background: rgba(255,255,255,0.2);
                    border-radius: 20px;
                    padding: 4px 12px;
                    font-size: 0.75rem;
                    font-weight: 600;
                }

                /* Action Buttons */
                .dc-action-buttons {
                    display: flex;
                    gap: 12px;
                    flex-wrap: wrap;
                    margin: 20px 0;
                    padding: 16px;
                    background: #f8fafc;
                    border-radius: 12px;
                }

                .dc-btn {
                    padding: 12px 24px;
                    border-radius: 10px;
                    font-weight: 600;
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.2s;
                    border: none;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                }

                .dc-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                }

                .dc-btn-primary {
                    background: linear-gradient(135deg, #a404e4 0%, #8501b9 100%);
                    color: white;
                }

                .dc-btn-secondary {
                    background: #e2e8f0;
                    color: #475569;
                }

                .dc-btn-success {
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    color: white;
                }

                .dc-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    transform: none;
                }

                /* Column table styling */
                .frappe-control[data-fieldname="columns"] .grid-body {
                    background: #f8fafc;
                    border-radius: 8px;
                }

                .frappe-control[data-fieldname="columns"] .grid-heading-row {
                    background: linear-gradient(135deg, #a404e4 0%, #8501b9 100%);
                    color: white;
                }

                .frappe-control[data-fieldname="columns"] .grid-row {
                    border-bottom: 1px solid #e2e8f0;
                }

                .frappe-control[data-fieldname="columns"] .grid-row:hover {
                    background: #f0f9ff;
                }

                /* Column help text */
                .dc-column-help {
                    background: #f0f9ff;
                    border: 1px solid #bae6fd;
                    border-radius: 8px;
                    padding: 12px;
                    margin-top: 10px;
                    font-size: 0.8125rem;
                    color: #0c4a6e;
                }

                /* Mobile responsive */
                @media (max-width: 768px) {
                    .dc-template-header {
                        flex-direction: column;
                        text-align: center;
                    }

                    .dc-template-stats {
                        flex-direction: column;
                    }

                    .dc-action-buttons {
                        flex-direction: column;
                    }

                    .dc-btn {
                        width: 100%;
                        justify-content: center;
                    }
                }
            </style>
        `);
    },

    show_template_info: function(frm) {
        // Remove existing
        frm.$wrapper.find('.dc-template-card').remove();

        if (!frm.doc.template_name) return;

        let columnCount = (frm.doc.columns || []).length;
        let requiredCount = (frm.doc.columns || []).filter(c => c.is_required).length;

        let defaultBadge = frm.doc.is_default ?
            `<span class="dc-default-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                Default Template
            </span>` : '';

        let $card = $(`
            <div class="dc-template-card dc-fade-in">
                <div class="dc-template-header">
                    <div class="dc-template-icon">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/>
                            <line x1="16" y1="17" x2="8" y2="17"/>
                            <polyline points="10 9 9 9 8 9"/>
                        </svg>
                    </div>
                    <div class="dc-template-info">
                        <div class="dc-template-title">${frm.doc.template_name}</div>
                        <div class="dc-template-subtitle">
                            ${frm.doc.import_type} Import Template
                            ${defaultBadge}
                        </div>
                    </div>
                </div>

                <div class="dc-template-stats">
                    <div class="dc-template-stat">
                        <div class="dc-template-stat-value">${columnCount}</div>
                        <div class="dc-template-stat-label">Columns</div>
                    </div>
                    <div class="dc-template-stat">
                        <div class="dc-template-stat-value">${requiredCount}</div>
                        <div class="dc-template-stat-label">Required</div>
                    </div>
                    <div class="dc-template-stat">
                        <div class="dc-template-stat-value">${columnCount - requiredCount}</div>
                        <div class="dc-template-stat-label">Optional</div>
                    </div>
                </div>
            </div>
        `);

        frm.$wrapper.find('.form-page').first().prepend($card);
    },

    add_action_buttons: function(frm) {
        // Remove existing custom buttons container
        frm.$wrapper.find('.dc-action-buttons').remove();

        // Clear standard custom buttons
        frm.clear_custom_buttons();

        if (frm.is_new()) return;

        let $container = $('<div class="dc-action-buttons"></div>');

        // Download Template button
        let $downloadBtn = $(`
            <button class="dc-btn dc-btn-primary">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Download Template
            </button>
        `);

        $downloadBtn.on('click', function() {
            frm.trigger('do_download_template');
        });

        $container.append($downloadBtn);

        // Start Import button
        let $importBtn = $(`
            <button class="dc-btn dc-btn-success">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                Start Import
            </button>
        `);

        $importBtn.on('click', function() {
            frm.trigger('do_start_import');
        });

        $container.append($importBtn);

        // Regenerate Sample button
        let $regenBtn = $(`
            <button class="dc-btn dc-btn-secondary">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38"/>
                </svg>
                Regenerate Sample
            </button>
        `);

        $regenBtn.on('click', function() {
            frm.trigger('do_regenerate_sample');
        });

        $container.append($regenBtn);

        frm.fields_dict.section_columns.$wrapper.before($container);
    },

    do_download_template: function(frm) {
        window.open(
            `/api/method/digicomply.digicomply.doctype.import_template.import_template.download_template?template_name=${encodeURIComponent(frm.doc.name)}`,
            '_blank'
        );
    },

    do_start_import: function(frm) {
        // Create a new Bulk Import Log with this template's import type
        frappe.new_doc('Bulk Import Log', {
            import_type: frm.doc.import_type
        });
    },

    do_regenerate_sample: function(frm) {
        frm.call({
            doc: frm.doc,
            method: 'download_template',
            freeze: true,
            freeze_message: __('Regenerating sample file...'),
            callback: function(r) {
                if (r.message && r.message.file_url) {
                    frappe.show_alert({
                        message: __('Sample file regenerated'),
                        indicator: 'green'
                    });
                    frm.reload_doc();
                }
            }
        });
    },

    import_type: function(frm) {
        // Auto-populate columns based on import type
        if (frm.is_new() && frm.doc.import_type && (!frm.doc.columns || frm.doc.columns.length === 0)) {
            frm.trigger('populate_default_columns');
        }
    },

    populate_default_columns: function(frm) {
        frappe.confirm(
            __('Do you want to populate default columns for {0}?', [frm.doc.import_type]),
            function() {
                let columns = frm.trigger('get_default_columns', frm.doc.import_type);
                if (columns && columns.length > 0) {
                    frm.clear_table('columns');
                    columns.forEach(function(col) {
                        let row = frm.add_child('columns');
                        Object.assign(row, col);
                    });
                    frm.refresh_field('columns');

                    frappe.show_alert({
                        message: __('Default columns added for {0}', [frm.doc.import_type]),
                        indicator: 'green'
                    });
                }
            }
        );
    },

    get_default_columns: function(frm, import_type) {
        const defaults = {
            'Customer': [
                { column_name: 'Customer Name', field_name: 'customer_name', field_type: 'Data', is_required: 1 },
                { column_name: 'Customer Type', field_name: 'customer_type', field_type: 'Data', is_required: 0, default_value: 'Company' },
                { column_name: 'Customer Group', field_name: 'customer_group', field_type: 'Data', is_required: 0 },
                { column_name: 'Territory', field_name: 'territory', field_type: 'Data', is_required: 0 },
                { column_name: 'Tax ID', field_name: 'tax_id', field_type: 'Data', is_required: 0 },
                { column_name: 'Email', field_name: 'email_id', field_type: 'Data', is_required: 0 },
                { column_name: 'Mobile', field_name: 'mobile_no', field_type: 'Data', is_required: 0 }
            ],
            'Supplier': [
                { column_name: 'Supplier Name', field_name: 'supplier_name', field_type: 'Data', is_required: 1 },
                { column_name: 'Supplier Type', field_name: 'supplier_type', field_type: 'Data', is_required: 0, default_value: 'Company' },
                { column_name: 'Supplier Group', field_name: 'supplier_group', field_type: 'Data', is_required: 0 },
                { column_name: 'Country', field_name: 'country', field_type: 'Data', is_required: 0 },
                { column_name: 'Tax ID', field_name: 'tax_id', field_type: 'Data', is_required: 0 }
            ],
            'Item': [
                { column_name: 'Item Code', field_name: 'item_code', field_type: 'Data', is_required: 1 },
                { column_name: 'Item Name', field_name: 'item_name', field_type: 'Data', is_required: 0 },
                { column_name: 'Item Group', field_name: 'item_group', field_type: 'Data', is_required: 0 },
                { column_name: 'Description', field_name: 'description', field_type: 'Data', is_required: 0 },
                { column_name: 'Stock UOM', field_name: 'stock_uom', field_type: 'Data', is_required: 0, default_value: 'Nos' },
                { column_name: 'Is Stock Item', field_name: 'is_stock_item', field_type: 'Check', is_required: 0, default_value: '1' },
                { column_name: 'Standard Rate', field_name: 'standard_rate', field_type: 'Currency', is_required: 0 }
            ],
            'TRN Registry': [
                { column_name: 'TRN', field_name: 'trn', field_type: 'Data', is_required: 1 },
                { column_name: 'Entity Name', field_name: 'entity_name', field_type: 'Data', is_required: 1 },
                { column_name: 'Company', field_name: 'company', field_type: 'Data', is_required: 1 },
                { column_name: 'Entity Type', field_name: 'entity_type', field_type: 'Data', is_required: 0 },
                { column_name: 'FTA Registration Date', field_name: 'fta_registration_date', field_type: 'Date', is_required: 0 },
                { column_name: 'FTA Expiry Date', field_name: 'fta_expiry_date', field_type: 'Date', is_required: 0 },
                { column_name: 'Is Primary', field_name: 'is_primary', field_type: 'Check', is_required: 0, default_value: '0' },
                { column_name: 'Is Active', field_name: 'is_active', field_type: 'Check', is_required: 0, default_value: '1' },
                { column_name: 'Notes', field_name: 'notes', field_type: 'Data', is_required: 0 }
            ],
            'Company': [
                { column_name: 'Company Name', field_name: 'company_name', field_type: 'Data', is_required: 1 },
                { column_name: 'Abbreviation', field_name: 'abbr', field_type: 'Data', is_required: 0 },
                { column_name: 'Default Currency', field_name: 'default_currency', field_type: 'Data', is_required: 0, default_value: 'AED' },
                { column_name: 'Country', field_name: 'country', field_type: 'Data', is_required: 0, default_value: 'United Arab Emirates' },
                { column_name: 'Tax ID', field_name: 'tax_id', field_type: 'Data', is_required: 0 }
            ],
            'Invoice': [
                { column_name: 'Invoice No', field_name: 'invoice_no', field_type: 'Data', is_required: 1 },
                { column_name: 'Customer', field_name: 'customer', field_type: 'Data', is_required: 1 },
                { column_name: 'Posting Date', field_name: 'posting_date', field_type: 'Date', is_required: 0 },
                { column_name: 'Due Date', field_name: 'due_date', field_type: 'Date', is_required: 0 },
                { column_name: 'Item Code', field_name: 'item_code', field_type: 'Data', is_required: 0 },
                { column_name: 'Quantity', field_name: 'qty', field_type: 'Float', is_required: 0, default_value: '1' },
                { column_name: 'Rate', field_name: 'rate', field_type: 'Currency', is_required: 0 }
            ],
            'ASP Data': [
                { column_name: 'Invoice No', field_name: 'invoice_no', field_type: 'Data', is_required: 1 },
                { column_name: 'Posting Date', field_name: 'posting_date', field_type: 'Date', is_required: 0 },
                { column_name: 'Customer', field_name: 'customer', field_type: 'Data', is_required: 0 },
                { column_name: 'TRN', field_name: 'trn', field_type: 'Data', is_required: 0 },
                { column_name: 'Grand Total', field_name: 'grand_total', field_type: 'Currency', is_required: 0 },
                { column_name: 'VAT Amount', field_name: 'vat_amount', field_type: 'Currency', is_required: 0 }
            ]
        };

        return defaults[import_type] || [];
    }
});

// Child table events
frappe.ui.form.on('Import Template Column', {
    columns_add: function(frm, cdt, cdn) {
        // Set default field type
        frappe.model.set_value(cdt, cdn, 'field_type', 'Data');
    },

    column_name: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        // Auto-generate field_name from column_name if empty
        if (row.column_name && !row.field_name) {
            let field_name = row.column_name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '_')
                .replace(/^_|_$/g, '');
            frappe.model.set_value(cdt, cdn, 'field_name', field_name);
        }
    }
});
