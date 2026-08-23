# System Design Write-Up

## 1. Complaint History Model

A complaint's lifecycle is `OPEN → IN_PROGRESS → RESOLVED`. Rather than
overwriting a single `status` column and losing the past, every change is
appended as a new row in a separate `ComplaintHistory` table:

```
ComplaintHistory { id, complaintId, status, note, actorId, createdAt }
```

The `Complaint` row itself keeps a `status` field too (a denormalized "current
state") purely so list/filter queries stay simple and fast — the admin
complaints table doesn't need to join and aggregate history just to know a
complaint's current status. But the *source of truth* for "what happened and
when" is always the history table, which is append-only and never edited or
deleted. Each row records:

- **status** — the state the complaint moved into
- **note** — an optional free-text note from the actor (e.g. "Plumber
  scheduled for Tuesday")
- **actorId** — who made the change (the resident, at creation; the admin, on
  every subsequent update), giving a full audit trail of who touched what
- **createdAt** — timestamp

The very first row is created atomically with the complaint itself ("Complaint
raised"), so the timeline always starts at creation rather than at the first
admin action. When a complaint is resolved, `isClosed` is set to `true` and
`resolvedAt` is stamped; closed complaints are locked from further status
changes (enforced server-side), matching the requirement that resolving a
complaint closes it.

This design was chosen over alternatives like a JSON blob of history on the
complaint row because a relational table lets us query, filter, and sort
history entries (e.g. "who last touched this"), enforces referential
integrity to `User` via a foreign key, and scales cleanly if we later want to
report on admin response times per person.

## 2. Overdue Detection

Overdue status is **not** stored as a column that a background job flips —
it's computed on every read from two inputs: the complaint's `createdAt` and
a configurable `OVERDUE_THRESHOLD_DAYS` environment variable. A complaint is
overdue if it is not `RESOLVED`/`isClosed` and `now - createdAt` exceeds the
threshold. This is deliberately stateless:

- **No cron job or scheduler needed**, which removes an entire class of bugs
  (stale flags if the job doesn't run, timezone drift, etc.) and keeps the
  app deployable on any free-tier host without a worker process.
- **Always accurate**: the moment you change `OVERDUE_THRESHOLD_DAYS` in
  `.env`, every complaint's overdue status re-evaluates correctly on the next
  request — no backfill needed.
- The admin complaints list annotates each complaint with `overdue` (boolean)
  and `daysOpen` (integer), then **sorts overdue complaints to the top**,
  followed by priority (`HIGH → MEDIUM → LOW`) and recency — satisfying the
  requirement that overdue items surface prominently without a separate
  "overdue" filter the admin has to remember to apply.
- The dashboard's `overdueCount` uses the same `isOverdue()` helper so the
  number on the dashboard always matches what's flagged in the list — one
  function, one definition of "overdue," used everywhere.

## 3. Photo Handling

Residents can attach one photo per complaint via `multipart/form-data`,
handled by Multer. On upload:

1. Only `image/jpeg`, `image/png`, `image/webp` are accepted; anything else
   is rejected with a clear error before it touches disk.
2. File size is capped at 5MB to prevent abuse.
3. Each file is renamed to a collision-proof `complaint-<timestamp>-<random>.<ext>`
   so two residents uploading `photo.jpg` at once never clash.
4. The file is written to `backend/uploads/` and served statically at
   `/uploads/<filename>`; the `Complaint.photoUrl` column stores just that
   relative path, not the binary — keeping the database small and portable
   between SQLite (demo) and Postgres (production).

For a real production deployment, local disk storage is a known limitation:
most free hosts (Render, Railway) use ephemeral filesystems, so uploaded
photos would be lost on redeploy. The system is intentionally decoupled so
this is a one-file change — swapping `middleware/upload.js` to stream to
Cloudinary/S3 and store the resulting CDN URL in the same `photoUrl` column,
with zero changes needed anywhere else in the app (the frontend already just
renders whatever URL it's given).

## 4. Notification Flow

Two events trigger email notifications, both handled by a single
`utils/email.js` wrapper around Nodemailer:

- **Complaint status change**: when an admin calls `PATCH
  /complaints/:id/status`, after the history row is written the resident's
  email is looked up and an email is fired describing the new status and any
  note. This is **fire-and-forget** relative to the HTTP response — the API
  responds immediately with the updated complaint, and the email send happens
  asynchronously so a slow/broken SMTP provider never blocks or fails the
  admin's action.
- **Important notice posted**: when an admin creates a notice with
  `isImportant: true`, every resident is emailed in parallel
  (`Promise.all`), again fire-and-forget.

Both paths funnel through the same `sendEmail()` function, which has a
**debug mode** (`EMAIL_DEBUG=true`, or simply missing SMTP credentials): in
that mode, instead of attempting to send, the email subject/body is logged to
the server console. This means the entire notification flow can be
demonstrated and tested locally with zero external accounts, while a real
deployment only needs to flip one env var and supply SMTP credentials from
any free-tier provider (Gmail App Password, Brevo, Mailtrap) to start sending
real mail — no code changes required.
