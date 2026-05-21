import React, { useEffect, useState, useCallback } from 'react';
import Icon from './Icon';
import { Button, Pill } from './ui';
import { useAuth } from '../auth/AuthProvider';
import { api } from '../api/client';

function Leaderboard({ setView }) {
    const { user, isAuthed } = useAuth();
    const [scope, setScope] = useState('global');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const load = useCallback(async () => {
        if (!isAuthed) return;
        setLoading(true);
        setError(null);
        try {
            const res = await api.get(`/leaderboard?scope=${scope}`);
            setData(res);
        } catch (err) {
            setError(err.message || 'Could not load leaderboard.');
        } finally {
            setLoading(false);
        }
    }, [scope, isAuthed]);

    useEffect(() => { load(); }, [load]);

    if (!isAuthed) {
        return (
            <div className="quiz-box leaderboard-box">
                <div className="quiz-topbar">
                    <button className="back-button" onClick={() => setView('menu')} aria-label="Back">
                        <Icon name="arrow_back" /> Back
                    </button>
                </div>
                <div className="signin-prompt">
                    <Icon name="leaderboard" size="xl" />
                    <h2>Global Leaderboard</h2>
                    <p>Log in to climb the ranks and see how you stack up against players worldwide.</p>
                    <Button variant="primary" icon="login" onClick={() => setView('login')}>Log in or sign up</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="quiz-box leaderboard-box">
            <div className="quiz-topbar">
                <button className="back-button" onClick={() => setView('menu')} aria-label="Back">
                    <Icon name="arrow_back" /> Back
                </button>
            </div>
            <h2 className="text-center">Leaderboard</h2>

            <div className="seg-toggle" role="tablist">
                <button className={`seg-toggle__btn ${scope === 'global' ? 'is-active' : ''}`} onClick={() => setScope('global')}>
                    <Icon name="public" /> Global
                </button>
                <button className={`seg-toggle__btn ${scope === 'friends' ? 'is-active' : ''}`} onClick={() => setScope('friends')}>
                    <Icon name="group" /> Friends
                </button>
            </div>

            {data && (
                <div className="my-rank-pill">
                    <Pill tone="primary" icon="star">Your rank: #{data.myRank} · {data.myXp} XP</Pill>
                </div>
            )}

            {loading && <p className="text-center">Loading…</p>}
            {error && <p className="text-center" style={{ color: 'var(--color-danger)' }}>{error}</p>}

            {data && !loading && (
                <ol className="leaderboard-list">
                    {data.entries.length === 0 && (
                        <p className="text-center auth-hint">
                            {scope === 'friends' ? 'Add friends to see a friends leaderboard.' : 'No players yet.'}
                        </p>
                    )}
                    {data.entries.map((row) => (
                        <li key={row.id} className={`leaderboard-row ${user && row.id === user.id ? 'is-me' : ''}`}>
                            <span className="leaderboard-rank">#{row.rank}</span>
                            <span className="leaderboard-name">{row.username}</span>
                            <span className="leaderboard-mastered">{row.masteredCount} mastered</span>
                            <span className="leaderboard-xp">{row.xp} XP</span>
                        </li>
                    ))}
                </ol>
            )}
        </div>
    );
}

export default Leaderboard;
