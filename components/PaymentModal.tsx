"use client";
import React, { useState } from "react";
import { useAuth } from "./AuthProvider";

export default function PaymentModal({ onClose }: { onClose: () => void }) {
  const { user, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);

  const handlePay = () => {
    setLoading(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => {
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "YOUR_RAZORPAY_KEY",
        amount: 250000, // ₹2500 in paise
        currency: "INR",
        name: "BigReddyFinTaxPro",
        description: "Professional Plan",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        handler: async function (response: any) {
          try {
            const { httpsCallable } = await import("firebase/functions");
            const { functionsInstance } = await import("../lib/firebase");
            const verifyFn = httpsCallable(functionsInstance, 'verifyPayment');
            const res = await verifyFn({ planId: 'professional', paymentId: response.razorpay_payment_id });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if ((res.data as any).success) {
              await refreshProfile();
              onClose();
            } else {
              alert("Payment verification failed");
              setLoading(false);
            }
          } catch(e) {
            console.error(e);
            alert("Error verifying payment");
            setLoading(false);
          }
        },
        prefill: {
          email: user?.email || "",
        },
        theme: {
          color: "#3949ab",
        },
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function () {
          setLoading(false);
      });
      rzp.open();
    };
    document.body.appendChild(script);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "var(--surface)", padding: "30px", borderRadius: "16px", maxWidth: "400px", width: "100%", border: "1px solid var(--border)" }}>
        <h2 style={{ color: "var(--text)", marginBottom: "16px", fontSize: "24px", fontWeight: "bold" }}>Upgrade to Professional</h2>
        <p style={{ color: "var(--text-muted)", marginBottom: "24px", lineHeight: "1.5" }}>You have exhausted your free trials. Upgrade to unlock unlimited AI queries, full ITA 2025 comparison, and premium support.</p>
        
        <div style={{ fontSize: "36px", fontWeight: "bold", color: "var(--navy)", marginBottom: "24px" }}>₹2,500 <span style={{ fontSize: "16px", color: "var(--text-muted)", fontWeight: "normal" }}>/mo</span></div>
        
        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
          <button onClick={onClose} disabled={loading} style={{ padding: "10px 16px", borderRadius: "8px", border: "1px solid var(--border)", background: "transparent", color: "var(--text)", cursor: "pointer" }}>Cancel</button>
          <button onClick={handlePay} disabled={loading} style={{ padding: "10px 16px", borderRadius: "8px", border: "none", background: "linear-gradient(135deg, var(--saffron), var(--saffron-dark))", color: "white", fontWeight: "bold", cursor: "pointer" }}>
            {loading ? "Processing..." : "Pay via Razorpay"}
          </button>
        </div>
      </div>
    </div>
  );
}
