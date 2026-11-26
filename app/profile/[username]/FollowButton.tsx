
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function FollowButton({
  targetUserId,
}: {
  targetUserId: string;
}) {
  const [supabase] = useState(() => createClient());
  const [userId, setUserId] = useState<string | null>(null);
  const [following, setFollowing] = useState(false);
  const [followers, setFollowers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadData() {
    const { data: auth } = await supabase.auth.getUser();
    const currentUserId = auth.user?.id ?? null;
    setUserId(currentUserId);

    const { count } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", targetUserId);

    setFollowers(count ?? 0);

    if (currentUserId) {
      const { data } = await supabase
        .from("follows")
        .select("follower_id")
        .eq("follower_id", currentUserId)
        .eq("following_id", targetUserId)
        .maybeSingle();

      setFollowing(!!data);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, [targetUserId]);

  async function toggleFollow() {
    if (!userId) {
      setMessage("Please sign in to follow users.");
      return;
    }

    if (userId === targetUserId) {
      setMessage("You cannot follow yourself.");
      return;
    }

    setLoading(true);
    setMessage("");

    if (following) {
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", userId)
        .eq("following_id", targetUserId);

      if (error) {
        setMessage(error.message);
      } else {
        setFollowing(false);
        setFollowers((n) => Math.max(0, n - 1));
      }
    } else {
      const { error } = await supabase.from("follows").insert({
        follower_id: userId,
        following_id: targetUserId,
      });

      if (error) {
        setMessage(error.message);
      } else {
        setFollowing(true);
        setFollowers((n) => n + 1);
      }
    }

    setLoading(false);
  }

  return (
    <div style={{ margin: "24px 0" }}>
      <p><strong>{followers}</strong> Followers</p>

      {userId !== targetUserId && (
        <button
          onClick={toggleFollow}
          disabled={loading}
          style={{
            padding: "12px 28px",
            borderRadius: "25px",
            border: "none",
            background: following ? "#555" : "#f5c400",
            color: "#111",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          {loading ? "Please wait..." : following ? "Following" : "Follow"}
        </button>
      )}

      {message && <p>{message}</p>}
    </div>
  );
      }
    
