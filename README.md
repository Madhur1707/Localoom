# Scriptum

A local-first, real-time collaborative document editor. Built with Next.js 16
(App Router), Tiptap + Yjs (CRDT), Prisma/PostgreSQL, Auth.js v5, and a Groq-powered
AI assistant.

## Architecture

Scriptum runs as **three** cooperating pieces:

| Piece | What it is | Where it deploys |
| --- | --- | --- |
| **Web app** | Next.js (auth, documents, sharing, version history, AI) | **Vercel** |
| **Sync server** | Standalone Node `ws` server relaying Yjs updates + persisting CRDT snapshots | **Railway** (always-on) |
| **Database** | PostgreSQL | **Neon** |

The sync server cannot run on Vercel — serverless functions can't hold the
long-lived WebSocket connections collaboration needs, so it lives on its own
always-on host.

## Local development

```bash
npm install
cp .env.example .env      # then fill in the values
npx prisma migrate dev    # apply schema to your database
npm run dev               # Next.js app on http://localhost:3000
npm run sync:dev          # sync server on ws://localhost:1234 (second terminal)
```

`sync:dev` reads `.env` via `--env-file`; the plain `sync` script expects the
host to inject env vars (that's what Railway uses in production). Without the
sync server the editor still works fully offline — edits persist to IndexedDB
and re-sync when the server is reachable again.

## Deployment

Deploy in this order: **Database → Sync server → Web app**, because the app needs
the sync server's public URL, and both need the database.

### 1. Database (Neon)

1. Create a project at [neon.tech](https://neon.tech) and copy two connection strings:
   - **Pooled** (host contains `-pooler`) → `DATABASE_URL`
   - **Direct** (same host without `-pooler`) → `DIRECT_URL`
2. Apply the schema once from your machine (or a CI step):
   ```bash
   DATABASE_URL="<pooled>" DIRECT_URL="<direct>" npm run migrate:deploy
   ```

### 2. Sync server (Railway)

1. New project → **Deploy from GitHub repo** → select this repo. `railway.json`
   already sets the start command to `npm run sync`.
2. **Variables** (Railway auto-injects `PORT`; the server honors it):
   | Key | Value |
   | --- | --- |
   | `DATABASE_URL` | Neon **pooled** URL (the server persists snapshots) |
   | `SYNC_TOKEN_SECRET` | a generated secret — **must match the web app exactly** |
3. **Settings → Networking → Generate Domain** to get a public HTTPS domain, e.g.
   `scriptum-sync.up.railway.app`. The browser reaches it over `wss://`.

### 3. Web app (Vercel)

1. **Import** this repo. Framework preset: Next.js (build command auto-detected —
   `package.json` runs `prisma generate && next build`).
2. **Environment Variables:**
   | Key | Value |
   | --- | --- |
   | `DATABASE_URL` | Neon **pooled** URL |
   | `DIRECT_URL` | Neon **direct** URL |
   | `AUTH_SECRET` | generate with `npx auth secret` |
   | `AUTH_URL` | your Vercel HTTPS origin, e.g. `https://scriptum.vercel.app` |
   | `SYNC_TOKEN_SECRET` | **the exact same secret set on Railway** |
   | `NEXT_PUBLIC_SYNC_SERVER_URL` | `wss://<your-railway-domain>` |
   | `GROQ_API_KEY` | from [console.groq.com](https://console.groq.com) |
   | `GROQ_MODEL` | e.g. `llama-3.3-70b-versatile` |
3. Deploy. If you set `AUTH_URL` after the first build (once you know the domain),
   redeploy so Auth.js picks it up.

### Deploy checklist

- [ ] `SYNC_TOKEN_SECRET` is **identical** on Vercel and Railway
- [ ] `NEXT_PUBLIC_SYNC_SERVER_URL` uses `wss://` (not `ws://`)
- [ ] `DATABASE_URL` set on **both** Vercel and Railway
- [ ] `AUTH_URL` matches the real Vercel origin
- [ ] Migrations applied to Neon (`npm run migrate:deploy`)

### Smoke test

Open the deployed app in two different browsers (two accounts), share a document,
and type in both — text and cursors should sync live, and the status pill should
read **Synced**. If it's stuck on "Connecting…", check the browser console for a
blocked `ws://` (mixed content) or a 401 (mismatched `SYNC_TOKEN_SECRET`).
