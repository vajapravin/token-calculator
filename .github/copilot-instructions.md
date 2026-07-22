# Copilot Instructions for TokenCount

## Project shape
- TokenCount is a two-app Node.js monorepo: `frontend/` is a static browser UI, and `backend/` is the only place that talks to LLM providers.
- Keep provider API keys server-side only. The browser should never receive secrets; it only learns whether a backend key is configured.
- The browser UI is mostly self-contained in `frontend/public/index.html`, which includes the markup, styles, and app logic in one file.

## Runtime flow
- Frontend serves `/config.js` at runtime from `frontend/server.js`; it injects `window.API_BASE` so the same image works locally and on Heroku.
- The UI discovers providers from `GET /api/providers` and invokes models with `POST /api/invoke`.
- Backend `backend/server.js` uses `backend/providers.js` as the provider registry and LangChain chat wrappers.
- `backend/providers.js` is the source of truth for provider labels, env var names, model lists, and OpenAI-compatible base URLs.

## Key files
- [backend/server.js](../backend/server.js) — Express API, CORS, rate limiting, health check, provider discovery, and invoke handler.
- [backend/providers.js](../backend/providers.js) — provider catalog and `buildChat()` factory.
- [frontend/server.js](../frontend/server.js) — static file server plus runtime config endpoint.
- [frontend/public/index.html](../frontend/public/index.html) — calculator UI, local token estimation, pricing table, backend invoke flow.
- [README.md](../README.md) — canonical local run and Heroku deployment notes.

## Developer workflow
- Local Docker workflow: `cp backend/.env.example backend/.env` then `docker compose up --build`.
- Local non-Docker workflow: `cd backend && npm install && npm start`, and separately `cd frontend && npm install && npm start`.
- Backend dev mode is `npm run dev` in `backend/` and uses `node --watch server.js`.
- Target Node.js 20+; both packages are ESM (`"type": "module"`).

## Editing conventions
- Add or rename providers in `backend/providers.js`, then make sure the frontend still handles the new provider in the provider picker and status display.
- Preserve the backend contract: `/api/invoke` returns `{ text, usage, latency_ms }`, and `/api/providers` includes `hasKey` without exposing secrets.
- Keep CORS and env-var behavior aligned with the README: `FRONTEND_ORIGIN` for backend access control, `API_BASE` for the browser-facing API URL.
- Respect the existing rate limit middleware on `/api/*`; it protects API credits and should not be removed casually.

## Frontend patterns
- The UI uses `window.API_BASE` from `/config.js`; avoid hard-coding backend URLs in the browser bundle.
- Provider state is loaded dynamically at startup; if the backend is unreachable, the settings panel should surface that clearly instead of failing silently.
- Most UI logic lives in inline script blocks in `frontend/public/index.html`, so keep related state, rendering, and event wiring together when making changes.
- The local token count is an estimate; the billed count comes only from a successful backend invocation.

## Deployment and containers
- Dockerfiles for both apps install production dependencies only and run `node server.js`.
- Heroku/container deployment depends on `process.env.PORT`, so preserve that behavior in both servers.
- Backend deployment expects provider keys in environment variables like `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, and `GOOGLE_API_KEY`.

## When changing code
- Prefer minimal, targeted edits that preserve the current browser/backend split.
- If you add a new provider, update the registry, the backend status output, and any frontend labels or defaults that assume a fixed provider set.
- Validate changes by checking the API endpoints and the browser flow rather than by introducing new abstractions.