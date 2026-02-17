// Copyright (c) 2024, DigiComply and contributors
// For license information, please see license.txt

frappe.query_reports["TRN Health Report"] = {
    "filters": [
        {
            "fieldname": "company",
            "label": __("Company"),
            "fieldtype": "Link",
            "options": "Company",
            "width": 180
        },
        {
            "fieldname": "validation_status",
            "label": __("Validation Status"),
            "fieldtype": "Select",
            "options": "\nNot Validated\nValid\nInvalid\nExpired\nPending Verification",
            "width": 140
        },
        {
            "fieldname": "show_only_invalid",
            "label": __("Show Only Invalid"),
            "fieldtype": "Check",
            "default": 0
        }
    ],

    "formatter": function(value, row, column, data, default_formatter) {
        value = default_formatter(value, row, column, data);

        if (column.fieldname === "validation_status" && data) {
            const status = data.validation_status;
            let color = "";

            switch (status) {
                case "Valid":
                    color = "#28a745";  // Green
                    break;
                case "Invalid":
                    color = "#dc3545";  // Red
                    break;
                case "Expired":
                    color = "#fd7e14";  // Orange
                    break;
                case "Not Validated":
                    color = "#6c757d";  // Gray
                    break;
                case "Pending Verification":
                    color = "#a404e4";  // Purple (brand color)
                    break;
                default:
                    color = "#6c757d";
            }

            value = `<span style="color: ${color}; font-weight: 600;">${status}</span>`;
        }

        if (column.fieldname === "days_since_validation" && data) {
            const days = data.days_since_validation;
            if (days !== null && days !== undefined) {
                let color = "";
                if (days > 90) {
                    color = "#dc3545";  // Red - overdue
                } else if (days > 60) {
                    color = "#fd7e14";  // Orange - warning
                } else {
                    color = "#28a745";  // Green - recent
                }
                value = `<span style="color: ${color}; font-weight: 500;">${days}</span>`;
            }
        }

        return value;
    }
};
