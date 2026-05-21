import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, setToken, getToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [status, setStatus] = useState('loading'); // 'loading' | 'authed' | 'guest'

    const refresh = useCallback(async () => {
        if (!getToken()) {
            setUser(null);
            setStatus('guest');
            return null;
        }
        try {
            const { user: u } = await api.get('/auth/me');
            setUser(u);
            setStatus('authed');
            return u;
        } catch (_) {
            setToken(null);
            setUser(null);
            setStatus('guest');
            return null;
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const login = useCallback(async (username, password) => {
        const { token, user: u } = await api.post('/auth/login', { username, password });
        setToken(token);
        setUser(u);
        setStatus('authed');
        return u;
    }, []);

    const register = useCallback(async (payload) => {
        const { token, user: u, recoveryCodes } = await api.post('/auth/register', payload);
        setToken(token);
        setUser(u);
        setStatus('authed');
        return { user: u, recoveryCodes };
    }, []);

    const logout = useCallback(() => {
        setToken(null);
        setUser(null);
        setStatus('guest');
    }, []);

    // Let other parts of the app update the cached user (e.g. xp after a sync).
    const patchUser = useCallback((patch) => {
        setUser((prev) => (prev ? { ...prev, ...patch } : prev));
    }, []);

    const value = { user, status, isAuthed: status === 'authed', refresh, login, register, logout, patchUser };
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
