import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { select_next_flag, update_geo_stats } from '../../quiz_logic';
import { checkAnswer } from '../../answer_check';
import Icon from '../common/Icon';
import { Button, ScoreBubble } from '../ui/index';
import Confetti from '../../assets/illustrations/Confetti';
import Mascot from '../../assets/illustrations/Mascot';
import AtlasBucksIcon from '../../assets/illustrations/AtlasBucks';
import MasteryMeter from './MasteryMeter';
import Spinner from '../../assets/illustrations/Spinner';
import { useAudio } from '../../audio/AudioProvider';
import { useProfile, recordBestStreak, flushProfile } from '../../lib/profile';
import { awardForAnswer, awardBucksForAnswer, penaltyForAnswer, streakMultiplier, MASTERY_STREAK } from '../../lib/xp';
import { addEarnedXp } from '../../lib/progress';
import { addEarnedBucks } from '../../lib/currency';
import { rollChest, MIN_CORRECT_FOR_CHEST, currentChestYieldMult } from '../../lib/chest';
import ChestReveal from '../economy/ChestReveal';
import { bumpMetric, refreshBattlepass } from '../../lib/battlepass';
import { bumpQuestMetric, reportStreakHwm } from '../../lib/quests';
import { recordCorrect, recordIncorrect } from '../../lib/pet';
import { getStreak, saveStreak, resetStreak } from '../../lib/streak';
import { useQuizPresence } from '../../lib/presence';
import SpectatorsBadge from '../social/SpectatorsBadge';
import Globe from '../../lib/globe/Globe';
import { springs } from '../../motion/index';

