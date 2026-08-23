const express = require("express");
const prisma = require("../prisma");
const { requireAuth, requireRole } = require("../middleware/auth");
const upload = require("../middleware/upload");
const { annotateOverdue } = require("../utils/overdue");
const { sendEmail, statusChangeEmail } = require("../utils/email");

const router = express.Router();

const VALID_CATEGORIES = [
  "Plumbing",
  "Electrical",
  "Housekeeping",
  "Security",
  "Lift",
  "Parking",
  "Common Area",
  "Other",
];
const VALID_STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED"];
const VALID_PRIORITIES = ["LOW", "MEDIUM", "HIGH"];

// ---------- Step 1: Resident raises a complaint (with optional photo) ----------
router.post(
  "/",
  requireAuth,
  requireRole("RESIDENT"),
  upload.single("photo"),
  async (req, res) => {
    try {
      const { title, category, description } = req.body;
      if (!title || !category || !description) {
        return res.status(400).json({ error: "Title, category and description are required." });
      }
      if (!VALID_CATEGORIES.includes(category)) {
        return res.status(400).json({ error: `Category must be one of: ${VALID_CATEGORIES.join(", ")}` });
      }

      const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;

      const complaint = await prisma.complaint.create({
        data: {
          title,
          category,
          description,
          photoUrl,
          residentId: req.user.id,
          status: "OPEN",
          priority: "LOW",
          history: {
            create: {
              status: "OPEN",
              note: "Complaint raised.",
              actorId: req.user.id,
            },
          },
        },
        include: { history: true },
      });

      res.status(201).json(annotateOverdue(complaint));
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message || "Could not create complaint." });
    }
  }
);

// ---------- Step 2: Resident views their own complaints (with history) ----------
router.get("/mine", requireAuth, requireRole("RESIDENT"), async (req, res) => {
  try {
    const complaints = await prisma.complaint.findMany({
      where: { residentId: req.user.id },
      include: { history: { orderBy: { createdAt: "asc" }, include: { actor: { select: { name: true, role: true } } } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(complaints.map(annotateOverdue));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not fetch complaints." });
  }
});

// ---------- Step 3: Get single complaint (resident: own only, admin: any) ----------
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: {
        history: { orderBy: { createdAt: "asc" }, include: { actor: { select: { name: true, role: true } } } },
        resident: { select: { id: true, name: true, email: true, flatNo: true } },
      },
    });
    if (!complaint) return res.status(404).json({ error: "Complaint not found." });
    if (req.user.role === "RESIDENT" && complaint.residentId !== req.user.id) {
      return res.status(403).json({ error: "This is not your complaint." });
    }
    res.json(annotateOverdue(complaint));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not fetch complaint." });
  }
});

// ---------- Step 4: Admin views all complaints, filterable, overdue-first ----------
router.get("/", requireAuth, requireRole("ADMIN"), async (req, res) => {
  try {
    const { category, status, dateFrom, dateTo } = req.query;
    const where = {};
    if (category) where.category = category;
    if (status) where.status = status;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const complaints = await prisma.complaint.findMany({
      where,
      include: {
        resident: { select: { id: true, name: true, email: true, flatNo: true } },
        history: { orderBy: { createdAt: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    const annotated = complaints.map(annotateOverdue);
    // Overdue complaints surface at the top, then by priority (High > Medium > Low)
    const priorityRank = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    annotated.sort((a, b) => {
      if (a.overdue !== b.overdue) return a.overdue ? -1 : 1;
      if (priorityRank[a.priority] !== priorityRank[b.priority]) {
        return priorityRank[a.priority] - priorityRank[b.priority];
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    res.json(annotated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not fetch complaints." });
  }
});

// ---------- Step 5: Admin sets priority ----------
router.patch("/:id/priority", requireAuth, requireRole("ADMIN"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { priority } = req.body;
    if (!VALID_PRIORITIES.includes(priority)) {
      return res.status(400).json({ error: `Priority must be one of: ${VALID_PRIORITIES.join(", ")}` });
    }
    const complaint = await prisma.complaint.update({
      where: { id },
      data: { priority },
    });
    res.json(annotateOverdue(complaint));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not update priority." });
  }
});

// ---------- Step 6: Admin updates status -> recorded in history, resident emailed ----------
router.patch("/:id/status", requireAuth, requireRole("ADMIN"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status, note } = req.body;
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${VALID_STATUSES.join(", ")}` });
    }

    const existing = await prisma.complaint.findUnique({
      where: { id },
      include: { resident: true },
    });
    if (!existing) return res.status(404).json({ error: "Complaint not found." });
    if (existing.isClosed) {
      return res.status(400).json({ error: "This complaint is already resolved and closed." });
    }

    const isResolved = status === "RESOLVED";

    const complaint = await prisma.complaint.update({
      where: { id },
      data: {
        status,
        isClosed: isResolved,
        resolvedAt: isResolved ? new Date() : existing.resolvedAt,
        history: {
          create: {
            status,
            note: note || null,
            actorId: req.user.id,
          },
        },
      },
      include: { history: { orderBy: { createdAt: "asc" } } },
    });

    // Notify resident by email (never blocks the response on failure)
    const { subject, html } = statusChangeEmail({
      residentName: existing.resident.name,
      complaintTitle: existing.title,
      complaintId: existing.id,
      newStatus: status,
      note,
    });
    sendEmail({ to: existing.resident.email, subject, html }).catch((e) =>
      console.error("Email error:", e.message)
    );

    res.json(annotateOverdue(complaint));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not update status." });
  }
});

router.get("/meta/categories", requireAuth, (req, res) => {
  res.json({ categories: VALID_CATEGORIES, statuses: VALID_STATUSES, priorities: VALID_PRIORITIES });
});

module.exports = router;
