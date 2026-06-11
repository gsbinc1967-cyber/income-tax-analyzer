"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

interface AnalyticsData {
  summary: {
    totalUsers: number;
    totalMonthlyRevenue: number;
    totalMonthlyApiCost: number;
    profit: number;
    profitMargin: string;
  };
  userBreakdown: {
    free: number;
    professional: number;
    ca: number;
  };
  usageDistribution: Record<string, number>;
  users: Array<{
    userId: string;
    email: string;
    plan: string;
    usage: number;
    percentageUsed: number;
    nearLimit: boolean;
  }>;
  topUsers: Array<any>;
  atRiskUsers: Array<any>;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTab, setSelectedTab] = useState<"summary" | "users" | "atrisk">("summary");

  useEffect(() => {
    if (user && !loading) {
      loadAnalytics();
    }
  }, [user, loading]);

  const loadAnalytics = async () => {
    if (!user) return;
    try {
      setDataLoading(true);
      const token = await user.getIdToken();
      const response = await fetch("/api/admin/analytics", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 403) {
        setError("Admin access required");
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
        setError("");
      } else {
        setError("Failed to load analytics");
      }
    } catch (err: any) {
      console.error("Analytics error:", err);
      setError("Failed to load analytics");
    } finally {
      setDataLoading(false);
    }
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

  if (error === "Admin access required") {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", flexDirection: "column" }}>
        <div style={{ textAlign: "center", fontSize: "18px", color: "#d32f2f" }}>
          🔒 Admin access required
        </div>
        <button
          onClick={() => router.push("/")}
          style={{
            marginTop: "16px",
            padding: "10px 20px",
            background: "var(--navy)",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          Back to Chat
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", padding: "40px 20px" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
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
            📊 Usage Analytics
          </h1>
          <p style={{ fontSize: "16px", color: "var(--text-muted)", margin: 0 }}>
            Monitor user activity, costs, and revenue
          </p>
          <button
            onClick={loadAnalytics}
            style={{
              marginTop: "16px",
              padding: "8px 16px",
              background: "var(--navy)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            🔄 Refresh Data
          </button>
        </div>

        {error && (
          <div
            style={{
              background: "rgba(244, 67, 54, 0.1)",
              border: "1px solid #f44336",
              borderRadius: "8px",
              padding: "12px 16px",
              marginBottom: "20px",
              color: "#d32f2f",
            }}
          >
            {error}
          </div>
        )}

        {dataLoading ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)" }}>
            Loading analytics...
          </div>
        ) : analytics ? (
          <>
            {/* Summary Cards */}
            {selectedTab === "summary" && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px", marginBottom: "40px" }}>
                  {/* Total Users */}
                  <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "24px" }}>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "8px" }}>
                      Total Users
                    </div>
                    <div style={{ fontSize: "32px", fontWeight: 700, color: "var(--navy)" }}>
                      {analytics.summary.totalUsers}
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "12px" }}>
                      📈 Free: {analytics.userBreakdown.free} | Pro: {analytics.userBreakdown.professional} | CA: {analytics.userBreakdown.ca}
                    </div>
                  </div>

                  {/* Monthly Revenue */}
                  <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "24px" }}>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "8px" }}>
                      Monthly Revenue
                    </div>
                    <div style={{ fontSize: "32px", fontWeight: 700, color: "var(--saffron)" }}>
                      ₹{analytics.summary.totalMonthlyRevenue.toLocaleString()}
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "12px" }}>
                      From paid subscriptions
                    </div>
                  </div>

                  {/* API Cost */}
                  <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "24px" }}>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "8px" }}>
                      API Costs
                    </div>
                    <div style={{ fontSize: "32px", fontWeight: 700, color: "var(--navy)" }}>
                      ₹{analytics.summary.totalMonthlyApiCost.toLocaleString()}
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "12px" }}>
                      Estimated monthly spend
                    </div>
                  </div>

                  {/* Profit */}
                  <div
                    style={{
                      background: "var(--surface)",
                      border: "2px solid " + (analytics.summary.profit > 0 ? "#4caf50" : "#f44336"),
                      borderRadius: "12px",
                      padding: "24px",
                    }}
                  >
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "8px" }}>
                      Monthly Profit
                    </div>
                    <div style={{ fontSize: "32px", fontWeight: 700, color: analytics.summary.profit > 0 ? "#4caf50" : "#f44336" }}>
                      ₹{analytics.summary.profit.toLocaleString()}
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "12px" }}>
                      Margin: {analytics.summary.profitMargin}
                    </div>
                  </div>
                </div>

                {/* Usage Distribution */}
                <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "24px", marginBottom: "40px" }}>
                  <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--navy)", margin: "0 0 20px 0" }}>
                    Usage Distribution
                  </h2>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "16px" }}>
                    {Object.entries(analytics.usageDistribution).map(([range, count]) => (
                      <div key={range} style={{ textAlign: "center", padding: "16px", background: "var(--bg)", borderRadius: "8px" }}>
                        <div style={{ fontSize: "24px", fontWeight: 700, color: "var(--saffron)" }}>{count}</div>
                        <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "8px" }}>
                          {range} chats
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Tabs */}
            <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
              <button
                onClick={() => setSelectedTab("summary")}
                style={{
                  padding: "10px 16px",
                  background: selectedTab === "summary" ? "var(--navy)" : "var(--bg)",
                  color: selectedTab === "summary" ? "white" : "var(--text)",
                  border: selectedTab === "summary" ? "none" : "1px solid var(--border)",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                📊 Summary
              </button>
              <button
                onClick={() => setSelectedTab("users")}
                style={{
                  padding: "10px 16px",
                  background: selectedTab === "users" ? "var(--navy)" : "var(--bg)",
                  color: selectedTab === "users" ? "white" : "var(--text)",
                  border: selectedTab === "users" ? "none" : "1px solid var(--border)",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                👥 All Users
              </button>
              <button
                onClick={() => setSelectedTab("atrisk")}
                style={{
                  padding: "10px 16px",
                  background: selectedTab === "atrisk" ? "var(--navy)" : "var(--bg)",
                  color: selectedTab === "atrisk" ? "white" : "var(--text)",
                  border: selectedTab === "atrisk" ? "none" : "1px solid var(--border)",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                ⚠️ At Risk ({analytics.atRiskUsers.length})
              </button>
            </div>

            {/* All Users Table */}
            {selectedTab === "users" && (
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "24px", overflowX: "auto" }}>
                <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--navy)", margin: "0 0 16px 0" }}>
                  Top Users by Usage
                </h2>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      <th style={{ textAlign: "left", padding: "12px", fontWeight: 600, color: "var(--text-muted)" }}>Email</th>
                      <th style={{ textAlign: "center", padding: "12px", fontWeight: 600, color: "var(--text-muted)" }}>Plan</th>
                      <th style={{ textAlign: "center", padding: "12px", fontWeight: 600, color: "var(--text-muted)" }}>Usage</th>
                      <th style={{ textAlign: "center", padding: "12px", fontWeight: 600, color: "var(--text-muted)" }}>% Used</th>
                      <th style={{ textAlign: "center", padding: "12px", fontWeight: 600, color: "var(--text-muted)" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.users.slice(0, 20).map((user, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: "12px", color: "var(--text)" }}>{user.email}</td>
                        <td style={{ padding: "12px", textAlign: "center", color: "var(--text)" }}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "4px 8px",
                              borderRadius: "4px",
                              background:
                                user.plan === "free" ? "rgba(100,100,100,0.2)" : user.plan === "professional" ? "rgba(33,150,243,0.2)" : "rgba(76,175,80,0.2)",
                              color:
                                user.plan === "free" ? "#999" : user.plan === "professional" ? "#2196f3" : "#4caf50",
                              fontSize: "11px",
                              fontWeight: 600,
                              textTransform: "capitalize",
                            }}
                          >
                            {user.plan}
                          </span>
                        </td>
                        <td style={{ padding: "12px", textAlign: "center", color: "var(--text)", fontWeight: 600 }}>
                          {user.usage}
                        </td>
                        <td style={{ padding: "12px", textAlign: "center", color: "var(--text)" }}>
                          {user.percentageUsed}%
                        </td>
                        <td style={{ padding: "12px", textAlign: "center", color: user.nearLimit ? "#f44336" : "#4caf50" }}>
                          {user.nearLimit ? "⚠️ Near Limit" : "✓ OK"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* At Risk Users */}
            {selectedTab === "atrisk" && (
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "24px", overflowX: "auto" }}>
                <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--navy)", margin: "0 0 16px 0" }}>
                  Users Near Monthly Limit
                </h2>
                {analytics.atRiskUsers.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                    No users near their limit
                  </div>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border)" }}>
                        <th style={{ textAlign: "left", padding: "12px", fontWeight: 600, color: "var(--text-muted)" }}>Email</th>
                        <th style={{ textAlign: "center", padding: "12px", fontWeight: 600, color: "var(--text-muted)" }}>Plan</th>
                        <th style={{ textAlign: "center", padding: "12px", fontWeight: 600, color: "var(--text-muted)" }}>Usage</th>
                        <th style={{ textAlign: "center", padding: "12px", fontWeight: 600, color: "var(--text-muted)" }}>% Used</th>
                        <th style={{ textAlign: "center", padding: "12px", fontWeight: 600, color: "var(--text-muted)" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.atRiskUsers.map((user, idx) => (
                        <tr key={idx} style={{ borderBottom: "1px solid var(--border)", background: "rgba(244,67,54,0.05)" }}>
                          <td style={{ padding: "12px", color: "var(--text)" }}>{user.email}</td>
                          <td style={{ padding: "12px", textAlign: "center", color: "var(--text)" }}>{user.plan}</td>
                          <td style={{ padding: "12px", textAlign: "center", color: "var(--text)", fontWeight: 600 }}>
                            {user.usage}
                          </td>
                          <td style={{ padding: "12px", textAlign: "center", color: "#f44336", fontWeight: 600 }}>
                            {user.percentageUsed}%
                          </td>
                          <td style={{ padding: "12px", textAlign: "center", color: "var(--text-muted)", fontSize: "12px" }}>
                            Consider upgrade suggestion
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
