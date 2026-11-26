
export default function Home() {
  return (
    <main style={{
      minHeight: "100vh",
      background: "#080808",
      color: "#ffffff",
      fontFamily: "Arial, sans-serif",
      padding: "25px 20px"
    }}>
      <header style={{
        maxWidth: "1100px",
        margin: "auto",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <h1 style={{
          color: "#FFD600",
          fontSize: "34px",
          margin: 0
        }}>
          SoGeon.
        </h1>

        <a href="/login" style={{
          background: "#FFD600",
          color: "#080808",
          padding: "12px 22px",
          borderRadius: "8px",
          textDecoration: "none",
          fontWeight: "bold"
        }}>
          Sign In
        </a>
      </header>

      <section style={{
        maxWidth: "1000px",
        margin: "auto",
        textAlign: "center",
        padding: "100px 10px 80px"
      }}>
        <p style={{
          color: "#FFD600",
          letterSpacing: "4px",
          fontWeight: "bold"
        }}>
          YOUR WORLD. YOUR FUTURE.
        </p>

        <h2 style={{
          fontSize: "clamp(38px, 8vw, 68px)",
          lineHeight: 1.1,
          margin: "20px 0"
        }}>
          Connect. Share.
          <span style={{ color: "#FFD600" }}>
            {" "}Discover.
          </span>
        </h2>

        <p style={{
          color: "#bbbbbb",
          fontSize: "18px",
          lineHeight: 1.7,
          maxWidth: "600px",
          margin: "auto"
        }}>
          Welcome to SoGeon, a place to connect with people,
          share your moments, discover new things and be part
          of a growing community.
        </p>

        <div style={{
          display: "flex",
          justifyContent: "center",
          flexWrap: "wrap",
          gap: "15px",
          marginTop: "35px"
        }}>
          <a href="/signup" style={{
            background: "#FFD600",
            color: "#080808",
            padding: "16px 30px",
            borderRadius: "10px",
            textDecoration: "none",
            fontWeight: "bold"
          }}>
            Create Account
          </a>

          <a href="/login" style={{
            border: "1px solid #FFD600",
            color: "#FFD600",
            padding: "16px 30px",
            borderRadius: "10px",
            textDecoration: "none",
            fontWeight: "bold"
          }}>
            Sign In
          </a>
        </div>
      </section>

      <section style={{
        maxWidth: "1000px",
        margin: "auto",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "18px",
        padding: "20px 0 70px"
      }}>
        {[
          ["🌍", "Connect", "Meet people and grow your connections."],
          ["📸", "Share", "Share your photos, thoughts and moments."],
          ["✨", "Discover", "Explore new ideas and experiences."]
        ].map(([icon, title, description]) => (
          <div key={title} style={{
            background: "#151515",
            border: "1px solid #333333",
            borderRadius: "14px",
            padding: "28px 20px",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "35px" }}>{icon}</div>
            <h3 style={{ color: "#FFD600" }}>{title}</h3>
            <p style={{ color: "#aaaaaa", lineHeight: 1.6 }}>
              {description}
            </p>
          </div>
        ))}
      </section>

      <footer style={{
        textAlign: "center",
        color: "#888888",
        padding: "25px 0",
        borderTop: "1px solid #222222"
      }}>
        © 2026 SoGeon. Your World, Your Future.
      </footer>
    </main>
  );
            }
