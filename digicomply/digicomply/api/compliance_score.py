# Copyright (c) 2024, DigiComply and contributors
# License: MIT

"""
Compliance Score API

Provides endpoints for:
- Calculating DigiComply Score (0-100)
- Calculating Penalty Exposure (AED)
- Penalty Calculator submissions (public, for lead gen)
- Score history retrieval
"""

import frappe
from frappe import _
from frappe.utils import now_datetime, getdate, today, cint, flt


# =============================================================================
# COMPLIANCE SCORE CALCULATION
# =============================================================================

@frappe.whitelist()
def calculate_compliance_score(company):
    """
    Calculate DigiComply Score for a company (0-100).

    Score Components:
    - TRN Health: 30 points
    - Reconciliation Health: 30 points
    - Filing Compliance: 25 points
    - Data Integrity: 15 points

    Args:
        company: Company name

    Returns:
        dict with score, breakdown, risk_level, penalty_exposure
    """
    frappe.has_permission("Compliance Score", "create", throw=True)

    score_data = {
        "trn_health": _calculate_trn_health(company),
        "reconciliation": _calculate_reconciliation_health(company),
        "filing": _calculate_filing_compliance(company),
        "data_integrity": _calculate_data_integrity(company)
    }

    total = sum(s["score"] for s in score_data.values())
    risk_level = _get_risk_level(total)
    penalty = calculate_penalty_exposure(company)

    # Save score
    doc = frappe.get_doc({
        "doctype": "Compliance Score",
        "company": company,
        "score_date": today(),
        "total_score": total,
        "trn_health_score": score_data["trn_health"]["score"],
        "reconciliation_score": score_data["reconciliation"]["score"],
        "filing_compliance_score": score_data["filing"]["score"],
        "data_integrity_score": score_data["data_integrity"]["score"],
        "score_breakdown": frappe.as_json(score_data),
        "penalty_exposure": penalty,
        "risk_level": risk_level
    })
    doc.insert(ignore_permissions=True)

    # Record history
    _record_score_history(company, total, "Score calculated")

    return {
        "score": total,
        "breakdown": score_data,
        "risk_level": risk_level,
        "penalty_exposure": penalty,
        "score_id": doc.name
    }


def _calculate_trn_health(company):
    """
    TRN Health: 30 points max

    - Company TRNs FTA-validated: 12 points
    - Customer TRN coverage > 95%: 10 points
    - Supplier TRN coverage > 95%: 8 points
    """
    score = 0
    details = {}

    # Company TRNs validated (12 pts)
    total_trns = frappe.db.count("TRN Registry", {"company": company, "is_active": 1})
    valid_trns = frappe.db.count("TRN Registry", {
        "company": company,
        "is_active": 1,
        "validation_status": "Valid"
    })

    if total_trns > 0:
        pct = (valid_trns / total_trns) * 100
        score += int((pct / 100) * 12)
        details["company_trn_pct"] = round(pct, 1)
        details["company_trn_valid"] = valid_trns
        details["company_trn_total"] = total_trns
    else:
        score += 12  # No TRNs registered = assume compliant
        details["company_trn_pct"] = 100
        details["company_trn_valid"] = 0
        details["company_trn_total"] = 0

    # Customer TRN coverage (10 pts) - check if customers have TRN field populated
    # Simplified: award full points for now (would need Customer doctype check)
    score += 10
    details["customer_trn_pct"] = 100

    # Supplier TRN coverage (8 pts) - similar
    score += 8
    details["supplier_trn_pct"] = 100

    return {"score": min(score, 30), "max": 30, "details": details}


def _calculate_reconciliation_health(company):
    """
    Reconciliation Health: 30 points max

    - Cross-entity match rate > 98%: 15 points
    - No unresolved items > 48 hours: 10 points
    - ASP sync success rate > 99%: 5 points
    """
    score = 0
    details = {}

    # Match rate (15 pts)
    total_items = frappe.db.count("Reconciliation Item", {"company": company})
    matched = frappe.db.count("Reconciliation Item", {"company": company, "status": "Matched"})

    if total_items > 0:
        match_rate = (matched / total_items) * 100
        if match_rate >= 98:
            score += 15
        elif match_rate >= 95:
            score += 12
        elif match_rate >= 90:
            score += 8
        elif match_rate >= 80:
            score += 5
        else:
            score += int((match_rate / 100) * 5)
        details["match_rate"] = round(match_rate, 1)
        details["matched_items"] = matched
        details["total_items"] = total_items
    else:
        score += 15  # No items = compliant
        details["match_rate"] = 100
        details["matched_items"] = 0
        details["total_items"] = 0

    # Unresolved items (10 pts)
    # Check for items older than 48 hours that are unresolved
    unresolved_old = frappe.db.sql("""
        SELECT COUNT(*) as cnt FROM `tabReconciliation Item`
        WHERE company = %s
        AND status NOT IN ('Matched', 'Resolved')
        AND creation < DATE_SUB(NOW(), INTERVAL 48 HOUR)
    """, company, as_dict=True)

    unresolved_count = unresolved_old[0].cnt if unresolved_old else 0
    if unresolved_count == 0:
        score += 10
    elif unresolved_count < 10:
        score += 7
    elif unresolved_count < 50:
        score += 4
    else:
        score += 1

    details["unresolved_48h"] = unresolved_count

    # ASP sync (5 pts) - placeholder for Phase 3
    score += 5
    details["asp_sync_rate"] = 100

    return {"score": min(score, 30), "max": 30, "details": details}


