"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

interface UsageLog {
  timestamp: string;
  model: string;
  endpoint: string;
  inputTokens: number;
  outputTokens: number;
  costInPaise: number;
}

interface UsageStats {
  currentUsage: number;
  monthlyLimit: number;
  percentageUsed: number;
  planId: string;
  currentMonth: number;
  totalCost: number;
  averageCostPerRequest: number;
  usageLogs: UsageLog[];
  modelBreakdown: Record<string, { count: number; tokens: number; cost: number }>;
  dailyUsage: Record<string, number>;
}

const PRICING_PER_TOKEN = {
  "claude-opus-4-7": { input: 0.00003, output: 0.00015 },
  "claude-sonnet-4-6": { input: 0.000003, output: 0.000015 },
};

export default function UsagePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeRange, setTimeRange] = useState<"week" | "month" | "all">("month");

  useEffect(() => {
    if (user && !loading) {
      loadUsageData();
    }
  }, [user, loading, timeRange]);

  const loadUsageData = async () => {
    if (!user) return;
    try {
      setDataLoading(true);
      const token = await user.getIdToken();
      const response = await fetch(`/api/usage/detailed?range=${timeRange}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const stats = await response.json();
        setUsageStats(stats);
        setError("");
      } else {
        setError("Failed to load usage data");
      }
    } catch (err) {
      console.error("Failed to load usage data:", err);
      setError("Failed to load usage data");
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
            Usage Analytics
          </h1>
          <p style={{ fontSize: "16px", color: "var(--text-muted)", margin: 0 }}>
            Track your API usage, costs, and trends
          </p>
        </div>

        {/* Time Range Filter */}
        <div style={{ marginBottom: "24px", display: "flex", gap: "12px" }}>
          {(["week", "month", "all"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: timeRange === range ? "2px solid var(--navy)" : "1px solid var(--border)",
                background: timeRange === range ? "var(--navy)" : "var(--surface)",
                color: timeRange === range ? "white" : "var(--text)",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              {range === "week" ? "Last 7 Days" : range === "month" ? "This Month" : "All Time"}
            </button>
          ))}
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
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        )}

        {dataLoading ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)" }}>
            Loading usage data...
          </div>
        ) : usageStats ? (
          <>
            {/* Top Metrics */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px", marginBottom: "40px" }}>
              {/* Usage Requests */}
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "24px" }}>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "8px" }}>
                  Requests This Month
                </div>
                <div style={{ fontSize: "32px", fontWeight: 700, color: "var(--navy)", marginBottom: "12px" }}>
                  {usageStats.currentUsage}
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  {usageStats.monthlyLimit > 10000 ? "Unlimited" : `of ${usageStats.monthlyLimit} requests`}
                </div>
                <div
                  style={{
                    width: "100%",
                    height: "6px",
                    background: "var(--border)",
                    borderRadius: "3px",
                    marginTop: "12px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${Math.min(100, (usageStats.currentUsage / usageStats.monthlyLimit) * 100)}%`,
                      background: usageStats.percentageUsed > 90 ? "#f44336" : "var(--saffron)",
                    }}
                  />
                </div>
              </div>

              {/* Total Cost */}
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "24px" }}>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "8px" }}>
                  Total Cost This Month
                </div>
                <div style={{ fontSize: "32px", fontWeight: 700, color: "var(--saffron)", marginBottom: "12px" }}>
                  ₹{(usageStats.totalCost / 100).toFixed(2)}
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  Based on API token usage
                </div>
              </div>

              {/* Average Cost Per Request */}
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "24px" }}>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "8px" }}>
                  Avg Cost Per Request
                </div>
                <div style={{ fontSize: "32px", fontWeight: 700, color: "var(--navy)", marginBottom: "12px" }}>
                  ₹{(usageStats.averageCostPerRequest / 100).toFixed(2)}
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  Based on {usageStats.currentUsage} requests
                </div>
              </div>

              {/* Estimated Monthly Cost */}
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "24px" }}>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "8px" }}>
                  Plan Cost
                </div>
                <div style={{ fontSize: "32px", fontWeight: 700, color: "var(--navy)", marginBottom: "12px" }}>
                  {usageStats.planId === "free" ? "₹0" : usageStats.planId === "professional" ? "₹299" : "₹999"}
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  /month subscription
                </div>
              </div>
            </div>

            {/* Model Breakdown */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "24px", marginBottom: "40px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--navy)", margin: "0 0 16px 0" }}>
                Usage by Model
              </h2>
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "14px",
                  }}
                >
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      <th style={{ textAlign: "left", padding: "12px", fontWeight: 600, color: "var(--text-muted)" }}>Model</th>
                      <th style={{ textAlign: "center", padding: "12px", fontWeight: 600, color: "var(--text-muted)" }}>Requests</th>
                      <th style={{ textAlign: "center", padding: "12px", fontWeight: 600, color: "var(--text-muted)" }}>Tokens</th>
                      <th style={{ textAlign: "right", padding: "12px", fontWeight: 600, color: "var(--text-muted)" }}>Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(usageStats.modelBreakdown).map(([model, data]) => (
                      <tr key={model} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: "12px", color: "var(--text)" }}>{model}</td>
                        <td style={{ padding: "12px", textAlign: "center", color: "var(--text)" }}>{data.count}</td>
                        <td style={{ padding: "12px", textAlign: "center", color: "var(--text)" }}>{data.tokens.toLocaleString()}</td>
                        <td style={{ padding: "12px", textAlign: "right", color: "var(--navy)", fontWeight: 600 }}>
                          ₹{(data.cost / 100).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Daily Usage Chart */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "24px", marginBottom: "40px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--navy)", margin: "0 0 20px 0" }}>
                Daily Usage Trend
              </h2>
              <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", minHeight: "250px" }}>
                {Object.entries(usageStats.dailyUsage).map(([date, count]) => {
                  const maxCount = Math.max(...Object.values(usageStats.dailyUsage), 1);
                  const height = (count / maxCount) * 200;
                  return (
                    <div
                      key={date}
                      style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "flex-end",
                      }}
                    >
                      <div
                        style={{
                          width: "100%",
                          height: `${height}px`,
                          background: "linear-gradient(135deg, var(--saffron), #FF9933)",
                          borderRadius: "4px 4px 0 0",
                          opacity: 0.8,
                          transition: "opacity 0.2s",
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                        onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.8")}
                        title={`${date}: ${count} requests`}
                      />
                      <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "8px", textAlign: "center" }}>
                        {new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Usage */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "24px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--navy)", margin: "0 0 16px 0" }}>
                Recent Requests
              </h2>
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "13px",
                  }}
                >
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      <th style={{ textAlign: "left", padding: "12px", fontWeight: 600, color: "var(--text-muted)" }}>Time</th>
                      <th style={{ textAlign: "left", padding: "12px", fontWeight: 600, color: "var(--text-muted)" }}>Model</th>
                      <th style={{ textAlign: "center", padding: "12px", fontWeight: 600, color: "var(--text-muted)" }}>Tokens</th>
                      <th style={{ textAlign: "right", padding: "12px", fontWeight: 600, color: "var(--text-muted)" }}>Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usageStats.usageLogs.slice(0, 10).map((log, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: "12px", color: "var(--text)" }}>
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td style={{ padding: "12px", color: "var(--text)" }}>{log.model}</td>
                        <td style={{ padding: "12px", textAlign: "center", color: "var(--text)" }}>
                          {log.inputTokens + log.outputTokens}
                        </td>
                        <td style={{ padding: "12px", textAlign: "right", color: "var(--navy)", fontWeight: 600 }}>
                          ₹{(log.costInPaise / 100).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {usageStats.usageLogs.length === 0 && (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-muted)" }}>
                  No usage data available
                </div>
              )}
            </div>

            {/* Pricing Info */}
            <div style={{ marginTop: "40px", padding: "20px", background: "rgba(255,193,7,0.1)", border: "1px solid rgba(255,193,7,0.3)", borderRadius: "8px" }}>
              <h3 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: 600 }}>💡 Pricing Information</h3>
              <p style={{ margin: "0 0 8px 0", fontSize: "13px", color: "var(--text)" }}>
                <strong>Claude Opus 4.7:</strong> ₹0.003 per 100 input tokens, ₹0.015 per 100 output tokens
              </p>
              <p style={{ margin: "0 0 8px 0", fontSize: "13px", color: "var(--text)" }}>
                <strong>Claude Sonnet 4.6:</strong> ₹0.0003 per 100 input tokens, ₹0.0015 per 100 output tokens
              </p>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--text)" }}>
                <strong>Note:</strong> Your plan includes monthly requests. Additional cost shown above is based on token consumption beyond your plan.
              </p>
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)" }}>
            No data available
          </div>
        )}
      </div>
    </div>
  );
}
