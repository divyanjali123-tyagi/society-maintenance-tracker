// A complaint is overdue if it is NOT resolved and has been open longer
// than the configurable threshold (in days), counted from its creation date.
// We compute this on the fly (no separate cron job needed) so it is always
// accurate at read time - simpler and always correct.

function getOverdueThresholdDays() {
  return Number(process.env.OVERDUE_THRESHOLD_DAYS || 3);
}

function isOverdue(complaint) {
  if (complaint.status === "RESOLVED" || complaint.isClosed) return false;
  const thresholdMs = getOverdueThresholdDays() * 24 * 60 * 60 * 1000;
  const ageMs = Date.now() - new Date(complaint.createdAt).getTime();
  return ageMs > thresholdMs;
}

// Attach a computed `overdue` boolean + `daysOpen` to a complaint object
function annotateOverdue(complaint) {
  const ageDays = Math.floor(
    (Date.now() - new Date(complaint.createdAt).getTime()) / (24 * 60 * 60 * 1000)
  );
  return {
    ...complaint,
    daysOpen: ageDays,
    overdue: isOverdue(complaint),
  };
}

module.exports = { isOverdue, annotateOverdue, getOverdueThresholdDays };
