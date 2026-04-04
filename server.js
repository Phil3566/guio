require("dotenv").config();
const express = require("express");
const path = require("path");
const FaqCache = require("./lib/faq-cache");
const { getPrompt, isOffTopic, isInjection } = require("./lib/system-prompts");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const helmet = require("helmet");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 8080;

// Initialize FAQ cache
const DB_PATH = path.join(__dirname, "db", "faq.db");
const faqCache = new FaqCache(DB_PATH);

// Security headers (allow inline scripts + onclick — device pages use inline JS throughout)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"]
    }
  }
}));

// CORS — only allow requests from our own domain (and localhost for dev)
app.use(cors({
  origin: process.env.NODE_ENV === "production"
    ? "https://rtfmforme.app"
    : true
}));

app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, "public")));

// Rate limiting — configurable via admin settings
function buildLimiter(maxRequests, message) {
  return rateLimit({
    windowMs: 60 * 1000,
    max: maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: message }
  });
}

let chatLimiter = buildLimiter(
  parseInt(faqCache.getSetting("ip_rate_limit", 10)),
  "Too many requests — please wait a moment"
);
let sessionLimiter = buildLimiter(
  parseInt(faqCache.getSetting("session_creation_rate", 5)),
  "Too many session requests"
);

// Wrapper middleware that delegates to current limiter instance (allows hot-swap)
const chatLimiterMiddleware = (req, res, next) => chatLimiter(req, res, next);
const sessionLimiterMiddleware = (req, res, next) => sessionLimiter(req, res, next);

app.post("/api/session", sessionLimiterMiddleware, (req, res) => {
  const fingerprint = req.body.fingerprint;
  if (!fingerprint || typeof fingerprint !== "string" || fingerprint.length > 64) {
    return res.status(400).json({ error: "Invalid fingerprint" });
  }
  const token = crypto.randomBytes(16).toString("hex");
  faqCache.createSession(token, fingerprint, req.ip);
  res.json({ token });
});

// Device ID whitelist — reject unknown devices
const VALID_DEVICES = new Set([
  // "panasonic-nn-sc73ls",
  "pastigio-frameo-frame",
  // "toshiba-em131a5c",
  // "emeril-air-fryer",
]);

// Chat API proxy — keeps the API key on the server
app.post("/api/chat", chatLimiterMiddleware, async (req, res) => {
  // --- FAQ cache intercept (before API key check — cached answers are free) ---
  const messages = req.body.messages || [];
  const lastMessage = messages[messages.length - 1];
  const isTextOnly = lastMessage
    && lastMessage.role === "user"
    && typeof lastMessage.content === "string";
  const isFirstQuestion = messages.filter(m => m.role === "user").length === 1;
  const deviceId = req.body.device_id || "panasonic-nn-sc73ls";
  const questionText = isTextOnly ? lastMessage.content : "";

  // --- Device ID validation ---
  if (!VALID_DEVICES.has(deviceId)) {
    return res.status(400).json({ error: "Unknown device" });
  }

  // --- Message length validation ---
  if (isTextOnly && questionText.length > 2000) {
    return res.status(400).json({ error: "Message too long — please keep questions under 2,000 characters" });
  }

  // --- Session + fingerprint validation ---
  const sessionToken = req.body.session_token;
  const fingerprint = req.body.fingerprint;
  if (sessionToken && fingerprint) {
    const limits = faqCache.checkLimits(sessionToken, fingerprint);
    if (!limits.allowed) {
      console.log(`SESSION BLOCKED (${limits.reason}): token=${sessionToken.slice(0, 8)}... fp=${fingerprint}`);
      return res.status(429).json({ error: "Usage limit reached — please try again later", reason: limits.reason });
    }
    faqCache.incrementSession(sessionToken);
  }

  if (isTextOnly) {
    const match = faqCache.match(deviceId, questionText);
    if (match) {
      console.log(`FAQ cache HIT (score=${match.score.toFixed(3)}): "${questionText}"`);
      faqCache.recordHit(deviceId);
      faqCache.logRequest(deviceId, questionText, "cache", 0);
      const resources = match.topic ? faqCache.getResources(deviceId, match.topic) : null;
      return res.json({
        content: [{ type: "text", text: match.answer }],
        resources: resources,
        model: "faq-cache",
        stop_reason: "end_turn",
        usage: { input_tokens: 0, output_tokens: 0 }
      });
    }
  }

  // --- Daily API cost cap ---
  const dailyLimit = parseInt(faqCache.getSetting("daily_api_cap", process.env.DAILY_API_LIMIT || 500));
  if (faqCache.getTodayApiCalls() >= dailyLimit) {
    console.log(`DAILY CAP reached (${dailyLimit} API calls)`);
    return res.json({
      content: [{ type: "text", text: "Ollie is taking a quick rest — I've had a lot of questions today! Cached answers still work, but for new questions please try again tomorrow. Thanks for your patience!" }],
      model: "daily-cap",
      stop_reason: "end_turn",
      usage: { input_tokens: 0, output_tokens: 0 }
    });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured" });
  }

  // Use server-side system prompt if available; fall back to client-sent for other devices
  const serverPrompt = getPrompt(deviceId);
  const system = serverPrompt || req.body.system;

  // Detect off-topic questions
  const offTopic = isTextOnly ? isOffTopic(deviceId, questionText) : false;

  // --- Prompt injection detection ---
  if (isTextOnly && isInjection(questionText)) {
    console.log(`INJECTION BLOCKED: "${questionText}"`);
    faqCache.logRequest(deviceId, questionText, "blocked", 1);
    return res.json({
      content: [{ type: "text", text: "I'm only set up to help with your device — could you rephrase your question?" }],
      model: "guardrail",
      stop_reason: "end_turn",
      usage: { input_tokens: 0, output_tokens: 0 }
    });
  }

  // Cap conversation history — keep last 10 messages (5 user + 5 assistant)
  const MAX_MESSAGES = 10;
  const trimmedMessages = messages.length > MAX_MESSAGES
    ? messages.slice(-MAX_MESSAGES)
    : messages;

  // 30-second timeout — prevents hanging API calls from tying up the server
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 512,
        system: system,
        messages: trimmedMessages,
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

    clearTimeout(timeout);
    res.json(data);
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === "AbortError") {
      console.error("API timeout after 30s");
      return res.status(504).json({ error: "AI service took too long — please try again" });
    }
    console.error("API proxy error:", err);
    res.status(500).json({ error: "Failed to reach AI service" });
  }
});

