
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function Dashboard() {
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        window.location.href = "/login";
        return;
      }

      setEmail(data.user.email || "");
      setUserId(data.user.id);

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("username, display_name, bio")
        .eq("id", data.user.id)
        .maybeSingle();

      if (error) {
        setMessage("Could not load profile: " + error.message);
      } else if (profile) {
        setUsername(profile.username || "");
        setDisplayName(profile.display_name || "");
        setBio(profile.bio || "");
      } else {
        setDisplayName(
          data.user.email?.split("@")[0] || ""
        );
      }

      setLoading(false);
    }

    loadProfile();
  }, []);

  async function saveProfile() {
    if (!userId) return;

    setSaving(true);
    setMessage("");

    const supabase = createClient();

    const { error } = await supabase
      .from("profiles")
      .upsert(
        {
          id: userId,
          username: username.trim() || null,
          display_name: displayName.trim(),
          bio: bio.trim(),
        },
        { onConflict: "id" }
      );

    if (error) {
      setMessage("Error: " + error.message);
    } else {
      setMessage("Profile saved successfully!");
    }

    setSaving(false);
  }

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (loading) {
    return (
      <main style={{
        background: "#080808",
        color: "white",
        minHeight: "100vh",
        padding: 30
      }}>
        Loading SoGeon...
      </main>
    );
  }

  return (
    <main style={{
      minHeight: "100vh",
      background: "#080808",
      color: "white",
      padding: 25,
      fontFamily: "Arial"
    }}>
      <h1 style={{
        color: "#FFD600",
        fontSize: 35
      }}>
        SoGeon.
      </h1>

      <h2>Welcome to your dashboard!</h2>

      <p style={{ color: "#bbbbbb" }}>
        Signed in as: {email}
      </p>

      <section style={{
        background: "#191919",
        padding: 25,
        borderRadius: 15,
        marginTop: 25
      }}>
        <h2>My Profile</h2>

        <label>Username</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Choose a username"
          style={inputStyle}
        />

        <label>Display Name</label>
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your name"
          style={inputStyle}
        />

        <label>About Me</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell the world about yourself..."
          rows={4}
          style={inputStyle}
        />

        <button
          onClick={saveProfile}
          disabled={saving}
          style={buttonStyle}
        >
          {saving ? "Saving..." : "Save Profile"}
        </button>

        {message && (
          <p style={{ color: "#FFD600" }}>
            {message}
          </p>
        )}
      </section>

      <section style={{
        background: "#191919",
        padding: 25,
        borderRadius: 15,
        marginTop: 20
      }}>
        <h2>Your SoGeon account</h2>
        <p>Your digital world starts here.</p>
      </section>

      <button
        onClick={logout}
        style={buttonStyle}
      >
        Sign Out
      </button>
    </main>
  );
}

const inputStyle = {
  display: "block",
  width: "100%",
  boxSizing: "border-box" as const,
  padding: 13,
  marginTop: 10,
  marginBottom: 20,
  borderRadius: 8,
  border: "1px solid #444",
  background: "#080808",
  color: "white",
  fontSize: 16
};

const buttonStyle = {
  background: "#FFD600",
  color: "#080808",
  padding: 15,
  border: 0,
  borderRadius: 8,
  marginTop: 15,
  fontWeight: "bold" as const,
  cursor: "pointer"
};
    
