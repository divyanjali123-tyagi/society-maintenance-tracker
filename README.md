# 🏢 Society Maintenance Tracker

A full-stack platform for apartment societies to manage maintenance complaints:
residents raise complaints with photos and track their status history, admins
triage complaints by priority and status, overdue issues surface automatically,
and everyone stays informed via a notice board and email notifications.

**Stack:** Node.js + Express + Prisma (SQLite by default, Postgres-ready) · React (Vite) · JWT auth · Multer (photo upload) · Nodemailer (email)

---

## 1. Project Structure

```
society-maintenance-tracker/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # DB schema (User, Complaint, ComplaintHistory, Notice)
│   │   └── seed.js             # Creates a default admin account
│   ├── src/
│   │   ├── index.js            # App entrypoint
│   │   ├── prisma.js           # Prisma client singleton
│   │   ├── middleware/
│   │   │   ├── auth.js         # JWT verification + role guard
│   │   │   └── upload.js       # Multer photo upload config
│   │   ├── routes/
│   │   │   ├── auth.js         # register / login
│   │   │   ├── complaints.js   # complaint lifecycle
│   │   │   ├── notices.js      # notice board
│   │   │   └── dashboard.js    # admin aggregate stats
│   │   └── utils/
│   │       ├── email.js        # nodemailer wrapper + templates
│   │       └── overdue.js      # overdue detection logic
│   ├── uploads/                # uploaded complaint photos (served statically)
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/client.js       # axios instance + JWT interceptor
│   │   ├── context/AuthContext.jsx
│   │   ├── components/Badges.jsx
│   │   ├── pages/               # Login, Register, ResidentComplaints, RaiseComplaint,
│   │   │                        # ComplaintDetail, NoticeBoard, AdminDashboard,
│   │   │                        # AdminComplaints, AdminNotices
│   │   ├── App.jsx              # routes + nav bar
│   │   └── styles.css
│   ├── .env.example
│   └── package.json
├── SYSTEM_DESIGN.md
└── README.md
```

---

## 2. Local Setup Guide (step by step)

