# Setup Guide

No Google credentials needed. The dashboard reads from a static data snapshot that gets bundled with the app. You update the data by copying a file and pushing.

---

## Step 1 — Create a GitHub repo

1. Go to https://github.com/new
2. Name it `retention-dashboard`, set it to **Private**, no README
3. Click **Create repository**
4. Run these commands in your terminal:

```bash
cd /Users/solomonhanes/hq/repos/private/retention-dashboard
git add .
git commit -m "Initial dashboard"
git remote add origin https://github.com/YOUR_USERNAME/retention-dashboard.git
git push -u origin main
```

---

## Step 2 — Deploy to Vercel

1. Go to https://vercel.com, sign in with GitHub
2. Click **Add New > Project**, import `retention-dashboard`
3. Vercel auto-detects Next.js — leave all settings as-is
4. Under **Environment Variables**, add one:
   - Name: `DASHBOARD_PASSWORD`
   - Value: whatever password you want (e.g. `kynship2025`)
5. Click **Deploy** — takes about 60 seconds
6. You'll get a URL like `https://retention-dashboard-xyz.vercel.app`

---

## Sharing

Send your coworker the URL and the password. Done.

---

## Refreshing the data

The dashboard shows whatever is in `data/snapshot.json`. When you want fresh data:

1. In your Claude Code terminal, run the data builder in the localhost prototype:
   ```bash
   cd /Users/solomonhanes/hq/personal/tools/retention-snapshot
   node build-data.mjs
   ```
2. Copy the output into the hosted app:
   ```bash
   cp data.json /Users/solomonhanes/hq/repos/private/retention-dashboard/data/snapshot.json
   ```
3. Commit and push:
   ```bash
   cd /Users/solomonhanes/hq/repos/private/retention-dashboard
   git add data/snapshot.json
   git commit -m "Refresh data"
   git push
   ```
4. Vercel auto-deploys within a minute — the live site shows the new data

---

## Troubleshooting

**Redirects to /login with the right password:**
Check that `DASHBOARD_PASSWORD` in Vercel exactly matches what you're typing (case-sensitive, no trailing spaces).

**Dashboard shows no data:**
The `data/snapshot.json` file may be missing or malformed. Re-copy from the prototype and push again.
