# Connor-Style GTM Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build DigiComply Score, Penalty Calculator, and emotion-first onboarding flow

**Architecture:** Score engine calculates compliance metrics, penalty calculator for viral acquisition, 4-screen onboarding converts visitors to trials

**Tech Stack:** Frappe Framework, Python, JavaScript, DigiComply Design System

---

## Task 0: Create Feature Branch

**Files:**
- None (git operation)

**Steps:**
1. Create branch: `git checkout -b feature/connor-gtm-onboarding`
2. Verify: `git branch --show-current`

**Commit:** N/A (branch creation)

---

## Task 1: Create Compliance Score DocType

**Files:**
- Create: `digicomply/digicomply/doctype/compliance_score/__init__.py`
- Create: `digicomply/digicomply/doctype/compliance_score/compliance_score.json`
- Create: `digicomply/digicomply/doctype/compliance_score/compliance_score.py`

**DocType Definition:**
```json
{
    "name": "Compliance Score",
    "module": "DigiComply",
    "autoname": "hash",
    "fields": [
        {"fieldname": "company", "fieldtype": "Link", "options": "Company", "reqd": 1},
        {"fieldname": "score_date", "fieldtype": "Date", "reqd": 1},
        {"fieldname": "total_score", "fieldtype": "Int", "reqd": 1},
        {"fieldname": "section_scores", "fieldtype": "Section Break"},
        {"fieldname": "trn_health_score", "fieldtype": "Int", "default": "0"},
        {"fieldname": "reconciliation_score", "fieldtype": "Int", "default": "0"},
        {"fieldname": "filing_compliance_score", "fieldtype": "Int", "default": "0"},
        {"fieldname": "data_integrity_score", "fieldtype": "Int", "default": "0"},
        {"fieldname": "section_details", "fieldtype": "Section Break"},
        {"fieldname": "score_breakdown", "fieldtype": "JSON"},
        {"fieldname": "penalty_exposure", "fieldtype": "Currency"},
        {"fieldname": "risk_level", "fieldtype": "Select", "options": "Critical Risk\nAt Risk\nImproving\nCompliant\nFully Compliant"}
    ]
}
```

**Commit:** `feat(score): add Compliance Score DocType`

---

## Task 2: Create Score History DocType

**Files:**
- Create: `digicomply/digicomply/doctype/score_history/__init__.py`
- Create: `digicomply/digicomply/doctype/score_history/score_history.json`
- Create: `digicomply/digicomply/doctype/score_history/score_history.py`

**DocType Definition:**
```json
{
    "name": "Score History",
    "module": "DigiComply",
    "autoname": "hash",
    "fields": [
        {"fieldname": "company", "fieldtype": "Link", "options": "Company", "reqd": 1},
        {"fieldname": "recorded_at", "fieldtype": "Datetime", "reqd": 1},
        {"fieldname": "score", "fieldtype": "Int", "reqd": 1},
        {"fieldname": "previous_score", "fieldtype": "Int"},
        {"fieldname": "change", "fieldtype": "Int"},
        {"fieldname": "trigger_event", "fieldtype": "Data"}
    ]
}
```

**Commit:** `feat(score): add Score History DocType for trending`

---

## Task 3: Create Calculator Submission DocType

**Files:**
- Create: `digicomply/digicomply/doctype/calculator_submission/__init__.py`
- Create: `digicomply/digicomply/doctype/calculator_submission/calculator_submission.json`
- Create: `digicomply/digicomply/doctype/calculator_submission/calculator_submission.py`

**DocType Definition:**
```json
{
    "name": "Calculator Submission",
    "module": "DigiComply",
    "autoname": "CALC-.#####",
    "fields": [
        {"fieldname": "company_name", "fieldtype": "Data", "reqd": 1},
        {"fieldname": "email", "fieldtype": "Data", "options": "Email"},
        {"fieldname": "trn_count", "fieldtype": "Int"},
        {"fieldname": "invoice_volume", "fieldtype": "Select", "options": "<500\n500-2K\n2K-10K\n10K+"},
        {"fieldname": "filing_status", "fieldtype": "Select", "options": "All on time\nSome late\nPending returns"},
        {"fieldname": "trn_validated_pct", "fieldtype": "Percent"},
        {"fieldname": "reconciled_pct", "fieldtype": "Percent"},
        {"fieldname": "section_results", "fieldtype": "Section Break"},
        {"fieldname": "penalty_exposure", "fieldtype": "Currency"},
        {"fieldname": "risk_level", "fieldtype": "Data"},
        {"fieldname": "converted_to_trial", "fieldtype": "Check"}
    ]
}
```

