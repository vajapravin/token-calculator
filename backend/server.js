import "dotenv/config";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { PROVIDERS, buildChat } from "./providers.js";

const app = express();
app.set("trust proxy", 1); // Heroku sits behind a router/proxy

app.use(express.json({ limit: "2mb" }));

// CORS: allow the frontend origin (comma-separated list supported). "*" for quick local dev.
const origins = (process.env.FRONTEND_ORIGIN || "*").split(",").map((s) => s.trim());
app.use(cors({ origin: origins.includes("*") ? true : origins }));

// Basic protection: without this, a public backend lets strangers spend your API credits.
app.use(
  "/api/",
  rateLimit({
    windowMs: 60_000,
    max: Number(process.env.RATE_LIMIT_PER_MIN || 30),
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Rate limit exceeded — try again in a minute." },
  })
);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, uptime_s: Math.round(process.uptime()) });
});

// Which providers exist and which have a key configured (never returns the keys themselves).
app.get("/api/providers", (_req, res) => {
  res.json(
    Object.entries(PROVIDERS).map(([id, p]) => ({
      id,
      label: p.label,
      models: p.models,
      envKey: p.envKey,
      hasKey: Boolean(process.env[p.envKey]),
    }))
  );
});

app.post("/api/invoke", async (req, res) => {
  const { provider, model, prompt, temperature = 0.7, maxTokens = 512 } = req.body || {};

  const p = PROVIDERS[provider];
  if (!p) return res.status(400).json({ error: `Unknown provider "${provider}".` });
  if (!prompt || !String(prompt).trim()) return res.status(400).json({ error: "prompt is required." });
  if (!model || !String(model).trim()) return res.status(400).json({ error: "model is required." });

  const apiKey = process.env[p.envKey];
  if (!apiKey) {
    return res.status(400).json({ error: `No ${p.envKey} configured on the server. Set it and restart.` });
  }

  try {
    const chat = buildChat(p, {
      model: String(model).trim(),
      apiKey,
      temperature: Number(temperature),
      maxTokens: Number(maxTokens),
    });

    const t0 = Date.now();
    const result = await chat.invoke(String(prompt));
    const latency_ms = Date.now() - t0;

    const u = result.usage_metadata || {};
    const text =
      typeof result.content === "string"
        ? result.content
        : Array.isArray(result.content)
          ? result.content.map((c) => c.text || "").join("")
          : JSON.stringify(result.content);

    res.json({
      provider,
      model,
      text,
      usage: {
        input_tokens: u.input_tokens ?? null,
        output_tokens: u.output_tokens ?? null,
        total_tokens: u.total_tokens ?? null,
      },
      latency_ms,
    });
  } catch (err) {
    const status = err?.status || err?.response?.status;
    const code = status >= 400 && status < 600 ? status : 500;
    res.status(code).json({ error: err?.message || String(err) });
  }
});

const port = process.env.PORT || 3000; // Heroku injects PORT
app.listen(port, () => console.log(`TokenCount API listening on :${port}`));
