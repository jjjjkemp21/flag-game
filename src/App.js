import React, { useState, useEffect, useCallback, useRef, Suspense, lazy } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { select_next_flag } from './quiz_logic';
import { setKnownAnswers } from './answer_check';
import MainMenu from './components/menu/MainMenu';
import MultipleChoiceQuiz from './components/quizzes/MultipleChoiceQuiz';
import FreeResponseQuiz from './components/quizzes/FreeResponseQuiz';
import Settings from './components/profile/Settings';
import QuizMenu from './components/quizzes/QuizMenu';
import BonusMenu from './components/quizzes/BonusMenu';
import AuthScreen from './components/profile/AuthScreen';
import Leaderboard from './components/social/Leaderboard';
import Friends from './components/social/Friends';
import Achievements from './components/profile/Achievements';
import AdminAnnounce from './components/profile/AdminAnnounce';
import StoreScreen from './components/economy/StoreScreen';
import MigrationV2Modal from './components/economy/MigrationV2Modal';
import LoginChestModal from './components/economy/LoginChestModal';
import QuestCompleteModal from './components/economy/QuestCompleteModal';
import QuestsScreen from './components/economy/QuestsScreen';
import StatsScreen from './components/profile/StatsScreen';
import MultiplayerScreen from './components/social/MultiplayerScreen';
import BattlepassScreen from './components/economy/BattlepassScreen';
import SpectatorScreen from './components/social/SpectatorScreen';
import TopBar from './components/menu/TopBar';
import Onboarding from './components/onboarding/Onboarding';
import Spinner from './assets/illustrations/Spinner';
import { useAudio } from './audio/AudioProvider';
import { useAuth } from './auth/AuthProvider';
import { api } from './api/client';
import { applyStatsToFlags, zeroFlagStats, pushStats, flushStats, updateMasteredCount } from './lib/syncStats';
import { computeXp, readBonusScores, MASTERY_STREAK } from './lib/xp';
import { setAuthed, loadBonus, resetBonus, loadEarnedXp, resetEarnedXp, getEarnedXp } from './lib/progress';
import { loadPet, resetPet, recordCorrect, recordIncorrect, getPet } from './lib/pet';
import { loadProfile, resetProfile, setAchievementsUnlocked } from './lib/profile';
import { loadCurrency, resetCurrency } from './lib/currency';
import { loadLoginChest, resetLoginChest } from './lib/loginChest';
import {
    loadQuests,
    resetQuests,
    setAuthed as setQuestsAuthed,
    flushQuests,
} from './lib/quests';
import {
    loadBattlepass,
    resetBattlepass,
    setAuthed as setBpAuthed,
    flushBattlepass,
} from './lib/battlepass';
import { buildContext, evaluate } from './lib/achievements';
import {
    ensureCapitalsCatalog,
    loadCapitals,
    resetCapitals,
    flushCapitals,
    setCapitalsAuthed,
} from './lib/capitals';
import { variants } from './motion/index';

// Heavy bonus modes — lazy-loaded
const PixelatedQuiz    = lazy(() => import('./components/quizzes/PixelatedQuiz'));
const FrenzyQuiz       = lazy(() => import('./components/quizzes/FrenzyQuiz'));
const LongestRouteQuiz = lazy(() => import('./components/quizzes/LongestRouteQuiz'));
const LanguageQuiz     = lazy(() => import('./components/quizzes/LanguageQuiz'));
const CapitalsQuiz     = lazy(() => import('./components/quizzes/CapitalsQuiz'));
// Globe mode pulls in Three.js + earcut; keep it out of the main bundle.
const GlobeQuiz        = lazy(() => import('./components/quizzes/GlobeQuiz'));

const DATA_URL = './data/flags.json';

