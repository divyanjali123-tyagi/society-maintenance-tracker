import React from "react";

export function StatusBadge({ status }) {
  const map = {
    OPEN: "badge badge-open",
    IN_PROGRESS: "badge badge-progress",
    RESOLVED: "badge badge-resolved",
  };
  const label = { OPEN: "Open", IN_PROGRESS: "In Progress", RESOLVED: "Resolved" };
  return <span className={map[status]}>{label[status]}</span>;
}

export function PriorityBadge({ priority }) {
  const map = {
    LOW: "badge badge-low",
    MEDIUM: "badge badge-medium",
    HIGH: "badge badge-high",
  };
  return <span className={map[priority]}>{priority}</span>;
}

export function OverdueBadge({ overdue }) {
  if (!overdue) return null;
  return <span className="badge badge-overdue">⚠ Overdue</span>;
}
