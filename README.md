# TokenCount

> **Live demo:** https://tokencount-web-3fb1c5c792ab.herokuapp.com/ — hosted on Heroku (Eco dyno: first load after idle takes ~10s while it wakes).

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express">
  <img src="https://img.shields.io/badge/LangChain.js-1C3C3C?style=for-the-badge&logo=langchain&logoColor=white" alt="LangChain.js">
</p>
<p align="center">
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript">
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5">
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logoColor=white" alt="CSS3">
</p>
<p align="center">
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker">
  <img src="https://img.shields.io/badge/Docker%20Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker Compose">
  <img src="https://img.shields.io/badge/Heroku-430098?style=for-the-badge&logo=heroku&logoColor=white" alt="Heroku">
</p>
<p align="center">
  <img src="https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white" alt="OpenAI">
  <img src="https://img.shields.io/badge/Anthropic-191919?style=for-the-badge&logo=anthropic&logoColor=white" alt="Anthropic">
  <img src="https://img.shields.io/badge/Google%20Gemini-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white" alt="Google Gemini">
  <img src="https://img.shields.io/badge/Mistral-FA520F?style=for-the-badge&logo=mistralai&logoColor=white" alt="Mistral">
  <img src="https://img.shields.io/badge/Groq%20·%20Together%20·%20Fireworks%20·%20DeepSeek%20·%20xAI%20·%20Cohere-555555?style=for-the-badge" alt="More providers">
</p>

LLM token calculator with a client–server (Level 5) architecture:

- **frontend/** — static UI (token estimates, visualization, pricing table) served by a tiny Node server
- **backend/** — Express API that runs LangChain.js server-side; API keys live here as env vars and never reach the browser

```
Browser ──► frontend (:8080, static files + /config.js)
   │
   └─ fetch ──► backend (:3000, /api/invoke) ──► OpenAI / Anthropic / Google / …
```

## Demo video

https://github.com/user-attachments/assets/2c73e658-5c39-4650-a14b-50ad4a274689


[▶ Watch the demo](assets/demo.mp4) *(2.3 MB, MP4)*

> For an inline video player on GitHub: open this README in GitHub's web editor and drag
> `assets/demo.mp4` into it — GitHub uploads the file and inserts a URL that renders as a
> player. Replace the placeholder link above with that URL. A committed `.mp4` linked
> directly (like the link above) works everywhere but downloads instead of playing inline.

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
