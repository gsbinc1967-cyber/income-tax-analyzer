"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "./AuthProvider";
import { getPricingByPlanId, generateTransactionId } from "@/lib/googlepay";
import UPIQRPayment from "./UPIQRPayment";

interface PaymentModalProps {
  onClose: () => void;
  planId?: string;
}

export default function PaymentModal({ onClose, planId = 'professional' }: PaymentModalProps) {
  const { user, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [googlePayReady, setGooglePayReady] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const pricing = getPricingByPlanId(planId);

  useEffect(() => {
    loadGooglePayScript();
  }, []);

  const loadGooglePayScript = () => {
    const script = document.createElement("script");
    script.src = "https://pay.google.com/gstatic/js/integration/web/api/pi.js";
    script.async = true;
    script.onload = () => {
      initializeGooglePay();
    };
    document.head.appendChild(script);
  };

  const initializeGooglePay = async () => {
    try {
      const googlePayClient = new (window as any).google.payments.api.PaymentsClient({
        environment: process.env.NODE_ENV === 'production' ? 'PRODUCTION' : 'TEST',
      });

      const isReady = await googlePayClient.isReadyToPay({
        apiVersion: 2,
        apiVersionMinor: 0,
        allowedPaymentMethods: [
          {
            type: 'CARD',
            parameters: {
              allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
              allowedCardNetworks: ['VISA', 'MASTERCARD', 'AMEX', 'RUPAY'],
            },
          },
          {
            type: 'UPI',
            parameters: {},
          },
        ],
      });

      if (isReady) {
        setGooglePayReady(true);
      }
    } catch (err) {
      console.error('Google Pay initialization error:', err);
      setError('Google Pay is not available. Please refresh and try again.');
    }
  };

  const handleGooglePayClick = async () => {
    if (!googlePayReady) {
      setError('Google Pay is not ready. Please refresh the page.');
      return;
    }

    setLoading(true);
    setError("");

    try {
      const pricing = getPricingByPlanId(planId);
      const transactionId = generateTransactionId(user?.uid || 'unknown');

      const paymentDataRequest = {
        apiVersion: 2,
        apiVersionMinor: 0,
        allowedPaymentMethods: [
          {
            type: 'CARD',
            parameters: {
              allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
              allowedCardNetworks: ['VISA', 'MASTERCARD', 'AMEX', 'RUPAY'],
            },
            tokenizationSpecification: {
              type: 'PAYMENT_GATEWAY',
              parameters: {
                gateway: 'upi',
              },
            },
          },
          {
            type: 'UPI',
            parameters: {
              payeeAddress: process.env.NEXT_PUBLIC_UPI_ID || 'merchant@upi',
            },
          },
        ],
        merchantInfo: {
          merchantName: 'BigReddy Income Tax Pro',
        },
        transactionInfo: {
          totalPriceStatus: 'FINAL',
          totalPrice: pricing.priceInRupees.toString(),
          currency: 'INR',
          transactionId: transactionId,
        },
        callbackIntents: ['PAYMENT_AUTHORIZATION'],
      };

      const googlePayClient = new (window as any).google.payments.api.PaymentsClient({
        environment: process.env.NODE_ENV === 'production' ? 'PRODUCTION' : 'TEST',
      });

      const paymentData = await googlePayClient.loadPaymentData(paymentDataRequest);

      // Verify payment with backend
      const token = await user?.getIdToken();
      const response = await fetch('/api/googlepay/verify-payment', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentData: JSON.stringify(paymentData),
          planId,
          transactionId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Payment verification failed');
      }

      const result = await response.json();
      if (result.success) {
        await refreshProfile();
        onClose();
      } else {
        setError(result.error || 'Payment verification failed');
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "var(--surface)", padding: "30px", borderRadius: "16px", maxWidth: "450px", width: "100%", border: "1px solid var(--border)" }}>
        <h2 style={{ color: "var(--text)", marginBottom: "16px", fontSize: "24px", fontWeight: "bold" }}>Upgrade Your Plan</h2>
        <p style={{ color: "var(--text-muted)", marginBottom: "24px", lineHeight: "1.5" }}>You've used your 3 free chats! Upgrade to continue analyzing Indian income tax with unlimited queries, advanced features, and priority support.</p>

        <div style={{ fontSize: "36px", fontWeight: "bold", color: "var(--navy)", marginBottom: "24px" }}>₹{pricing.priceInRupees} <span style={{ fontSize: "16px", color: "var(--text-muted)", fontWeight: "normal" }}>/month</span></div>
        <div style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "24px" }}>{pricing.name} Plan • {pricing.monthlyQuota === 10000 ? 'Unlimited' : `${pricing.monthlyQuota}`} chats/month</div>

        {error && (
          <div style={{ background: "#fee", border: "1px solid #fcc", color: "#c33", padding: "12px", borderRadius: "8px", marginBottom: "16px", fontSize: "14px" }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: "20px" }}>
          <div style={{ marginBottom: "12px", padding: "12px", background: "linear-gradient(135deg, rgba(51, 187, 255, 0.15), rgba(33, 150, 243, 0.1))", borderRadius: "8px", border: "2px solid rgba(51, 187, 255, 0.5)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
              <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                💳 <strong>Secure payment via Google Pay</strong> — Supports UPI, Cards, Wallets
              </div>
              <div style={{ background: "linear-gradient(135deg, #33bbff, #2196f3)", color: "white", padding: "2px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "bold" }}>
                ✓ RECOMMENDED
              </div>
            </div>
          </div>

          <button
            onClick={handleGooglePayClick}
            disabled={loading || !googlePayReady}
            style={{
              width: "100%",
              padding: "16px 16px",
              borderRadius: "10px",
              border: "none",
              background: loading || !googlePayReady ? "var(--border)" : "linear-gradient(135deg, #2196f3, #1976d2)",
              color: "white",
              fontWeight: "bold",
              cursor: loading || !googlePayReady ? "not-allowed" : "pointer",
              fontSize: "16px",
              marginBottom: "16px",
              boxShadow: loading || !googlePayReady ? "none" : "0 4px 12px rgba(33, 150, 243, 0.3)",
              transition: "all 0.2s",
            }}
          >
            {loading ? "Processing Payment..." : googlePayReady ? "🚀 Pay Now with Google Pay" : "Loading..."}
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "12px 0" }}>
            <div style={{ flex: 1, height: "1px", background: "var(--border)" }}></div>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>or</span>
            <div style={{ flex: 1, height: "1px", background: "var(--border)" }}></div>
          </div>

          <div style={{ padding: "12px", background: "rgba(76, 175, 80, 0.1)", borderRadius: "8px", border: "1px solid rgba(76, 175, 80, 0.3)", marginBottom: "12px" }}>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              🔗 <strong>Scan QR Code</strong> — Use Google Pay, PhonePe, or any UPI app
            </div>
          </div>

          <button
            onClick={() => setShowQRCode(true)}
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: "8px",
              border: "1px solid rgba(76, 175, 80, 0.5)",
              background: "rgba(76, 175, 80, 0.1)",
              color: "var(--text)",
              fontWeight: "bold",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Generate QR Code
          </button>
        </div>

        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
          <button onClick={onClose} disabled={loading} style={{ padding: "10px 16px", borderRadius: "8px", border: "1px solid var(--border)", background: "transparent", color: "var(--text)", cursor: "pointer" }}>Cancel</button>
        </div>

        {/* UPI QR Code Modal */}
        {showQRCode && (
          <UPIQRPayment
            amount={pricing.priceInRupees}
            planName={pricing.name}
            onPaymentDone={async () => {
              await refreshProfile();
            }}
            onClose={() => {
              setShowQRCode(false);
              onClose();
            }}
          />
        )}
      </div>
    </div>
  );
}