// Public config endpoint — returns non-sensitive settings for client use
app.get("/api/config", (req, res) => {
  const timeout = parseInt(faqCache.getSetting("session_expiry_minutes", 30));
  res.json({ session_timeout_minutes: timeout });
});

// Admin settings endpoint — update configurable rate limits and caps
const SETTINGS_SCHEMA = {
  ip_rate_limit:           { min: 1, max: 100,   default: 10  },
  session_creation_rate:   { min: 1, max: 50,    default: 5   },
  session_request_cap:     { min: 1, max: 1000,  default: 50  },
  fingerprint_lifetime_cap:{ min: 1, max: 10000, default: 200 },
  daily_api_cap:           { min: 1, max: 10000, default: 500 },
  session_expiry_minutes:  { min: 1, max: 1440,  default: 30  },
};

app.post("/admin/settings", (req, res) => {
  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey || req.query.key !== adminKey) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const errors = [];
  const updates = {};

  for (const [key, val] of Object.entries(req.body)) {
    const schema = SETTINGS_SCHEMA[key];
    if (!schema) {
      errors.push(`Unknown setting: ${key}`);
      continue;
    }
    const num = parseInt(val);
    if (isNaN(num) || num < schema.min || num > schema.max) {
      errors.push(`${key} must be an integer between ${schema.min} and ${schema.max}`);
      continue;
    }
    updates[key] = num;
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join("; ") });
  }

  for (const [key, val] of Object.entries(updates)) {
    faqCache.setSetting(key, val);
  }

  // Rebuild rate limiters if relevant settings changed
  if (updates.ip_rate_limit !== undefined) {
    chatLimiter = buildLimiter(updates.ip_rate_limit, "Too many requests — please wait a moment");
  }
  if (updates.session_creation_rate !== undefined) {
    sessionLimiter = buildLimiter(updates.session_creation_rate, "Too many session requests");
  }

  res.json({ ok: true, updated: updates });
});