const MODE_FIND = 'globe';
const MODE_NAME = 'globe-name';
const IMAGE_BASE_URL = './assets/flags/';
const NEXT_DELAY_MS = 2400;
const HINT_XP_MULTIPLIER = 0.5;
// Zoom level used when revealing the answer country or highlighting the
// question country in Name mode. Same value either way so reveals don't snap.
const REVEAL_ZOOM = 4.6;
const NAME_QUESTION_ZOOM = 4.2;

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
//
// Two sub-modes share this screen, toggleable via the in-screen segmented
// control:
//   - find: a flag is shown; the player taps the country on the globe.
//   - name: a country is highlighted on the globe; the player types its name.
// Both contribute to the same per-flag geo* stat axis (so geography mastery
// and the Globe leaderboard see them as one) but keep separate per-mode run
// streaks and pay different XP rates (see MODE_XP).
function GlobeQuiz({
    allFlagsData,
    quizFlags,
    setFlagsData,
    setView,
    setQuizCategory,
    getQuestionHistory,
    updateQuestionHistory,
    strictSpelling,
}) {
    const audio = useAudio();
    const profile = useProfile();

    const containerRef = useRef(null);
    const globeRef = useRef(null);
    const eligibleCodesRef = useRef(null);        // Set of in-deck codes that map to a globe country (fixed once loaded)
    const quizFlagsRef = useRef(quizFlags);       // live deck mirror so each pick reads CURRENT geo stats, not a snapshot
    const currentFlagRef = useRef(null);          // mirror of `currentFlag` for callbacks
    const answeredRef = useRef(false);
    const nextTimerRef = useRef(null);
    // The Globe's onSelect/onConfirm callbacks are wired exactly once at mount,
    // so they'd otherwise capture stale `resolveAnswer` (which closes over the
    // current `streak`, `allFlagsData`, etc.). Bounce through a ref so each tap
    // calls the freshest version.
    const resolveAnswerRef = useRef(null);
    const nameInputRef = useRef(null);

    const [subMode, setSubMode] = useState('find'); // 'find' | 'name'
    const subModeRef = useRef('find');
    subModeRef.current = subMode;

    const [globeReady, setGlobeReady] = useState(false);
    const [globeError, setGlobeError] = useState(null);
    const [currentFlag, setCurrentFlag] = useState(null);
    const [selectedIso2, setSelectedIso2] = useState(null);
    const [answered, setAnswered] = useState(false);
    const [feedback, setFeedback] = useState({ text: ' ' });
    const [flashColor, setFlashColor] = useState(null);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(() => getStreak(MODE_FIND));
    const [xpGain, setXpGain] = useState(null);
    const [showConfetti, setShowConfetti] = useState(false);
    const [hintUsed, setHintUsed] = useState(false);
    const [hintLabel, setHintLabel] = useState(null);
    const [masteryStreak, setMasteryStreak] = useState(0); // current flag's progress to geo-mastery
    const [nameInput, setNameInput] = useState('');
    const [isWiggling, setIsWiggling] = useState(false);
    const [bestStreak, setBestStreak] = useState(0);
    const [answeredTotal, setAnsweredTotal] = useState(0);
    const [chest, setChest] = useState(null);
    // Ref mirror so resolveAnswer (memoised before hintUsed is in scope above
    // it) sees the latest value without depending on state in the deps array.
    const hintUsedRef = useRef(false);
    hintUsedRef.current = hintUsed;

    // Find sub-mode: a flag is shown; the answer is the country location, so
    // a spectator seeing the flag code is safe. Name sub-mode: the country is
    // highlighted on the globe and the player TYPES the name — so the country
    // code IS the answer. Withhold the prompt to spectators in name mode.
    const { watchers, lastReactionId } = useQuizPresence('globe', {
        score, streak,
        promptKind: subMode === 'find' ? 'flag' : null,
        promptFlagCode: subMode === 'find' && currentFlag ? currentFlag.code : undefined,
        lastAnswerCorrect: flashColor === 'correct',
    });

    currentFlagRef.current = currentFlag;
    answeredRef.current = answered;
    quizFlagsRef.current = quizFlags;             // keep the live deck in reach of the memoised picker
    // resolveAnswerRef is assigned below once resolveAnswer is defined.

    const navigateBack = useCallback(() => {
        if (nextTimerRef.current) clearTimeout(nextTimerRef.current);
        setView('quiz-menu');
        setQuizCategory({ type: 'all', value: null });
    }, [setView, setQuizCategory]);

    const handleBack = useCallback(() => {
        if (chest || score < MIN_CORRECT_FOR_CHEST) {
            navigateBack();
            return;
        }
        const accuracy = answeredTotal > 0 ? score / answeredTotal : 0;
        const chestMode = subMode === 'name' ? MODE_NAME : MODE_FIND;
        const rolled = rollChest({ correct: score, accuracy, bestStreak, mode: chestMode, yieldMult: currentChestYieldMult() });
        if (!rolled) {
            navigateBack();
            return;
        }
        addEarnedBucks(rolled.bucks);
        setChest(rolled);
    }, [chest, score, answeredTotal, bestStreak, subMode, navigateBack]);

    const pickNextQuestion = useCallback(() => {
        // Build the pool fresh from the LIVE deck (restricted to globe-placeable
        // codes) on every pick, so the selected flag — and its mastery meter —
        // reflect this session's answers. Picking from a frozen snapshot made the
        // per-flag geoStreak look stale and jump around between questions, and a
        // country mastered mid-run kept resurfacing at its old count.
        const codes = eligibleCodesRef.current;
        const data = quizFlagsRef.current || [];
        const pool = codes ? data.filter((f) => f && f.code && codes.has(f.code.toUpperCase())) : [];
        if (pool.length === 0) {
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
        setMasteryStreak(next.geoStreak || 0);
        setSelectedIso2(null);
        setAnswered(false);
        setFeedback({ text: ' ' });
        setFlashColor(null);
        setXpGain(null);
        setShowConfetti(false);
        setHintUsed(false);
        setHintLabel(null);
        setNameInput('');
        setIsWiggling(false);
        if (globeRef.current) {
            globeRef.current.clearAllPaints();
            if (subModeRef.current === 'name') {
                // Highlight the question country with the neutral 'other' tint
                // (the same blue used for multiplayer opponent picks — reads as
                // "this is the one to identify"). Lock so the player can't
                // accidentally tap-select while they type.
                globeRef.current.paintCountry(next.code, 'other');
                globeRef.current.setLocked('quiz-name');
                globeRef.current.flyToIso2(next.code, { duration: 700, zoom: NAME_QUESTION_ZOOM });
            } else {
                globeRef.current.setLocked(null);
                // Zoom back out so the player has the full globe to search.
                globeRef.current.resetCamera();
            }
        }
    }, [getQuestionHistory, updateQuestionHistory]);

    // Shared post-answer pipeline. `target` is the flag being asked about;
    // `wasCorrect` is the verdict. Updates geo* stats, paints the globe, awards
    // XP/streak (per active sub-mode), and queues the next question.
    const finalizeAnswer = useCallback((target, wasCorrect, opts = {}) => {
        const mode = subModeRef.current === 'name' ? MODE_NAME : MODE_FIND;
        const { wrongIso2 = null, skipped = false } = opts;

        setAnswered(true);
        setFlashColor(wasCorrect ? 'correct' : 'incorrect');

        const beforeStreak = target.geoStreak || 0;
        const { message, color, updatedFlags } = update_geo_stats(
            allFlagsData, target, wasCorrect, skipped ? 'skipped' : 'answered'
        );
        setFlagsData(updatedFlags);
        setFeedback({ text: message.text, answer: message.answer, tone: color });
        const after = updatedFlags.find((f) => f.code === target.code);
        const afterStreak = after ? (after.geoStreak || 0) : beforeStreak;
        setMasteryStreak(afterStreak);

        if (globeRef.current) {
            globeRef.current.setLocked(wasCorrect ? 'correct' : 'wrong');
            if (wasCorrect) {
                globeRef.current.paintCountry(target.code, 'correct');
            } else {
                if (wrongIso2 && wrongIso2 !== target.code) {
                    globeRef.current.paintCountry(wrongIso2, 'wrong');
                }
                globeRef.current.paintCountry(target.code, 'correct');
                // Slide the answer country into view so the reveal lands
                // prominently. In Name mode the country is already centered;
                // the no-op is cheap.
                globeRef.current.flyToIso2(target.code, { duration: 700, zoom: REVEAL_ZOOM });
            }
        }

        // Globe writes to geoCorrect/geoIncorrect, so App.js's flagsData-totals
        // feeder never sees these answers. Nudge Atlas directly per answer.
        if (wasCorrect) recordCorrect(1); else recordIncorrect(1);

        if (wasCorrect) {
            audio.play('correct');
            setScore(s => s + 1);
            setAnsweredTotal((n) => n + 1);
            const next = streak + 1;
            if (next === 3 || next === 5 || next === 10) audio.play('streak');
            setStreak(next);
            saveStreak(mode, next);
            if (next > bestStreak) setBestStreak(next);
            if (recordBestStreak(mode, next)) flushProfile().then(() => refreshBattlepass());
            // Pretend flag's `correct` field is the geoCorrect for the XP scaler
            // so brand-new geography wins land the biggest reward.
            const xpFlag = { correct: beforeStreak === 0 ? 0 : 1, streak: beforeStreak };
            const base = awardForAnswer(xpFlag, mode, next);
            // Half XP if the Find-mode hint was used — Name mode has no hint
            // so hintUsedRef stays false there.
            const amount = hintUsedRef.current
                ? Math.max(1, Math.round(base.amount * HINT_XP_MULTIPLIER))
                : base.amount;
            const bucksAward = awardBucksForAnswer({ amount });
            const award = { ...base, amount, hinted: hintUsedRef.current, bucks: bucksAward };
            addEarnedXp(award.amount);
            if (bucksAward > 0) addEarnedBucks(bucksAward);
            // Separate battlepass counters per sub-mode so the pass can offer
            // distinct challenges for each play style.
            bumpMetric(mode === MODE_NAME ? 'globe_name_correct' : 'globe_correct', 1);
            bumpQuestMetric('globe_correct', 1);
            bumpQuestMetric('any_correct', 1);
            reportStreakHwm(next);
            if (beforeStreak <= MASTERY_STREAK && afterStreak > MASTERY_STREAK) {
                bumpQuestMetric('master_new', 1);
            }
            setXpGain(award);
            setShowConfetti(true);
            if (beforeStreak <= MASTERY_STREAK && afterStreak > MASTERY_STREAK) audio.play('levelUp');
        } else {
            if (!skipped) audio.play('incorrect');
            setStreak(0);
            resetStreak(mode);
            setAnsweredTotal((n) => n + 1);
            const penalty = penaltyForAnswer(mode);
            addEarnedXp(-penalty);
            setXpGain({ amount: -penalty });
        }

        if (nextTimerRef.current) clearTimeout(nextTimerRef.current);
        nextTimerRef.current = setTimeout(() => {
            pickNextQuestion();
        }, NEXT_DELAY_MS);
    }, [allFlagsData, setFlagsData, audio, streak, bestStreak, pickNextQuestion]);

    // Find-mode tap-confirm: guessIso2 is what the player clicked.
    const resolveAnswer = useCallback((guessIso2) => {
        const flag = currentFlagRef.current;
        if (!flag || answeredRef.current) return;
        if (subModeRef.current !== 'find') return; // Name mode handles its own submit
        const wasCorrect = (guessIso2 || '').toUpperCase() === (flag.code || '').toUpperCase();
        finalizeAnswer(flag, wasCorrect, { wrongIso2: wasCorrect ? null : guessIso2 });
    }, [finalizeAnswer]);

    resolveAnswerRef.current = resolveAnswer;

    // Name-mode submit: text is the player's typed guess. Reuses the same
    // fuzzy/strict country-name matcher as Free Response so spelling tolerance
    // is consistent across the app.
    const resolveNameAnswer = useCallback((text) => {
        const flag = currentFlagRef.current;
        if (!flag || answeredRef.current) return;
        if (subModeRef.current !== 'name') return;
        const wasCorrect = checkAnswer(text, flag, strictSpelling);
        finalizeAnswer(flag, wasCorrect);
    }, [finalizeAnswer, strictSpelling]);

    // Mount the globe once.
    useEffect(() => {
        if (!containerRef.current) return;
        const globe = new Globe(containerRef.current, {
            onSelect: (iso2) => {
                if (answeredRef.current) return;
                if (subModeRef.current !== 'find') return;
                setSelectedIso2(iso2 || null);
                audio.play('click');
                // Semi-zoom + rotate so the selected country lands in the
                // middle of the stage — gives the player a focused view of
                // their guess before they confirm.
                if (iso2 && globeRef.current) {
                    // Don't eject the player further out than they pinched in.
                    globeRef.current.flyToIso2(iso2, { zoom: REVEAL_ZOOM, noZoomOut: true });
                }
            },
            onConfirm: (iso2) => {
                if (answeredRef.current) return;
                if (subModeRef.current !== 'find') return;
                if (!iso2) return;
                resolveAnswerRef.current?.(iso2);
            },
            onReady: () => {
                if (!globeRef.current) return;
                // Filter quizFlags to those whose code matches a globe country.
                // Supranational entries (asean, arab, etc.) and tiny dependencies
                // missing from Natural Earth's 110m fall out automatically.
                const have = new Set(globeRef.current.getAvailableIso2());
                // Which countries qualify (placeable on the globe AND in the deck)
                // is fixed once the globe is loaded; their stats are not. Store just
                // the codes — pickNextQuestion re-reads live stats via quizFlagsRef.
                const eligible = (quizFlagsRef.current || []).filter(
                    (f) => f && f.code && have.has(f.code.toUpperCase())
                );
                eligibleCodesRef.current = new Set(eligible.map((f) => f.code.toUpperCase()));
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

    // Auto-focus the name input when entering / advancing within Name mode.
    useEffect(() => {
        if (subMode === 'name' && !answered && currentFlag && nameInputRef.current) {
            nameInputRef.current.focus();
        }
    }, [subMode, answered, currentFlag]);

    const handleConfirmButton = () => {
        if (subMode !== 'find') return;
        if (!selectedIso2 || answered) return;
        resolveAnswer(selectedIso2);
    };

    const handleNameSubmit = (e) => {
        if (e) e.preventDefault();
        if (subMode !== 'name' || answered) return;
        if (!nameInput.trim()) {
            setIsWiggling(true);
            audio.play('incorrect', { volume: 0.5 });
            setTimeout(() => setIsWiggling(false), 500);
            return;
        }
        resolveNameAnswer(nameInput);
    };

    const handleSkip = () => {
        const flag = currentFlagRef.current;
        if (!flag || answeredRef.current) return;
        audio.play('incorrect');
        finalizeAnswer(flag, false, { skipped: true });
    };

    const handleRevealHint = () => {
        const flag = currentFlagRef.current;
        if (!flag || answered || hintUsed || !globeRef.current) return;
        if (subMode !== 'find') return; // Name mode already shows the country
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

    // Toggle Find ↔ Name. Cancels any pending next-question timer, swaps the
    // active streak read, and re-picks so the player sees a fresh question in
    // the new style immediately.
    const handleToggleSubMode = (nextMode) => {
        if (nextMode === subMode) return;
        if (nextTimerRef.current) clearTimeout(nextTimerRef.current);
        audio.play('click');
        subModeRef.current = nextMode;
        setSubMode(nextMode);
        // Each sub-mode keeps its own run streak so a hot Find run isn't
        // diluted by a fresh-start Name session (and vice versa).
        setStreak(getStreak(nextMode === 'name' ? MODE_NAME : MODE_FIND));
        // The score counter is a per-session display, not persisted — reset
        // so the player sees how they're doing in the freshly chosen mode.
        setScore(0);
        if (globeReady) pickNextQuestion();
    };

    const feedbackColor = feedback.tone === 'green'
        ? 'var(--color-success-deep)'
        : feedback.tone === 'red'
            ? 'var(--color-danger-deep)'
            : 'var(--color-ink-soft)';

    const empty = globeReady && !!eligibleCodesRef.current && eligibleCodesRef.current.size === 0;

    return (
        <div className={`quiz-box globe-quiz ${flashColor ? `flash-${flashColor}` : ''}`}>
            <div className="quiz-topbar globe-quiz__topbar">
                <button className="back-button" onClick={handleBack} aria-label="Back">
                    <Icon name="arrow_back" />
                </button>
                <div className="globe-quiz__mode-toggle" role="tablist" aria-label="Globe mode">
                    <button
                        type="button"
                        role="tab"
                        aria-selected={subMode === 'find'}
                        className={`globe-quiz__mode-tab ${subMode === 'find' ? 'is-active' : ''}`}
                        onClick={() => handleToggleSubMode('find')}
                    >
                        <Icon name="ads_click" /> Find
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={subMode === 'name'}
                        className={`globe-quiz__mode-tab ${subMode === 'name' ? 'is-active' : ''}`}
                        onClick={() => handleToggleSubMode('name')}
                    >
                        <Icon name="edit_location_alt" /> Name
                    </button>
                </div>
                <span className="ui-pill ui-pill--primary">
                    <Icon name="local_fire_department" /> Streak {streak}
                    {streak > 0 && <span className="streak-mult">×{streakMultiplier(streak).toFixed(1)}</span>}
                </span>
                <ScoreBubble score={score} icon="star" />
                <SpectatorsBadge watchers={watchers} lastReactionId={lastReactionId} />
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

                {/* Find mode: floating flag-prompt card with the flag to locate. */}
                {currentFlag && subMode === 'find' && (
                    <motion.div
                        className="globe-quiz__prompt"
                        key={`find-${currentFlag.code}`}
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
                        <MasteryMeter streak={masteryStreak} />
                        <div className="globe-quiz__prompt-hint">
                            <Icon name="touch_app" /> Tap a country, then confirm.
                        </div>
                    </motion.div>
                )}

                {/* Name mode: prompt card asking the player to type the highlighted country. */}
                {currentFlag && subMode === 'name' && (
                    <motion.div
                        className="globe-quiz__prompt globe-quiz__prompt--name"
                        key={`name-${currentFlag.code}`}
                        initial={{ opacity: 0, y: 20, scale: 0.94 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={springs.bouncy}
                    >
                        <div className="globe-quiz__prompt-tag">Name this country</div>
                        <MasteryMeter streak={masteryStreak} />
                        <form onSubmit={handleNameSubmit} className="globe-quiz__name-form">
                            <input
                                ref={nameInputRef}
                                type="text"
                                value={nameInput}
                                onChange={(e) => setNameInput(e.target.value)}
                                disabled={answered}
                                className={`globe-quiz__name-input ${isWiggling ? 'wiggle' : ''}`}
                                placeholder="Country name…"
                                autoComplete="off"
                                autoCorrect="off"
                                spellCheck="false"
                                aria-label="Country name"
                            />
                        </form>
                        <div className="globe-quiz__prompt-hint">
                            <Icon name="travel_explore" /> Highlighted in blue.
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
                            {xpGain.amount < 0 ? (
                                `${xpGain.amount} XP`
                            ) : (
                                <>
                                    <span className="xp-gain__amount">
                                        +{xpGain.amount} XP
                                        {xpGain.multiplier > 1 && (
                                            <span className="xp-gain__mult">×{xpGain.multiplier.toFixed(1)}</span>
                                        )}
                                        {xpGain.hinted && (
                                            <span className="xp-gain__hint">(½)</span>
                                        )}
                                    </span>
                                    {xpGain.bucks > 0 && (
                                        <>
                                            <span className="xp-gain__sep" aria-hidden="true" />
                                            <span className="xp-gain__bucks">
                                                <AtlasBucksIcon size={16} /> +{xpGain.bucks}
                                            </span>
                                        </>
                                    )}
                                </>
                            )}
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
                {subMode === 'find' ? (
                    <>
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
                    </>
                ) : (
                    <Button
                        variant="primary"
                        onClick={handleNameSubmit}
                        disabled={answered || !nameInput.trim()}
                        icon="check"
                    >
                        Submit
                    </Button>
                )}
                <button type="button" onClick={handleSkip} disabled={answered} className="skip-button">
                    Skip
                </button>
            </div>

            <ChestReveal
                open={!!chest}
                rarity={chest?.rarity || 'common'}
                bucks={chest?.bucks || 0}
                title="Run complete!"
                subtitle={`${score} correct · streak ${bestStreak}`}
                showRarity
                onClose={() => { setChest(null); navigateBack(); }}
            />
        </div>
    );
}

export default GlobeQuiz;
