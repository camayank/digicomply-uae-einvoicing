# Copyright (c) 2024, DigiComply and contributors
# License: MIT

import frappe
from frappe.model.document import Document


class ScoreHistory(Document):
    """
    Score History - Tracks compliance score changes over time.
    Immutable record for audit and trending purposes.
    """

    def validate(self):
        """Calculate change if not set"""
        if self.previous_score and not self.change:
            self.change = self.score - self.previous_score


def record_score_change(company, new_score, trigger_event="Manual calculation"):
    """
    Record a score change in history.

    Args:
        company: Company name
        new_score: The new compliance score
        trigger_event: What caused the recalculation
    """
    from frappe.utils import now_datetime

    # Get previous score
    previous = frappe.db.get_value(
        "Score History",
        {"company": company},
        "score",
        order_by="recorded_at desc"
    )

    doc = frappe.get_doc({
        "doctype": "Score History",
        "company": company,
        "recorded_at": now_datetime(),
        "score": new_score,
        "previous_score": previous or 0,
        "change": new_score - (previous or 0),
        "trigger_event": trigger_event
    })
    doc.insert(ignore_permissions=True)

    return doc


def get_score_history(company, limit=30):
    """Get score history for charting"""
    return frappe.get_all(
        "Score History",
        filters={"company": company},
        fields=["recorded_at", "score", "change", "trigger_event"],
        order_by="recorded_at desc",
        limit=limit
    )