// Admin stats dashboard
app.get("/admin/stats", (req, res) => {
  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey || req.query.key !== adminKey) {
    return res.status(403).send("Forbidden");
  }

  // Device filter from query param
  const selectedDevice = req.query.device || null;
  const allDeviceIds = [...VALID_DEVICES];

  const stats = faqCache.getStats(selectedDevice);
  const sessionStats = faqCache.getSessionStats();
  const recentRequests = faqCache.getRecentRequests(50, selectedDevice);
  const totalHits = stats.allTimeStats.total_cache_hits;
  const totalApi = stats.allTimeStats.total_api_calls;
  const totalRequests = totalHits + totalApi;
  const hitRate = totalRequests > 0 ? ((totalHits / totalRequests) * 100).toFixed(1) : "0.0";
  const dailyLimit = parseInt(faqCache.getSetting("daily_api_cap", process.env.DAILY_API_LIMIT || 500));
  const todayApi = faqCache.getTodayApiCalls();
  const dailyLeft = Math.max(0, dailyLimit - todayApi);

  // Current settings for the form
  const settings = faqCache.getAllSettings();
  const settingVal = (key, def) => settings[key] !== undefined ? settings[key] : def;

  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // Build base URL preserving admin key
  const baseUrl = `/admin/stats?key=${encodeURIComponent(req.query.key)}`;

  // Device selector buttons
  const deviceButtons = `
    <a href="${baseUrl}" style="display:inline-block;padding:8px 16px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:600;margin-right:6px;margin-bottom:6px;${!selectedDevice ? 'background:#1565c0;color:white;' : 'background:white;color:#333;border:1px solid #ddd;'}">All Devices</a>
    ${allDeviceIds.map(d => `<a href="${baseUrl}&device=${encodeURIComponent(d)}" style="display:inline-block;padding:8px 16px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:600;margin-right:6px;margin-bottom:6px;${selectedDevice === d ? 'background:#1565c0;color:white;' : 'background:white;color:#333;border:1px solid #ddd;'}">${esc(d)}</a>`).join("")}`;

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
<title>RTFM For Me — Admin Dashboard</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f5f5f5; color: #333; padding: 20px; max-width: 960px; margin: 0 auto; }
  h1 { font-size: 22px; margin-bottom: 6px; color: #1a1a1a; }
  h2 { font-size: 16px; margin: 28px 0 10px; color: #555; text-transform: uppercase; letter-spacing: 0.5px; }
  .device-bar { margin: 16px 0 20px; }
  .device-bar-label { font-size: 13px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
  .summary { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 24px; }
  .card { background: white; border-radius: 8px; padding: 16px 20px; flex: 1; min-width: 120px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  .card .label { font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
  .card .value { font-size: 28px; font-weight: 700; margin-top: 4px; }
  .card .value.green { color: #2e7d32; }
  .card .value.blue { color: #1565c0; }
  .card .value.orange { color: #e65100; }
  .card .value.red { color: #c62828; }
  .card .value.purple { color: #6a1b9a; }
  table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 16px; }
  th { background: #fafafa; text-align: left; padding: 10px 12px; font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #eee; }
  td { padding: 10px 12px; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
  tr:last-child td { border-bottom: none; }
  .settings-box { background: white; border-radius: 8px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-top: 10px; }
  .settings-box h2 { margin-top: 0; }
  .settings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px; }
  .setting-row label { display: block; font-size: 13px; color: #555; margin-bottom: 4px; }
  .setting-row input { width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 15px; font-family: inherit; }
  .setting-row input:focus { outline: none; border-color: #1565c0; box-shadow: 0 0 0 2px rgba(21,101,192,0.15); }
  .save-btn { display: inline-block; margin-top: 16px; padding: 10px 28px; background: #1565c0; color: white; border: none; border-radius: 6px; font-size: 15px; font-weight: 600; cursor: pointer; }
  .save-btn:hover { background: #0d47a1; }
  .save-btn:disabled { background: #aaa; cursor: not-allowed; }
  .status-msg { display: inline-block; margin-left: 12px; font-size: 14px; }
  .status-msg.ok { color: #2e7d32; }
  .status-msg.err { color: #c62828; }
  .ts { font-size: 12px; color: #aaa; margin-top: 20px; text-align: center; }
</style>
</head>
<body>
<h1>RTFM For Me — Admin Dashboard</h1>

<div class="device-bar">
  <div class="device-bar-label">Filter by device</div>
  ${deviceButtons}
</div>

<div class="summary">
  <div class="card"><div class="label">Cache Hits</div><div class="value green">${totalHits}</div></div>
  <div class="card"><div class="label">API Calls</div><div class="value blue">${totalApi}</div></div>
  <div class="card"><div class="label">Hit Rate</div><div class="value orange">${hitRate}%</div></div>
  <div class="card"><div class="label">Total Q&amp;As</div><div class="value">${stats.devices.reduce((s, d) => s + d.total_entries, 0)}</div></div>
  <div class="card"><div class="label">Daily Left</div><div class="value purple">${dailyLeft}</div></div>
  <div class="card"><div class="label">Sessions (24h)</div><div class="value">${sessionStats.active}</div></div>
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

<h2>Top Devices by Requests (fingerprint)</h2>
<table>
  <tr><th>Fingerprint</th><th>Sessions</th><th>Total Requests</th></tr>
  ${sessionStats.topFingerprints.length > 0
    ? sessionStats.topFingerprints.map(f => `
    <tr>
      <td><code>${esc(f.fingerprint.slice(0, 12))}...</code></td>
      <td>${f.session_count}</td>
      <td>${f.total_requests}</td>
    </tr>`).join("")
    : '<tr><td colspan="3" style="text-align:center;color:#888;">No sessions yet</td></tr>'}
</table>

<div class="settings-box">
  <h2>Settings <span style="font-size:12px;color:#888;text-transform:none;letter-spacing:0;font-weight:400;">Global</span></h2>
  <div class="settings-grid">
    <div class="setting-row">
      <label for="s_ip_rate_limit">IP rate limit (req/min)</label>
      <input type="number" id="s_ip_rate_limit" value="${settingVal("ip_rate_limit", 10)}" min="1" max="100">
    </div>
    <div class="setting-row">
      <label for="s_session_creation_rate">Session creation rate (/min)</label>
      <input type="number" id="s_session_creation_rate" value="${settingVal("session_creation_rate", 5)}" min="1" max="50">
    </div>
    <div class="setting-row">
      <label for="s_session_request_cap">Session request cap</label>
      <input type="number" id="s_session_request_cap" value="${settingVal("session_request_cap", 50)}" min="1" max="1000">
    </div>
    <div class="setting-row">
      <label for="s_fingerprint_lifetime_cap">Fingerprint lifetime cap</label>
      <input type="number" id="s_fingerprint_lifetime_cap" value="${settingVal("fingerprint_lifetime_cap", 200)}" min="1" max="10000">
    </div>
    <div class="setting-row">
      <label for="s_daily_api_cap">Daily API call cap</label>
      <input type="number" id="s_daily_api_cap" value="${settingVal("daily_api_cap", 500)}" min="1" max="10000">
    </div>
    <div class="setting-row">
      <label for="s_session_expiry_minutes">Session expiry (minutes)</label>
      <input type="number" id="s_session_expiry_minutes" value="${settingVal("session_expiry_minutes", 30)}" min="1" max="1440">
    </div>
  </div>
  <div style="margin-top:16px;">
    <button class="save-btn" id="saveBtn" onclick="saveSettings()">Save Settings</button>
    <span class="status-msg" id="statusMsg"></span>
  </div>
</div>

<div class="ts">Sessions: ${sessionStats.total} total, ${sessionStats.blocked} blocked | Generated ${new Date().toISOString().replace("T", " ").slice(0, 19)} UTC</div>

<script>
function saveSettings() {
  var btn = document.getElementById("saveBtn");
  var msg = document.getElementById("statusMsg");
  btn.disabled = true;
  msg.textContent = "Saving...";
  msg.className = "status-msg";

  var body = {};
  var keys = ["ip_rate_limit","session_creation_rate","session_request_cap","fingerprint_lifetime_cap","daily_api_cap","session_expiry_minutes"];
  for (var i = 0; i < keys.length; i++) {
    body[keys[i]] = parseInt(document.getElementById("s_" + keys[i]).value);
  }

  fetch("/admin/settings?key=${encodeURIComponent(req.query.key)}", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  }).then(function(r) { return r.json().then(function(d) { return { ok: r.ok, data: d }; }); })
    .then(function(res) {
      btn.disabled = false;
      if (res.ok) {
        msg.textContent = "Settings saved";
        msg.className = "status-msg ok";
      } else {
        msg.textContent = res.data.error || "Save failed";
        msg.className = "status-msg err";
      }
    })
    .catch(function() {
      btn.disabled = false;
      msg.textContent = "Network error";
      msg.className = "status-msg err";
    });
}
</script>
</body>
</html>`;

  res.send(html);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  const devices = [...faqCache.cache.keys()];
  console.log(`FAQ cache loaded: ${devices.length ? devices.join(", ") : "no devices"}`);
  faqCache.cleanOldSessions();
});
