// Copyright (c) 2024, DigiComply and contributors
// For license information, please see license.txt

frappe.query_reports["VAT Liability Report"] = {
    "filters": [
        {
            "fieldname": "company",
            "label": __("Company"),
            "fieldtype": "Link",
            "options": "Company",
            "width": 180
        },
        {
            "fieldname": "from_date",
            "label": __("From Date"),
            "fieldtype": "Date",
            "width": 120
        },
        {
            "fieldname": "to_date",
            "label": __("To Date"),
            "fieldtype": "Date",
            "width": 120
        },
        {
            "fieldname": "status",
            "label": __("Status"),
            "fieldtype": "Select",
            "options": "\nDraft\nPrepared\nFiled\nAcknowledged",
            "width": 120
        }
    ],

    "formatter": function(value, row, column, data, default_formatter) {
        value = default_formatter(value, row, column, data);

        if (column.fieldname === "status" && data && data.status) {
            const status = data.status;
            let color = "";
            let bgColor = "";

            switch (status) {
                case "Acknowledged":
                    color = "#28a745";
                    bgColor = "#d4edda";
                    break;
                case "Filed":
                    color = "#17a2b8";
                    bgColor = "#d1ecf1";
                    break;
                case "Prepared":
                    color = "#a404e4";  // Purple (brand color)
                    bgColor = "#f3e5f5";
                    break;
                case "Under Review":
                    color = "#fd7e14";
                    bgColor = "#fff3cd";
                    break;
                case "Draft":
                    color = "#6c757d";
                    bgColor = "#e9ecef";
                    break;
                default:
                    color = "#6c757d";
                    bgColor = "#e9ecef";
            }

            value = `<span style="color: ${color}; background-color: ${bgColor}; padding: 2px 8px; border-radius: 4px; font-weight: 500;">${status}</span>`;
        }

        if (column.fieldname === "net_vat_due" && data) {
            const netVat = data.net_vat_due;
            if (netVat !== null && netVat !== undefined && !data.is_total_row) {
                let color = "";
                if (netVat > 0) {
                    color = "#dc3545";  // Red - payable
                } else if (netVat < 0) {
                    color = "#28a745";  // Green - refundable
                } else {
                    color = "#6c757d";  // Gray - neutral
                }
                value = `<span style="color: ${color}; font-weight: 500;">${value}</span>`;
            }
        }

        // Bold the total row
        if (data && data.is_total_row && column.fieldname !== "period") {
            value = `<b>${value}</b>`;
        }

        return value;
    }
};
