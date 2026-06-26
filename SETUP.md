# Setup Guide

This is the Retention Snapshot dashboard as a hosted Next.js app. Follow these steps once to get it live on Vercel. After that, it auto-deploys whenever you push to GitHub, and reads live data from Google Sheets on each page load.

---

## What you need

- A GitHub account (free)
- A Vercel account (free tier is fine)
- A Google Cloud project with a service account (free)
- The shared password you want to use to protect the dashboard

---

## Step 1 — Create a GitHub repo

1. Go to https://github.com/new
2. Name the repo `retention-dashboard` (or whatever you want)
3. Set it to **Private**
4. Do not add a README — you'll push the existing code
5. Click **Create repository**

GitHub will show you commands to push an existing repo. In your terminal:

```bash
cd /Users/solomonhanes/hq/repos/private/retention-dashboard
git init
git add .
git commit -m "Initial retention dashboard"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/retention-dashboard.git
git push -u origin main
```

---

## Step 2 — Create a Google service account

This lets the app read your brand's Google Sheets without a browser login.

1. Go to https://console.cloud.google.com
2. Create a new project (or use an existing one). Call it `retention-dashboard`.
3. In the left sidebar go to **APIs & Services > Library**
4. Search for **Google Sheets API** and click **Enable**
5. Go to **APIs & Services > Credentials**
6. Click **Create Credentials > Service account**
7. Name it `retention-dashboard-reader`, click **Create and Continue**, skip the optional steps, click **Done**
8. Click the service account you just created, go to the **Keys** tab
9. Click **Add Key > Create new key**, choose **JSON**, click **Create**
10. A `.json` file will download to your machine — keep it safe, treat it like a password

**Share your sheets with the service account:**

Open the JSON file. Find the `client_email` field — it looks like `retention-dashboard-reader@your-project.iam.gserviceaccount.com`.

For each brand's Google Sheet, click **Share** and add that email as a **Viewer**. You only need to do this once per sheet. The easiest way: open each brand's sheet and share it. If the sheets are already shared at the folder level, you may only need to share the folder.

---

## Step 3 — Deploy to Vercel

1. Go to https://vercel.com and sign in (use GitHub to sign in — easiest)
2. Click **Add New > Project**
3. Import your `retention-dashboard` GitHub repo
4. Vercel will auto-detect it as a Next.js app — leave all settings as-is
5. Before clicking **Deploy**, click **Environment Variables** and add these two:

**Variable 1:**
- Name: `DASHBOARD_PASSWORD`
- Value: the shared password you want (e.g. `kynship2024`)

**Variable 2:**
- Name: `GOOGLE_SERVICE_ACCOUNT_JSON`
- Value: open the JSON key file you downloaded in Step 2, copy the **entire contents** as one line, and paste it here

6. Click **Deploy**

Vercel will build and deploy the app. It takes about 60 seconds. When it finishes, you'll get a URL like `https://retention-dashboard-xyz.vercel.app`.

---

## Step 4 — Share it

Send your coworker:
- The Vercel URL
- The shared password

They open the URL, enter the password, and they're in. The password is stored in a cookie for 30 days so they don't have to re-enter it every time.

---

## Keeping data fresh

The app re-reads all brand sheets once per hour automatically (Vercel's edge cache revalidates on the first request after the hour). You don't need to do anything — it always shows fresh data.

If you add a new brand or change a sheet ID, update the `BRANDS` array in `lib/brands.ts`, commit, and push. Vercel auto-deploys within a minute.

---

## Adding a brand

1. Open `lib/brands.ts`
2. Add an entry to the `BRANDS` array:
   ```ts
   { id: "brand-slug", name: "Brand Name", platform: "Stay AI", sheetId: "THE_SHEET_ID" },
   ```
   The sheet ID is the long string in the Google Sheets URL between `/d/` and `/edit`.
3. Share the sheet with the service account email (see Step 2)
4. Commit and push — Vercel deploys automatically

---

## Local development

```bash
cd repos/private/retention-dashboard
cp .env.example .env.local
# Fill in .env.local with your real values
npm install
npm run dev
```

Open http://localhost:3000. The app runs the same code as production, reading live from Google Sheets.

---

## Troubleshooting

**"Could not load data" on the homepage:**
The `GOOGLE_SERVICE_ACCOUNT_JSON` env var is either missing or malformed. Make sure you pasted the full JSON as a single line in Vercel, with no line breaks.

**A brand shows no chart lines:**
The service account probably doesn't have access to that brand's sheet. Share the sheet with the service account email and redeploy.

**The page redirects to /login even with the right password:**
Check that `DASHBOARD_PASSWORD` is set in Vercel's environment variables and matches exactly what you're typing.
