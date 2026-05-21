const path = require('path');
const express = require('express');
const rateLimit = require('express-rate-limit');

const app = express();
app.set('trust proxy', 1); // behind the reverse proxy
app.use(express.json({ limit: '1mb' }));

// Rate-limit auth endpoints to blunt brute force.
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
});

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api', require('./routes/social'));

// Serve the built React app and fall back to index.html for SPA routes.
const buildDir = path.join(__dirname, '..', 'build');
app.use(express.static(buildDir));
app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'Not found' });
    }
    res.sendFile(path.join(buildDir, 'index.html'));
});

const PORT = process.env.PORT || 80;
app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Flag Quest server listening on :${PORT}`);
});
