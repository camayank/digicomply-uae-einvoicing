frappe.pages['bulk-import-center'].on_page_load = function(wrapper) {
	new BulkImportCenter(wrapper);
};

class BulkImportCenter {
	constructor(wrapper) {
		this.wrapper = wrapper;
		this.page = frappe.ui.make_app_page({
			parent: wrapper,
			title: __('Bulk Import Center'),
			single_column: true
		});

		this.import_types = [
			{
				name: 'Customer',
				icon: 'users',
				description: 'Import customer records with TRN validation and contact details.',
				template_name: 'Customer Import Template'
			},
			{
				name: 'Supplier',
				icon: 'shopping-cart',
				description: 'Import supplier records with TRN validation and payment terms.',
				template_name: 'Supplier Import Template'
			},
			{
				name: 'Item',
				icon: 'package',
				description: 'Import items with tax templates and pricing information.',
				template_name: 'Item Import Template'
			},
			{
				name: 'TRN Registry',
				icon: 'file-text',
				description: 'Import TRN registry entries for validation purposes.',
				template_name: 'TRN Registry Import Template'
			},
			{
				name: 'ASP Data',
				icon: 'database',
				description: 'Import ASP (Accredited Service Provider) data records.',
				template_name: 'ASP Data Import Template'
			}
		];

		this.make();
		this.load_recent_imports();
	}

	make() {
		this.add_styles();
		this.render_page();
		this.setup_actions();
	}

	add_styles() {
		const styles = `
			<style>
				.dc-bulk-import-container {
					padding: 20px;
					max-width: 1400px;
					margin: 0 auto;
				}

				.dc-section-header {
					font-size: 18px;
					font-weight: 600;
					color: #333;
					margin-bottom: 20px;
					padding-bottom: 10px;
					border-bottom: 2px solid #a404e4;
				}

				.dc-import-cards-grid {
					display: grid;
					grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
					gap: 20px;
					margin-bottom: 40px;
				}

				.dc-import-card {
					background: #fff;
					border: 1px solid #e0e0e0;
					border-radius: 8px;
					padding: 24px;
					transition: all 0.3s ease;
					box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
				}

				.dc-import-card:hover {
					border-color: #a404e4;
					box-shadow: 0 4px 12px rgba(164, 4, 228, 0.15);
					transform: translateY(-2px);
				}

				.dc-import-card-header {
					display: flex;
					align-items: center;
					margin-bottom: 16px;
				}

				.dc-import-card-icon {
					width: 48px;
					height: 48px;
					background: linear-gradient(135deg, #a404e4, #7b03ab);
					border-radius: 10px;
					display: flex;
					align-items: center;
					justify-content: center;
					margin-right: 16px;
				}

				.dc-import-card-icon svg {
					width: 24px;
					height: 24px;
					stroke: #fff;
					fill: none;
				}

				.dc-import-card-title {
					font-size: 16px;
					font-weight: 600;
					color: #333;
				}

				.dc-import-card-description {
					font-size: 13px;
					color: #666;
					line-height: 1.5;
					margin-bottom: 20px;
					min-height: 40px;
				}

				.dc-import-card-actions {
					display: flex;
					gap: 10px;
				}

				.dc-btn {
					padding: 8px 16px;
					border-radius: 6px;
					font-size: 13px;
					font-weight: 500;
					cursor: pointer;
					transition: all 0.2s ease;
					border: none;
					display: inline-flex;
					align-items: center;
					gap: 6px;
				}

				.dc-btn-primary {
					background: #a404e4;
					color: #fff;
				}

				.dc-btn-primary:hover {
					background: #8a03c2;
				}

				.dc-btn-secondary {
					background: #f5f5f5;
					color: #333;
					border: 1px solid #ddd;
				}

				.dc-btn-secondary:hover {
					background: #e8e8e8;
					border-color: #a404e4;
					color: #a404e4;
				}

				.dc-recent-imports {
					background: #fff;
					border: 1px solid #e0e0e0;
					border-radius: 8px;
					padding: 24px;
				}

				.dc-recent-imports-table {
					width: 100%;
					border-collapse: collapse;
				}

				.dc-recent-imports-table th,
				.dc-recent-imports-table td {
					padding: 12px;
					text-align: left;
					border-bottom: 1px solid #eee;
				}

				.dc-recent-imports-table th {
					font-weight: 600;
					color: #333;
					background: #fafafa;
				}

				.dc-recent-imports-table tr:hover {
					background: #f9f5fc;
				}

				.dc-recent-imports-table a {
					color: #a404e4;
					text-decoration: none;
				}

				.dc-recent-imports-table a:hover {
					text-decoration: underline;
				}

				.dc-status-badge {
					padding: 4px 10px;
					border-radius: 12px;
					font-size: 12px;
					font-weight: 500;
				}

				.dc-status-pending {
					background: #fff3cd;
					color: #856404;
				}

				.dc-status-processing {
					background: #cce5ff;
					color: #004085;
				}

				.dc-status-completed {
					background: #d4edda;
					color: #155724;
				}

				.dc-status-failed {
					background: #f8d7da;
					color: #721c24;
				}

				.dc-status-partially-completed {
					background: #fff3cd;
					color: #856404;
				}

				.dc-empty-state {
					text-align: center;
					padding: 40px;
					color: #666;
				}

				.dc-empty-state svg {
					width: 64px;
					height: 64px;
					stroke: #ccc;
					margin-bottom: 16px;
				}

				@media (max-width: 768px) {
					.dc-import-cards-grid {
						grid-template-columns: 1fr;
					}

					.dc-import-card-actions {
						flex-direction: column;
					}

					.dc-btn {
						width: 100%;
						justify-content: center;
					}
				}
			</style>
		`;
		$(this.wrapper).prepend(styles);
	}

