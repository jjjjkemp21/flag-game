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
import AdminAnnounce from './components/AdminAnnounce';
import StoreScreen from './components/StoreScreen';
import TopBar from './components/TopBar';
import Spinner from './assets/illustrations/Spinner';
import { useAudio } from './audio/AudioProvider';
import { useAuth } from './auth/AuthProvider';
import { api } from './api/client';
import { applyStatsToFlags, zeroFlagStats, pushStats } from './lib/syncStats';
import { computeXp, readBonusScores } from './lib/xp';
import { setAuthed, loadBonus, resetBonus } from './lib/progress';
import { loadPet, resetPet, recordCorrect, recordIncorrect } from './lib/pet';
import { loadProfile, resetProfile } from './lib/profile';
import { variants } from './motion';

// Heavy bonus modes — lazy-loaded
const PixelatedQuiz    = lazy(() => import('./components/PixelatedQuiz'));
const FrenzyQuiz       = lazy(() => import('./components/FrenzyQuiz'));
const LongestRouteQuiz = lazy(() => import('./components/LongestRouteQuiz'));
const LanguageQuiz     = lazy(() => import('./components/LanguageQuiz'));

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
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
    const [strictSpelling, setStrictSpelling] = useState(() => localStorage.getItem('strictSpelling') === 'true');
    const [isLoading, setIsLoading] = useState(true);
    const [questionHistory, setQuestionHistory] = useState([]);
    const prefersReduced = useReducedMotion();
    const audio = useAudio();
    const { isAuthed, status, patchUser } = useAuth();

    // Refs let the save effect read the latest auth state without re-running on
    // login/logout (which would otherwise push before account progress loads).
    const authedRef = useRef(isAuthed);
    authedRef.current = isAuthed;
    const progressReadyRef = useRef(false);
    // Baseline answer counts so we can feed the pet by how much they grew.
    const answerTotalsRef = useRef({ correct: 0, incorrect: 0 });

    const updateQuestionHistory = useCallback((flagCode) => {
        setQuestionHistory(prev => [...prev.slice(-4), flagCode]);
    }, []);

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
            patchUser({ xp: computeXp(flagsData, readBonusScores()) });
        }
    }, [flagsData, isLoading, patchUser]);

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

    // Load the account's progress when logged in; clear it for guests / on logout.
    useEffect(() => {
        if (status === 'loading' || isLoading || flagsData.length === 0) return;
        let cancelled = false;

        (async () => {
            if (isAuthed) {
                setAuthed(true);
                try {
                    const remote = await api.get('/stats');
                    if (cancelled) return;
                    loadBonus(remote.bonusScores || {});
                    setFlagsData(prev => {
                        const next = applyStatsToFlags(zeroFlagStats(prev), remote.flagStats || []);
                        // Anchor the feed baseline so loading progress doesn't feed the pet.
                        answerTotalsRef.current = sumAnswers(next);
                        return next;
                    });
                    patchUser({ xp: computeXp(remote.flagStats || [], remote.bonusScores || {}) });
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
            } else {
                setAuthed(false);
                resetBonus();
                resetPet();
                resetProfile();
                answerTotalsRef.current = { correct: 0, incorrect: 0 };
                setFlagsData(prev => zeroFlagStats(prev));
            }
            if (!cancelled) progressReadyRef.current = true;
        })();

        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthed, status, isLoading]);

    const handleResetStats = () => {
        resetBonus();
        setFlagsData(prev => zeroFlagStats(prev));
        if (authedRef.current) {
            api.put('/stats', { flagStats: [], bonusScores: {} }).catch(() => {});
            patchUser({ xp: 0 });
        }
        setView('menu');
    };

    if (isLoading) {
        return (
            <div className="app-container">
                <div className="loading-box">
                    <Spinner size={56} />
                    <span>Loading Flag Quest…</span>
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
            questionHistory: questionHistory,
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
                return <Leaderboard setView={setView} />;
            case 'friends':
                return <Friends setView={setView} />;
            case 'admin':
                return <AdminAnnounce setView={setView} />;
            case 'store':
                return <StoreScreen setView={setView} flagsData={flagsData} />;
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
