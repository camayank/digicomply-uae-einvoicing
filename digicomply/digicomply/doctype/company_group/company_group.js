// Copyright (c) 2024, DigiComply and contributors
// License: MIT

frappe.ui.form.on('Company Group', {
    refresh: function(frm) {
        // Add DigiComply form wrapper class
        frm.$wrapper.find('.form-page').addClass('dc-form-wrapper');

        // Add custom styles
        frm.trigger('add_custom_styles');

        // Show group info card
        frm.trigger('show_group_card');

        // Add action buttons for saved documents
        if (!frm.is_new()) {
            // View All Companies button
            frm.add_custom_button(__('View All Companies'), function() {
                frm.trigger('view_all_companies');
            }, __('Actions'));

            // Reconcile All button (placeholder for future)
            frm.add_custom_button(__('Reconcile All'), function() {
                frappe.msgprint({
                    title: __('Multi-TRN Reconciliation'),
                    indicator: 'blue',
                    message: __('Multi-TRN reconciliation across all group companies will be available in a future release. ' +
                               'This feature will allow you to reconcile VAT returns for all companies in this group simultaneously.')
                });
            }, __('Actions'));

            // View Hierarchy button (if has child groups)
            frm.add_custom_button(__('View Hierarchy'), function() {
                frm.trigger('view_hierarchy');
            }, __('Actions'));
        }
    },

    add_custom_styles: function(frm) {
        if ($('#company-group-styles').length) return;

        $('head').append(`
            <style id="company-group-styles">
                /* DigiComply Form Wrapper */
                .dc-form-wrapper {
                    font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                /* Group Card */
                .dc-group-card {
                    background: linear-gradient(135deg, #a404e4 0%, #8501b9 100%);
                    border-radius: 16px;
                    padding: 24px;
                    margin-bottom: 24px;
                    color: white;
                    box-shadow: 0 4px 14px rgba(164, 4, 228, 0.25);
                }

                .dc-group-card.inactive {
                    background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
                    box-shadow: 0 4px 14px rgba(107, 114, 128, 0.25);
                }

                .dc-group-header {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    margin-bottom: 20px;
                }

                .dc-group-icon {
                    width: 64px;
                    height: 64px;
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .dc-group-info {
                    flex: 1;
                }

                .dc-group-name {
                    font-size: 1.5rem;
                    font-weight: 700;
                    margin-bottom: 4px;
                }

                .dc-group-type {
                    font-size: 0.875rem;
                    opacity: 0.9;
                }

                .dc-group-status-badge {
                    background: rgba(255, 255, 255, 0.25);
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .dc-group-stats {
                    display: flex;
                    gap: 24px;
                    padding-top: 16px;
                    border-top: 1px solid rgba(255, 255, 255, 0.2);
                }

                .dc-group-stat-item {
                    flex: 1;
                    text-align: center;
                }

                .dc-group-stat-value {
                    font-size: 1.5rem;
                    font-weight: 700;
                    margin-bottom: 4px;
                }

                .dc-group-stat-label {
                    font-size: 0.6875rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    opacity: 0.8;
                }

                /* Companies Dialog */
                .dc-companies-dialog .modal-dialog {
                    max-width: 900px;
                }

                .dc-companies-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 16px;
                }

                .dc-companies-table th,
                .dc-companies-table td {
                    padding: 12px;
                    text-align: left;
                    border-bottom: 1px solid #e5e7eb;
                }

                .dc-companies-table th {
                    background: #f9fafb;
                    font-weight: 600;
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: #6b7280;
                }

                .dc-companies-table tr:hover {
                    background: #f9fafb;
                }

                .dc-role-badge {
                    display: inline-block;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 0.75rem;
                    font-weight: 500;
                }

                .dc-role-badge.parent {
                    background: #dbeafe;
                    color: #1e40af;
                }

                .dc-role-badge.subsidiary {
                    background: #dcfce7;
                    color: #166534;
                }

                .dc-role-badge.branch {
                    background: #fef3c7;
                    color: #92400e;
                }

                .dc-role-badge.affiliate {
                    background: #f3e8ff;
                    color: #7c3aed;
                }

                .dc-primary-star {
                    color: #f59e0b;
                    margin-left: 4px;
                }

                .dc-group-level {
                    display: inline-block;
                    padding: 2px 6px;
                    background: #e5e7eb;
                    border-radius: 4px;
                    font-size: 0.6875rem;
                    color: #4b5563;
                }

                /* Hierarchy Tree */
                .dc-hierarchy-tree {
                    padding: 16px;
                }

                .dc-hierarchy-node {
                    margin-left: 24px;
                    padding: 8px 0;
                    border-left: 2px solid #e5e7eb;
                    padding-left: 16px;
                }

                .dc-hierarchy-node:first-child {
                    margin-left: 0;
                    border-left: none;
                    padding-left: 0;
                }

                .dc-hierarchy-group {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 12px;
                    background: #f9fafb;
                    border-radius: 8px;
                    margin-bottom: 8px;
                }

                .dc-hierarchy-group-icon {
                    width: 32px;
                    height: 32px;
                    background: #a404e4;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                }

                .dc-hierarchy-companies {
                    margin-left: 40px;
                    padding: 8px;
                    background: #fff;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    margin-bottom: 8px;
                }

                .dc-hierarchy-company {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 4px 0;
                    font-size: 0.875rem;
                }

                /* Animation */
                .dc-fade-in {
                    animation: dcFadeIn 0.3s ease-out;
                }

                @keyframes dcFadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                /* Mobile responsive */
                @media (max-width: 768px) {
                    .dc-group-header {
                        flex-direction: column;
                        text-align: center;
                    }

                    .dc-group-stats {
                        flex-direction: column;
                        gap: 12px;
                    }
                }
            </style>
        `);
    },

    show_group_card: function(frm) {
        // Remove existing card
        frm.$wrapper.find('.dc-group-card').remove();

        // Only show for saved documents
        if (frm.is_new() || !frm.doc.group_name) return;

        // Count companies
        let company_count = frm.doc.companies ? frm.doc.companies.length : 0;

        // Status class
        let status_class = frm.doc.is_active ? '' : 'inactive';

        // Group type icon
        let group_icon = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>`;

        // Build card
        let $card = $(`
            <div class="dc-group-card ${status_class} dc-fade-in">
                <div class="dc-group-header">
                    <div class="dc-group-icon">${group_icon}</div>
                    <div class="dc-group-info">
                        <div class="dc-group-name">${frm.doc.group_name}</div>
                        <div class="dc-group-type">${frm.doc.group_type || 'No type specified'}${frm.doc.parent_group ? ' - Child of ' + frm.doc.parent_group : ''}</div>
                    </div>
                    <div class="dc-group-status-badge">${frm.doc.is_active ? 'Active' : 'Inactive'}</div>
                </div>
                <div class="dc-group-stats">
                    <div class="dc-group-stat-item">
                        <div class="dc-group-stat-value">${company_count}</div>
                        <div class="dc-group-stat-label">Direct Companies</div>
                    </div>
                    <div class="dc-group-stat-item">
                        <div class="dc-group-stat-value">${frm.doc.default_asp_provider || '-'}</div>
                        <div class="dc-group-stat-label">ASP Provider</div>
                    </div>
                    <div class="dc-group-stat-item">
                        <div class="dc-group-stat-value">${frm.doc.reconciliation_tolerance || '0.50'}</div>
                        <div class="dc-group-stat-label">Tolerance (AED)</div>
                    </div>
                </div>
            </div>
        `);

        // Insert card at top of form
        frm.$wrapper.find('.form-page').first().prepend($card);
    },

    view_all_companies: function(frm) {
        frappe.call({
            method: 'digicomply.digicomply.doctype.company_group.company_group.get_group_companies',
            args: {
                group_name: frm.doc.name,
                include_child_groups: true
            },
            callback: function(r) {
                if (r.message) {
                    frm.trigger('show_companies_dialog', r.message);
                }
            }
        });
    },

    show_companies_dialog: function(frm, data) {
        let companies = data.companies || [];

        // Build table HTML
        let table_html = `
            <div style="margin-bottom: 16px;">
                <strong>Total Entries:</strong> ${data.total_entries} |
                <strong>Unique Companies:</strong> ${data.unique_companies} |
                <strong>Groups:</strong> ${data.groups_involved.length}
            </div>
            <table class="dc-companies-table">
                <thead>
                    <tr>
                        <th>Company</th>
                        <th>TRN</th>
                        <th>Role</th>
                        <th>Group</th>
                        <th>Level</th>
                    </tr>
                </thead>
                <tbody>
        `;

        if (companies.length === 0) {
            table_html += `
                <tr>
                    <td colspan="5" style="text-align: center; color: #6b7280; padding: 24px;">
                        No companies in this group
                    </td>
                </tr>
            `;
        } else {
            companies.forEach(function(company) {
                let role_class = (company.role_in_group || '').toLowerCase().replace(' ', '-');
                let primary_star = company.is_primary ? '<span class="dc-primary-star">&#9733;</span>' : '';

                table_html += `
                    <tr>
                        <td>${company.company}${primary_star}</td>
                        <td>${company.trn || '-'}</td>
                        <td><span class="dc-role-badge ${role_class}">${company.role_in_group || '-'}</span></td>
                        <td>${company.group}</td>
                        <td><span class="dc-group-level">Level ${company.group_level}</span></td>
                    </tr>
                `;
            });
        }

        table_html += '</tbody></table>';

        let dialog = new frappe.ui.Dialog({
            title: __('All Companies in {0}', [frm.doc.group_name]),
            size: 'large',
            fields: [
                {
                    fieldtype: 'HTML',
                    fieldname: 'companies_html',
                    options: table_html
                }
            ],
            primary_action_label: __('Close'),
            primary_action: function() {
                dialog.hide();
            }
        });

        dialog.$wrapper.addClass('dc-companies-dialog');
        dialog.show();
    },

    view_hierarchy: function(frm) {
        frappe.call({
            method: 'digicomply.digicomply.doctype.company_group.company_group.get_group_hierarchy',
            args: {
                group_name: frm.doc.name
            },
            callback: function(r) {
                if (r.message) {
                    frm.trigger('show_hierarchy_dialog', r.message);
                }
            }
        });
    },

    show_hierarchy_dialog: function(frm, tree) {
        function render_node(node, level) {
            let html = '';
            let indent = level * 24;

            // Group header
            html += `
                <div class="dc-hierarchy-group" style="margin-left: ${indent}px;">
                    <div class="dc-hierarchy-group-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                            <circle cx="9" cy="7" r="4"/>
                        </svg>
                    </div>
                    <div>
                        <strong>${node.group_name}</strong>
                        <span style="color: #6b7280; font-size: 0.875rem; margin-left: 8px;">${node.group_type || ''}</span>
                        ${!node.is_active ? '<span style="color: #ef4444; margin-left: 8px;">(Inactive)</span>' : ''}
                    </div>
                </div>
            `;

            // Companies in this group
            if (node.companies && node.companies.length > 0) {
                html += `<div class="dc-hierarchy-companies" style="margin-left: ${indent + 40}px;">`;
                node.companies.forEach(function(company) {
                    let primary_star = company.is_primary ? '<span class="dc-primary-star">&#9733;</span>' : '';
                    html += `
                        <div class="dc-hierarchy-company">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                            </svg>
                            ${company.company}${primary_star}
                            <span style="color: #6b7280;">- ${company.role_in_group || 'Member'}</span>
                        </div>
                    `;
                });
                html += '</div>';
            }

            // Child groups
            if (node.children && node.children.length > 0) {
                node.children.forEach(function(child) {
                    html += render_node(child, level + 1);
                });
            }

            return html;
        }

        let hierarchy_html = `
            <div class="dc-hierarchy-tree">
                ${render_node(tree, 0)}
            </div>
        `;

        let dialog = new frappe.ui.Dialog({
            title: __('Group Hierarchy: {0}', [frm.doc.group_name]),
            size: 'large',
            fields: [
                {
                    fieldtype: 'HTML',
                    fieldname: 'hierarchy_html',
                    options: hierarchy_html
                }
            ],
            primary_action_label: __('Close'),
            primary_action: function() {
                dialog.hide();
            }
        });

        dialog.show();
    }
});