### Prerequisites
- Node.js 18+ and npm
- (Optional) A free SMTP account for real emails — e.g. a Gmail account with an
  [App Password](https://myaccount.google.com/apppasswords), or a free tier from
  [Brevo](https://www.brevo.com/) / [Mailtrap](https://mailtrap.io/). If you skip this,
  the app runs in **email debug mode** and just logs emails to the console.

### Step 1 — Clone and enter the project
```bash
git clone <your-repo-url>
cd society-maintenance-tracker
```

### Step 2 — Backend setup
```bash
cd backend
npm install
cp .env.example .env
```
Open `.env` and adjust values if needed (defaults work out of the box with SQLite +
email debug mode — no external services required to try the app locally).

Create the database and tables:
```bash
npx prisma generate
npx prisma migrate dev --name init
```
Seed a default admin account (`admin@society.com` / `Admin@123`):
```bash
npm run seed
```
Start the API server:
```bash
npm run dev
```
The API runs on `http://localhost:5000`.

### Step 3 — Frontend setup (in a new terminal)
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
The app runs on `http://localhost:5173`.

### Step 4 — Try it out
1. Open `http://localhost:5173/register` and create a resident account.
2. Raise a complaint with a photo.
3. Log out, log back in as the admin (`admin@society.com` / `Admin@123`).
4. Set a priority, change the status — the resident's status history updates,
   and an email is logged to the backend console (or actually sent if you
   configured SMTP).
5. Post a notice from **Admin → Notices**, mark it "important" to email every resident.
6. Check **Admin → Dashboard** for totals by status/category and the overdue count.

---

## 3. Environment Variables

### `backend/.env.example`
| Variable | Description |
|---|---|
| `PORT` | Port the API listens on (default `5000`) |
| `CLIENT_URL` | Frontend origin, used for CORS |
| `DB_PROVIDER` | `sqlite` (default, zero-config) or `postgresql` |
| `DATABASE_URL` | Connection string — `file:./dev.db` for SQLite, or a full Postgres URL |
| `JWT_SECRET` | Secret used to sign auth tokens — change this in production |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `7d` |
| `OVERDUE_THRESHOLD_DAYS` | Days a complaint can stay non-resolved before it's flagged overdue |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` / `SMTP_USER` / `SMTP_PASS` | SMTP credentials for any free-tier provider |
| `EMAIL_FROM` | "From" address/name used in outgoing emails |
| `EMAIL_DEBUG` | `true` to log emails to console instead of sending (default for local dev) |

### `frontend/.env.example`
| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL of the backend API, e.g. `http://localhost:5000` |

---

## 4. Switching to Postgres for Production

SQLite is used by default so the project runs with zero external setup. For a
hosted deployment (Render/Railway), switch to Postgres:

1. Provision a free Postgres instance (Render/Railway/Neon/Supabase all have free tiers).
2. In `backend/.env`, set:
   ```
   DB_PROVIDER=postgresql
   DATABASE_URL="postgresql://user:password@host:5432/dbname"
   ```
3. Run migrations against it:
   ```bash
   npx prisma migrate deploy
   npm run seed
   ```

> Note: for **file uploads in production**, the local `uploads/` folder on most
> free hosts (Render/Railway) is ephemeral — it's wiped on redeploy. For a real
> deployment, swap `middleware/upload.js` to upload to a persistent object store
> (e.g. Cloudinary's free tier, or S3) instead of local disk. The current
> implementation uses local disk storage to keep the assignment dependency-light;
> the swap only touches that one file, since the rest of the app just treats
> `photoUrl` as an opaque URL string.

---

## 5. API Documentation

Base URL: `http://localhost:5000/api`
All endpoints except `/auth/*` require header: `Authorization: Bearer <token>`

### Auth
| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Register a resident. Body: `{ name, email, password, flatNo }` |
| POST | `/auth/login` | Public | Log in. Body: `{ email, password }`. Returns `{ token, user }` |

### Complaints
| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | `/complaints` | Resident | Raise a complaint. `multipart/form-data`: `title, category, description, photo?` |
| GET | `/complaints/mine` | Resident | List own complaints with full history |
| GET | `/complaints/:id` | Resident (own) / Admin | Get one complaint with history |
| GET | `/complaints` | Admin | List all complaints. Query: `?category=&status=&dateFrom=&dateTo=`. Overdue items sorted first, then by priority |
| PATCH | `/complaints/:id/priority` | Admin | Body: `{ priority: "LOW"\|"MEDIUM"\|"HIGH" }` |
| PATCH | `/complaints/:id/status` | Admin | Body: `{ status: "OPEN"\|"IN_PROGRESS"\|"RESOLVED", note? }`. Appends history row, emails resident, closes complaint if `RESOLVED` |
| GET | `/complaints/meta/categories` | Any logged in | Returns valid categories/statuses/priorities for form dropdowns |

### Notices
| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/notices` | Any logged in | List notices, important ones pinned to top |
| POST | `/notices` | Admin | Body: `{ title, content, isImportant }`. Emails all residents if `isImportant` |

### Dashboard
| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/dashboard` | Admin | `{ total, byStatus, byCategory, overdueCount }` |

---

## 6. Database Schema (Prisma)

```
User
 ├─ id, name, email (unique), password (hashed), role [RESIDENT|ADMIN], flatNo, createdAt
 ├─ complaints        → Complaint[]         (as resident)
 ├─ statusChanges     → ComplaintHistory[]  (as actor)
 └─ notices           → Notice[]            (as author)

Complaint
 ├─ id, title, category, description, photoUrl, status [OPEN|IN_PROGRESS|RESOLVED]
 ├─ priority [LOW|MEDIUM|HIGH], isClosed, createdAt, updatedAt, resolvedAt
 ├─ residentId → User
 └─ history → ComplaintHistory[]

ComplaintHistory
 ├─ id, complaintId → Complaint, status, note, actorId → User, createdAt

Notice
 ├─ id, title, content, isImportant, authorId → User, createdAt
```

Full source of truth: `backend/prisma/schema.prisma`.

---

## 7. Deployment

- **Backend:** Render / Railway — set the env vars from `.env.example`, use a
  Postgres add-on, run `npx prisma migrate deploy && npm run seed` as a
  pre-deploy/build step, then `npm start`.
- **Frontend:** Vercel / Render Static Site — set `VITE_API_URL` to your
  deployed backend URL, build command `npm run build`, output dir `dist`.
- Remember to set `CLIENT_URL` on the backend to your deployed frontend origin
  (for CORS) and `VITE_API_URL` on the frontend to your deployed backend URL.

---

## 8. Default Accounts (after seeding)

| Role | Email | Password |
|---|---|---|
| Admin | `admin@society.com` | `Admin@123` |
| Resident | (register your own via `/register`) | — |
