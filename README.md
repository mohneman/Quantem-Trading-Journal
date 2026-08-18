# Q / Quantem Trading Journal (RyzeLog)

Progressive Web App for journaling trades, daily notes, mind maps, analytics, and prop payouts. Data stays in the browser (`localStorage`).

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:5173/

Demo login: `nejahseid750@gmail.com` / `quantem`

## Production build (Yegara / cPanel)

```bash
npm run build
```

Upload **everything inside `dist/`** to `public_html` (or a subdirectory) via Yegara File Manager or FTP.

- Vite `base` is `./` so asset URLs work in a subdirectory.
- `dist/.htaccess` rewrites unknown paths to `index.html` (Apache SPA fallback).
- Routing uses a hash URL (`/#/analytics`) so the app also works if rewrite rules are unavailable.

### cPanel upload checklist

1. Run `npm run build` on your computer.
2. Zip the contents of `dist/` (including `index.html`, `assets/`, `.htaccess`, `sw.js`, `manifest.webmanifest`).
3. In cPanel → File Manager → `public_html`, upload and extract.
4. Visit your domain. First load may prompt to install the PWA.
5. If styles 404 in a subdirectory, confirm `.htaccess` was uploaded (dotfiles can be hidden in File Manager — enable “Show Hidden Files”).

## Features

- Auth: login, signup, forgot/reset password, Google continue (local session)
- Accounts, trades, journals, notes, mind maps, checklists, payouts, backtests
- Dashboard calendar click → Day Details
- Analytics filters + print/PDF export
- Dark mode and profile settings

Powered by Sunmax Inc. UI branding: RyzeLog / Q / Quantem.
