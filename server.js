const express = require("express");
const path = require("path");
const FaqCache = require("./lib/faq-cache");

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

  if (isTextOnly && isFirstQuestion) {
    const match = faqCache.match(deviceId, lastMessage.content);
    if (match) {
      console.log(`FAQ cache HIT (score=${match.score.toFixed(3)}): "${lastMessage.content}"`);
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
        system: req.body.system,
        messages: req.body.messages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    // Save new Q&A to cache for future use
    if (isTextOnly && isFirstQuestion && data.content && data.content[0]) {
      try {
        faqCache.insert(deviceId, lastMessage.content, data.content[0].text, 1);
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  const devices = [...faqCache.cache.keys()];
  console.log(`FAQ cache loaded: ${devices.length ? devices.join(", ") : "no devices"}`);
});
