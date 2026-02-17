frappe.pages['auditor_portal'].on_page_load = function(wrapper) {
    const page = frappe.ui.make_app_page({
        parent: wrapper,
        title: 'Auditor Portal',
        single_column: true
    });

    new AuditorPortal(page);
};

class AuditorPortal {
    constructor(page) {
        this.page = page;
        this.make();
    }

    make() {
        this.$container = $('<div class="dc-auditor-portal"></div>').appendTo(this.page.body);
        this.render_portal();
        this.load_data();
    }

    render_portal() {
        this.$container.html(`
            <style>
                .dc-auditor-portal {
                    padding: 20px;
                    font-family: 'Poppins', sans-serif;
                }
                .dc-portal-header {
                    background: linear-gradient(135deg, #a404e4, #8501b9);
                    color: white;
                    padding: 30px;
                    border-radius: 12px;
                    margin-bottom: 24px;
                }
                .dc-portal-header h1 {
                    margin: 0 0 8px 0;
                    font-size: 28px;
                    font-weight: 600;
                }
                .dc-portal-header p {
                    margin: 0;
                    opacity: 0.9;
                }
                .dc-access-info {
                    background: white;
                    border-radius: 12px;
                    padding: 24px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                    margin-bottom: 24px;
                }
                .dc-access-info h3 {
                    margin: 0 0 16px 0;
                    color: #1e293b;
                    font-size: 18px;
                }
                .dc-access-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 16px;
                }
                .dc-access-item {
                    padding: 12px;
                    background: #f8fafc;
                    border-radius: 8px;
                }
                .dc-access-item label {
                    display: block;
                    color: #64748b;
                    font-size: 12px;
                    margin-bottom: 4px;
                }
                .dc-access-item span {
                    font-weight: 500;
                    color: #1e293b;
                }
                .dc-status-badge {
                    display: inline-block;
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 500;
                }
                .dc-status-active { background: #dcfce7; color: #166534; }
                .dc-status-pending { background: #fef3c7; color: #92400e; }
                .dc-status-expired { background: #fee2e2; color: #991b1b; }
                .dc-portal-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 24px;
                    margin-bottom: 24px;
                }
                .dc-portal-card {
                    background: white;
                    border-radius: 12px;
                    padding: 24px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                }
                .dc-portal-card h3 {
                    margin: 0 0 16px 0;
                    color: #1e293b;
                    font-size: 16px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .dc-portal-card h3 i {
                    color: #a404e4;
                }
                .dc-stat-number {
                    font-size: 32px;
                    font-weight: 600;
                    color: #a404e4;
                }
                .dc-request-list {
                    max-height: 300px;
                    overflow-y: auto;
                }
                .dc-request-item {
                    padding: 12px;
                    border-bottom: 1px solid #e2e8f0;
                    cursor: pointer;
                }
                .dc-request-item:hover {
                    background: #f8fafc;
                }
                .dc-request-item:last-child {
                    border-bottom: none;
                }
                .dc-request-title {
                    font-weight: 500;
                    color: #1e293b;
                    margin-bottom: 4px;
                }
                .dc-request-meta {
                    font-size: 12px;
                    color: #64748b;
                }
                .dc-btn-primary {
                    background: linear-gradient(135deg, #a404e4, #8501b9);
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 500;
                    transition: all 0.2s;
                }
                .dc-btn-primary:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(164, 4, 228, 0.3);
                }
                .dc-empty-state {
                    text-align: center;
                    padding: 40px;
                    color: #64748b;
                }
                .dc-empty-state i {
                    font-size: 48px;
                    margin-bottom: 16px;
                    opacity: 0.5;
                }
            </style>

            <div class="dc-portal-header">
                <h1>Welcome to DigiComply Auditor Portal</h1>
                <p>Access documents, submit requests, and review compliance data</p>
            </div>

            <div class="dc-access-info" id="access-info">
                <h3>Your Access Information</h3>
                <div class="dc-access-grid" id="access-details">
                    <div class="text-muted">Loading access information...</div>
                </div>
            </div>

            <div class="dc-portal-grid">
                <div class="dc-portal-card">
                    <h3><i class="fa fa-folder-open"></i> Document Access</h3>
                    <div id="document-stats">
                        <div class="dc-stat-number">--</div>
                        <div class="text-muted">Documents Available</div>
                    </div>
                    <br>
                    <button class="dc-btn-primary" onclick="auditor_portal.browse_documents()">
                        Browse Documents
                    </button>
                </div>

                <div class="dc-portal-card">
                    <h3><i class="fa fa-file-text"></i> My Requests</h3>
                    <div class="dc-request-list" id="request-list">
                        <div class="text-muted">Loading requests...</div>
                    </div>
                    <br>
                    <button class="dc-btn-primary" onclick="auditor_portal.new_request()">
                        New Request
                    </button>
                </div>

                <div class="dc-portal-card">
                    <h3><i class="fa fa-download"></i> Available Reports</h3>
                    <div id="report-list">
                        <div class="text-muted">Loading reports...</div>
                    </div>
                </div>
            </div>
        `);
    }

