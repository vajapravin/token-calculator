# TokenCount

LLM token calculator with a client–server architecture:

- **frontend/** — static UI (token estimates, visualization, pricing table) served by a tiny Node server
- **backend/** — Express API that runs LangChain.js server-side; API keys live here as env vars and never reach the browser

```
Browser ──► frontend (:8080, static files + /config.js)
   │
   └─ fetch ──► backend (:3000, /api/invoke) ──► OpenAI / Anthropic / Google / …
```

## Run locally with Docker

```bash
cp backend/.env.example backend/.env   # add the API keys you have
docker compose up --build
```

- UI: http://localhost:8080
- API health: http://localhost:3000/api/health

Providers without a key still appear in the UI, marked "no server key".
Settings → Backend status shows connectivity and which keys are configured.

## Run locally without Docker

```bash
cd backend  && npm install && cp .env.example .env && npm start   # :3000
cd frontend && npm install && npm start                            # :8080
```

## API

| Method | Path            | Body / Notes |
|--------|-----------------|--------------|
| GET    | /api/health     | liveness check |
| GET    | /api/providers  | providers, suggested models, hasKey flags |
| POST   | /api/invoke     | `{ provider, model, prompt, temperature?, maxTokens? }` → `{ text, usage:{input_tokens,output_tokens,total_tokens}, latency_ms }` |

Rate limited per IP (default 30 req/min, `RATE_LIMIT_PER_MIN`).

## Deploy to Heroku (container stack, two apps)

```bash
heroku login && heroku container:login

# ---- backend ----
heroku create tokencount-api --stack container   # pick your own unique names
cd backend
heroku container:push web -a tokencount-api
heroku container:release web -a tokencount-api
heroku config:set -a tokencount-api \
  OPENAI_API_KEY=sk-... \
  FRONTEND_ORIGIN=https://tokencount-web-XXXX.herokuapp.com
cd ..

# ---- frontend ----
heroku create tokencount-web --stack container
cd frontend
heroku container:push web -a tokencount-web
heroku container:release web -a tokencount-web
heroku config:set -a tokencount-web \
  API_BASE=https://tokencount-api-XXXX.herokuapp.com
```

Notes:
- Both servers read `process.env.PORT`, which Heroku injects — required for Heroku Docker apps.
- Set `FRONTEND_ORIGIN` on the backend to the frontend's exact https URL (CORS), and
  `API_BASE` on the frontend to the backend's https URL. Use `heroku apps:info` to get the URLs.
- Config changes: just `heroku config:set` again — no rebuild needed.

## Hardening before sharing publicly

The backend spends *your* API credits. Before exposing it beyond yourself:
1. Lower `RATE_LIMIT_PER_MIN` and/or add per-key budgets at the provider dashboards.
2. Add authentication (even a single shared bearer token checked in middleware).
3. Pin `FRONTEND_ORIGIN` to your exact frontend URL — never `*` in production.
