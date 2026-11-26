
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Post = {
  id: string;
  user_id: string;
  content: string | null;
  image_url: string | null;
  video_url: string | null;
  created_at: string;
  profile?: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
  likes_count: number;
  comments_count: number;
  liked: boolean;
};

export default function FeedPage() {
  const supabase = createClient();

  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [userId, setUserId] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [message, setMessage] = useState("");

  async function loadPosts() {
    const { data: auth } = await supabase.auth.getUser();

    if (!auth.user) {
      window.location.href = "/login";
      return;
    }

    setUserId(auth.user.id);

    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    const postList = await Promise.all(
      (data || []).map(async (post) => {
        const { data: profile } = await supabase
          .from("profiles")
          .select("username, display_name, avatar_url")
          .eq("id", post.user_id)
          .maybeSingle();

        const { count: likes } = await supabase
          .from("likes")
          .select("*", { count: "exact", head: true })
          .eq("post_id", post.id);

        const { count: comments } = await supabase
          .from("comments")
          .select("*", { count: "exact", head: true })
          .eq("post_id", post.id);

        const { data: liked } = await supabase
          .from("likes")
          .select("post_id")
          .eq("post_id", post.id)
          .eq("user_id", auth.user.id)
          .maybeSingle();

        return {
          ...post,
          profile: profile || undefined,
          likes_count: likes || 0,
          comments_count: comments || 0,
          liked: !!liked,
        };
      })
    );

    setPosts(postList);
    setLoading(false);
  }

  useEffect(() => {
    loadPosts();
  }, []);

  async function createPost(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!content.trim() && !image) {
      setMessage("Write something or select a photo.");
      return;
    }

    setPosting(true);
    setMessage("");

    let imageUrl: string | null = null;

    if (image) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(image.type)) {
        setMessage("Use a JPG, PNG or WEBP image.");
        setPosting(false);
        return;
      }

      if (image.size > 2 * 1024 * 1024) {
        setMessage("Photo must be smaller than 2 MB.");
        setPosting(false);
        return;
      }

      const filePath = `${userId}/${Date.now()}-${image.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, image);

      if (uploadError) {
        setMessage(uploadError.message);
        setPosting(false);
        return;
      }

      const { data: publicData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      imageUrl = publicData.publicUrl;
    }

    const { error } = await supabase.from("posts").insert({
      user_id: userId,
      content: content.trim() || null,
      image_url: imageUrl,
    });

    setPosting(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setContent("");
    setImage(null);
    setMessage("Post published successfully!");
    await loadPosts();
  }

  async function toggleLike(post: Post) {
    if (post.liked) {
      const { error } = await supabase
        .from("likes")
        .delete()
        .eq("post_id", post.id)
        .eq("user_id", userId);

      if (error) {
        setMessage(error.message);
        return;
      }
    } else {
      const { error } = await supabase.from("likes").insert({
        post_id: post.id,
        user_id: userId,
      });

      if (error) {
        setMessage(error.message);
        return;
      }
    }

    await loadPosts();
  }

  return (
    <main style={{
      minHeight: "100vh",
      background: "#080808",
      color: "white",
      padding: "20px",
      maxWidth: "700px",
      margin: "auto"
    }}>
      <header style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <h1 style={{ color: "#FFD600" }}>SoGeon</h1>
        <Link href="/dashboard" style={{ color: "#FFD600" }}>
          My Profile
        </Link>
      </header>

      <h2>News Feed</h2>

      <form onSubmit={createPost} style={cardStyle}>
        <textarea
          placeholder="What's happening in your world?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={textareaStyle}
        />

        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => setImage(e.target.files?.[0] || null)}
        />

        {image && <p>{image.name}</p>}

        <button disabled={posting} style={buttonStyle}>
          {posting ? "Publishing..." : "Publish Post"}
        </button>
      </form>

      {message && <p>{message}</p>}

      {loading ? (
        <p>Loading posts...</p>
      ) : posts.length === 0 ? (
        <p>No posts yet. Be the first to share something!</p>
      ) : (
        posts.map((post) => (
          <article key={post.id} style={cardStyle}>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              {post.profile?.avatar_url && (
                <img
                  src={post.profile.avatar_url}
                  alt="Profile"
                  width="45"
                  height="45"
                  style={{ borderRadius: "50%", objectFit: "cover" }}
                />
              )}

              <div>
                <strong>
                  {post.profile?.display_name || "SoGeon User"}
                </strong>
                <p style={{ color: "#aaa", margin: "4px 0" }}>
                  @{post.profile?.username || "user"}
                </p>
              </div>
            </div>

            {post.content && <p>{post.content}</p>}

            {post.image_url && (
              <img
                src={post.image_url}
                alt="Post"
                style={{
                  width: "100%",
                  borderRadius: "12px",
                  marginTop: "10px"
                }}
              />
            )}

            <p style={{ color: "#aaa", fontSize: "13px" }}>
              {new Date(post.created_at).toLocaleString()}
            </p>

            <div style={{ display: "flex", gap: "20px" }}>
              <button
                onClick={() => toggleLike(post)}
                style={smallButtonStyle}
              >
                {post.liked ? "❤️ Liked" : "🤍 Like"} ({post.likes_count})
              </button>

              <Link
                href={`/post/${post.id}`}
                style={{ color: "#FFD600" }}
              >
                💬 Comments ({post.comments_count})
              </Link>
            </div>
          </article>
        ))
      )}
    </main>
  );
}

const cardStyle = {
  background: "#171717",
  padding: "18px",
  borderRadius: "14px",
  marginBottom: "18px",
};

const textareaStyle = {
  width: "100%",
  minHeight: "90px",
  padding: "12px",
  borderRadius: "8px",
  background: "#252525",
  color: "white",
  border: "1px solid #444",
  boxSizing: "border-box" as const,
  marginBottom: "12px",
};

const buttonStyle = {
  display: "block",
  width: "100%",
  padding: "13px",
  marginTop: "12px",
  background: "#FFD600",
  color: "#000",
  border: "none",
  borderRadius: "8px",
  fontWeight: "bold" as const,
};

const smallButtonStyle = {
  background: "transparent",
  color: "#FFD600",
  border: "none",
  cursor: "pointer",
};
