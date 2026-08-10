# Tare Wellness — Deployment Guide

This document covers everything you need to deploy the Tare Wellness platform to production.

---

## Prerequisites

Before you begin, you'll need:

1. **A hosting platform** — Vercel (recommended for Next.js), Docker, or any Node.js host (Render, Railway, Fly.io, etc.).
2. **A PostgreSQL database** — Neon, Supabase, Railway, RDS, or any managed Postgres.
3. **A Resend account** — for sending gift card emails (https://resend.com).
4. **A registered domain** — for `NEXTAUTH_URL` and Resend sender verification.

---

## Option A: Deploy to Vercel (Recommended)

Vercel is the natural fit for Next.js — zero config, automatic deploys from GitHub.

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-org/tare-wellness.git
git push -u origin main
```

### Step 2: Import to Vercel
1. Go to https://vercel.com/new
2. Import your GitHub repo
3. Vercel will auto-detect Next.js — accept the defaults

### Step 3: Configure Environment Variables
In the Vercel dashboard → Settings → Environment Variables, add:

| Name | Value | Environments |
|------|-------|--------------|
| `DATABASE_URL` | `postgresql://...` (from your Postgres provider) | Production, Preview |
| `NEXTAUTH_SECRET` | Output of `openssl rand -base64 32` | Production, Preview |
| `NEXTAUTH_URL` | `https://your-domain.com` | Production |
| `RESEND_API_KEY` | `re_...` (from Resend dashboard) | Production, Preview |
| `EMAIL_FROM` | `Tare Wellness <hello@your-domain.com>` | Production, Preview |

### Step 4: Switch to PostgreSQL Schema
Before the first deploy, swap the Prisma schema to PostgreSQL:

```bash
cp prisma/schema.postgres.prisma prisma/schema.prisma
git add prisma/schema.prisma
git commit -m "chore: switch prisma provider to postgresql for production"
git push
```

### Step 5: Run the Migration
After the first deploy, run the migration against your production DB:

```bash
# Install the Vercel CLI if you haven't
npm i -g vercel

# Link to your project
vercel link

# Pull the production env vars into a local .env
vercel env pull .env.production.local

# Run the migration
npx prisma migrate deploy

# Seed the gift card types
npx prisma db seed
```

### Step 6: Add a Custom Domain
1. Vercel dashboard → Project → Settings → Domains
2. Add your domain (e.g. `bewelltare.com`)
3. Update `NEXTAUTH_URL` env var to match
4. Update your DNS provider with the CNAME Vercel gives you

---

## Option B: Deploy with Docker

Useful for self-hosted environments, VPS, or non-Vercel cloud providers.

### Step 1: Build the image
```bash
docker build -t tare-wellness .
```

### Step 2: Run the container
```bash
docker run -d \
  --name tare-wellness \
  -p 3000:3000 \
  -e DATABASE_URL=postgresql://user:pass@host:5432/tare_wellness \
  -e NEXTAUTH_SECRET=$(openssl rand -base64 32) \
  -e NEXTAUTH_URL=https://your-domain.com \
  -e RESEND_API_KEY=re_xxxxxxxx \
  -e EMAIL_FROM="Tare Wellness <hello@your-domain.com>" \
  tare-wellness
```

### Step 3: Run the database migration
```bash
# Apply Prisma migrations to your Postgres DB
docker exec tare-wellness npx prisma migrate deploy

# Seed the gift card types
docker exec tare-wellness npx prisma db seed
```

### Step 4: Set up a reverse proxy (Caddy/Nginx)
The container listens on port 3000. Put it behind a TLS-terminating reverse proxy:

**Caddy example** (automatic HTTPS via Let's Encrypt):
```Caddyfile
your-domain.com {
  reverse_proxy localhost:3000
}
```

---

## Environment Variables Reference

See `.env.example` for the full reference. Critical variables:

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | ✅ Always | Database connection string |
| `NEXTAUTH_SECRET` | ✅ Production | Signs JWT session tokens — fail-fast if missing in prod |
| `NEXTAUTH_URL` | ✅ Production | Canonical URL for callbacks/cookies |
| `RESEND_API_KEY` | ⚠️ Production | Email provider API key — falls back to console.log if missing |
| `EMAIL_FROM` | Optional | Sender email (defaults to `Tare Wellness <hello@bewelltare.com>`) |

---

## Postgres Migration Steps

If you started with SQLite in dev and need to switch to PostgreSQL:

1. **Swap the schema:**
   ```bash
   cp prisma/schema.postgres.prisma prisma/schema.prisma
   ```

2. **Update `.env`:**
   ```bash
   # Old (SQLite):
   # DATABASE_URL=file:/home/z/my-project/db/custom.db
   
   # New (PostgreSQL):
   DATABASE_URL=postgresql://user:pass@host:5432/tare_wellness?schema=public
   ```

3. **Create the initial migration:**
   ```bash
   npx prisma migrate dev --name init
   ```

4. **Seed the database:**
   ```bash
   npx prisma db seed
   ```

5. **Verify the connection:**
   ```bash
   npx prisma studio
   # Should open Prisma Studio connected to your Postgres DB
   ```

---

## Email Setup (Resend)

1. **Create a Resend account** at https://resend.com
2. **Verify your sending domain** (e.g. `bewelltare.com`) — Resend will give you DNS records to add
3. **Get your API key** from the Resend dashboard
4. **Add `RESEND_API_KEY` to your env vars** (locally and on your hosting platform)
5. **Set `EMAIL_FROM`** to match your verified domain (e.g. `Tare Wellness <hello@bewelltare.com>`)

### Testing email delivery

- In **dev**: if `RESEND_API_KEY` is not set, the `/api/email/send` route logs the email content to the server console instead of sending. This is by design so dev environments don't need a real email provider.
- In **production**: with `RESEND_API_KEY` set, all emails go through Resend. Check the Resend dashboard for delivery status and bounce tracking.

---

## Troubleshooting

### "NEXTAUTH_SECRET must be set in production"
The app refuses to start in production mode without `NEXTAUTH_SECRET`. Generate one with:
```bash
openssl rand -base64 32
```
And set it as an environment variable on your hosting platform.

### Prisma client errors after deploying
Make sure the Prisma client was generated during the build. The Dockerfile handles this automatically. On Vercel, the build runs `prisma generate` as part of the postinstall script.

### Booking or order creation fails with "Unique constraint failed"
This was a known bug in earlier versions — both `generateOrderNumber()` and `generateRedemptionCode()` and `generateBookingNumber()` now use timestamp + random entropy. If you still see this error, make sure you've deployed the latest code.

### Auth redirects to `/` instead of the original page
The login page now respects the `callbackUrl` query parameter. If you're seeing old behavior, hard-refresh your browser to clear the cached JS bundle.

### Emails not arriving
1. Check that `RESEND_API_KEY` is set in production env vars
2. Check that your sending domain is verified in Resend
3. Check the Resend dashboard for delivery events
4. The `/api/email/send` route is **best-effort** — if it fails, the order still succeeds and the recipient can redeem via the code shown on `/order-confirmation`

---

## Health Check

The Docker container exposes a health check at `http://localhost:3000/api` which returns 200 if the app is running. Use this for load balancer / orchestrator health checks.
