const express = require("express");
const prisma = require("../prisma");
const { requireAuth, requireRole } = require("../middleware/auth");
const { sendEmail, importantNoticeEmail } = require("../utils/email");

const router = express.Router();

// Step 1: Everyone logged in can view the notice board, pinned/important first
router.get("/", requireAuth, async (req, res) => {
  try {
    const notices = await prisma.notice.findMany({
      include: { author: { select: { name: true, role: true } } },
      orderBy: [{ isImportant: "desc" }, { createdAt: "desc" }],
    });
    res.json(notices);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not fetch notices." });
  }
});

// Step 2: Admin posts a notice. If marked important, email every resident.
router.post("/", requireAuth, requireRole("ADMIN"), async (req, res) => {
  try {
    const { title, content, isImportant } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required." });
    }

    const notice = await prisma.notice.create({
      data: {
        title,
        content,
        isImportant: Boolean(isImportant),
        authorId: req.user.id,
      },
    });

    if (notice.isImportant) {
      const residents = await prisma.user.findMany({ where: { role: "RESIDENT" } });
      // Fire-and-forget: don't make the admin wait on every email to send
      Promise.all(
        residents.map((r) => {
          const { subject, html } = importantNoticeEmail({
            residentName: r.name,
            title: notice.title,
            content: notice.content,
          });
          return sendEmail({ to: r.email, subject, html });
        })
      ).catch((e) => console.error("Notice email batch error:", e.message));
    }

    res.status(201).json(notice);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not create notice." });
  }
});

module.exports = router;
