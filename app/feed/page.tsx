
"use client";

import { useEffect, useState, type FormEvent } from "react";
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

type Tab = "forYou" | "following" | "community";

export default function FeedPage() {
  const supabase = createClient();

  const [posts, setPosts] = useState<Post[]>([]);
  const [userId, setUserId] = useState("");
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<Tab>("forYou");
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");

  const [showComposer, setShowComposer] = useState(false);
  const [content, setContent] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [posting, setPosting] = useState(false);
  const [message, setMessage] = useState("");

  async function loadPosts() {
    const { data: auth } = await supabase.auth.getUser();

    if (!auth.user) {
      window.location.href = "/login";
      return;
    }

    setUserId(auth.user.id);

    const { data: follows } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", auth.user.id);

    setFollowingIds(
      (follows || []).map((item) => item.following_id)
    );

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

  async function createPost(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!content.trim() && !image && !videoUrl.trim()) {
      setMessage("Write something or add a photo or video URL.");
      return;
    }

    if (image && videoUrl.trim()) {
      setMessage("Choose a photo OR a video URL, not both.");
      return;
    }

    setPosting(true);
    setMessage("");

    let imageUrl: string | null = null;
    let cleanVideoUrl: string | null = null;

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

      const filePath =
        `${userId}/${Date.now()}-${image.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

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

    if (videoUrl.trim()) {
      try {
        const parsed = new URL(videoUrl.trim());

        if (!["http:", "https:"].includes(parsed.protocol)) {
          throw new Error("Invalid video URL");
        }

        cleanVideoUrl = videoUrl.trim();
      } catch {
        setMessage("Enter a valid video URL.");
        setPosting(false);
        return;
      }
    }

    const { error } = await supabase.from("posts").insert({
      user_id: userId,
      content: content.trim() || null,
      image_url: imageUrl,
      video_url: cleanVideoUrl,
    });

    setPosting(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setContent("");
    setImage(null);
    setVideoUrl("");
    setShowComposer(false);
    setMessage("Your post was published!");
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

  async function sharePost(post: Post) {
    const url = window.location.origin + `/post/${post.id}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "SoGeon",
          text: post.content || "Check out this post on SoGeon!",
          url,
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setMessage("Post link copied!");
      } else {
        setMessage(url);
      }
    } catch {
      // Sharing was cancelled or unavailable.
    }
  }

  const visiblePosts = posts
    .filter((post) => {
      if (
        activeTab === "following" &&
        post.user_id !== userId &&
        !followingIds.includes(post.user_id)
      ) {
        return false;
      }

      if (search.trim()) {
        const term = search.toLowerCase();
        return (
          (post.content || "").toLowerCase().includes(term) ||
          (post.profile?.username || "").toLowerCase().includes(term) ||
          (post.profile?.display_name || "").toLowerCase().includes(term)
        );
      }

      return true;
    })
    .slice()
    .sort((a, b) => {
      if (activeTab === "forYou") {
        const scoreA =
          a.likes_count * 3 +
          a.comments_count * 2;
        const scoreB =
          b.likes_count * 3 +
          b.comments_count * 2;

        if (scoreA !== scoreB) return scoreB - scoreA;
      }

      return (
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
      );
    });

  return (
    <main style={styles.main}>
      <header style={styles.header}>
        <button
          onClick={() => setMessage("LIVE streaming is coming soon!")}
          style={styles.liveButton}
        >
          <span style={{ fontSize: 21 }}>▣</span>
          LIVE
        </button>

        <button
          onClick={() => setActiveTab("community")}
          style={{
            ...styles.tab,
            opacity: activeTab === "community" ? 1 : 0.65,
          }}
        >
          Community
        </button>

        <button
          onClick={() => setActiveTab("following")}
          style={{
            ...styles.tab,
            opacity: activeTab === "following" ? 1 : 0.65,
          }}
        >
          Following
        </button>

        <button
          onClick={() => setActiveTab("forYou")}
          style={{
            ...styles.tab,
            fontWeight: activeTab === "forYou" ? "bold" : "normal",
            borderBottom:
              activeTab === "forYou"
                ? "3px solid white"
                : "3px solid transparent",
          }}
        >
          For You
        </button>

        <button
          onClick={() => setSearchOpen(!searchOpen)}
          style={styles.searchButton}
        >
          ⌕
        </button>
      </header>

      {searchOpen && (
        <div style={styles.searchPanel}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search people and posts..."
            style={styles.searchInput}
          />
        </div>
      )}

      <div style={styles.feed}>
        {loading ? (
          <div style={styles.empty}>
            Loading your SoGeon feed...
          </div>
        ) : visiblePosts.length === 0 ? (
          <div style={styles.empty}>
            <h2>No posts to show yet.</h2>
            <p>
              Be the first to share something with the SoGeon community!
            </p>
            <button
              onClick={() => setShowComposer(true)}
              style={styles.yellowButton}
            >
              Create a Post
            </button>
          </div>
        ) : (
          visiblePosts.map((post) => (
            <article key={post.id} style={styles.post}>
              {post.video_url ? (
                <video
                  src={post.video_url}
                  autoPlay
                  muted
                  loop
                  playsInline
                  onClick={(e) => {
                    const video = e.currentTarget;
                    if (video.paused) {
                      video.play().catch(() => {});
                    } else {
                      video.pause();
                    }
                  }}
                  style={styles.media}
                />
              ) : post.image_url ? (
                <img
                  src={post.image_url}
                  alt="SoGeon post"
                  style={styles.media}
                />
              ) : (
                <div style={styles.textBackground}>
                  {post.content}
                </div>
              )}

              <div style={styles.gradient} />

              <div style={styles.caption}>
                <Link
                  href={`/profile/${post.profile?.username || ""}`}
                  style={styles.username}
                >
                  @{post.profile?.username || "sogeon_user"}
                </Link>

                <p style={styles.postText}>
                  {post.content || "Sharing on SoGeon ✨"}
                </p>

                <p style={styles.music}>
                  ♪ SoGeon Community
                </p>
              </div>

              <div style={styles.actions}>
                <Link
                  href={`/profile/${post.profile?.username || ""}`}
                  style={styles.avatarLink}
                >
                  {post.profile?.avatar_url ? (
                    <img
                      src={post.profile.avatar_url}
                      alt="Profile"
                      style={styles.avatar}
                    />
                  ) : (
                    <div style={styles.avatarPlaceholder}>
                      {(
                        post.profile?.display_name ||
                        "S"
                      ).charAt(0).toUpperCase()}
                    </div>
                  )}
                </Link>

                <button
                  onClick={() => toggleLike(post)}
                  style={styles.actionButton}
                >
                  <span style={{
                    fontSize: 35,
                    color: post.liked ? "#ff3040" : "white",
                  }}>
                    ♥
                  </span>
                  <small>{post.likes_count}</small>
                </button>

                <Link
                  href={`/post/${post.id}`}
                  style={styles.actionLink}
                >
                  <span style={{ fontSize: 34 }}>●●●</span>
                  <small>{post.comments_count}</small>
                </Link>

                <button
                  onClick={() => sharePost(post)}
                  style={styles.actionButton}
                >
                  <span style={{ fontSize: 34 }}>➤</span>
                  <small>Share</small>
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      {message && (
        <div style={styles.message}>
          <span>{message}</span>
          <button
            onClick={() => setMessage("")}
            style={styles.closeMessage}
          >
            ✕
          </button>
        </div>
      )}

      <nav style={styles.bottomNav}>
        <button
          onClick={() => setActiveTab("forYou")}
          style={styles.navButton}
        >
          <span style={styles.navIcon}>⌂</span>
          Home
        </button>

        <button
          onClick={() => setActiveTab("following")}
          style={styles.navButton}
        >
          <span style={styles.navIcon}>♧</span>
          Friends
        </button>

        <button
          onClick={() => setShowComposer(true)}
          style={styles.plusButton}
        >
          +
        </button>

        <button
          onClick={() => setMessage("Private messaging is coming next!")}
          style={styles.navButton}
        >
          <span style={styles.navIcon}>▤</span>
          Inbox
        </button>

        <Link href="/dashboard" style={styles.navLink}>
          <span style={styles.navIcon}>♙</span>
          Profile
        </Link>
      </nav>

      {showComposer && (
        <div style={styles.modal}>
          <form onSubmit={createPost} style={styles.composer}>
            <div style={styles.composerHeader}>
              <h2>Create on SoGeon</h2>
              <button
                type="button"
                onClick={() => setShowComposer(false)}
                style={styles.closeButton}
              >
                ✕
              </button>
            </div>

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's happening in your world?"
              style={styles.textarea}
            />

            <label style={styles.label}>
              Add a photo
            </label>

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) =>
                setImage(e.target.files?.[0] || null)
              }
              style={{ color: "white" }}
            />

            <label style={styles.label}>
              Or add a direct video URL (.mp4)
            </label>

            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://example.com/video.mp4"
              style={styles.videoInput}
            />

            <button
              disabled={posting}
              type="submit"
              style={styles.publishButton}
            >
              {posting ? "Publishing..." : "Publish"}
            </button>
          </form>
        </div>
      )}
    </main>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  main: {
    height: "100dvh",
    width: "100%",
    background: "#000",
    color: "#fff",
    position: "relative",
    overflow: "hidden",
    fontFamily: "Arial, sans-serif",
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    height: 65,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-around",
    padding: "0 7px",
    background: "linear-gradient(#0009, transparent)",
  },
  liveButton: {
    color: "white",
    background: "transparent",
    border: 0,
    fontWeight: "bold",
    display: "grid",
    fontSize: 11,
    cursor: "pointer",
  },
  tab: {
    color: "white",
    background: "transparent",
    border: 0,
    padding: "12px 3px",
    fontSize: 13,
    whiteSpace: "nowrap",
    cursor: "pointer",
  },
  searchButton: {
    color: "white",
    background: "transparent",
    border: 0,
    fontSize: 34,
    cursor: "pointer",
  },
  searchPanel: {
    position: "absolute",
    top: 65,
    left: 12,
    right: 12,
    zIndex: 20,
  },
  searchInput: {
    width: "100%",
    padding: 12,
    borderRadius: 10,
    boxSizing: "border-box",
    background: "#222",
    color: "white",
    border: "1px solid #666",
  },
  feed: {
    height: "100%",
    overflowY: "auto",
    scrollSnapType: "y mandatory",
    scrollbarWidth: "none",
  },
  post: {
    height: "100dvh",
    width: "100%",
    position: "relative",
    background: "#171717",
    overflow: "hidden",
    scrollSnapAlign: "start",
  },
  media: {
    position: "absolute",
    width: "100%",
    height: "100%",
    inset: 0,
    objectFit: "cover",
  },
  textBackground: {
    position: "absolute",
    inset: 0,
    display: "grid",
    placeItems: "center",
    padding: 35,
    textAlign: "center",
    fontSize: 30,
    fontWeight: "bold",
    background: "linear-gradient(140deg, #272727, #111, #343000)",
  },
  gradient: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    background: "linear-gradient(transparent 45%, #000b 85%, #000e)",
  },
  caption: {
    position: "absolute",
    bottom: 105,
    left: 17,
    right: 90,
    zIndex: 2,
  },
  username: {
    color: "white",
    fontSize: 17,
    fontWeight: "bold",
    textDecoration: "none",
  },
  postText: {
    color: "white",
    fontSize: 16,
    lineHeight: 1.4,
    textShadow: "0 1px 3px #000",
  },
  music: {
    fontSize: 13,
    color: "#fff",
  },
  actions: {
    position: "absolute",
    right: 12,
    bottom: 110,
    zIndex: 3,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 22,
  },
  avatarLink: {
    textDecoration: "none",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: "50%",
    border: "2px solid white",
    objectFit: "cover",
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: "50%",
    border: "2px solid white",
    background: "#d5ad00",
    color: "#111",
    display: "grid",
    placeItems: "center",
    fontSize: 24,
    fontWeight: "bold",
  },
  actionButton: {
    display: "grid",
    justifyItems: "center",
    gap: 4,
    color: "white",
    background: "transparent",
    border: 0,
    cursor: "pointer",
    textShadow: "0 1px 3px #000",
  },
  actionLink: {
    display: "grid",
    justifyItems: "center",
    gap: 4,
    color: "white",
    textDecoration: "none",
    fontSize: 24,
  },
  empty: {
    minHeight: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    padding: 30,
    color: "white",
  },
  yellowButton: {
    background: "#FFD600",
    color: "#000",
    border: 0,
    borderRadius: 9,
    padding: "14px 25px",
    fontWeight: "bold",
    marginTop: 15,
  },
  message: {
    position: "absolute",
    top: 75,
    left: 12,
    right: 12,
    zIndex: 30,
    background: "#222",
    border: "1px solid #555",
    padding: 12,
    borderRadius: 10,
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
  },
  closeMessage: {
    color: "white",
    border: 0,
    background: "transparent",
  },
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 76,
    zIndex: 15,
    background: "#050505",
    display: "flex",
    justifyContent: "space-around",
    al