	render_page() {
		const html = `
			<div class="dc-bulk-import-container">
				<div class="dc-section-header">Import Types</div>
				<div class="dc-import-cards-grid">
					${this.import_types.map(type => this.render_import_card(type)).join('')}
				</div>

				<div class="dc-section-header">Recent Imports</div>
				<div class="dc-recent-imports">
					<div class="dc-recent-imports-content">
						<div class="dc-empty-state">
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<circle cx="12" cy="12" r="10"></circle>
								<line x1="12" y1="8" x2="12" y2="12"></line>
								<line x1="12" y1="16" x2="12.01" y2="16"></line>
							</svg>
							<p>Loading recent imports...</p>
						</div>
					</div>
				</div>
			</div>
		`;
		$(this.page.body).html(html);
	}

	render_import_card(type) {
		return `
			<div class="dc-import-card" data-import-type="${type.name}">
				<div class="dc-import-card-header">
					<div class="dc-import-card-icon">
						${this.get_icon_svg(type.icon)}
					</div>
					<div class="dc-import-card-title">${type.name}</div>
				</div>
				<div class="dc-import-card-description">${type.description}</div>
				<div class="dc-import-card-actions">
					<button class="dc-btn dc-btn-secondary dc-download-template" data-template="${type.template_name}" data-type="${type.name}">
						${this.get_icon_svg('download', 14)}
						Download Template
					</button>
					<button class="dc-btn dc-btn-primary dc-start-import" data-type="${type.name}">
						${this.get_icon_svg('upload', 14)}
						Import
					</button>
				</div>
			</div>
		`;
	}

	get_icon_svg(icon, size = 24) {
		const icons = {
			'users': `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`,
			'shopping-cart': `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>`,
			'package': `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>`,
			'file-text': `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`,
			'database': `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>`,
			'download': `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`,
			'upload': `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>`
		};
		return icons[icon] || '';
	}

	setup_actions() {
		const me = this;

		// Download Template button click
		$(this.page.body).on('click', '.dc-download-template', function() {
			const template_name = $(this).data('template');
			const import_type = $(this).data('type');
			me.download_template(template_name, import_type);
		});

		// Import button click
		$(this.page.body).on('click', '.dc-start-import', function() {
			const import_type = $(this).data('type');
			me.start_import(import_type);
		});
	}

	download_template(template_name, import_type) {
		frappe.call({
			method: 'frappe.client.get_list',
			args: {
				doctype: 'Import Template',
				filters: {
					template_name: template_name,
					import_type: import_type,
					is_active: 1
				},
				fields: ['name', 'template_file'],
				limit_page_length: 1
			},
			callback: (r) => {
				if (r.message && r.message.length > 0) {
					const template = r.message[0];
					if (template.template_file) {
						window.open(template.template_file, '_blank');
					} else {
						frappe.msgprint({
							title: __('Template Not Available'),
							message: __('The template file is not available. Please contact the administrator.'),
							indicator: 'orange'
						});
					}
				} else {
					frappe.msgprint({
						title: __('Template Not Found'),
						message: __('No active template found for {0}. Please create an Import Template first.', [import_type]),
						indicator: 'orange'
					});
				}
			}
		});
	}

	start_import(import_type) {
		frappe.new_doc('Bulk Import Log', {
			import_type: import_type
		});
	}

	load_recent_imports() {
		frappe.call({
			method: 'frappe.client.get_list',
			args: {
				doctype: 'Bulk Import Log',
				fields: ['name', 'import_type', 'status', 'total_rows', 'successful_rows', 'failed_rows', 'creation', 'owner'],
				order_by: 'creation desc',
				limit_page_length: 10
			},
			callback: (r) => {
				if (r.message && r.message.length > 0) {
					this.render_recent_imports(r.message);
				} else {
					this.render_empty_imports();
				}
			}
		});
	}

	render_recent_imports(imports) {
		const html = `
			<table class="dc-recent-imports-table">
				<thead>
					<tr>
						<th>Import ID</th>
						<th>Type</th>
						<th>Status</th>
						<th>Progress</th>
						<th>Created By</th>
						<th>Date</th>
					</tr>
				</thead>
				<tbody>
					${imports.map(imp => `
						<tr>
							<td><a href="/app/bulk-import-log/${imp.name}">${imp.name}</a></td>
							<td>${imp.import_type || '-'}</td>
							<td><span class="dc-status-badge dc-status-${(imp.status || 'pending').toLowerCase().replace(' ', '-')}">${imp.status || 'Pending'}</span></td>
							<td>${imp.successful_rows || 0} / ${imp.total_rows || 0} (${imp.failed_rows || 0} failed)</td>
							<td>${imp.owner || '-'}</td>
							<td>${frappe.datetime.prettyDate(imp.creation)}</td>
						</tr>
					`).join('')}
				</tbody>
			</table>
		`;
		$(this.page.body).find('.dc-recent-imports-content').html(html);
	}

	render_empty_imports() {
		const html = `
			<div class="dc-empty-state">
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
					<polyline points="17 8 12 3 7 8"></polyline>
					<line x1="12" y1="3" x2="12" y2="15"></line>
				</svg>
				<p>No imports yet. Start by selecting an import type above.</p>
			</div>
		`;
		$(this.page.body).find('.dc-recent-imports-content').html(html);
	}
}
