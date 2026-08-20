# Host Quantum on Yegara cPanel

Domain: **quantum.amiinhub.com**  
This app is a React frontend plus a **PHP + MySQL API**. Journals and users are stored in `quantum_db`. Coupons and the economic calendar also run as PHP.

Database settings live in `public/api/config.php` (copied into `dist/api/` on build). Do not commit that file to a public repo.

## What you already have

- Domain / subdomain: `quantum.amiinhub.com`
- Database name: `quantum_db` (confirm the full cPanel name, which may be `USERNAME_quantum_db`)
- Database user: `quantum_user` (may also be prefixed)
- `public/api/config.php` must match those names and the password

## What else is required

Complete these before or during deploy:

1. **cPanel login** for the Amiinhub / Yegara account that owns `amiinhub.com`.
2. **Subdomain (or addon domain)** `quantum.amiinhub.com` with its **own document root** (do not share `public_html` with the main Amiinhub site). Typical folder: `public_html/quantum` or `quantum.amiinhub.com`.
3. **DNS** — if the subdomain was created in the same cPanel as `amiinhub.com`, it is usually automatic. If DNS is elsewhere, add an A record for `quantum` to the Yegara server IP.
4. **SSL** — cPanel → SSL/TLS Status → Run AutoSSL for `quantum.amiinhub.com`. Wait until https works.
5. **PHP** — 8.1 or 8.2 with **cURL** enabled (needed for Coupons and Calendar).
6. **Google login (optional)** — Google Cloud OAuth client ID, with origin `https://quantum.amiinhub.com`. Put it in `.env.local` as `VITE_GOOGLE_CLIENT_ID` on the computer that runs `npm run build`.
7. **Node.js on your PC** (not on cPanel) — Node 18+ to build the app. cPanel only receives the built files.

Not required for this version: Node on the server, MySQL connection strings in the frontend, email SMTP.

**Security:** A database password was typed in chat. Rotate it in cPanel → MySQL Databases even though the app does not use it yet. Never upload `.env.local`, `client_secret*.json`, or the DB password into `public_html`.

---

## A. Point the domain

1. Log in to [Yegara / cPanel](https://my.yegara.com/).
2. Open **Domains** → **Create A New Domain**.
3. Enter `quantum.amiinhub.com`.
4. **Uncheck** “Share document root” so it does not overwrite amiinhub.com.
5. Note the **Document Root** (example: `/home/USERNAME/quantum.amiinhub.com` or `/home/USERNAME/public_html/quantum`).
6. Submit, then wait for DNS (often a few minutes on the same account).

Confirm in **File Manager** that the document root folder exists and is empty (or only contains a default `index.html` you can replace).

---

## B. Build the app on your computer

In a terminal, from the project folder:

```bash
npm install
```

Optional Google login — create `.env.local` (already gitignored):

```
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

Build:

```bash
npm run build
```

This creates a `dist/` folder. That folder is what you upload. It should contain:

- `index.html`
- `assets/`
- `favicon.svg`
- `.htaccess` (hidden file)
- `api/index.php`, `api/lib.php`, `api/config.php`
- `api/prop-deals.php`
- `api/myfxbook-calendar.php`
- PWA files (`sw.js`, `manifest.webmanifest`, etc.)

---

## C. Upload to cPanel

### Option 1 — File Manager (simplest)

1. Zip **the contents of `dist/`**, not the `dist` folder itself. The zip must have `index.html` at the top level.
2. cPanel → **File Manager** → open the document root for `quantum.amiinhub.com`.
3. Enable **Show Hidden Files** (Settings) so `.htaccess` is visible.
4. Upload the zip → Extract → delete the zip.
5. Confirm you see `index.html`, `assets/`, `.htaccess`, and `api/`.

### Option 2 — FTP / SFTP

Host: your Yegara FTP host  
Remote path: the subdomain document root  
Upload everything inside `dist/`.

---

## D. Apache / PHP checks

1. cPanel → **Select PHP Version** (or MultiPHP) for this domain: 8.1+.
2. Enable extension **curl**.
3. Visit:
   - `https://quantum.amiinhub.com/api/health` (should show `{"ok":true,...}`)
   - `https://quantum.amiinhub.com/api/prop-deals`
   - `https://quantum.amiinhub.com/#/login`

If `/api/health` says database connection failed, edit `api/config.php` on the server: cPanel often names the database `USERNAME_quantum_db` and the user `USERNAME_quantum_user`. Grant that user **ALL PRIVILEGES** on the database.

If the homepage is a cPanel placeholder, files went to the wrong folder. If CSS is missing, `assets/` was not uploaded or `index.html` is nested inside an extra `dist` folder.

---

## E. SSL

cPanel → **SSL/TLS Status** → check `quantum.amiinhub.com` → **Run AutoSSL**.  
Force HTTPS: **Domains** → quantum.amiinhub.com → Force HTTPS Redirect **On**.

---

## F. First login after go-live

Open `https://quantum.amiinhub.com/#/login`

| Account | Email | Password |
| --- | --- | --- |
| Super admin | `admin@quantum.local` | `quantum-admin` |
| Demo trader | `nejahseid750@gmail.com` | `quantum` |

Then:

1. Log in as super admin.
2. Settings → change the admin password.
3. Approve any real signups (they stay **pending** until you approve).
4. Share referral links from **Affiliate** (`#/signup?ref=THEIRCODE`).

Data lives in that visitor’s browser. The super admin on your laptop will **not** see users who signed up on a different phone unless you later add a MySQL backend.

---

## G. Google OAuth (optional)

1. Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client.
2. Authorized JavaScript origins:
   - `https://quantum.amiinhub.com`
   - `http://localhost:5173` (for local work)
3. Rebuild with `VITE_GOOGLE_CLIENT_ID` set and re-upload `dist/`.

---

## H. Database

`public/api/config.php` is filled for Yegara (`localhost`, `quantum_db`, `quantum_user`). After upload, open `/api/health`. Tables `q_users`, `q_sessions`, and `q_data` are created automatically, and the demo + admin accounts are seeded.

If health fails, copy the **exact** database/user names from cPanel → MySQL Databases into `api/config.php`.

Do not put the database password in JavaScript or GitHub.

---

## I. Update the site later

```bash
npm run build
```

Upload and overwrite files in the same document root. User journals in localStorage are not deleted by a file update.

---

## J. Troubleshooting

| Symptom | Fix |
| --- | --- |
| Main Amiinhub site was replaced | Subdomain shared document root. Recreate subdomain with its own folder and restore amiinhub.com from backup. |
| Blank page | Open DevTools → Network. Confirm `/assets/*.js` returns 200. Re-upload `assets/`. |
| `.htaccess` missing | File Manager → Settings → Show Hidden Files, then upload again. |
| Coupons empty / calendar error | PHP cURL disabled, or host blocks outbound HTTPS. Ask Yegara to allow cURL. Calendar can still use Forex Factory. |
| Google button fails | Origin `https://quantum.amiinhub.com` not in Google Cloud; or build was made without `VITE_GOOGLE_CLIENT_ID`. |
| Login works only on one device | `/api/health` is failing, so the app is in local mode. Fix config.php. |
| Database connection failed | Use the prefixed cPanel DB name/user and confirm the user is added to the database. |
