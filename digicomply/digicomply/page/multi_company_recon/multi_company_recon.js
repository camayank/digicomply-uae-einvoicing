frappe.pages['multi-company-recon'].on_page_load = function(wrapper) {
	new MultiCompanyReconciliation(wrapper);
};

class MultiCompanyReconciliation {
	constructor(wrapper) {
		this.wrapper = wrapper;
		this.page = frappe.ui.make_app_page({
			parent: wrapper,
			title: __('Multi-Company Reconciliation'),
			single_column: true
		});

		this.company_group = null;
		this.from_date = null;
		this.to_date = null;
		this.companies_data = [];

		this.make();
	}

	make() {
		this.add_styles();
		this.setup_filters();
		this.setup_actions();
		this.render_page();
		this.load_recent_runs();
	}

	add_styles() {
		const styles = `
			<style>
				.dc-multi-recon-container {
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

				.dc-filters-section {
					background: #fff;
					border: 1px solid #e0e0e0;
					border-radius: 8px;
					padding: 20px;
					margin-bottom: 24px;
					box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
				}

				.dc-filters-row {
					display: flex;
					flex-wrap: wrap;
					gap: 20px;
					align-items: flex-end;
				}

				.dc-filter-field {
					flex: 1;
					min-width: 200px;
				}

				.dc-filter-field label {
					display: block;
					font-size: 13px;
					font-weight: 500;
					color: #555;
					margin-bottom: 6px;
				}

				.dc-company-cards-grid {
					display: grid;
					grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
					gap: 20px;
					margin-bottom: 32px;
				}

				.dc-company-card {
					background: #fff;
					border: 1px solid #e0e0e0;
					border-radius: 10px;
					padding: 20px;
					transition: all 0.3s ease;
					box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
					position: relative;
					overflow: hidden;
				}

				.dc-company-card:hover {
					border-color: #a404e4;
					box-shadow: 0 4px 12px rgba(164, 4, 228, 0.15);
					transform: translateY(-2px);
				}

				.dc-company-card-header {
					display: flex;
					justify-content: space-between;
					align-items: flex-start;
					margin-bottom: 16px;
				}

				.dc-company-card-name {
					font-size: 16px;
					font-weight: 600;
					color: #333;
					margin: 0;
				}

				.dc-company-card-abbr {
					font-size: 12px;
					color: #888;
					margin-top: 4px;
				}

				.dc-match-badge {
					padding: 6px 12px;
					border-radius: 20px;
					font-size: 14px;
					font-weight: 600;
				}

				.dc-match-high {
					background: #d4edda;
					color: #155724;
				}

				.dc-match-medium {
					background: #fff3cd;
					color: #856404;
				}

				.dc-match-low {
					background: #f8d7da;
					color: #721c24;
				}

				.dc-match-none {
					background: #e9ecef;
					color: #6c757d;
				}

				.dc-company-card-stats {
					display: grid;
					grid-template-columns: repeat(3, 1fr);
					gap: 12px;
					margin-bottom: 16px;
				}

				.dc-stat-item {
					text-align: center;
				}

				.dc-stat-value {
					font-size: 20px;
					font-weight: 700;
					color: #333;
				}

				.dc-stat-label {
					font-size: 11px;
					color: #888;
					text-transform: uppercase;
					letter-spacing: 0.5px;
				}

				.dc-stat-green { color: #28a745; }
				.dc-stat-yellow { color: #ffc107; }
				.dc-stat-red { color: #dc3545; }

				.dc-company-card-footer {
					display: flex;
					justify-content: space-between;
					align-items: center;
					padding-top: 12px;
					border-top: 1px solid #eee;
				}

				.dc-last-recon {
					font-size: 12px;
					color: #666;
				}

				.dc-view-link {
					font-size: 13px;
					color: #a404e4;
					text-decoration: none;
					font-weight: 500;
				}

				.dc-view-link:hover {
					text-decoration: underline;
				}

				.dc-history-section {
					background: #fff;
					border: 1px solid #e0e0e0;
					border-radius: 8px;
					padding: 24px;
					box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
				}

				.dc-history-table {
					width: 100%;
					border-collapse: collapse;
				}

				.dc-history-table th,
				.dc-history-table td {
					padding: 12px;
					text-align: left;
					border-bottom: 1px solid #eee;
				}

				.dc-history-table th {
					font-weight: 600;
					color: #333;
					background: #fafafa;
					font-size: 13px;
				}

				.dc-history-table tr:hover {
					background: #f9f5fc;
					cursor: pointer;
				}

				.dc-history-table a {
					color: #a404e4;
					text-decoration: none;
					font-weight: 500;
				}

				.dc-history-table a:hover {
					text-decoration: underline;
				}

				.dc-status-badge {
					padding: 4px 10px;
					border-radius: 12px;
					font-size: 12px;
					font-weight: 500;
				}

				.dc-status-completed {
					background: #d4edda;
					color: #155724;
				}

				.dc-status-in-progress {
					background: #cce5ff;
					color: #004085;
				}

				.dc-status-draft {
					background: #e9ecef;
					color: #495057;
				}

				.dc-status-failed {
					background: #f8d7da;
					color: #721c24;
				}

				.dc-empty-state {
					text-align: center;
					padding: 60px 20px;
					color: #666;
				}

				.dc-empty-state-icon {
					font-size: 48px;
					margin-bottom: 16px;
					opacity: 0.5;
				}

				.dc-empty-state-title {
					font-size: 18px;
					font-weight: 600;
					color: #333;
					margin-bottom: 8px;
				}

				.dc-empty-state-desc {
					font-size: 14px;
					max-width: 400px;
					margin: 0 auto;
				}

				.dc-progress-bar {
					width: 100%;
					height: 8px;
					background: #e9ecef;
					border-radius: 4px;
					overflow: hidden;
					margin-top: 12px;
				}

				.dc-progress-fill {
					height: 100%;
					border-radius: 4px;
					transition: width 0.3s ease;
				}

				.dc-progress-high { background: linear-gradient(90deg, #28a745, #34ce57); }
				.dc-progress-medium { background: linear-gradient(90deg, #ffc107, #ffcd39); }
				.dc-progress-low { background: linear-gradient(90deg, #dc3545, #e4606d); }

				.dc-loading {
					text-align: center;
					padding: 40px;
					color: #666;
				}

				.dc-loading-spinner {
					display: inline-block;
					width: 40px;
					height: 40px;
					border: 3px solid #f3f3f3;
					border-top: 3px solid #a404e4;
					border-radius: 50%;
					animation: dc-spin 1s linear infinite;
				}

				@keyframes dc-spin {
					0% { transform: rotate(0deg); }
					100% { transform: rotate(360deg); }
				}

				@media (max-width: 768px) {
					.dc-filters-row {
						flex-direction: column;
					}

					.dc-filter-field {
						width: 100%;
					}

					.dc-company-cards-grid {
						grid-template-columns: 1fr;
					}

					.dc-history-table {
						display: block;
						overflow-x: auto;
					}
				}
			</style>
		`;
		$(this.wrapper).prepend(styles);
	}

