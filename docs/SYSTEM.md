# Quantum Trading Journal — System documentation

Brand: **Quantum / Quantum Trading Journal**  
Footer: Powered by Amiinhub  
App type: React + Vite + Tailwind single-page app (PWA)  
Live host target: `https://quantum.amiinhub.com`

## 1. What this system is

Quantum is a trading journal for forex and prop-firm traders. It tracks trades, daily journals, accounts, notes, mind maps, backtests, payouts, and partner offers. Traders sign up, a super admin approves them, then they journal on their own workspace.

The current product talks to a **PHP + MySQL API** on cPanel (`/api/...`). User accounts, sessions, referrals, and journals are stored in `quantum_db`. Passwords are hashed with `password_hash`.

Local `npm run dev` still works without PHP: if `/api/health` is not available, the app falls back to browser `localStorage`.

## 2. Tech stack

| Layer | Choice |
| --- | --- |
| UI | React 18, TypeScript, Tailwind CSS, Lucide icons, Recharts |
| Build | Vite 6, Vite PWA plugin |
| Routing | React Router with **hash URLs** (`#/trades`, `#/signup?ref=CODE`) |
| Data | MySQL (`q_users`, `q_sessions`, `q_data`) on cPanel. localStorage fallback only when the API is unreachable |
| Auth | Email/password (hashed) and optional Google Identity Services |
| Live tools | PHP for coupons and Myfxbook calendar |

## 3. Default accounts (after first load)

These accounts are seeded in MySQL the first time `/api/health` runs (and in the browser if you are in local fallback mode):

| Role | Email | Password |
| --- | --- | --- |
| Demo trader | `nejahseid750@gmail.com` | `quantum` |
| Super admin | `admin@quantum.local` | `quantum-admin` |

Change the admin password in **Settings** after go-live. New email/Google signups start as **pending** and cannot log in until a super admin approves them.

## 4. Modules and routes

All authenticated routes sit behind login. Super admin only: Settings.

| Hash route | Module | What it does |
| --- | --- | --- |
| `#/login` | Auth | Email login, Google continue |
| `#/signup` | Auth | Create pending trader. `?ref=CODE` attaches a referral |
| `#/forgot` `#/reset` | Auth | Local reset token (shown in-app, not emailed) |
| `#/` | Dashboard | KPIs and month calendar (P&L only on days with trades) |
| `#/journals` | Daily Journal | Mood, tags, plans, recent days |
| `#/trades` | Trading Journal | Log, grade, proof images, outcomes |
| `#/portfolio` | My Portfolio | Prop/personal accounts |
| `#/notebook` | Notebook | Notes and mind maps |
| `#/analytics` | Analytics | Filters, charts, print/PDF |
| `#/calendar` | Economic Calendar | Myfxbook table with Forex Factory fallback |
| `#/calculator` | Position Calculator | Risk / lot helper |
| `#/coupons` | Partner Offers | Live prop-firm discounts, codes, and deal links |
| `#/backtests` | Backtested Trades | Practice trades + chart images |
| `#/stats` | Statistics Center | Backtest stats |
| `#/payouts` | Payouts | Payout dashboard |
| `#/payout-journal` | Payout Journal | Payout history |
| `#/affiliate` | Affiliate | Unique referral link + signup count. Super admin sees every user’s link and who signed up |
| `#/settings` | Admin Settings | Approve/reject users, roles, passwords |

## 5. User lifecycle

1. Visitor opens a referral link: `https://quantum.amiinhub.com/#/signup?ref=CODE`
2. They sign up with email or Google.
3. Status is **pending**. Login shows “Contact the admin for approval”.
4. Super admin opens Settings and **Approve** (or Reject/Disable).
5. Approved traders (`active`) can use the journal.
6. Each user gets a unique `referralCode`. Signups via that code increment the affiliate count.

Passwords for email accounts are stored in localStorage as plain text in this version. Treat the hosted site as a private workspace until a hashed-password backend exists.

## 6. Data stored per user

Each logged-in user has a JSON blob (`q-data-<id>`):

- Profile (name, email, phone, avatar)
- Accounts (prop / personal / demo)
- Trades (symbol, direction, session, grade, R:R, P&L, psychology, rules, proof images)
- Journals, notes, mind maps, checklists
- Payouts and backtests
- Symbols list and focus tasks

Images (trade proof, after screenshot, backtest charts) are stored as compressed data URLs in that same blob.

## 7. Coupons

On load, the app requests `/api/prop-deals`.

- **Local dev:** Vite plugin scrapes official prop-firm pages.
- **cPanel:** `public/api/prop-deals.php` does the same with PHP cURL.

Each card shows firm name, discount, details, code (or “No code needed”), and the offer URL. Copy is enabled only when a real code exists.

## 8. Economic calendar

The calendar page requests `/api/myfxbook/forex-economic-calendar`, then falls back to Forex Factory’s public JSON. Filters are GMT “today”, impact, and currency pairs.

## 9. Google sign-in

Optional. Set `VITE_GOOGLE_CLIENT_ID` in `.env.local` **before** `npm run build`.

In Google Cloud Console, authorized JavaScript origins must include:

- `http://localhost:5173`
- `https://quantum.amiinhub.com`

Do not add hash paths (`#/login`) as origins.

## 10. MySQL schema

Tables are created automatically on first `/api/health` request:

- `q_users` — accounts, hashed passwords, referral codes, approval status
- `q_sessions` — login tokens (30 days)
- `q_data` — each user's journal JSON (trades, notes, images)

## 11. Production notes

- Super admin on any device sees the same users.
- Traders can log in on phone and PC with the same email.
- Reset codes are stored on the server and emailed when PHP `mail()` is allowed.
- Coupon/calendar scrapes depend on PHP cURL being allowed outbound on Yegara.
- If cPanel prefixes database names (example `amiinhub_quantum_db`), put that full name in `public/api/config.php`.