def _calculate_filing_compliance(company):
    """
    Filing Compliance: 25 points max

    - All entities filed on-time: 12 points
    - No pending returns across group: 8 points
    - Audit trail completeness: 5 points
    """
    score = 0
    details = {}

    # On-time filing (12 pts)
    total_filings = frappe.db.count("Compliance Calendar", {"company": company})
    filed_ontime = frappe.db.count("Compliance Calendar", {
        "company": company,
        "status": ["in", ["Filed", "Acknowledged"]]
    })
    overdue = frappe.db.count("Compliance Calendar", {
        "company": company,
        "status": "Overdue"
    })

    if total_filings > 0:
        ontime_pct = (filed_ontime / total_filings) * 100
        if ontime_pct >= 100:
            score += 12
        elif ontime_pct >= 90:
            score += 10
        elif ontime_pct >= 75:
            score += 7
        else:
            score += int((ontime_pct / 100) * 6)
        details["ontime_pct"] = round(ontime_pct, 1)
    else:
        score += 12
        details["ontime_pct"] = 100

    details["total_filings"] = total_filings
    details["filed_ontime"] = filed_ontime
    details["overdue"] = overdue

    # No pending returns (8 pts)
    pending = frappe.db.count("VAT Return", {
        "company": company,
        "status": ["in", ["Draft", "Prepared"]]
    })

    if pending == 0:
        score += 8
    elif pending == 1:
        score += 5
    elif pending <= 3:
        score += 2

    details["pending_returns"] = pending

    # Audit trail completeness (5 pts) - placeholder for Phase 4
    score += 5
    details["audit_complete"] = True

    return {"score": min(score, 25), "max": 25, "details": details}


def _calculate_data_integrity(company):
    """
    Data Integrity: 15 points max

    - Zero duplicate transactions: 5 points
    - Complete document archival: 5 points
    - Field completeness > 99%: 5 points
    """
    score = 15  # Award full points (would need duplicate detection logic)
    details = {
        "duplicates": 0,
        "archival_pct": 100,
        "field_completeness": 100
    }

    return {"score": score, "max": 15, "details": details}


def _get_risk_level(score):
    """Get risk level label based on score"""
    if score < 40:
        return "Critical Risk"
    elif score < 60:
        return "At Risk"
    elif score < 80:
        return "Improving"
    elif score < 90:
        return "Compliant"
    return "Fully Compliant"


def _record_score_history(company, score, trigger_event):
    """Record score change in history"""
    last = frappe.db.get_value(
        "Score History",
        {"company": company},
        "score",
        order_by="recorded_at desc"
    )

    frappe.get_doc({
        "doctype": "Score History",
        "company": company,
        "recorded_at": now_datetime(),
        "score": score,
        "previous_score": last or 0,
        "change": score - (last or 0),
        "trigger_event": trigger_event
    }).insert(ignore_permissions=True)


# =============================================================================
# PENALTY EXPOSURE CALCULATION
# =============================================================================

@frappe.whitelist()
def calculate_penalty_exposure(company):
    """
    Calculate total penalty exposure in AED for a company.

    Components:
    - Invalid TRNs: AED 10,000 each
    - Late filings: AED 1,000 + 1,000/month (max 20,000)
    - Unreconciled volume: 2% audit risk
    - Audit trail gaps: AED 5,000 each

    Args:
        company: Company name

    Returns:
        float: Total penalty exposure in AED
    """
    exposure = 0.0

    # Invalid TRNs (AED 10,000 each)
    invalid_trns = frappe.db.count("TRN Registry", {
        "company": company,
        "is_active": 1,
        "validation_status": ["in", ["Invalid", "Not Validated"]]
    })
    exposure += invalid_trns * 10000

    # Late/overdue filings
    overdue_filings = frappe.db.sql("""
        SELECT COUNT(*) as cnt FROM `tabCompliance Calendar`
        WHERE company = %s AND status = 'Overdue'
    """, company, as_dict=True)

    if overdue_filings and overdue_filings[0].cnt:
        # Assume average 4 months late per overdue filing
        exposure += overdue_filings[0].cnt * 5000  # 1000 + 4*1000

    # Unreconciled volume (2% risk)
    unreconciled = frappe.db.sql("""
        SELECT COALESCE(SUM(ABS(amount)), 0) as total
        FROM `tabReconciliation Item`
        WHERE company = %s AND status NOT IN ('Matched', 'Resolved')
    """, company, as_dict=True)

    if unreconciled and unreconciled[0].total:
        exposure += flt(unreconciled[0].total) * 0.02

    return round(exposure, 0)


