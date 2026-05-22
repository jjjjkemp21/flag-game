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
    { key: 'atlas',        label: 'Atlas Level',   icon: 'pets',      unit: 'Lv' },
    { key: 'mpwins',       label: 'MP Wins',       icon: 'sports_esports', unit: 'wins' },
    { key: 'frenzy',       label: 'Frenzy',        icon: 'bolt',      unit: 'pts' },
    { key: 'pixelated',    label: 'Pixelated',     icon: 'blur_on',   unit: 'pts' },
    { key: 'longestRoute', label: 'Longest Chain', icon: 'route',     unit: 'pts' },
    { key: 'language',     label: 'Language',      icon: 'translate', unit: 'pts' },
];

// How often the open leaderboard refreshes itself so ranks update live.
const POLL_MS = 15000;

function formatValue(scope, value) {
    if (scope === 'atlas') return `Lv ${value}`;
    if (scope === 'mpwins') return `${value} ${value === 1 ? 'win' : 'wins'}`;
    if (scope === 'overall' || scope === 'friends') return `${value} XP`;
    return `${value} pts`;
}

function Leaderboard({ setView, flagsData }) {
    const { user, isAuthed } = useAuth();
    const total = (flagsData && flagsData.length) || 0;
    const [scope, setScope] = useState('overall');
    const [filter, setFilter] = useState('global'); // 'global' | 'friends'
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selected, setSelected] = useState(null);

    // `silent` refreshes (the live poll) update in place without flashing the
    // loading state or clearing the current rows.
    const load = useCallback(async (silent = false) => {
        if (!isAuthed) return;
        if (!silent) setLoading(true);
        setError(null);
        try {
            const next = await api.get(`/leaderboard?scope=${scope}&filter=${filter}`);
            setData(next);
        } catch (err) {
            if (!silent) setError(err.message || 'Could not load leaderboard.');
        } finally {
            if (!silent) setLoading(false);
        }
    }, [scope, filter, isAuthed]);

    useEffect(() => { load(); }, [load]);

    // Live updates: re-fetch the current scope/filter on an interval while open.
    useEffect(() => {
        if (!isAuthed) return undefined;
        const id = setInterval(() => load(true), POLL_MS);
        return () => clearInterval(id);
    }, [load, isAuthed]);

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

            {/* Global vs Friends applies to whichever scope is selected. */}
            <div className="lb-filter">
                <button
                    className={`lb-filter__btn ${filter === 'global' ? 'is-active' : ''}`}
                    onClick={() => setFilter('global')}
                >
                    <Icon name="public" /> Global
                </button>
                <button
                    className={`lb-filter__btn ${filter === 'friends' ? 'is-active' : ''}`}
                    onClick={() => setFilter('friends')}
                >
                    <Icon name="group" /> Friends
                </button>
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
                            {filter === 'friends' ? 'Add friends to see them ranked here.' : 'No players yet.'}
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
                                        {' · '}{row.petName || 'Atlas'} · {row.petStage || 'Hatchling'} Lv {row.petLevel}
                                        {scope === 'overall' && ` · ${row.masteredCount} mastered`}
                                        {row.bestStreak > 0 && (
                                            <span className="leaderboard-streak"><Icon name="local_fire_department" /> {row.bestStreak}</span>
                                        )}
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
