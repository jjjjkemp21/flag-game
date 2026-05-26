import React, { useState, useEffect, useCallback, useRef, Suspense, lazy } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { select_next_flag } from './quiz_logic';
import MainMenu from './components/MainMenu';
import MultipleChoiceQuiz from './components/MultipleChoiceQuiz';
import FreeResponseQuiz from './components/FreeResponseQuiz';
import Settings from './components/Settings';
import QuizMenu from './components/QuizMenu';
import BonusMenu from './components/BonusMenu';
import AuthScreen from './components/AuthScreen';
import Leaderboard from './components/Leaderboard';
import Friends from './components/Friends';
import Achievements from './components/Achievements';
import AdminAnnounce from './components/AdminAnnounce';
import StoreScreen from './components/StoreScreen';
import StatsScreen from './components/StatsScreen';
import MultiplayerScreen from './components/MultiplayerScreen';
import BattlepassScreen from './components/BattlepassScreen';
import SpectatorScreen from './components/SpectatorScreen';
import TopBar from './components/TopBar';
import Spinner from './assets/illustrations/Spinner';
import { useAudio } from './audio/AudioProvider';
import { useAuth } from './auth/AuthProvider';
import { api } from './api/client';
import { applyStatsToFlags, zeroFlagStats, pushStats, flushStats } from './lib/syncStats';
import { computeXp, readBonusScores } from './lib/xp';
import { setAuthed, loadBonus, resetBonus, loadEarnedXp, resetEarnedXp } from './lib/progress';
import { loadPet, resetPet, recordCorrect, recordIncorrect, getPet } from './lib/pet';
import { loadProfile, resetProfile, setAchievementsUnlocked } from './lib/profile';
import { loadCurrency, resetCurrency } from './lib/currency';
import {
    loadBattlepass,
    resetBattlepass,
    setAuthed as setBpAuthed,
    flushBattlepass,
} from './lib/battlepass';
import { buildContext, evaluate } from './lib/achievements';
import { variants } from './motion';

// Heavy bonus modes — lazy-loaded
const PixelatedQuiz    = lazy(() => import('./components/PixelatedQuiz'));
const FrenzyQuiz       = lazy(() => import('./components/FrenzyQuiz'));
const LongestRouteQuiz = lazy(() => import('./components/LongestRouteQuiz'));
const LanguageQuiz     = lazy(() => import('./components/LanguageQuiz'));
// Globe mode pulls in Three.js + earcut; keep it out of the main bundle.
const GlobeQuiz        = lazy(() => import('./components/GlobeQuiz'));

const DATA_URL = './data/flags.json';

function sumAnswers(flags) {
    return (flags || []).reduce(
        (acc, f) => ({
            correct: acc.correct + (f.correct || 0),
            incorrect: acc.incorrect + (f.incorrect || 0),
        }),
        { correct: 0, incorrect: 0 }
    );
}

function LazyFallback({ label = 'Loading…' }) {
    return (
        <div className="loading-box">
            <Spinner />
            <span>{label}</span>
        </div>
    );
}

