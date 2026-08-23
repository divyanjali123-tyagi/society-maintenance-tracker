import React, { useEffect, useState } from "react";
import api from "../api/client";

export default function NoticeBoard() {
  const [notices, setNotices] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/notices")
      .then(({ data }) => setNotices(data))
      .catch((err) => setError(err.response?.data?.error || "Could not load notices."));
  }, []);

  return (
    <div>
      <h2>📌 Notice Board</h2>
      <p className="muted small">Important announcements are pinned to the top.</p>
      {error && <div className="alert-error">{error}</div>}
      {notices.length === 0 && (
        <div className="card empty-state">
          <div className="empty-state-icon">🗒️</div>
          <p>No notices yet — check back soon.</p>
        </div>
      )}
      <div className="grid">
        {notices.map((n) => (
          <div key={n.id} className={`card notice-card ${n.isImportant ? "notice-important" : ""}`}>
            <div className="complaint-card-header">
              <h3>{n.title}</h3>
              {n.isImportant && <span className="badge badge-overdue">Important</span>}
            </div>
            <p>{n.content}</p>
            <p className="muted small">
              By {n.author?.name} &middot; {new Date(n.createdAt).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
