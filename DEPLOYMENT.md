# 🚀 Deployment Guide

How to run this portfolio in production:

```
┌──────────────────────────┐        ┌────────────────────────────┐
│  Vercel (static build)   │ HTTPS  │  Render (Express API)      │
│  frontend/ → React SPA   │ ─────▶ │  server/ → /api, /uploads  │
│  https://app.vercel.app  │        │  https://api.onrender.com  │
└──────────────────────────┘        └────────────┬───────────────┘
                                                 │
                                    Firestore (content) + SMTP (email)
```

The frontend is a static bundle, so it belongs on Vercel. The API is a
long-running Express process (JWT auth, Nodemailer, Multer uploads, Firestore),
so it needs a Node host such as **Render** (steps below), Railway or Fly.io.

Everything needed is already committed:

| File | Purpose |
| --- | --- |
| `vercel.json` | Vercel build (`npm run build:frontend` → `frontend/dist`) + SPA rewrites + caching headers |
| `render.yaml` | Render blueprint for the API service |
| `server/Dockerfile` | Container image for Render/Railway/Fly/Cloud Run/VPS |
| `server/src/index.js` | Reads `PORT`/`HOST`, lets the Vercel origin through CORS, serves `/api/health` |
| `frontend/src/api/client.ts` | Reads `VITE_API_URL` so the SPA calls the deployed API |

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

## 1. Deploy the API (Express) to Render

### Option A — Blueprint (recommended, uses `render.yaml`)

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

### Option B — Manual web service

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

1. Go to <https://vercel.com/new> and import the same GitHub repository.
2. Leave **Root Directory** at the repository root and do **not** override the
   Build/Output settings — `vercel.json` already defines them:

   ```json
   {
     "installCommand": "npm install",
     "buildCommand": "npm run build:frontend",
     "outputDirectory": "frontend/dist",
     "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
   }
   ```

   The rewrite is what makes deep links such as `/admin` work in a React Router
   SPA (refresh-safe, no 404).

   *Alternative:* set Root Directory to `frontend` and pick the Vercel **Vite**
   preset (Build `npm run build`, Output `dist`) — then delete the root
   `vercel.json` so the two configurations cannot conflict.

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

## 6. Custom domains

1. Vercel → Project → **Domains** → add `www.example.com` and follow the DNS
   instructions.
2. Add that domain to `CLIENT_ORIGIN` on Render (comma-separated) and save.
3. Leave `VITE_API_URL` pointing at the API domain — the browser calls it
   directly, so the two deployments stay independent.

---

## 7. Alternative hosts

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

## 8. Troubleshooting

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
| First request after idle is slow | Render free instances sleep; upgrade the plan or ping `/api/health` periodically |

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
| `DATA_DIR` | – | `/var/data` | Persistent disk location for `db.json` |
| `UPLOAD_DIR` | – | `/var/data/uploads` | Persistent disk location for images |
| `SMTP_HOST` | ✅ | `smtp.gmail.com` | Nodemailer transport |
| `SMTP_PORT` | ✅ | `465` | Render **free** blocks 465/587 — use `2525` with an API-based relay (SendGrid/Mailgun) |
| `SMTP_SECURE` | ✅ | `true` | |
| `SMTP_USER` | ✅ | `you@gmail.com` | Gmail address |
| `SMTP_PASS` | ✅ | 16-char app password | Never commit it |
| `MAIL_TO` | ✅ | `ikiuzwemariette@gmail.com` | Contact-form inbox |

