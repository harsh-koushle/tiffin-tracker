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

## 3. Deploy to Render

**Option A — One-click Blueprint (easiest)**
1. Go to the Render Dashboard → **New** → **Blueprint**.
2. Connect the GitHub repo you just pushed.
3. Render reads `render.yaml` and creates three things automatically:
   - `tiffin-db` — a free PostgreSQL database
   - `tiffin-backend` — the API (Node web service), wired to the database, with `JWT_SECRET` auto-generated
   - `tiffin-frontend` — the static frontend site
4. Click **Apply**. Wait for both services to finish deploying.

**Option B — Manual setup**, if you'd rather do it by hand or the Blueprint step fails:
1. **New → PostgreSQL** → name it, free plan → create. Copy the "Internal Connection String".
2. **New → Web Service** → connect your repo → set **Root Directory** to `backend` → Build Command `npm install` → Start Command `npm start`. Add environment variables: `DATABASE_URL` (paste the connection string), `JWT_SECRET` (any long random string), `NODE_ENV=production`.
3. **New → Static Site** → connect your repo → set **Root Directory** to `frontend` → leave Build Command empty → Publish Directory `.`.

## 4. Connect the frontend to the backend

Once `tiffin-backend` is live, copy its URL (looks like `https://tiffin-backend-xxxx.onrender.com`).

Edit `frontend/config.js`:
```js
const API_BASE_URL = "https://tiffin-backend-xxxx.onrender.com/api";
```
Commit and push this change — Render will auto-redeploy the static site with the correct backend URL.

## 5. Use it

Open your `tiffin-frontend` URL from any device, sign up, set your price buttons, and start tracking. Anyone else can open the same link and sign up with their own account — everyone's data stays separate.

## Notes and limits

- **Render's free Postgres database expires after 30 days** and needs to be recreated (a Render platform limit, not something in this code). Fine for testing/personal use; upgrade the database plan on Render if you want it to persist indefinitely.
- Free Render web services spin down after inactivity and take ~30–50 seconds to wake up on the next request — the first load after a while may feel slow.
- History entries older than 7 days are cleaned up automatically whenever you load or reset.
