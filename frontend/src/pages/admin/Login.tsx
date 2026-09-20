import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { FiLock, FiUser } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) {
    return <Navigate to="/admin" replace />;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(username.trim(), password);
      navigate("/admin", { replace: true });
    } catch (err) {
      setError((err as Error).message || "Login failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login">
      <div className="login__card">
        <div className="login__brand">
          <span className="nav__logo">{"</>"}</span>
          <div>
            <strong>Portfolio Admin</strong>
            <small style={{ color: "var(--text-dim)", fontSize: "0.7rem" }}>
              SECURE AREA
            </small>
          </div>
        </div>

        <h1>Welcome back</h1>
        <p>Sign in to manage your portfolio content.</p>

        <form className="login__form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="username">Username</label>
            <div style={{ position: "relative" }}>
              <FiUser
                style={{
                  position: "absolute",
                  left: "0.9rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-dim)",
                }}
              />
              <input
                id="username"
                className="input"
                style={{ paddingLeft: "2.5rem" }}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <div style={{ position: "relative" }}>
              <FiLock
                style={{
                  position: "absolute",
                  left: "0.9rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-dim)",
                }}
              />
              <input
                id="password"
                className="input"
                style={{ paddingLeft: "2.5rem" }}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          {error && <p className="login__error">{error}</p>}

          <button
            className="btn btn-primary"
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {/* <p className="login__hint">
          Default credentials:
          <br />
          user: mariette250
          <br />
          pass: PortoMariettte2026
        </p> */}

        <Link to="/" className="login__back">
          ← Back to portfolio
        </Link>
      </div>
    </div>
  );
}