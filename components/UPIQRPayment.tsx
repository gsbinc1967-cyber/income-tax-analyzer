"use client";
import React, { useState, useEffect } from "react";
import { generateUPIQRCode, createPaymentRequest, getMerchantUPIConfig } from "@/lib/upi-qr";

interface UPIQRPaymentProps {
  amount: number;
  planName: string;
  onPaymentDone?: () => void;
  onClose: () => void;
}

export default function UPIQRPayment({ amount, planName, onPaymentDone, onClose }: UPIQRPaymentProps) {
  const [qrCode, setQRCode] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const config = getMerchantUPIConfig();

  useEffect(() => {
    generateQRCode();
  }, []);

  const generateQRCode = async () => {
    try {
      setLoading(true);
      setError("");

      // Create payment request
      const paymentRequest = createPaymentRequest(
        amount,
        `${planName} Plan Upgrade`,
        `TXN_${Date.now()}`
      );

      // Generate QR code
      const qr = await generateUPIQRCode(paymentRequest);
      setQRCode(qr);
    } catch (err: any) {
      console.error("QR generation error:", err);
      setError(err.message || "Failed to generate QR code");
    } finally {
      setLoading(false);
    }
  };

  const copyUPIId = () => {
    navigator.clipboard.writeText(config.upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "var(--surface)", padding: "30px", borderRadius: "16px", maxWidth: "450px", width: "100%", border: "1px solid var(--border)" }}>
        <h2 style={{ color: "var(--text)", marginBottom: "24px", fontSize: "24px", fontWeight: "bold", textAlign: "center" }}>
          Scan & Pay with Google Pay
        </h2>

        {error && (
          <div style={{ background: "#fee", border: "1px solid #fcc", color: "#c33", padding: "12px", borderRadius: "8px", marginBottom: "16px", fontSize: "14px" }}>
            {error}
          </div>
        )}

        {loading && (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <div style={{ fontSize: "14px", color: "var(--text-muted)" }}>Generating QR code...</div>
          </div>
        )}

        {!loading && qrCode && (
          <>
            {/* QR Code Display */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px", padding: "20px", background: "rgba(0,0,0,0.02)", borderRadius: "12px" }}>
              <img src={qrCode} alt="UPI QR Code" style={{ width: "280px", height: "280px" }} />
            </div>

            {/* Payment Details */}
            <div style={{ background: "rgba(51,187,255,0.1)", border: "1px solid rgba(51,187,255,0.3)", borderRadius: "8px", padding: "16px", marginBottom: "20px" }}>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "8px" }}>PAYMENT DETAILS</div>
              <div style={{ display: "grid", gap: "8px", fontSize: "13px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>Plan:</span>
                  <span style={{ fontWeight: 600 }}>{planName}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>Amount:</span>
                  <span style={{ fontWeight: 600, color: "var(--saffron)" }}>₹{amount}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>Payee:</span>
                  <span style={{ fontWeight: 600, fontSize: "12px" }}>{config.upiId}</span>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "8px", padding: "16px", marginBottom: "20px" }}>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "8px" }}>HOW TO PAY</div>
              <ol style={{ margin: 0, paddingLeft: "20px", fontSize: "13px", color: "var(--text)", lineHeight: "1.6" }}>
                <li>Open Google Pay, PhonePe, or any UPI app</li>
                <li>Tap "Scan" or "Send Money"</li>
                <li>Scan the QR code above</li>
                <li>Verify the amount (₹{amount})</li>
                <li>Enter your PIN and confirm</li>
                <li>Payment complete!</li>
              </ol>
            </div>

            {/* Manual Entry Option */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", background: "rgba(255,193,7,0.1)", borderRadius: "8px", marginBottom: "20px" }}>
              <div style={{ fontSize: "14px", color: "var(--text)" }}>
                <strong>Manual Entry:</strong> {config.upiId} • Amount: ₹{amount}
              </div>
              <button
                onClick={copyUPIId}
                style={{
                  padding: "6px 12px",
                  borderRadius: "4px",
                  border: "1px solid rgba(255,193,7,0.5)",
                  background: "rgba(255,193,7,0.1)",
                  color: "var(--text)",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                {copied ? "✓ Copied" : "Copy"}
              </button>
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  background: "transparent",
                  color: "var(--text)",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                Close
              </button>
              <button
                onClick={() => {
                  onPaymentDone?.();
                  onClose();
                }}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  borderRadius: "8px",
                  border: "none",
                  background: "linear-gradient(135deg, var(--saffron), var(--saffron-dark))",
                  color: "white",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                ✓ Payment Done
              </button>
            </div>

            {/* Help Text */}
            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "16px", padding: "12px", background: "rgba(0,0,0,0.02)", borderRadius: "6px", textAlign: "center" }}>
              After scanning and paying, click "Payment Done" to confirm your upgrade.
            </div>
          </>
        )}
      </div>
    </div>
  );
}
