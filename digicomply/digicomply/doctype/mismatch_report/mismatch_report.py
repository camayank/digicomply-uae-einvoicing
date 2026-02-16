# Copyright (c) 2024, DigiComply and contributors
# License: MIT

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import flt, now_datetime, get_url


class MismatchReport(Document):
    """
    Mismatch Report - PDF Audit Pack for FTA Compliance

    Generates professional compliance report showing:
    - Summary of reconciliation findings
    - Detailed mismatch analysis
    - Potential penalty exposure
    - Actionable recommendations
    """

    def validate(self):
        if self.reconciliation_run:
            self.populate_from_reconciliation()

    def populate_from_reconciliation(self):
        """Pull data from linked Reconciliation Run"""
        rec = frappe.get_doc("Reconciliation Run", self.reconciliation_run)

        self.company = rec.company

        # Calculate issues
        mismatched = rec.mismatched_count or 0
        missing_asp = rec.missing_in_asp or 0
        missing_erp = rec.missing_in_erp or 0

        self.total_issues = mismatched + missing_asp + missing_erp
        self.critical_issues = missing_asp  # Missing in ASP = not reported = critical

        # Calculate potential penalty
        # FTA penalties: AED 5,000 per unreported invoice (simplified)
        self.potential_penalty = missing_asp * 5000

        # Calculate compliance score
        total = rec.total_invoices or 1
        matched = rec.matched_count or 0
        self.compliance_score = flt((matched / total) * 100, 2) if total > 0 else 0

        # Generate findings HTML
        self.generate_findings_html(rec)

        # Generate recommendations
        self.generate_recommendations(rec)

    def generate_findings_html(self, rec):
        """Generate HTML summary of findings"""

        # Get items by status
        items = rec.items or []

        mismatched = [i for i in items if i.match_status == "Mismatched"]
        missing_asp = [i for i in items if i.match_status == "Missing in ASP"]
        missing_erp = [i for i in items if i.match_status == "Missing in Books"]

        html = f"""
        <style>
            .findings {{ font-family: -apple-system, BlinkMacSystemFont, sans-serif; }}
            .findings-section {{ margin-bottom: 20px; }}
            .findings-title {{ font-size: 16px; font-weight: 600; margin-bottom: 10px; }}
            .status-badge {{
                display: inline-block;
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 500;
            }}
            .badge-green {{ background: #d1fae5; color: #065f46; }}
            .badge-yellow {{ background: #fef3c7; color: #92400e; }}
            .badge-red {{ background: #fee2e2; color: #991b1b; }}
            .findings-table {{ width: 100%; border-collapse: collapse; margin-top: 10px; }}
            .findings-table th, .findings-table td {{
                border: 1px solid #e5e7eb;
                padding: 8px 12px;
                text-align: left;
            }}
            .findings-table th {{ background: #f9fafb; font-weight: 500; }}
            .amount {{ text-align: right; font-family: monospace; }}
        </style>

        <div class="findings">
            <div class="findings-section">
                <div class="findings-title">
                    <span class="status-badge badge-green">✓ Matched</span>
                    {rec.matched_count or 0} invoices
                </div>
                <p>These invoices match between your Books and ASP - no action required.</p>
            </div>
        """

        # Mismatched section
        if mismatched:
            html += f"""
            <div class="findings-section">
                <div class="findings-title">
                    <span class="status-badge badge-yellow">⚠ Mismatched</span>
                    {len(mismatched)} invoices
                </div>
                <p>These invoices have differences between Book and ASP data.</p>
                <table class="findings-table">
                    <thead>
                        <tr>
                            <th>Invoice</th>
                            <th>Customer</th>
                            <th class="amount">Book Total</th>
                            <th class="amount">ASP Total</th>
                            <th class="amount">Difference</th>
                        </tr>
                    </thead>
                    <tbody>
            """
            for item in mismatched[:10]:  # Show first 10
                erp = flt(item.erp_grand_total, 2)
                asp = flt(item.asp_grand_total, 2)
                diff = erp - asp
                html += f"""
                        <tr>
                            <td>{item.invoice_no}</td>
                            <td>{item.customer or '-'}</td>
                            <td class="amount">AED {erp:,.2f}</td>
                            <td class="amount">AED {asp:,.2f}</td>
                            <td class="amount">AED {diff:,.2f}</td>
                        </tr>
                """
            html += """
                    </tbody>
                </table>
            </div>
            """

        # Missing in ASP (Critical)
        if missing_asp:
            html += f"""
            <div class="findings-section">
                <div class="findings-title">
                    <span class="status-badge badge-red">✗ Missing in ASP</span>
                    {len(missing_asp)} invoices - CRITICAL
                </div>
                <p><strong>These invoices exist in your Books but were not reported to ASP.</strong>
                This may result in FTA penalties.</p>
                <table class="findings-table">
                    <thead>
                        <tr>
                            <th>Invoice</th>
                            <th>Date</th>
                            <th>Customer</th>
                            <th class="amount">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
            """
            for item in missing_asp[:10]:
                html += f"""
                        <tr>
                            <td>{item.invoice_no}</td>
                            <td>{item.posting_date or '-'}</td>
                            <td>{item.customer or '-'}</td>
                            <td class="amount">AED {flt(item.erp_grand_total, 2):,.2f}</td>
                        </tr>
                """
            html += """
                    </tbody>
                </table>
            </div>
            """

        # Missing in Books
        if missing_erp:
            html += f"""
            <div class="findings-section">
                <div class="findings-title">
                    <span class="status-badge badge-red">? Missing in Books</span>
                    {len(missing_erp)} invoices
                </div>
                <p>These invoices appear in ASP but not in your books. This may indicate
                data entry issues or unauthorized invoices.</p>
                <table class="findings-table">
                    <thead>
                        <tr>
                            <th>Invoice</th>
                            <th class="amount">ASP Amount</th>
                        </tr>
                    </thead>
                    <tbody>
            """
            for item in missing_erp[:10]:
                html += f"""
                        <tr>
                            <td>{item.invoice_no}</td>
                            <td class="amount">AED {flt(item.asp_grand_total, 2):,.2f}</td>
                        </tr>
                """
            html += """
                    </tbody>
                </table>
            </div>
            """

        html += "</div>"
        self.findings_html = html

    def generate_recommendations(self, rec):
        """Generate actionable recommendations"""
        recommendations = []

        if rec.missing_in_asp > 0:
            recommendations.append(
                f"**URGENT:** {rec.missing_in_asp} invoice(s) are missing from ASP. "
                "Submit these to your ASP (ClearTax/Cygnet/Zoho) immediately to avoid "
                f"potential penalties of AED {rec.missing_in_asp * 5000:,.0f}."
            )

        if rec.mismatched_count > 0:
            recommendations.append(
                f"**Review:** {rec.mismatched_count} invoice(s) have data differences. "
                "Compare Book and ASP values, correct the source system, and resubmit if needed."
            )

        if rec.missing_in_erp > 0:
            recommendations.append(
                f"**Investigate:** {rec.missing_in_erp} invoice(s) appear in ASP but not in your Books. "
                "Verify these are legitimate transactions. If not, report to ASP for cancellation."
            )

        if rec.matched_count == rec.total_invoices:
            recommendations.append(
                "**Excellent!** All invoices are matched. Your e-invoicing compliance is up to date."
            )

        if self.compliance_score < 90:
            recommendations.append(
                f"**Compliance Score: {self.compliance_score:.1f}%** - "
                "Target 95%+ compliance to minimize FTA audit risk."
            )

        self.recommendations = "\n\n".join(recommendations)

    @frappe.whitelist()
    def generate_pdf(self):
        """Generate PDF version of the report"""
        from frappe.utils.pdf import get_pdf

        # Get company details
        company = frappe.get_doc("Company", self.company) if self.company else None

        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    line-height: 1.6;
                    color: #1f2937;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 40px;
                }}
                .header {{
                    border-bottom: 3px solid #2563eb;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }}
                .logo {{ font-size: 24px; font-weight: 700; color: #2563eb; }}
                .title {{ font-size: 20px; margin-top: 10px; }}
                .meta {{ color: #6b7280; font-size: 14px; }}
                .summary-box {{
                    background: #f3f4f6;
                    border-radius: 8px;
                    padding: 20px;
                    margin: 20px 0;
                    display: flex;
                    justify-content: space-between;
                }}
                .summary-item {{ text-align: center; }}
                .summary-value {{ font-size: 28px; font-weight: 700; }}
                .summary-label {{ font-size: 12px; color: #6b7280; }}
                .score-green {{ color: #059669; }}
                .score-yellow {{ color: #d97706; }}
                .score-red {{ color: #dc2626; }}
                .section {{ margin: 30px 0; }}
                .section-title {{ font-size: 16px; font-weight: 600; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; }}
                .footer {{
                    margin-top: 50px;
                    padding-top: 20px;
                    border-top: 1px solid #e5e7eb;
                    font-size: 12px;
                    color: #9ca3af;
                    text-align: center;
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <div class="logo">DigiComply</div>
                <div class="title">UAE E-Invoicing Compliance Report</div>
                <div class="meta">
                    Company: {self.company or 'N/A'}<br>
                    Report Date: {self.report_date}<br>
                    Reconciliation: {self.reconciliation_run}
                </div>
            </div>

            <div class="summary-box">
                <div class="summary-item">
                    <div class="summary-value">{self.total_issues}</div>
                    <div class="summary-label">Total Issues</div>
                </div>
                <div class="summary-item">
                    <div class="summary-value score-red">{self.critical_issues}</div>
                    <div class="summary-label">Critical</div>
                </div>
                <div class="summary-item">
                    <div class="summary-value">AED {self.potential_penalty:,.0f}</div>
                    <div class="summary-label">Potential Penalty</div>
                </div>
                <div class="summary-item">
                    <div class="summary-value {'score-green' if self.compliance_score >= 90 else 'score-yellow' if self.compliance_score >= 70 else 'score-red'}">{self.compliance_score:.1f}%</div>
                    <div class="summary-label">Compliance Score</div>
                </div>
            </div>

            <div class="section">
                <div class="section-title">Findings</div>
                {self.findings_html or '<p>No findings available.</p>'}
            </div>

            <div class="section">
                <div class="section-title">Recommendations</div>
                <div style="white-space: pre-line;">{self.recommendations or 'No recommendations.'}</div>
            </div>

            <div class="footer">
                Generated by DigiComply UAE E-Invoicing Platform<br>
                {now_datetime().strftime('%Y-%m-%d %H:%M:%S')} | {get_url()}
            </div>
        </body>
        </html>
        """

        # Generate PDF
        pdf_content = get_pdf(html, options={"orientation": "Portrait"})

        # Save as attachment
        file_name = f"Compliance_Report_{self.name}.pdf"
        file_doc = frappe.get_doc({
            "doctype": "File",
            "file_name": file_name,
            "content": pdf_content,
            "attached_to_doctype": self.doctype,
            "attached_to_name": self.name,
            "is_private": 1,
        })
        file_doc.save(ignore_permissions=True)

        self.db_set("pdf_file", file_doc.file_url)
        self.db_set("status", "Generated")

        return {"file_url": file_doc.file_url}


def create_report(reconciliation_run: str):
    """Create Mismatch Report from Reconciliation Run"""
    doc = frappe.get_doc({
        "doctype": "Mismatch Report",
        "reconciliation_run": reconciliation_run,
    })
    doc.insert(ignore_permissions=True)
    doc.generate_pdf()
    return doc.name
