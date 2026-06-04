"use client";

import React, { useState } from "react";

export default function CalculatorModal({ onClose }: { onClose: () => void }) {
  const [fy, setFy] = useState("2627");
  const [salary, setSalary] = useState<number | "">("");
  const [hp, setHp] = useState<number | "">("");
  const [pgbp, setPgbp] = useState<number | "">("");
  const [cg, setCg] = useState<number | "">("");
  const [ios, setIos] = useState<number | "">("");
  const [ded, setDed] = useState<number | "">("");

  const [results, setResults] = useState({
    gti: 0,
    ded: 0,
    tti: 0,
    tax: 0,
    rebate: 0,
    surcharge: 0,
    taxsur: 0,
    cess: 0,
    final: 0,
  });

  const formatRs = (num: number) => '₹' + Math.max(0, Math.round(num)).toLocaleString('en-IN');

  const computeTax = () => {
    const s = Number(salary) || 0;
    const hp_val = Number(hp) || 0;
    const pgbp_val = Number(pgbp) || 0;
    const cg_val = Number(cg) || 0;
    const ios_val = Number(ios) || 0;
    const ded_val = Number(ded) || 0;

    const gti = s + hp_val + pgbp_val + cg_val + ios_val;
    const tti = Math.max(0, gti - ded_val);

    let tax = 0;
    let rem = tti;
    let rebate = 0;

    if (fy === '2627') {
      // FY 26-27 Slabs
      if (rem > 400000) {
        rem -= 400000;
        let slab = Math.min(rem, 400000);
        tax += slab * 0.05;
        rem -= slab;
      }
      if (rem > 0) {
        let slab = Math.min(rem, 400000);
        tax += slab * 0.10;
        rem -= slab;
      }
      if (rem > 0) {
        let slab = Math.min(rem, 400000);
        tax += slab * 0.15;
        rem -= slab;
      }
      if (rem > 0) {
        let slab = Math.min(rem, 400000);
        tax += slab * 0.20;
        rem -= slab;
      }
      if (rem > 0) {
        let slab = Math.min(rem, 400000);
        tax += slab * 0.25;
        rem -= slab;
      }
      if (rem > 0) {
        tax += rem * 0.30;
      }

      if (tti <= 1275000) {
        rebate = Math.min(tax, 60000);
      }
    } else {
      // FY 25-26 Slabs (New Regime)
      if (rem > 300000) {
        rem -= 300000;
        let slab = Math.min(rem, 400000); // 3L to 7L
        tax += slab * 0.05;
        rem -= slab;
      }
      if (rem > 0) {
        let slab = Math.min(rem, 300000); // 7L to 10L
        tax += slab * 0.10;
        rem -= slab;
      }
      if (rem > 0) {
        let slab = Math.min(rem, 200000); // 10L to 12L
        tax += slab * 0.15;
        rem -= slab;
      }
      if (rem > 0) {
        let slab = Math.min(rem, 300000); // 12L to 15L
        tax += slab * 0.20;
        rem -= slab;
      }
      if (rem > 0) {
        tax += rem * 0.30; // Above 15L
      }
      
      if (tti <= 700000) {
        rebate = tax; 
      }
    }

    let netTax = tax - rebate;

    // Surcharge
    let surchargeRate = 0;
    if (tti > 50000000) surchargeRate = 0.25;
    else if (tti > 20000000) surchargeRate = 0.15;
    else if (tti > 10000000) surchargeRate = 0.15;
    else if (tti > 5000000) surchargeRate = 0.10;

    let surcharge = netTax * surchargeRate;
    let taxAndSurcharge = netTax + surcharge;
    let cess = taxAndSurcharge * 0.04;
    let finalTax = taxAndSurcharge + cess;

    setResults({
      gti,
      ded: ded_val,
      tti,
      tax,
      rebate,
      surcharge,
      taxsur: taxAndSurcharge,
      cess,
      final: finalTax,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="calc-modal" onClick={(e) => e.stopPropagation()}>
        <div className="calc-header">
          <h2 style={{ margin: 0 }}><span>🧮</span> FY 2026-27 Tax Calculator (ITA 2025)</h2>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>
        <div className="calc-body">
          <div className="calc-form">
            <div className="form-group" style={{ marginBottom: "8px" }}>
              <label>Financial Year (Assessment Year)</label>
              <select value={fy} onChange={(e) => setFy(e.target.value)} style={{ padding: "10px 14px", border: "1px solid var(--border)", borderRadius: "8px", fontFamily: "inherit", fontSize: "15px" }}>
                <option value="2627">FY 2026-27 (AY 2027-28) - ITA 2025</option>
                <option value="2526">FY 2025-26 (AY 2026-27) - ITA 1961 (New Regime)</option>
              </select>
            </div>
            <span className="calc-section-title">Heads of Income (₹)</span>
            <div className="form-group">
              <label>1. Income from Salaries (Net of Std. Deduction)</label>
              <input type="number" placeholder="0" min="0" value={salary} onChange={(e) => setSalary(e.target.value === "" ? "" : Number(e.target.value))} />
            </div>
            <div className="form-group">
              <label>2. Income from House Property (Net)</label>
              <input type="number" placeholder="0" value={hp} onChange={(e) => setHp(e.target.value === "" ? "" : Number(e.target.value))} />
            </div>
            <div className="form-group">
              <label>3. Profits & Gains of Business/Profession</label>
              <input type="number" placeholder="0" min="0" value={pgbp} onChange={(e) => setPgbp(e.target.value === "" ? "" : Number(e.target.value))} />
            </div>
            <div className="form-group">
              <label>4. Capital Gains (Net Taxable)</label>
              <input type="number" placeholder="0" min="0" value={cg} onChange={(e) => setCg(e.target.value === "" ? "" : Number(e.target.value))} />
            </div>
            <div className="form-group">
              <label>5. Income from Other Sources</label>
              <input type="number" placeholder="0" min="0" value={ios} onChange={(e) => setIos(e.target.value === "" ? "" : Number(e.target.value))} />
            </div>
            <span className="calc-section-title" style={{ marginTop: "16px" }}>Deductions (₹)</span>
            <div className="form-group">
              <label>Chapter VI-A Deductions (80C, 80D, etc.)</label>
              <input type="number" placeholder="0" min="0" value={ded} onChange={(e) => setDed(e.target.value === "" ? "" : Number(e.target.value))} />
            </div>
          </div>
          <div className="calc-result">
            <h3 style={{ color: "var(--navy)", marginBottom: "8px" }}>Computation Summary</h3>
            <div className="res-row"><span>Gross Total Income (GTI):</span> <span className="res-val">{formatRs(results.gti)}</span></div>
            <div className="res-row"><span>Less: Chapter VI-A Deductions:</span> <span className="res-val">{formatRs(results.ded)}</span></div>
            <div className="res-row highlight"><span>Total Taxable Income:</span> <span className="res-val">{formatRs(results.tti)}</span></div>
            
            <h3 style={{ color: "var(--navy)", marginBottom: "8px", marginTop: "12px" }}>Tax Liability</h3>
            <div className="res-row"><span>Tax on Total Income:</span> <span className="res-val">{formatRs(results.tax)}</span></div>
            <div className="res-row"><span>Less: Rebate u/s 87A:</span> <span className="res-val">{formatRs(results.rebate)}</span></div>
            <div className="res-row"><span>Add: Surcharge:</span> <span className="res-val">{formatRs(results.surcharge)}</span></div>
            <div className="res-row"><span>Tax + Surcharge:</span> <span className="res-val">{formatRs(results.taxsur)}</span></div>
            <div className="res-row"><span>Add: H&E Cess @ 4%:</span> <span className="res-val">{formatRs(results.cess)}</span></div>
            <div className="res-row highlight" style={{ color: "var(--green)" }}><span>Final Tax Payable:</span> <span className="res-val">{formatRs(results.final)}</span></div>
            
            <button className="calc-action" onClick={computeTax}>Compute Tax</button>
          </div>
        </div>
      </div>
    </div>
  );
}
