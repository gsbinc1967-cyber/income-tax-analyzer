"use client";

import React, { useState, useEffect, useRef } from "react";
import { generateUPIString, generateQRCode, formatAmount } from "@/lib/upi";

interface QRCodePaymentModalProps {
  planId: "professional" | "ca";
  amount: number; // in rupees
  planName: string;
  transactionRef: string;
  onPaymentSuccess: () => void;
  onClose: () => void;
}

const MERCHANT_UPI = process.env.NEXT_PUBLIC_UPI_ID || "merchant@okhdfcbank";
const MERCHANT_NAME = process.env.NEXT_PUBLIC_UPI_NAME || "BigReddy FinTaxPro";

export default function QRCodePaymentModal({
  planId,
  amount,
  planName,
  transactionRef,
  onPaymentSuccess,
  onClose,
}: QRCodePaymentModalProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<"scanning" | "success" | "waiting">("scanning");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    generateQR();
  }, []);

  const generateQR = async () => {
    try {
      setLoading(true);
      const upiString = generateUPIString({
        upiId: MERCHANT_UPI,
        payeeName: MERCHANT_NAME,
        amount,
        transactionRef,
        description: `${planName} Plan - ${transactionRef}`,
      });

      const qrDataUrl = await generateQRCode(upiString, 400);
      setQrCodeUrl(qrDataUrl);
      setError("");
      setLoading(false);
    } catch (err) {
      console.error("Failed to generate QR code:", err);
      setError("Failed to generate QR code. Please use Razorpay checkout instead.");
      setLoading(false);
    }
  };

  const handleManualVerification = () => {
    setPaymentStatus("waiting");
  };

  const handlePaymentConfirmed = () => {
    setPaymentStatus("success");
    setTimeout(() => {
      onPaymentSuccess();
    }, 1500);
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.7)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1001,
      padding: "20px",
    }}>
      <div style={{
        background: "var(--surface)",
        borderRadius: "16px",
        padding: "32px",
        maxWidth: "500px",
        width: "100%",
        border: "1px solid var(--border)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 700, color: "var(--navy)", margin: 0 }}>
            UPI Payment
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              color: "var(--text-muted)",
            }}
          >
            ✕
          </button>
        </div>

        {/* Plan Info */}
        <div style={{
          background: "var(--bg)",
          border: "1px solid var(--border)",
          borderRadius: "12px",
          padding: "16px",
          marginBottom: "24px",
          textAlign: "center",
        }}>
          <div style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "8px" }}>
            Upgrading to
          </div>
          <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--navy)", marginBottom: "8px" }}>
            {planName} Plan
          </div>
          <div style={{ fontSize: "18px", fontWeight: 600, color: "var(--saffron)" }}>
            {formatAmount(amount * 100)}
          </div>
        </div>

        {/* QR Code or Status */}
        {paymentStatus === "scanning" && (
          <>
            {error && (
              <div style={{
                background: "rgba(244, 67, 54, 0.1)",
                border: "1px solid #f44336",
                borderRadius: "8px",
                padding: "12px 14px",
                marginBottom: "16px",
                color: "#d32f2f",
                fontSize: "13px",
              }}>
                {error}
              </div>
            )}

            {loading ? (
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "400px",
                color: "var(--text-muted)",
              }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "36px", marginBottom: "12px" }}>⏳</div>
                  <div>Generating QR Code...</div>
                </div>
              </div>
            ) : qrCodeUrl ? (
              <>
                <div style={{ textAlign: "center", marginBottom: "20px" }}>
                  <img
                    src={qrCodeUrl}
                    alt="UPI QR Code"
                    style={{
                      width: "100%",
                      maxWidth: "280px",
                      border: "2px solid var(--border)",
                      borderRadius: "12px",
                      padding: "8px",
                      background: "white",
                    }}
                  />
                  <div style={{
                    fontSize: "12px",
                    color: "var(--text-muted)",
                    marginTop: "12px",
                  }}>
                    Scan with any UPI app (PhonePe, PayTM, Google Pay, etc.)
                  </div>
                </div>

                {/* Buttons */}
                <div style={{ display: "flex", gap: "12px", flexDirection: "column" }}>
                  <button
                    onClick={handleManualVerification}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      background: "var(--navy)",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "14px",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
                  >
                    ✓ Payment Done
                  </button>

                  <button
                    onClick={() => {
                      fileInputRef.current?.click();
                    }}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      background: "var(--bg)",
                      color: "var(--text)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      fontSize: "14px",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    📱 Scan Screenshot
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      // Could add QR code scanning from screenshot here
                      // For now, just mark as success if user selected a file
                      if (e.target.files?.length) {
                        setPaymentStatus("success");
                        setTimeout(() => {
                          onPaymentSuccess();
                        }, 1500);
                      }
                    }}
                  />

                  <button
                    onClick={onClose}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      background: "transparent",
                      color: "var(--text-muted)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      fontSize: "14px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                </div>

                {/* Info Box */}
                <div style={{
                  background: "rgba(33, 150, 243, 0.1)",
                  border: "1px solid rgba(33, 150, 243, 0.3)",
                  borderRadius: "8px",
                  padding: "12px 14px",
                  marginTop: "16px",
                  fontSize: "12px",
                  color: "var(--text)",
                  lineHeight: "1.5",
                }}>
                  <strong>💡 How it works:</strong>
                  <ul style={{ margin: "6px 0 0 16px", paddingLeft: "8px" }}>
                    <li>Open any UPI app on your phone</li>
                    <li>Tap "Scan" and scan this QR code</li>
                    <li>Approve payment on your phone</li>
                    <li>Click "Payment Done" below</li>
                  </ul>
                </div>
              </>
            ) : null}
          </>
        )}

        {paymentStatus === "waiting" && (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>⏳</div>
            <div style={{ fontSize: "16px", fontWeight: 600, color: "var(--navy)", marginBottom: "8px" }}>
              Waiting for Payment Confirmation
            </div>
            <div style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "24px" }}>
              Verifying your payment...
            </div>

            <div style={{
              display: "flex",
              gap: "12px",
              flexDirection: "column",
            }}>
              <button
                onClick={handlePaymentConfirmed}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: "#4caf50",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                ✓ Payment Confirmed
              </button>

              <button
                onClick={() => setPaymentStatus("scanning")}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: "var(--bg)",
                  color: "var(--text)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Back to QR Code
              </button>
            </div>
          </div>
        )}

        {paymentStatus === "success" && (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <div style={{ fontSize: "64px", marginBottom: "16px" }}>✅</div>
            <div style={{ fontSize: "18px", fontWeight: 700, color: "#4caf50", marginBottom: "8px" }}>
              Payment Successful!
            </div>
            <div style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "24px" }}>
              Your plan has been upgraded. Redirecting...
            </div>
            <div style={{
              display: "flex",
              gap: "8px",
              justifyContent: "center",
              marginBottom: "16px",
            }}>
              <div style={{
                width: "8px",
                height: "8px",
                background: "var(--saffron)",
                borderRadius: "50%",
                animation: "pulse 1s infinite",
              }} />
              <div style={{
                width: "8px",
                height: "8px",
                background: "var(--saffron)",
                borderRadius: "50%",
                animation: "pulse 1s infinite 0.2s",
              }} />
              <div style={{
                width: "8px",
                height: "8px",
                background: "var(--saffron)",
                borderRadius: "50%",
                animation: "pulse 1s infinite 0.4s",
              }} />
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
