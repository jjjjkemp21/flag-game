const fs = require('fs');
const path = require('path');

// Scheduled, hot SQLite backups.
//
// SQLite's online backup API (exposed by better-sqlite3 as `db.backup()`)
// copies a transactionally-consistent snapshot of the database WITHOUT blocking
// readers or writers — so there is no need to "pause" the app while a backup is
// taken. Players keep playing; the snapshot is still internally consistent. (A
// hard pause would only add downtime for no extra safety, so we deliberately
// don't do one.)
//
// Backups land in <data-dir>/backups, which sits in the persistent /data volume
// so they survive container redeploys. A daily prune clears out the previous
// day's snapshots while always keeping the most recent few — so the morning
// prune can never leave us with zero backups.

const INTERVAL_HOURS = Number(process.env.BACKUP_INTERVAL_HOURS) || 6; // 4x/day
const PRUNE_HOUR = Number.isFinite(Number(process.env.BACKUP_PRUNE_HOUR))
    ? Number(process.env.BACKUP_PRUNE_HOUR)
    : 5; // 05:00 server time — erase the previous day's backups
const KEEP_RECENT = Number(process.env.BACKUP_KEEP_RECENT) || 4; // never prune below this many
const KEEP_HOURS = Number(process.env.BACKUP_KEEP_HOURS) || 24;  // retain anything newer than this

const NAME_RE = /^flagquest-\d{8}-\d{6}\.db$/;

function pad(n) { return String(n).padStart(2, '0'); }
function stamp(d) {
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-`
        + `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

async function takeBackup(db, backupDir) {
    fs.mkdirSync(backupDir, { recursive: true });
    const dest = path.join(backupDir, `flagquest-${stamp(new Date())}.db`);
    await db.backup(dest);
    return dest;
}

// Delete backups older than KEEP_HOURS, but always keep the KEEP_RECENT newest.
function pruneBackups(backupDir) {
    let files;
    try { files = fs.readdirSync(backupDir); } catch (_) { return []; }
    const backups = files
        .filter((f) => NAME_RE.test(f))
        .map((f) => {
            const full = path.join(backupDir, f);
            return { full, mtime: fs.statSync(full).mtimeMs };
        })
        .sort((a, b) => b.mtime - a.mtime); // newest first
    const cutoff = Date.now() - KEEP_HOURS * 60 * 60 * 1000;
    const removed = [];
    backups.forEach((b, i) => {
        if (i < KEEP_RECENT) return;   // always keep the newest few
        if (b.mtime >= cutoff) return; // keep anything inside the retention window
        try { fs.unlinkSync(b.full); removed.push(b.full); } catch (_) { /* already gone */ }
    });
    return removed;
}

function scheduleBackups(db, dataDir) {
    const backupDir = path.join(dataDir, 'backups');
    const run = () => takeBackup(db, backupDir)
        // eslint-disable-next-line no-console
        .then((dest) => console.log(`[backup] wrote ${dest}`))
        // eslint-disable-next-line no-console
        .catch((e) => console.error('[backup] failed:', e && e.message));

    // Capture a snapshot shortly after boot so every deploy is backed up.
    setTimeout(run, 60 * 1000);
    setInterval(run, INTERVAL_HOURS * 60 * 60 * 1000);

    // Prune once per day around PRUNE_HOUR. Checked every 30 min; a guard key in
    // memory ensures it fires at most once per calendar day even across checks.
    let lastPruneDay = null;
    setInterval(() => {
        const now = new Date();
        const dayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
        if (now.getHours() === PRUNE_HOUR && lastPruneDay !== dayKey) {
            lastPruneDay = dayKey;
            const removed = pruneBackups(backupDir);
            // eslint-disable-next-line no-console
            if (removed.length) console.log(`[backup] pruned ${removed.length} old backup(s)`);
        }
    }, 30 * 60 * 1000);
}

module.exports = { scheduleBackups, takeBackup, pruneBackups };
