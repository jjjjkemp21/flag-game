import React, { useEffect, useState, useCallback } from 'react';
import Icon from './Icon';
import { Button, Pill } from './ui';
import Mascot from '../assets/illustrations/Mascot';
import AchievementBadge from './AchievementBadge';
import ProfileCard from './ProfileCard';
import { useAuth } from '../auth/AuthProvider';
import { api } from '../api/client';
import { scopeRank } from '../lib/mastery';
import { ACHIEVEMENTS_BY_ID } from '../lib/achievements';

const FLAG_BASE = './assets/flags/';

const SCOPES = [
    { key: 'overall',      label: 'Overall',       icon: 'public',    unit: 'XP' },
    { key: 'friends',      label: 'Friends',       icon: 'group',     unit: 'XP' },
    { key: 'atlas',        label: 'Atlas Level',   icon: 'pets',      unit: 'Lv' },
    { key: 'frenzy',       label: 'Frenzy',        icon: 'bolt',      unit: 'pts' },
    { key: 'pixelated',    label: 'Pixelated',     icon: 'blur_on',   unit: 'pts' },
    { key: 'longestRoute', label: 'Longest Chain', icon: 'route',     unit: 'pts' },
    { key: 'language',     label: 'Language',      icon: 'translate', unit: 'pts' },
];

function formatValue(scope, value) {
    if (scope === 'atlas') return `Lv ${value}`;
    if (scope === 'overall' || scope === 'friends') return `${value} XP`;
    return `${value} pts`;
}

function Leaderboard({ setView, flagsData }) {
    const { user, isAuthed } = useAuth();
    const total = (flagsData && flagsData.length) || 0;
    const [scope, setScope] = useState('overall');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selected, setSelected] = useState(null);

    const load = useCallback(async () => {
        if (!isAuthed) return;
        setLoading(true);
        setError(null);
        try {
            setData(await api.get(`/leaderboard?scope=${scope}`));
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

            <div className="scope-tabs">
                {SCOPES.map((s) => (
                    <button
                        key={s.key}
                        className={`scope-tab ${scope === s.key ? 'is-active' : ''}`}
                        onClick={() => setScope(s.key)}
                    >
                        <Icon name={s.icon} /> {s.label}
                    </button>
                ))}
            </div>

            {data && data.myRank != null && (
                <div className="my-rank-pill">
                    <Pill tone="primary" icon="star">Your rank: #{data.myRank} · {formatValue(scope, data.myValue)}</Pill>
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
                    {data.entries.map((row) => {
                        const r = scopeRank(scope, row, total);
                        const badges = (row.showcase || []).map((id) => ACHIEVEMENTS_BY_ID[id]).filter(Boolean);
                        return (
                            <li
                                key={row.id}
                                className={`leaderboard-row is-clickable ${user && row.id === user.id ? 'is-me' : ''}`}
                                onClick={() => setSelected(row)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected(row); } }}
                            >
                                <span className="leaderboard-rank">#{row.rank}</span>
                                <span className="leaderboard-avatar">
                                    <Mascot size={40} mood="idle" cosmetics={row.cosmetics} still />
                                </span>
                                <span className="leaderboard-id">
                                    <span className="leaderboard-name">
                                        {row.region && (
                                            <img className="leaderboard-flag" src={`${FLAG_BASE}${row.region.toLowerCase()}.svg`} alt="" />
                                        )}
                                        <span className="leaderboard-username">{row.username}</span>
                                        {badges.length > 0 && (
                                            <span className="leaderboard-badges">
                                                {badges.map((a) => (
                                                    <AchievementBadge key={a.id} ach={a} />
                                                ))}
                                            </span>
                                        )}
                                    </span>
                                    <span className="leaderboard-sub">
                                        <span className={`rank-tag rank-pill--${r.tier}`}>{r.title}</span>
                                        {' · '}{row.petName || 'Atlas'} Lv {row.petLevel}
                                        {(scope === 'overall' || scope === 'friends') && ` · ${row.masteredCount} mastered`}
                                    </span>
                                </span>
                                <span className="leaderboard-xp">{formatValue(scope, row.value)}</span>
                            </li>
                        );
                    })}
                </ol>
            )}

            {selected && (
                <ProfileCard row={selected} flagsData={flagsData} onClose={() => setSelected(null)} />
            )}
        </div>
    );
}

export default Leaderboard;
