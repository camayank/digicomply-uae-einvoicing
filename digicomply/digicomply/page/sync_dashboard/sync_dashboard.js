frappe.pages["sync-dashboard"].on_page_load = function(wrapper) {
    var page = frappe.ui.make_app_page({
        parent: wrapper,
        title: "Sync Dashboard",
        single_column: true
    });

    // Hide standard page header
    $(wrapper).find(".page-head").hide();

    // Add Google Fonts
    if (!$("#dc-google-fonts").length) {
        $("head").append('<link id="dc-google-fonts" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">');
    }

    // Add styles
    addDashboardStyles();

    // Load the template
    $(frappe.render_template("sync_dashboard")).appendTo(page.body);

    new SyncDashboard(page);
};

function addDashboardStyles() {
    if ($("#dc-sync-dashboard-styles").length) return;

    var styles = `
        <style id="dc-sync-dashboard-styles">
            :root {
                --dc-primary: #a404e4;
                --dc-primary-light: #c44dff;
                --dc-primary-dark: #8003b3;
                --dc-success: #10b981;
                --dc-warning: #f59e0b;
                --dc-error: #ef4444;
                --dc-info: #3b82f6;
                --dc-bg: #f8fafc;
                --dc-card-bg: #ffffff;
                --dc-text: #1e293b;
                --dc-text-muted: #64748b;
                --dc-border: #e2e8f0;
                --dc-shadow: 0 1px 3px rgba(0,0,0,0.1);
                --dc-shadow-lg: 0 10px 40px rgba(0,0,0,0.1);
                --dc-radius: 12px;
                --dc-radius-sm: 8px;
            }

            .dc-sync-dashboard {
                font-family: 'Poppins', sans-serif;
                background: var(--dc-bg);
                min-height: 100vh;
                padding: 0;
            }

            .dc-dashboard-header {
                background: linear-gradient(135deg, var(--dc-primary) 0%, var(--dc-primary-dark) 100%);
                padding: 32px 40px;
                color: white;
            }

            .dc-header-content {
                max-width: 1400px;
                margin: 0 auto;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .dc-dashboard-title {
                font-size: 28px;
                font-weight: 700;
                margin: 0;
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .dc-dashboard-title .dc-icon {
                width: 32px;
                height: 32px;
            }

            .dc-dashboard-subtitle {
                margin: 8px 0 0;
                opacity: 0.9;
                font-size: 14px;
            }

            .dc-header-actions {
                display: flex;
                gap: 12px;
            }

            .dc-btn {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 10px 20px;
                border-radius: var(--dc-radius-sm);
                font-family: 'Poppins', sans-serif;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
                border: none;
            }

            .dc-btn-primary {
                background: white;
                color: var(--dc-primary);
            }

            .dc-btn-primary:hover {
                background: #f1f5f9;
                transform: translateY(-1px);
            }

            .dc-btn-secondary {
                background: rgba(255,255,255,0.2);
                color: white;
                border: 1px solid rgba(255,255,255,0.3);
            }

            .dc-btn-secondary:hover {
                background: rgba(255,255,255,0.3);
            }

            .dc-btn-sm {
                padding: 6px 12px;
                font-size: 13px;
            }

            .dc-btn-text {
                background: none;
                color: var(--dc-primary);
                padding: 6px 12px;
            }

            .dc-btn-text:hover {
                background: rgba(164, 4, 228, 0.1);
            }

            .dc-stats-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 20px;
                max-width: 1400px;
                margin: -40px auto 0;
                padding: 0 40px;
                position: relative;
                z-index: 10;
            }

            @media (max-width: 1200px) {
                .dc-stats-grid {
                    grid-template-columns: repeat(2, 1fr);
                }
            }

            @media (max-width: 600px) {
                .dc-stats-grid {
                    grid-template-columns: 1fr;
                }
            }

            .dc-stat-card {
                background: var(--dc-card-bg);
                border-radius: var(--dc-radius);
                padding: 24px;
                box-shadow: var(--dc-shadow-lg);
                display: flex;
                align-items: center;
                gap: 16px;
            }

            .dc-stat-icon {
                width: 56px;
                height: 56px;
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .dc-stat-icon svg {
                width: 28px;
                height: 28px;
            }

            .dc-stat-icon-primary {
                background: rgba(164, 4, 228, 0.1);
                color: var(--dc-primary);
            }

            .dc-stat-icon-success {
                background: rgba(16, 185, 129, 0.1);
                color: var(--dc-success);
            }

            .dc-stat-icon-warning {
                background: rgba(245, 158, 11, 0.1);
                color: var(--dc-warning);
            }

            .dc-stat-icon-info {
                background: rgba(59, 130, 246, 0.1);
                color: var(--dc-info);
            }

            .dc-stat-value {
                font-size: 32px;
                font-weight: 700;
                color: var(--dc-text);
            }

            .dc-stat-label {
                font-size: 13px;
                color: var(--dc-text-muted);
                margin-top: 4px;
            }

            .dc-dashboard-content {
                max-width: 1400px;
                margin: 0 auto;
                padding: 40px;
            }

            .dc-section {
                background: var(--dc-card-bg);
                border-radius: var(--dc-radius);
                box-shadow: var(--dc-shadow);
                padding: 24px;
                margin-bottom: 24px;
            }

            .dc-section-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
            }

            .dc-section-title {
                font-size: 18px;
                font-weight: 600;
                color: var(--dc-text);
                margin: 0;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .dc-pulse {
                width: 8px;
                height: 8px;
                background: var(--dc-success);
                border-radius: 50%;
                animation: pulse 2s infinite;
            }

            @keyframes pulse {
                0%, 100% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.5; transform: scale(1.2); }
            }

            .dc-select {
                padding: 8px 32px 8px 12px;
                border: 1px solid var(--dc-border);
                border-radius: var(--dc-radius-sm);
                font-family: 'Poppins', sans-serif;
                font-size: 13px;
                background: white url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E") right 8px center/16px no-repeat;
                appearance: none;
                cursor: pointer;
            }

            .dc-select:focus {
                outline: none;
                border-color: var(--dc-primary);
                box-shadow: 0 0 0 3px rgba(164, 4, 228, 0.1);
            }

            .dc-connections-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                gap: 16px;
            }

            .dc-connection-card {
                border: 1px solid var(--dc-border);
                border-radius: var(--dc-radius-sm);
                padding: 20px;
                transition: all 0.2s;
                cursor: pointer;
            }

            .dc-connection-card:hover {
                border-color: var(--dc-primary);
                box-shadow: 0 4px 12px rgba(164, 4, 228, 0.1);
            }

            .dc-connection-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 12px;
            }

            .dc-connection-provider {
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .dc-provider-icon {
                width: 40px;
                height: 40px;
                background: linear-gradient(135deg, var(--dc-primary) 0%, var(--dc-primary-dark) 100%);
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: 700;
                font-size: 14px;
            }

            .dc-provider-name {
                font-weight: 600;
                color: var(--dc-text);
            }

            .dc-provider-company {
                font-size: 12px;
                color: var(--dc-text-muted);
            }

            .dc-status-badge {
                display: inline-flex;
                align-items: center;
                gap: 4px;
                padding: 4px 10px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 500;
            }

            .dc-status-connected {
                background: rgba(16, 185, 129, 0.1);
                color: var(--dc-success);
            }

            .dc-status-error {
                background: rgba(239, 68, 68, 0.1);
                color: var(--dc-error);
            }

            .dc-status-not-connected {
                background: rgba(100, 116, 139, 0.1);
                color: var(--dc-text-muted);
            }

            .dc-connection-stats {
                display: flex;
                gap: 16px;
                margin-top: 12px;
                padding-top: 12px;
                border-top: 1px solid var(--dc-border);
            }

            .dc-conn-stat {
                flex: 1;
            }

            .dc-conn-stat-value {
                font-weight: 600;
                color: var(--dc-text);
            }

            .dc-conn-stat-label {
                font-size: 11px;
                color: var(--dc-text-muted);
            }

            .dc-connection-actions {
                display: flex;
                gap: 8px;
                margin-top: 12px;
            }

            .dc-action-btn {
                flex: 1;
                padding: 8px;
                border: 1px solid var(--dc-border);
                border-radius: 6px;
                background: white;
                color: var(--dc-text);
                font-size: 12px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 4px;
            }

            .dc-action-btn:hover {
                border-color: var(--dc-primary);
                color: var(--dc-primary);
            }

            .dc-action-btn-primary {
                background: var(--dc-primary);
                border-color: var(--dc-primary);
                color: white;
            }

            .dc-action-btn-primary:hover {
                background: var(--dc-primary-dark);
                color: white;
            }

            .dc-running-sync {
                display: flex;
                align-items: center;
                gap: 16px;
                padding: 16px;
                border: 1px solid var(--dc-border);
                border-radius: var(--dc-radius-sm);
                margin-bottom: 12px;
            }

            .dc-progress-ring {
                width: 48px;
                height: 48px;
            }

            .dc-progress-ring circle {
                fill: none;
                stroke-width: 4;
            }

            .dc-progress-ring .bg {
                stroke: var(--dc-border);
            }

            .dc-progress-ring .progress {
                stroke: var(--dc-primary);
                stroke-linecap: round;
                transform: rotate(-90deg);
                transform-origin: center;
                transition: stroke-dashoffset 0.3s;
            }

            .dc-sync-info {
                flex: 1;
            }

            .dc-sync-name {
                font-weight: 600;
                color: var(--dc-text);
            }

            .dc-sync-detail {
                font-size: 13px;
                color: var(--dc-text-muted);
            }

            .dc-activity-item {
                display: flex;
                align-items: flex-start;
                gap: 12px;
                padding: 12px 0;
                border-bottom: 1px solid var(--dc-border);
            }

            .dc-activity-item:last-child {
                border-bottom: none;
            }

            .dc-activity-icon {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
            }

            .dc-activity-icon svg {
                width: 16px;
                height: 16px;
            }

            .dc-activity-icon-success {
                background: rgba(16, 185, 129, 0.1);
                color: var(--dc-success);
            }

            .dc-activity-icon-error {
                background: rgba(239, 68, 68, 0.1);
                color: var(--dc-error);
            }

            .dc-activity-content {
                flex: 1;
            }

            .dc-activity-title {
                font-weight: 500;
                color: var(--dc-text);
            }

            .dc-activity-meta {
                font-size: 12px;
                color: var(--dc-text-muted);
                margin-top: 2px;
            }

            .dc-schedule-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 12px 0;
                border-bottom: 1px solid var(--dc-border);
            }

            .dc-schedule-item:last-child {
                border-bottom: none;
            }

            .dc-schedule-info {
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .dc-schedule-icon {
                width: 36px;
                height: 36px;
                background: rgba(164, 4, 228, 0.1);
                color: var(--dc-primary);
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .dc-schedule-icon svg {
                width: 18px;
                height: 18px;
            }

            .dc-schedule-name {
                font-weight: 500;
                color: var(--dc-text);
            }

            .dc-schedule-next {
                font-size: 12px;
                color: var(--dc-text-muted);
            }

            .dc-schedule-status {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .dc-empty-state {
                text-align: center;
                padding: 40px;
                color: var(--dc-text-muted);
            }

            .dc-empty-state svg {
                width: 48px;
                height: 48px;
                opacity: 0.5;
                margin-bottom: 12px;
            }

            .dc-loading {
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 40px;
            }

            .dc-spinner {
                width: 32px;
                height: 32px;
                border: 3px solid var(--dc-border);
                border-top-color: var(--dc-primary);
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }

            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        </style>
    `;

    $("head").append(styles);
}

