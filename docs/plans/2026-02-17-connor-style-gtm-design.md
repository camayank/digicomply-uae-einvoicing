# DigiComply Connor-Style GTM Blueprint

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Date:** 2026-02-17
**Status:** Approved
**Version:** 1.0

---

## Executive Summary

**Framework:** Connor-style app principles (7 pillars)
1. Minimal features (do one thing exceptionally)
2. Onboarding-as-product (the experience IS the product)
3. Emotion-first (fear → relief → action)
4. Personalization (your specific numbers)
5. Proprietary score (DigiComply Score)
6. Strategic pricing (enterprise-first tiers)
7. Influencer distribution (tax consultants + content)

**Target:** UAE enterprises with 5+ TRNs, 5,000+ monthly invoices

**Primary Hook:** Group Penalty Exposure (AED amount)

**Retention Metric:** DigiComply Score (0-100)

**Launch Strategy:** Hybrid (PLG for SMBs + Direct Sales for Enterprise)

---

## 1. DigiComply Score Algorithm

### Score Components (Enterprise-Weighted)

```
DigiComply Score (100 points)
├── TRN Health (30 pts)
│   ├── All company TRNs FTA-validated (12 pts)
│   ├── Customer TRN coverage > 95% (10 pts)
│   └── Supplier TRN coverage > 95% (8 pts)
│
├── Reconciliation Health (30 pts)
│   ├── Cross-entity match rate > 98% (15 pts)
│   ├── No unresolved items > 48 hours (10 pts)
│   └── ASP sync success rate > 99% (5 pts)
│
├── Filing Compliance (25 pts)
│   ├── All entities filed on-time (12 pts)
│   ├── No pending returns across group (8 pts)
│   └── Audit trail completeness (5 pts)
│
└── Data Integrity (15 pts)
    ├── Zero duplicate transactions (5 pts)
    ├── Complete document archival (5 pts)
    └── Field completeness > 99% (5 pts)
```

### Score Thresholds

| Score Range | Label | Color | CSS Class | Emotional Trigger |
|-------------|-------|-------|-----------|-------------------|
| 0-39 | Critical Risk | #ef4444 | `dc-score-critical` | "Immediate action required" |
| 40-59 | At Risk | #f59e0b | `dc-score-atrisk` | "Significant gaps to address" |
| 60-79 | Improving | #eab308 | `dc-score-improving` | "Good progress, keep going" |
| 80-89 | Compliant | #84cc16 | `dc-score-compliant` | "Nearly there" |
| 90-100 | Fully Compliant | #10b981 | `dc-score-full` | "Audit-ready" |

### Penalty Exposure Formula

```python
def calculate_penalty_exposure(company_group):
    """
    Calculate total penalty exposure across all entities in a group.
    Returns AED amount.
    """
    exposure = 0

    for entity in company_group.entities:
        # TRN violations (AED 10,000 per invalid TRN)
        invalid_trns = count_invalid_trns(entity)
        exposure += invalid_trns * 10000

        # Late filing penalties (AED 1,000 initial + 1,000/month, max 20,000)
        for late_filing in entity.late_filings:
            months_late = calculate_months_late(late_filing)
            penalty = min(1000 + (months_late * 1000), 20000)
            exposure += penalty

        # Unreconciled volume risk (2% of unreconciled amount)
        unreconciled = get_unreconciled_amount(entity)
        exposure += unreconciled * 0.02

        # Missing audit trail (AED 5,000 per gap)
        audit_gaps = count_audit_trail_gaps(entity)
        exposure += audit_gaps * 5000

    # Group-level risks
    cross_entity_discrepancies = count_intercompany_mismatches(company_group)
    exposure += cross_entity_discrepancies * 2000

    return exposure
```

---

## 2. Onboarding Flow (Screen-by-Screen)

### Flow Architecture

```
[Landing Page] → [Penalty Calculator] → [Company Scan] → [Shock Screen]
    → [Score Screen] → [Action Plan] → [Paywall/Trial] → [Dashboard]
```

### Screen 1: Landing Page Hero

**URL:** `digicomply.ae`

**Elements:**
- Headline: "Know Your UAE VAT Penalty Risk in 60 Seconds"
- Subhead: "Free compliance scan for enterprises"
- CTA: "Calculate My Risk →" (purple gradient button)
- Social proof: "Trusted by 200+ UAE enterprises"
- Trust badges: FTA compliant, ISO certified, etc.

### Screen 2: Company Scan (Data Collection)

**Purpose:** Collect minimal data to calculate personalized penalty exposure

