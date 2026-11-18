# Bamex Crue

Full-stack website for Bamex Crue — deals, goods, and health support.

## Local development

```bash
cp .env.example .env
npm install
npm start
```

Open http://localhost:4000. The admin panel is at http://localhost:4000/admin.

Before deployment, replace every placeholder secret in `.env`, especially `JWT_SECRET` and `ADMIN_PASS`.
