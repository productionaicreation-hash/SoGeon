
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Comment = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  username?: string;
};

const stickers = ["❤️", "😍", "😂", "🔥", "👏", "🥰", "👍", "🎉", "😭", "💯"];

export default function CommentsPage() {
  const supabase = createClient();
  const params = useParams();
  const postId = params.id as string;

  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const [message, setMessage] = useState("");

  async function loadComments() {
    const { data: auth } = await supabase.auth.getUser();

    if (!auth.user) {
      window.location.href = "/login";
      return;
    }

    setUserId(auth.user.id);

    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    const list = await Promise.all(
      (data || []).map(async (comment) => {
        const { data: profile } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", comment.user_id)
          .maybeSingle();

        return {
          ...comment,
          username: profile?.username || "SoGeon User",
        };
      })
    );

    setComments(list);
    setLoading(false);
  }

  useEffect(() => {
    loadComments();
  }, [postId]);

  async function sendComment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!content.trim()) {
      setMessage("Write a comment or choose a sticker.");
      return;
    }

    setSending(true);
    setMessage("");

    const { error } = await supabase.from("comments").insert({
      post_id: postId,
      user_id: userId,
      content: content.trim(),
    });

    setSending(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setContent("");
    setShowStickers(false);
    await loadComments();
  }

  async function deleteComment(commentId: string) {
    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId)
      .eq("user_id", userId);

    if (error) {
      setMessage(error.message);
      return;
    }

    await loadComments();
  }

  return (
    <main style={{
      minHeight: "100vh",
      background: "#080808",
      color: "white",
      maxWidth: "650px",
      margin: "auto",
      padding: "20px"
    }}>
      <h1 style={{ color: "#FFD600" }}>SoGeon</h1>

      <Link href="/feed" style={{ color: "#FFD600" }}>
        ← Back to News Feed
      </Link>

      <h2>Comments 💬</h2>

      <form onSubmit={sendComment} style={cardStyle}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write something... ✍️"
          style={textareaStyle}
        />

        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "12px"
        }}>
          <button
            type="button"
            onClick={() => setShowStickers(!showStickers)}
            style={stickerButton}
          >
            😊 Stickers
          </button>

          <button type="submit" disabled={sending} style={sendButton}>
            {sending ? "Sending..." : "Send ➤"}
          </button>
        </div>

        {showStickers && (
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            marginTop: "18px"
          }}>
            {stickers.map((sticker) => (
              <button
                key={sticker}
                type="button"
                onClick={() => setContent((old) => old + sticker)}
                style={{
                  fontSize: "28px",
                  background: "#303030",
                  border: "none",
                  borderRadius: "10px",
                  padding: "8px"
                }}
              >
                {sticker}
              </button>
            ))}
          </div>
        )}
      </form>

      {message && <p>{message}</p>}

      <h3>All Comments ({comments.length})</h3>

      {loading ? (
        <p>Loading comments...</p>
      ) : comments.length === 0 ? (
        <p>No comments yet. Start the conversation! 💛</p>
      ) : (
        comments.map((comment) => (
          <div key={comment.id} style={cardStyle}>
            <strong style={{ color: "#FFD600" }}>
              @{comment.username}
            </strong>

            <p style={{
              fontSize: "17px",
              overflowWrap: "anywhere"
            }}>
              {comment.content}
            </p>

            <small style={{ color: "#aaa" }}>
              {new Date(comment.created_at).toLocaleString()}
            </small>

            {comment.user_id === userId && (
              <button
                onClick={() => deleteComment(comment.id)}
                style={{
                  display: "block",
                  marginTop: "12px",
                  background: "transparent",
                  color: "#ff7777",
                  border: "none"
                }}
              >
                Delete comment
              </button>
            )}
          </div>
        ))
      )}
    </main>
  );
}

const cardStyle = {
  background: "#191919",
  padding: "18px",
  borderRadius: "14px",
  marginTop: "18px"
};

const textareaStyle = {
  width: "100%",
  minHeight: "100px",
  padding: "14px",
  background: "#292929",
  color: "white",
  border: "1px solid #555",
  borderRadius: "10px",
  boxSizing: "border-box" as const,
  fontSize: "16px"
};

const stickerButton = {
  background: "#333",
  color: "white",
  padding: "12px",
  border: "none",
  borderRadius: "8px"
};

const sendButton = {
  background: "#FFD600",
  color: "#000",
  padding: "12px 22px",
  border: "none",
  borderRadius: "8px",
  fontWeight: "bold" as const
};
    
