# Shibam Drugs India — Live Deployment Guide

Yeh app ab **GitHub + Supabase + Vercel** ke through live host hogi. Isse aap (Owner) jis bhi device se link kholein, sabhi customers ke orders dikhenge — aur jab bhi aap products update karenge, wo turant sab customers ki screen par reflect ho jayega. Customers khud apna "My Orders" apne phone number se dekh sakte hain, dusron ka data nahi.

## Files in this package
- `index.html` — the app (frontend)
- `app.js` — all the logic (products, cart, orders, owner dashboard)
- `config.js` — Supabase connection settings (aapko fill karna hai)
- `schema.sql` — database structure + security rules (Supabase mein run karna hai)
- `seed.sql` — aapke current 19 products ka data (Supabase mein run karna hai, ek baar)

---

## Step 1 — Supabase Project Banayein

1. https://supabase.com par jaake sign up/login karein (GitHub se bhi ho sakta hai).
2. **New Project** banayein. Ek strong database password set karein (yaad rakhein/save karein).
3. Project ban jaane ke baad, left sidebar mein **SQL Editor** kholein.
4. `schema.sql` file ka pura content copy karke paste karein, aur **Run** dabayein.
   - Yeh products, priority customers, store settings, aur orders ki tables + security rules bana dega.
5. Ab `seed.sql` ka content copy-paste karke **Run** karein — isse aapke current 19 products load ho jayenge.
   *(Note: Product photos is baar shamil nahi hain — badme aap "Products" tab se har product mein ek photo URL add kar sakte hain, ya Supabase Storage use kar sakte hain.)*

## Step 2 — Owner Account Banayein

Owner ka "passcode" ab ek asli secure login banega:

1. Supabase Dashboard → **Authentication** → **Users** → **Add User**.
2. Email: `owner@sdi.app` (ya jo bhi email chahen — lekin phir `schema.sql` ke andar sab jagah `owner@sdi.app` ko us email se replace karke schema dubara run karna hoga, aur `config.js` mein bhi wahi email daalna hoga).
3. Password: yeh aapka **owner passcode** hoga (jaise pehle "SDI2026" tha). Kam se kam 6 characters rakhein (Supabase ka minimum).
4. "Auto Confirm User" ka option ON rakhein taaki turant login ho sake.

## Step 3 — Supabase Keys Copy Karein

1. Supabase Dashboard → **Project Settings** (gear icon) → **API**.
2. Yahan se copy karein:
   - **Project URL**
   - **anon public** key
3. `config.js` file kholke yeh values daalein:
   ```js
   const SUPABASE_URL = "https://xxxxxxxx.supabase.co";
   const SUPABASE_ANON_KEY = "eyJhbGciOi...";
   const OWNER_EMAIL = "owner@sdi.app"; // Step 2 wala email
   ```

## Step 4 — GitHub Par Push Karein

1. https://github.com par ek naya repository banayein (e.g. `sdi-store`).
2. Is folder ki saari files (`index.html`, `app.js`, `config.js`) us repo mein upload/push karein:
   ```bash
   git init
   git add .
   git commit -m "SDI live store"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/sdi-store.git
   git push -u origin main
   ```
   *(GitHub Desktop app se bhi drag-and-drop karke push kar sakte hain, agar command line comfortable nahi hai.)*

## Step 5 — Vercel Par Deploy Karein

1. https://vercel.com par login karein (GitHub account se login karna sabse aasan hai).
2. **Add New Project** → apni `sdi-store` GitHub repo select karein.
3. Framework preset: **Other** (ya "Static") select karein — koi build command nahi chahiye, kyunki yeh plain HTML/JS hai.
4. **Deploy** dabayein.
5. 1-2 minute mein aapko ek live link milega jaise: `https://sdi-store.vercel.app`

Bas — yehi link ab aap customers ke saath share kar sakte hain, aur khud bhi kisi bhi device se isi link se Owner dashboard access kar sakte hain.

---

## Ab kaise kaam karega

| Kaam | Kaise hota hai |
|---|---|
| Customer order place karta hai | Order Supabase database mein save hota hai + WhatsApp pe bhi bhej diya jata hai |
| Owner kisi bhi device se link kholta hai | "Owner" tab → passcode daalein → sabhi customers ke orders dikhte hain, live |
| Owner product add/edit/delete karta hai | Turant sab customers ki screen par (bina refresh kiye) update ho jata hai |
| Customer apna order history dekhna chahta hai | "My Orders" tab → apna phone number daalein → sirf unke apne orders dikhenge |
| Owner passcode badalta hai | "Store Settings" tab se — yeh naya passcode turant sabhi devices ke liye apply ho jata hai |

## Security kaise kaam karti hai

- Products aur store contact number **sabko dikhte** hain (public read) — lekin **sirf Owner login se hi edit** ho sakte hain.
- Orders koi bhi customer bina login ke "insert" (place) kar sakta hai.
- Poori orders list **sirf Owner** dekh sakta hai (login ke baad).
- Customer sirf apna **phone number match** karke apne orders dekh sakta hai — kisi aur ka data nahi dikhta.

## Future Improvements (optional)

- Product photos ke liye Supabase **Storage** bucket bana kar image upload feature add kiya ja sakta hai (abhi sirf photo URL field hai).
- Custom domain (jaise `order.shibamdrugs.com`) Vercel Project Settings → Domains se add kiya ja sakta hai.
- Owner ke liye multiple staff logins chahiye ho to Supabase Auth mein aur users add kiye ja sakte hain (RLS policy mein unke email bhi add karne honge).

Koi bhi step mein atke to bataiyega — main madad kar dunga.
