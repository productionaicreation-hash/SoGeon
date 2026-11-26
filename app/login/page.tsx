
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function login(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
    } else {
      window.location.href = "/dashboard";
    }
  }

  async function forgotPassword() {
    if (!email.trim()) {
      setMessage("Please enter your email address first.");
      return;
    }

    setLoading(true);
    setMessage("");

    const supabase = createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo: `${window.location.origin}/reset-password`,
      }
    );

    setLoading(false);

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Password reset email sent! Check your inbox.");
    }
  }

  return (
    <main style={{
      minHeight: "100vh",
      background: "#080808",
      color: "white",
      display: "grid",
      placeItems: "center",
      padding: 20,
      fontFamily: "Arial"
    }}>
      <form onSubmit={login} style={{
        width: "100%",
        maxWidth: 400,
        display: "grid",
        gap: 18
      }}>
        <h1 style={{color:"#FFD600", textAlign:"center"}}>
          SoGeon Login
        </h1>

        <p>Welcome back!</p>

        <input
          type="email"
          placeholder="Email address"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{padding:15, borderRadius:8}}
        />

        <input
          type="password"
          placeholder="Password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{padding:15, borderRadius:8}}
        />

        <button disabled={loading} style={{
          padding:16,
          background:"#FFD600",
          border:0,
          borderRadius:8,
          fontWeight:"bold"
        }}>
          {loading ? "Signing in..." : "Sign In"}
        </button>

        <button
          type="button"
          onClick={forgotPassword}
          disabled={loading}
          style={{
            background: "transparent",
            border: 0,
            color: "#FFD600",
            textAlign: "right",
            cursor: "pointer",
            fontSize: 14
          }}
        >
          Forgot Password?
        </button>

        {message && <p>{message}</p>}

        <a href="/signup" style={{color:"#FFD600"}}>
          Don't have an account? Sign up
        </a>
      </form>
    </main>
  );
      }
        