**Commit:** `feat(calculator): add Calculator Submission DocType for lead gen`

---

## Task 4: Create Compliance Score API

**Files:**
- Create: `digicomply/digicomply/api/compliance_score.py`

**Implementation:**
```python
import frappe
from frappe import _
from frappe.utils import now_datetime, getdate, today

@frappe.whitelist()
def calculate_compliance_score(company):
    """Calculate DigiComply Score for a company (0-100)"""
    score_data = {
        "trn_health": calculate_trn_health(company),
        "reconciliation": calculate_reconciliation_health(company),
        "filing": calculate_filing_compliance(company),
        "data_integrity": calculate_data_integrity(company)
    }

    total = sum(s["score"] for s in score_data.values())
    risk_level = get_risk_level(total)
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
        "score_breakdown": score_data,
        "penalty_exposure": penalty,
        "risk_level": risk_level
    })
    doc.insert(ignore_permissions=True)

    # Record history
    record_score_history(company, total)

    return {
        "score": total,
        "breakdown": score_data,
        "risk_level": risk_level,
        "penalty_exposure": penalty
    }

def calculate_trn_health(company):
    """TRN Health: 30 points max"""
    score = 0
    details = {}

    # Company TRNs validated (12 pts)
    total_trns = frappe.db.count("TRN Registry", {"company": company, "is_active": 1})
    valid_trns = frappe.db.count("TRN Registry", {"company": company, "is_active": 1, "validation_status": "Valid"})

    if total_trns > 0:
        pct = (valid_trns / total_trns) * 100
        score += int((pct / 100) * 12)
        details["company_trn_pct"] = pct
    else:
        score += 12  # No TRNs = full points (not applicable)

    # Customer TRN coverage (10 pts) - simplified
    score += 10  # Placeholder - would check customer master
    details["customer_trn_pct"] = 100

    # Supplier TRN coverage (8 pts) - simplified
    score += 8  # Placeholder - would check supplier master
    details["supplier_trn_pct"] = 100

    return {"score": min(score, 30), "max": 30, "details": details}

def calculate_reconciliation_health(company):
    """Reconciliation Health: 30 points max"""
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
        else:
            score += int((match_rate / 100) * 8)
        details["match_rate"] = match_rate
    else:
        score += 15
        details["match_rate"] = 100

    # Unresolved items (10 pts)
    score += 10  # Simplified
    details["unresolved_48h"] = 0

    # ASP sync (5 pts)
    score += 5  # Placeholder for Phase 3
    details["asp_sync_rate"] = 100

    return {"score": min(score, 30), "max": 30, "details": details}

def calculate_filing_compliance(company):
    """Filing Compliance: 25 points max"""
    score = 0
    details = {}

    # On-time filing (12 pts)
    total_filings = frappe.db.count("Compliance Calendar", {"company": company})
    ontime = frappe.db.count("Compliance Calendar", {"company": company, "status": ["in", ["Filed", "Acknowledged"]]})

    if total_filings > 0:
        pct = (ontime / total_filings) * 100
        score += int((pct / 100) * 12)
        details["ontime_pct"] = pct
    else:
        score += 12
        details["ontime_pct"] = 100

    # No pending returns (8 pts)
    pending = frappe.db.count("VAT Return", {"company": company, "status": ["in", ["Draft", "Prepared"]]})
    if pending == 0:
        score += 8
    details["pending_returns"] = pending

    # Audit trail (5 pts)
    score += 5  # Placeholder for Phase 4
    details["audit_complete"] = True

    return {"score": min(score, 25), "max": 25, "details": details}

def calculate_data_integrity(company):
    """Data Integrity: 15 points max"""
    score = 15  # Simplified - would check duplicates, completeness
    return {"score": score, "max": 15, "details": {"duplicates": 0, "completeness": 100}}

def get_risk_level(score):
    if score < 40:
        return "Critical Risk"
    elif score < 60:
        return "At Risk"
    elif score < 80:
        return "Improving"
    elif score < 90:
        return "Compliant"
    return "Fully Compliant"

@frappe.whitelist()
def calculate_penalty_exposure(company):
    """Calculate total penalty exposure in AED"""
    exposure = 0

    # Invalid TRNs (AED 10,000 each)
    invalid_trns = frappe.db.count("TRN Registry", {
        "company": company,
        "is_active": 1,
        "validation_status": ["in", ["Invalid", "Not Validated"]]
    })
    exposure += invalid_trns * 10000

    # Late filings
    late_filings = frappe.db.sql("""
        SELECT COUNT(*) as cnt FROM `tabCompliance Calendar`
        WHERE company = %s AND status = 'Overdue'
    """, company, as_dict=True)
    if late_filings:
        exposure += late_filings[0].cnt * 4000  # Avg 4 months late

    # Unreconciled volume (2% risk)
    unreconciled = frappe.db.sql("""
        SELECT COALESCE(SUM(amount), 0) as total FROM `tabReconciliation Item`
        WHERE company = %s AND status != 'Matched'
    """, company, as_dict=True)
    if unreconciled:
        exposure += float(unreconciled[0].total or 0) * 0.02

    return exposure

def record_score_history(company, score):
    """Record score change in history"""
    last = frappe.db.get_value("Score History",
        {"company": company},
        ["score"],
        order_by="recorded_at desc"
    )

    frappe.get_doc({
        "doctype": "Score History",
        "company": company,
        "recorded_at": now_datetime(),
        "score": score,
        "previous_score": last or 0,
        "change": score - (last or 0),
        "trigger_event": "Manual calculation"
    }).insert(ignore_permissions=True)

@frappe.whitelist()
def get_score_history(company, days=30):
    """Get score trend for charting"""
    return frappe.get_all("Score History",
        filters={"company": company},
        fields=["recorded_at", "score", "change"],
        order_by="recorded_at desc",
        limit=days
    )
```

