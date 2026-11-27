
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Notification = {
  recipient_id: string;
  actor_id: string;
  type: string;
  post_id: string | null;
  is_read: boolean;
  created_at: string;
  actor?: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
};

export default function NotificationsPage() {
  const supabase = createClient();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadNotifications() {
    const { data: auth } = await supabase.auth.getUser();

    if (!auth.user) {
      window.location.href = "/login";
      return;
    }

    setUserId(auth.user.id);

    const { data, error } = await supabase
      .from("notifications")
      .select("recipient_id, actor_id, type, post_id, is_read, created_at")
      .eq("recipient_id", auth.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    const results = await Promise.all(
      (data || []).map(async (notification) => {
        const { data: actor } = await supabase
          .from("profiles")
          .select("username, display_name, avatar_url")
          .eq("id", notification.actor_id)
          .maybeSingle();

        return {
          ...notification,
          actor: actor || undefined,
        };
      })
    );

    setNotifications(results);
    setLoading(false);
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  async function markAllRead() {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("recipient_id", userId)
      .eq("is_read", false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setNotifications((current) =>
      current.map((item) => ({ ...item, is_read: true }))
    );

    setMessage("All notifications marked as read.");
  }

  function notificationText(type: string) {
    if (type === "follow") return "started following you.";
    if (type === "like") return "liked your post.";
    if (type === "comment") return "commented on your post.";
    return "interacted with you.";
  }

  function notificationLink(item: Notification) {
    if (item.type === "follow") {
      return `/profile/${item.actor?.username || ""}`;
    }

    if (item.post_id) {
      return `/post/${item.post_id}`;
    }

    return "/feed";
  }

  return (
    <main style={styles.main}>
      <header style={styles.header}>
        <Link href="/feed" style={styles.back}>← Back</Link>
        <h1>🔔 Notifications</h1>
        <button onClick={markAllRead} style={styles.readButton}>
          Mark all read
        </button>
      </header>

      {message && (
        <p style={styles.message}>{message}</p>
      )}

      {loading ? (
        <p style={styles.empty}>Loading notifications...</p>
      ) : notifications.length === 0 ? (
        <div style={styles.empty}>
          <h2>You're all caught up!</h2>
          <p>Your new notifications will appear here.</p>
        </div>
      ) : (
        <section style={styles.list}>
          {notifications.map((item, index) => (
            <Link
              key={`${item.actor_id}-${item.type}-${item.created_at}-${index}`}
              href={notificationLink(item)}
              style={{
                ...styles.item,
                background: item.is_read ? "#171717" : "#292400",
              }}
            >
              {item.actor?.avatar_url ? (
                <img
                  src={item.actor.avatar_url}
                  alt="Profile"
                  style={styles.avatar}
                />
              ) : (
                <div style={styles.avatarPlaceholder}>
                  {(item.actor?.display_name || "S").charAt(0)}
                </div>
              )}

              <div style={styles.details}>
                <p>
                  <strong>
                    {item.actor?.display_name ||
                      item.actor?.username ||
                      "A SoGeon user"}
                  </strong>{" "}
                  {notificationText(item.type)}
                </p>

                <small>
                  {new Date(item.created_at).toLocaleString()}
                </small>
              </div>

              {!item.is_read && (
                <span style={styles.dot}>●</span>
              )}
            </Link>
          ))}
        </section>
      )}
    </main>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  main: {
    minHeight: "100dvh",
    background: "#080808",
    color: "white",
    fontFamily: "Arial, sans-serif",
    paddingBottom: 30,
  },
  header: {
    background: "#111",
    padding: 18,
    borderBottom: "1px solid #333",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  back: {
    color: "#FFD600",
    textDecoration: "none",
  },
  readButton: {
    background: "#FFD600",
    color: "#000",
    border: 0,
    borderRadius: 8,
    padding: "10px 12px",
    fontWeight: "bold",
  },
  message: {
    padding: 12,
    color: "#FFD600",
  },
  empty: {
    textAlign: "center",
    padding: 50,
    color: "#bbb",
  },
  list: {
    display: "grid",
    gap: 2,
  },
  item: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: 16,
    color: "white",
    textDecoration: "none",
    borderBottom: "1px solid #333",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: "50%",
    objectFit: "cover",
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: "50%",
    background: "#FFD600",
    color: "#000",
    display: "grid",
    placeItems: "center",
    fontSize: 22,
    fontWeight: "bold",
  },
  details: {
    flex: 1,
  },
  dot: {
    color: "#FFD600",
    fontSize: 13,
  },
};
