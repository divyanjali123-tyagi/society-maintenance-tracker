import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import { StatusBadge, PriorityBadge, OverdueBadge } from "../components/Badges.jsx";
import { categoryIcon } from "../utils/category.js";

const CATEGORIES = [
  "Plumbing",
  "Electrical",
  "Housekeeping",
  "Security",
  "Lift",
  "Parking",
  "Common Area",
  "Other",
];
const STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH"];

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [filters, setFilters] = useState({ category: "", status: "", dateFrom: "", dateTo: "" });
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    load();
  }, [filters]);

  async function load() {
    try {
      const params = {};
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params[k] = v;
      });
      const { data } = await api.get("/complaints", { params });
      setComplaints(data);
    } catch (err) {
      setError(err.response?.data?.error || "Could not load complaints.");
    }
  }

  async function updatePriority(id, priority) {
    setBusyId(id);
    try {
      await api.patch(`/complaints/${id}/priority`, { priority });
      await load();
    } catch (err) {
      setError(err.response?.data?.error || "Could not update priority.");
    } finally {
      setBusyId(null);
    }
  }

  async function updateStatus(id, status) {
    const note = window.prompt(`Optional note for marking as ${status}:`, "");
    if (note === null) return; // cancelled
    setBusyId(id);
    try {
      await api.patch(`/complaints/${id}/status`, { status, note: note || undefined });
      await load();
    } catch (err) {
      setError(err.response?.data?.error || "Could not update status.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <h2>🗂️ All Complaints</h2>
      <p className="muted small">Overdue complaints float to the top automatically, sorted by priority.</p>
      {error && <div className="alert-error">{error}</div>}

      <div className="card filters-bar" style={{ marginBottom: 0, borderRadius: "14px 14px 0 0" }}>
        <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">All Statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace("_", " ")}</option>
          ))}
        </select>
        <label className="inline-label">
          From <input type="date" value={filters.dateFrom} onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })} />
        </label>
        <label className="inline-label">
          To <input type="date" value={filters.dateTo} onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })} />
        </label>
      </div>

      <div className="table-wrap" style={{ borderRadius: "0 0 14px 14px" }}>
      <table className="table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Resident</th>
            <th>Category</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Days Open</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {complaints.map((c) => (
            <tr key={c.id} className={c.overdue ? "row-overdue" : ""}>
              <td>
                <Link to={`/complaint/${c.id}`}>{c.title}</Link>
                {c.overdue && <OverdueBadge overdue />}
              </td>
              <td>{c.resident?.name} ({c.resident?.flatNo || "N/A"})</td>
              <td>{categoryIcon(c.category)} {c.category}</td>
              <td><StatusBadge status={c.status} /></td>
              <td>
                <select
                  value={c.priority}
                  disabled={busyId === c.id || c.isClosed}
                  onChange={(e) => updatePriority(c.id, e.target.value)}
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </td>
              <td>{c.daysOpen}</td>
              <td>
                {c.isClosed ? (
                  <span className="muted small">Closed</span>
                ) : (
                  <div className="action-buttons">
                    {c.status !== "IN_PROGRESS" && (
                      <button disabled={busyId === c.id} onClick={() => updateStatus(c.id, "IN_PROGRESS")}>
                        Mark In Progress
                      </button>
                    )}
                    <button disabled={busyId === c.id} onClick={() => updateStatus(c.id, "RESOLVED")}>
                      Mark Resolved
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      {complaints.length === 0 && (
        <div className="card empty-state">
          <div className="empty-state-icon">✨</div>
          <p>Nothing matches these filters — try widening the search.</p>
        </div>
      )}
    </div>
  );
}
