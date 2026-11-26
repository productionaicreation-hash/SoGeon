
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function signup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });

    setLoading(false);
    setMessage(
      error ? error.message : "Account created! Check your email to confirm."
    );
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
      <form onSubmit={signup} style={{
        width: "100%",
        maxWidth: 400,
        display: "grid",
        gap: 18
      }}>
        <h1 style={{color:"#FFD600", textAlign:"center"}}>
          Join SoGeon
        </h1>

        <p>Create your account and join our world.</p>

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
          placeholder="Password (minimum 6 characters)"
          minLength={6}
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
          {loading ? "Creating account..." : "Create Account"}
        </button>

        {message && <p>{message}</p>}

        <a href="/login" style={{color:"#FFD600"}}>
          Already have an account? Sign in
        </a>
      </form>
    </main>
  );
      }
        
