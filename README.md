# Kivo

Realtime chat platform — spaces, channels, direct messages, and profiles, in a black-and-white interface with light and dark modes.

- **Backend** (`backend/`): Node + Express 5 + TypeScript, Postgres (Neon-compatible), Redis (BullMQ + rate limiting + presence), socket.io, Resend (verification email), Backblaze B2 (attachments).
- **Frontend** (`frontend/`): React + Vite + Tailwind v4, socket.io-client.

## Features

- **Spaces & channels** — categories, positions, admin-only creation, join-on-open for members.
- **Messaging** — realtime send/receive with typing indicators, replies, edit and delete (deleted messages stay as tombstones), markdown (`**bold**`, `*italic*`, `` `code` ``, fenced code blocks, links), file/image attachments with inline previews, date grouping, paginated history.
- **Direct messages** — a dedicated DMs home with search, unread badges, Seen receipts, group DMs, and global user search by name or @username (Ctrl/Cmd + K jumps anywhere).
- **People** — profiles with bio, avatars (auto-resized), presence dots, shared spaces and groups in common.
- **Access** — invite links with limits and revocation, roles (owner/admin/member), kick and leave.
- **Preferences** — light/dark theme (persisted, no flash on load), composer drafts per conversation, unread count in the tab title.

## Development

### Backend

```bash
cd backend
npm install
cp .env.example .env        # then fill in real values

npm run db:migrate          # applies SQL migrations (run from backend/)
npm run dev                 # API + websocket server on :5000
```

### Workers (separate process, required)

```bash
cd backend
npm run dev:worker
```

BullMQ workers run in a **dedicated process**, deliberately separate from the API server. The API only enqueues jobs (verification email, attachment processing); the worker process drains the queues. This keeps heavy jobs from competing with request handling and lets workers scale independently.

The API is not fully functional without a running worker — verification emails, for example, are only delivered once `dev:worker` is up.

### Frontend

```bash
cd frontend
npm install
npm run dev                 # Vite dev server on :5173
```

The Vite dev server proxies `/api` and `/socket.io` to the backend (`VITE_API_TARGET`, default `http://localhost:5000`), so no CORS setup is needed in development.

## Environment

All backend configuration lives in `backend/.env` — see [`backend/.env.example`](backend/.env.example) for every key with commentary. Requirements: Postgres, Redis, a Resend key (signup emails), and a Backblaze B2 bucket (message attachments). Frontend vars are documented in [`frontend/.env.example`](frontend/.env.example).

## Notes

- Migrations live in `backend/src/infrastructure/database/migrations/` and are tracked by filename in a `schema_migrations` table.
- The theme (light/dark) is stored in `localStorage` under `kivo_theme` and applied before first paint.
- Health check: `GET /api/health`.
