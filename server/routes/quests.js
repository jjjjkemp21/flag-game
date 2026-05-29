const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware');
const { rollDaily, rollWeekly, HWM_METRICS } = require('../questCatalog');

const router = express.Router();
router.use(requireAuth);

// Quests — three daily quests (rotate at UTC midnight) and two weekly quests
// (rotate on Monday UTC). Per-user state lives in quests_json:
//   { daily: { date, quests: [...] }, weekly: { weekStart, quests: [...] } }
// Each quest carries its own counter (`cur`) so client metric bumps are
// validated server-side against the goal.

function utcDateStr(ts = Date.now()) {
    const d = new Date(ts);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

// Most-recent Monday at UTC midnight (formatted YYYY-MM-DD). JS getUTCDay():
// Sun=0, Mon=1, ..., Sat=6. We back up to Monday so a week starts there.
function utcWeekStartStr(ts = Date.now()) {
    const d = new Date(ts);
    const dow = d.getUTCDay(); // 0..6
    const back = dow === 0 ? 6 : dow - 1;
    d.setUTCDate(d.getUTCDate() - back);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

function safeParse(s, fallback) {
    if (!s) return fallback;
    try { return JSON.parse(s); } catch (_) { return fallback; }
}

// Ensure daily and weekly slots are fresh — re-roll if their date markers are
// stale. Returns the resulting blob (and persists if it changed).
function ensureQuests(userId) {
    const row = db.prepare('SELECT quests_json FROM users WHERE id = ?').get(userId);
    const blob = safeParse(row && row.quests_json, null) || {};
    const today = utcDateStr();
    const weekStart = utcWeekStartStr();
    let changed = false;

    if (!blob.daily || blob.daily.date !== today) {
        blob.daily = { date: today, quests: rollDaily(userId, today) };
        changed = true;
    }
    if (!blob.weekly || blob.weekly.weekStart !== weekStart) {
        blob.weekly = { weekStart, quests: rollWeekly(userId, weekStart) };
        changed = true;
    }

    if (changed) {
        db.prepare('UPDATE users SET quests_json = ? WHERE id = ?').run(JSON.stringify(blob), userId);
    }
    return blob;
}

router.get('/', (req, res) => {
    const blob = ensureQuests(req.user.id);
    res.json(blob);
});

// Increment counters across all active quests matching the bumped metric.
// Body: { counters: { metric_name: delta, ... } }. Returns the updated blob.
router.post('/progress', (req, res) => {
    const counters = (req.body && req.body.counters) || {};
    const blob = ensureQuests(req.user.id);

    const apply = (track) => {
        for (const q of track.quests || []) {
            if (q.claimed) continue;
            const delta = Math.max(0, Math.round(Number(counters[q.metric]) || 0));
            if (delta <= 0) continue;
            // HWM metrics (streaks, end-of-run scores) take max() instead of
            // summing — the client reports the run's value, server keeps the
            // best one seen today.
            if (HWM_METRICS.has(q.metric)) {
                q.cur = Math.min(q.goal, Math.max(Number(q.cur) || 0, delta));
            } else {
                q.cur = Math.min(q.goal, (Number(q.cur) || 0) + delta);
            }
            if (q.cur >= q.goal) q.done = true;
        }
    };
    apply(blob.daily);
    apply(blob.weekly);

    db.prepare('UPDATE users SET quests_json = ? WHERE id = ?').run(JSON.stringify(blob), req.user.id);
    res.json(blob);
});

router.post('/claim', (req, res) => {
    const id = req.body && req.body.id;
    if (typeof id !== 'string' || !id) return res.status(400).json({ error: 'Quest id required.' });

    const blob = ensureQuests(req.user.id);
    const all = [...(blob.daily.quests || []), ...(blob.weekly.quests || [])];
    const quest = all.find((q) => q.id === id);
    if (!quest) return res.status(404).json({ error: 'No such quest.' });
    if (quest.claimed) return res.status(409).json({ error: 'Already claimed.' });
    if (!quest.done) return res.status(400).json({ error: 'Quest not complete yet.' });

    quest.claimed = true;
    const reward = Math.max(0, Math.round(Number(quest.bucks) || 0));
    const userRow = db.prepare('SELECT bucks FROM users WHERE id = ?').get(req.user.id);
    const newBucks = Math.max(0, Math.round(Number(userRow.bucks) || 0)) + reward;

    db.transaction(() => {
        db.prepare('UPDATE users SET bucks = ?, quests_json = ? WHERE id = ?')
            .run(newBucks, JSON.stringify(blob), req.user.id);
    })();

    res.json({ claimed: reward, bucks: newBucks, quest });
});

module.exports = router;
