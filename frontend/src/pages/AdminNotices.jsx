import React, { useEffect, useState } from "react";
import api from "../api/client";

export default function AdminNotices() {
  const [notices, setNotices] = useState([]);
  const [form, setForm] = useState({ title: "", content: "", isImportant: false });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const { data } = await api.get("/notices");
      setNotices(data);
    } catch (err) {
      setError(err.response?.data?.error || "Could not load notices.");
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.post("/notices", form);
      setForm({ title: "", content: "", isImportant: false });
      await load();
    } catch (err) {
      setError(err.response?.data?.error || "Could not post notice.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2>📌 Notice Board Management</h2>
      <p className="muted small">Post updates for residents — mark urgent ones as important to pin + email them.</p>
      {error && <div className="alert-error">{error}</div>}

      <div className="card">
        <h3>Post a New Notice</h3>
        <form onSubmit={handleSubmit}>
          <label>Title</label>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />

          <label>Content</label>
          <textarea
            rows={4}
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            required
          />

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={form.isImportant}
              onChange={(e) => setForm({ ...form, isImportant: e.target.checked })}
            />
            Mark as important (pins to top + emails all residents)
          </label>

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "Posting..." : "Post Notice"}
          </button>
        </form>
      </div>

      <div className="grid">
        {notices.map((n) => (
          <div key={n.id} className={`card notice-card ${n.isImportant ? "notice-important" : ""}`}>
            <div className="complaint-card-header">
              <h3>{n.title}</h3>
              {n.isImportant && <span className="badge badge-overdue">Important</span>}
            </div>
            <p>{n.content}</p>
            <p className="muted small">{new Date(n.createdAt).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
