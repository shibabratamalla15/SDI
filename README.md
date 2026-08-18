# SDI — Shivom Drugs India

A simple ordering site for Shivom Drugs India. Plain HTML/CSS/JS on the front end,
Supabase as the shared database (so the owner sees orders from every customer's
device, not just the browser they placed the order in).

## Files in this project

- `index.html` — the whole app (customer shop, my orders, owner panel)
- `config.js` — where your Supabase URL + public key go
- `schema.sql` — run this once in Supabase to create the tables
- `.gitignore`

No build step, no `npm install` — it's static files, so Vercel can deploy it as-is.

---

## Step 1 — Set up Supabase

1. Go to [supabase.com](https://supabase.com) and open (or create) a project.
2. In the left sidebar, open **SQL Editor** → **New query**.
3. Open `schema.sql` from this project, copy all of it, paste it into the SQL Editor, and click **Run**.
   This creates the `products`, `priority_customers`, and `orders` tables, sets up access policies, and adds the 8 starter products.
4. In the left sidebar, go to **Project Settings → API**. Copy:
   - **Project URL**
   - **anon / public** key (not the `service_role` key — that one must stay secret)
5. *(Optional but recommended)* Go to **Database → Replication** and turn on replication for the `orders` table. This makes the Owner's Orders tab update live when a new order comes in, instead of needing to tap Refresh.

## Step 2 — Add your keys to config.js

Open `config.js` in this project and replace the two placeholder values:

```js
const SUPABASE_URL = "https://your-project-ref.supabase.co";
const SUPABASE_ANON_KEY = "your-anon-public-key";
```

Save the file.

## Step 3 — Push to GitHub

```bash
cd sdi-deploy
git init
git add .
git commit -m "SDI store — initial deploy"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/sdi-store.git
git push -u origin main
```

(Create the empty `sdi-store` repo on GitHub first, or use `gh repo create`.)

## Step 4 — Deploy on Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and import the GitHub repo you just pushed.
2. Framework preset: choose **Other** (it's a static site — no build command, no output directory needed).
3. Click **Deploy**.
4. Vercel gives you a live URL like `sdi-store.vercel.app` — that's your site.

Any time you edit `index.html` (or anything else) and push to GitHub, Vercel redeploys automatically.

---

## How owner access works

Clicking **Owner** in the top bar asks for a passcode. Current passcode:

```
SDI2026
```

This is a simple in-app check, not real login security — anyone who reads the page's
source code can see the passcode. It's enough to stop a casual customer from opening
the Owner panel, but not a determined one. If you want proper security later (e.g. a
real login for you as the owner), that would mean adding Supabase Auth — happy to help
with that when you're ready.

## Known limitations (fine for a small shop, worth knowing about)

- **No customer accounts.** "My Orders" matches orders by the name + area a customer typed in — not a login. If two customers use the exact same name and area, they'd see each other's orders.
- **Anyone with the anon key can call the database directly**, not just through the app (this is normal for Supabase apps without Auth, and is why the RLS policies in `schema.sql` exist — but it does mean a technical person could add/edit products or read all orders by calling the API directly, bypassing the owner passcode). Fine for a small local shop; worth tightening with Supabase Auth if the business grows.
- **Product photos are stored as base64 text** directly in the database, which is simple but not ideal for many/large images. If photo uploads get slow, moving to a Supabase Storage bucket is the next step.
