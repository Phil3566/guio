const Database = require("better-sqlite3");
const { normalize } = require("./normalize");

class FaqCache {
  constructor(dbPath) {
    this.db = new Database(dbPath);
    this.db.pragma("journal_mode = WAL");
    this.threshold = parseFloat(process.env.FAQ_SIMILARITY_THRESHOLD) || 0.45;
    this.cache = new Map();
    this.resourceCache = new Map();
    this._initSchema();
    this._seedFAQs();
    this._seedResources();
    this._loadCache();
    this._loadResources();
  }

  _initSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS faq (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id     TEXT    NOT NULL,
        question      TEXT    NOT NULL,
        question_norm TEXT    NOT NULL,
        answer        TEXT    NOT NULL,
        is_generated  INTEGER NOT NULL DEFAULT 0,
        created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
        hit_count     INTEGER NOT NULL DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS idx_faq_device ON faq(device_id);
      CREATE TABLE IF NOT EXISTS daily_stats (
        date       TEXT NOT NULL,
        device_id  TEXT NOT NULL,
        cache_hits INTEGER NOT NULL DEFAULT 0,
        api_calls  INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (date, device_id)
      );
      CREATE TABLE IF NOT EXISTS request_log (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id  TEXT NOT NULL,
        question   TEXT NOT NULL,
        source     TEXT NOT NULL,
        off_topic  INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS sessions (
        token       TEXT    PRIMARY KEY,
        fingerprint TEXT    NOT NULL,
        ip          TEXT,
        created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
        request_count INTEGER NOT NULL DEFAULT 0,
        blocked     INTEGER NOT NULL DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS idx_sessions_fingerprint ON sessions(fingerprint);
      CREATE TABLE IF NOT EXISTS settings (
        key   TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS resources (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id     TEXT    NOT NULL,
        topic         TEXT    NOT NULL,
        category      TEXT    NOT NULL,
        title         TEXT    NOT NULL,
        url           TEXT    NOT NULL,
        display_order INTEGER NOT NULL DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS idx_resources_device_topic ON resources(device_id, topic);
    `);
    // Migration: add topic column to faq table (SQLite has no IF NOT EXISTS for ALTER)
    try {
      this.db.exec("ALTER TABLE faq ADD COLUMN topic TEXT DEFAULT NULL");
    } catch (e) { /* column already exists */ }
  }

  _seedFAQs() {
    const seeds = [
      {
        device: "pastigio-frameo-frame",
        topic: "sd_card",
        question: "I inserted an SD card but the frame doesn't recognize it. What's wrong?",
        answer: "The frame only supports SD cards that are **FAT32 format, 32GB or smaller**.\n\n1. Check the card size — if it's 64GB or larger, it won't work. Use a 32GB or smaller card.\n2. If your card is 32GB or smaller but still not recognized, it may be formatted as exFAT instead of FAT32. A family member can reformat it on a computer (search \"format SD card FAT32\").\n3. Make sure the card is fully inserted into the slot on the back of the frame.\n4. Try a different SD card if you have one.\n\n[TECHNICAL]SD cards 32GB and under are typically sold as FAT32. Cards 64GB+ use exFAT by default, which this frame's hardware does not support. Windows can format cards up to 32GB as FAT32 natively. For larger cards, third-party tools like guiformat can force FAT32, but the frame may still reject cards over 32GB due to hardware limitations.[/TECHNICAL]"
      },
      {
        device: "pastigio-frameo-frame",
        topic: "wifi_connect",
        question: "My picture frame won't connect to WiFi. What do I do?",
        answer: "This is the most common issue and usually fixable.\n\n1. **Check the signal type:** Your frame only works with **2.4GHz WiFi**. When you see the list of WiFi networks on the frame, if your WiFi name appears twice, tap the one **without** \"5G\" at the end. If you only see one WiFi name, your router may be combining both signals — you or someone familiar with routers can log into the router and create a separate 2.4GHz network (see the support videos or articles shown below).\n2. **Double-check the password:** Tap the **eye icon** next to the password field on the frame to see what you're typing. Passwords are case-sensitive — watch for capital letters and spaces.\n3. **Restart both devices:** Unplug your frame for a minute, then plug it back in. For your router, unplug it for 30 seconds, then plug it back in and wait 2 minutes for it to fully restart.\n4. **Move the frame closer to the router** during setup — a weak signal can cause the connection to fail. You can move it to its permanent spot after it connects.\n5. **Check for updates:** Tap the screen → Settings → About → Check for updates. Newer software can fix WiFi problems.\n\nIf your WiFi name doesn't appear in the list at all, your network may be hidden or using a security type the frame doesn't support — see Technical details below.\n\n[TECHNICAL]**Supported:** 2.4GHz 802.11 b/g/n only. WPA2-PSK (AES) or WPA/WPA2 mixed mode. Channels 1–11.\n\n**Not supported:** 5GHz networks, WPA3-only encryption, hidden SSIDs (the frame cannot connect to networks with hidden names), channels 12–14.\n\n**Band steering / mesh networks:** If your router uses a single SSID for both 2.4GHz and 5GHz (band steering, Smart Connect, or SON), the frame may fail to connect or drop connection. Create a dedicated 2.4GHz SSID with a different name. For mesh networks (Eero, Google Wifi, etc.), disable band steering in the mesh app settings.\n\n**Router settings to check:** Channel width should be 20MHz (not 40MHz). Disable client/AP isolation (blocks device communication). Disable MAC filtering or add the frame's MAC address. Use DHCP (not static IP) on the frame.\n\n**Diagnostic test:** If nothing works, try connecting the frame to a phone hotspot (Settings → Hotspot on your phone, set to 2.4GHz). If the frame connects to the hotspot but not your router, the issue is a router setting — not the frame.[/TECHNICAL]"
      },
    ];

    const insert = this.db.prepare(
      "INSERT INTO faq (device_id, question, question_norm, answer, is_generated, topic) VALUES (?, ?, ?, ?, 0, ?)"
    );
    const update = this.db.prepare(
      "UPDATE faq SET answer = ?, is_generated = 0 WHERE device_id = ? AND question_norm = ?"
    );
    const setTopic = this.db.prepare(
      "UPDATE faq SET topic = ? WHERE device_id = ? AND question_norm = ?"
    );
    for (const s of seeds) {
      const norm = normalize(s.question);
      const exists = this.db.prepare(
        "SELECT id, is_generated FROM faq WHERE device_id = ? AND question_norm = ?"
      ).get(s.device, norm);
      if (!exists) {
        insert.run(s.device, s.question, norm, s.answer, s.topic || null);
      } else if (exists.is_generated === 1) {
        update.run(s.answer, s.device, norm);
      }
      // Always update topic on seed rows
      if (s.topic) {
        setTopic.run(s.topic, s.device, norm);
      }
    }
  }

  _seedResources() {
    const seeds = [
      // === wifi_connect: Videos ===
      { device: "pastigio-frameo-frame", topic: "wifi_connect", category: "video",
        title: "How To Fix Frameo Digital Frame Not Connecting To WiFi",
        url: "https://www.youtube.com/watch?v=b0i_m5Nq7sM", order: 1 },
      { device: "pastigio-frameo-frame", topic: "wifi_connect", category: "video",
        title: "How To Separate 2.4GHz and 5GHz On WiFi",
        url: "https://www.youtube.com/watch?v=JONmJhS_rIk", order: 2 },
      { device: "pastigio-frameo-frame", topic: "wifi_connect", category: "video",
        title: "Smart Home Device Won't CONNECT To WiFi",
        url: "https://www.youtube.com/watch?v=G3LHOb6ThPI", order: 3 },
      { device: "pastigio-frameo-frame", topic: "wifi_connect", category: "search_youtube",
        title: "Find more videos on YouTube",
        url: "https://www.youtube.com/results?search_query=frameo+wifi+setup+2.4GHz", order: 99 },
      // === wifi_connect: Articles ===
      { device: "pastigio-frameo-frame", topic: "wifi_connect", category: "article",
        title: "Why Your Router Has Two WiFi Channels (Gizmodo)",
        url: "https://gizmodo.com/why-your-router-has-two-wifi-channels-and-how-they-work-1828650288", order: 1 },
      { device: "pastigio-frameo-frame", topic: "wifi_connect", category: "article",
        title: "How to Connect to 5GHz WiFi (letsbemates)",
        url: "https://www.letsbemates.com.au/mate/connect-5ghz-wifi/", order: 2 },
      { device: "pastigio-frameo-frame", topic: "wifi_connect", category: "search_google",
        title: "Find more articles on Google",
        url: "https://www.google.com/search?q=digital+picture+frame+won%27t+connect+to+wifi+2.4GHz", order: 99 },
      // === wifi_connect: Official Support ===
      { device: "pastigio-frameo-frame", topic: "wifi_connect", category: "support",
        title: "WiFi Requirements",
        url: "https://support.frameo.com/hc/en-us/articles/360020756500--Wi-Fi-Requirements", order: 1 },
      { device: "pastigio-frameo-frame", topic: "wifi_connect", category: "support",
        title: "WiFi and Connection Problems",
        url: "https://support.frameo.com/hc/en-us/articles/10140527026834--WiFi-and-Connection-Problems", order: 2 },
      { device: "pastigio-frameo-frame", topic: "wifi_connect", category: "support",
        title: "Frame Can't Find My Wi-Fi",
        url: "https://support.frameo.com/hc/en-us/articles/24804330613266--Frame-Can-t-Find-My-Wi-Fi", order: 3 },
    ];

    const check = this.db.prepare(
      "SELECT id FROM resources WHERE device_id = ? AND topic = ? AND url = ?"
    );
    const insert = this.db.prepare(
      "INSERT INTO resources (device_id, topic, category, title, url, display_order) VALUES (?, ?, ?, ?, ?, ?)"
    );
    for (const s of seeds) {
      if (!check.get(s.device, s.topic, s.url)) {
        insert.run(s.device, s.topic, s.category, s.title, s.url, s.order);
      }
    }
  }

  _loadResources() {
    const rows = this.db.prepare(
      "SELECT device_id, topic, category, title, url FROM resources ORDER BY display_order"
    ).all();
    this.resourceCache.clear();
    for (const row of rows) {
      const key = `${row.device_id}::${row.topic}`;
      if (!this.resourceCache.has(key)) {
        this.resourceCache.set(key, []);
      }
      this.resourceCache.get(key).push({
        category: row.category,
        title: row.title,
        url: row.url,
      });
    }
  }

  getResources(deviceId, topic) {
    if (!topic) return null;
    const key = `${deviceId}::${topic}`;
    const resources = this.resourceCache.get(key);
    if (!resources || resources.length === 0) return null;
    const grouped = {};
    for (const r of resources) {
      if (!grouped[r.category]) grouped[r.category] = [];
      grouped[r.category].push({ title: r.title, url: r.url });
    }
    return grouped;
  }

  _loadCache() {
    const rows = this.db.prepare("SELECT id, device_id, question_norm, answer, topic FROM faq").all();
    this.cache.clear();
    for (const row of rows) {
      if (!this.cache.has(row.device_id)) {
        this.cache.set(row.device_id, []);
      }
      this.cache.get(row.device_id).push({
        id: row.id,
        question_norm: row.question_norm,
        answer: row.answer,
        topic: row.topic || null,
      });
    }
  }

  match(deviceId, userQuestion) {
    const norm = normalize(userQuestion);
    const entries = this.cache.get(deviceId);
    if (!entries || entries.length === 0) return null;

    let bestScore = 0;
    let bestEntry = null;

    for (const entry of entries) {
      const score = this._similarity(norm, entry.question_norm);
      if (score > bestScore) {
        bestScore = score;
        bestEntry = entry;
      }
    }

    if (bestScore >= this.threshold && bestEntry) {
      this.db.prepare("UPDATE faq SET hit_count = hit_count + 1 WHERE id = ?").run(bestEntry.id);
      return { answer: bestEntry.answer, score: bestScore, faqId: bestEntry.id, topic: bestEntry.topic };
    }

    return null;
  }

  insert(deviceId, question, answer, isGenerated = 1) {
    const norm = normalize(question);
    const existing = this.match(deviceId, question);
    if (existing && existing.score > 0.85) return;

    this.db.prepare(
      "INSERT INTO faq (device_id, question, question_norm, answer, is_generated) VALUES (?, ?, ?, ?, ?)"
    ).run(deviceId, question, norm, answer, isGenerated);
    this._loadCache();
  }

  _today() {
    return new Date().toISOString().slice(0, 10);
  }

  getTodayApiCalls() {
    const row = this.db.prepare(
      "SELECT COALESCE(SUM(api_calls), 0) as total FROM daily_stats WHERE date = ?"
    ).get(this._today());
    return row.total;
  }

  recordHit(deviceId) {
    this.db.prepare(`
      INSERT INTO daily_stats (date, device_id, cache_hits, api_calls)
      VALUES (?, ?, 1, 0)
      ON CONFLICT(date, device_id) DO UPDATE SET cache_hits = cache_hits + 1
    `).run(this._today(), deviceId);
  }

  recordMiss(deviceId) {
    this.db.prepare(`
      INSERT INTO daily_stats (date, device_id, cache_hits, api_calls)
      VALUES (?, ?, 0, 1)
      ON CONFLICT(date, device_id) DO UPDATE SET api_calls = api_calls + 1
    `).run(this._today(), deviceId);
  }

  logRequest(deviceId, question, source, offTopic = 0) {
    this.db.prepare(`
      INSERT INTO request_log (device_id, question, source, off_topic)
      VALUES (?, ?, ?, ?)
    `).run(deviceId, question, source, offTopic ? 1 : 0);
  }

  getRecentRequests(limit = 50, deviceId = null) {
    if (deviceId) {
      return this.db.prepare(`
        SELECT device_id, question, source, off_topic, created_at
        FROM request_log WHERE device_id = ?
        ORDER BY created_at DESC LIMIT ?
      `).all(deviceId, limit);
    }
    return this.db.prepare(`
      SELECT device_id, question, source, off_topic, created_at
      FROM request_log
      ORDER BY created_at DESC LIMIT ?
    `).all(limit);
  }

  // --- Resource management ---

  getAllResources() {
    return this.db.prepare(
      "SELECT id, device_id, topic, category, title, url, display_order FROM resources ORDER BY topic, display_order"
    ).all();
  }

  addResource(deviceId, topic, category, title, url, displayOrder) {
    this.db.prepare(
      "INSERT INTO resources (device_id, topic, category, title, url, display_order) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(deviceId, topic, category, title, url, displayOrder);
    this._loadResources();
  }

  deleteResource(id) {
    this.db.prepare("DELETE FROM resources WHERE id = ?").run(id);
    this._loadResources();
  }

  // --- Settings management ---

  getSetting(key, defaultValue) {
    const row = this.db.prepare("SELECT value FROM settings WHERE key = ?").get(key);
    return row ? row.value : String(defaultValue);
  }

  setSetting(key, value) {
    this.db.prepare(
      "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?"
    ).run(key, String(value), String(value));
  }

  getAllSettings() {
    const rows = this.db.prepare("SELECT key, value FROM settings").all();
    const obj = {};
    for (const row of rows) obj[row.key] = row.value;
    return obj;
  }

  // --- Session management ---

  createSession(token, fingerprint, ip) {
    this.db.prepare(
      "INSERT INTO sessions (token, fingerprint, ip) VALUES (?, ?, ?)"
    ).run(token, fingerprint, ip);
  }

  getSession(token) {
    return this.db.prepare("SELECT * FROM sessions WHERE token = ?").get(token);
  }

  checkLimits(token, fingerprint) {
    const session = this.db.prepare("SELECT * FROM sessions WHERE token = ?").get(token);
    if (!session) return { allowed: false, reason: "invalid_session" };
    if (session.blocked) return { allowed: false, reason: "blocked" };

    const sessionCap = parseInt(this.getSetting("session_request_cap", 50));
    if (session.request_count >= sessionCap) return { allowed: false, reason: "session_limit" };

    // Fingerprint limit across all sessions from this device
    const fpCap = parseInt(this.getSetting("fingerprint_lifetime_cap", 200));
    const fpTotal = this.db.prepare(
      "SELECT COALESCE(SUM(request_count), 0) as total FROM sessions WHERE fingerprint = ?"
    ).get(fingerprint).total;
    if (fpTotal >= fpCap) return { allowed: false, reason: "fingerprint_limit" };

    return { allowed: true };
  }

  incrementSession(token) {
    this.db.prepare(
      "UPDATE sessions SET request_count = request_count + 1 WHERE token = ?"
    ).run(token);
  }

  cleanOldSessions() {
    this.db.prepare("DELETE FROM sessions WHERE created_at < datetime('now', '-30 days')").run();
  }

  getSessionStats() {
    const active = this.db.prepare(
      "SELECT COUNT(*) as count FROM sessions WHERE created_at >= datetime('now', '-24 hours')"
    ).get().count;
    const total = this.db.prepare("SELECT COUNT(*) as count FROM sessions").get().count;
    const blocked = this.db.prepare("SELECT COUNT(*) as count FROM sessions WHERE blocked = 1").get().count;
    const topFingerprints = this.db.prepare(`
      SELECT fingerprint, SUM(request_count) as total_requests, COUNT(*) as session_count
      FROM sessions GROUP BY fingerprint ORDER BY total_requests DESC LIMIT 10
    `).all();
    return { active, total, blocked, topFingerprints };
  }

  getStats(deviceId = null) {
    const dFilter = deviceId ? " WHERE device_id = ?" : "";
    const dArgs = deviceId ? [deviceId] : [];
    const dsFilter = deviceId ? " WHERE device_id = ?" : "";
    const dsDateFilter = deviceId ? " WHERE date >= date('now', '-30 days') AND device_id = ?" : " WHERE date >= date('now', '-30 days')";

    const devices = this.db.prepare(`
      SELECT device_id,
             COUNT(*) as total_entries,
             SUM(CASE WHEN is_generated = 0 THEN 1 ELSE 0 END) as seeded,
             SUM(CASE WHEN is_generated = 1 THEN 1 ELSE 0 END) as generated,
             SUM(hit_count) as total_hits
      FROM faq${dFilter} GROUP BY device_id
    `).all(...dArgs);

    const topQuestions = this.db.prepare(`
      SELECT device_id, question, hit_count
      FROM faq WHERE hit_count > 0${deviceId ? " AND device_id = ?" : ""}
      ORDER BY hit_count DESC LIMIT 15
    `).all(...dArgs);

    const newQuestions = this.db.prepare(`
      SELECT device_id, question, answer, created_at, hit_count
      FROM faq WHERE is_generated = 1${deviceId ? " AND device_id = ?" : ""}
      ORDER BY created_at DESC LIMIT 25
    `).all(...dArgs);

    const zeroHits = this.db.prepare(`
      SELECT device_id, question
      FROM faq WHERE hit_count = 0 AND is_generated = 0${deviceId ? " AND device_id = ?" : ""}
      ORDER BY device_id, question
    `).all(...dArgs);

    const dailyTotals = this.db.prepare(`
      SELECT date,
             SUM(cache_hits) as cache_hits,
             SUM(api_calls) as api_calls
      FROM daily_stats${dsDateFilter}
      GROUP BY date ORDER BY date DESC
    `).all(...dArgs);

    const allTimeStats = this.db.prepare(`
      SELECT COALESCE(SUM(cache_hits), 0) as total_cache_hits,
             COALESCE(SUM(api_calls), 0) as total_api_calls
      FROM daily_stats${dsFilter}
    `).all(...dArgs);

    return { devices, topQuestions, newQuestions, zeroHits, dailyTotals, allTimeStats: allTimeStats[0] || { total_cache_hits: 0, total_api_calls: 0 } };
  }

  _stopWords = new Set([
    "how", "do", "i", "the", "a", "an", "is", "it", "my", "can", "to",
    "what", "does", "in", "on", "of", "for", "this", "that", "should",
    "whats", "where", "when", "why", "will", "be", "me", "you", "your",
    "are", "its", "im", "was", "has", "have", "had", "not", "dont",
    "up", "or", "and", "with", "at", "from", "but", "just", "about",
    "get", "so", "if", "no", "yes", "very", "much", "many", "some",
  ]);

  _trigrams(str) {
    const padded = `  ${str} `;
    const set = new Set();
    for (let i = 0; i <= padded.length - 3; i++) {
      set.add(padded.substring(i, i + 3));
    }
    return set;
  }

  _stem(word) {
    if (word.length <= 3) return word;
    return word
      .replace(/ing$/, "")
      .replace(/tion$/, "")
      .replace(/ed$/, "")
      .replace(/ly$/, "")
      .replace(/ness$/, "")
      .replace(/s$/, "");
  }

  _keywords(str) {
    return new Set(
      str.split(" ")
        .filter(w => w.length > 1 && !this._stopWords.has(w))
        .map(w => this._stem(w))
    );
  }

  _similarity(a, b) {
    // Trigram Jaccard similarity
    const triA = this._trigrams(a);
    const triB = this._trigrams(b);
    let triIntersection = 0;
    for (const t of triA) {
      if (triB.has(t)) triIntersection++;
    }
    const triUnion = triA.size + triB.size - triIntersection;
    const triScore = triUnion === 0 ? 0 : triIntersection / triUnion;

    // Keyword overlap (words minus stop words)
    const kwA = this._keywords(a);
    const kwB = this._keywords(b);
    if (kwA.size === 0 || kwB.size === 0) return triScore;
    let kwIntersection = 0;
    for (const w of kwA) {
      if (kwB.has(w)) kwIntersection++;
    }
    const kwUnion = kwA.size + kwB.size - kwIntersection;
    const kwScore = kwUnion === 0 ? 0 : kwIntersection / kwUnion;

    // Return the higher of the two scores
    return Math.max(triScore, kwScore);
  }
}

module.exports = FaqCache;