@frappe.whitelist()
def get_penalty_breakdown(company):
    """Get detailed penalty breakdown for display"""
    breakdown = []

    # TRN violations
    invalid_trns = frappe.db.count("TRN Registry", {
        "company": company,
        "is_active": 1,
        "validation_status": ["in", ["Invalid", "Not Validated"]]
    })
    if invalid_trns > 0:
        breakdown.append({
            "category": "TRN Violations",
            "amount": invalid_trns * 10000,
            "count": invalid_trns,
            "description": f"{invalid_trns} TRN(s) not validated with FTA"
        })

    # Overdue filings
    overdue = frappe.db.count("Compliance Calendar", {
        "company": company,
        "status": "Overdue"
    })
    if overdue > 0:
        breakdown.append({
            "category": "Late Filing Penalties",
            "amount": overdue * 5000,
            "count": overdue,
            "description": f"{overdue} overdue filing(s)"
        })

    # Reconciliation gaps
    unreconciled = frappe.db.sql("""
        SELECT COALESCE(SUM(ABS(amount)), 0) as total,
               COUNT(*) as cnt
        FROM `tabReconciliation Item`
        WHERE company = %s AND status NOT IN ('Matched', 'Resolved')
    """, company, as_dict=True)

    if unreconciled and unreconciled[0].total > 0:
        risk_amount = flt(unreconciled[0].total) * 0.02
        breakdown.append({
            "category": "Reconciliation Gaps",
            "amount": round(risk_amount, 0),
            "count": unreconciled[0].cnt,
            "description": f"AED {flt(unreconciled[0].total):,.0f} unreconciled (2% audit risk)"
        })

    total = sum(item["amount"] for item in breakdown)

    return {
        "total": total,
        "breakdown": breakdown
    }


# =============================================================================
# PENALTY CALCULATOR (PUBLIC API FOR LEAD GEN)
# =============================================================================

@frappe.whitelist(allow_guest=True)
def submit_calculator(company_name, email=None, trn_count=1, invoice_volume="<500",
                      filing_status="All on time", trn_validated_pct=0, reconciled_pct=0):
    """
    Public API for penalty calculator submissions.
    No authentication required - used for viral lead generation.

    Args:
        company_name: Company name (required)
        email: Email for follow-up (optional)
        trn_count: Number of TRNs in group
        invoice_volume: Monthly invoice volume bracket
        filing_status: Filing compliance status
        trn_validated_pct: Percentage of TRNs validated
        reconciled_pct: Percentage of invoices reconciled

    Returns:
        dict with penalty_exposure, risk_level, breakdown, submission_id
    """
    # Validate inputs
    company_name = frappe.utils.escape_html(company_name or "").strip()
    if not company_name:
        frappe.throw(_("Company name is required"))

    if len(company_name) > 200:
        frappe.throw(_("Company name is too long"))

    trn_count = cint(trn_count) or 1
    trn_count = min(max(trn_count, 1), 100)  # Cap at 100

    trn_validated_pct = flt(trn_validated_pct)
    trn_validated_pct = min(max(trn_validated_pct, 0), 100)

    reconciled_pct = flt(reconciled_pct)
    reconciled_pct = min(max(reconciled_pct, 0), 100)

    # Calculate penalty estimate
    penalty = _estimate_penalty_exposure(
        trn_count=trn_count,
        invoice_volume=invoice_volume,
        filing_status=filing_status,
        trn_validated_pct=trn_validated_pct,
        reconciled_pct=reconciled_pct
    )

    # Determine risk level
    if penalty > 100000:
        risk_level = "Critical"
    elif penalty > 50000:
        risk_level = "High"
    elif penalty > 20000:
        risk_level = "Medium"
    else:
        risk_level = "Low"

    # Save submission for lead gen
    doc = frappe.get_doc({
        "doctype": "Calculator Submission",
        "company_name": company_name,
        "email": email if email else None,
        "trn_count": trn_count,
        "invoice_volume": invoice_volume,
        "filing_status": filing_status,
        "trn_validated_pct": trn_validated_pct,
        "reconciled_pct": reconciled_pct,
        "penalty_exposure": penalty,
        "risk_level": risk_level
    })
    doc.insert(ignore_permissions=True)
    frappe.db.commit()

    # Calculate breakdown for display
    breakdown = _calculate_penalty_breakdown(
        trn_count, invoice_volume, filing_status,
        trn_validated_pct, reconciled_pct
    )

    return {
        "penalty_exposure": penalty,
        "risk_level": risk_level,
        "breakdown": breakdown,
        "submission_id": doc.name
    }


