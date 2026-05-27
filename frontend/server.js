// Tiny static server for the frontend.
// Also serves /config.js generated from env, so the same image works
// locally (API_BASE=http://localhost:3000) and on Heroku (your API app URL).
import express from "express";

const app = express();

app.get("/config.js", (_req, res) => {
  const apiBase = process.env.API_BASE || "http://localhost:3000";
  res
    .type("application/javascript")
    .set("Cache-Control", "no-store")
    .send(`window.API_BASE = ${JSON.stringify(apiBase)};`);
});

app.use(express.static("public", { extensions: ["html"] }));

const port = process.env.PORT || 8080; // Heroku injects PORT
app.listen(port, () => console.log(`TokenCount frontend on :${port}`));
