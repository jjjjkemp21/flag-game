const jwt = require('jsonwebtoken');
const db = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-insecure-secret-change-me';

function signToken(user) {
    return jwt.sign({ uid: user.id }, JWT_SECRET, { expiresIn: '30d' });
}

function signResetToken(userId) {
    return jwt.sign({ uid: userId, kind: 'reset' }, JWT_SECRET, { expiresIn: '15m' });
}

function verifyResetToken(token) {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.kind !== 'reset') throw new Error('not a reset token');
    return payload.uid;
}

function requireAuth(req, res, next) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.uid);
        if (!user) return res.status(401).json({ error: 'User not found' });
        req.user = user;
        next();
    } catch (_) {
        return res.status(401).json({ error: 'Invalid token' });
    }
}

function requireAdmin(req, res, next) {
    if (!req.user || !req.user.is_admin) {
        return res.status(403).json({ error: 'Admin only' });
    }
    next();
}

module.exports = {
    JWT_SECRET,
    signToken,
    signResetToken,
    verifyResetToken,
    requireAuth,
    requireAdmin,
};
