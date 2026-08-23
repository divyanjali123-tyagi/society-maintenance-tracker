import React, { useEffect, useState } from "react";
import api from "../api/client";
import { categoryIcon as categoryIconInline } from "../utils/category.js";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/dashboard")
      .then(({ data }) => setStats(data))
      .catch((err) => setError(err.response?.data?.error || "Could not load dashboard."));
  }, []);

  if (error) return <div className="alert-error">{error}</div>;
  if (!stats) return <p>Loading dashboard...</p>;

  return (
    <div>
      <h2>📊 Admin Dashboard</h2>
      <p className="muted small">A quick snapshot of what's happening across the society.</p>
      <div className="stat-grid">
        <div className="card stat-card">
          <div className="stat-icon">🧾</div>
          <div className="stat-number">{stats.total}</div>
          <div className="stat-label">Total Complaints</div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon">🟡</div>
          <div className="stat-number">{stats.byStatus.OPEN || 0}</div>
          <div className="stat-label">Open</div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon">🔵</div>
          <div className="stat-number">{stats.byStatus.IN_PROGRESS || 0}</div>
          <div className="stat-label">In Progress</div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon">🟢</div>
          <div className="stat-number">{stats.byStatus.RESOLVED || 0}</div>
          <div className="stat-label">Resolved</div>
        </div>
        <div className="card stat-card stat-card-alert">
          <div className="stat-icon">⚠️</div>
          <div className="stat-number">{stats.overdueCount}</div>
          <div className="stat-label">Overdue</div>
        </div>
      </div>

      <div className="card">
        <h3>By Category</h3>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Count</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(stats.byCategory).map(([cat, count]) => (
                <tr key={cat}>
                  <td>{categoryIconInline(cat)} {cat}</td>
                  <td>{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
