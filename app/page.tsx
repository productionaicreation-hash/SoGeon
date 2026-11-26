
export default function Home() {
  return (
    <main style={{
      minHeight: "100vh",
      background: "#080808",
      color: "#ffffff",
      fontFamily: "Arial, sans-serif",
      padding: "30px 20px"
    }}>
      <header style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <h1 style={{ color: "#FFD600", fontSize: "32px" }}>
          SoGeon.
        </h1>
        <a href="/login" style={{
          color: "#080808",
          background: "#FFD600",
          padding: "12px 20px",
          borderRadius: "8px",
          textDecoration: "none",
          fontWeight: "bold"
        }}>
          Sign in
        </a>
      </header>

      <section style={{
        textAlign: "center",
        padding: "100px 10px"
      }}>
        <h2 style={{ fontSize: "42px" }}>
          Welcome to <span style={{color:"#FFD600"}}>SoGeon</span>
        </h2>
        <p style={{ color: "#bbbbbb", fontSize: "18px" }}>
          Your world. Your connections. Your future.
        </p>
        <a href="/signup" style={{
          display: "inline-block",
          marginTop: "25px",
          background: "#FFD600",
          color: "#080808",
          padding: "16px 30px",
          borderRadius: "10px",
          fontWeight: "bold",
          textDecoration: "none"
        }}>
          Get Started
        </a>
      </section>

      <footer style={{
        textAlign: "center",
        color: "#888888"
      }}>
        © 2026 SoGeon. All rights reserved.
      </footer>
    </main>
  );
      }
