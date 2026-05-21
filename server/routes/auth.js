const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('../db');
const {
    signToken,
    signResetToken,
    verifyResetToken,
    requireAuth,
} = require('../middleware');

const router = express.Router();

const RECOVERY_CODE_COUNT = 8;
const SALT_ROUNDS = 10;

function publicUser(u) {
    return { id: u.id, username: u.username, is_admin: !!u.is_admin, xp: u.xp };
}

function normalizeAnswer(a) {
    return String(a || '').trim().toLowerCase();
}

function generateRecoveryCode() {
    // e.g. "A1B2-C3D4" — unambiguous-ish uppercase + digits.
    const raw = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `${raw.slice(0, 4)}-${raw.slice(4, 8)}`;
}

function validUsername(name) {
    return typeof name === 'string' && /^[a-zA-Z0-9_]{3,20}$/.test(name);
}

router.post('/register', (req, res) => {
    const { username, password, securityQuestions } = req.body || {};

    if (!validUsername(username)) {
        return res.status(400).json({ error: 'Username must be 3-20 letters, numbers, or underscores.' });
    }
    if (typeof password !== 'string' || password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }
    if (!Array.isArray(securityQuestions) || securityQuestions.length < 1) {
        return res.status(400).json({ error: 'At least one security question is required.' });
    }
    for (const q of securityQuestions) {
        if (!q || !q.question || !normalizeAnswer(q.answer)) {
            return res.status(400).json({ error: 'Each security question needs a question and answer.' });
        }
    }

    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existing) {
        return res.status(409).json({ error: 'That username is taken.' });
    }

    const passwordHash = bcrypt.hashSync(password, SALT_ROUNDS);
    const isAdmin = process.env.ADMIN_USERNAME && username === process.env.ADMIN_USERNAME ? 1 : 0;

    const recoveryCodes = Array.from({ length: RECOVERY_CODE_COUNT }, generateRecoveryCode);

    const tx = db.transaction(() => {
        const info = db
            .prepare(
                `INSERT INTO users (username, password_hash, created_at, is_admin, xp, stats_json, bonus_scores_json)
                 VALUES (?, ?, ?, ?, 0, NULL, NULL)`
            )
            .run(username, passwordHash, Date.now(), isAdmin);
        const userId = info.lastInsertRowid;

        const insertQ = db.prepare(
            'INSERT INTO security_questions (user_id, question, answer_hash) VALUES (?, ?, ?)'
        );
        for (const q of securityQuestions) {
            insertQ.run(userId, String(q.question), bcrypt.hashSync(normalizeAnswer(q.answer), SALT_ROUNDS));
        }

        const insertCode = db.prepare(
            'INSERT INTO recovery_codes (user_id, code_hash) VALUES (?, ?)'
        );
        for (const code of recoveryCodes) {
            insertCode.run(userId, bcrypt.hashSync(code, SALT_ROUNDS));
        }

        return userId;
    });

    const userId = tx();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    const token = signToken(user);
    res.json({ token, user: publicUser(user), recoveryCodes });
});

router.post('/login', (req, res) => {
    const { username, password } = req.body || {};
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
        return res.status(401).json({ error: 'Incorrect username or password.' });
    }
    const token = signToken(user);
    res.json({ token, user: publicUser(user) });
});

// Step 1 of recovery: fetch the user's security questions (never the answers).
router.post('/forgot/lookup', (req, res) => {
    const { username } = req.body || {};
    const user = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (!user) return res.status(404).json({ error: 'No account with that username.' });
    const questions = db
        .prepare('SELECT id, question FROM security_questions WHERE user_id = ?')
        .all(user.id);
    res.json({ questions });
});

// Step 2: verify via security answers OR a recovery code -> short-lived reset token.
router.post('/forgot/verify', (req, res) => {
    const { username, answers, recoveryCode } = req.body || {};
    const user = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (!user) return res.status(404).json({ error: 'No account with that username.' });

    if (recoveryCode) {
        const codes = db
            .prepare('SELECT * FROM recovery_codes WHERE user_id = ? AND used_at IS NULL')
            .all(user.id);
        const match = codes.find((c) => bcrypt.compareSync(String(recoveryCode).trim().toUpperCase(), c.code_hash));
        if (!match) return res.status(401).json({ error: 'Invalid or already-used recovery code.' });
        db.prepare('UPDATE recovery_codes SET used_at = ? WHERE id = ?').run(Date.now(), match.id);
        return res.json({ resetToken: signResetToken(user.id) });
    }

    if (Array.isArray(answers)) {
        const stored = db
            .prepare('SELECT id, answer_hash FROM security_questions WHERE user_id = ?')
            .all(user.id);
        // answers: [{ id, answer }]
        const allCorrect =
            stored.length > 0 &&
            stored.every((q) => {
                const provided = answers.find((a) => a.id === q.id);
                return provided && bcrypt.compareSync(normalizeAnswer(provided.answer), q.answer_hash);
            });
        if (!allCorrect) return res.status(401).json({ error: 'One or more answers were incorrect.' });
        return res.json({ resetToken: signResetToken(user.id) });
    }

    res.status(400).json({ error: 'Provide security answers or a recovery code.' });
});

router.post('/reset', (req, res) => {
    const { resetToken, newPassword } = req.body || {};
    if (typeof newPassword !== 'string' || newPassword.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }
    let userId;
    try {
        userId = verifyResetToken(resetToken);
    } catch (_) {
        return res.status(401).json({ error: 'Reset link expired or invalid. Start over.' });
    }
    const hash = bcrypt.hashSync(newPassword, SALT_ROUNDS);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, userId);
    res.json({ ok: true });
});

router.get('/me', requireAuth, (req, res) => {
    res.json({ user: publicUser(req.user) });
});

module.exports = router;
