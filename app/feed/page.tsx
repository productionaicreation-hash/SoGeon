
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

export default function FeedPage() {
  const supabase = createClient();

  const [posts, setPosts] = useState<Post[]>([]);
  const [userId, setUserId] = useState("");
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("For You");
  const [loading, setLoading] = useState(true);
  const [showComposer, setShowComposer] = useState(false);
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [posting, setPosting] = useState(false);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

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

    setFollowingIds((follows || []).map((f) => f.following_id));

    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    const results = await Promise.all(
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

    setPosts(results);
    setLoading(false);
  }

  useEffect(() => {
    loadPosts();
  }, []);

  async function createPost(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!content.trim() && !image && !video && !videoUrl.trim()) {
      setMessage("Add a caption, photo or video first.");
      return;
    }

    if ([image, video, videoUrl.trim() ? true : null].filter(Boolean).length > 1) {
      setMessage("Choose only one photo or video.");
      return;
    }

    setPosting(true);
    setMessage("");

    let imageUrl: string | null = null;
    let finalVideoUrl: string | null = null;

    if (image) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(image.type)) {
        setMessage("Choose a JPG, PNG or WEBP photo.");
        setPosting(false);
        return;
      }

      if (image.size > 2 * 1024 * 1024) {
        setMessage("Photo must be smaller than 2 MB.");
        setPosting(false);
        return;
      }

      const path = `${userId}/${Date.now()}-${image.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

      const { error } = await supabase.storage
        .from("avatars")
        .upload(path, image);

      if (error) {
        setMessage(error.message);
        setPosting(false);
        return;
      }

      imageUrl = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
    }

    if (video) {
      const allowed = ["video/mp4", "video/quicktime", "video/webm"];

      if (!allowed.includes(video.type)) {
        setMessage("Choose an MP4, MOV or WEBM video.");
        setPosting(false);
        return;
      }

      if (video.size > 50 * 1024 * 1024) {
        setMessage("Video must be smaller than 50 MB.");
        setPosting(false);
        return;
      }

      const path = `${userId}/${Date.now()}-${video.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

      const { error } = await supabase.storage
        .from("videos")
        .upload(path, video, {
          contentType: video.type,
          upsert: false,
        });

      if (error) {
        setMessage(error.message);
        setPosting(false);
        return;
      }

      finalVideoUrl = supabase.storage
        .from("videos")
        .getPublicUrl(path).data.publicUrl;
    }

    if (videoUrl.trim()) {
      try {
        const parsed = new URL(videoUrl.trim());
        if (!["http:", "https:"].includes(parsed.protocol)) {
          throw new Error();
        }
        finalVideoUrl = videoUrl.trim();
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
      video_url: finalVideoUrl,
    });

    setPosting(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setContent("");
    setImage(null);
    setVideo(null);
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
    const url = `${window.location.origin}/post/${post.id}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "SoGeon",
          text: post.content || "Check out this SoGeon post!",
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        setMessage("Post link copied!");
      }
    } catch {
      // Sharing cancelled.
    }
  }

  const visiblePosts = posts.filter((post) => {
    if (
      activeTab === "Following" &&
      post.user_id !== userId &&
      !followingIds.includes(post.user_id)
    ) return false;

    if (search.trim()) {
      const term = search.toLowerCase();
      return (
        (post.content || "").toLowerCase().includes(term) ||
        (post.profile?.username || "").toLowerCase().includes(term)
      );
    }

    return true;
  });

  return (
    <main style={styles.main}>
      <header style={styles.header}>
        <button style={styles.tab} onClick={() => setMessage("LIVE is coming soon!")}>
          ▣ LIVE
        </button>

        <button style={styles.tab} onClick={() => setActiveTab("Community")}>
          Community
        </button>

        <button style={styles.tab} onClick={() => setActiveTab("Following")}>
          Following
        </button>

        <button
          style={{
            ...styles.tab,
            fontWeight: activeTab === "For You" ? "bold" : "normal",
            borderBottom: activeTab === "For You" ? "3px solid white" : "none",
          }}
          onClick={() => setActiveTab("For You")}
        >
          For You
        </button>

        <button style={styles.searchButton} onClick={() => setSearchOpen(!searchOpen)}>
          ⌕
        </button>
      </header>

      {searchOpen && (
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search posts and users..."
          style={styles.searchInput}
        />
      )}

      <div style={styles.feed}>
        {loading ? (
          <div style={styles.empty}>Loading SoGeon...</div>
        ) : visiblePosts.length === 0 ? (
          <div style={styles.empty}>
            <h2>Welcome to SoGeon!</h2>
            <p>Be the first to share a video or post.</p>
            <button style={styles.yellowButton} onClick={() => setShowComposer(true)}>
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
                  controls
                  style={styles.media}
                />
              ) : post.image_url ? (
                <img src={post.image_url} alt="SoGeon post" style={styles.media} />
              ) : (
                <div style={styles.textBackground}>{post.content}</div>
              )}

              <div style={styles.gradient} />

              <div style={styles.caption}>
                <Link
                  href={`/profile/${post.profile?.username || ""}`}
                  style={styles.username}
                >
                  @{post.profile?.username || "sogeon_user"}
                </Link>
                <p style={styles.postText}>{post.content || "Sharing on SoGeon ✨"}</p>
                <p style={styles.music}>♪ SoGeon Community</p>
              </div>

              <div style={styles.actions}>
                <Link href={`/profile/${post.profile?.username || ""}`}>
                  {post.profile?.avatar_url ? (
                    <img src={post.profile.avatar_url} alt="Profile" style={styles.avatar} />
                  ) : (
                    <div style={styles.avatarPlaceholder}>
                      {(post.profile?.display_name || "S").charAt(0)}
                    </div>
                  )}
                </Link>

                <button style={styles.actionButton} onClick={() => toggleLike(post)}>
                  <span style={{
                    fontSize: 36,
                    color: post.liked ? "#ff3040" : "white",
                  }}>♥</span>
                  <small>{post.likes_count}</small>
                </button>

                <Link href={`/post/${post.id}`} style={styles.actionLink}>
                  <span style={{ fontSize: 30 }}>●●●</span>
                  <small>{post.comments_count}</small>
                </Link>

                <button style={styles.actionButton} onClick={() => sharePost(post)}>
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
          {message}
          <button onClick={() => setMessage("")} style={styles.closeMessage}>✕</button>
        </div>
      )}

      <nav style={styles.bottomNav}>
        <button style={styles.navButton} onClick={() => setActiveTab("For You")}>
          <span style={styles.navIcon}>⌂</span>Home
        </button>

        <button style={styles.navButton} onClick={() => setActiveTab("Following")}>
          <span style={styles.navIcon}>♧</span>Friends
        </button>

        <button style={styles.plusButton} onClick={() => setShowComposer(true)}>
          +
        </button>

        <Link href="/messages" style={styles.navLink}>
          <span style={styles.navIcon}>▤</span>Inbox
        </Link>

        <Link href="/dashboard" style={styles.navLink}>
          <span style={styles.navIcon}>♙</span>Profile
        </Link>
      </nav>

      {showComposer && (
        <div style={styles.modal}>
          <form onSubmit={createPost} style={styles.composer}>
            <div style={styles.composerHeader}>
              <h2>Create on SoGeon</h2>
              <button type="button" onClick={() => setShowComposer(false)} style={styles.closeButton}>
                ✕
              </button>
            </div>

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's happening in your world?"
              style={styles.textarea}
            />

            <label style={styles.label}>Add a photo</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                setImage(e.target.files?.[0] || null);
                setVideo(null);
                setVideoUrl("");
              }}
              style={{ color: "white" }}
            />

            <label style={styles.label}>Upload a video from your phone</label>
            <input
              type="file"
              accept="video/mp4,video/quicktime,video/webm"
              onChange={(e) => {
                setVideo(e.target.files?.[0] || null);
                setImage(null);
                setVideoUrl("");
              }}
              style={{ color: "white" }}
            />

            <small style={{ color: "#bbb" }}>
              MP4, MOV or WEBM · Maximum 50 MB
            </small>

            <label style={styles.label}>Or add a direct video URL</label>
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => {
                setVideoUrl(e.target.value);
                setVideo(null);
                setImage(null);
              }}
              placeholder="https://example.com/video.mp4"
              style={styles.videoInput}
            />

            <button disabled={posting} type="submit" style={styles.publishButton}>
              {posting ? "Uploading..." : "Publish"}
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
    padding: "0 5px",
    background: "linear-gradient(#0009, transparent)",
  },
  tab: {
    color: "white",
    background: "transparent",
    border: 0,
    padding: "12px 3px",
    fontSize: 12,
    whiteSpace: "nowrap",
    cursor: "pointer",
  },
  searchButton: {
    color: "white",
    background: "transparent",
    border: 0,
    fontSize: 32,
  },
  searchInput: {
    position: "absolute",
    top: 70,
    left: 12,
    right: 12,
    width: "calc(100% - 24px)",
    zIndex: 20,
    padding: 12,
    background: "#222",
    color: "white",
    border: "1px solid #666",
    borderRadius: 9,
    boxSizing: "border-box",
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
    inset: 0,
    width: "100%",
    height: "100%",
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
    background: "linear-gradient(140deg,#272727,#111,#343000)",
  },
  gradient: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    background: "linear-gradient(transparent 45%,#000b 85%,#000e)",
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
  },
  music: { fontSize: 13, color: "white" },
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
  avatar: {
    width: 48,
    height: 48,
    borderRadius: "50%",
    border: "2px solid white",
    objectFit: "cover",
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: "50%",
    background: "#FFD600",
    color: "#111",
    display: "grid",
    placeItems: "center",
    fontSize: 24,
  },
  actionButton: {
    display: "grid",
    justifyItems: "center",
    gap: 4,
    color: "white",
    background: "transparent",
    border: 0,
    cursor: "pointer",
  },
  actionLink: {
    display: "grid",
    justifyItems: "center",
    gap: 4,
    color: "white",
    textDecoration: "none",
    fontSize: 20,
  },
  empty: {
    minHeight: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    padding: 30,
  },
  yellowButton: {
    background: "#FFD600",
    color: "#000",
    border: 0,
    borderRadius: 9,
    padding: "14px 25px",
    fontWeight: "bold",
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
    alignItems: "center",
    borderTop: "1px solid #333",
    paddingBottom: "env(safe-area-inset-bottom)",
  },
  navButton: {
    color: "white",
    background: "transparent",
    border: 0,
    display: "grid",
    justifyItems: "center",
    gap: 3,
    fontSize: 12,
  },
  navLink: {
    color: "white",
    textDecoration: "none",
    display: "grid",
    justifyItems: "center",
    gap: 3,
    fontSize: 12,
  },
  navIcon: { fontSize: 27, lineHeight: 1 },
  plusButton: {
    width: 54,
    height: 38,
    border: 0,
    borderRadius: 11,
    color: "#000",
    background: "#fff",
    fontSize: 32,
    lineHeight: "30px",
    fontWeight: "bold",
    boxShadow: "-4px 0 #25e6e8, 4px 0 #fe2c55",
  },
  modal: {
    position: "absolute",
    inset: 0,
    zIndex: 40,
    background: "#000c",
    display: "grid",
    placeItems: "center",
    padding: 18,
  },
  composer: {
    width: "100%",
    maxWidth: 450,
    background: "#191919",
    border: "1px solid #444",
    borderRadius: 16,
    padding: 20,
    display: "grid",
    gap: 14,
    boxSizing: "border-box",
    maxHeight: "90dvh",
    overflowY: "auto",
  },
  composerHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  closeButton: {
    color: "white",
    background: "transparent",
    border: 0,
    fontSize: 22,
  },
  textarea: {
    width: "100%",
    minHeight: 90,
    boxSizing: "border-box",
    background: "#292929",
    color: "white",
    border: "1px solid #555",
    borderRadius: 9,
    padding: 12,
  },
  label: {
   
    color: "#FFD600",
    fontSize: 14,
    fontWeight: "bold",
  },
  videoInput: {
    width: "100%",
    boxSizing: "border-box",
    padding: 12,
    background: "#292929",
    color: "white",
    border: "1px solid #555",
    borderRadius: 9,
  },
  publishButton: {
    width: "100%",
    padding: 15,
    background: "#FFD600",
    color: "#000",
    border: 0,
    borderRadius: 9,
    fontWeight: "bold",
    fontSize: 16,
    cursor: "pointer",
  },
};
    
