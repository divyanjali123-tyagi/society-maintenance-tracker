import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import AuthIllustration from "../components/AuthIllustration.jsx";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", flatNo: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form);
      navigate("/complaints");
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-split">
      <div className="auth-illustration-panel">
        <AuthIllustration />
        <p className="auth-illustration-caption">One tap to report it, one place to track it.</p>
      </div>
      <div className="card auth-card">
        <h2>🏡 Join your society</h2>
        <p className="muted small">Register as a resident to raise and track complaints.</p>
        {error && <div className="alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <label>Full Name</label>
          <input value={form.name} onChange={update("name")} required />

          <label>Flat Number</label>
          <input value={form.flatNo} onChange={update("flatNo")} placeholder="e.g. A-204" />

          <label>Email</label>
          <input type="email" value={form.email} onChange={update("email")} required />

          <label>Password</label>
          <input type="password" value={form.password} onChange={update("password")} required minLength={6} />

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>
        <p>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
