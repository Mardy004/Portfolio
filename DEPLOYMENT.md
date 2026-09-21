# 🚀 Deployment Guide

Two supported topologies — pick one:

- **A. Vercel (frontend) + Render (API)** — the API is a long-lived Express
  process, so uploaded images can live on a mounted disk and nothing is capped by
  serverless limits. Best when you use the admin media library.
- **B. Vercel (frontend) + Vercel (API)** — **two projects from the same
  repository**, both on Vercel. The Express app runs as a serverless function:
  zero idle cost, but the function filesystem is read-only and ephemeral, so
  content must live in Firestore (see
  [Serverless caveats](#7-serverless-caveats-vercel-api)).

```
A:  ┌──────────────────────────┐  HTTPS   ┌────────────────────────────┐
    │ Vercel: frontend/        │ ───────▶ │ Render: server/            │
    │ https://x.vercel.app     │          │ https://x.onrender.com     │
    └──────────────────────────┘          └────────────┬───────────────┘
B:  ┌──────────────────────────┐  HTTPS   ┌────────────────────────────┐
    │ Vercel: frontend/        │ ───────▶ │ Vercel: server/ (function) │
    │ https://x.vercel.app     │          │ https://x-api.vercel.app   │
    └──────────────────────────┘          └────────────┬───────────────┘
                                          Firestore + SMTP (both options)
```

Everything needed is already committed:

| File | Purpose |
| --- | --- |
| `frontend/vercel.json` | Frontend project: Vite build → `dist`, SPA rewrites, cache/security headers |
| `server/vercel.json` | API project: pins the workspace `installCommand` only (Vercel's Express pipeline supplies build + output) |
| `server/src/index.js` | Express entrypoint: `listen()` for local/Render/Docker, auto-detected as the Vercel function |
| `server/src/app.js` | The Express app itself (CORS, middleware, routes, `/api/health`) |
| `render.yaml` | Render blueprint for the API service (topology A) |
| `server/Dockerfile` | Container image for Render / Railway / Fly / Cloud Run / VPS |
| `frontend/src/api/client.ts` | Reads `VITE_API_URL` so the SPA calls the deployed API |

> ⚠️ On Vercel the **output directory is relative to the project's Root
> Directory**. With Root Directory `frontend`, `outputDirectory` must be `dist`
> (never `frontend/dist`) — that mismatch is what produces
> `No Output Directory named "dist" found after the Build completed`.
> Each project must also have its **own** `vercel.json` *inside* its Root
> Directory; a file at the repository root is ignored by both projects.


---

## 0. Before you start

1. **Push the latest code to GitHub**

   ```powershell
   git add .
   git commit -m "chore: deployment configuration for Vercel + Express host"
   git push origin main
   ```

2. **Have these secrets ready**

   | Secret | Where to get it |
   | --- | --- |
   | Firebase service account JSON | Firebase Console → Project settings → Service accounts → *Generate new private key* (the local `server/firebase-service-account.json` works too) |
   | Gmail App Password (16 chars) | Google Account → Security → 2-Step Verification → App passwords |
   | Admin username / password | `ADMIN_USERNAME` / `ADMIN_PASSWORD` (defaults: `mariette250` / `PortoMariettte2026`) |

3. **Optional:** turn the service-account file into a single-line value for
   hosts that prefer one-line secrets:

   ```powershell
   node -e "console.log(JSON.stringify(require('./server/firebase-service-account.json')))"
   ```

   Pasting the file contents verbatim also works (multi-line values are fine).

---

## 1. Deploy the API (Express)

Pick **one** of the three options below.

### Option A — Render blueprint (recommended, uses `render.yaml`)

1. Go to <https://dashboard.render.com> → **New** → **Blueprint**.
2. Connect the GitHub repository and click **Apply**. Render creates
   `mariette-portfolio-api` with root directory `server`, build `npm install`,
   start `npm start`, health check `/api/health`, Node 22 and the free plan.
3. Render asks for the values marked `sync: false` in `render.yaml`
   (`ADMIN_PASSWORD`, `CLIENT_ORIGIN`, `FIREBASE_SERVICE_ACCOUNT`,
   `SMTP_USER`, `SMTP_PASS`). You can leave `CLIENT_ORIGIN` empty for now and
   fill it in at [step 3](#3-allow-the-vercel-origin-on-the-api).
4. Wait for the first deploy to finish, then note the URL —
   `https://mariette-portfolio-api.onrender.com` (or your chosen service name).

### Option B — Render manual web service

**New** → **Web Service** → connect the repo, then:

| Setting | Value |
| --- | --- |
| Root Directory | `server` |
| Runtime | Node |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Health Check Path | `/api/health` |
| Instance Type | Free |

Add the environment variables from
[the reference](#-environment-variable-reference) — `PORT` is injected by Render
automatically, so do not set it.

### Option C — Vercel (serverless function, topology B)

Vercel ships **zero-configuration Express support**: it locates the file that
exports your app (or starts it with `listen()`) and turns it into a Node.js
function. In this project that file is `server/src/index.js`, which is one of the
documented detection locations (`app` / `index` / `server` at the project root or
under `src/`). Every request — `/api/...` and `/uploads/...` alike — is then
handled by the same Express app, so no rewrites are needed.

1. Vercel → **Add New… → Project** → import the same repository (project name
   `mariette-portfolio-api` → `https://mariette-portfolio-api.vercel.app`).
2. **Root Directory** → `server`.
3. **Leave Build Command and Output Directory EMPTY.** Delete any override you
   added under *Settings → Build & Development Settings* — that override is what
   produces `No entrypoint found in output directory: "…"`, because Vercel then
   searches that folder for a server entrypoint instead of your project.

   `server/vercel.json` deliberately contains a single line:

   ```json
   {
     "installCommand": "cd .. && npm install"
   }
   ```

   The install command runs at the repository root so npm resolves this workspace
   and installs the hoisted dependencies. No `buildCommand` and no
   `outputDirectory` — Vercel's Express pipeline supplies those itself.
4. **Environment Variables** (Production *and* Preview):

   | Name | Value |
   | --- | --- |
   | `NODE_ENV` | `production` |
   | `JWT_SECRET` | a long random string |
   | `ADMIN_USERNAME` / `ADMIN_PASSWORD` | your admin login (seeded on first boot only) |
   | `CLIENT_ORIGIN` | `https://<frontend>.vercel.app,https://*.vercel.app` |
   | `FIREBASE_SERVICE_ACCOUNT` | the service-account JSON on **one line** — required on Vercel, the function filesystem is read-only |
   | `SMTP_HOST`/`SMTP_PORT`/`SMTP_SECURE`/`SMTP_USER`/`SMTP_PASS`/`MAIL_TO` | your mail settings |

   Single-line key (also see [Serverless caveats](#6-serverless-caveats-vercel-api)):

   ```powershell
   node -e "console.log(JSON.stringify(require('./server/firebase-service-account.json')))"
   ```

5. Deploy, then verify:

   ```powershell
   Invoke-RestMethod https://mariette-portfolio-api.vercel.app/api/health
   # storage: firestore   ← "local" means FIREBASE_SERVICE_ACCOUNT is missing/damaged
   Invoke-RestMethod https://mariette-portfolio-api.vercel.app/api/contact/status
   ```

6. Copy the project URL into the frontend project as `VITE_API_URL` (step 3 of
   [section 2](#2-deploy-the-frontend-to-vercel)) and redeploy the frontend.

Unlike Render's free plan, **Vercel Functions can send SMTP**, so the existing
Gmail settings (`smtp.gmail.com:465`) work unchanged.

Optional pre-flight before pushing: install the Vercel CLI once (`npm i -g vercel`),
run `vercel link` inside `server/`, then:

```bash
cd server
npx vercel dev --listen 3000     # emulates the function + rewrites locally
curl http://localhost:3000/api/health
```

That reproduces how Vercel turns `server/src/index.js` into a function and routes
requests to it, before you spend a deployment on it.

### Verify the API

```powershell
Invoke-RestMethod https://mariette-portfolio-api.onrender.com/api/health
# success : True | message : Portfolio API is running. | storage : firestore
Invoke-RestMethod https://mariette-portfolio-api.onrender.com/api/contact/status
```

Check the Render **Logs** tab for:

```
[firebase] Connected to Firestore (project: portfolio-4c701).
[seed] Admin account ready (username: mariette250).
Portfolio API listening on 0.0.0.0:10000
```

If the log instead says `using local JSON store` (or prints the
`[storage] WARNING`), the service-account value is missing/wrong — see
[Persistence](#5-persistence-important).

> ⚠️ **Free Render instances cannot send email over SMTP.** Render blocks
> outbound traffic on ports **25, 465 and 587**, so the Gmail settings
> (`smtp.gmail.com:465`) will save the message but fail delivery. Either
>   - use an HTTPS/API-based relay that also offers **port 2525** — e.g.
>     `SMTP_HOST=smtp.sendgrid.net`, `SMTP_PORT=2525`, `SMTP_SECURE=false`,
>     `SMTP_USER=apikey`, `SMTP_PASS=<SendGrid API key>` (Mailgun/Postmark
>     equivalents work too), or
>   - upgrade to a paid instance type, or
>   - host the API somewhere that allows SMTP (Railway, Fly.io, a VPS).
>
> The inbox in Admin → Messages still receives every message either way.

---

## 2. Deploy the frontend to Vercel

1. Vercel → **Add New… → Project** → import the repository. Name the project
   `mariette-portfolio` → `https://mariette-portfolio.vercel.app`.
2. **Root Directory** → `frontend` (click *Edit* next to the setting).
   This is mandatory: `frontend/vercel.json` is only read from inside the Root
   Directory, and every path in it is resolved relative to that directory.
3. Framework Preset → **Vite** (pinned in `frontend/vercel.json`), which defines:

   ```json
   {
     "framework": "vite",
     "installCommand": "cd .. && npm install",
     "buildCommand": "npm run build",
     "outputDirectory": "dist",
     "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
   }
   ```

   - `installCommand` runs at the repository root so npm resolves this workspace
     and installs the hoisted dependencies (`vite`, `typescript`, …).
   - `outputDirectory: "dist"` is relative to `frontend/`; the build writes
     `frontend/dist`.
   - The rewrite is what makes deep links such as `/admin` work in a React
     Router SPA (refresh-safe, no 404).

3. **Settings → Environment Variables** → add:

   | Name | Value | Environments |
   | --- | --- | --- |
   | `VITE_API_URL` | `https://mariette-portfolio-api.onrender.com` (no trailing slash, no `/api`) | Production, Preview, Development |

4. **Deploy**. The site comes up at `https://<project>.vercel.app`.

   > `VITE_API_URL` is inlined at build time. After changing it you must
   > **Redeploy** (Deployments → ⋯ → Redeploy with "Use existing Build Cache"
   > unchecked) for the new value to reach the browser.

---

## 3. Allow the Vercel origin on the API

CORS is enforced by the API, so it has to know the frontend URL:

1. Render → `mariette-portfolio-api` → **Environment** → set

   ```
   CLIENT_ORIGIN=https://<project>.vercel.app,https://*.vercel.app
   ```

   Comma-separated values are supported and `*` matches preview deployments
   (e.g. `https://portfolio-git-feature-mardy004.vercel.app`). Add your custom
   domain here as well once it is live.
2. Save — Render redeploys automatically.
3. Confirm the header is returned:

   ```powershell
   curl.exe -i -X OPTIONS "https://mariette-portfolio-api.onrender.com/api/projects" `
     -H "Origin: https://<project>.vercel.app" `
     -H "Access-Control-Request-Method: GET"
   ```

   Expect `access-control-allow-origin: https://<project>.vercel.app` in the
   response. Blocked origins are logged as `[cors] Blocked origin: …`.

---

## 4. End-to-end checklist

| # | Check | Expected |
| --- | --- | --- |
| 1 | `https://<project>.vercel.app` | Hero, skills, projects and experience render with real data |
| 2 | Refresh `https://<project>.vercel.app/admin` | Login page renders (not a Vercel 404) |
| 3 | Sign in with the admin credentials | Dashboard with counts |
| 4 | Create/edit a project in the admin portal | Change appears on the public site after refresh |
| 5 | Upload an image in Admin → Media | Preview renders (URL resolves to the API origin) |
| 6 | Submit the contact form | Success message, email in `MAIL_TO`, thank-you email to the visitor |
| 7 | `https://mariette-portfolio-api.onrender.com/api/health` | `success: true`, `storage: firestore` |

---

## 5. Persistence (important)

Free hosting filesystems are **ephemeral**: anything written to disk is lost on
redeploy/restart. Free Render services also spin down after ~15 minutes of
inactivity, so the first request afterwards takes ~30-60 s to wake up.

| Data | Where it lives | Survives a free host? |
| --- | --- | --- |
| Content (profile, projects, skills, experience, messages, admin user) | Firestore when `FIREBASE_SERVICE_ACCOUNT` is set, otherwise `server/data/db.json` | ✅ Firestore · ❌ local JSON |
| Uploaded images | `UPLOAD_DIR` (`server/uploads` by default) | ❌ unless a persistent disk is mounted |

So:

- **Keep `FIREBASE_SERVICE_ACCOUNT` set** — that is what keeps content between
  deploys, and Firestore already holds the profile/projects you manage in the
  admin portal.
- **For uploads**, either move to a paid Render instance type (free instances
  don't support persistent disks at all) and mount a disk: set
  `DATA_DIR=/var/data` and `UPLOAD_DIR=/var/data/uploads` with a disk mounted at
  `/var/data`, or paste an external image URL in the project form. Local
  development is unaffected — the defaults stay `server/data` and
  `server/uploads`.

> `ADMIN_USERNAME` / `ADMIN_PASSWORD` are only read the **first** time the admin
> document is created. Afterwards change the credentials from the admin portal
> (or `PUT /api/auth/credentials`) — editing the env vars will not reset an
> existing password.

---

## 6. Serverless caveats (Vercel API)

Running the API as a Vercel Function (topology B) trades a few things away. The
code copes with all of them, but data behaves differently:

| Area | On Vercel Functions | Consequence |
| --- | --- | --- |
| Filesystem | Read-only except `/tmp` | `DATA_DIR` / `UPLOAD_DIR` fall back to a temp dir automatically (the log shows `… is not writable — using …`). **Always set `FIREBASE_SERVICE_ACCOUNT`**, or content resets whenever the function recycles |
| Uploaded images | `/tmp` only | Images added in the admin media library vanish after a cold start. Use external image URLs, or run the API on Render/a VPS (topology A) with a mounted disk |
| Request body | 4.5 MB platform cap | `UPLOAD_MAX_MB=4` is the default; bigger uploads are rejected with 413 before Express sees them |
| Process lifetime | Instances sleep, cold start ≈ 1 s | First request after idle is slower — fine for a portfolio |
| Boot work | No long-lived process | Firestore, SMTP and seeding run once per instance via `server/src/init.js`, before the first data request |
| SMTP | Allowed | The Gmail settings work as-is (Render's free plan blocks ports 25/465/587) |
| Background jobs | Not supported | Not needed — email sending is awaited inside the request |

The URL layout is identical to the Render deployment:
`https://<api-project>.vercel.app/api/health`, `…/api/projects`, `…/uploads/<file>`.

## 7. Custom domains

1. Vercel → Project → **Domains** → add `www.example.com` and follow the DNS
   instructions.
2. Add that domain to `CLIENT_ORIGIN` on Render (comma-separated) and save.
3. Leave `VITE_API_URL` pointing at the API domain — the browser calls it
   directly, so the two deployments stay independent.

---

## 8. Alternative hosts

**Railway / Heroku-style platforms**

| Setting | Value |
| --- | --- |
| Root Directory | `server` |
| Build | `npm install` |
| Start | `npm start` |

`PORT` is injected automatically; add the same environment variables as Render.

**Docker (Fly.io, Cloud Run, any VPS)** — the image lives in `server/`:

```bash
docker build -t mariette-portfolio-api ./server
docker run -p 4000:4000 --env-file server/.env -v portfolio-data:/data mariette-portfolio-api
```

Inside the image `DATA_DIR=/data` and `UPLOAD_DIR=/data/uploads`, so the named
volume keeps the JSON store *and* the uploaded images. Pass
`FIREBASE_SERVICE_ACCOUNT` as an env var — the key file is excluded from the
image by `server/.dockerignore`.

**Single-service mode (no split)** — build the frontend and let Express serve it:

```bash
npm run build        # server + frontend
npm start            # API + SPA on :4000
```

Use that server URL as `CLIENT_ORIGIN`, and build the frontend **without**
`VITE_API_URL` so the SPA calls its own origin.

---

## 9. Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| `Cannot reach the API at …` on the deployed site | `VITE_API_URL` is missing/wrong, or it was added after the last build → redeploy Vercel |
| Console: *blocked by CORS policy* | The Vercel URL is not in `CLIENT_ORIGIN`; check the API log for `[cors] Blocked origin: …` and add it |
| Admin login returns 401 with the correct password | The admin document was seeded earlier with different `ADMIN_*` values (or the local store was reset). `GET /api/health` shows which storage engine the API is using |
| Content disappears after every deploy | Local JSON store on an ephemeral filesystem → set `FIREBASE_SERVICE_ACCOUNT`, or mount a disk and set `DATA_DIR` |
| Uploaded images 404 | `UPLOAD_DIR` is on an ephemeral disk — mount a persistent disk or host the images externally |
| Contact form reports "email delivery failed" | Wrong SMTP credentials: use a Gmail **App Password**, `SMTP_PORT=465`, `SMTP_SECURE=true`; inspect `GET /api/contact/status` and the Render logs |
| Contact form still fails on Render **free** (`Connection timeout`, `ECONNREFUSED`) | Render free blocks SMTP ports 25/465/587 → switch to a relay on **port 2525** (`SMTP_PORT=2525`, `SMTP_SECURE=false`) or upgrade the instance type; see the warning in [step 1](#1-deploy-the-api-express-to-render) |
| Vercel build fails with `tsc: not found` | Dependencies were installed without devDependencies — keep the default `installCommand: npm install` |
| `No Output Directory named "dist" found after the Build completed` | The project's Root Directory and `outputDirectory` disagree. With Root Directory `frontend`, `outputDirectory` must be `dist` (see `frontend/vercel.json`) — never `frontend/dist` |
| `Cannot find module 'express'` while building the API project | The API project's Root Directory is not `server`, so the workspace install never ran — set Root Directory `server` and keep `installCommand: "cd .. && npm install"` |
| API project deploys, but `/api/health` returns 404 | The Express entrypoint was not detected: Root Directory must be `server` and `server/src/index.js` must keep its `app.listen(...)` call / `export default app` |
| `No entrypoint found in output directory: "…"` (API project) | An **Output Directory** override is set (dashboard *or* `vercel.json`). Vercel's Express pipeline then searches that folder for `app`/`index`/`server.{js}` — clear the override so it searches the project root and finds `server/src/index.js` |
| `413 Request Entity Too Large` when uploading an image | Vercel caps request bodies at 4.5 MB; keep `UPLOAD_MAX_MB=4` (or host the API on Render/a VPS) |
| Deployed API reports `storage: local` on `/api/health` | `FIREBASE_SERVICE_ACCOUNT` is unset or invalid. On Vercel the "local" store is a temp file that dies with the instance |
| Browser still calls `localhost:5173/api/...` | `VITE_API_URL` was added after the frontend build — redeploy Vercel with *Use existing Build Cache* unchecked |
| First request after idle is slow | Free Render instances sleep (upgrade or ping `/api/health`); Vercel functions cold-start in ~1 s |

---

## 🔑 Environment variable reference

**Frontend (Vercel)**

| Name | Required | Example | Notes |
| --- | --- | --- | --- |
| `VITE_API_URL` | ✅ for a split deploy | `https://mariette-portfolio-api.onrender.com` | Empty for local dev / single-service mode; inlined at build time |

**Backend (Render / Railway / Docker)**

| Name | Required | Example | Notes |
| --- | --- | --- | --- |
| `PORT` | auto | `10000` | Injected by the host |
| `HOST` | – | `0.0.0.0` | Default is already `0.0.0.0` |
| `NODE_ENV` | ✅ | `production` | Enables the local-store warning at boot |
| `CLIENT_ORIGIN` | ✅ | `https://app.vercel.app,https://*.vercel.app` | Comma-separated list; `*` wildcards allowed |
| `JWT_SECRET` | ✅ | long random string | Render can generate it (`generateValue`) |
| `JWT_EXPIRES_IN` | – | `12h` | Admin session lifetime |
| `ADMIN_USERNAME` | ✅ (first boot) | `mariette250` | Seeds the admin account |
| `ADMIN_PASSWORD` | ✅ (first boot) | strong password | Only used when the admin doc does not exist yet |
| `FIREBASE_SERVICE_ACCOUNT` | ✅ | service-account JSON | Keeps content between deploys |
| `FIREBASE_SERVICE_ACCOUNT_FILE` | – | `/etc/secrets/key.json` | Alternative to the inline JSON |
| `USE_LOCAL_STORE` | – | `false` | Force the local JSON store |
| `DATA_DIR` | – | `/var/data` | Persistent disk location for `db.json` (falls back to temp on read-only hosts) |
| `UPLOAD_DIR` | – | `/var/data/uploads` | Persistent disk location for images (falls back to temp on read-only hosts) |
| `UPLOAD_MAX_MB` | – | `4` | Max image size; keep ≤ 4 on Vercel (4.5 MB request cap) |
| `SMTP_HOST` | ✅ | `smtp.gmail.com` | Nodemailer transport |
| `SMTP_PORT` | ✅ | `465` | Render **free** blocks 465/587 — use `2525` with an API-based relay (SendGrid/Mailgun) |
| `SMTP_SECURE` | ✅ | `true` | |
| `SMTP_USER` | ✅ | `you@gmail.com` | Gmail address |
| `SMTP_PASS` | ✅ | 16-char app password | Never commit it |
| `MAIL_TO` | ✅ | `ikiuzwemariette@gmail.com` | Contact-form inbox |

