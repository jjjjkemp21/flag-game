import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import Icon from './Icon';
import { Button, Pill, ChoiceCard } from './ui';
import { useToast } from './ui/Toast';
import Mascot from '../assets/illustrations/Mascot';
import ScoringInfo from './ScoringInfo';
import Spinner from '../assets/illustrations/Spinner';
import { useAuth } from '../auth/AuthProvider';
import { useAudio } from '../audio/AudioProvider';
import { recordBattleResult } from '../lib/pet';
import {
    mp, useLobbyPoll, makeEngine, checkText,
    MP_MODES, DEFAULT_MP_CONFIG, modeMeta,
} from '../lib/multiplayer';

const titleCase = (s) => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

function regionsOf(flagsData) {
    return [...new Set((flagsData || []).flatMap((f) =>
        (f.tags || []).filter((t) => t.startsWith('region:')).map((t) => t.split(':')[1])
    ))].sort();
}

// ---------------------------------------------------------------------------
// Config editor — shared by the create form and the host's lobby controls.
// ---------------------------------------------------------------------------
function ConfigEditor({ config, regions, disabled, onChange }) {
    const set = (patch) => {
        const next = { ...config, ...patch };
        if (patch.mode) {
            const meta = modeMeta(patch.mode);
            next.maxPlayers = (patch.mode === 'blitz' || patch.mode === 'battle') ? 2 : meta.maxPlayers;
            // Battle's "hits to KO" lives on a smaller scale than a race target.
            if (patch.mode === 'battle' && next.target > 50) next.target = 20;
        }
        if (next.content === 'languages') next.scope = 'all';
        onChange(next);
    };

    return (
        <div className="mp-config">
            <div className="mp-field">
                <span className="mp-field__label">Game mode</span>
                <div className="mp-choices">
                    {MP_MODES.map((m) => (
                        <button
                            key={m.key}
                            type="button"
                            disabled={disabled}
                            className={`mp-chip ${config.mode === m.key ? 'is-on' : ''}`}
                            onClick={() => set({ mode: m.key })}
                        >
                            <Icon name={m.icon} /> {m.title}
                        </button>
                    ))}
                </div>
                <span className="mp-field__hint">{modeMeta(config.mode).desc}.</span>
            </div>

            <div className="mp-field">
                <span className="mp-field__label">Questions</span>
                <div className="mp-choices">
                    <button type="button" disabled={disabled} className={`mp-chip ${config.content === 'flags' ? 'is-on' : ''}`} onClick={() => set({ content: 'flags' })}>
                        <Icon name="flag" /> Flags
                    </button>
                    <button type="button" disabled={disabled} className={`mp-chip ${config.content === 'languages' ? 'is-on' : ''}`} onClick={() => set({ content: 'languages' })}>
                        <Icon name="translate" /> Languages
                    </button>
                </div>
            </div>

            <div className="mp-field">
                <span className="mp-field__label">Answer style</span>
                <div className="mp-choices">
                    <button type="button" disabled={disabled} className={`mp-chip ${config.questionType === 'mc' ? 'is-on' : ''}`} onClick={() => set({ questionType: 'mc' })}>
                        <Icon name="list" /> Multiple choice
                    </button>
                    <button type="button" disabled={disabled} className={`mp-chip ${config.questionType === 'text' ? 'is-on' : ''}`} onClick={() => set({ questionType: 'text' })}>
                        <Icon name="keyboard" /> Free text
                    </button>
                </div>
            </div>

            {config.questionType === 'text' && (
                <div className="mp-field">
                    <span className="mp-field__label">Spelling</span>
                    <div className="mp-choices">
                        <button type="button" disabled={disabled} className={`mp-chip ${!config.strict ? 'is-on' : ''}`} onClick={() => set({ strict: false })}>
                            <Icon name="spellcheck" /> Lenient
                        </button>
                        <button type="button" disabled={disabled} className={`mp-chip ${config.strict ? 'is-on' : ''}`} onClick={() => set({ strict: true })}>
                            <Icon name="rule" /> Strict
                        </button>
                    </div>
                    <span className="mp-field__hint">Strict requires exact spelling.</span>
                </div>
            )}

            {config.content === 'flags' && (
                <div className="mp-field">
                    <span className="mp-field__label">Which flags</span>
                    <select
                        className="auth-field__input"
                        value={config.scope}
                        disabled={disabled}
                        onChange={(e) => set({ scope: e.target.value })}
                    >
                        <option value="all">All flags</option>
                        {regions.map((r) => <option key={r} value={r}>{titleCase(r)}</option>)}
                    </select>
                </div>
            )}

            {config.mode === 'battle' ? (
                <div className="mp-field">
                    <span className="mp-field__label">Hits to KO: <strong>{config.target}</strong></span>
                    <input type="range" min="5" max="50" step="1" value={config.target} disabled={disabled}
                        onChange={(e) => set({ target: parseInt(e.target.value, 10) })} style={{ accentColor: 'var(--color-primary)' }} />
                    <span className="mp-field__hint">Each correct answer lands a hit on your rival's Atlas.</span>
                </div>
            ) : config.mode === 'race' ? (
                <div className="mp-field">
                    <span className="mp-field__label">{config.content === 'languages' ? 'Languages' : 'Flags'} to win: <strong>{config.target}</strong></span>
                    <input type="range" min="5" max="100" step="5" value={config.target} disabled={disabled}
                        onChange={(e) => set({ target: parseInt(e.target.value, 10) })} style={{ accentColor: 'var(--color-primary)' }} />
                </div>
            ) : (
                <div className="mp-field">
                    <span className="mp-field__label">Match length: <strong>{config.duration}s</strong></span>
                    <input type="range" min="30" max="180" step="15" value={config.duration} disabled={disabled}
                        onChange={(e) => set({ duration: parseInt(e.target.value, 10) })} style={{ accentColor: 'var(--color-primary)' }} />
                </div>
            )}

            {config.mode !== 'blitz' && config.mode !== 'battle' && (
                <div className="mp-field">
                    <span className="mp-field__label">Max players: <strong>{config.maxPlayers}</strong></span>
                    <input type="range" min="2" max="8" step="1" value={config.maxPlayers} disabled={disabled}
                        onChange={(e) => set({ maxPlayers: parseInt(e.target.value, 10) })} style={{ accentColor: 'var(--color-primary)' }} />
                </div>
            )}
            {config.mode === 'blitz' && <p className="mp-field__hint">1v1 Blitz is locked to 2 players.</p>}
            {config.mode === 'battle' && <p className="mp-field__hint">Atlas Battle is 1v1 — losing drops your Atlas's battle HP (heal it by playing other modes).</p>}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Hub — host a new lobby or join one by code.
// ---------------------------------------------------------------------------
function Hub({ flagsData, onEnter, setView }) {
    const toast = useToast();
    const regions = useMemo(() => regionsOf(flagsData), [flagsData]);
    const [tab, setTab] = useState('host');
    const [draft, setDraft] = useState(DEFAULT_MP_CONFIG);
    const [joinCode, setJoinCode] = useState('');
    const [busy, setBusy] = useState(false);

    const host = async () => {
        setBusy(true);
        try {
            const lobby = await mp.create(draft);
            onEnter(lobby.code, lobby);
        } catch (err) {
            toast.danger(err.message || 'Could not create lobby.');
        } finally { setBusy(false); }
    };

    const join = async () => {
        const code = joinCode.trim().toUpperCase();
        if (code.length < 4) { toast.danger('Enter the 4-character code.'); return; }
        setBusy(true);
        try {
            const lobby = await mp.join(code);
            onEnter(code, lobby);
        } catch (err) {
            toast.danger(err.message || 'Could not join lobby.');
        } finally { setBusy(false); }
    };

    return (
        <div className="quiz-box mp-box">
            <div className="quiz-topbar">
                <button className="back-button" onClick={() => setView('menu')} aria-label="Back">
                    <Icon name="arrow_back" /> Back
                </button>
            </div>
            <div className="menu-title-row">
                <h2 className="text-center" style={{ margin: 0 }}>Multiplayer</h2>
                <ScoringInfo mode="multiplayer" />
            </div>

            <div className="auth-tabs">
                <button className={`auth-tab ${tab === 'host' ? 'is-active' : ''}`} onClick={() => setTab('host')}>Host a lobby</button>
                <button className={`auth-tab ${tab === 'join' ? 'is-active' : ''}`} onClick={() => setTab('join')}>Join a lobby</button>
            </div>

            {tab === 'host' ? (
                <>
                    <ConfigEditor config={draft} regions={regions} onChange={setDraft} />
                    <Button variant="primary" fullWidth icon="sports_esports" onClick={host} disabled={busy}>
                        Create lobby
                    </Button>
                </>
            ) : (
                <div className="mp-join">
                    <input
                        className="auth-field__input mp-code-input"
                        value={joinCode}
                        maxLength={4}
                        placeholder="CODE"
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                        onKeyDown={(e) => { if (e.key === 'Enter') join(); }}
                    />
                    <Button variant="primary" fullWidth icon="login" onClick={join} disabled={busy}>
                        Join
                    </Button>
                </div>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Lobby room — waiting for players; host configures + starts.
// ---------------------------------------------------------------------------
function LobbyRoom({ lobby, code, flagsData, onLeave, refresh, setState }) {
    const toast = useToast();
    const regions = useMemo(() => regionsOf(flagsData), [flagsData]);
    const [busy, setBusy] = useState(false);
    const isHost = lobby.isHost;
    const players = lobby.members;

    const pushConfig = async (next) => {
        setState((s) => (s ? { ...s, config: next } : s)); // optimistic
        try { await mp.setConfig(code, next); } catch (err) { toast.danger(err.message || 'Could not update settings.'); refresh(); }
    };

    const start = async () => {
        setBusy(true);
        try { setState(await mp.start(code)); } catch (err) { toast.danger(err.message || 'Could not start.'); } finally { setBusy(false); }
    };

    const copyCode = () => {
        try { navigator.clipboard?.writeText(code); toast.success('Code copied!'); } catch (_) { /* ignore */ }
    };

    return (
        <div className="quiz-box mp-box">
            <div className="quiz-topbar">
                <button className="back-button" onClick={onLeave} aria-label="Leave">
                    <Icon name="arrow_back" /> Leave
                </button>
            </div>
            <h2 className="text-center">Lobby</h2>

            <button className="mp-code" onClick={copyCode} aria-label="Copy join code">
                <span className="mp-code__label">Join code</span>
                <span className="mp-code__value">{code}</span>
                <Icon name="content_copy" />
            </button>

            <div className="mp-players">
                {players.map((p) => (
                    <div key={p.id} className="mp-player">
                        <Mascot size={44} mood="idle" cosmetics={p.cosmetics} still />
                        <span className="mp-player__name">{p.username}</span>
                        {p.id === lobby.hostId && <Pill tone="accent" icon="star">Host</Pill>}
                    </div>
                ))}
            </div>
            <p className="auth-hint text-center">{players.length} / {lobby.config.maxPlayers} players</p>

            {isHost ? (
                <>
                    <ConfigEditor config={lobby.config} regions={regions} onChange={pushConfig} />
                    <Button variant="primary" fullWidth icon="play_arrow" onClick={start} disabled={busy || players.length < 2}>
                        {players.length < 2 ? 'Need at least 2 players' : 'Start match'}
                    </Button>
                </>
            ) : (
                <div className="mp-waiting">
                    <Spinner />
                    <p className="auth-hint">Waiting for the host to start…</p>
                    <ConfigSummary config={lobby.config} />
                </div>
            )}
        </div>
    );
}

function ConfigSummary({ config }) {
    const meta = modeMeta(config.mode);
    return (
        <div className="mp-summary">
            <Pill tone="primary" icon={meta.icon}>{meta.title}</Pill>
            <Pill tone="info" icon={config.content === 'languages' ? 'translate' : 'flag'}>
                {config.content === 'languages' ? 'Languages' : (config.scope === 'all' ? 'All flags' : titleCase(config.scope))}
            </Pill>
            <Pill tone="neutral" icon={config.questionType === 'text' ? 'keyboard' : 'list'}>
                {config.questionType === 'text' ? 'Free text' : 'Multiple choice'}
            </Pill>
            <Pill tone="success" icon={config.mode === 'race' ? 'flag' : 'timer'}>
                {config.mode === 'race' ? `${config.target} to win` : `${config.duration}s`}
            </Pill>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Game — local question loop + live scoreboard. Posts progress to the server.
// ---------------------------------------------------------------------------
function Game({ lobby, code, flagsData, meId }) {
    const audio = useAudio();
    const config = lobby.config;
    const [lang, setLang] = useState({ languages: null, phrases: null, loading: config.content === 'languages' });

    useEffect(() => {
        if (config.content !== 'languages') return;
        let cancelled = false;
        (async () => {
            try {
                const [l, p] = await Promise.all([
                    fetch('./data/languages.json').then((r) => r.json()),
                    fetch('./data/phrases.json').then((r) => r.json()),
                ]);
                if (!cancelled) setLang({ languages: l, phrases: p, loading: false });
            } catch (_) {
                if (!cancelled) setLang({ languages: [], phrases: {}, loading: false });
            }
        })();
        return () => { cancelled = true; };
    }, [config.content]);

    // Keyed on stable primitives (not the poll-fresh config object) so the engine
    // builds once per match rather than on every poll.
    const engine = useMemo(() => {
        if (config.content === 'languages' && lang.loading) return null;
        return makeEngine({
            config, seed: lobby.seed, flagsData,
            languagesData: lang.languages, phrasesData: lang.phrases,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [config.content, config.scope, config.questionType, lobby.seed, flagsData, lang.loading]);

    const [qIndex, setQIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);
    const [answered, setAnswered] = useState(false);
    const [chosen, setChosen] = useState(null);
    const [input, setInput] = useState('');
    const inputRef = useRef(null);
    const advanceTimer = useRef(null);

    // Clock sync for timed modes.
    const offsetRef = useRef(0);
    useEffect(() => { if (lobby.serverNow) offsetRef.current = lobby.serverNow - Date.now(); }, [lobby.serverNow]);
    const [now, setNow] = useState(Date.now());
    useEffect(() => {
        if (!lobby.endsAt) return undefined; // race mode has no clock
        const t = setInterval(() => setNow(Date.now()), 300);
        return () => clearInterval(t);
    }, [lobby.endsAt]);
    const timeLeft = lobby.endsAt ? Math.max(0, Math.round((lobby.endsAt - (now + offsetRef.current)) / 1000)) : null;
    const timeUp = timeLeft === 0;

    const question = useMemo(() => (engine ? engine.get(qIndex) : null), [engine, qIndex]);

    const post = useCallback((body) => { mp.progress(code, body).catch(() => {}); }, [code]);

    // Let the server know which question we're on so opponents can see our pick on
    // the matching question (and so we can see theirs).
    useEffect(() => { post({ qIndex }); }, [qIndex, post]);

    useEffect(() => () => { if (advanceTimer.current) clearTimeout(advanceTimer.current); }, []);
    useEffect(() => {
        if (!answered && config.questionType === 'text' && inputRef.current) inputRef.current.focus();
    }, [answered, qIndex, config.questionType]);

    const finished = lobby.state === 'finished' || timeUp;

    const handleResult = (correct, pick) => {
        if (answered || finished) return;
        setAnswered(true);
        let s = score, st = streak, bs = bestStreak;
        if (correct) {
            audio.play('correct');
            s = score + 1; st = streak + 1; bs = Math.max(bestStreak, st);
            setScore(s); setStreak(st); setBestStreak(bs);
        } else {
            audio.play('incorrect');
            // A miss costs a point (never below zero) and breaks the streak.
            s = Math.max(0, score - 1); st = 0;
            setScore(s); setStreak(0);
        }
        const done = config.mode === 'race' && s >= config.target;
        post({ score: s, streak: st, bestStreak: bs, finished: done, qIndex, pick: pick || null });
        advanceTimer.current = setTimeout(() => {
            setAnswered(false); setChosen(null); setInput('');
            setQIndex((i) => i + 1);
        }, correct ? 650 : 1100);
    };

    const onChoice = (label) => {
        if (answered || finished) return;
        setChosen(label);
        handleResult(label === question.answer, label);
    };
    const onSubmit = (e) => {
        e.preventDefault();
        if (answered || finished || !input.trim()) return;
        handleResult(checkText(input, question, config.strict), null);
    };

    const choiceState = (opt) => {
        if (!answered) return 'idle';
        if (opt === question.answer) return 'correct';
        if (opt === chosen) return 'incorrect';
        return 'idle';
    };

    if (!engine || !question) {
        return <div className="loading-box"><Spinner /><span>Setting up the match…</span></div>;
    }

    return (
        <div className="quiz-box mp-box mp-game">
            <div className="mp-hud">
                {config.mode === 'race' ? (
                    <Pill tone="primary" icon="flag">{score} / {config.target}</Pill>
                ) : config.mode === 'battle' ? (
                    <Pill tone="primary" icon="sports_mma">{score} / {config.target} hits</Pill>
                ) : (
                    <Pill tone="primary" icon="check_circle">{score} correct</Pill>
                )}
                <Pill tone="accent" icon="local_fire_department">Streak {streak}</Pill>
                {timeLeft != null && <Pill tone={timeLeft <= 10 ? 'danger' : 'info'} icon="timer">{timeLeft}s</Pill>}
            </div>

            <Scoreboard members={lobby.members} meId={meId} mode={config.mode} target={config.target} />

            <div className="mp-question">
                {question.kind === 'flag' ? (
                    <motion.img key={`${qIndex}-img`} src={question.image} alt="Flag" className="flag-image"
                        initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }} />
                ) : (
                    <motion.h2 key={`${qIndex}-ph`} className="phrase-text"
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                        "{question.phrase}"
                    </motion.h2>
                )}
                {question.kind === 'language' && <p className="menu-subtitle">Which language is this?</p>}
            </div>

            {config.questionType === 'mc' ? (
                <div className="options-box">
                    {question.options.map((opt, i) => {
                        // Opponents who picked this option for the question I'm on.
                        const pickers = lobby.members.filter((m) => m.id !== meId && m.pick === opt);
                        return (
                            <div className="mp-choice-wrap" key={`${qIndex}-${opt}`}>
                                <ChoiceCard label={opt} index={i} state={choiceState(opt)} disabled={answered || finished} onSelect={onChoice} />
                                {pickers.length > 0 && (
                                    <span className="mp-pickers" aria-hidden="true">
                                        {pickers.map((p) => (
                                            <span key={p.id} className="mp-picker" title={p.username}>
                                                <Mascot size={26} mood="idle" cosmetics={p.cosmetics} still />
                                            </span>
                                        ))}
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <form onSubmit={onSubmit} className="response-form">
                    <input ref={inputRef} type="text" value={input} disabled={answered || finished}
                        className="response-input" placeholder="Type your answer…" autoComplete="off" autoCorrect="off" spellCheck="false"
                        onChange={(e) => setInput(e.target.value)} />
                    <div className="quiz-actions">
                        <button type="submit" disabled={answered || finished || !input.trim()} className="response-submit">Submit</button>
                    </div>
                    {answered && (
                        <p className="feedback-answer" style={{ color: 'var(--color-ink-soft)' }}>Answer: {question.answer}</p>
                    )}
                </form>
            )}

            {timeUp && lobby.state !== 'finished' && (
                <p className="auth-hint text-center">Time! Tallying results…</p>
            )}
        </div>
    );
}

function Scoreboard({ members, meId, mode, target }) {
    // Stable lanes: order by id so bars grow in place instead of reshuffling
    // (and jittering) on every poll.
    const rows = [...members].sort((a, b) => a.id - b.id);

    // Atlas Battle shows each player's REMAINING HP (target minus the hits their
    // rival has landed), so the bars drain toward a KO instead of filling up.
    if (mode === 'battle') {
        const damageTo = (m) => members.filter((x) => x.id !== m.id).reduce((s, x) => s + x.score, 0);
        return (
            <div className="mp-scoreboard">
                {rows.map((m) => {
                    const hp = Math.max(0, target - damageTo(m));
                    const ko = hp <= 0;
                    return (
                        <div key={m.id} className={`mp-score-row mp-score-row--bar ${m.id === meId ? 'is-me' : ''}`}>
                            <Mascot size={28} mood={ko ? 'dead' : 'idle'} cosmetics={m.cosmetics} still bruised={hp < target * 0.4} />
                            <span className="mp-score-name">{m.username}</span>
                            <span className="mp-score-bar"><span className="mp-score-bar__fill mp-score-bar__fill--hp" style={{ width: `${Math.min(100, (hp / target) * 100)}%` }} /></span>
                            <span className="mp-score-val">{ko ? 'KO' : hp}</span>
                        </div>
                    );
                })}
            </div>
        );
    }

    const metric = (m) => (mode === 'streak' ? m.bestStreak : m.score);
    const max = mode === 'race' ? target : Math.max(1, ...members.map(metric));
    return (
        <div className="mp-scoreboard">
            {rows.map((m) => (
                <div key={m.id} className={`mp-score-row mp-score-row--bar ${m.id === meId ? 'is-me' : ''}`}>
                    <Mascot size={28} mood="idle" cosmetics={m.cosmetics} still />
                    <span className="mp-score-name">{m.username}</span>
                    <span className="mp-score-bar"><span className="mp-score-bar__fill" style={{ width: `${Math.min(100, (metric(m) / max) * 100)}%` }} /></span>
                    <span className="mp-score-val">{metric(m)}</span>
                </div>
            ))}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Results — winner + final standings.
// ---------------------------------------------------------------------------
function Results({ lobby, meId, code, onLeave, setState }) {
    const audio = useAudio();
    const mode = lobby.config.mode;
    const metric = (m) => (mode === 'streak' ? m.bestStreak : m.score);
    const ranked = [...lobby.members].sort((a, b) => metric(b) - metric(a));
    const winner = lobby.members.find((m) => m.id === lobby.winnerId) || ranked[0];
    const iWon = winner && winner.id === meId;

    useEffect(() => {
        audio.play(iWon ? 'levelUp' : 'gameOver');
        // Atlas Battle outcomes act on the (separate, revivable) battle-HP track.
        if (mode === 'battle') recordBattleResult(iWon);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const rematch = async () => {
        try { setState(await mp.reset(code)); } catch (_) { /* host-only; ignore */ }
    };

    return (
        <div className="quiz-box mp-box">
            <h2 className="text-center">{iWon ? 'You win! 🏆' : `${winner ? winner.username : 'Nobody'} wins!`}</h2>
            <Mascot size={120} mood={iWon ? 'cheer' : 'wave'} cosmetics={winner ? winner.cosmetics : null} />
            <div className="mp-scoreboard">
                {ranked.map((m, i) => (
                    <div key={m.id} className={`mp-score-row ${m.id === meId ? 'is-me' : ''}`}>
                        <span className="leaderboard-rank">#{i + 1}</span>
                        <Mascot size={28} mood="idle" cosmetics={m.cosmetics} still />
                        <span className="mp-score-name">{m.username}</span>
                        <span className="mp-score-val">{metric(m)}{mode === 'streak' ? ' streak' : ''}</span>
                    </div>
                ))}
            </div>
            <div className="account-menu">
                {lobby.isHost && <Button variant="primary" fullWidth icon="replay" onClick={rematch}>Play again</Button>}
                <Button variant="secondary" fullWidth icon="logout" onClick={onLeave}>Leave lobby</Button>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Top-level flow controller.
// ---------------------------------------------------------------------------
function MultiplayerScreen({ setView, flagsData }) {
    const { isAuthed, user } = useAuth();
    const [code, setCode] = useState(null);
    const { state: lobby, error, refresh, setState } = useLobbyPoll(code, !!code);

    // Track the live code so the unmount cleanup can leave without re-subscribing.
    const codeRef = useRef(null);
    codeRef.current = code;

    const onEnter = (joinedCode, initial) => { setCode(joinedCode); if (initial) setState(initial); };

    const leave = useCallback(async () => {
        if (code) { try { await mp.leave(code); } catch (_) { /* ignore */ } }
        setCode(null);
        setState(null);
    }, [code, setState]);

    // Leave the lobby when navigating away (component unmounts). Tab-close is
    // handled by the server's idle-member cleanup.
    useEffect(() => () => {
        if (codeRef.current) mp.leave(codeRef.current).catch(() => {});
    }, []);

    if (!isAuthed) {
        return (
            <div className="quiz-box mp-box">
                <div className="quiz-topbar">
                    <button className="back-button" onClick={() => setView('menu')} aria-label="Back">
                        <Icon name="arrow_back" /> Back
                    </button>
                </div>
                <div className="signin-prompt">
                    <Icon name="sports_esports" size="xl" />
                    <h2>Multiplayer</h2>
                    <p>Log in to host or join a lobby and race friends to guess the most flags.</p>
                    <Button variant="primary" icon="login" onClick={() => setView('login')}>Log in or sign up</Button>
                </div>
            </div>
        );
    }

    if (!code) return <Hub flagsData={flagsData} onEnter={onEnter} setView={setView} />;

    if (!lobby) {
        return (
            <div className="quiz-box mp-box">
                <div className="loading-box"><Spinner /><span>{error || 'Joining lobby…'}</span></div>
                {error && <Button variant="secondary" icon="arrow_back" onClick={leave}>Back</Button>}
            </div>
        );
    }

    if (lobby.state === 'finished') {
        return <Results lobby={lobby} meId={user.id} code={code} onLeave={leave} setState={setState} />;
    }
    if (lobby.state === 'playing') {
        return <Game lobby={lobby} code={code} flagsData={flagsData} meId={user.id} />;
    }
    return <LobbyRoom lobby={lobby} code={code} flagsData={flagsData} onLeave={leave} refresh={refresh} setState={setState} />;
}

export default MultiplayerScreen;
