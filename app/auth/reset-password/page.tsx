"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    if (!email) {
      setError("Please enter your email address");
      setLoading(false);
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
      setEmail("");
    } catch (err: any) {
      console.error("Reset error:", err);
      if (err.code === "auth/user-not-found") {
        setError("No account found with this email");
      } else {
        setError(err.message || "Failed to send reset email. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, var(--navy) 0%, #5c6bc0 100%)",
      padding: "20px",
    }}>
      <div style={{
        width: "100%",
        maxWidth: "420px",
        background: "white",
        borderRadius: "12px",
        padding: "40px",
        boxShadow: "0 8px 32px rgba(0,0,128,0.2)",
      }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{
            width: "60px",
            height: "60px",
            background: "linear-gradient(135deg, var(--saffron), #FF9933)",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "28px",
            margin: "0 auto 16px",
            boxShadow: "0 4px 12px rgba(255,153,51,0.3)",
          }}>
            ₹
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--navy)", margin: 0 }}>
            Reset Password
          </h1>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "8px" }}>
            We'll send you a link to reset your password
          </p>
        </div>

        <form onSubmit={handleReset} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {error && (
            <div style={{
              background: "rgba(244, 67, 54, 0.1)",
              border: "1px solid #f44336",
              borderRadius: "8px",
              padding: "12px 14px",
              fontSize: "13px",
              color: "#d32f2f",
            }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{
              background: "rgba(76, 175, 80, 0.1)",
              border: "1px solid #4caf50",
              borderRadius: "8px",
              padding: "12px 14px",
              fontSize: "13px",
              color: "#2e7d32",
            }}>
              ✓ Password reset link sent! Check your email.
            </div>
          )}

          <div>
            <label style={{
              display: "block",
              fontSize: "13px",
              fontWeight: 600,
              color: "var(--text)",
              marginBottom: "6px",
            }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                fontSize: "14px",
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
              disabled={loading || success}
            />
          </div>

          <button
            type="submit"
            disabled={loading || success}
            style={{
              background: "linear-gradient(135deg, var(--navy) 0%, #5c6bc0 100%)",
              color: "white",
              border: "none",
              padding: "12px 16px",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              marginTop: "8px",
              opacity: (loading || success) ? 0.7 : 1,
              transition: "opacity 0.2s",
            }}
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <div style={{
          textAlign: "center",
          marginTop: "20px",
          fontSize: "13px",
          color: "var(--text-muted)",
        }}>
          <button
            onClick={() => router.push("/auth/login")}
            style={{
              background: "none",
              border: "none",
              color: "var(--navy)",
              fontWeight: 600,
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            Back to login
          </button>
        </div>
      </div>
    </div>
  );
}
