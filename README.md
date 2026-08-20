# Quantum Trading Journal

Progressive Web App for journaling trades, daily notes, mind maps, analytics, and prop payouts.

- **System documentation:** [docs/SYSTEM.md](docs/SYSTEM.md)
- **Yegara / cPanel hosting:** [docs/HOSTING-CPANEL.md](docs/HOSTING-CPANEL.md)

Data is stored in MySQL on cPanel (`quantum_db`). Local development falls back to the browser if the PHP API is not running.

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:5173/

| Account | Email | Password |
| --- | --- | --- |
| Demo trader | `nejahseid750@gmail.com` | `quantum` |
| Super admin | `admin@quantum.local` | `quantum-admin` |

Optional: copy `.env.example` to `.env.local` and set `VITE_GOOGLE_CLIENT_ID`.

## Production build

```bash
npm run build
```

Upload **everything inside `dist/`** to the subdomain document root (see the hosting guide). Include hidden `.htaccess` and the `api/` PHP files.

Powered by Amiinhub. UI branding: Quantum / Quantum Trading Journal.
