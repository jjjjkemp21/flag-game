import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { select_next_flag, update_geo_stats } from '../quiz_logic';
import Icon from './Icon';
import { Button, ScoreBubble } from './ui';
import Confetti from '../assets/illustrations/Confetti';
import Mascot from '../assets/illustrations/Mascot';
import Spinner from '../assets/illustrations/Spinner';
import { useAudio } from '../audio/AudioProvider';
import { useProfile, recordBestStreak } from '../lib/profile';
import { awardForAnswer, penaltyForAnswer, streakMultiplier, MASTERY_STREAK } from '../lib/xp';
import { addEarnedXp } from '../lib/progress';
import { getStreak, saveStreak, resetStreak } from '../lib/streak';
import Globe from '../lib/globe/Globe';
import { springs } from '../motion';

const MODE = 'globe';
const IMAGE_BASE_URL = './assets/flags/';
const NEXT_DELAY_MS = 2400;
const HINT_XP_MULTIPLIER = 0.5;

// Rough geographic centers per continent. Used by the Hint button — rotating
// to the continent centroid steers the player toward the right region without
// pointing at the actual country. Keys match the `region:` tag values in
// public/data/flags.json.
const CONTINENT_CENTERS = {
    africa:        { lat:   0, lon:  20, label: 'Africa' },
    europe:        { lat:  52, lon:  15, label: 'Europe' },
    asia:          { lat:  45, lon:  95, label: 'Asia' },
    north_america: { lat:  45, lon: -100, label: 'North America' },
    south_america: { lat: -15, lon: -60, label: 'South America' },
    oceania:       { lat: -25, lon: 140, label: 'Oceania' },
};