**Fields:**
```
1. Company/Group Name (text)
2. Number of TRNs (select: 1-2, 3-5, 6-10, 10+)
3. Monthly invoice volume (select: <500, 500-2K, 2K-10K, 10K+)
4. Filing frequency (select: Monthly, Quarterly)
5. Email (for report delivery)
```

**Design:**
- Progress indicator: "Step 1 of 3"
- 30-second completion time
- No account required yet
- "Your data is encrypted and never shared"

### Screen 3: Shock Moment (Penalty Exposure)

**Purpose:** Create urgency with personalized scary number

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   ⚠️  YOUR GROUP PENALTY EXPOSURE                   │
│                                                     │
│              AED 287,000                            │
│         ████████████████░░░░ HIGH RISK              │
│                                                     │
│   Breakdown:                                        │
│   ┌──────────────────────────────────────────────┐  │
│   │ TRN Violations           AED 30,000   (10%)  │  │
│   │ Late Filing Risk         AED 8,000    (3%)   │  │
│   │ Reconciliation Gaps      AED 240,000  (84%)  │  │
│   │ Audit Trail Issues       AED 9,000    (3%)   │  │
│   └──────────────────────────────────────────────┘  │
│                                                     │
│   This is an estimate based on UAE FTA penalty      │
│   guidelines. Actual penalties may vary.            │
│                                                     │
│              [See Your Compliance Score →]          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Emotional elements:**
- Large red/orange number
- Animated counter (counts up to final number)
- Breakdown shows WHERE the risk is
- Disclaimer for legal protection

### Screen 4: Relief (DigiComply Score)

**Purpose:** Show path to safety, introduce proprietary metric

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   YOUR DIGICOMPLY SCORE                             │
│                                                     │
│                    34                               │
│                   ────                              │
│                    100                              │
│                                                     │
│        [████████░░░░░░░░░░░░░░░░░░░░]               │
│              CRITICAL RISK                          │
│                                                     │
│   Score Breakdown:                                  │
│   ┌──────────────────────────────────────────────┐  │
│   │ TRN Health        ████░░░░░░░░   12/30      │  │
│   │ Reconciliation    ██░░░░░░░░░░    8/30      │  │
│   │ Filing Compliance ████████░░░░   20/25      │  │
│   │ Data Integrity    ████░░░░░░░░    6/15      │  │
│   └──────────────────────────────────────────────┘  │
│                                                     │
│   🎯 You need 4 actions to reach 100               │
│                                                     │
│              [Show Me How to Fix This →]            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Emotional elements:**
- Circular score gauge (animated fill)
- Color-coded based on score range
- Breakdown shows specific weak areas
- "4 actions" creates achievable goal

### Screen 5: Action Plan (Paywall)

**Purpose:** Show the fix, gate behind trial/subscription

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   YOUR 30-DAY COMPLIANCE ROADMAP                    │
│                                                     │
│   Week 1: TRN Validation                            │
│   ├── ☐ Validate 8 company TRNs with FTA            │
│   ├── ☐ Bulk verify 2,340 customer TRNs             │
│   └── ☐ Flag 127 suppliers with invalid TRNs       │
│                                                     │
│   Week 2: Reconciliation Cleanup                    │
│   ├── ☐ Auto-reconcile 45,000 invoices       🔒    │
│   └── ☐ Resolve 234 mismatches               🔒    │
│                                                     │
│   Week 3-4: Filing & Audit Prep                     │
│   ├── ☐ Generate VAT 201 for 8 entities      🔒    │
│   └── ☐ Build complete audit trail           🔒    │
│                                                     │
│   ┌─────────────────────────────────────────────┐   │
│   │  🔒 Unlock Your Compliance Roadmap          │   │
│   │                                             │   │
│   │  Start your 14-day free trial              │   │
│   │  No credit card required                   │   │
│   │                                             │   │
│   │  [Start Free Trial]     [Talk to Sales]    │   │
│   └─────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Paywall logic:**
- First 2-3 actions shown unlocked (TRN validation basics)
- Advanced features locked (bulk reconciliation, VAT reports)
- "Talk to Sales" for enterprises (>10 TRNs or >10K invoices)

---

## 3. Standalone Penalty Calculator

### Purpose
Viral acquisition tool, SEO magnet, social sharing

### URL
`digicomply.ae/penalty-calculator`