    load_data() {
        window.auditor_portal = this;
        this.load_access_info();
        this.load_requests();
        this.load_reports();
    }

    load_access_info() {
        frappe.call({
            method: 'digicomply.digicomply.page.auditor_portal.auditor_portal.get_auditor_info',
            callback: (r) => {
                if (r.message) {
                    this.render_access_info(r.message);
                }
            }
        });
    }

    render_access_info(info) {
        const statusClass = {
            'Active': 'dc-status-active',
            'Pending Approval': 'dc-status-pending',
            'Expired': 'dc-status-expired'
        }[info.access_status] || 'dc-status-pending';

        $('#access-details').html(`
            <div class="dc-access-item">
                <label>Company</label>
                <span>${info.company || 'N/A'}</span>
            </div>
            <div class="dc-access-item">
                <label>Access Status</label>
                <span class="dc-status-badge ${statusClass}">${info.access_status || 'Unknown'}</span>
            </div>
            <div class="dc-access-item">
                <label>Valid Until</label>
                <span>${info.valid_until ? frappe.datetime.str_to_user(info.valid_until) : 'N/A'}</span>
            </div>
            <div class="dc-access-item">
                <label>Access Level</label>
                <span>${info.access_level || 'Read Only'}</span>
            </div>
            <div class="dc-access-item">
                <label>Audit Type</label>
                <span>${info.audit_type || 'N/A'}</span>
            </div>
            <div class="dc-access-item">
                <label>Documents Accessed</label>
                <span>${info.documents_accessed || 0}</span>
            </div>
        `);

        $('#document-stats').html(`
            <div class="dc-stat-number">${info.available_documents || 0}</div>
            <div class="text-muted">Documents Available</div>
        `);
    }

    load_requests() {
        frappe.call({
            method: 'digicomply.digicomply.page.auditor_portal.auditor_portal.get_my_requests',
            callback: (r) => {
                if (r.message && r.message.length) {
                    this.render_requests(r.message);
                } else {
                    $('#request-list').html(`
                        <div class="dc-empty-state">
                            <i class="fa fa-inbox"></i>
                            <p>No requests yet</p>
                        </div>
                    `);
                }
            }
        });
    }

    render_requests(requests) {
        const html = requests.map(req => `
            <div class="dc-request-item" onclick="auditor_portal.view_request('${req.name}')">
                <div class="dc-request-title">${req.request_subject}</div>
                <div class="dc-request-meta">
                    <span class="dc-status-badge ${req.status === 'Completed' ? 'dc-status-active' : 'dc-status-pending'}">
                        ${req.status}
                    </span>
                    &middot; ${frappe.datetime.prettyDate(req.request_date)}
                </div>
            </div>
        `).join('');

        $('#request-list').html(html);
    }

    load_reports() {
        frappe.call({
            method: 'digicomply.digicomply.page.auditor_portal.auditor_portal.get_available_reports',
            callback: (r) => {
                if (r.message && r.message.length) {
                    const html = r.message.map(rep => `
                        <div class="dc-request-item" onclick="auditor_portal.view_report('${rep.name}')">
                            <div class="dc-request-title">${rep.report_title}</div>
                            <div class="dc-request-meta">${rep.report_type} &middot; ${rep.from_date} to ${rep.to_date}</div>
                        </div>
                    `).join('');
                    $('#report-list').html(html);
                } else {
                    $('#report-list').html('<div class="text-muted">No reports available</div>');
                }
            }
        });
    }

    browse_documents() {
        frappe.set_route('List', 'Document Archive');
    }

    new_request() {
        frappe.new_doc('Audit Request');
    }

    view_request(name) {
        frappe.set_route('Form', 'Audit Request', name);
    }

    view_report(name) {
        frappe.set_route('Form', 'FTA Report', name);
    }
}