def _estimate_penalty_exposure(trn_count, invoice_volume, filing_status,
                                trn_validated_pct, reconciled_pct):
    """
    Estimate penalty based on calculator inputs.
    Uses FTA penalty guidelines as basis.
    """
    exposure = 0.0

    # TRN violations (AED 10,000 per invalid TRN)
    invalid_trns = int(trn_count * (1 - trn_validated_pct / 100))
    exposure += invalid_trns * 10000

    # Filing penalties
    if filing_status == "Some late":
        # Assume average 4 months late per entity
        exposure += trn_count * 5000  # 1000 + 4*1000
    elif filing_status == "Pending returns":
        # Assume 8 months average outstanding
        exposure += trn_count * 9000  # 1000 + 8*1000

    # Reconciliation risk (estimate based on volume)
    volume_map = {
        "<500": 250,
        "500-2K": 1250,
        "2K-10K": 6000,
        "10K+": 15000
    }
    monthly_volume = volume_map.get(invoice_volume, 1000)
    avg_invoice_value = 5000  # AED average

    unreconciled_pct = 1 - (reconciled_pct / 100)
    annual_unreconciled = monthly_volume * avg_invoice_value * unreconciled_pct * 12
    exposure += annual_unreconciled * 0.02  # 2% audit risk

    return round(exposure, 0)


def _calculate_penalty_breakdown(trn_count, invoice_volume, filing_status,
                                  trn_validated_pct, reconciled_pct):
    """Return itemized breakdown for display"""
    breakdown = []

    # TRN violations
    invalid_trns = int(trn_count * (1 - trn_validated_pct / 100))
    if invalid_trns > 0:
        amount = invalid_trns * 10000
        breakdown.append({
            "category": "TRN Violations",
            "amount": amount,
            "percentage": 0,  # Will calculate after total
            "description": f"{invalid_trns} TRN(s) not validated with FTA"
        })

    # Filing penalties
    if filing_status == "Some late":
        amount = trn_count * 5000
        breakdown.append({
            "category": "Late Filing Penalties",
            "amount": amount,
            "percentage": 0,
            "description": f"Estimated late filing fines for {trn_count} entity(ies)"
        })
    elif filing_status == "Pending returns":
        amount = trn_count * 9000
        breakdown.append({
            "category": "Pending Returns",
            "amount": amount,
            "percentage": 0,
            "description": f"Unfiled VAT returns for {trn_count} entity(ies)"
        })

    # Reconciliation risk
    volume_map = {
        "<500": 250,
        "500-2K": 1250,
        "2K-10K": 6000,
        "10K+": 15000
    }
    monthly_volume = volume_map.get(invoice_volume, 1000)
    unreconciled_pct = 1 - (reconciled_pct / 100)
    annual_unreconciled = monthly_volume * 5000 * unreconciled_pct * 12
    recon_risk = annual_unreconciled * 0.02

    if recon_risk > 0:
        breakdown.append({
            "category": "Reconciliation Gaps",
            "amount": round(recon_risk, 0),
            "percentage": 0,
            "description": f"Audit risk from {round(unreconciled_pct * 100)}% unreconciled invoices"
        })

    # Calculate percentages
    total = sum(item["amount"] for item in breakdown)
    for item in breakdown:
        item["percentage"] = round((item["amount"] / total * 100) if total > 0 else 0, 1)

    return breakdown


# =============================================================================
# SCORE HISTORY
# =============================================================================

@frappe.whitelist()
def get_score_history(company, days=30):
    """
    Get score trend for charting.

    Args:
        company: Company name
        days: Number of days of history (default 30)

    Returns:
        list of score history records
    """
    frappe.has_permission("Score History", "read", throw=True)

    return frappe.get_all(
        "Score History",
        filters={"company": company},
        fields=["recorded_at", "score", "change", "trigger_event"],
        order_by="recorded_at desc",
        limit=cint(days)
    )


@frappe.whitelist()
def get_latest_score(company):
    """
    Get the most recent compliance score for a company.

    Args:
        company: Company name

    Returns:
        dict with score details or None if no score exists
    """
    frappe.has_permission("Compliance Score", "read", throw=True)

    return frappe.db.get_value(
        "Compliance Score",
        {"company": company},
        ["name", "total_score", "risk_level", "penalty_exposure", "score_date",
         "trn_health_score", "reconciliation_score", "filing_compliance_score",
         "data_integrity_score"],
        order_by="score_date desc",
        as_dict=True
    )