	setup_filters() {
		const me = this;

		// Company Group filter
		this.company_group_field = this.page.add_field({
			fieldname: 'company_group',
			label: __('Company Group'),
			fieldtype: 'Link',
			options: 'Company Group',
			change: function() {
				me.company_group = this.get_value();
				me.load_company_cards();
			}
		});

		// From Date filter
		this.from_date_field = this.page.add_field({
			fieldname: 'from_date',
			label: __('From Date'),
			fieldtype: 'Date',
			default: frappe.datetime.add_months(frappe.datetime.get_today(), -1),
			change: function() {
				me.from_date = this.get_value();
			}
		});

		// To Date filter
		this.to_date_field = this.page.add_field({
			fieldname: 'to_date',
			label: __('To Date'),
			fieldtype: 'Date',
			default: frappe.datetime.get_today(),
			change: function() {
				me.to_date = this.get_value();
			}
		});

		// Set initial values
		this.from_date = this.from_date_field.get_value();
		this.to_date = this.to_date_field.get_value();
	}

	setup_actions() {
		const me = this;

		this.page.set_primary_action(__('Run Reconciliation'), function() {
			me.run_reconciliation();
		}, 'octicon octicon-sync');

		this.page.set_secondary_action(__('Refresh'), function() {
			me.refresh_data();
		}, 'octicon octicon-refresh');
	}