**Commit:** `feat(score): add compliance score calculation API`

---

## Task 5: Create Penalty Calculator API

**Files:**
- Modify: `digicomply/digicomply/api/compliance_score.py`

**Add to existing file:**
```python
@frappe.whitelist(allow_guest=True)
def submit_calculator(company_name, email=None, trn_count=1, invoice_volume="<500",
                      filing_status="All on time", trn_validated_pct=0, reconciled_pct=0):
    """
    Public API for penalty calculator submissions.
    Returns penalty exposure estimate.
    """
    # Calculate penalty estimate
    penalty = estimate_penalty_exposure(
        trn_count=int(trn_count),
        invoice_volume=invoice_volume,
        filing_status=filing_status,
        trn_validated_pct=float(trn_validated_pct),
        reconciled_pct=float(reconciled_pct)
    )

    risk_level = "Low"
    if penalty > 100000:
        risk_level = "Critical"
    elif penalty > 50000:
        risk_level = "High"
    elif penalty > 20000:
        risk_level = "Medium"

    # Save submission for lead gen
    doc = frappe.get_doc({
        "doctype": "Calculator Submission",
        "company_name": company_name,
        "email": email,
        "trn_count": int(trn_count),
        "invoice_volume": invoice_volume,
        "filing_status": filing_status,
        "trn_validated_pct": float(trn_validated_pct),
        "reconciled_pct": float(reconciled_pct),
        "penalty_exposure": penalty,
        "risk_level": risk_level
    })
    doc.insert(ignore_permissions=True)
    frappe.db.commit()

    return {
        "penalty_exposure": penalty,
        "risk_level": risk_level,
        "breakdown": calculate_penalty_breakdown(
            int(trn_count), invoice_volume, filing_status,
            float(trn_validated_pct), float(reconciled_pct)
        ),
        "submission_id": doc.name
    }

def estimate_penalty_exposure(trn_count, invoice_volume, filing_status, trn_validated_pct, reconciled_pct):
    """Estimate penalty based on calculator inputs"""
    exposure = 0

    # TRN violations
    invalid_trns = int(trn_count * (1 - trn_validated_pct / 100))
    exposure += invalid_trns * 10000

    # Filing penalties
    if filing_status == "Some late":
        exposure += trn_count * 4000  # Assume avg 4 months late per entity
    elif filing_status == "Pending returns":
        exposure += trn_count * 8000  # Assume 8 months avg

    # Reconciliation risk (estimate volume)
    volume_map = {"<500": 250, "500-2K": 1000, "2K-10K": 5000, "10K+": 15000}
    monthly_volume = volume_map.get(invoice_volume, 1000)
    avg_invoice = 5000  # AED average
    unreconciled_pct = 1 - (reconciled_pct / 100)
    unreconciled_value = monthly_volume * avg_invoice * unreconciled_pct * 12  # Annual
    exposure += unreconciled_value * 0.02  # 2% audit risk

    return round(exposure, 0)

def calculate_penalty_breakdown(trn_count, invoice_volume, filing_status, trn_validated_pct, reconciled_pct):
    """Return itemized breakdown for display"""
    breakdown = []

    # TRN violations
    invalid_trns = int(trn_count * (1 - trn_validated_pct / 100))
    if invalid_trns > 0:
        breakdown.append({
            "category": "TRN Violations",
            "amount": invalid_trns * 10000,
            "description": f"{invalid_trns} TRNs not validated"
        })

    # Filing penalties
    if filing_status == "Some late":
        amt = trn_count * 4000
        breakdown.append({
            "category": "Late Filing Penalties",
            "amount": amt,
            "description": "Estimated late filing fines"
        })
    elif filing_status == "Pending returns":
        amt = trn_count * 8000
        breakdown.append({
            "category": "Pending Returns",
            "amount": amt,
            "description": "Unfiled VAT returns"
        })

    # Reconciliation risk
    volume_map = {"<500": 250, "500-2K": 1000, "2K-10K": 5000, "10K+": 15000}
    monthly_volume = volume_map.get(invoice_volume, 1000)
    unreconciled_pct = 1 - (reconciled_pct / 100)
    unreconciled_value = monthly_volume * 5000 * unreconciled_pct * 12
    recon_risk = unreconciled_value * 0.02
    if recon_risk > 0:
        breakdown.append({
            "category": "Reconciliation Gaps",
            "amount": round(recon_risk, 0),
            "description": "Audit risk from unreconciled invoices"
        })

    return breakdown
```

