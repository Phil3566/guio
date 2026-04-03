require("dotenv").config();
const express = require("express");
const path = require("path");
const FaqCache = require("./lib/faq-cache");
const { getPrompt, isOffTopic } = require("./lib/system-prompts");

const app = express();
const PORT = process.env.PORT || 8080;

// Initialize FAQ cache
const DB_PATH = path.join(__dirname, "db", "faq.db");
const faqCache = new FaqCache(DB_PATH);

app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, "public")));

// Chat API proxy — keeps the API key on the server
app.post("/api/chat", async (req, res) => {
  // --- FAQ cache intercept (before API key check — cached answers are free) ---
  const messages = req.body.messages || [];
  const lastMessage = messages[messages.length - 1];
  const isTextOnly = lastMessage
    && lastMessage.role === "user"
    && typeof lastMessage.content === "string";
  const isFirstQuestion = messages.filter(m => m.role === "user").length === 1;
  const deviceId = req.body.device_id || "panasonic-nn-sc73ls";
  const questionText = isTextOnly ? lastMessage.content : "";

  if (isTextOnly) {
    const match = faqCache.match(deviceId, questionText);
    if (match) {
      console.log(`FAQ cache HIT (score=${match.score.toFixed(3)}): "${questionText}"`);
      faqCache.recordHit(deviceId);
      faqCache.logRequest(deviceId, questionText, "cache", 0);
      return res.json({
        content: [{ type: "text", text: match.answer }],
        model: "faq-cache",
        stop_reason: "end_turn",
        usage: { input_tokens: 0, output_tokens: 0 }
      });
    }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured" });
  }

  // Use server-side system prompt if available; fall back to client-sent for other devices
  const techLevel = req.body.tech_level || "simple";
  const serverPrompt = getPrompt(deviceId, techLevel);
  const system = serverPrompt || req.body.system;

  // Detect off-topic questions
  const offTopic = isTextOnly ? isOffTopic(deviceId, questionText) : false;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: req.body.model || "claude-haiku-4-5-20251001",
        max_tokens: req.body.max_tokens || 512,
        system: system,
        messages: req.body.messages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    faqCache.recordMiss(deviceId);

    // Log the question
    if (isTextOnly) {
      faqCache.logRequest(deviceId, questionText, "api", offTopic);
      if (offTopic) {
        console.log(`OFF-TOPIC (not cached): "${questionText}"`);
      }
    }

    // Save new Q&A to cache for future use — skip off-topic questions
    if (isTextOnly && !offTopic && questionText.length >= 20 && data.content && data.content[0]) {
      try {
        faqCache.insert(deviceId, questionText, data.content[0].text, 1);
      } catch (e) {
        console.error("FAQ cache insert error:", e.message);
      }
    }

    res.json(data);
  } catch (err) {
    console.error("API proxy error:", err);
    res.status(500).json({ error: "Failed to reach AI service" });
  }
});