// First-run tour is shown once per device (brand-new accounts only).
const TUTORIAL_SEEN_KEY = 'flagGameTutorialSeen';
// Flags mastered before the Reptile Kingdom Pass becomes reachable. Mirrors
// MASTERY_GATE in server/routes/battlepass.js and PASS_MASTERY_GATE in MainMenu.
const PASS_MASTERY_GATE = 20;

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
    const [tutorialActive, setTutorialActive] = useState(false);
    // Which friend the user is currently spectating. Set when an Eye icon is
    // clicked in the Friends list; consumed by the 'spectator' view case.
    const [spectateTarget, setSpectateTarget] = useState(null);
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
    const [strictSpelling, setStrictSpelling] = useState(() => localStorage.getItem('strictSpelling') === 'true');
    // Whether dependent territories / subnational flags are eligible for the quiz
    // decks. Off by default — most players want the ~195 sovereign states first.
    // Device-global like the other UI prefs (never tied to the account).
    const [includeTerritories, setIncludeTerritories] = useState(() => localStorage.getItem('includeTerritories') === 'true');
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
        localStorage.setItem('includeTerritories', String(includeTerritories));
    }, [includeTerritories]);

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
            // Register every country name + alias so the fuzzy answer matcher
            // can reject a guess that exactly spells a DIFFERENT country.
            setKnownAnswers(
                initializedData.flatMap((f) => [f.name, ...(f.aliases || [])])
            );
            setFlagsData(initializedData);
        } catch (error) {
            console.error("Failed to load flags data:", error);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Warm the Capitals catalog (capitals.json joined to flags.json) so the
    // home-screen mastery badge can show "N/total" without mounting the quiz.
    useEffect(() => {
        ensureCapitalsCatalog();
    }, []);

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

    // Keep the live flag-mastery count cached for the end-of-run chest yield.
    // Bonus modes (e.g. Language) don't carry the full flag list, so they read
    // this global instead. Recomputed on every progress change — including the
    // logout zeroing, which drops it back to 0.
    useEffect(() => {
        updateMasteredCount(flagsData);
    }, [flagsData]);

    // Defense-in-depth gate: the Reptile Kingdom Pass card is hidden below the
    // mastery gate, but the 'battlepass' view is still reachable programmatically.
    // If anything routes there before the player has earned it, bounce home (the
    // server also refuses every claim/buy below the gate).
    useEffect(() => {
        if (view !== 'battlepass') return;
        const mastered = flagsData.filter(f => (f.streak || 0) > MASTERY_STREAK).length;
        if (mastered < PASS_MASTERY_GATE) setView('menu');
    }, [view, flagsData]);

    // Flush any pending progress when the tab is hidden or closed so a long
    // session's most recent answers / streak / XP aren't lost (a debounced push
    // would otherwise be dropped on unload, especially when backgrounded on mobile).
    useEffect(() => {
        const flush = () => {
            if (authedRef.current && progressReadyRef.current) flushStats(flagsDataRef.current);
            if (authedRef.current) flushBattlepass();
            if (authedRef.current) flushQuests();
            if (authedRef.current) flushCapitals();
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
        const ctx = buildContext(flagsData, readBonusScores(), getPet().level, getEarnedXp());
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
                // Daily login chest — rolled on first request of a new UTC day.
                // Loaded after currency so the modal's onClose claim path sees
                // the freshest bucks balance.
                if (!cancelled) {
                    try { await loadLoginChest(); } catch (_) { /* modal will lazy-retry */ }
                }
                // Quests — daily (3) + weekly (2) rotating Bucks quests. Set
                // authed before load so the in-flight metric bumps that may
                // arrive during play schedule a flush.
                if (!cancelled) {
                    setQuestsAuthed(true);
                    try { await loadQuests(); } catch (_) { /* screen will lazy-retry */ }
                }
                // Atlas Pass snapshot — challenge progress + claimed rewards.
                // Loaded after the rest so server-derived metrics (mp_wins,
                // bonus high scores) reflect everything else we just synced.
                if (!cancelled) {
                    setBpAuthed(true);
                    try { await loadBattlepass(); } catch (_) { /* pass screen will lazy-retry */ }
                }
                // Capitals mastery — its own per-capital progress track.
                if (!cancelled) {
                    setCapitalsAuthed(true);
                    try { const c = await api.get('/capitals'); loadCapitals(c.stats); } catch (_) { /* mode will lazy-retry */ }
                }
                // Recompute unlocked achievements from the just-loaded progress so the
                // account's count + showcase are correct. Without this they stay at the
                // load-time defaults (unlocked=[]) and a later cosmetic-only persist
                // would wipe the stored achievements to 0.
                if (!cancelled && loadedFlags) {
                    const ctx = buildContext(loadedFlags, readBonusScores(), getPet().level, getEarnedXp());
                    setAchievementsUnlocked(evaluate(ctx));
                }
                // First-run interactive tour — only for a brand-new account (no XP
                // earned and nothing ever answered), shown once per device. Computed
                // from the just-loaded progress so it reflects real account state, not
                // the zeroed defaults. Sending the player home guarantees the menu is
                // mounted beneath the tour's home-screen coach-marks.
                if (!cancelled && loadedFlags) {
                    try {
                        const ans = sumAnswers(loadedFlags);
                        const brandNew = computeXp() === 0 && (ans.correct + ans.incorrect) === 0;
                        if (brandNew && !localStorage.getItem(TUTORIAL_SEEN_KEY)) {
                            setView('menu');
                            setTutorialActive(true);
                        }
                    } catch (_) { /* localStorage blocked (private mode) — skip the tour */ }
                }
            } else {
                setAuthed(false);
                setBpAuthed(false);
                // The tour is for authed newcomers; never leave it hanging over a
                // guest session (e.g. if they log out mid-tour).
                setTutorialActive(false);
                resetBonus();
                resetEarnedXp();
                resetPet();
                resetProfile();
                resetCurrency();
                resetLoginChest();
                setQuestsAuthed(false);
                resetQuests();
                resetBattlepass();
                setCapitalsAuthed(false);
                resetCapitals();
                answerTotalsRef.current = { correct: 0, incorrect: 0 };
                // Run/best streaks live in device-global localStorage; clear them
                // on logout/guest so one account's streaks don't bleed into the
                // next user on a shared browser (and inflate their XP multiplier).
                try {
                    localStorage.removeItem('flagGameStreaks');
                    localStorage.removeItem('flagGameBestStreaks');
                } catch (_) { /* private mode etc. */ }
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
            // Server-side wipe clears flag stats, streaks, pet (json + level),
            // cosmetics, achievements, region, mp_wins, and any selected title —
            // but INTENTIONALLY PRESERVES earned XP and bonus high scores ("a
            // reward you keep"). Keeps identity + recovery rows.
            try { await api.post('/stats/reset'); } catch (_) { /* offline — local wipe still applies */ }
            // Re-hydrate XP/bonus from the server's preserved values; otherwise
            // the local zero above would be pushed back and clobber them on the
            // next sync (silent data loss of the kept reward).
            try {
                const remote = await api.get('/stats');
                loadEarnedXp(remote.earnedXp || 0);
                loadBonus(remote.bonusScores || {});
            } catch (_) { /* keep local zero if the re-fetch fails */ }
            patchUser({ xp: computeXp() });
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
            // Wipe capital mastery too (the /stats/reset above already NULLs the
            // column server-side; clear the in-memory store to match).
            loadCapitals({});
        } else {
            // Guests: clear the in-memory pet + profile (never persisted).
            resetPet();
            resetProfile();
            resetCapitals();
        }
        setView('menu');
    };

    // Close the tour and remember it was seen (per device).
    const dismissTutorial = useCallback(() => {
        setTutorialActive(false);
        try { localStorage.setItem(TUTORIAL_SEEN_KEY, '1'); } catch (_) { /* private mode */ }
    }, []);

    // Replay from Settings — go home so the home-screen coach-marks have targets.
    const startTutorial = useCallback(() => {
        setView('menu');
        setTutorialActive(true);
    }, []);

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
        // Quiz decks draw from the "playable" set, which drops dependent
        // territories / subnational flags unless the player opts in (Settings).
        // The FULL flagsData is still used everywhere progress is measured
        // (stats, achievements, mastery totals) so the toggle never rewrites
        // history — it only narrows what gets asked.
        const playableFlags = includeTerritories
            ? flagsData
            : flagsData.filter(f => !(f.tags || []).includes('region:territory'));

        const getFilteredFlags = () => {
            const now = Date.now();
            // An explicit "Territories" region pick overrides the global toggle
            // (the player asked for them) and reads from the full catalog.
            const isTerritoryPick = quizCategory.type === 'region' && quizCategory.value === 'territory';
            const base = isTerritoryPick ? flagsData : playableFlags;
            if (quizCategory.type === 'all') {
                return base;
            }
            if (quizCategory.type === 'review') {
                // Globe maintains its own geo review schedule; mirror the
                // mode-aware count QuizMenu advertises so the launched deck
                // matches the tile (use loose != null since geoNextReview is
                // lazily added and may be undefined on untouched flags).
                const dueField = view === 'globe' ? 'geoNextReview' : 'nextReview';
                return base.filter(f => f[dueField] != null && f[dueField] <= now);
            }
            return base.filter(flag =>
                flag.tags.includes(`${quizCategory.type}:${quizCategory.value}`)
            );
        };

        const quizProps = {
            allFlagsData: flagsData,
            // Distractors (wrong MC options) are drawn from the playable set so
            // territories don't sneak in as answers when the toggle is off,
            // while allFlagsData stays full for stat writes + name lookups.
            distractorPool: playableFlags,
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
                return <QuizMenu setView={setView} setQuizCategory={setQuizCategory} flagsData={playableFlags} quizMode={quizMode} />;
            case 'multiple-choice':
            case 'free-response': {
                const quizFlags = getFilteredFlags();
                if (view === 'multiple-choice') {
                    return <MultipleChoiceQuiz {...quizProps} quizFlags={quizFlags} />;
                }
                return <FreeResponseQuiz {...quizProps} quizFlags={quizFlags} strictSpelling={strictSpelling} />;
            }
            case 'flash':
                // Bonus-menu variant of MC: full flag pool, no category picker.
                // `variant` switches the visual transform inside MultipleChoiceQuiz.
                return (
                    <MultipleChoiceQuiz
                        {...quizProps}
                        quizFlags={playableFlags}
                        quizCategory={{ type: 'all', value: null }}
                        variant={view}
                    />
                );
            case 'reverse-mc':
                // Country-name prompt, flag thumbnails as the answers.
                return (
                    <MultipleChoiceQuiz
                        {...quizProps}
                        quizFlags={playableFlags}
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
                        <PixelatedQuiz allFlagsData={playableFlags} setView={setView} strictSpelling={strictSpelling} />
                    </Suspense>
                );
            case 'frenzy-quiz':
                return (
                    <Suspense fallback={<LazyFallback label="Loading Frenzy…" />}>
                        <FrenzyQuiz allFlagsData={playableFlags} setView={setView} strictSpelling={strictSpelling} />
                    </Suspense>
                );
            case 'longest-route-quiz':
                return (
                    <Suspense fallback={<LazyFallback label="Loading Longest Route…" />}>
                        <LongestRouteQuiz allFlagsData={flagsData} setView={setView} strictSpelling={strictSpelling} includeTerritories={includeTerritories} />
                    </Suspense>
                );
            case 'language-quiz':
                return (
                    <Suspense fallback={<LazyFallback label="Loading Language Quiz…" />}>
                        <LanguageQuiz setView={setView} />
                    </Suspense>
                );
            case 'capitals-quiz':
                return (
                    <Suspense fallback={<LazyFallback label="Loading Capitals Quiz…" />}>
                        <CapitalsQuiz setView={setView} includeTerritories={includeTerritories} />
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
            case 'quests':
                return <QuestsScreen setView={setView} />;
            case 'settings':
                return (
                    <Settings
                        theme={theme}
                        setTheme={setTheme}
                        strictSpelling={strictSpelling}
                        setStrictSpelling={setStrictSpelling}
                        includeTerritories={includeTerritories}
                        setIncludeTerritories={setIncludeTerritories}
                        onResetStats={handleResetStats}
                        onReplayTutorial={startTutorial}
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
            <TopBar setView={setView} view={view} />
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
            <MigrationV2Modal />
            <LoginChestModal />
            <QuestCompleteModal />
            {tutorialActive && <Onboarding onClose={dismissTutorial} />}
        </div>
    );
}

export default App;
