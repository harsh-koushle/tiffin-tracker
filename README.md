# Tiffin Tracker

A small multi-user web app to track tiffins bought and the amount owed.

- Each person signs up with their own email/password — your data is private to your account.
- Configurable quick-add price buttons (e.g. Half, Full, or any labels you want).
- "Add other" for one-off/custom entries.
- Running total of amount due.
- "Reset & mark paid" archives the cycle into history (kept for 7 days), then clears the total.

## Project structure

```
tiffin-tracker/
├── backend/          Node.js + Express + PostgreSQL REST API
│   └── src/
│       ├── db/           connection pool + schema.sql
│       ├── middleware/   JWT auth check
│       ├── routes/       auth, buttons, entries, reset, history
│       └── index.js
├── frontend/         Plain HTML/CSS/JS static site (calls the API)
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   └── config.js     <- set your deployed backend URL here
└── render.yaml       One-click Render Blueprint (backend + frontend + Postgres)
```

## 1. Run it locally (optional, to test first)

**Backend**
```bash
cd backend
cp .env.example .env
# Edit .env: put in a local Postgres DATABASE_URL and any JWT_SECRET string
npm install
npm start
```
The API runs on `http://localhost:4000`.

**Frontend**
Edit `frontend/config.js` and set:
```js
const API_BASE_URL = "http://localhost:4000/api";
```
Then just open `frontend/index.html` in a browser (or serve the folder with any static server).

## 2. Push this project to GitHub

```bash
cd tiffin-tracker
git init
git add .
git commit -m "Initial commit: tiffin tracker full-stack app"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/tiffin-tracker.git
git push -u origin main
```

## 3. Deploy for free, with no credit card, on Vercel + Neon

This path never asks for a card: **Neon** for a permanent free Postgres database, **Vercel** for both the backend and frontend.

**Step A — Create the database (Neon)**
1. Go to https://neon.tech → sign up (no card) → **Create a project**.
2. On the project dashboard, copy the **connection string** (it looks like `postgresql://user:password@ep-xxxx.neon.tech/neondb?sslmode=require`).

**Step B — Deploy the backend (Vercel)**
1. Go to https://vercel.com → sign up (no card) → **Add New** → **Project**.
2. Import your `tiffin-tracker` GitHub repo.
3. Set **Root Directory** to `backend`. Vercel auto-detects it as a Node/Express app — no build command needed.
4. Add environment variables:
   - `DATABASE_URL` → the Neon connection string from Step A
   - `JWT_SECRET` → any long random string you make up
5. Click **Deploy**. When it finishes, copy the backend's URL (looks like `https://tiffin-backend-xxxx.vercel.app`).

**Step C — Connect the frontend to the backend**
Edit `frontend/config.js` locally:
```js
const API_BASE_URL = "https://tiffin-backend-xxxx.vercel.app/api";
```
Then:
```bash
git add frontend/config.js
git commit -m "Point frontend at deployed backend"
git push
```

**Step D — Deploy the frontend (Vercel, second project)**
1. Back in Vercel, **Add New** → **Project** → import the same repo again.
2. Set **Root Directory** to `frontend`. Framework preset: **Other** (it's plain static HTML/CSS/JS).
3. Click **Deploy**.

## 4. Use it

Open the frontend's Vercel URL from any device, sign up, set your price buttons, and start tracking. Anyone else can open the same link and sign up with their own account — everyone's data stays separate.

## Alternative: Render (asks for a card on free tier)

A `render.yaml` Blueprint is also included if you'd rather use Render instead — note that Render currently requires adding a payment card for account verification even on its free tier (no charge unless you upgrade). If you go this route: Render Dashboard → **New** → **Blueprint** → connect this repo → **Apply**. See the comments in `render.yaml` for what it provisions.

## Notes and limits

- Vercel's free functions "cold start" after inactivity — the first request after a quiet period may take a second or two longer.
- Neon's free tier is permanent, but has storage/compute caps suited to small personal projects like this one.
- History entries older than 7 days are cleaned up automatically whenever you load or reset.