	render_page() {
		const html = `
			<div class="dc-multi-recon-container">
				<div class="dc-section-header">Company Overview</div>
				<div class="dc-company-cards-section">
					<div class="dc-empty-state">
						<div class="dc-empty-state-icon">
							<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
								<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
								<polyline points="9 22 9 12 15 12 15 22"></polyline>
							</svg>
						</div>
						<div class="dc-empty-state-title">Select a Company Group</div>
						<div class="dc-empty-state-desc">Choose a company group from the filter above to view reconciliation status for all member companies.</div>
					</div>
				</div>

				<div class="dc-section-header" style="margin-top: 32px;">Recent Reconciliation Runs</div>
				<div class="dc-history-section">
					<div class="dc-history-content">
						<div class="dc-loading">
							<div class="dc-loading-spinner"></div>
							<p>Loading recent runs...</p>
						</div>
					</div>
				</div>
			</div>
		`;
		$(this.page.body).html(html);
	}

	load_company_cards() {
		const me = this;

		if (!this.company_group) {
			$(this.page.body).find('.dc-company-cards-section').html(`
				<div class="dc-empty-state">
					<div class="dc-empty-state-icon">
						<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
							<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
							<polyline points="9 22 9 12 15 12 15 22"></polyline>
						</svg>
					</div>
					<div class="dc-empty-state-title">Select a Company Group</div>
					<div class="dc-empty-state-desc">Choose a company group from the filter above to view reconciliation status for all member companies.</div>
				</div>
			`);
			return;
		}

		$(this.page.body).find('.dc-company-cards-section').html(`
			<div class="dc-loading">
				<div class="dc-loading-spinner"></div>
				<p>Loading companies...</p>
			</div>
		`);

		// Fetch company group members and their reconciliation data
		frappe.call({
			method: 'frappe.client.get',
			args: {
				doctype: 'Company Group',
				name: this.company_group
			},
			callback: function(r) {
				if (r.message && r.message.companies) {
					me.load_company_reconciliation_data(r.message.companies);
				} else {
					me.render_no_companies();
				}
			}
		});
	}

	load_company_reconciliation_data(companies) {
		const me = this;
		const company_names = companies.map(c => c.company);

		if (company_names.length === 0) {
			this.render_no_companies();
			return;
		}

		// Get last reconciliation run for each company
		frappe.call({
			method: 'frappe.client.get_list',
			args: {
				doctype: 'Reconciliation Run',
				filters: [
					['company', 'in', company_names],
					['status', '=', 'Completed']
				],
				fields: ['name', 'company', 'match_percentage', 'total_invoices', 'matched_count', 'mismatched_count', 'missing_in_asp', 'posting_date', 'creation'],
				order_by: 'creation desc',
				group_by: 'company'
			},
			callback: function(r) {
				const recon_data = {};
				if (r.message) {
					r.message.forEach(run => {
						if (!recon_data[run.company]) {
							recon_data[run.company] = run;
						}
					});
				}

				// Also get company details
				frappe.call({
					method: 'frappe.client.get_list',
					args: {
						doctype: 'Company',
						filters: [['name', 'in', company_names]],
						fields: ['name', 'abbr', 'company_name']
					},
					callback: function(company_res) {
						const company_details = {};
						if (company_res.message) {
							company_res.message.forEach(c => {
								company_details[c.name] = c;
							});
						}

						me.companies_data = companies.map(c => ({
							company: c.company,
							abbr: company_details[c.company]?.abbr || '',
							company_name: company_details[c.company]?.company_name || c.company,
							recon: recon_data[c.company] || null
						}));

						me.render_company_cards();
					}
				});
			}
		});
	}

	render_company_cards() {
		if (this.companies_data.length === 0) {
			this.render_no_companies();
			return;
		}

		const cards_html = this.companies_data.map(company => this.render_company_card(company)).join('');

		$(this.page.body).find('.dc-company-cards-section').html(`
			<div class="dc-company-cards-grid">
				${cards_html}
			</div>
		`);
	}

