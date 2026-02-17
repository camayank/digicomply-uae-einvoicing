# Copyright (c) 2026, DigiComply and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
import json
import re


class TransformRule(Document):
    def validate(self):
        self.validate_transform_type()
        if self.custom_code:
            self.validate_custom_code()

    def validate_transform_type(self):
        """Validate required fields based on transform type"""
        if self.transform_type == "Field Mapping":
            if not self.source_field or not self.target_field:
                frappe.throw("Source and Target fields are required for Field Mapping")
        elif self.transform_type == "Custom Code":
            if not self.custom_code:
                frappe.throw("Custom code is required for Custom Code transform type")

    def validate_custom_code(self):
        """Validate custom code syntax"""
        # Basic validation - check for dangerous operations
        dangerous_patterns = [
            r'\bimport\s+os\b',
            r'\bimport\s+subprocess\b',
            r'\beval\s*\(',
            r'\bexec\s*\(',
            r'\b__import__\s*\(',
            r'\bopen\s*\(',
            r'\bfile\s*\('
        ]

        for pattern in dangerous_patterns:
            if re.search(pattern, self.custom_code):
                frappe.throw(f"Custom code contains potentially dangerous operations")

    @frappe.whitelist()
    def test_transform(self):
        """Test the transformation with test input"""
        if not self.test_input:
            return {"success": False, "message": "No test input provided"}

        try:
            test_data = json.loads(self.test_input)
            result = self.apply_transform(test_data.get("value"), test_data, {})

            self.test_output = json.dumps({"result": result}, indent=2)
            self.save()

            return {"success": True, "result": result}
        except Exception as e:
            return {"success": False, "message": str(e)}

    def apply_transform(self, value, record, context):
        """Apply the transformation to a value"""
        # Check condition first
        if not self._check_condition(record):
            return value

        if self.transform_type == "Field Mapping":
            return record.get(self.source_field, self.default_value)

        elif self.transform_type == "Value Mapping":
            params = json.loads(self.transform_params) if self.transform_params else {}
            mapping = params.get("mapping", {})
            return mapping.get(str(value), self.default_value or value)

        elif self.transform_type == "Format":
            return self._apply_format(value)

        elif self.transform_type == "Calculation":
            return self._apply_calculation(value, record)

        elif self.transform_type == "Concatenate":
            return self._apply_concatenate(record)

        elif self.transform_type == "Split":
            return self._apply_split(value)

        elif self.transform_type == "Lookup":
            return self._apply_lookup(value)

        elif self.transform_type == "Custom Code":
            return self._apply_custom_code(value, record, context)

        return value

    def _check_condition(self, record):
        """Check if the condition is met"""
        if not self.condition_type:
            return True

        if self.condition_type == "Field Value":
            field_value = record.get(self.condition_field)

            if self.condition_operator == "equals":
                return str(field_value) == self.condition_value
            elif self.condition_operator == "not equals":
                return str(field_value) != self.condition_value
            elif self.condition_operator == "contains":
                return self.condition_value in str(field_value or "")
            elif self.condition_operator == "starts with":
                return str(field_value or "").startswith(self.condition_value)
            elif self.condition_operator == "ends with":
                return str(field_value or "").endswith(self.condition_value)
            elif self.condition_operator == "is empty":
                return not field_value
            elif self.condition_operator == "is not empty":
                return bool(field_value)

        return True

    def _apply_format(self, value):
        """Apply formatting function"""
        if not value:
            return self.default_value

        if self.transform_function == "Uppercase":
            return str(value).upper()
        elif self.transform_function == "Lowercase":
            return str(value).lower()
        elif self.transform_function == "Trim":
            return str(value).strip()
        elif self.transform_function == "GSTIN Format":
            # Format GSTIN as XX XXXXX XXXXX X X X
            gstin = str(value).replace(" ", "").upper()
            if len(gstin) == 15:
                return f"{gstin[:2]} {gstin[2:7]} {gstin[7:12]} {gstin[12]} {gstin[13]} {gstin[14]}"
            return value
        elif self.transform_function == "Date Format":
            params = json.loads(self.transform_params) if self.transform_params else {}
            from frappe.utils import getdate, formatdate
            date_val = getdate(value)
            return formatdate(date_val, params.get("format", "yyyy-mm-dd"))

        return value

    def _apply_calculation(self, value, record):
        """Apply calculation"""
        params = json.loads(self.transform_params) if self.transform_params else {}
        formula = params.get("formula", "")

        # Simple arithmetic - replace field references with values
        result = formula
        for field, val in record.items():
            if isinstance(val, (int, float)):
                result = result.replace(f"{{{field}}}", str(val))

        try:
            # Only allow safe arithmetic
            allowed_chars = set("0123456789+-*/.() ")
            if all(c in allowed_chars for c in result):
                return eval(result)
        except Exception:
            pass

        return value

    def _apply_concatenate(self, record):
        """Concatenate multiple fields"""
        params = json.loads(self.transform_params) if self.transform_params else {}
        fields = params.get("fields", [])
        separator = params.get("separator", " ")

        values = [str(record.get(f, "")) for f in fields if record.get(f)]
        return separator.join(values) or self.default_value

    def _apply_split(self, value):
        """Split a value"""
        params = json.loads(self.transform_params) if self.transform_params else {}
        separator = params.get("separator", ",")
        index = params.get("index", 0)

        parts = str(value or "").split(separator)
        if 0 <= index < len(parts):
            return parts[index].strip()

        return self.default_value

    def _apply_lookup(self, value):
        """Lookup value from another doctype"""
        params = json.loads(self.transform_params) if self.transform_params else {}
        doctype = params.get("doctype")
        lookup_field = params.get("lookup_field")
        return_field = params.get("return_field")

        if doctype and lookup_field and return_field and value:
            result = frappe.db.get_value(
                doctype,
                {lookup_field: value},
                return_field
            )
            return result or self.default_value

        return self.default_value

    def _apply_custom_code(self, value, record, context):
        """Apply custom code transformation"""
        # Create a safe execution environment
        safe_globals = {
            "frappe": frappe,
            "json": json,
            "re": re
        }

        local_vars = {}
        exec(self.custom_code, safe_globals, local_vars)

        if "transform" in local_vars:
            return local_vars["transform"](value, record, context)

        return value


@frappe.whitelist()
def get_rules_for_connector(connector, entity_type=None, direction=None):
    """Get transform rules for a connector"""
    filters = {
        "enabled": 1,
        "asp_connector": ["in", [connector, None]]
    }

    if entity_type:
        filters["entity_type"] = ["in", [entity_type, "All"]]

    if direction:
        filters["direction"] = ["in", [direction, "Both"]]

    rules = frappe.get_all(
        "Transform Rule",
        filters=filters,
        fields=["name"],
        order_by="priority asc"
    )

    return [frappe.get_doc("Transform Rule", r.name) for r in rules]


def apply_transforms(data, connector, entity_type, direction, context=None):
    """Apply all applicable transform rules to data"""
    rules = get_rules_for_connector(connector, entity_type, direction)
    result = data.copy() if isinstance(data, dict) else data

    for rule in rules:
        if rule.source_field and rule.target_field:
            value = result.get(rule.source_field)
            transformed = rule.apply_transform(value, result, context or {})
            result[rule.target_field] = transformed

    return result