// Admin stats dashboard
app.get("/admin/stats", (req, res) => {
  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey || req.query.key !== adminKey) {
    return res.status(403).send("Forbidden");
  }

  const stats = faqCache.getStats();
  const recentRequests = faqCache.getRecentRequests(50);
  const totalHits = stats.allTimeStats.total_cache_hits;
  const totalApi = stats.allTimeStats.total_api_calls;
  const totalRequests = totalHits + totalApi;
  const hitRate = totalRequests > 0 ? ((totalHits / totalRequests) * 100).toFixed(1) : "0.0";

  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  let deviceRows = stats.devices.map(d => `
    <tr>
      <td>${esc(d.device_id)}</td>
      <td>${d.total_entries}</td>
      <td>${d.seeded}</td>
      <td>${d.generated}</td>
      <td>${d.total_hits}</td>
    </tr>`).join("");

  let topRows = stats.topQuestions.map(q => `
    <tr>
      <td>${esc(q.device_id)}</td>
      <td>${esc(q.question)}</td>
      <td>${q.hit_count}</td>
    </tr>`).join("");

  let newRows = stats.newQuestions.length > 0
    ? stats.newQuestions.map(q => `
    <tr>
      <td>${esc(q.device_id)}</td>
      <td>${esc(q.question)}</td>
      <td title="${esc(q.answer)}">${esc(q.answer.substring(0, 80))}${q.answer.length > 80 ? "..." : ""}</td>
      <td>${q.created_at}</td>
      <td>${q.hit_count}</td>
    </tr>`).join("")
    : '<tr><td colspan="5" style="text-align:center;color:#888;">No auto-cached questions yet</td></tr>';

  let dailyRows = stats.dailyTotals.map(d => {
    const dayTotal = d.cache_hits + d.api_calls;
    const dayRate = dayTotal > 0 ? ((d.cache_hits / dayTotal) * 100).toFixed(1) : "0.0";
    return `
    <tr>
      <td>${d.date}</td>
      <td>${d.cache_hits}</td>
      <td>${d.api_calls}</td>
      <td>${dayRate}%</td>
    </tr>`;
  }).join("");

  let zeroRows = stats.zeroHits.map(q => `
    <tr>
      <td>${esc(q.device_id)}</td>
      <td>${esc(q.question)}</td>
    </tr>`).join("");

  let requestRows = recentRequests.length > 0
    ? recentRequests.map(r => `
    <tr${r.off_topic ? ' style="background:#fff3e0;"' : ""}>
      <td>${r.created_at}</td>
      <td>${esc(r.device_id)}</td>
      <td>${esc(r.question)}</td>
      <td>${r.source}</td>
      <td>${r.off_topic ? "Yes" : ""}</td>
    </tr>`).join("")
    : '<tr><td colspan="5" style="text-align:center;color:#888;">No requests logged yet</td></tr>';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>RTFM For Me — Admin Stats</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f5f5f5; color: #333; padding: 20px; max-width: 960px; margin: 0 auto; }
  h1 { font-size: 22px; margin-bottom: 20px; color: #1a1a1a; }
  h2 { font-size: 16px; margin: 28px 0 10px; color: #555; text-transform: uppercase; letter-spacing: 0.5px; }
  .summary { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 24px; }
  .card { background: white; border-radius: 8px; padding: 16px 20px; flex: 1; min-width: 140px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  .card .label { font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
  .card .value { font-size: 28px; font-weight: 700; margin-top: 4px; }
  .card .value.green { color: #2e7d32; }
  .card .value.blue { color: #1565c0; }
  .card .value.orange { color: #e65100; }
  .card .value.red { color: #c62828; }
  table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 16px; }
  th { background: #fafafa; text-align: left; padding: 10px 12px; font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #eee; }
  td { padding: 10px 12px; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
  tr:last-child td { border-bottom: none; }
  .ts { font-size: 12px; color: #aaa; margin-top: 20px; text-align: center; }
</style>
</head>
<body>
<h1>RTFM For Me — Admin Stats</h1>

<div class="summary">
  <div class="card"><div class="label">Cache Hits</div><div class="value green">${totalHits}</div></div>
  <div class="card"><div class="label">API Calls</div><div class="value blue">${totalApi}</div></div>
  <div class="card"><div class="label">Hit Rate</div><div class="value orange">${hitRate}%</div></div>
  <div class="card"><div class="label">Total Q&amp;As</div><div class="value">${stats.devices.reduce((s, d) => s + d.total_entries, 0)}</div></div>
  <div class="card"><div class="label">Off-Topic</div><div class="value red">${recentRequests.filter(r => r.off_topic).length}</div></div>
</div>

<h2>Devices</h2>
<table>
  <tr><th>Device</th><th>Entries</th><th>Seeded</th><th>Auto-cached</th><th>Cache Hits</th></tr>
  ${deviceRows}
</table>

<h2>Top Questions (by cache hits)</h2>
<table>
  <tr><th>Device</th><th>Question</th><th>Hits</th></tr>
  ${topRows || '<tr><td colspan="3" style="text-align:center;color:#888;">No cache hits yet</td></tr>'}
</table>

<h2>New Questions Learned from Users</h2>
<table>
  <tr><th>Device</th><th>Question</th><th>Answer (preview)</th><th>Date</th><th>Hits Since</th></tr>
  ${newRows}
</table>

<h2>Recent Questions (last 50)</h2>
<table>
  <tr><th>Date</th><th>Device</th><th>Question</th><th>Source</th><th>Off-Topic</th></tr>
  ${requestRows}
</table>

<h2>Daily Breakdown (last 30 days)</h2>
<table>
  <tr><th>Date</th><th>Cache Hits</th><th>API Calls</th><th>Hit Rate</th></tr>
  ${dailyRows || '<tr><td colspan="4" style="text-align:center;color:#888;">No data yet</td></tr>'}
</table>

<h2>Never-Hit Seed Questions</h2>
<table>
  <tr><th>Device</th><th>Question</th></tr>
  ${zeroRows || '<tr><td colspan="2" style="text-align:center;color:#888;">All seed questions have been hit at least once</td></tr>'}
</table>

<div class="ts">Generated ${new Date().toISOString().replace("T", " ").slice(0, 19)} UTC</div>
</body>
</html>`;

  res.send(html);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  const devices = [...faqCache.cache.keys()];
  console.log(`FAQ cache loaded: ${devices.length ? devices.join(", ") : "no devices"}`);
});
