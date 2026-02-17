// Copyright (c) 2024, DigiComply and contributors
// License: MIT

frappe.ui.form.on('Tax Category Rule', {
    refresh: function(frm) {
        // Add custom styles
        frm.trigger('add_custom_styles');

        // Add visual rule card
        frm.trigger('add_rule_card');

        // Add preview button
        frm.trigger('add_preview_button');

        // Update tax_template options based on apply_to
        frm.trigger('update_tax_template_options');
    },

    apply_to: function(frm) {
        // Update tax_template options when apply_to changes
        frm.trigger('update_tax_template_options');

        // Clear tax_template if changing apply_to
        if (frm.doc.tax_template) {
            frm.set_value('tax_template', '');
        }

        // Update the rule card
        frm.trigger('add_rule_card');
    },

    tax_category: function(frm) {
        frm.trigger('add_rule_card');
    },

    item_group: function(frm) {
        frm.trigger('add_rule_card');
    },

    customer_group: function(frm) {
        frm.trigger('add_rule_card');
    },

    supplier_group: function(frm) {
        frm.trigger('add_rule_card');
    },

    emirate: function(frm) {
        frm.trigger('add_rule_card');
    },

    priority: function(frm) {
        frm.trigger('add_rule_card');
    },

    is_active: function(frm) {
        frm.trigger('add_rule_card');
    },

    update_tax_template_options: function(frm) {
        // Set the options for tax_template based on apply_to
        let options = '';
        if (frm.doc.apply_to === 'Sales Invoice') {
            options = 'Sales Taxes and Charges Template';
        } else if (frm.doc.apply_to === 'Purchase Invoice') {
            options = 'Purchase Taxes and Charges Template';
        } else {
            // For 'Both', default to Sales template
            options = 'Sales Taxes and Charges Template';
        }
        frm.set_df_property('tax_template', 'options', options);
    },

    add_custom_styles: function(frm) {
        if ($('#dc-tax-rule-styles').length) return;

        $('head').append(`
            <style id="dc-tax-rule-styles">
                /* Tax Category Rule Card */
                .dc-rule-card {
                    background: linear-gradient(135deg, #a404e4 0%, #8501b9 100%);
                    border-radius: 16px;
                    padding: 24px;
                    margin-bottom: 24px;
                    color: white;
                    box-shadow: 0 4px 14px rgba(164, 4, 228, 0.25);
                    font-family: 'Poppins', var(--font-stack);
                }

                .dc-rule-card.inactive {
                    background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
                    box-shadow: 0 4px 14px rgba(107, 114, 128, 0.25);
                }

                .dc-rule-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 20px;
                }

                .dc-rule-title {
                    font-size: 1.125rem;
                    font-weight: 600;
                    opacity: 0.9;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .dc-rule-subtitle {
                    font-size: 0.875rem;
                    opacity: 0.8;
                    margin-top: 4px;
                }

                .dc-rule-status-badge {
                    padding: 6px 14px;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .dc-rule-status-badge.active { background: #10b981; }
                .dc-rule-status-badge.inactive { background: rgba(255,255,255,0.2); }

                .dc-rule-main-category {
                    text-align: center;
                    padding: 20px 0;
                    border-top: 1px solid rgba(255,255,255,0.2);
                    border-bottom: 1px solid rgba(255,255,255,0.2);
                }

                .dc-rule-main-label {
                    font-size: 0.875rem;
                    opacity: 0.85;
                    margin-bottom: 8px;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .dc-rule-main-value {
                    font-size: 2rem;
                    font-weight: 700;
                    line-height: 1.2;
                }

                .dc-rule-conditions {
                    margin-top: 20px;
                }

                .dc-rule-conditions-title {
                    font-size: 0.75rem;
                    opacity: 0.8;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    margin-bottom: 12px;
                }

                .dc-rule-condition-tags {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }

                .dc-rule-condition-tag {
                    background: rgba(255,255,255,0.15);
                    border-radius: 20px;
                    padding: 6px 14px;
                    font-size: 0.8rem;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    transition: all 0.2s ease;
                }

                .dc-rule-condition-tag:hover {
                    background: rgba(255,255,255,0.25);
                }

                .dc-rule-condition-tag svg {
                    width: 14px;
                    height: 14px;
                    opacity: 0.9;
                }

                .dc-rule-priority-badge {
                    background: rgba(255,255,255,0.1);
                    border-radius: 12px;
                    padding: 12px 16px;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    margin-top: 16px;
                }

                .dc-rule-priority-label {
                    font-size: 0.75rem;
                    opacity: 0.8;
                    text-transform: uppercase;
                }

                .dc-rule-priority-value {
                    font-size: 1.25rem;
                    font-weight: 700;
                }

                /* Preview Section */
                .dc-rule-preview {
                    background: white;
                    border-radius: 16px;
                    padding: 24px;
                    margin-bottom: 24px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
                    border: 1px solid #e5e7eb;
                }

                .dc-rule-preview-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }

                .dc-rule-preview-title {
                    font-size: 1rem;
                    font-weight: 600;
                    color: #1f2937;
                }

                .dc-rule-preview-refresh {
                    background: #a404e4;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 8px;
                    font-size: 0.875rem;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    transition: all 0.2s ease;
                }

                .dc-rule-preview-refresh:hover {
                    background: #8501b9;
                    transform: translateY(-1px);
                }

                .dc-rule-preview-content {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 20px;
                }

                .dc-rule-preview-section {
                    background: #f9fafb;
                    border-radius: 12px;
                    padding: 16px;
                }

                .dc-rule-preview-section-title {
                    font-size: 0.875rem;
                    font-weight: 600;
                    color: #374151;
                    margin-bottom: 12px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .dc-rule-preview-count {
                    background: #a404e4;
                    color: white;
                    padding: 2px 10px;
                    border-radius: 12px;
                    font-size: 0.75rem;
                    font-weight: 600;
                }

                .dc-rule-preview-samples {
                    font-size: 0.8rem;
                    color: #6b7280;
                }

                .dc-rule-preview-sample {
                    padding: 8px 0;
                    border-bottom: 1px solid #e5e7eb;
                }

                .dc-rule-preview-sample:last-child {
                    border-bottom: none;
                }

                .dc-rule-preview-sample-name {
                    color: #a404e4;
                    font-weight: 500;
                }

                .dc-rule-preview-loading {
                    text-align: center;
                    padding: 40px;
                    color: #6b7280;
                }

                .dc-rule-preview-empty {
                    text-align: center;
                    padding: 20px;
                    color: #9ca3af;
                    font-style: italic;
                }

                /* Action Buttons */
                .dc-rule-actions {
                    display: flex;
                    gap: 12px;
                    margin-bottom: 20px;
                }

                .dc-rule-action-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 12px 24px;
                    border-radius: 10px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    border: none;
                }

                .dc-rule-action-btn.primary {
                    background: linear-gradient(135deg, #a404e4 0%, #8501b9 100%);
                    color: white;
                    box-shadow: 0 2px 8px rgba(164, 4, 228, 0.3);
                }

                .dc-rule-action-btn.primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(164, 4, 228, 0.4);
                }

                .dc-rule-action-btn.secondary {
                    background: white;
                    color: #a404e4;
                    border: 2px solid #a404e4;
                }

                .dc-rule-action-btn.secondary:hover {
                    background: #f8f5ff;
                }

                /* Mobile responsive */
                @media (max-width: 768px) {
                    .dc-rule-preview-content {
                        grid-template-columns: 1fr;
                    }

                    .dc-rule-actions {
                        flex-direction: column;
                    }
                }
            </style>
        `);
    },

    add_rule_card: function(frm) {
        // Remove existing card
        frm.$wrapper.find('.dc-rule-card').remove();

        // Only show for saved documents
        if (frm.is_new()) return;

        // Escape helper function for security
        const escapeHtml = (text) => {
            const div = document.createElement('div');
            div.textContent = text || '';
            return div.innerHTML;
        };

        // Status
        const isActive = frm.doc.is_active;
        const statusClass = isActive ? 'active' : 'inactive';
        const statusText = isActive ? 'Active' : 'Inactive';
        const cardClass = isActive ? '' : 'inactive';

        // Build conditions list
        let conditions = [];

        if (frm.doc.apply_to) {
            conditions.push({
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
                text: frm.doc.apply_to
            });
        }

        if (frm.doc.item_group) {
            conditions.push({
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>',
                text: 'Item: ' + escapeHtml(frm.doc.item_group)
            });
        }

        if (frm.doc.customer_group) {
            conditions.push({
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
                text: 'Customer: ' + escapeHtml(frm.doc.customer_group)
            });
        }

        if (frm.doc.supplier_group) {
            conditions.push({
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 3h22"/><path d="M1 9h22"/><path d="M1 15h22"/><path d="M1 21h22"/></svg>',
                text: 'Supplier: ' + escapeHtml(frm.doc.supplier_group)
            });
        }

        if (frm.doc.emirate) {
            conditions.push({
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
                text: escapeHtml(frm.doc.emirate)
            });
        }

        const conditionsHtml = conditions.length > 0 ? `
            <div class="dc-rule-conditions">
                <div class="dc-rule-conditions-title">Matching Conditions</div>
                <div class="dc-rule-condition-tags">
                    ${conditions.map(c => `
                        <div class="dc-rule-condition-tag">
                            ${c.icon}
                            ${c.text}
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : '';

        const $card = $(`
            <div class="dc-rule-card ${cardClass} dc-fade-in">
                <div class="dc-rule-header">
                    <div>
                        <div class="dc-rule-title">Tax Category Rule</div>
                        <div class="dc-rule-subtitle">${escapeHtml(frm.doc.rule_name)}</div>
                    </div>
                    <div class="dc-rule-status-badge ${statusClass}">${escapeHtml(statusText)}</div>
                </div>
                <div class="dc-rule-main-category">
                    <div class="dc-rule-main-label">Assigned Tax Category</div>
                    <div class="dc-rule-main-value">${escapeHtml(frm.doc.tax_category || 'Not Set')}</div>
                </div>
                ${conditionsHtml}
                <div class="dc-rule-priority-badge">
                    <span class="dc-rule-priority-label">Priority</span>
                    <span class="dc-rule-priority-value">${cint(frm.doc.priority)}</span>
                </div>
            </div>
        `);

        // Insert after form header
        frm.$wrapper.find('.form-page').first().prepend($card);
    },

    add_preview_button: function(frm) {
        // Remove existing preview container
        frm.$wrapper.find('.dc-rule-preview').remove();

        // Only show for saved documents
        if (frm.is_new()) return;

        // Add preview section
        const $preview = $(`
            <div class="dc-rule-preview">
                <div class="dc-rule-preview-header">
                    <div class="dc-rule-preview-title">Rule Preview - Matching Documents</div>
                    <button class="dc-rule-preview-refresh">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="23 4 23 10 17 10"/>
                            <polyline points="1 20 1 14 7 14"/>
                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                        </svg>
                        Refresh Preview
                    </button>
                </div>
                <div class="dc-rule-preview-content">
                    <div class="dc-rule-preview-loading">Click "Refresh Preview" to see matching documents</div>
                </div>
            </div>
        `);

        // Insert after card
        const $card = frm.$wrapper.find('.dc-rule-card');
        if ($card.length) {
            $card.after($preview);
        } else {
            frm.$wrapper.find('.form-page').first().prepend($preview);
        }

        // Bind refresh button
        $preview.find('.dc-rule-preview-refresh').on('click', function() {
            frm.trigger('load_preview');
        });
    },

    load_preview: function(frm) {
        const $previewContent = frm.$wrapper.find('.dc-rule-preview-content');
        $previewContent.html('<div class="dc-rule-preview-loading">Loading preview...</div>');

        // Escape helper function for security
        const escapeHtml = (text) => {
            const div = document.createElement('div');
            div.textContent = text || '';
            return div.innerHTML;
        };

        frappe.call({
            method: 'digicomply.digicomply.doctype.tax_category_rule.tax_category_rule.get_rule_preview',
            args: {
                rule_name: frm.doc.name
            },
            callback: function(r) {
                if (r.message) {
                    const preview = r.message;
                    let html = '';

                    // Sales Invoice section
                    if (frm.doc.apply_to === 'Sales Invoice' || frm.doc.apply_to === 'Both') {
                        const si = preview.sales_invoice;
                        html += `
                            <div class="dc-rule-preview-section">
                                <div class="dc-rule-preview-section-title">
                                    Sales Invoices
                                    <span class="dc-rule-preview-count">${si.count}</span>
                                </div>
                                <div class="dc-rule-preview-samples">
                                    ${si.samples.length > 0 ? si.samples.map(s => `
                                        <div class="dc-rule-preview-sample">
                                            <span class="dc-rule-preview-sample-name">${escapeHtml(s.name)}</span>
                                            - ${escapeHtml(s.customer || 'N/A')}
                                        </div>
                                    `).join('') : '<div class="dc-rule-preview-empty">No matching invoices found</div>'}
                                </div>
                            </div>
                        `;
                    }

                    // Purchase Invoice section
                    if (frm.doc.apply_to === 'Purchase Invoice' || frm.doc.apply_to === 'Both') {
                        const pi = preview.purchase_invoice;
                        html += `
                            <div class="dc-rule-preview-section">
                                <div class="dc-rule-preview-section-title">
                                    Purchase Invoices
                                    <span class="dc-rule-preview-count">${pi.count}</span>
                                </div>
                                <div class="dc-rule-preview-samples">
                                    ${pi.samples.length > 0 ? pi.samples.map(s => `
                                        <div class="dc-rule-preview-sample">
                                            <span class="dc-rule-preview-sample-name">${escapeHtml(s.name)}</span>
                                            - ${escapeHtml(s.supplier || 'N/A')}
                                        </div>
                                    `).join('') : '<div class="dc-rule-preview-empty">No matching invoices found</div>'}
                                </div>
                            </div>
                        `;
                    }

                    $previewContent.html(html);
                }
            },
            error: function() {
                $previewContent.html('<div class="dc-rule-preview-empty">Error loading preview</div>');
            }
        });
    }
});