class SyncDashboard {
    constructor(page) {
        this.page = page;
        this.refreshInterval = null;

        this.bindEvents();
        this.loadDashboard();
        this.startAutoRefresh();
    }

    bindEvents() {
        var self = this;

        $("#refresh-dashboard").on("click", function() {
            self.loadDashboard();
        });

        $("#new-connection").on("click", function() {
            frappe.new_doc("ASP Connection");
        });

        $("#new-schedule").on("click", function() {
            frappe.new_doc("Sync Schedule");
        });

        $("#view-all-activity").on("click", function() {
            frappe.set_route("List", "Sync Run");
        });

        $("#status-filter").on("change", function() {
            self.loadConnections($(this).val());
        });
    }

    startAutoRefresh() {
        var self = this;
        this.refreshInterval = setInterval(function() {
            self.loadDashboard(true);
        }, 30000); // Refresh every 30 seconds
    }

    loadDashboard(silent) {
        var self = this;

        if (!silent) {
            $("#connections-container").html('<div class="dc-loading"><div class="dc-spinner"></div></div>');
        }

        frappe.call({
            method: "digicomply.digicomply.api.connector_framework.get_dashboard_data",
            callback: function(r) {
                if (r.message) {
                    self.renderDashboard(r.message);
                }
            }
        });
    }

