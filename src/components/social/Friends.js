import React, { useEffect, useState, useCallback, useRef } from 'react';
import Icon from '../common/Icon';
import { Button, Pill, Modal } from '../ui/index';
import { useToast } from '../ui/Toast';
import { useAuth } from '../../auth/AuthProvider';
import { api } from '../../api/client';
import { fetchFriendsPresence } from '../../lib/presence';

const MODE_LABELS = {
    'multiple-choice':    'Multiple Choice',
    'free-response':      'Free Response',
    'flash':              'Flash',
    'reverse-mc':         'Reverse MC',
    'globe':              'Globe',
    'pixelated-quiz':     'Pixelated',
    'frenzy-quiz':        'Frenzy',
    'longest-route-quiz': 'Longest Route',
    'language-quiz':      'Language',
    'multiplayer':        'Multiplayer',
};

const PRESENCE_REFRESH_MS = 5000;

function Friends({ setView, setSpectateTarget }) {
    const { isAuthed } = useAuth();
    const toast = useToast();
    const [data, setData] = useState({ friends: [], incoming: [], outgoing: [] });
    const [presence, setPresence] = useState({});
    const [loading, setLoading] = useState(false);
    const [addName, setAddName] = useState('');
    const [busy, setBusy] = useState(false);
    const presenceTimerRef = useRef(null);

    const load = useCallback(async () => {
        if (!isAuthed) return;
        setLoading(true);
        try {
            setData(await api.get('/friends'));
        } catch (err) {
            toast.danger(err.message || 'Could not load friends.');
        } finally {
            setLoading(false);
        }
    }, [isAuthed, toast]);

    useEffect(() => { load(); }, [load]);

    // Friend presence — fetched once on mount, then polled every 5s while the
    // screen is open so the Eye icon lights up shortly after a friend starts
    // playing. No active fetch when logged out.
    useEffect(() => {
        if (!isAuthed) return undefined;
        let cancelled = false;
        const refresh = async () => {
            const res = await fetchFriendsPresence();
            if (!cancelled) setPresence(res.presence || {});
            if (!cancelled) presenceTimerRef.current = setTimeout(refresh, PRESENCE_REFRESH_MS);
        };
        refresh();
        return () => {
            cancelled = true;
            if (presenceTimerRef.current) clearTimeout(presenceTimerRef.current);
        };
    }, [isAuthed]);

    const watch = (friendId) => {
        if (typeof setSpectateTarget === 'function') setSpectateTarget(friendId);
        setView('spectator');
    };

    const sendRequest = async (e) => {
        e.preventDefault();
        if (!addName.trim()) return;
        setBusy(true);
        try {
            const res = await api.post('/friends/request', { username: addName.trim() });
            toast.success(res.status === 'accepted' ? 'Friend added!' : 'Request sent!');
            setAddName('');
            load();
        } catch (err) {
            toast.danger(err.message || 'Could not send request.');
        } finally {
            setBusy(false);
        }
    };

    const respond = async (requestId, accept) => {
        try {
            await api.post('/friends/respond', { requestId, accept });
            toast.success(accept ? 'Friend added!' : 'Request declined.');
            load();
        } catch (err) {
            toast.danger(err.message || 'Action failed.');
        }
    };

    // Removal is destructive (also severs DMs) and the button is small/adjacent
    // to Spectate, so confirm before deleting — mirrors the Settings reset flow.
    const [pendingRemove, setPendingRemove] = useState(null);
    const remove = async (userId) => {
        try {
            await api.del(`/friends/${userId}`);
            toast.success('Friend removed.');
            load();
        } catch (err) {
            toast.danger(err.message || 'Could not remove friend.');
        }
    };

    if (!isAuthed) {
        return (
            <div className="quiz-box friends-box">
                <div className="quiz-topbar">
                    <button className="back-button" onClick={() => setView('menu')} aria-label="Back">
                        <Icon name="arrow_back" /> Back
                    </button>
                </div>
                <div className="signin-prompt">
                    <Icon name="group" size="xl" />
                    <h2>Friends</h2>
                    <p>Log in to add friends and compare your progress.</p>
                    <Button variant="primary" icon="login" onClick={() => setView('login')}>Log in or sign up</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="quiz-box friends-box">
            <div className="quiz-topbar">
                <button className="back-button" onClick={() => setView('menu')} aria-label="Back">
                    <Icon name="arrow_back" /> Back
                </button>
            </div>
            <h2 className="text-center">Friends</h2>

            <form className="friend-add" onSubmit={sendRequest}>
                <input
                    className="auth-field__input"
                    placeholder="Add a friend by username"
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                />
                <Button type="submit" variant="primary" icon="person_add" disabled={busy}>Add</Button>
            </form>

            {loading && <p className="text-center">Loading…</p>}

            {data.incoming.length > 0 && (
                <section className="friend-section">
                    <h3 className="stats-subtitle">Requests</h3>
                    {data.incoming.map((r) => (
                        <div key={r.requestId} className="friend-row">
                            <span className="friend-name">{r.username}</span>
                            <span className="friend-actions">
                                <Button size="sm" variant="success" icon="check" onClick={() => respond(r.requestId, true)}>Accept</Button>
                                <Button size="sm" variant="ghost" icon="close" onClick={() => respond(r.requestId, false)}>Decline</Button>
                            </span>
                        </div>
                    ))}
                </section>
            )}

            <section className="friend-section">
                <h3 className="stats-subtitle">Your friends</h3>
                {data.friends.length === 0 && <p className="auth-hint">No friends yet — add someone above.</p>}
                {data.friends.map((f) => {
                    const p = presence[f.id];
                    const playing = !!(p && p.mode);
                    return (
                        <div key={f.id} className={`friend-row ${playing ? 'friend-row--playing' : ''}`}>
                            <span className="friend-name">
                                {f.username}
                                {playing && (
                                    <span className="friend-presence-tag">
                                        <Icon name="circle" /> Playing {MODE_LABELS[p.mode] || p.mode}
                                    </span>
                                )}
                            </span>
                            <Pill tone="primary">{f.xp} XP</Pill>
                            <span className="friend-mastered">{f.masteredCount} mastered</span>
                            {playing && (
                                <button
                                    className="icon-button friend-watch-btn"
                                    aria-label={`Spectate ${f.username}`}
                                    title={`Spectate ${f.username}`}
                                    onClick={() => watch(f.id)}
                                >
                                    <Icon name="visibility" />
                                </button>
                            )}
                            <button className="icon-button" aria-label={`Remove ${f.username}`} onClick={() => setPendingRemove(f)}>
                                <Icon name="person_remove" />
                            </button>
                        </div>
                    );
                })}
            </section>

            {data.outgoing.length > 0 && (
                <section className="friend-section">
                    <h3 className="stats-subtitle">Pending</h3>
                    {data.outgoing.map((r) => (
                        <div key={r.requestId} className="friend-row">
                            <span className="friend-name">{r.username}</span>
                            <Pill tone="info">Requested</Pill>
                        </div>
                    ))}
                </section>
            )}

            <Modal
                open={!!pendingRemove}
                onClose={() => setPendingRemove(null)}
                title="Remove friend?"
            >
                <p>
                    Remove <strong>{pendingRemove?.username}</strong> from your friends?
                    You'll also lose the ability to message or spectate each other.
                </p>
                <div className="account-menu">
                    <Button variant="danger" fullWidth icon="person_remove"
                        onClick={() => { const id = pendingRemove.id; setPendingRemove(null); remove(id); }}>
                        Remove
                    </Button>
                    <Button variant="secondary" fullWidth onClick={() => setPendingRemove(null)}>
                        Cancel
                    </Button>
                </div>
            </Modal>
        </div>
    );
}

export default Friends;
