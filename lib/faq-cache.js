const Database = require("better-sqlite3");
const { normalize } = require("./normalize");

class FaqCache {
  constructor(dbPath) {
    this.db = new Database(dbPath);
    this.db.pragma("journal_mode = WAL");
    this.threshold = parseFloat(process.env.FAQ_SIMILARITY_THRESHOLD) || 0.45;
    this.cache = new Map();
    this._initSchema();
    this._loadCache();
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
    `);
  }

  _loadCache() {
    const rows = this.db.prepare("SELECT id, device_id, question_norm, answer FROM faq").all();
    this.cache.clear();
    for (const row of rows) {
      if (!this.cache.has(row.device_id)) {
        this.cache.set(row.device_id, []);
      }
      this.cache.get(row.device_id).push({
        id: row.id,
        question_norm: row.question_norm,
        answer: row.answer,
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
      return { answer: bestEntry.answer, score: bestScore, faqId: bestEntry.id };
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
