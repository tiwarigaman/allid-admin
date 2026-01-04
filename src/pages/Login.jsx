import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { ADMIN_EMAILS } from "../auth/adminEmails";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await signInWithEmailAndPassword(auth, email, password);

      if (!ADMIN_EMAILS.includes(res.user.email)) {
        setError("Access denied. You are not an admin.");
        setLoading(false);
        return;
      }

      navigate("/dashboard");
    } catch {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.avatarWrap}>
          <div style={styles.avatarIcon}>👤</div>
        </div>

        <h2 style={styles.title}>Admin Login</h2>
        <p style={styles.subtitle}>
          Welcome back! Please sign in to continue
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={styles.input}
            />
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    width: "100vw",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #00c6a7, #00a99d)",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Inter, sans-serif",
  },

  card: {
    width: 420,
    background: "#ffffff",
    padding: "32px 30px",
    borderRadius: 16,
    boxShadow: "0 24px 48px rgba(0,0,0,0.18)",
    textAlign: "center",
  },

  avatarWrap: {
    display: "flex",
    justifyContent: "center",
    marginBottom: 14,
  },

  avatarIcon: {
    width: 64,
    height: 64,
    borderRadius: "50%",
    background: "#00a99d",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 26,
  },

  title: {
    fontSize: 22,
    fontWeight: 600,
    marginBottom: 6,
    color: "#111827",
  },

  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 26,
  },

  form: {
    textAlign: "left",
  },

  field: {
    marginBottom: 16,
  },

  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 500,
    color: "#374151",
    marginBottom: 6,
  },

  input: {
    width: "100%",
    height: 44,
    padding: "0 12px",
    borderRadius: 8,
    border: "1px solid #d1d5db",
    fontSize: 14,
    outline: "none",
  },

  button: {
    width: "100%",
    height: 46,
    marginTop: 18,
    borderRadius: 10,
    border: "none",
    background: "#00a99d",
    color: "#ffffff",
    fontSize: 15,
    fontWeight: 500,
    cursor: "pointer",
  },

  error: {
    color: "#dc2626",
    fontSize: 13,
    marginTop: 4,
  },

  demo: {
    marginTop: 18,
    fontSize: 12,
    color: "#6b7280",
  },
};