    renderDashboard(data) {
        // Update stats
        $("#total-connections").text(data.connections.length);

        var successCount = 0;
        var failedCount = 0;
        data.connections.forEach(function(conn) {
            successCount += conn.successful_syncs || 0;
            failedCount += conn.failed_syncs || 0;
        });

        $("#successful-syncs").text(successCount);
        $("#failed-syncs").text(failedCount);
        $("#scheduled-syncs").text(data.schedules.length);

        // Render connections
        this.renderConnections(data.connections);

        // Render running syncs
        this.renderRunningSyncs(data.running_syncs);

        // Render recent activity
        this.renderActivity(data.recent_errors);

        // Render schedules
        this.renderSchedules(data.schedules);
    }

    loadConnections(statusFilter) {
        var self = this;

        frappe.call({
            method: "frappe.client.get_list",
            args: {
                doctype: "ASP Connection",
                filters: statusFilter ? { connection_status: statusFilter, enabled: 1 } : { enabled: 1 },
                fields: ["name", "asp_provider", "company", "connection_status", "last_sync_at", "total_syncs", "successful_syncs", "failed_syncs"]
            },
            callback: function(r) {
                if (r.message) {
                    self.renderConnections(r.message);
                }
            }
        });
    }

    renderConnections(connections) {
        var self = this;
        var container = $("#connections-container");

        if (!connections.length) {
            container.html(this.getEmptyState("No connections found", "Create your first ASP connection to get started"));
            return;
        }

        var html = connections.map(function(conn) {
            return self.getConnectionCard(conn);
        }).join("");

        container.html(html);

        // Bind card events
        $(".dc-connection-card").on("click", function(e) {
            if (!$(e.target).closest(".dc-action-btn").length) {
                frappe.set_route("Form", "ASP Connection", $(this).data("name"));
            }
        });

        $(".dc-sync-now-btn").on("click", function(e) {
            e.stopPropagation();
            var connName = $(this).closest(".dc-connection-card").data("name");
            self.triggerSync(connName);
        });

        $(".dc-test-btn").on("click", function(e) {
            e.stopPropagation();
            var connName = $(this).closest(".dc-connection-card").data("name");
            self.testConnection(connName);
        });
    }

