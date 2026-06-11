"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { setDoc, doc } from "firebase/firestore";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const getCurrentMonth = () => {
    const now = new Date();
    return now.getFullYear() * 100 + (now.getMonth() + 1);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validation
    if (!email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      // Create Firebase user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create user profile in Firestore
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        planId: "free",
        monthlyQuota: 3,
        currentUsage: 0,
        totalFreeChatsUsed: 0,  // Track total free chats (max 3)
        currentMonth: getCurrentMonth(),
        createdAt: new Date(),
        isAnonymous: false,
      });

      // Redirect to app
      router.push("/");
    } catch (err: any) {
      console.error("Signup error:", err);
      if (err.code === "auth/email-already-in-use") {
        setError("Email already in use. Please login instead.");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email address");
      } else {
        setError(err.message || "Signup failed. Please try again.");
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
            Create Account
          </h1>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "8px" }}>
            Join Indian Income Tax Analyser
          </p>
        </div>

        <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
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
              disabled={loading}
            />
          </div>

          <div>
            <label style={{
              display: "block",
              fontSize: "13px",
              fontWeight: 600,
              color: "var(--text)",
              marginBottom: "6px",
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                fontSize: "14px",
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
              disabled={loading}
            />
          </div>

          <div>
            <label style={{
              display: "block",
              fontSize: "13px",
              fontWeight: 600,
              color: "var(--text)",
              marginBottom: "6px",
            }}>
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                fontSize: "14px",
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
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
              opacity: loading ? 0.7 : 1,
              transition: "opacity 0.2s",
            }}
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <div style={{
          textAlign: "center",
          marginTop: "20px",
          fontSize: "13px",
          color: "var(--text-muted)",
        }}>
          Already have an account?{" "}
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
            Login here
          </button>
        </div>

        <div style={{
          marginTop: "24px",
          paddingTop: "20px",
          borderTop: "1px solid var(--border)",
          fontSize: "12px",
          color: "var(--text-muted)",
          textAlign: "center",
          lineHeight: 1.6,
        }}>
          By signing up, you agree to our Terms of Service and Privacy Policy.
        </div>
      </div>
    </div>
  );
}
