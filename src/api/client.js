// Thin fetch wrapper around the backend API. Same-origin '/api' in production;
// CRA's "proxy" field forwards it to the local server in development.
//
// On localhost, if the proxied backend is unreachable (e.g. you're hacking on
// the UI without running server/index.js), we transparently fall back to the
// in-browser dev mock in api/mock.js. This only activates on localhost — the
// deployed app on the Pi always talks to the real API.

import { mockRequest } from './mock';

const TOKEN_KEY = 'flagQuestToken';
const MOCK_FLAG_KEY = 'flagQuestDevMockActive';

const IS_LOCALHOST = typeof window !== 'undefined'
    && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

// Once the real backend has refused to answer, stick with the mock for the
// rest of the session — avoids paying the proxy timeout on every request.
let useMock = IS_LOCALHOST && (() => {
    try { return localStorage.getItem(MOCK_FLAG_KEY) === '1'; } catch (_) { return false; }
})();

function enableMock() {
    useMock = true;
    try { localStorage.setItem(MOCK_FLAG_KEY, '1'); } catch (_) { /* ignore */ }
    // eslint-disable-next-line no-console
    console.info('[api] Local backend unreachable — using dev mock. Call window.__resetDevMock() to wipe its state.');
}

// Treat 502/503/504 as "proxy can't reach upstream"; everything else (incl.
// 401/404 from the real server) is a normal application response.
function looksLikeBackendDown(status) {
    return status === 502 || status === 503 || status === 504;
}

export function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
}

async function realRequest(method, path, body) {
    const headers = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`/api${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    let data = null;
    const text = await res.text();
    if (text) {
        try {
            data = JSON.parse(text);
        } catch (_) {
            data = { error: text };
        }
    }

    if (!res.ok) {
        const err = new Error((data && data.error) || `Request failed (${res.status})`);
        err.status = res.status;
        err.data = data;
        throw err;
    }
    return data;
}

async function request(method, path, body) {
    if (useMock) return mockRequest(method, path, body);
    try {
        return await realRequest(method, path, body);
    } catch (err) {
        // fetch() throws TypeError when the network call itself fails (DNS,
        // refused, aborted). The CRA dev proxy returns 5xx when upstream is
        // dead. Either way, on localhost we flip to the mock and retry.
        const networkDown = err instanceof TypeError;
        const proxyDown = looksLikeBackendDown(err.status);
        if (IS_LOCALHOST && (networkDown || proxyDown)) {
            enableMock();
            return mockRequest(method, path, body);
        }
        throw err;
    }
}

export const api = {
    get: (path) => request('GET', path),
    post: (path, body) => request('POST', path, body ?? {}),
    put: (path, body) => request('PUT', path, body ?? {}),
    del: (path) => request('DELETE', path),
};
