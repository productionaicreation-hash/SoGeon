
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ username: string }>;
};

export default async function PublicProfile({ params }: Props) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("username, display_name, bio, avatar_url")
    .eq("username", decodeURIComponent(username))
    .maybeSingle();

  if (error || !profile) {
    notFound();
  }

  return (
    <main style={{
      maxWidth: "600px",
      margin: "40px auto",
      padding: "24px",
      textAlign: "center",
      fontFamily: "Arial, sans-serif"
    }}>
      <h1>SoGeon</h1>

      {profile.avatar_url ? (
        <img
          src={profile.avatar_url}
          alt="Profile photo"
          style={{
            width: "150px",
            height: "150px",
            borderRadius: "50%",
            objectFit: "cover"
          }}
        />
      ) : (
        <div style={{
          width: "150px",
          height: "150px",
          borderRadius: "50%",
          background: "#eeeeee",
          margin: "auto"
        }} />
      )}

      <h2>{profile.display_name || profile.username}</h2>
      <p>@{profile.username}</p>
      <p>{profile.bio || "Welcome to my SoGeon profile!"}</p>

      <a href="/">Visit SoGeon</a>
    </main>
  );
    }
      