function App() {
    const [flagsData, setFlagsData] = useState([]);
    const [view, setView] = useState('menu');
    const [quizMode, setQuizMode] = useState(null);
    const [quizCategory, setQuizCategory] = useState({ type: 'all', value: null });
    // Which friend the user is currently spectating. Set when an Eye icon is
    // clicked in the Friends list; consumed by the 'spectator' view case.
    const [spectateTarget, setSpectateTarget] = useState(null);
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
    const [strictSpelling, setStrictSpelling] = useState(() => localStorage.getItem('strictSpelling') === 'true');
    const [isLoading, setIsLoading] = useState(true);
    // Question history rides on a ref so back-to-back picks see the freshest
    // value — relying on useState alone races against React's batched commit
    // and can let the same flag pop twice in a row.
    const questionHistoryRef = useRef([]);
    const prefersReduced = useReducedMotion();
    const audio = useAudio();
    const { isAuthed, status, patchUser } = useAuth();

    // Refs let the save effect read the latest auth state without re-running on
    // login/logout (which would otherwise push before account progress loads).
    const authedRef = useRef(isAuthed);
    authedRef.current = isAuthed;
    // Latest flagsData for the unload flush (which closes over a one-time effect).
    const flagsDataRef = useRef(flagsData);
    flagsDataRef.current = flagsData;
    const progressReadyRef = useRef(false);
    // Baseline answer counts so we can feed the pet by how much they grew.
    const answerTotalsRef = useRef({ correct: 0, incorrect: 0 });

    const updateQuestionHistory = useCallback((flagCode) => {
        questionHistoryRef.current = [...questionHistoryRef.current.slice(-4), flagCode];
    }, []);

    const getQuestionHistory = useCallback(() => questionHistoryRef.current, []);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        localStorage.setItem('strictSpelling', String(strictSpelling));
    }, [strictSpelling]);

    useEffect(() => {
        if (audio.isUnlocked) audio.play('transition', { volume: 0.5 });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [view]);

    // Load the flag catalog with zeroed progress. Progress itself is never read
    // from localStorage — it is tied to the account and loaded separately below.
    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch(DATA_URL);
            const freshData = await response.json();
            const initializedData = freshData.map(flag => ({
                ...flag,
                name: flag.country,
                file: `${flag.code.toLowerCase()}.svg`,
                aliases: flag.aliases || [],
                correct: 0,
                incorrect: 0,
                streak: 0,
                lapses: 0,
                isLeech: false,
                nextReview: null,
                lastAnswered: null,
                geoCorrect: 0,
                geoIncorrect: 0,
                geoStreak: 0,
                geoLapses: 0,
                geoLastAnswered: null,
                geoNextReview: null,
                geoIsLeech: false,
            }));
            setFlagsData(initializedData);
        } catch (error) {
            console.error("Failed to load flags data:", error);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Persist progress only for logged-in users; guests are intentionally
    // ephemeral. Guarded by progressReadyRef so we don't push before the
    // account's progress has finished loading on sign-in.
    useEffect(() => {
        if (isLoading || flagsData.length === 0) return;
        if (!progressReadyRef.current) return;
        if (authedRef.current) {
            pushStats(flagsData);
            patchUser({ xp: computeXp() });
        }
    }, [flagsData, isLoading, patchUser]);

    // Flush any pending progress when the tab is hidden or closed so a long
    // session's most recent answers / streak / XP aren't lost (a debounced push
    // would otherwise be dropped on unload, especially when backgrounded on mobile).
    useEffect(() => {
        const flush = () => {
            if (authedRef.current && progressReadyRef.current) flushStats(flagsDataRef.current);
            if (authedRef.current) flushBattlepass();
        };
        const onVisibility = () => { if (document.visibilityState === 'hidden') flush(); };
        window.addEventListener('pagehide', flush);
        document.addEventListener('visibilitychange', onVisibility);
        return () => {
            window.removeEventListener('pagehide', flush);
            document.removeEventListener('visibilitychange', onVisibility);
        };
    }, []);

    // Feed the pet by how much the answer counts grew (covers the standard quizzes,
    // which update flagsData). Suppressed until progress has loaded so loading an
    // account's history doesn't dump a feast on the pet.
    useEffect(() => {
        if (isLoading || flagsData.length === 0 || !progressReadyRef.current) return;
        const totals = sumAnswers(flagsData);
        const dCorrect = totals.correct - answerTotalsRef.current.correct;
        const dIncorrect = totals.incorrect - answerTotalsRef.current.incorrect;
        answerTotalsRef.current = totals;
        if (dCorrect > 0) recordCorrect(dCorrect);
        if (dIncorrect > 0) recordIncorrect(dIncorrect);
    }, [flagsData, isLoading]);

    // Recompute unlocked achievements from live stats (mastery / continents /
    // accuracy update right after standard quizzes). Bonus- and Atlas-level
    // ones also refresh whenever the player opens the Achievements screen.
    useEffect(() => {
        if (isLoading || flagsData.length === 0 || !progressReadyRef.current || !authedRef.current) return;
        const ctx = buildContext(flagsData, readBonusScores(), getPet().level);
        setAchievementsUnlocked(evaluate(ctx));
    }, [flagsData, isLoading]);

    // Load the account's progress when logged in; clear it for guests / on logout.
    useEffect(() => {
        if (status === 'loading' || isLoading || flagsData.length === 0) return;
        let cancelled = false;

        (async () => {
            if (isAuthed) {
                setAuthed(true);
                let loadedFlags = null;
                try {
                    const remote = await api.get('/stats');
                    if (cancelled) return;
                    loadBonus(remote.bonusScores || {});
                    loadEarnedXp(remote.earnedXp || 0);
                    loadedFlags = applyStatsToFlags(zeroFlagStats(flagsDataRef.current), remote.flagStats || []);
                    // Anchor the feed baseline so loading progress doesn't feed the pet.
                    answerTotalsRef.current = sumAnswers(loadedFlags);
                    setFlagsData(loadedFlags);
                    patchUser({ xp: computeXp() });
                } catch (_) {
                    /* leave zeroed progress if the load fails */
                }
                try {
                    const { pet } = await api.get('/pet');
                    if (!cancelled) loadPet(pet);
                } catch (_) {
                    /* pet stays at its default if the load fails */
                }
                try {
                    const prof = await api.get('/profile');
                    if (!cancelled) loadProfile(prof);
                } catch (_) {
                    /* profile stays at defaults if the load fails */
                }
                // Atlas Bucks balance + owned cosmetics — needed before the
                // shop screen renders so cards know "owned" vs "buy".
                if (!cancelled) {
                    try { await loadCurrency(); } catch (_) { /* shop will lazy-retry */ }
                }
                // Atlas Pass snapshot — challenge progress + claimed rewards.
                // Loaded after the rest so server-derived metrics (mp_wins,
                // bonus high scores) reflect everything else we just synced.
                if (!cancelled) {
                    setBpAuthed(true);
                    try { await loadBattlepass(); } catch (_) { /* pass screen will lazy-retry */ }
                }
                // Recompute unlocked achievements from the just-loaded progress so the
                // account's count + showcase are correct. Without this they stay at the
                // load-time defaults (unlocked=[]) and a later cosmetic-only persist
                // would wipe the stored achievements to 0.
                if (!cancelled && loadedFlags) {
                    const ctx = buildContext(loadedFlags, readBonusScores(), getPet().level);
                    setAchievementsUnlocked(evaluate(ctx));
                }
            } else {
                setAuthed(false);
                setBpAuthed(false);
                resetBonus();
                resetEarnedXp();
                resetPet();
                resetProfile();
                resetCurrency();
                resetBattlepass();
                answerTotalsRef.current = { correct: 0, incorrect: 0 };
                setFlagsData(prev => zeroFlagStats(prev));
            }
            if (!cancelled) progressReadyRef.current = true;
        })();

        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthed, status, isLoading]);

    const handleResetStats = async () => {
        // Local zero first so the UI doesn't flash old numbers while the network
        // round-trip lands. Refs are anchored so the pet-feed effect doesn't
        // interpret the zeroing as a wave of incorrect answers.
        resetBonus();
        resetEarnedXp();
        answerTotalsRef.current = { correct: 0, incorrect: 0 };
        setFlagsData(prev => zeroFlagStats(prev));
        // Clear per-mode current + best run streaks (the streak store reads
        // these straight from localStorage so the keys must go).
        try {
            localStorage.removeItem('flagGameStreaks');
            localStorage.removeItem('flagGameBestStreaks');
        } catch (_) { /* private mode etc. */ }

        if (authedRef.current) {
            // Server-side full wipe — clears stats, bonus, earned/cached XP,
            // streaks, pet (json + level), cosmetics, achievements, region,
            // mp_wins, and any selected title. Keeps identity + recovery rows.
            try { await api.post('/stats/reset'); } catch (_) { /* offline — local wipe still applies */ }
            patchUser({ xp: 0 });
            // Re-hydrate the account-tied stores from the now-empty server state.
            // loadPet / loadProfile flip authed back on (resetPet/resetProfile
            // turn it off) so future changes persist again.
            try {
                const { pet } = await api.get('/pet');
                loadPet(pet);
            } catch (_) { resetPet(); }
            try {
                const prof = await api.get('/profile');
                loadProfile(prof);
            } catch (_) { resetProfile(); }
        } else {
            // Guests: clear the in-memory pet + profile (never persisted).
            resetPet();
            resetProfile();
        }
        setView('menu');
    };

    if (isLoading) {
        return (
            <div className="app-container">
                <div className="loading-box">
                    <Spinner size={56} />
                    <span>Loading Flag Game…</span>
                </div>
            </div>
        );
    }

    const renderView = () => {
        const getFilteredFlags = () => {
            const now = Date.now();
            if (quizCategory.type === 'all') {
                return flagsData;
            }
            if (quizCategory.type === 'review') {
                return flagsData.filter(f => f.nextReview !== null && f.nextReview <= now);
            }
            return flagsData.filter(flag =>
                flag.tags.includes(`${quizCategory.type}:${quizCategory.value}`)
            );
        };

        const quizProps = {
            allFlagsData: flagsData,
            setFlagsData: setFlagsData,
            selectNextFlag: select_next_flag,
            setView: setView,
            setQuizCategory: setQuizCategory,
            quizCategory: quizCategory,
            quizMode: quizMode,
            getQuestionHistory: getQuestionHistory,
            updateQuestionHistory: updateQuestionHistory,
        };

        switch (view) {
            case 'quiz-menu':
                return <QuizMenu setView={setView} setQuizCategory={setQuizCategory} flagsData={flagsData} quizMode={quizMode} />;
            case 'multiple-choice':
            case 'free-response': {
                const quizFlags = getFilteredFlags();
                if (view === 'multiple-choice') {
                    return <MultipleChoiceQuiz {...quizProps} quizFlags={quizFlags} />;
                }
                return <FreeResponseQuiz {...quizProps} quizFlags={quizFlags} strictSpelling={strictSpelling} />;
            }
            case 'mirror':
            case 'flash':
                // Bonus-menu variants of MC: full flag pool, no category picker.
                // `variant` switches the visual transform inside MultipleChoiceQuiz.
                return (
                    <MultipleChoiceQuiz
                        {...quizProps}
                        quizFlags={flagsData}
                        quizCategory={{ type: 'all', value: null }}
                        variant={view}
                    />
                );
            case 'reverse-mc':
                // Country-name prompt, flag thumbnails as the answers.
                return (
                    <MultipleChoiceQuiz
                        {...quizProps}
                        quizFlags={flagsData}
                        quizCategory={{ type: 'all', value: null }}
                        variant="reverse"
                    />
                );
            case 'globe': {
                const quizFlags = getFilteredFlags();
                return (
                    <Suspense fallback={<LazyFallback label="Loading Globe…" />}>
                        <GlobeQuiz {...quizProps} quizFlags={quizFlags} strictSpelling={strictSpelling} />
                    </Suspense>
                );
            }
            case 'pixelated-quiz':
                return (
                    <Suspense fallback={<LazyFallback label="Loading Pixelated…" />}>
                        <PixelatedQuiz allFlagsData={flagsData} setView={setView} />
                    </Suspense>
                );
            case 'frenzy-quiz':
                return (
                    <Suspense fallback={<LazyFallback label="Loading Frenzy…" />}>
                        <FrenzyQuiz allFlagsData={flagsData} setView={setView} />
                    </Suspense>
                );
            case 'longest-route-quiz':
                return (
                    <Suspense fallback={<LazyFallback label="Loading Longest Route…" />}>
                        <LongestRouteQuiz allFlagsData={flagsData} setView={setView} />
                    </Suspense>
                );
            case 'language-quiz':
                return (
                    <Suspense fallback={<LazyFallback label="Loading Language Quiz…" />}>
                        <LanguageQuiz setView={setView} />
                    </Suspense>
                );
            case 'bonus-menu':
                return <BonusMenu setView={setView} />;
            case 'login':
                return <AuthScreen setView={setView} />;
            case 'leaderboard':
                return <Leaderboard setView={setView} flagsData={flagsData} />;
            case 'friends':
                return <Friends setView={setView} setSpectateTarget={setSpectateTarget} />;
            case 'spectator':
                return <SpectatorScreen targetId={spectateTarget} setView={setView} />;
            case 'achievements':
                return <Achievements setView={setView} flagsData={flagsData} />;
            case 'admin':
                return <AdminAnnounce setView={setView} />;
            case 'store':
                return <StoreScreen setView={setView} flagsData={flagsData} />;
            case 'statistics':
                return <StatsScreen setView={setView} flagsData={flagsData} />;
            case 'multiplayer':
                return <MultiplayerScreen setView={setView} flagsData={flagsData} />;
            case 'battlepass':
                return <BattlepassScreen setView={setView} />;
            case 'settings':
                return (
                    <Settings
                        theme={theme}
                        setTheme={setTheme}
                        strictSpelling={strictSpelling}
                        setStrictSpelling={setStrictSpelling}
                        onResetStats={handleResetStats}
                        setView={setView}
                    />
                );
            case 'menu':
            default:
                return <MainMenu setView={setView} flagsData={flagsData} setQuizMode={setQuizMode} />;
        }
    };

    const containerClassName = view === 'frenzy-quiz' ? "app-container-fullwidth" : "app-container";
    const motionVariants = prefersReduced ? variants.fadeOnly : variants.page;

    return (
        <div className={containerClassName}>
            <TopBar setView={setView} />
            <AnimatePresence mode="wait" initial={false}>
                <motion.div
                    key={view}
                    variants={motionVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-lg)' }}
                >
                    {renderView()}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

export default App;
