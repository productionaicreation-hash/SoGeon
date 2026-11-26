"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("Checking your reset link...");
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function checkLink() {
      const code = new URLSearchParams(window.location.search).get("code");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          if (active) setMessage("Invalid or expired link. Request a new one.");
          return;
        }
      }

      const { data, error } = await supabase.auth.getSession();

      if (!active) return;

      if (error || !data.session) {
        setMessage("Invalid or expired link. Please request a new one.");
        return;
      }

      setReady(true);
      setMessage("Enter your new password below.");
    }

    checkLink();

    return () => {
      active = false;
    };
  }, []);

  async function updatePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Password updated! Redirecting to login...");
    await supabase.auth.signOut();
    setTimeout(() => router.push("/login"), 1500);
  }

  return (
    <main style={{
      minHeight: "100vh",
      background: "#080808",
      color: "white",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "20px"
    }}>
      <form onSubmit={updatePassword} style={{
        width: "100%",
        maxWidth: "400px",
        background: "#171717",
        padding: "30px",
        borderRadius: "16px"
      }}>
        <h1 style={{ color: "#FFD600", textAlign: "center" }}>
          SoGeon
        </h1>

        <h2 style={{ textAlign: "center" }}>Reset Password</h2>

        <p style={{ textAlign: "center", color: "#ccc" }}>
          {message}
        </p>

        {ready && (
          <>
            <input
              type="password"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={inputStyle}
            />

            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={inputStyle}
            />

            <button type="submit" disabled={loading} style={buttonStyle}>
              {loading ? "Updating..." : "Update Password"}
            </button>
          </>
        )}
      </form>
    </main>
  );
}

const inputStyle = {
  width: "100%",
  padding: "14px",
  marginBottom: "15px",
  borderRadius: "8px",
  border: "1px solid #444",
  background: "#252525",
  color: "white",
  boxSizing: "border-box" as const
};

const buttonStyle = {
  width: "100%",
  padding: "14px",
  background: "#FFD600",
  color: "#000",
  border: "none",
  borderRadius: "8px",
  fontWeight: "bold" as const,
  cursor: "pointer"
};
