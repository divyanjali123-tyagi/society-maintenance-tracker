System Design Write-Up
1. Complaint History Model

A complaint moves through three states: OPEN, IN_PROGRESS, RESOLVED. I didn't want to just overwrite a single status field every time that happens, because then you lose the whole story of what happened. So instead, every status change gets appended as its own row in a separate ComplaintHistory table:

ComplaintHistory { id, complaintId, status, note, actorId, createdAt }

The Complaint row still keeps its own status field, and that's a deliberate bit of denormalization, not an oversight. The admin's complaints table needs to filter and sort by status constantly, and I didn't want every one of those queries joining out to history and aggregating just to figure out "is this still open?" So Complaint.status is the fast, current-state snapshot, and ComplaintHistory is the actual source of truth for what happened and when. It's append-only, meaning nothing in the app ever edits or deletes a history row.

Each row captures:

status – the state the complaint moved into
note – an optional message from whoever made the change (something like "Plumber scheduled for Tuesday")
actorId – who did it. At creation this is the resident; every update after that is an admin. This is what gives us the audit trail, so you can always answer "who touched this complaint and when."
createdAt – timestamp

One detail I made sure of: the first history row ("Complaint raised") gets created in the same transaction as the complaint itself, so the timeline never has a gap between "complaint exists" and "first history entry." When a complaint gets resolved, isClosed flips to true and resolvedAt gets stamped, and from that point the server refuses any further status changes on it. Closed really means closed.

I considered just storing history as a JSON blob on the complaint row instead, but that gives up too much. A real table means I can query and filter history entries directly (e.g., "show me everything this admin touched last week"), I get referential integrity to User for free via a foreign key, and if we ever want to report on response times per admin, the data's already there in a queryable shape.

2. Overdue Detection

I didn't want "overdue" to be a stored flag that some background job has to flip. That's a whole category of bugs waiting to happen (job doesn't run, timezone gets weird, flag goes stale). Instead it's computed fresh on every read, from just two things: the complaint's createdAt and an OVERDUE_THRESHOLD_DAYS value read from the environment. If a complaint isn't resolved/closed and the time since it was created is past that threshold, it's overdue. That's it, no cron, no worker process, nothing to babysit.

That also means the app stays honest about its own numbers: change OVERDUE_THRESHOLD_DAYS in .env and every complaint's overdue status is correct on the very next request, no backfill script required.

A couple of places this shows up:

The admin complaints list tags each complaint with overdue (boolean) and daysOpen (integer), and sorts so overdue items float to the top, then by priority (HIGH → MEDIUM → LOW), then by recency. Admins shouldn't have to remember to apply an "overdue" filter, it should just be in their face.
The dashboard's overdueCount calls the exact same isOverdue() helper the list uses. One function, one definition of overdue, everywhere it's used, so the dashboard number and the list are never out of sync with each other.
3. Photo Handling

Residents can attach one photo to a complaint, sent as multipart/form-data and handled by Multer. A few guardrails on the way in:

Only image/jpeg, image/png, and image/webp get through; anything else is rejected before it ever touches disk.
5MB size cap, just to keep someone from dumping a huge file in and eating up storage.
Every file gets renamed to complaint-<timestamp>-<random>.<ext> on the way in, so if two residents both upload a file called photo.jpg at the same moment, they don't stomp on each other.

The file itself lands in backend/uploads/ and gets served statically from /uploads/<filename>. The database only ever stores that relative path in Complaint.photoUrl, never the binary. That keeps the DB small and means it doesn't matter whether we're on SQLite for the demo or Postgres in production; the storage layer doesn't care.

Worth flagging honestly: local disk storage is fine for a demo but not something I'd want to ship as-is. Most free hosts (Render, Railway) wipe the filesystem on every redeploy, so photos wouldn't survive. I set it up so that's a small fix rather than a rewrite, though. Swap out middleware/upload.js to stream to something like Cloudinary or S3 and store the CDN URL in that same photoUrl column, and nothing else in the app needs to change. The frontend already just renders whatever URL it's handed.

4. Notification Flow

Two things trigger emails, and both go through one wrapper, utils/email.js, built around Nodemailer:

Status change. When an admin hits PATCH /complaints/:id/status, the history row gets written first, then the resident's email is looked up and a message goes out describing the new status and any note attached. This is fire-and-forget from the API's point of view: the response goes back to the admin right away, and the email fires off in the background, so a flaky SMTP provider can never hang or break the actual status update.
Important notice posted. If an admin creates a notice and marks it isImportant: true, every resident gets emailed at once via Promise.all, same fire-and-forget approach.

Both paths run through the same sendEmail() function, and it has a debug mode. Either you set EMAIL_DEBUG=true, or just leave SMTP credentials unset and it falls into debug mode automatically. In that mode nothing actually gets sent; the subject and body just get logged to the server console. Which means the whole notification flow is demoable and testable locally without signing up for anything. Flip the env var and drop in real SMTP credentials from whatever free-tier provider (Gmail App Password, Brevo, Mailtrap) and it starts sending real mail, no code changes needed.