### Design

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   UAE VAT PENALTY CALCULATOR                        │
│   Free tool for finance teams                       │
│                                                     │
│   ┌─────────────────────────────────────────────┐   │
│   │                                             │   │
│   │  Number of TRNs in your group:              │   │
│   │  [________]                                 │   │
│   │                                             │   │
│   │  Monthly invoice volume:                    │   │
│   │  [________]                                 │   │
│   │                                             │   │
│   │  Have you filed all VAT returns on time?    │   │
│   │  ○ Yes, all on time                         │   │
│   │  ○ Some were late                           │   │
│   │  ○ We have pending returns                  │   │
│   │                                             │   │
│   │  What % of your TRNs are FTA-validated?     │   │
│   │  [________] %                               │   │
│   │                                             │   │
│   │  What % of invoices are reconciled?         │   │
│   │  [________] %                               │   │
│   │                                             │   │
│   └─────────────────────────────────────────────┘   │
│                                                     │
│              [Calculate My Risk →]                  │
│                                                     │
│   ─────────────────────────────────────────────────│
│   Used by 2,400+ UAE finance teams                 │
│   Featured in: Gulf News | Arabian Business        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Output: Shareable Report Card

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   YOUR PENALTY RISK REPORT                          │
│   Generated: 17 Feb 2026                            │
│                                                     │
│   ┌─────────────────────────────────────────────┐   │
│   │                                             │   │
│   │   ESTIMATED PENALTY EXPOSURE                │   │
│   │                                             │   │
│   │          AED 127,500                        │   │
│   │                                             │   │
│   │   Risk Level: HIGH                          │   │
│   │                                             │   │
│   └─────────────────────────────────────────────┘   │
│                                                     │
│   Breakdown:                                        │
│   • TRN Violations:        AED 40,000              │
│   • Filing Penalties:      AED 12,000              │
│   • Reconciliation Risk:   AED 70,000              │
│   • Audit Exposure:        AED 5,500               │
│                                                     │
│   ─────────────────────────────────────────────────│
│                                                     │
│   [Download PDF]  [Share on LinkedIn]  [Email Me]   │
│                                                     │
│   ─────────────────────────────────────────────────│
│                                                     │
│   Want to reduce this to AED 0?                     │
│   [Get Your Free Compliance Score →]                │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Viral Features
- LinkedIn share button with pre-filled text
- Downloadable PDF report (branded)
- Email capture for "Send me my report"
- Compare to industry average

---

## 4. Pricing Strategy

### Tier Structure

| Tier | Monthly (AED) | Annual (AED) | Target Segment |
|------|---------------|--------------|----------------|
| Free | 0 | 0 | Lead gen, tiny businesses |
| Growth | 999 | 9,990 (17% off) | SMBs, 1-3 TRNs |
| Business | 2,499 | 24,990 (17% off) | Mid-market, 4-10 TRNs |
| Enterprise | Custom (5,000+) | Custom | Large corps, 10+ TRNs |

### Feature Matrix

| Feature | Free | Growth | Business | Enterprise |
|---------|------|--------|----------|------------|
| DigiComply Score | ✓ | ✓ | ✓ | ✓ |
| Penalty Calculator | ✓ | ✓ | ✓ | ✓ |
| TRNs | 1 | 3 | 10 | Unlimited |
| Reconciliations/mo | 50 | 2,000 | 10,000 | Unlimited |
| Customer/Supplier TRN validation | 100 | 5,000 | 25,000 | Unlimited |
| VAT Reports | - | ✓ | ✓ | ✓ |
| Compliance Calendar | - | ✓ | ✓ | ✓ |
| ASP Connectors | - | - | ✓ | ✓ |
| Audit Trail | - | - | ✓ | ✓ |
| API Access | - | - | - | ✓ |
| Dedicated Support | - | - | - | ✓ |
| SLA | - | - | - | ✓ |
| Custom Integrations | - | - | - | ✓ |

### Enterprise Auto-Routing

Trigger "Contact Sales" flow when:
- TRN count > 10
- Invoice volume > 10,000/month
- Company name matches known enterprise list
- User selects "Enterprise" in dropdown

---

## 5. Distribution Strategy

### PLG Channels (SMB Acquisition)

| Channel | Tactic | Metric |
|---------|--------|--------|
| SEO | Penalty calculator ranks for "UAE VAT penalty calculator", "TRN validation UAE" | Organic traffic |
| Content Marketing | LinkedIn posts, blog articles on UAE compliance | Engagement, shares |
| Viral Loop | Shareable penalty reports with branding | Report shares |
| Referral Program | "Give AED 500, Get AED 500" subscription credit | Referral signups |
| Freemium Upgrade | In-app prompts when hitting limits | Free → Paid conversion |

### Enterprise Channels

