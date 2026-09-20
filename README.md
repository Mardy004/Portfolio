# Mariette Ikuzwe — Developer Portfolio

A modern, fully responsive developer portfolio with a **protected admin portal**.
The project is split into two independent sources:

```
my-portfolio/
├── server/     → Express API: Firebase/Firestore, auth, CRUD, uploads, email
├── frontend/   → React + TypeScript + Vite: public portfolio + admin dashboard
└── package.json → npm workspaces that orchestrate both
```

- **Public site** (`/`) — hero, about, skills, project carousel, experience, contact.
- **Admin portal** (`/admin`) — secure login + full content management.

---

## ✨ Features

| Area | Details |
| --- | --- |
| Public portfolio | Animated hero with typing effect, about, skills bars, **filterable autoplay carousel** for projects, experience timeline, contact form |
| Design | Dark/light theme (persisted), cyan → violet gradient accents, `Sora` / `Inter` / `JetBrains Mono` fonts, fluid `clamp()` typography, CSS design tokens |
| Responsiveness | Mobile drawer nav, collapsible admin sidebar, snap-scrolling carousel, grid layouts that reflow from 1 → 4 columns |
| Admin security | JWT sessions, scrypt password hashing, all write/delete + message routes protected by `Authorization: Bearer <token>` |
| Admin features | Dashboard stats, CRUD for projects / skills / experience / profile, message inbox (read/unread, reply), media library with image upload |
| Storage | Auto-detects **Firebase Firestore** (via service account) or falls back to a **local JSON store** so it runs with zero setup |
| Email | Nodemailer contact form → notifies owner + auto-replies to the visitor |

---

## 🔐 Default Admin Credentials

| Field | Value |
| --- | --- |
| URL | `http://localhost:5173/admin` |
| Username | `mariette250` |
| Password | `PortoMariettte2026` |

> The account is seeded automatically on the server's first boot from
> `server/.env` (`ADMIN_USERNAME` / `ADMIN_PASSWORD`).

---

## 🚀 Quick Start

### 1. Install dependencies (installs both workspaces)

```bash
npm install
```

If you cloned this repo without the workspace install, run instead:

```bash
npm run install:all
```

### 2. Configure the server (already provided)

A ready-to-use `server/.env` is included with the Firebase + SMTP credentials.
To start from scratch copy the template:

```bash
copy server\.env.example server\.env      # Windows
# cp server/.env.example server/.env      # macOS / Linux
```

### 3. Run both apps together (recommended)

```bash
npm run dev
```

- Frontend → http://localhost:5173
- Backend  → http://localhost:4000

Vite proxies `/api` and `/uploads` to the backend automatically, so no
frontend configuration is needed.

### Run them separately (optional)

```bash
npm run dev:server      # starts Express on :4000
npm run dev:frontend    # starts Vite on :5173
```

---

## 🧪 Testing the Project

### 1. Verify the backend is healthy

Open http://localhost:4000/api/health — you should see:

```json
{ "success": true, "message": "Portfolio API is running." }
```

### 2. Test the public site

Visit http://localhost:5173 and check:

- The hero loads with the animated role text.
- Toggle the theme (top-right sun/moon button).
- Scroll through **About → Skills → Projects → Experience → Contact**.
- In **Projects**, use the category filters and the carousel arrows / dots
  (autoplay pauses on hover).
- Submit the **contact form** — a success message appears (an email is sent if
  SMTP is configured).

### 3. Test the admin login & security

1. Go to http://localhost:5173/admin — you are redirected to **/admin/login**.
2. Sign in with `mariette250` / `PortoMariettte2026`.
3. You land on the dashboard showing content counts and recent messages.

Security checks:

- Visiting `/admin/projects` while logged out redirects to the login page.
- The API rejects anonymous writes — e.g. `GET /api/messages` returns **401**
  without a valid token.

### 4. Test content management

- **Projects** — "New project", upload an image (or paste a URL), save, edit,
  delete. Refresh the public site to see changes.
- **Skills** — add a skill and pick a level (Beginner, Intermediate (Lower),
  Intermediate (Upper), Advanced).
- **Experience** — add a role with highlights (one per line). The timeline is
  sorted by year, and roles ending in **Present** (or with a blank end date) are
  always listed first.
- **Profile** — update name, bio, socials and stats; press **Save profile**.
- **Messages** — open a message (auto-marked read), reply by email, delete.
- **Media** — upload images, copy a URL, delete from the library.

### 5. Test the contact form end-to-end

Submit the form on the public site, then open **/admin → Messages** to see the
stored message. If SMTP is configured you (owner) receive an email and the
visitor receives an acknowledgement.

---

## 🏗️ Build Verification