    getConnectionCard(conn) {
        var statusClass = "dc-status-not-connected";
        if (conn.connection_status === "Connected") statusClass = "dc-status-connected";
        else if (conn.connection_status === "Error") statusClass = "dc-status-error";

        var providerInitials = (conn.asp_provider || "?").substring(0, 2).toUpperCase();
        var lastSync = conn.last_sync_at ? frappe.datetime.prettyDate(conn.last_sync_at) : "Never";

        return '<div class="dc-connection-card" data-name="' + conn.name + '">' +
            '<div class="dc-connection-header">' +
                '<div class="dc-connection-provider">' +
                    '<div class="dc-provider-icon">' + providerInitials + '</div>' +
                    '<div>' +
                        '<div class="dc-provider-name">' + frappe.utils.escape_html(conn.asp_provider) + '</div>' +
                        '<div class="dc-provider-company">' + frappe.utils.escape_html(conn.company || "") + '</div>' +
                    '</div>' +
                '</div>' +
                '<span class="dc-status-badge ' + statusClass + '">' +
                    '<span class="dc-status-dot"></span>' +
                    frappe.utils.escape_html(conn.connection_status || "Not Connected") +
                '</span>' +
            '</div>' +
            '<div class="dc-connection-stats">' +
                '<div class="dc-conn-stat">' +
                    '<div class="dc-conn-stat-value">' + (conn.total_syncs || 0) + '</div>' +
                    '<div class="dc-conn-stat-label">Total Syncs</div>' +
                '</div>' +
                '<div class="dc-conn-stat">' +
                    '<div class="dc-conn-stat-value">' + (conn.successful_syncs || 0) + '</div>' +
                    '<div class="dc-conn-stat-label">Successful</div>' +
                '</div>' +
                '<div class="dc-conn-stat">' +
                    '<div class="dc-conn-stat-value">' + lastSync + '</div>' +
                    '<div class="dc-conn-stat-label">Last Sync</div>' +
                '</div>' +
            '</div>' +
            '<div class="dc-connection-actions">' +
                '<button class="dc-action-btn dc-test-btn">Test</button>' +
                '<button class="dc-action-btn dc-action-btn-primary dc-sync-now-btn">Sync Now</button>' +
            '</div>' +
        '</div>';
    }