| Channel | Tactic | Metric |
|---------|--------|--------|
| Tax Consultant Partners | Revenue share (20%) with Big 4, mid-tier firms | Partner deals |
| Direct Outreach | LinkedIn Sales Navigator targeting CFOs with 5+ TRNs | Meetings booked |
| Webinars | "UAE E-Invoicing 2026: Enterprise Readiness" | Registrations, SQLs |
| FTA Events | Sponsor/speak at official compliance events | Brand awareness |
| Case Studies | "How [Enterprise X] achieved 100% compliance" | Enterprise leads |

### Launch Timeline (Day 1-60)

```
Phase 1: Soft Launch (Day 1-14)
├── Day 1:  Deploy penalty calculator
├── Day 3:  Launch LinkedIn campaign
├── Day 7:  Invite 50 beta enterprises (3-month free)
└── Day 14: Collect initial feedback, iterate

Phase 2: Public Launch (Day 15-30)
├── Day 15: PR push (Gulf News, Arabian Business)
├── Day 18: Launch referral program
├── Day 21: First webinar
├── Day 25: Partner announcement (first tax consultant)
└── Day 30: Review metrics, optimize

Phase 3: Scale (Day 31-60)
├── Day 31: Launch retargeting campaigns
├── Day 40: Second partner announcement
├── Day 45: Case study publication
├── Day 50: Enterprise sales push begins
└── Day 60: Review Q1 metrics, plan Q2
```

---

## 6. Technical Implementation

### New DocTypes

| DocType | Purpose |
|---------|---------|
| `Compliance Score` | Store calculated scores per company |
| `Score History` | Track score changes over time |
| `Penalty Exposure` | Store penalty calculations |
| `Onboarding Session` | Track user onboarding progress |
| `Calculator Submission` | Store calculator submissions for lead gen |

### New Pages

| Page | Purpose |
|------|---------|
| `penalty_calculator` | Standalone viral calculator |
| `compliance_onboarding` | 4-screen onboarding flow |
| `compliance_score_dashboard` | Main score visualization |

### New APIs

| Endpoint | Purpose |
|----------|---------|
| `calculate_compliance_score` | Compute score for a company |
| `calculate_penalty_exposure` | Compute penalty exposure |
| `submit_calculator` | Handle calculator form submission |
| `get_score_history` | Fetch score trend data |

### Design System Additions

```css
/* Score colors */
.dc-score-critical { color: #ef4444; }
.dc-score-atrisk { color: #f59e0b; }
.dc-score-improving { color: #eab308; }
.dc-score-compliant { color: #84cc16; }
.dc-score-full { color: #10b981; }

/* Score gauge */
.dc-score-gauge { /* Circular progress indicator */ }
.dc-score-breakdown { /* Horizontal bar charts */ }

/* Penalty display */
.dc-penalty-amount { font-size: 3rem; font-weight: 700; }
.dc-penalty-breakdown { /* Stacked bar or pie chart */ }

/* Onboarding */
.dc-onboarding-step { /* Step indicator */ }
.dc-onboarding-card { /* Card with shadow, animation */ }
```

---

## 7. Success Metrics

### North Star Metric
**Weekly Active Score Checkers:** Users who view their DigiComply Score at least once per week

### Funnel Metrics

| Stage | Metric | Target |
|-------|--------|--------|
| Awareness | Calculator submissions/month | 1,000 |
| Activation | Onboarding completions | 40% of submissions |
| Conversion | Free → Paid | 5% |
| Revenue | MRR | AED 100K by month 6 |
| Retention | Weekly score checkers | 60% of active users |
| Referral | Referral signups | 20% of new users |

### Enterprise Metrics

| Metric | Target |
|--------|--------|
| Enterprise demos/month | 20 |
| Enterprise close rate | 25% |
| Average contract value | AED 60,000/year |
| Enterprise churn | <5% annual |

---

## 8. Risk Mitigation

| Risk | Mitigation |
|------|------------|
| FTA penalty numbers disputed | Disclaimer: "Estimates based on published guidelines" |
| Score gaming | Audit trail required for score changes |
| Enterprise sales cycle too long | Offer 90-day pilot at reduced rate |
| Calculator accuracy questioned | Link to official FTA penalty documentation |
| Privacy concerns | Clear data policy, no sharing without consent |

---

## Next Steps

1. Create implementation plan using `superpowers:writing-plans`
2. Build in phases:
   - Phase A: Score engine + Penalty calculator
   - Phase B: Onboarding flow
   - Phase C: Dashboard + Pricing gates
   - Phase D: Distribution infrastructure

---

*Document created: 2026-02-17*
*Author: DigiComply Team*
*Status: Approved for implementation*