**Commit:** `feat(calculator): add penalty calculator API with lead capture`

---

## Task 6: Create Penalty Calculator Page

**Files:**
- Create: `digicomply/digicomply/page/penalty_calculator/__init__.py`
- Create: `digicomply/digicomply/page/penalty_calculator/penalty_calculator.json`
- Create: `digicomply/digicomply/page/penalty_calculator/penalty_calculator.js`
- Create: `digicomply/digicomply/page/penalty_calculator/penalty_calculator.html`

**Commit:** `feat(calculator): add standalone penalty calculator page`

---

## Task 7: Create Compliance Onboarding Page

**Files:**
- Create: `digicomply/digicomply/page/compliance_onboarding/__init__.py`
- Create: `digicomply/digicomply/page/compliance_onboarding/compliance_onboarding.json`
- Create: `digicomply/digicomply/page/compliance_onboarding/compliance_onboarding.js`
- Create: `digicomply/digicomply/page/compliance_onboarding/compliance_onboarding.html`

**Commit:** `feat(onboarding): add 4-screen compliance onboarding flow`

---

## Task 8: Create Compliance Score Dashboard Page

**Files:**
- Create: `digicomply/digicomply/page/compliance_score_dashboard/__init__.py`
- Create: `digicomply/digicomply/page/compliance_score_dashboard/compliance_score_dashboard.json`
- Create: `digicomply/digicomply/page/compliance_score_dashboard/compliance_score_dashboard.js`
- Create: `digicomply/digicomply/page/compliance_score_dashboard/compliance_score_dashboard.html`

**Commit:** `feat(dashboard): add compliance score dashboard with gauge`

---

## Task 9: Update Workspace with GTM Pages

**Files:**
- Modify: `digicomply/digicomply/workspace/digicomply/digicomply.json`

**Add shortcuts and links for new pages**

**Commit:** `feat: add GTM pages to workspace`

---

## Task 10: Final Push

**Steps:**
1. Push branch: `git push -u origin feature/connor-gtm-onboarding`
2. Verify all commits

---

## Summary

| Task | Component | Files |
|------|-----------|-------|
| 0 | Feature Branch | - |
| 1 | Compliance Score DocType | 3 files |
| 2 | Score History DocType | 3 files |
| 3 | Calculator Submission DocType | 3 files |
| 4 | Compliance Score API | 1 file |
| 5 | Penalty Calculator API | 1 file (modify) |
| 6 | Penalty Calculator Page | 4 files |
| 7 | Compliance Onboarding Page | 4 files |
| 8 | Score Dashboard Page | 4 files |
| 9 | Workspace Update | 1 file |
| 10 | Final Push | - |

**Total: 11 tasks, ~24 files**