    renderRunningSyncs(syncs) {
        var container = $("#running-syncs-container");
        var section = $("#running-syncs-section");

        if (!syncs || !syncs.length) {
            section.hide();
            return;
        }

        section.show();

        var html = syncs.map(function(sync) {
            var progress = sync.progress_percent || 0;
            var circumference = 2 * Math.PI * 20;
            var offset = circumference - (progress / 100) * circumference;

            return '<div class="dc-running-sync">' +
                '<svg class="dc-progress-ring" viewBox="0 0 48 48">' +
                    '<circle class="bg" cx="24" cy="24" r="20"/>' +
                    '<circle class="progress" cx="24" cy="24" r="20" stroke-dasharray="' + circumference + '" stroke-dashoffset="' + offset + '"/>' +
                '</svg>' +
                '<div class="dc-sync-info">' +
                    '<div class="dc-sync-name">' + frappe.utils.escape_html(sync.asp_connection) + '</div>' +
                    '<div class="dc-sync-detail">Started ' + frappe.datetime.prettyDate(sync.started_at) + ' • ' + Math.round(progress) + '% complete</div>' +
                '</div>' +
            '</div>';
        }).join("");

        container.html(html);
    }

    renderActivity(activity) {
        var container = $("#activity-container");

        if (!activity || !activity.length) {
            container.html(this.getEmptyState("No recent activity", "Sync runs will appear here"));
            return;
        }

        var html = activity.map(function(item) {
            var iconClass = item.run_status === "Completed" ? "dc-activity-icon-success" : "dc-activity-icon-error";
            var icon = item.run_status === "Completed" ?
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 13l4 4L19 7"/></svg>' :
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 18L18 6M6 6l12 12"/></svg>';

            return '<div class="dc-activity-item">' +
                '<div class="dc-activity-icon ' + iconClass + '">' + icon + '</div>' +
                '<div class="dc-activity-content">' +
                    '<div class="dc-activity-title">' + frappe.utils.escape_html(item.asp_connection) + ' - ' + frappe.utils.escape_html(item.run_status) + '</div>' +
                    '<div class="dc-activity-meta">' + frappe.datetime.prettyDate(item.started_at) + '</div>' +
                '</div>' +
            '</div>';
        }).join("");

        container.html(html);
    }

    renderSchedules(schedules) {
        var container = $("#schedules-container");

        if (!schedules || !schedules.length) {
            container.html(this.getEmptyState("No schedules configured", "Create a schedule to automate syncs"));
            return;
        }

        var html = schedules.map(function(schedule) {
            var nextRun = schedule.next_run_at ? frappe.datetime.prettyDate(schedule.next_run_at) : "Not scheduled";

            return '<div class="dc-schedule-item">' +
                '<div class="dc-schedule-info">' +
                    '<div class="dc-schedule-icon">' +
                        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>' +
                    '</div>' +
                    '<div>' +
                        '<div class="dc-schedule-name">' + frappe.utils.escape_html(schedule.schedule_name) + '</div>' +
                        '<div class="dc-schedule-next">Next: ' + nextRun + ' • ' + frappe.utils.escape_html(schedule.frequency) + '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="dc-schedule-status">' +
                    '<span class="dc-status-badge ' + (schedule.schedule_status === "Idle" ? "dc-status-connected" : "dc-status-error") + '">' +
                        frappe.utils.escape_html(schedule.schedule_status) +
                    '</span>' +
                '</div>' +
            '</div>';
        }).join("");

        container.html(html);
    }

    getEmptyState(title, subtitle) {
        return '<div class="dc-empty-state">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
                '<path d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>' +
            '</svg>' +
            '<div>' + title + '</div>' +
            '<div style="font-size: 13px;">' + subtitle + '</div>' +
        '</div>';
    }

    triggerSync(connectionName) {
        var self = this;

        frappe.call({
            method: "digicomply.digicomply.api.connector_framework.run_sync",
            args: {
                connection_name: connectionName,
                direction: "Pull",
                trigger_type: "Manual"
            },
            callback: function(r) {
                if (r.message && r.message.success) {
                    frappe.show_alert({
                        message: "Sync started successfully",
                        indicator: "green"
                    });
                    self.loadDashboard();
                } else {
                    frappe.show_alert({
                        message: "Sync failed: " + (r.message.error || "Unknown error"),
                        indicator: "red"
                    });
                }
            }
        });
    }

    testConnection(connectionName) {
        frappe.call({
            method: "frappe.client.get",
            args: {
                doctype: "ASP Connection",
                name: connectionName
            },
            callback: function(r) {
                if (r.message) {
                    frappe.xcall("digicomply.digicomply.doctype.asp_connection.asp_connection.ASPConnection.test_connection", {
                        doc: r.message
                    }).then(function(result) {
                        if (result.success) {
                            frappe.show_alert({
                                message: "Connection test successful",
                                indicator: "green"
                            });
                        } else {
                            frappe.show_alert({
                                message: "Connection test failed: " + result.message,
                                indicator: "red"
                            });
                        }
                    });
                }
            }
        });
    }
}