// Single-question Globe-mode quiz screen. The Three.js scene lives in a ref —
// React just owns the surrounding HUD, the question state, and the timing.
function GlobeQuiz({
    allFlagsData,
    quizFlags,
    setFlagsData,
    setView,
    setQuizCategory,
    getQuestionHistory,
    updateQuestionHistory,
}) {
    const audio = useAudio();
    const profile = useProfile();

    const containerRef = useRef(null);
    const globeRef = useRef(null);
    const eligibleFlagsRef = useRef([]);          // quiz pool filtered to flags whose code maps to a globe country
    const currentFlagRef = useRef(null);          // mirror of `currentFlag` for callbacks
    const answeredRef = useRef(false);
    const nextTimerRef = useRef(null);
    // The Globe's onSelect/onConfirm callbacks are wired exactly once at mount,
    // so they'd otherwise capture stale `resolveAnswer` (which closes over the
    // current `streak`, `allFlagsData`, etc.). Bounce through a ref so each tap
    // calls the freshest version.
    const resolveAnswerRef = useRef(null);

    const [globeReady, setGlobeReady] = useState(false);
    const [globeError, setGlobeError] = useState(null);
    const [currentFlag, setCurrentFlag] = useState(null);
    const [selectedIso2, setSelectedIso2] = useState(null);
    const [answered, setAnswered] = useState(false);
    const [feedback, setFeedback] = useState({ text: ' ' });
    const [flashColor, setFlashColor] = useState(null);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(() => getStreak(MODE));
    const [xpGain, setXpGain] = useState(null);
    const [showConfetti, setShowConfetti] = useState(false);
    const [hintUsed, setHintUsed] = useState(false);
    const [hintLabel, setHintLabel] = useState(null);
    // Ref mirror so resolveAnswer (memoised before hintUsed is in scope above
    // it) sees the latest value without depending on state in the deps array.
    const hintUsedRef = useRef(false);
    hintUsedRef.current = hintUsed;

    currentFlagRef.current = currentFlag;
    answeredRef.current = answered;
    // resolveAnswerRef is assigned below once resolveAnswer is defined.

    const handleBack = useCallback(() => {
        if (nextTimerRef.current) clearTimeout(nextTimerRef.current);
        setView('quiz-menu');
        setQuizCategory({ type: 'all', value: null });
    }, [setView, setQuizCategory]);

    const pickNextQuestion = useCallback(() => {
        const pool = eligibleFlagsRef.current;
        if (!pool || pool.length === 0) {
            setCurrentFlag(null);
            return;
        }
        const next = select_next_flag(pool, getQuestionHistory(), 'geo');
        if (!next) {
            setCurrentFlag(null);
            return;
        }
        updateQuestionHistory(next.code);
        setCurrentFlag(next);
        setSelectedIso2(null);
        setAnswered(false);
        setFeedback({ text: ' ' });
        setFlashColor(null);
        setXpGain(null);
        setShowConfetti(false);
        setHintUsed(false);
        setHintLabel(null);
        if (globeRef.current) {
            globeRef.current.clearAllPaints();
            globeRef.current.setLocked(null);
            // Zoom back out so the player has the full globe to search.
            globeRef.current.resetCamera();
        }
    }, [getQuestionHistory, updateQuestionHistory]);

    const resolveAnswer = useCallback((guessIso2) => {
        const flag = currentFlagRef.current;
        if (!flag || answeredRef.current) return;
        const wasCorrect = (guessIso2 || '').toUpperCase() === (flag.code || '').toUpperCase();
        setAnswered(true);
        setFlashColor(wasCorrect ? 'correct' : 'incorrect');

        const beforeStreak = flag.geoStreak || 0;
        const { message, color, updatedFlags } = update_geo_stats(allFlagsData, flag, wasCorrect);
        setFlagsData(updatedFlags);
        setFeedback({ text: message.text, answer: message.answer, tone: color });
        const after = updatedFlags.find((f) => f.code === flag.code);
        const afterStreak = after ? (after.geoStreak || 0) : beforeStreak;

        if (globeRef.current) {
            globeRef.current.setLocked(wasCorrect ? 'correct' : 'wrong');
            if (wasCorrect) {
                globeRef.current.paintCountry(flag.code, 'correct');
            } else {
                if (guessIso2) globeRef.current.paintCountry(guessIso2, 'wrong');
                globeRef.current.paintCountry(flag.code, 'correct');
                // Slide the correct country into view so the player can SEE
                // where they were supposed to click. Keep the focus zoom so
                // the reveal lands prominently.
                globeRef.current.flyToIso2(flag.code, { duration: 700, zoom: 4.6 });
            }
        }

        if (wasCorrect) {
            audio.play('correct');
            setScore(s => s + 1);
            const next = streak + 1;
            if (next === 3 || next === 5 || next === 10) audio.play('streak');
            setStreak(next);
            saveStreak(MODE, next);
            recordBestStreak(MODE, next);
            // Pretend flag's `correct` field is the geoCorrect for the XP scaler
            // so brand-new geography wins land the biggest reward.
            const xpFlag = { correct: beforeStreak === 0 ? 0 : 1, streak: beforeStreak };
            const base = awardForAnswer(xpFlag, MODE, next);
            // Half XP if the hint was used on this question — keeps Hint a
            // helpful escape hatch without negating the achievement.
            const amount = hintUsedRef.current
                ? Math.max(1, Math.round(base.amount * HINT_XP_MULTIPLIER))
                : base.amount;
            const award = { ...base, amount, hinted: hintUsedRef.current };
            addEarnedXp(award.amount);
            setXpGain(award);
            setShowConfetti(true);
            if (beforeStreak <= MASTERY_STREAK && afterStreak > MASTERY_STREAK) audio.play('levelUp');
        } else {
            audio.play('incorrect');
            setStreak(0);
            resetStreak(MODE);
            const penalty = penaltyForAnswer(MODE);
            addEarnedXp(-penalty);
            setXpGain({ amount: -penalty });
        }

        if (nextTimerRef.current) clearTimeout(nextTimerRef.current);
        nextTimerRef.current = setTimeout(() => {
            pickNextQuestion();
        }, NEXT_DELAY_MS);
    }, [allFlagsData, setFlagsData, audio, streak, pickNextQuestion]);

    resolveAnswerRef.current = resolveAnswer;

    // Mount the globe once.
    useEffect(() => {
        if (!containerRef.current) return;
        const globe = new Globe(containerRef.current, {
            onSelect: (iso2) => {
                if (answeredRef.current) return;
                setSelectedIso2(iso2 || null);
                audio.play('click');
                // Semi-zoom + rotate so the selected country lands in the
                // middle of the stage — gives the player a focused view of
                // their guess before they confirm.
                if (iso2 && globeRef.current) {
                    // Don't eject the player further out than they pinched in.
                    globeRef.current.flyToIso2(iso2, { zoom: 4.6, noZoomOut: true });
                }
            },
            onConfirm: (iso2) => {
                if (answeredRef.current) return;
                if (!iso2) return;
                resolveAnswerRef.current?.(iso2);
            },
            onReady: () => {
                if (!globeRef.current) return;
                // Filter quizFlags to those whose code matches a globe country.
                // Supranational entries (asean, arab, etc.) and tiny dependencies
                // missing from Natural Earth's 110m fall out automatically.
                const have = new Set(globeRef.current.getAvailableIso2());
                const eligible = (quizFlags || []).filter(
                    (f) => f && f.code && have.has(f.code.toUpperCase())
                );
                eligibleFlagsRef.current = eligible;
                setGlobeReady(true);
            },
            onError: (e) => {
                console.error('Globe load failed', e);
                setGlobeError(e?.message || 'Failed to load the globe — check your connection.');
            },
        });
        globeRef.current = globe;
        globe.load();
        return () => {
            if (nextTimerRef.current) clearTimeout(nextTimerRef.current);
            globe.dispose();
            globeRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Re-apply theme tints when the host app toggles dark/light.
    useEffect(() => {
        const observer = new MutationObserver(() => {
            if (globeRef.current) globeRef.current.applyTheme();
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
        return () => observer.disconnect();
    }, []);

    // Kick off the first question once the globe is ready + we know which
    // flags are eligible.
    useEffect(() => {
        if (globeReady && !currentFlagRef.current) pickNextQuestion();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [globeReady]);

    const handleConfirmButton = () => {
        if (!selectedIso2 || answered) return;
        resolveAnswer(selectedIso2);
    };

    const handleSkip = () => {
        const flag = currentFlagRef.current;
        if (!flag || answeredRef.current) return;
        setAnswered(true);
        setFlashColor('incorrect');
        audio.play('incorrect');
        setStreak(0);
        resetStreak(MODE);
        const { message, color, updatedFlags } = update_geo_stats(allFlagsData, flag, false);
        setFlagsData(updatedFlags);
        setFeedback({ text: 'Skipped. The answer was:', answer: message.answer, tone: color });
        if (globeRef.current) {
            globeRef.current.setLocked('wrong');
            globeRef.current.paintCountry(flag.code, 'correct');
            globeRef.current.flyToIso2(flag.code, { duration: 700, zoom: 4.6 });
        }
        if (nextTimerRef.current) clearTimeout(nextTimerRef.current);
        nextTimerRef.current = setTimeout(() => pickNextQuestion(), NEXT_DELAY_MS);
    };

    const handleRevealHint = () => {
        const flag = currentFlagRef.current;
        if (!flag || answered || hintUsed || !globeRef.current) return;
        // Read the region tag from the flag's metadata to figure out which
        // continent to swing toward. Falls back gracefully if none is set.
        const regionTag = (flag.tags || []).find((t) => t.startsWith('region:'));
        const key = regionTag ? regionTag.split(':')[1] : null;
        const center = key ? CONTINENT_CENTERS[key] : null;
        if (!center) return;
        setHintUsed(true);
        // Reveal both the continent and the country's name — placing the
        // country on the right continent is still on the player, and Hint
        // already costs half XP so the give-away is paid for.
        setHintLabel(`Hint: ${flag.name} · ${center.label}`);
        audio.play('click');
        // Pan to the continent at moderate zoom — closer than the default
        // overview but still wide enough that several countries are visible,
        // so we're nudging, not pointing.
        globeRef.current.flyToLatLon(center.lat, center.lon, { duration: 700, zoom: 5.6 });
    };

    const feedbackColor = feedback.tone === 'green'
        ? 'var(--color-success-deep)'
        : feedback.tone === 'red'
            ? 'var(--color-danger-deep)'
            : 'var(--color-ink-soft)';

    const empty = globeReady && eligibleFlagsRef.current.length === 0;

    return (
        <div className={`quiz-box globe-quiz ${flashColor ? `flash-${flashColor}` : ''}`}>
            <div className="quiz-topbar globe-quiz__topbar">
                <button className="back-button" onClick={handleBack} aria-label="Back">
                    <Icon name="arrow_back" />
                </button>
                <span className="ui-pill ui-pill--primary">
                    <Icon name="local_fire_department" /> Streak {streak}
                    {streak > 0 && <span className="streak-mult">×{streakMultiplier(streak).toFixed(1)}</span>}
                </span>
                <ScoreBubble score={score} icon="star" />
            </div>

            <div className="globe-quiz__stage" aria-label="World globe">
                <div ref={containerRef} className="globe-quiz__canvas" />
                {!globeReady && !globeError && (
                    <div className="globe-quiz__overlay">
                        <Spinner />
                        <span>Rendering the globe…</span>
                    </div>
                )}
                {globeError && (
                    <div className="globe-quiz__overlay globe-quiz__overlay--error">
                        <Icon name="public_off" />
                        <span>{globeError}</span>
                        <Button variant="secondary" onClick={handleBack}>Back</Button>
                    </div>
                )}

                {/* Floating flag-prompt card — pinned bottom-right on desktop,
                    bottom-centered on mobile. */}
                {currentFlag && (
                    <motion.div
                        className="globe-quiz__prompt"
                        key={currentFlag.code}
                        initial={{ opacity: 0, y: 20, scale: 0.94 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={springs.bouncy}
                    >
                        <div className="globe-quiz__prompt-tag">Find this country</div>
                        <img
                            src={`${IMAGE_BASE_URL}${currentFlag.file}`}
                            alt={`Flag of ${currentFlag.name}`}
                            className="globe-quiz__prompt-flag"
                        />
                        <div className="globe-quiz__prompt-hint">
                            <Icon name="touch_app" /> Tap a country, then confirm.
                        </div>
                    </motion.div>
                )}

                {/* Floating XP reward — same vocabulary as the standard quizzes. */}
                <AnimatePresence>
                    {xpGain && (
                        <motion.div
                            className={`xp-gain ${xpGain.amount < 0 ? 'xp-gain--neg' : ''}`}
                            initial={{ y: 8, opacity: 0, scale: 0.9 }}
                            animate={{ y: -18, opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={springs.bouncy}
                            style={{ position: 'absolute', left: '50%', top: '20%', transform: 'translateX(-50%)' }}
                            aria-hidden="true"
                        >
                            {xpGain.amount < 0
                                ? `${xpGain.amount} XP`
                                : `+${xpGain.amount} XP${xpGain.multiplier > 1 ? ` ×${xpGain.multiplier.toFixed(1)}` : ''}${xpGain.hinted ? ' (½)' : ''}`}
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {answered && flashColor === 'correct' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.7 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={springs.bouncy}
                            className="globe-quiz__mascot"
                            aria-hidden="true"
                        >
                            <Mascot size={64} mood="cheer" cosmetics={profile.cosmetics} still />
                        </motion.div>
                    )}
                    {answered && flashColor === 'incorrect' && (
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={springs.gentle}
                            className="globe-quiz__mascot"
                            aria-hidden="true"
                        >
                            <Mascot size={64} mood="sad" cosmetics={profile.cosmetics} still />
                        </motion.div>
                    )}
                    {showConfetti && (
                        <div className="globe-quiz__confetti">
                            <Confetti pieces={18} radius={140} />
                        </div>
                    )}
                </AnimatePresence>
            </div>

            <div className="feedback-label globe-quiz__feedback" style={{ color: feedbackColor }} aria-live="polite">
                <div className="feedback-row">
                    {flashColor === 'correct' && <Icon name="check_circle" variant="correct" size="lg" pop />}
                    {flashColor === 'incorrect' && <Icon name="cancel" variant="incorrect" size="lg" pop />}
                    <span>{feedback.text}</span>
                </div>
                {feedback.answer && <span className="feedback-answer">{feedback.answer}</span>}
            </div>

            {empty && (
                <div className="text-center" style={{ color: 'var(--color-ink-soft)' }}>
                    No globe-ready countries in this set. Try a different deck.
                </div>
            )}

            <div className="globe-quiz__actions">
                <Button
                    variant="secondary"
                    onClick={handleRevealHint}
                    disabled={answered || !currentFlag || hintUsed}
                    icon="explore"
                >
                    {hintUsed && hintLabel ? hintLabel : 'Hint (½ XP)'}
                </Button>
                <Button
                    variant="primary"
                    onClick={handleConfirmButton}
                    disabled={answered || !selectedIso2}
                    icon="check"
                >
                    Confirm
                </Button>
                <button type="button" onClick={handleSkip} disabled={answered} className="skip-button">
                    Skip
                </button>
            </div>
        </div>
    );
}

export default GlobeQuiz;
