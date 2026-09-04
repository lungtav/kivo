# Kivo

Realtime chat platform — spaces, categories, channels, and messaging with a websocket layer.

## Stack

- **Backend** (`backend/`): Node + Express 5 + TypeScript, Postgres (Neon), Redis (BullMQ queues + rate limiting), socket.io, Resend (transactional email), Backblaze B2 (media storage).
- **Frontend** (`frontend/`): React + Vite + Tailwind, socket.io-client.

## Development

### Backend

```bash
cd backend
npm install

# 1. Configure environment
cp .env .env.local   # or create .env — see src/config/env.ts for required keys

# 2. Run schema migrations (must run from backend/ — the runner resolves migrations relative to cwd)
npm run db:migrate

# 3. Run the API + websocket server
npm run dev
```

### Workers (separate process, required)

```bash
cd backend
npm run dev:worker
```

BullMQ workers run in a **dedicated process**, deliberately separate from the API server. The API only enqueues jobs (verification email, attachment processing); the worker process consumes them. This keeps heavy or slow jobs from competing with request handling for CPU, and lets the worker scale independently as workload grows.

The API is not fully functional without a running worker — for example, verification emails are only delivered once `dev:worker` is up, because that is where the email queue is drained.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server proxies `/api` and `/socket.io` to the backend (target configurable via `VITE_API_TARGET`, default `http://localhost:5000`), so realtime works in development without extra configuration.
