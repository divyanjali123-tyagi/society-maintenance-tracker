import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { CATEGORY_ICONS } from "../utils/category.js";

const CATEGORIES = Object.keys(CATEGORY_ICONS);

export default function RaiseComplaint() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: "", category: CATEGORIES[0], description: "" });
  const [photo, setPhoto] = useState(null);
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
      const fd = new FormData();
      fd.append("title", form.title);
      fd.append("category", form.category);
      fd.append("description", form.description);
      if (photo) fd.append("photo", photo);

      await api.post("/complaints", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      navigate("/complaints");
    } catch (err) {
      setError(err.response?.data?.error || "Could not submit complaint.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card auth-card">
      <h2>🛠️ Raise a Complaint</h2>
      <p className="muted small">Let the admin know what needs fixing — add a photo if you can, it helps a lot.</p>
      {error && <div className="alert-error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <label>Title</label>
        <input value={form.title} onChange={update("title")} required placeholder="e.g. Leaking pipe in bathroom" />

        <label>Category</label>
        <select value={form.category} onChange={update("category")}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_ICONS[c]} {c}
            </option>
          ))}
        </select>

        <label>Description</label>
        <textarea
          value={form.description}
          onChange={update("description")}
          required
          rows={5}
          placeholder="Describe the issue in detail..."
        />

        <label>Photo (optional)</label>
        <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files[0])} />

        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? "Submitting..." : "Submit Complaint"}
        </button>
      </form>
    </div>
  );
}
