
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function Dashboard() {
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
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
        .select("username, display_name, bio, avatar_url")
        .eq("id", data.user.id)
        .maybeSingle();

      if (error) {
        setMessage("Could not load profile: " + error.message);
      } else if (profile) {
        setUsername(profile.username || "");
        setDisplayName(profile.display_name || "");
        setBio(profile.bio || "");
        setAvatarUrl(profile.avatar_url || "");
      } else {
        setDisplayName(data.user.email?.split("@")[0] || "");
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
    let newAvatarUrl = avatarUrl;

    try {
      if (photo) {
        if (!["image/jpeg", "image/png", "image/webp"].includes(photo.type)) {
          setMessage("Please choose a JPG, PNG or WEBP image.");
          setSaving(false);
          return;
        }

        if (photo.size > 2 * 1024 * 1024) {
          setMessage("Photo must be smaller than 2 MB.");
          setSaving(false);
          return;
        }

        const filePath = `${userId}/${Date.now()}-${photo.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, photo, {
            cacheControl: "3600",
            upsert: false,
            contentType: photo.type
          });

        if (uploadError) throw uploadError;

        const { data: publicData } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath);

        newAvatarUrl = publicData.publicUrl;
      }

      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: userId,
          username: username.trim() || null,
          display_name: displayName.trim(),
          bio: bio.trim(),
          avatar_url: newAvatarUrl || null
        }, { onConflict: "id" });

      if (error) throw error;

      setAvatarUrl(newAvatarUrl);
      setPhoto(null);
      setMessage("Profile and photo saved successfully!");
    } catch (error: any) {
      setMessage("Error: " + error.message);
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
      <main style={{ background: "#080808", color: "white", minHeight: "100vh", padding: 30 }}>
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
      <h1 style={{ color: "#FFD600", fontSize: 35 }}>
        SoGeon.
      </h1>

      <h2>Welcome to your dashboard!</h2>
      <p style={{ color: "#bbbbbb" }}>Signed in as: {email}</p>

      <section style={sectionStyle}>
        <h2>My Profile</h2>

        <div style={{ textAlign: "center", marginBottom: 25 }}>
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Profile picture"
              style={avatarStyle}
            />
          ) : (
            <div style={{
              ...avatarStyle,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontSize: 45,
              background: "#333"
            }}>
              👤
            </div>
          )}

          <p>Profile Picture</p>

          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setPhoto(e.target.files?.[0] || null)}
            style={{ maxWidth: "100%" }}
          />

          {photo && (
            <p style={{ color: "#FFD600" }}>
              Selected: {photo.name}
            </p>
          )}
        </div>

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
          <p style={{ color: "#FFD600" }}>{message}</p>
        )}
      </section>

      <section style={sectionStyle}>
        <h2>Your SoGeon account</h2>
        <p>Your digital world starts here.</p>
      </section>

      <button onClick={logout} style={buttonStyle}>
        Sign Out
      </button>
    </main>
  );
}

const sectionStyle = {
  background: "#191919",
  padding: 25,
  borderRadius: 15,
  marginTop: 25
};

const avatarStyle = {
  width: 130,
  height: 130,
  borderRadius: "50%",
  objectFit: "cover" as const,
  border: "3px solid #FFD600"
};

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
          
