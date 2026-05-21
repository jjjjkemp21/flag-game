// Publish an announcement directly into the database. Intended to be run on the
// trusted host (e.g. from deploy.sh via `docker exec`), so it needs no auth.
//
// Usage: node announce.js "<title>" "<body>" [commitSha]
// If commitSha is given and an announcement already exists for it, this is a no-op
// (so re-running a deploy won't post duplicates).

const db = require('./db');

const [, , title, body, commitSha] = process.argv;

if (!title || !body) {
    console.error('announce.js: usage: node announce.js "<title>" "<body>" [commitSha]');
    process.exit(1);
}

if (commitSha) {
    const existing = db.prepare('SELECT id FROM announcements WHERE commit_sha = ?').get(commitSha);
    if (existing) {
        console.log(`announce.js: announcement for ${commitSha} already exists (#${existing.id}); skipping.`);
        process.exit(0);
    }
}

const info = db
    .prepare('INSERT INTO announcements (title, body, created_at, created_by, commit_sha) VALUES (?, ?, ?, NULL, ?)')
    .run(title, body, Date.now(), commitSha || null);

console.log(`announce.js: published announcement #${info.lastInsertRowid}: ${title}`);
