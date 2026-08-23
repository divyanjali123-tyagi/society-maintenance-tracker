import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api, { fileBaseUrl } from "../api/client";
import { StatusBadge, PriorityBadge, OverdueBadge } from "../components/Badges.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { categoryIcon } from "../utils/category.js";

export default function ComplaintDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [complaint, setComplaint] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, [id]);

  async function load() {
    try {
      const { data } = await api.get(`/complaints/${id}`);
      setComplaint(data);
    } catch (err) {
      setError(err.response?.data?.error || "Could not load complaint.");
    }
  }

  if (error) return <div className="alert-error">{error}</div>;
  if (!complaint) return <p>Loading...</p>;

  return (
    <div>
      <Link to={user.role === "ADMIN" ? "/admin/complaints" : "/complaints"}>&larr; Back</Link>
      <div className="card">
        <div className="complaint-card-header">
          <h2>{complaint.title}</h2>
          <OverdueBadge overdue={complaint.overdue} />
        </div>
        <div className="badge-row">
          <StatusBadge status={complaint.status} />
          <PriorityBadge priority={complaint.priority} />
        </div>
        <span className="category-chip">{categoryIcon(complaint.category)} {complaint.category}</span>
        <p className="muted small">
          Raised {new Date(complaint.createdAt).toLocaleString()} &middot; {complaint.daysOpen} day(s) open
        </p>
        <p>{complaint.description}</p>
        {complaint.photoUrl && (
          <img
            src={`${fileBaseUrl}${complaint.photoUrl}`}
            alt="Complaint"
            className="complaint-photo"
          />
        )}
        {complaint.resident && (
          <p className="muted small">
            Raised by: {complaint.resident.name} ({complaint.resident.flatNo || "N/A"})
          </p>
        )}
      </div>

      <div className="card">
        <h3>Status History</h3>
        <ul className="timeline">
          {complaint.history.map((h) => (
            <li key={h.id}>
              <StatusBadge status={h.status} /> <span className="muted small">
                {new Date(h.createdAt).toLocaleString()} {h.actor ? `by ${h.actor.name}` : ""}
              </span>
              {h.note && <p className="timeline-note">{h.note}</p>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