Both sources build independently and are wired into the root scripts:

```bash
npm run build            # builds server AND frontend
npm run build:server     # syntax/import check + copies server → server/dist
npm run build:frontend   # tsc type-check + vite production build
```

Expected output:

- `server/` → `[build] Server modules OK.` + `server/dist`
- `frontend/` → `✓ built in …` + `frontend/dist`

To preview the production frontend:

```bash
npm run preview --workspace frontend
```

### Single-command production run

When `frontend/dist` exists the Express server also serves it, so you can run
everything from the backend:

```bash
npm run build
npm run start            # http://localhost:4000 serves the API + built site
```

---

##  API Reference

Base URL: `http://localhost:4000/api`

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| GET | `/health` | – | Health check |
| POST | `/auth/login` | – | `{ username, password }` → token |
| GET | `/auth/me` | ✅ | Current admin |
| PUT | `/auth/credentials` | ✅ | Change username / password |
| GET | `/profile` | – | Public profile |
| PUT | `/profile` | ✅ | Update profile |
| GET | `/projects` · `/skills` · `/experience` | – | List content |
| POST | `/projects` · `/skills` · `/experience` | ✅ | Create item |
| PUT | `/projects/:id` · … | ✅ | Update item |
| DELETE | `/projects/:id` · … | ✅ | Delete item |
| POST | `/contact` | – | Submit contact message |
| GET | `/messages` | ✅ | Inbox (admin only) |
| PATCH | `/messages/:id` | ✅ | Mark read/unread |
| DELETE | `/messages/:id` | ✅ | Delete message |
| POST | `/uploads` | ✅ | Upload image (multipart `file`) |
| GET | `/uploads` | ✅ | Media library |
| DELETE | `/uploads/:id` | ✅ | Remove media record |

---

## 🔥 Firebase Notes

The Firebase **web** config is present in `server/.env`. The backend connects
to **Firestore** through the Admin SDK when a service account is supplied.

- **Firestore mode (active):** the service-account key is loaded from
  `server/firebase-service-account.json` (or the path in
  `FIREBASE_SERVICE_ACCOUNT_FILE`, or inline JSON in
  `FIREBASE_SERVICE_ACCOUNT`). On boot the server logs
  `Connected to Firestore (project: portfolio-4c701).` and the storage engine
  shows as `firestore`.
- **Zero-config fallback:** if no key is found, the API transparently uses a
  local JSON store at `server/data/db.json` so everything still works.

> The service-account key is a secret and is excluded via `.gitignore`.
> To rotate it, generate a new key from
> **Firebase Console → Project settings → Service accounts → Generate new
> private key** and replace `server/firebase-service-account.json`.

Uploaded images are stored in `server/uploads/` and served at `/uploads/…`.

---

## 📁 Project Structure

```
server/
├── src/
│   ├── index.js               # Express app + route wiring
│   ├── config/
│   │   ├── firebase.js        # Admin SDK init (with local fallback)
│   │   ├── store.js           # Firestore ⇄ local JSON abstraction
│   │   ── seed.js            # Seeds admin, profile, skills, projects…
│   ├── middleware/upload.js   # Multer image upload
│   ├── routes/                # auth, profile, crud, uploads, contact, messages
│   ── utils/                 # auth (JWT + scrypt), mailer (Nodemailer)
└── scripts/build.js           # module check + dist copy

frontend/
── src/
    ├── api/                   # fetch client + shared TypeScript types
    ├── components/            # Navbar, Footer, ThemeToggle, AdminRoute
    ├── context/               # ThemeContext, AuthContext
    ├── hooks/                 # useContent, useReveal
    ├── pages/                 # Home + admin/* pages
    ├── sections/              # Hero, About, Skills, Projects, Experience, Contact
    └── styles/                # global.css (design system) + admin.css
```

---

## 🧰 Tech Stack

**Frontend:** React 19 · TypeScript · Vite · React Router 7 · react-icons
**Backend:** Node.js (ESM) · Express · Firebase Admin SDK · JWT · Multer · Nodemailer
**Tooling:** npm workspaces · concurrently · ESLint

---

##  Scripts Cheat Sheet

| Command | What it does |
| --- | --- |
| `npm install` | Install all workspaces |
| `npm run dev` | Run backend + frontend concurrently |
| `npm run dev:server` | Backend only (`:4000`) |
| `npm run dev:frontend` | Frontend only (`:5173`) |
| `npm run build` | Build server then frontend |
| `npm run build:server` | Validate + bundle the backend |
| `npm run build:frontend` | Type-check + production build |
| `npm run start` | Serve API + built frontend from `:4000` |
| `npm run lint --workspace frontend` | Lint the frontend |