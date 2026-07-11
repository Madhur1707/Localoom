# Localoom

A local-first, real-time collaborative document editor with offline sync,
CRDT-based conflict resolution, and granular version history.

**Live app:** https://localoom-rho.vercel.app/
**Repository:** https://github.com/Madhur1707/Localoom

Built for the House of Edtech Fullstack Developer Assignment (v2.1).

---

## How it maps to the assignment

### Local-first architecture
The browser is the primary source of truth. Every document is a **Yjs CRDT**
persisted to **IndexedDB** (`y-indexeddb`), so opening, editing, and closing a
document involves zero blocking network requests. The editor loads from the
local snapshot first; the network is an enhancement, not a dependency. Kill the
connection and everything keeps working.

### Background sync engine
A standalone Node WebSocket server (`server/sync/`) relays Yjs updates between
clients and persists them to PostgreSQL. When a client reconnects after being
offline, the Yjs sync protocol exchanges state vectors — the client pushes only
what the server is missing and pulls only what it is missing. Offline work is
never overwritten; it merges.

### Deterministic conflict resolution
Conflicts are resolved by the **CRDT itself**: Yjs guarantees that all peers
applying the same set of updates converge to the same state, regardless of
order or how long a peer was offline. There is no "last write wins" and no data
loss on concurrent edits — two users typing in the same paragraph merge
character-by-character.

### Version history & time travel
Users capture named snapshots of a document and browse a timeline
(`DocumentVersion` table). Restoring a version is **non-destructive for
collaborators**: the restore is applied as a regular CRDT update on top of the
live document (not a state reset), so active editors converge to the restored
content without corruption.

### Robust data validation
- Every API route validates input with **Zod** before touching the database.
- The sync server caps WebSocket payloads (`SYNC_MAX_PAYLOAD_BYTES`, default
  1 MiB) — a malicious multi-gigabyte payload is rejected during the protocol
  handshake instead of buffering into an OOM.
- Malformed sync messages are caught per-connection; one bad client cannot
  crash the room or the server.

### Authentication & authorization
- **Auth.js v5** (credentials provider, bcrypt-hashed passwords, JWT sessions).
- Documents support **Owner / Editor / Viewer** roles (`DocumentMember`).
- Authorization is enforced in three layers:
  1. API routes — a capability matrix (`view`/`edit`/`manage`) gates every
     endpoint; non-members get 404 so document existence isn't leaked.
  2. Sync server — clients connect with a short-lived signed JWT
     (`SYNC_TOKEN_SECRET`, HS256) minted only after a membership check. Wrong
     document or missing token → the WebSocket upgrade is rejected.
  3. **Viewers are read-only at the wire, not just the UI**: the server answers
     their sync requests (so they receive updates) but drops any update they
     try to push. A tampered client cannot bypass it.

### Tenant isolation
Strict ORM scoping: every Prisma query for document data goes through the
membership check first — there is no query path that returns another tenant's
rows. Invitations, versions, and updates all cascade from the document and are
reachable only via its access check.

### AI add-on (Groq via AI-SDK)
A document-scoped assistant panel with quick actions — **Summarize, Fix
grammar, Improve writing** — plus free-form chat about the document. Responses
stream token-by-token (`streamText`). The Groq key stays server-side; the AI
endpoint runs the same document-access check as every other route.

### Real-world considerations
- **Document state size over time:** the sync server compacts a document's
  append-only update log into a single merged snapshot once it passes a
  threshold (`SYNC_COMPACTION_THRESHOLD`), bounding storage and keeping
  cold-load hydration fast.
- **Rapid typing:** edits are debounced and merged per author before
  persistence; the editor binds directly to the CRDT so keystrokes never wait
  on the network.
- **Presence:** live cursors, names, and an avatar stack via the Yjs awareness
  protocol; a status pill shows the real connection state at all times.
- **Graceful shutdown:** the sync server flushes buffered edits to the database
  before exiting, so a deploy never drops the last few seconds of writing.

---

## Architecture

```
                    ┌─────────────────────┐
                    │   Neon (PostgreSQL)  │
                    │ users · docs · roles │
                    │ versions · updates   │
                    └──────▲───────▲───────┘
              Prisma       │       │       Prisma
        ┌──────────────────┘       └──────────────────┐
┌───────┴────────┐   signed JWT (HS256)   ┌────────────┴───────────┐
│ Next.js 16 app │ ──────────────────────▶│  Sync server (Node ws) │
│    (Vercel)    │   /api/…/sync-token    │       (Railway)        │
└───────▲────────┘                        └────────────▲───────────┘
        │ HTTPS                                        │ wss:// (Yjs sync
        │                                              │ + awareness)
     ┌──┴──────────────────────────────────────────────┴──┐
     │                       Browser                      │
     │   Tiptap editor ⇄ Y.Doc ⇄ IndexedDB (local-first)  │
     └────────────────────────────────────────────────────┘
```

## Tech stack

Next.js 16 (App Router, TypeScript) · React 19 · Tailwind CSS 4 + shadcn/ui ·
Tiptap 3 · Yjs + y-indexeddb + y-websocket · Node `ws` sync server ·
PostgreSQL (Neon) + Prisma · Auth.js v5 · Zod · Groq via AI-SDK

## Running locally

```bash
npm install
npx prisma migrate dev      # apply schema
npm run dev                 # app → http://localhost:3000
npm run sync:dev            # sync server → ws://localhost:1234 (second terminal)
```

Without the sync server the editor still works fully offline; edits persist to
IndexedDB and re-sync when it's reachable.

## Environment variables

| Variable | Used by | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | app + sync server | Postgres (pooled) |
| `DIRECT_URL` | migrations | Postgres (direct, non-pooled) |
| `AUTH_SECRET` | app | Auth.js session signing |
| `AUTH_URL` | app | Deployed origin for auth callbacks |
| `SYNC_TOKEN_SECRET` | app + sync server | Signs/verifies sync access JWTs — **must be identical on both** |
| `NEXT_PUBLIC_SYNC_SERVER_URL` | browser | Sync server URL (`wss://` in production) |
| `SYNC_MAX_PAYLOAD_BYTES` | sync server | OOM guard, default 1 MiB |
| `SYNC_COMPACTION_THRESHOLD` | sync server | Update-log compaction trigger, default 500 |
| `GROQ_API_KEY`, `GROQ_MODEL` | app | AI assistant |

## Deployment & CI/CD

Three pieces, deployed independently; both platforms **auto-deploy from `main`**
(continuous delivery — every push builds and ships):

| Piece | Platform | Notes |
| --- | --- | --- |
| Next.js app | **Vercel** | `build` runs `prisma generate && next build` |
| Sync server | **Railway** | `railway.json` pins start (`npm run sync`); needs Node ≥ 20 (`engines` field) — the WebSocket server can't run on serverless |
| Database | **Neon** | migrations applied via `npm run migrate:deploy` |

---

Made by **Madhur Pathak** — [GitHub](https://github.com/Madhur1707) ·
[LinkedIn](https://www.linkedin.com/in/madhurpathak/)
