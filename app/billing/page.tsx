"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { getUsageStats } from "@/lib/usage";
import PaymentModal from "@/components/PaymentModal";

type PlanType = "free" | "student" | "professional" | "ca";

const PLANS: Record<PlanType, { name: string; price: number; quota: number; features: string[] }> = {
  free: {
    name: "Free",
    price: 0,
    quota: 3,
    features: ["3 free chats total", "Basic tax analysis", "Perfect to try"],
  },
  student: {
    name: "Student",
    price: 299,
    quota: 100,
    features: ["100 chats/month", "Student-focused features", "Full tax analysis", "Priority support"],
  },
  professional: {
    name: "Professional",
    price: 999,
    quota: 250,
    features: ["250 chats/month", "Advanced tax planning", "Full access to tools", "Priority support", "Analytics"],
  },
  ca: {
    name: "Tax Professional/CA",
    price: 2000,
    quota: 500,
    features: ["500 chats/month", "Full suite access", "API access", "Dedicated support", "Custom integrations", "Premium analytics"],
  },
};

export default function BillingPage() {
  const router = useRouter();
  const { user, loading, profile, refreshProfile } = useAuth();
  const [usageStats, setUsageStats] = useState<any>(null);
  const [processingPlan, setProcessingPlan] = useState<PlanType | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentPlan, setPaymentPlan] = useState<PlanType | null>(null);

  useEffect(() => {
    if (user && !loading) {
      loadUsageStats();
    }
  }, [user, loading]);

  const loadUsageStats = async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/usage/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const stats = await response.json();
        setUsageStats(stats);
      }
    } catch (err) {
      console.error("Failed to load usage stats:", err);
    }
  };

  const handleUpgrade = async (planId: PlanType) => {
    if (planId === "free") {
      setError("Cannot upgrade to free plan");
      return;
    }

    if (profile?.planId === planId) {
      setError("You are already on this plan");
      return;
    }

    setError("");
    setSuccess("");
    setPaymentPlan(planId);
    setShowPaymentModal(true);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!user) {
    router.push("/auth/login");
    return null;
  }

  const currentPlan = (profile?.planId || "free") as PlanType;
  const planData = PLANS[currentPlan];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", padding: "40px 20px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "40px" }}>
          <button
            onClick={() => router.push("/")}
            style={{
              background: "none",
              border: "none",
              color: "var(--navy)",
              cursor: "pointer",
              fontSize: "14px",
              marginBottom: "16px",
              textDecoration: "underline",
            }}
          >
            ← Back to Chat
          </button>
          <h1 style={{ fontSize: "32px", fontWeight: 700, color: "var(--navy)", margin: "0 0 8px 0" }}>
            Billing & Plans
          </h1>
          <p style={{ fontSize: "16px", color: "var(--text-muted)", margin: 0 }}>
            Manage your subscription and monitor usage
          </p>
        </div>

        {/* Google Pay Info */}
        <div style={{ marginBottom: "24px", padding: "16px", background: "linear-gradient(135deg, rgba(51,187,255,0.1), rgba(33,150,243,0.05))", border: "1px solid rgba(51,187,255,0.3)", borderRadius: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ fontSize: "28px" }}>🔗</div>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>Google Pay Checkout</div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                ✓ Safe, fast, and secure • UPI, Cards, Google Pay, Wallets • ₹1-2% fee
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div
            style={{
              background: "rgba(244, 67, 54, 0.1)",
              border: "1px solid #f44336",
              borderRadius: "8px",
              padding: "12px 16px",
              marginBottom: "20px",
              color: "#d32f2f",
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        )}
        {success && (
          <div
            style={{
              background: "rgba(76, 175, 80, 0.1)",
              border: "1px solid #4caf50",
              borderRadius: "8px",
              padding: "12px 16px",
              marginBottom: "20px",
              color: "#2e7d32",
              fontSize: "14px",
            }}
          >
            {success}
          </div>
        )}

        {/* Current Plan & Usage */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            padding: "24px",
            marginBottom: "40px",
          }}
        >
          <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--navy)", margin: "0 0 20px 0" }}>
            Current Plan
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
            <div>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>
                Plan
              </div>
              <div style={{ fontSize: "24px", fontWeight: 700, color: "var(--navy)", marginTop: "4px" }}>
                {planData.name}
              </div>
              {planData.price > 0 && (
                <div style={{ fontSize: "16px", color: "var(--saffron)", fontWeight: 600, marginTop: "8px" }}>
                  ₹{planData.price}/month
                </div>
              )}
            </div>

            {usageStats && (
              <div>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>
                  Usage This Month
                </div>
                <div style={{ marginTop: "8px" }}>
                  <div style={{ fontSize: "24px", fontWeight: 700, color: "var(--navy)" }}>
                    {usageStats.currentUsage} / {usageStats.monthlyLimit}
                  </div>
                  <div
                    style={{
                      width: "100%",
                      height: "8px",
                      background: "var(--border)",
                      borderRadius: "4px",
                      marginTop: "8px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${Math.min(100, (usageStats.currentUsage / usageStats.monthlyLimit) * 100)}%`,
                        background: usageStats.percentageUsed > 90 ? "#f44336" : "var(--saffron)",
                        transition: "width 0.3s",
                      }}
                    />
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "6px" }}>
                    {usageStats.percentageUsed}% used
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Plans */}
        <div>
          <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--navy)", margin: "0 0 20px 0" }}>
            All Plans
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
            {Object.entries(PLANS).map(([planId, plan]) => (
              <div
                key={planId}
                style={{
                  background: "var(--surface)",
                  border: currentPlan === planId ? "2px solid var(--saffron)" : "1px solid var(--border)",
                  borderRadius: "12px",
                  padding: "24px",
                  position: "relative",
                  boxShadow: currentPlan === planId ? "0 4px 12px rgba(255,153,51,0.2)" : "none",
                }}
              >
                {currentPlan === planId && (
                  <div
                    style={{
                      position: "absolute",
                      top: "12px",
                      right: "12px",
                      background: "var(--saffron)",
                      color: "white",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontWeight: 600,
                    }}
                  >
                    Current
                  </div>
                )}

                <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--navy)", margin: "0 0 12px 0" }}>
                  {plan.name}
                </h3>

                <div style={{ marginBottom: "20px" }}>
                  {plan.price > 0 ? (
                    <>
                      <div style={{ fontSize: "28px", fontWeight: 700, color: "var(--navy)" }}>
                        ₹{plan.price}
                      </div>
                      <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>/month</div>
                    </>
                  ) : (
                    <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--navy)" }}>Free</div>
                  )}
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--saffron)", marginBottom: "8px" }}>
                    {plan.quota === 10000 ? "Unlimited" : `${plan.quota} requests/month`}
                  </div>
                </div>

                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px 0" }}>
                  {plan.features.map((feature, idx) => (
                    <li
                      key={idx}
                      style={{
                        fontSize: "13px",
                        color: "var(--text)",
                        padding: "6px 0",
                        borderBottom: idx < plan.features.length - 1 ? "1px solid var(--border)" : "none",
                      }}
                    >
                      ✓ {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleUpgrade(planId as PlanType)}
                  disabled={currentPlan === planId || processingPlan === planId}
                  style={{
                    width: "100%",
                    padding: "10px 16px",
                    borderRadius: "8px",
                    border: "none",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: currentPlan === planId || processingPlan === planId ? "not-allowed" : "pointer",
                    background:
                      currentPlan === planId
                        ? "var(--border)"
                        : planId === "free"
                        ? "var(--text-muted)"
                        : "var(--navy)",
                    color: currentPlan === planId ? "var(--text-muted)" : "white",
                    opacity: processingPlan === planId ? 0.7 : 1,
                  }}
                >
                  {processingPlan === planId
                    ? "Processing..."
                    : currentPlan === planId
                    ? "Current Plan"
                    : planId === "free"
                    ? "Downgrade"
                    : "Upgrade"}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div
          style={{
            marginTop: "60px",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            padding: "24px",
          }}
        >
          <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--navy)", margin: "0 0 16px 0" }}>
            Frequently Asked Questions
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <h4 style={{ margin: "0 0 6px 0", fontSize: "14px", fontWeight: 600 }}>
                When does my monthly quota reset?
              </h4>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)" }}>
                Your quota resets on the 1st of every month at 12:00 AM IST.
              </p>
            </div>
            <div>
              <h4 style={{ margin: "0 0 6px 0", fontSize: "14px", fontWeight: 600 }}>
                Can I change plans anytime?
              </h4>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)" }}>
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </div>
            <div>
              <h4 style={{ margin: "0 0 6px 0", fontSize: "14px", fontWeight: 600 }}>
                Is there a refund policy?
              </h4>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)" }}>
                We offer a 7-day money-back guarantee if you're not satisfied with the service.
              </p>
            </div>
          </div>
        </div>

        {/* Google Pay Payment Modal */}
        {showPaymentModal && paymentPlan && (
          <PaymentModal
            planId={paymentPlan}
            onClose={() => {
              setShowPaymentModal(false);
              setPaymentPlan(null);
              refreshProfile();
              loadUsageStats();
            }}
          />
        )}
      </div>
    </div>
  );
}
