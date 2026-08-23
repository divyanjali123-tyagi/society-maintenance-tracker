const express = require("express");
const prisma = require("../prisma");
const { requireAuth, requireRole } = require("../middleware/auth");
const { isOverdue } = require("../utils/overdue");

const router = express.Router();

// Admin dashboard: totals by status, by category, and overdue count
router.get("/", requireAuth, requireRole("ADMIN"), async (req, res) => {
  try {
    const complaints = await prisma.complaint.findMany();

    const byStatus = { OPEN: 0, IN_PROGRESS: 0, RESOLVED: 0 };
    const byCategory = {};
    let overdueCount = 0;

    for (const c of complaints) {
      byStatus[c.status] = (byStatus[c.status] || 0) + 1;
      byCategory[c.category] = (byCategory[c.category] || 0) + 1;
      if (isOverdue(c)) overdueCount++;
    }

    res.json({
      total: complaints.length,
      byStatus,
      byCategory,
      overdueCount,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not build dashboard." });
  }
});

module.exports = router;
