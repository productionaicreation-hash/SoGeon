
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function Dashboard() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkUser() {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        window.location.href = "/login";
        return;
      }

      setEmail(data.user.email || "");
      setLoading(false);
    }

    checkUser();
  }, []);

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (loading) {
    return <main style={{background:"#080808",color:"white",minHeight:"100vh",padding:30}}>Loading SoGeon...</main>;
  }

  return (
    <main style={{
      minHeight:"100vh",
      background:"#080808",
      color:"white",
      padding:25,
      fontFamily:"Arial"
    }}>
      <h1 style={{color:"#FFD600",fontSize:35}}>SoGeon.</h1>

      <h2>Welcome to your dashboard!</h2>

      <p style={{color:"#bbbbbb"}}>Signed in as: {email}</p>

      <section style={{
        background:"#191919",
        padding:25,
        borderRadius:15,
        marginTop:30
      }}>
        <h2>Your SoGeon account</h2>
        <p>Your digital world starts here.</p>
      </section>

      <button onClick={logout} style={{
        background:"#FFD600",
        padding:15,
        border:0,
        borderRadius:8,
        marginTop:25,
        fontWeight:"bold"
      }}>
        Sign Out
      </button>
    </main>
  );
  }
