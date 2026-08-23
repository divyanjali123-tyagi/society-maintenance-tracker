import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import { StatusBadge, PriorityBadge, OverdueBadge } from "../components/Badges.jsx";
import { categoryIcon } from "../utils/category.js";

export default function ResidentComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get("/complaints/mine");
      setComplaints(data);
    } catch (err) {
      setError(err.response?.data?.error || "Could not load complaints.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <p>Loading your complaints...</p>;

  return (
    <div>
      <div className="page-header">
        <h2>My Complaints</h2>
        <Link className="btn-primary" to="/raise">
          + Raise Complaint
        </Link>
      </div>
      {error && <div className="alert-error">{error}</div>}
      {complaints.length === 0 && (
        <div className="card empty-state">
          <div className="empty-state-icon">🧾</div>
          <p>No complaints yet — hopefully everything's running smoothly! If something needs fixing, raise it above.</p>
        </div>
      )}
      <div className="grid">
        {complaints.map((c) => (
          <Link to={`/complaint/${c.id}`} key={c.id} className="card complaint-card" data-priority={c.priority}>
            <div className="complaint-card-header">
              <h3>{c.title}</h3>
              <OverdueBadge overdue={c.overdue} />
            </div>
            <span className="category-chip">{categoryIcon(c.category)} {c.category}</span>
            <p>{c.description.slice(0, 100)}{c.description.length > 100 ? "..." : ""}</p>
            <div className="badge-row">
              <StatusBadge status={c.status} />
              <PriorityBadge priority={c.priority} />
            </div>
            <p className="muted small">Raised {new Date(c.createdAt).toLocaleDateString()} &middot; {c.daysOpen} day(s) open</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
