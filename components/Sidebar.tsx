"use client";

import React, { useState } from "react";

type SidebarProps = {
  onActionClick: (query: string) => void;
  onOpenCalc: () => void;
  onShowComparison: () => void;
};

type CollapsibleSectionProps = {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
};

function CollapsibleSection({ title, defaultOpen = false, children }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="sidebar-section">
      <h3 onClick={() => setIsOpen(!isOpen)}>
        {title} <span className={`toggle-icon ${!isOpen ? 'collapsed' : ''}`}>▼</span>
      </h3>
      <div className={`sidebar-content ${!isOpen ? 'collapsed' : ''}`}>
        {children}
      </div>
    </div>
  );
}

function ActionButton({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button 
      onClick={onClick} 
      style={{ width: "100%", textAlign: "left", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "8px", padding: "9px 12px", marginBottom: "6px", cursor: "pointer", fontSize: "13px", color: "var(--text)", display: "flex", alignItems: "center", gap: "8px" }}
    >
      <span style={{ fontSize: "16px" }}>{icon}</span><span style={{ flex: 1 }}>{label}</span>
    </button>
  );
}

export default function Sidebar({ onActionClick, onOpenCalc, onShowComparison }: SidebarProps) {
  return (
    <aside style={{ width: "280px", background: "var(--surface)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0 }}>
      <div style={{ flex: 1, overflowY: "auto" }}>
        
        {/* Quick Actions */}
        <CollapsibleSection title="Quick Actions" defaultOpen={true}>
          <button 
            onClick={onOpenCalc}
            style={{ width: "100%", textAlign: "left", background: "var(--saffron-light)", borderColor: "var(--saffron)", color: "var(--saffron-dark)", fontWeight: 600, border: "1px solid var(--border)", borderRadius: "8px", padding: "9px 12px", marginBottom: "6px", cursor: "pointer", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px" }}
          >
            <span style={{ fontSize: "16px" }}>🧮</span><span style={{ flex: 1 }}>Comprehensive Tax Calculator</span>
          </button>
          {[
            { icon: "🧮", label: "Tax Calculator (FY 26-27)", q: "Calculate my income tax for FY 2026-27. I am a salaried individual earning ₹15 lakhs per annum." },
            { icon: "🏠", label: "Capital Gains on Property", q: "What are the capital gains tax rules for selling a flat in FY 2026-27? I bought it in 2019." },
            { icon: "💰", label: "Deductions & Savings", q: "What deductions can I claim under ITA 2025 to reduce my taxable income? I am salaried." },
            { icon: "📋", label: "TDS Rates (ITA 2025)", q: "What are the TDS rates under Section 393 of ITA 2025? Explain the consolidated TDS framework." },
            { icon: "📅", label: "Advance Tax Schedule", q: "Explain the advance tax payment schedule for FY 2026-27. What are the due dates and percentages?" },
            { icon: "✈️", label: "NRI Taxation", q: "I am an NRI. What are my income tax obligations in India under ITA 2025?" },
            { icon: "🎯", label: "Section 87A Rebate", q: "What is the Section 87A rebate under ITA 2025? Who is eligible and how much?" },
            { icon: "📈", label: "LTCG on Equity/MFs", q: "What are the LTCG tax rules for selling mutual funds (equity) in FY 2026-27?" },
            { icon: "🏪", label: "Presumptive Taxation", q: "What is presumptive taxation under Section 63 of ITA 2025? Who can opt for it?" },
            { icon: "🖥️", label: "Faceless Assessment", q: "Explain the faceless assessment scheme under ITA 2025. How does it work?" },
          ].map((item, i) => (
            <ActionButton key={i} icon={item.icon} label={item.label} onClick={() => onActionClick(item.q)} />
          ))}
          <button 
            onClick={onShowComparison}
            style={{ width: "100%", textAlign: "left", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "8px", padding: "9px 12px", marginBottom: "6px", cursor: "pointer", fontSize: "13px", color: "var(--text)", display: "flex", alignItems: "center", gap: "8px" }}
          >
            <span style={{ fontSize: "16px" }}>📊</span><span style={{ flex: 1 }}>Section Comparison (1961 vs 2025)</span>
          </button>
        </CollapsibleSection>

        {/* Tax Slabs */}
        <CollapsibleSection title="Tax Slabs — FY 2026-27" defaultOpen={true}>
          <table className="markdown-body" style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", margin: "0" }}>
            <thead>
              <tr>
                <th style={{ background: "var(--navy)", color: "white", padding: "5px 8px", textAlign: "left", fontWeight: 600 }}>Income</th>
                <th style={{ background: "var(--navy)", color: "white", padding: "5px 8px", textAlign: "right", fontWeight: 600 }}>Rate</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Up to ₹4 L", "Nil"],
                ["₹4L – ₹8L", "5%"],
                ["₹8L – ₹12L", "10%"],
                ["₹12L – ₹16L", "15%"],
                ["₹16L – ₹20L", "20%"],
                ["₹20L – ₹24L", "25%"],
                ["Above ₹24L", "30%"],
              ].map(([inc, rate], i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "5px 8px", color: "var(--text)" }}>{inc}</td>
                  <td style={{ padding: "5px 8px", fontWeight: 600, color: "var(--navy)", textAlign: "right" }}>{rate}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "6px" }}>+ 4% H&E Cess · 87A rebate up to ₹12.75L (salaried)</p>
        </CollapsibleSection>

        {/* Compliance Calendar */}
        <CollapsibleSection title="Compliance Calendar 2026-27">
          {[
            { date: "15 Jun", desc: "Advance Tax Q1 — 15%" },
            { date: "31 Jul", desc: "ITR filing (non-audit)" },
            { date: "15 Sep", desc: "Advance Tax Q2 — 45%" },
            { date: "30 Sep", desc: "Tax Audit Report" },
            { date: "31 Oct", desc: "ITR filing (audit cases)" },
            { date: "30 Nov", desc: "ITR (Transfer Pricing)" },
            { date: "15 Dec", desc: "Advance Tax Q3 — 75%" },
            { date: "15 Mar", desc: "Advance Tax Q4 — 100%" },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", gap: "10px", padding: "6px 0", borderBottom: "1px dashed var(--border)", fontSize: "13px" }}>
              <span style={{ fontWeight: 600, color: "var(--saffron)", width: "45px" }}>{item.date}</span>
              <span style={{ color: "var(--text)" }}>{item.desc}</span>
            </div>
          ))}
        </CollapsibleSection>

        {/* Case Law Topics */}
        <CollapsibleSection title="Case Law Topics">
          {[
            { icon: "⚖️", label: "Capital Gains — SC Cases", q: "What are the landmark Supreme Court judgments on capital gains taxation in India?" },
            { icon: "🔍", label: "Reassessment Case Law", q: "What are landmark cases on Section 147 reassessment? Explain the GKN Driveshafts and Kelvinator judgments." },
            { icon: "🚨", label: "Penalty — Key Judgments", q: "What are the key Supreme Court rulings on penalty under income tax — Section 270A / 271?" },
            { icon: "🌐", label: "International Tax & DTAA", q: "Explain the Engineering Analysis Centre judgment on royalty taxation on software under DTAA." },
          ].map((item, i) => (
            <ActionButton key={i} icon={item.icon} label={item.label} onClick={() => onActionClick(item.q)} />
          ))}
        </CollapsibleSection>

        {/* Sector-Specific Issues */}
        <CollapsibleSection title="Sector-Specific Issues">
          {[
            { icon: "🏗️", label: "Joint Development (JDA)", q: "Explain the taxation of Joint Development Agreements (JDA) under the Income Tax Act." },
            { icon: "🏢", label: "Real Estate Developers", q: "How are unsold inventory flats taxed for real estate developers under ITA?" },
            { icon: "💻", label: "Software & IT Sector", q: "What is the taxability of software royalty payments to non-residents?" },
            { icon: "🪙", label: "Cryptocurrency Taxation", q: "How are cryptocurrency transactions taxed in India under ITA 2025?" },
            { icon: "🥫", label: "Food Processing Incentives", q: "What tax incentives are available for food processing companies under ITA?" },
            { icon: "🚢", label: "Export Incentives", q: "What export incentives and duty drawbacks apply to manufacturers under ITA?" },
          ].map((item, i) => (
            <ActionButton key={i} icon={item.icon} label={item.label} onClick={() => onActionClick(item.q)} />
          ))}
        </CollapsibleSection>

        {/* Tax Planning Guide */}
        <CollapsibleSection title="Tax Planning Guide">
          {[
            { icon: "👨‍👩‍👧‍👦", label: "HUF Tax Planning", q: "How can I use an HUF (Hindu Undivided Family) for tax planning?" },
            { icon: "📈", label: "Tax Harvesting (Equity)", q: "What is Tax Harvesting for equity investments and how does it work?" },
            { icon: "💼", label: "Salary Restructuring", q: "How should I restructure my salary CTC to minimize income tax?" },
            { icon: "📉", label: "Loss Set-Off Rules", q: "What are the rules for setting off and carrying forward capital losses?" },
          ].map((item, i) => (
            <ActionButton key={i} icon={item.icon} label={item.label} onClick={() => onActionClick(item.q)} />
          ))}
        </CollapsibleSection>

        {/* Notice & Assessment */}
        <CollapsibleSection title="Notice & Assessment">
          {[
            { icon: "⚠️", label: "Defective Return 139(9)", q: "I received a defective return notice under Section 139(9). What should I do?" },
            { icon: "🔍", label: "Scrutiny 143(2)", q: "How should I handle a scrutiny notice under Section 143(2)?" },
            { icon: "🚨", label: "Reassessment 148/148A", q: "What is the procedure if I receive a reassessment notice under Section 148 / 148A?" },
            { icon: "ℹ️", label: "Information 133(6)", q: "What does a notice for information under Section 133(6) mean?" },
          ].map((item, i) => (
            <ActionButton key={i} icon={item.icon} label={item.label} onClick={() => onActionClick(item.q)} />
          ))}
        </CollapsibleSection>

      </div>
    </aside>
  );
}
