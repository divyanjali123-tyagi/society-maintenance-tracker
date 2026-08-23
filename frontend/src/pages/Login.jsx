import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import AuthIllustration from "../components/AuthIllustration.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(user.role === "ADMIN" ? "/admin/dashboard" : "/complaints");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-split">
      <div className="auth-illustration-panel">
        <AuthIllustration />
        <p className="auth-illustration-caption">Keeping your building running smoothly, one fix at a time.</p>
      </div>
      <div className="card auth-card">
        <h2>👋 Welcome back</h2>
        <p className="muted small">Log in to raise or track a maintenance complaint.</p>
        {error && <div className="alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>
        <p>
          New resident? <Link to="/register">Register here</Link>
        </p>
        <p className="hint">Admin demo login: admin@society.com / Admin@123</p>
      </div>
    </div>
  );
}
