// Dump every feedback row to stdout as Markdown so the dev can pipe it into
// FEEDBACK.md at the repo root and commit it (the Pi can't push to git on its
// own). Intended to be run on the trusted host, e.g.:
//
//   docker exec <flag-game-container> node server/feedback-dump.js > FEEDBACK.md
//
// or, for a quick peek:
//
//   docker exec <flag-game-container> node server/feedback-dump.js
//
// No auth — runs inside the container.

const db = require('./db');

function fmt(ms) {
    try {
        return new Date(ms).toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
    } catch (_) {
        return String(ms);
    }
}

const rows = db
    .prepare('SELECT id, user_id, username, category, body, created_at, resolved_at FROM feedback ORDER BY id DESC')
    .all();

const out = [];
out.push('# Player feedback');
out.push('');
out.push(`Generated ${fmt(Date.now())} — ${rows.length} entr${rows.length === 1 ? 'y' : 'ies'}.`);
out.push('');

if (rows.length === 0) {
    out.push('_No feedback submitted yet._');
} else {
    for (const r of rows) {
        const status = r.resolved_at ? ` · resolved ${fmt(r.resolved_at)}` : '';
        out.push(`## #${r.id} · ${r.category} · @${r.username}`);
        out.push('');
        out.push(`_${fmt(r.created_at)}${status}_`);
        out.push('');
        out.push(r.body);
        out.push('');
    }
}

process.stdout.write(out.join('\n') + '\n');