	render_company_card(company) {
		const recon = company.recon;
		let match_pct = recon ? (recon.match_percentage || 0) : 0;
		let match_class = this.get_match_class(match_pct);
		let progress_class = this.get_progress_class(match_pct);
		let last_recon_date = recon ? frappe.datetime.prettyDate(recon.posting_date) : 'Never';
		let total = recon ? (recon.total_invoices || 0) : 0;
		let matched = recon ? (recon.matched_count || 0) : 0;
		let mismatched = recon ? (recon.mismatched_count || 0) : 0;
		let missing = recon ? (recon.missing_in_asp || 0) : 0;

		return `
			<div class="dc-company-card" data-company="${company.company}">
				<div class="dc-company-card-header">
					<div>
						<h4 class="dc-company-card-name">${company.company_name}</h4>
						<div class="dc-company-card-abbr">${company.abbr || ''}</div>
					</div>
					<span class="dc-match-badge ${match_class}">${match_pct.toFixed(1)}%</span>
				</div>

				<div class="dc-company-card-stats">
					<div class="dc-stat-item">
						<div class="dc-stat-value">${total}</div>
						<div class="dc-stat-label">Total</div>
					</div>
					<div class="dc-stat-item">
						<div class="dc-stat-value dc-stat-green">${matched}</div>
						<div class="dc-stat-label">Matched</div>
					</div>
					<div class="dc-stat-item">
						<div class="dc-stat-value dc-stat-red">${mismatched + missing}</div>
						<div class="dc-stat-label">Issues</div>
					</div>
				</div>

				<div class="dc-progress-bar">
					<div class="dc-progress-fill ${progress_class}" style="width: ${match_pct}%"></div>
				</div>

				<div class="dc-company-card-footer">
					<span class="dc-last-recon">Last run: ${last_recon_date}</span>
					${recon ? `<a href="/app/reconciliation-run/${recon.name}" class="dc-view-link">View Details</a>` : ''}
				</div>
			</div>
		`;
	}

	render_no_companies() {
		$(this.page.body).find('.dc-company-cards-section').html(`
			<div class="dc-empty-state">
				<div class="dc-empty-state-icon">
					<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<circle cx="12" cy="12" r="10"></circle>
						<line x1="12" y1="8" x2="12" y2="12"></line>
						<line x1="12" y1="16" x2="12.01" y2="16"></line>
					</svg>
				</div>
				<div class="dc-empty-state-title">No Companies Found</div>
				<div class="dc-empty-state-desc">The selected company group has no member companies. Add companies to the group to start reconciliation.</div>
			</div>
		`);
	}

	get_match_class(percentage) {
		if (percentage >= 90) return 'dc-match-high';
		if (percentage >= 70) return 'dc-match-medium';
		if (percentage > 0) return 'dc-match-low';
		return 'dc-match-none';
	}

	get_progress_class(percentage) {
		if (percentage >= 90) return 'dc-progress-high';
		if (percentage >= 70) return 'dc-progress-medium';
		return 'dc-progress-low';
	}

	load_recent_runs() {
		const me = this;

		frappe.call({
			method: 'frappe.client.get_list',
			args: {
				doctype: 'Reconciliation Run',
				filters: [['company_group', 'is', 'set']],
				fields: ['name', 'company', 'company_group', 'status', 'match_percentage', 'total_invoices', 'posting_date', 'creation'],
				order_by: 'creation desc',
				limit_page_length: 10
			},
			callback: function(r) {
				if (r.message && r.message.length > 0) {
					me.render_history_table(r.message);
				} else {
					// Fall back to recent runs without company_group filter
					me.load_all_recent_runs();
				}
			}
		});
	}

	load_all_recent_runs() {
		const me = this;

		frappe.call({
			method: 'frappe.client.get_list',
			args: {
				doctype: 'Reconciliation Run',
				fields: ['name', 'company', 'company_group', 'status', 'match_percentage', 'total_invoices', 'posting_date', 'creation'],
				order_by: 'creation desc',
				limit_page_length: 10
			},
			callback: function(r) {
				if (r.message && r.message.length > 0) {
					me.render_history_table(r.message);
				} else {
					me.render_empty_history();
				}
			}
		});
	}

