import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import Icon from '../common/Icon';
import { Button, Pill, ChoiceCard } from '../ui/index';
import { useToast } from '../ui/Toast';
import Mascot from '../../assets/illustrations/Mascot';
import AtlasBucksIcon from '../../assets/illustrations/AtlasBucks';
import ScoringInfo from '../quizzes/ScoringInfo';
import Spinner from '../../assets/illustrations/Spinner';
import { useAuth } from '../../auth/AuthProvider';
import { useAudio } from '../../audio/AudioProvider';
import { recordBattleResult } from '../../lib/pet';
import { useCurrency, setBucksLocal } from '../../lib/currency';
import { refreshBattlepass } from '../../lib/battlepass';
import { bumpQuestMetric } from '../../lib/quests';
import Globe from '../../lib/globe/Globe';
import {
    mp, useLobbyPoll, makeEngine, checkText, checkGlobePick,
    MP_MODES, DEFAULT_MP_CONFIG, ANTE_MAX, modeMeta,
} from '../../lib/multiplayer';
import { useQuizPresence } from '../../lib/presence';
import SpectatorsBadge from './SpectatorsBadge';

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
        if (patch.content === 'globe') {
            // Globe is click-on-country only; Atlas Battle's rapid pace doesn't
            // fit a place-the-pin loop, so steer back to Race if needed.
            if (next.mode === 'battle') next.mode = 'race';
            next.questionType = 'mc'; // ignored, but kept valid for the server
        }
        if (next.content === 'languages') next.scope = 'all';
        onChange(next);
    };

    const isGlobe = config.content === 'globe';

    return (
        <div className="mp-config">
            <div className="mp-field">
                <span className="mp-field__label">Game mode</span>
                <div className="mp-choices">
                    {MP_MODES.map((m) => {
                        const banned = isGlobe && m.key === 'battle';
                        return (
                            <button
                                key={m.key}
                                type="button"
                                disabled={disabled || banned}
                                className={`mp-chip ${config.mode === m.key ? 'is-on' : ''}`}
                                onClick={() => set({ mode: m.key })}
                                title={banned ? 'Atlas Battle is not available for Globe rounds' : undefined}
                            >
                                <Icon name={m.icon} /> {m.title}
                            </button>
                        );
                    })}
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
                    <button type="button" disabled={disabled} className={`mp-chip ${config.content === 'globe' ? 'is-on' : ''}`} onClick={() => set({ content: 'globe' })}>
                        <Icon name="public" /> Globe
                    </button>
                </div>
                {isGlobe && <span className="mp-field__hint">Find the flag's country on the 3D globe.</span>}
            </div>

            {!isGlobe && (
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
            )}

            {!isGlobe && config.questionType === 'text' && (
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

            {(config.content === 'flags' || config.content === 'globe') && (
                <div className="mp-field">
                    <span className="mp-field__label">{isGlobe ? 'Which countries' : 'Which flags'}</span>
                    <select
                        className="auth-field__input"
                        value={config.scope}
                        disabled={disabled}
                        onChange={(e) => set({ scope: e.target.value })}
                    >
                        <option value="all">{isGlobe ? 'All countries' : 'All flags'}</option>
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
                    <span className="mp-field__label">
                        {config.content === 'languages' ? 'Languages' : config.content === 'globe' ? 'Countries' : 'Flags'} to win:
                        {' '}<strong>{config.target}</strong>
                    </span>
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

            <div className="mp-field">
                <span className="mp-field__label">
                    <AtlasBucksIcon size={14} /> Wager (per player)
                </span>
                <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    max={ANTE_MAX}
                    step="1"
                    className="auth-field__input"
                    value={+config.ante || 0}
                    disabled={disabled}
                    onChange={(e) => {
                        const raw = parseInt(e.target.value, 10);
                        const n = Number.isFinite(raw) ? raw : 0;
                        set({ ante: Math.max(0, Math.min(ANTE_MAX, n)) });
                    }}
                    aria-label="Wager per player in Atlas Bucks"
                />
                <span className="mp-field__hint">
                    {(+config.ante || 0) === 0
                        ? `A friendly free match — no Atlas Bucks on the line. Up to ${ANTE_MAX.toLocaleString()} per player.`
                        : `Every player antes ${(+config.ante).toLocaleString()} on start. Winner takes the whole pot. Max ${ANTE_MAX.toLocaleString()}.`}
                </span>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Hub — host a new lobby or join one by code.
// ---------------------------------------------------------------------------
function Hub({ flagsData, onEnter, setView }) {
    const toast = useToast();
    const regions = useMemo(() => regionsOf(flagsData), [flagsData]);
    const currency = useCurrency();
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

            <div className="mp-wallet-chip" aria-label="Your Atlas Bucks">
                <AtlasBucksIcon size={16} />
                <span>{(currency.bucks || 0).toLocaleString()} Atlas Bucks</span>
            </div>

            <div className="auth-tabs">
                <button className={`auth-tab ${tab === 'host' ? 'is-active' : ''}`} onClick={() => setTab('host')}>Host</button>
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
    const ante = Math.max(0, +(lobby.config && lobby.config.ante) || 0);
    const meBucks = Math.max(0, +(lobby.meBucks) || 0);
    const canAffordAnte = ante === 0 || meBucks >= ante;
    const pot = ante * players.length;

    // Mirror the server's meBucks into the local currency store on each poll
    // so the topbar chip / shop preview stay accurate while in the lobby.
    useEffect(() => {
        if (typeof lobby.meBucks === 'number') setBucksLocal(lobby.meBucks);
    }, [lobby.meBucks]);

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
        // Non-host: tag the box so mobile CSS can fill the viewport and pin the
        // waiting block (spinner centered, "Waiting…" tethered to bottom).
        <div className={`quiz-box mp-box${isHost ? '' : ' mp-box--waiting'}`}>
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
                        {p.selectedTitle && (
                            <span className="mp-player__title">{p.selectedTitle}</span>
                        )}
                        {p.id === lobby.hostId && <Pill tone="accent" icon="star">Host</Pill>}
                    </div>
                ))}
            </div>
            <p className="auth-hint text-center">{players.length} / {lobby.config.maxPlayers} players</p>

            {ante > 0 && (
                <div className={`mp-pot ${canAffordAnte ? '' : 'mp-pot--broke'}`}>
                    <div className="mp-pot__row">
                        <span className="mp-pot__label">
                            <AtlasBucksIcon size={16} /> Wagering match
                        </span>
                        <span className="mp-pot__pot">
                            Pot: <strong>{pot.toLocaleString()}</strong>
                        </span>
                    </div>
                    <p className="mp-pot__hint">
                        Ante <strong>{ante.toLocaleString()}</strong> each — your balance: {meBucks.toLocaleString()}.
                        {!canAffordAnte && ' You can\'t cover the ante yet — earn more Atlas Bucks by playing.'}
                    </p>
                </div>
            )}

            {isHost ? (
                <>
                    <ConfigEditor config={lobby.config} regions={regions} onChange={pushConfig} />
                    <Button
                        variant="primary"
                        fullWidth
                        icon="play_arrow"
                        onClick={start}
                        disabled={busy || players.length < 2 || !canAffordAnte}
                    >
                        {players.length < 2
                            ? 'Need at least 2 players'
                            : !canAffordAnte
                                ? `Need ${ante.toLocaleString()} Atlas Bucks to ante`
                                : 'Start match'}
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
    const isGlobe = config.content === 'globe';
    const contentIcon = config.content === 'languages' ? 'translate' : isGlobe ? 'public' : 'flag';
    const contentLabel = config.content === 'languages'
        ? 'Languages'
        : (config.scope === 'all'
            ? (isGlobe ? 'All countries' : 'All flags')
            : titleCase(config.scope));
    return (
        <div className="mp-summary">
            <Pill tone="primary" icon={meta.icon}>{meta.title}</Pill>
            <Pill tone="info" icon={contentIcon}>{contentLabel}</Pill>
            {!isGlobe && (
                <Pill tone="neutral" icon={config.questionType === 'text' ? 'keyboard' : 'list'}>
                    {config.questionType === 'text' ? 'Free text' : 'Multiple choice'}
                </Pill>
            )}
            {isGlobe && (
                <Pill tone="neutral" icon="touch_app">Tap to place</Pill>
            )}
            <Pill tone="success" icon={config.mode === 'race' ? 'flag' : 'timer'}>
                {config.mode === 'race' ? `${config.target} to win` : `${config.duration}s`}
            </Pill>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Game — local question loop + live scoreboard. Posts progress to the server.
// ---------------------------------------------------------------------------
function Game({ lobby, code, flagsData, meId, watchers, lastReactionId }) {
    const audio = useAudio();
    const config = lobby.config;
    const isGlobe = config.content === 'globe';
    const [lang, setLang] = useState({ languages: null, phrases: null, loading: config.content === 'languages' });
    // Set of ISO-A2 codes the loaded globe can render. Until ready we can't
    // build a faithful pool, so the engine waits.
    const [globeIso2, setGlobeIso2] = useState(null);

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
        if (isGlobe && !globeIso2) return null;
        return makeEngine({
            config, seed: lobby.seed, flagsData,
            languagesData: lang.languages, phrasesData: lang.phrases,
            globeIso2,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [config.content, config.scope, config.questionType, lobby.seed, flagsData, lang.loading, globeIso2]);

    const [qIndex, setQIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);
    const [answered, setAnswered] = useState(false);
    const [chosen, setChosen] = useState(null);
    const [input, setInput] = useState('');
    const [selectedIso2, setSelectedIso2] = useState(null);
    const inputRef = useRef(null);
    const advanceTimer = useRef(null);
    // Globe mount lives directly in Game so it survives between questions; the
    // Game owns it and disposes on unmount. Wired with refs because the Globe's
    // callbacks fire from outside React.
    const globeContainerRef = useRef(null);
    const globeRef = useRef(null);
    const [globeReady, setGlobeReady] = useState(false);
    const [globeError, setGlobeError] = useState(null);
    const answeredRef = useRef(false);
    answeredRef.current = answered;
    const resolveGlobeRef = useRef(null);

    // Clock sync for timed modes + the 3-2-1 pre-match countdown.
    const offsetRef = useRef(0);
    useEffect(() => { if (lobby.serverNow) offsetRef.current = lobby.serverNow - Date.now(); }, [lobby.serverNow]);
    const [now, setNow] = useState(Date.now());
    useEffect(() => {
        // Tick whenever we either have a clock OR are still in the pre-match
        // countdown, so both the timer and the 3-2-1 overlay update smoothly.
        if (!lobby.endsAt && !lobby.playsAt) return undefined;
        const t = setInterval(() => setNow(Date.now()), 120);
        return () => clearInterval(t);
    }, [lobby.endsAt, lobby.playsAt]);
    const timeLeft = lobby.endsAt ? Math.max(0, Math.round((lobby.endsAt - (now + offsetRef.current)) / 1000)) : null;
    const timeUp = timeLeft === 0;
    // Pre-match countdown — clients gate answers until playsAt elapses so the
    // race starts on the same moment for everyone.
    const countdownMsLeft = lobby.playsAt ? Math.max(0, lobby.playsAt - (now + offsetRef.current)) : 0;
    const inCountdown = countdownMsLeft > 0;

    const question = useMemo(() => (engine ? engine.get(qIndex) : null), [engine, qIndex]);

    const post = useCallback((body) => { mp.progress(code, body).catch(() => {}); }, [code]);

    // Let the server know which question we're on so opponents can see our pick on
    // the matching question (and so we can see theirs).
    useEffect(() => { post({ qIndex }); }, [qIndex, post]);

    useEffect(() => () => { if (advanceTimer.current) clearTimeout(advanceTimer.current); }, []);
    useEffect(() => {
        if (!answered && config.questionType === 'text' && inputRef.current) inputRef.current.focus();
    }, [answered, qIndex, config.questionType]);

    // Mount the 3D globe once per match when playing Globe content. Callbacks
    // hit refs so the latest resolveGlobe is always used.
    useEffect(() => {
        if (!isGlobe) return undefined;
        if (!globeContainerRef.current) return undefined;
        const globe = new Globe(globeContainerRef.current, {
            onSelect: (iso2) => {
                if (answeredRef.current) return;
                setSelectedIso2(iso2 || null);
                audio.play('click');
                // Focus the country WITHOUT ever ejecting the player further
                // out than they already pinched in.
                if (iso2 && globeRef.current) globeRef.current.flyToIso2(iso2, { zoom: 4.6, noZoomOut: true });
            },
            onConfirm: (iso2) => {
                if (answeredRef.current) return;
                if (!iso2) return;
                resolveGlobeRef.current?.(iso2);
            },
            onReady: () => {
                if (!globeRef.current) return;
                setGlobeIso2(new Set(globeRef.current.getAvailableIso2().map((s) => s.toUpperCase())));
                setGlobeReady(true);
            },
            onError: (e) => {
                setGlobeError(e?.message || 'Failed to load the globe — check your connection.');
            },
        });
        globeRef.current = globe;
        globe.load();
        return () => {
            globe.dispose();
            globeRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isGlobe]);

    // Repaint when the theme toggles so the ocean/land tints follow.
    useEffect(() => {
        if (!isGlobe) return undefined;
        const observer = new MutationObserver(() => {
            if (globeRef.current) globeRef.current.applyTheme();
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
        return () => observer.disconnect();
    }, [isGlobe]);

    // Paint opponents' picks on the globe once the player has answered, so the
    // reveal shows where everyone placed without leaking the answer beforehand.
    // The server only reveals picks for the question the viewer is on, so a
    // pick we paint here is guaranteed to be for the current question. The
    // advanceTimer clearAllPaints() between questions wipes them.
    useEffect(() => {
        if (!isGlobe || !answered || !globeRef.current || !question || question.kind !== 'globe') return;
        const correctIso2 = (question.answerIso2 || '').toUpperCase();
        lobby.members.forEach((m) => {
            if (m.id === meId || !m.pick) return;
            const iso2 = String(m.pick).toUpperCase();
            // Skip painting opponents' picks that match the correct/own-wrong
            // tile — those already have a stronger feedback color.
            if (iso2 === correctIso2) return;
            globeRef.current.paintCountry(iso2, 'other');
        });
    }, [isGlobe, answered, lobby.members, question, meId]);

    const finished = lobby.state === 'finished' || timeUp;

    const handleResult = (correct, pick) => {
        if (answered || finished || inCountdown) return;
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
        // Globe placements need a longer reveal so the player can see where
        // they were supposed to click.
        const delay = isGlobe ? (correct ? 1100 : 2000) : (correct ? 650 : 1100);
        advanceTimer.current = setTimeout(() => {
            setAnswered(false); setChosen(null); setInput(''); setSelectedIso2(null);
            if (globeRef.current) {
                globeRef.current.clearAllPaints();
                globeRef.current.setLocked(null);
                globeRef.current.resetCamera();
            }
            setQIndex((i) => i + 1);
        }, delay);
    };

    const onChoice = (label) => {
        if (answered || finished || inCountdown) return;
        setChosen(label);
        handleResult(label === question.answer, label);
    };
    const onSubmit = (e) => {
        e.preventDefault();
        if (answered || finished || inCountdown || !input.trim()) return;
        handleResult(checkText(input, question, config.strict), null);
    };

    // Globe resolution: lock the camera, paint feedback, then advance.
    // Regular function (not useCallback) so it always sees the freshest
    // handleResult / score / streak; the Globe's onConfirm callback dispatches
    // via resolveGlobeRef which is reassigned on every render below.
    const resolveGlobe = (iso2) => {
        if (answeredRef.current || finished || inCountdown) return;
        if (!iso2 || !question || question.kind !== 'globe') return;
        const correct = checkGlobePick(iso2, question);
        if (globeRef.current) {
            globeRef.current.setLocked(correct ? 'correct' : 'wrong');
            if (correct) {
                globeRef.current.paintCountry(question.answerIso2, 'correct');
            } else {
                globeRef.current.paintCountry(iso2, 'wrong');
                globeRef.current.paintCountry(question.answerIso2, 'correct');
                globeRef.current.flyToIso2(question.answerIso2, { duration: 700, zoom: 4.6 });
            }
        }
        handleResult(correct, iso2);
    };
    resolveGlobeRef.current = resolveGlobe;

    const onGlobeConfirmButton = () => {
        if (!selectedIso2 || answered || finished) return;
        resolveGlobe(selectedIso2);
    };

    const choiceState = (opt) => {
        if (!answered) return 'idle';
        if (opt === question.answer) return 'correct';
        if (opt === chosen) return 'incorrect';
        return 'idle';
    };

    // Globe needs to mount its container *before* the engine is ready — the
    // engine waits on getAvailableIso2() to filter the pool. So when we're in
    // globe mode and the engine isn't built yet, render the stage with a
    // loading overlay rather than the generic loading box.
    if (!isGlobe && (!engine || !question)) {
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
                {lobby.pot > 0 && (
                    <Pill tone="success" className="ab-pill">
                        <AtlasBucksIcon size={14} /> Pot {lobby.pot.toLocaleString()}
                    </Pill>
                )}
                <SpectatorsBadge watchers={watchers} lastReactionId={lastReactionId} />
            </div>

            <Scoreboard members={lobby.members} meId={meId} mode={config.mode} target={config.target} />

            {isGlobe ? (
                <div className="mp-globe-stage" aria-label="World globe">
                    <div ref={globeContainerRef} className="mp-globe-canvas" />
                    {(!globeReady || !engine) && !globeError && (
                        <div className="globe-quiz__overlay">
                            <Spinner />
                            <span>Rendering the globe…</span>
                        </div>
                    )}
                    {globeError && (
                        <div className="globe-quiz__overlay globe-quiz__overlay--error">
                            <Icon name="public_off" />
                            <span>{globeError}</span>
                        </div>
                    )}
                    {question && question.kind === 'globe' && (
                        <motion.div
                            className="mp-globe-prompt"
                            key={`${qIndex}-globeprompt`}
                            initial={{ opacity: 0, y: 16, scale: 0.94 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className="mp-globe-prompt__tag">Find this country</div>
                            <img src={question.image} alt="Flag" className="mp-globe-prompt__flag" />
                            {answered && (
                                <div className="mp-globe-prompt__answer">{question.answer}</div>
                            )}
                        </motion.div>
                    )}
                </div>
            ) : (
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
            )}

            {isGlobe ? (
                <div className="mp-globe-actions">
                    <Button
                        variant="primary"
                        icon="check"
                        onClick={onGlobeConfirmButton}
                        disabled={answered || finished || !selectedIso2}
                    >
                        Confirm
                    </Button>
                    <span className="mp-globe-actions__hint">
                        <Icon name="touch_app" />
                        {selectedIso2 ? 'Tap Confirm or double-tap the country.' : 'Tap the country on the globe.'}
                    </span>
                </div>
            ) : config.questionType === 'mc' ? (
                <div className="options-box">
                    {question.options.map((opt, i) => {
                        // Opponents who picked this option for the question I'm on —
                        // only revealed once I've locked in my own answer.
                        const pickers = answered
                            ? lobby.members.filter((m) => m.id !== meId && m.pick === opt)
                            : [];
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

            {inCountdown && (
                <div className="mp-countdown" aria-live="polite">
                    <div className="mp-countdown__number" key={Math.ceil(countdownMsLeft / 1000)}>
                        {Math.ceil(countdownMsLeft / 1000)}
                    </div>
                    <div className="mp-countdown__label">Get ready…</div>
                </div>
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
    const { patchUser } = useAuth();
    const mode = lobby.config.mode;
    const metric = (m) => (mode === 'streak' ? m.bestStreak : m.score);
    const ranked = [...lobby.members].sort((a, b) => metric(b) - metric(a));
    const winner = lobby.members.find((m) => m.id === lobby.winnerId) || ranked[0];
    const iWon = winner && winner.id === meId;
    const payout = lobby.payout || null;

    useEffect(() => {
        audio.play(iWon ? 'levelUp' : 'gameOver');
        // Atlas Battle outcomes act on the (separate, revivable) battle-HP track.
        if (mode === 'battle') recordBattleResult(iWon);
        // Update the in-memory bucks balance so the topbar chip / next lobby
        // shows the payout immediately without an extra refresh round-trip.
        if (typeof lobby.meBucks === 'number') {
            patchUser({ bucks: lobby.meBucks });
            setBucksLocal(lobby.meBucks);
        }
        // A win bumps mp_wins server-side (see finish() in the multiplayer
        // route). Pull a fresh battlepass summary so the MP challenges update
        // immediately instead of waiting for the next pass-screen visit.
        if (iWon) refreshBattlepass();
        // Quests — every finished match counts toward mp_play; wins also toward mp_win.
        bumpQuestMetric('mp_play', 1);
        if (iWon) bumpQuestMetric('mp_win', 1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const rematch = async () => {
        try { setState(await mp.reset(code)); } catch (_) { /* host-only; ignore */ }
    };

    return (
        // Results screen — mobile CSS uses this modifier to fill the viewport and
        // pin the bottom .account-menu buttons to the bottom of the screen.
        <div className="quiz-box mp-box mp-box--results">
            <h2 className="text-center">{iWon ? 'You win! 🏆' : `${winner ? winner.username : 'Nobody'} wins!`}</h2>
            <Mascot size={120} mood={iWon ? 'cheer' : 'sad'} cosmetics={winner ? winner.cosmetics : null} />

            {payout && (payout.amount > 0 || payout.refunded) && (
                <div className={`mp-payout ${iWon ? 'mp-payout--won' : ''}`}>
                    <AtlasBucksIcon size={22} />
                    {payout.refunded ? (
                        <span>Match unresolved — refunded {payout.perPlayer.toLocaleString()} to each player.</span>
                    ) : iWon ? (
                        <span>You take the pot — <strong>+{payout.amount.toLocaleString()}</strong> Atlas Bucks!</span>
                    ) : (
                        <span>{winner ? winner.username : 'The winner'} takes <strong>{payout.amount.toLocaleString()}</strong> Atlas Bucks.</span>
                    )}
                </div>
            )}

            <div className="mp-scoreboard">
                {ranked.map((m, i) => (
                    <div key={m.id} className={`mp-score-row ${m.id === meId ? 'is-me' : ''}`}>
                        <span className="leaderboard-rank">#{i + 1}</span>
                        <Mascot size={28} mood="idle" cosmetics={m.cosmetics} still />
                        <span className="mp-score-name">
                            {m.username}
                            {m.selectedTitle && (
                                <span className="mp-score-title"> · {m.selectedTitle}</span>
                            )}
                        </span>
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

    // Heartbeat while we're in any lobby phase so friends see "in multiplayer"
    // on the Friends tab — the spectator endpoint reads live match state from
    // the lobby map directly, so no gameState payload is needed here.
    const { watchers, lastReactionId } = useQuizPresence(code ? 'multiplayer' : null, {}, code);

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
        return <Game lobby={lobby} code={code} flagsData={flagsData} meId={user.id} watchers={watchers} lastReactionId={lastReactionId} />;
    }
    return <LobbyRoom lobby={lobby} code={code} flagsData={flagsData} onLeave={leave} refresh={refresh} setState={setState} />;
}

export default MultiplayerScreen;
