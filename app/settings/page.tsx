"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

interface Notification {
  type: string;
  percentageUsed: number;
  chatsRemaining: number;
  sentAt: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (user && !loading) {
      loadSettings();
    }
  }, [user, loading]);

  const loadSettings = async () => {
    if (!user) return;
    try {
      setDataLoading(true);
      const token = await user.getIdToken();
      const response = await fetch("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setNotificationsEnabled(data.notificationsEnabled);
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setDataLoading(false);
    }
  };

  const handleToggleNotifications = async (enabled: boolean) => {
    if (!user) return;
    try {
      setSaving(true);
      const token = await user.getIdToken();
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: enabled ? "enable" : "disable",
        }),
      });

      if (response.ok) {
        setNotificationsEnabled(enabled);
        setMessage(
          enabled
            ? "✓ Notifications enabled"
            : "✓ Notifications disabled"
        );
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (err) {
      console.error("Failed to update settings:", err);
      setMessage("Failed to update settings");
    } finally {
      setSaving(false);
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
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
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
            ⚙️ Settings
          </h1>
          <p style={{ fontSize: "16px", color: "var(--text-muted)", margin: 0 }}>
            Manage your preferences and notifications
          </p>
        </div>

        {message && (
          <div
            style={{
              background: message.includes("Failed")
                ? "rgba(244, 67, 54, 0.1)"
                : "rgba(76, 175, 80, 0.1)",
              border: message.includes("Failed")
                ? "1px solid #f44336"
                : "1px solid #4caf50",
              borderRadius: "8px",
              padding: "12px 16px",
              marginBottom: "20px",
              color: message.includes("Failed") ? "#d32f2f" : "#2e7d32",
              fontSize: "13px",
            }}
          >
            {message}
          </div>
        )}

        {dataLoading ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)" }}>
            Loading settings...
          </div>
        ) : (
          <>
            {/* Notification Preferences */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "24px", marginBottom: "40px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--navy)", margin: "0 0 20px 0" }}>
                📬 Notifications
              </h2>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px", background: "var(--bg)", borderRadius: "8px", marginBottom: "16px" }}>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>
                    Quota Limit Warnings
                  </div>
                  <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "4px 0 0 0" }}>
                    Get notified when you're approaching your monthly usage limit
                  </p>
                </div>
                <button
                  onClick={() => handleToggleNotifications(!notificationsEnabled)}
                  disabled={saving}
                  style={{
                    padding: "8px 16px",
                    background: notificationsEnabled ? "var(--navy)" : "var(--border)",
                    color: notificationsEnabled ? "white" : "var(--text-muted)",
                    border: "none",
                    borderRadius: "6px",
                    cursor: saving ? "not-allowed" : "pointer",
                    fontSize: "13px",
                    fontWeight: 600,
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {notificationsEnabled ? "✓ Enabled" : "Disabled"}
                </button>
              </div>

              <div style={{ fontSize: "12px", color: "var(--text-muted)", padding: "12px 0" }}>
                <p>💡 We send email notifications at:</p>
                <ul style={{ margin: "8px 0 0 20px", lineHeight: 1.8 }}>
                  <li><strong>75-80% of limit:</strong> Friendly reminder about your usage</li>
                  <li><strong>85-90% of limit:</strong> Warning that you're getting close</li>
                  <li><strong>95%+ of limit:</strong> Urgent: Only a few chats left!</li>
                </ul>
              </div>
            </div>

            {/* Recent Notifications */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "24px", marginBottom: "40px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--navy)", margin: "0 0 20px 0" }}>
                📜 Recent Notifications
              </h2>

              {notifications.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-muted)" }}>
                  <div style={{ fontSize: "40px", marginBottom: "12px" }}>📭</div>
                  <p>No notifications sent yet</p>
                  <p style={{ fontSize: "12px", marginTop: "8px" }}>
                    You'll receive notifications as you approach your usage limit
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {notifications.map((notif, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: "var(--bg)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        padding: "12px 16px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>
                          ⚠️ Quota Warning ({notif.percentageUsed}% used)
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                          {notif.chatsRemaining} chats remaining
                        </div>
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--text-muted)", textAlign: "right" }}>
                        {new Date(notif.sentAt).toLocaleDateString()}
                        <br />
                        {new Date(notif.sentAt).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Account Info */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "24px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--navy)", margin: "0 0 20px 0" }}>
                👤 Account Information
              </h2>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>
                    Email
                  </label>
                  <div style={{ fontSize: "14px", color: "var(--text)", marginTop: "4px" }}>
                    {user.email}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>
                    User ID
                  </label>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px", fontFamily: "monospace", wordBreak: "break-all" }}>
                    {user.uid}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>
                    Account Created
                  </label>
                  <div style={{ fontSize: "14px", color: "var(--text)", marginTop: "4px" }}>
                    {user.metadata?.creationTime
                      ? new Date(user.metadata.creationTime).toLocaleDateString()
                      : "Unknown"}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: "20px", paddingTop: "20px", borderTop: "1px solid var(--border)" }}>
                <button
                  onClick={() => {
                    // TODO: Implement logout
                  }}
                  style={{
                    padding: "10px 16px",
                    background: "rgba(244, 67, 54, 0.1)",
                    color: "#d32f2f",
                    border: "1px solid rgba(244, 67, 54, 0.3)",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                >
                  🚪 Logout
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