	render_history_table(runs) {
		const me = this;

		const rows_html = runs.map(run => {
			const status_class = `dc-status-${(run.status || 'draft').toLowerCase().replace(' ', '-')}`;
			const match_pct = run.match_percentage || 0;
			const match_class = me.get_match_class(match_pct);

			return `
				<tr data-name="${run.name}" onclick="frappe.set_route('Form', 'Reconciliation Run', '${run.name}')">
					<td><a href="/app/reconciliation-run/${run.name}">${run.name}</a></td>
					<td>${run.company || '-'}</td>
					<td>${run.company_group || '-'}</td>
					<td><span class="dc-status-badge ${status_class}">${run.status || 'Draft'}</span></td>
					<td><span class="dc-match-badge ${match_class}">${match_pct.toFixed(1)}%</span></td>
					<td>${run.total_invoices || 0}</td>
					<td>${frappe.datetime.str_to_user(run.posting_date)}</td>
				</tr>
			`;
		}).join('');

		const html = `
			<table class="dc-history-table">
				<thead>
					<tr>
						<th>Run ID</th>
						<th>Company</th>
						<th>Company Group</th>
						<th>Status</th>
						<th>Match %</th>
						<th>Invoices</th>
						<th>Date</th>
					</tr>
				</thead>
				<tbody>
					${rows_html}
				</tbody>
			</table>
		`;

		$(this.page.body).find('.dc-history-content').html(html);
	}

	render_empty_history() {
		$(this.page.body).find('.dc-history-content').html(`
			<div class="dc-empty-state">
				<div class="dc-empty-state-icon">
					<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<circle cx="12" cy="12" r="10"></circle>
						<polyline points="12 6 12 12 16 14"></polyline>
					</svg>
				</div>
				<div class="dc-empty-state-title">No Reconciliation History</div>
				<div class="dc-empty-state-desc">No multi-company reconciliation runs have been performed yet. Select a company group and click "Run Reconciliation" to get started.</div>
			</div>
		`);
	}

	run_reconciliation() {
		const me = this;

		if (!this.company_group) {
			frappe.msgprint({
				title: __('Company Group Required'),
				message: __('Please select a Company Group before running reconciliation.'),
				indicator: 'orange'
			});
			return;
		}

		if (!this.from_date || !this.to_date) {
			frappe.msgprint({
				title: __('Date Range Required'),
				message: __('Please select both From Date and To Date.'),
				indicator: 'orange'
			});
			return;
		}

		if (this.companies_data.length === 0) {
			frappe.msgprint({
				title: __('No Companies'),
				message: __('The selected company group has no member companies.'),
				indicator: 'orange'
			});
			return;
		}

		frappe.confirm(
			__('This will create reconciliation runs for all {0} companies in the group. Continue?', [this.companies_data.length]),
			function() {
				me.create_reconciliation_runs();
			}
		);
	}

	create_reconciliation_runs() {
		const me = this;
		const companies = this.companies_data.map(c => c.company);

		frappe.show_progress(__('Creating Reconciliation Runs'), 0, companies.length);

		let completed = 0;
		let created_runs = [];

		const create_next = function(index) {
			if (index >= companies.length) {
				frappe.hide_progress();
				frappe.msgprint({
					title: __('Reconciliation Runs Created'),
					message: __('Successfully created {0} reconciliation runs. You can view them in the history below.', [created_runs.length]),
					indicator: 'green'
				});
				me.refresh_data();
				return;
			}

			const company = companies[index];

			frappe.call({
				method: 'frappe.client.insert',
				args: {
					doc: {
						doctype: 'Reconciliation Run',
						company: company,
						company_group: me.company_group,
						from_date: me.from_date,
						to_date: me.to_date,
						posting_date: frappe.datetime.get_today(),
						asp_provider: 'ClearTax'
					}
				},
				async: false,
				callback: function(r) {
					if (r.message) {
						created_runs.push(r.message.name);
					}
					completed++;
					frappe.show_progress(__('Creating Reconciliation Runs'), completed, companies.length);
					create_next(index + 1);
				},
				error: function() {
					completed++;
					frappe.show_progress(__('Creating Reconciliation Runs'), completed, companies.length);
					create_next(index + 1);
				}
			});
		};

		create_next(0);
	}

	refresh_data() {
		this.load_company_cards();
		this.load_recent_runs();
	}
}
