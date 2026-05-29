import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../common/Icon';
import { Button, ChoiceCard, ScoreBubble } from '../ui/index';
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
import { bumpQuestMetric, reportStreakHwm } from '../../lib/quests';
import { recordCorrect, recordIncorrect } from '../../lib/pet';
import { getStreak, saveStreak, resetStreak } from '../../lib/streak';
import {
    ensureWaterCatalog, selectNextWater, waterDistractorNames, recordWaterAnswer,
    getWaterById, getWaterStreak,
} from '../../lib/waters';
import Globe from '../../lib/globe/Globe';
import { springs } from '../../motion/index';

const MODE = 'bodies-of-water';
const NEXT_DELAY_MS = 2400;

// Type → reveal zoom (camera.position.z; smaller = closer). Big basins read
// best from further out; rivers/lakes/straits want a closer look.
const ZOOM_BY_TYPE = { ocean: 6.0, sea: 5.6, gulf: 5.2, strait: 4.6, lake: 4.6, river: 4.8 };
const TYPE_LABEL = { ocean: 'ocean', sea: 'sea', gulf: 'gulf or bay', strait: 'strait or channel', lake: 'lake', river: 'river' };

// Bodies-of-Water quiz: a water body lights up on the (shared) 3D globe and the
// player picks its name from four options. Its own mastery track — see
// src/lib/waters.js — entirely separate from flag / country-geography mastery.
function BodiesOfWaterQuiz({ setView }) {
    const audio = useAudio();
    const profile = useProfile();

    const containerRef = useRef(null);
    const globeRef = useRef(null);
    const eligibleIdsRef = useRef([]);   // water ids the globe actually rendered
    const recentRef = useRef([]);        // last few asked ids (avoid repeats)
    const currentRef = useRef(null);     // mirror of `current` for callbacks
    const answeredRef = useRef(false);
    const nextTimerRef = useRef(null);

    const [globeReady, setGlobeReady] = useState(false);
    const [catalogReady, setCatalogReady] = useState(false);
    const [globeError, setGlobeError] = useState(null);
    const [current, setCurrent] = useState(null);     // { id, name, type }
    const [options, setOptions] = useState([]);
    const [chosen, setChosen] = useState(null);
    const [answered, setAnswered] = useState(false);
    const [feedback, setFeedback] = useState({ text: ' ' });
    const [flashColor, setFlashColor] = useState(null);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(() => getStreak(MODE));
    const [xpGain, setXpGain] = useState(null);
    const [showConfetti, setShowConfetti] = useState(false);
    const [masteryStreak, setMasteryStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);
    const [answeredTotal, setAnsweredTotal] = useState(0);
    const [chest, setChest] = useState(null);

    currentRef.current = current;
    answeredRef.current = answered;

    const navigateBack = useCallback(() => {
        if (nextTimerRef.current) clearTimeout(nextTimerRef.current);
        setView('menu');
    }, [setView]);

    const handleBack = useCallback(() => {
        if (chest || score < MIN_CORRECT_FOR_CHEST) { navigateBack(); return; }
        const accuracy = answeredTotal > 0 ? score / answeredTotal : 0;
        const rolled = rollChest({ correct: score, accuracy, bestStreak, mode: MODE, yieldMult: currentChestYieldMult() });
        if (!rolled) { navigateBack(); return; }
        addEarnedBucks(rolled.bucks);
        setChest(rolled);
    }, [chest, score, answeredTotal, bestStreak, navigateBack]);

    const pickNext = useCallback(() => {
        const ids = eligibleIdsRef.current;
        if (!ids || ids.length === 0) { setCurrent(null); currentRef.current = null; return; }
        const nextId = selectNextWater(ids, recentRef.current);
        if (!nextId) { setCurrent(null); currentRef.current = null; return; }
        recentRef.current = [...recentRef.current, nextId].slice(-8);
        const meta = getWaterById(nextId) || { id: nextId, name: nextId, type: 'sea' };

        currentRef.current = meta;
        setCurrent(meta);
        setMasteryStreak(getWaterStreak(nextId));
        const distractors = waterDistractorNames(nextId, ids, 3);
        setOptions([...distractors, meta.name].sort(() => Math.random() - 0.5));
        setChosen(null);
        setAnswered(false);
        answeredRef.current = false;
        setFeedback({ text: ' ' });
        setFlashColor(null);
        setXpGain(null);
        setShowConfetti(false);

        if (globeRef.current) {
            globeRef.current.clearWaterHighlight();
            globeRef.current.highlightWater(nextId);
            const zoom = ZOOM_BY_TYPE[meta.type] || 5.2;
            globeRef.current.flyToWater(nextId, { duration: 700, zoom });
        }
    }, []);

    const handleAnswer = useCallback((name) => {
        const target = currentRef.current;
        if (!target || answeredRef.current) return;
        const wasCorrect = name === target.name;

        setAnswered(true);
        answeredRef.current = true;
        setChosen(name);
        setFlashColor(wasCorrect ? 'correct' : 'incorrect');
        setAnsweredTotal((n) => n + 1);

        const { before, after } = recordWaterAnswer(target.id, wasCorrect);
        setMasteryStreak(after);
        if (globeRef.current) globeRef.current.revealWater(target.id, true);

        setFeedback({
            text: wasCorrect ? 'Correct! This is the' : 'Not quite. This is the',
            answer: `${target.name}`,
            tone: wasCorrect ? 'green' : 'red',
        });

        if (wasCorrect) recordCorrect(1); else recordIncorrect(1);

        if (wasCorrect) {
            audio.play('correct');
            setScore((s) => s + 1);
            const next = streak + 1;
            if (next === 3 || next === 5 || next === 10) audio.play('streak');
            setStreak(next);
            saveStreak(MODE, next);
            if (next > bestStreak) setBestStreak(next);
            if (recordBestStreak(MODE, next)) flushProfile();
            // Brand-new bodies pay the most; reuse the Globe XP rate (no new
            // mode key, so the mirrored xp.js pair stays untouched).
            const xpFlag = { correct: before === 0 ? 0 : 1, streak: before };
            const award = awardForAnswer(xpFlag, 'globe', next);
            const bucks = awardBucksForAnswer(award);
            addEarnedXp(award.amount);
            if (bucks > 0) addEarnedBucks(bucks);
            bumpQuestMetric('any_correct', 1);
            reportStreakHwm(next);
            setXpGain({ ...award, bucks });
            setShowConfetti(true);
            if (before <= MASTERY_STREAK && after > MASTERY_STREAK) audio.play('levelUp');
        } else {
            audio.play('incorrect');
            setStreak(0);
            resetStreak(MODE);
            const penalty = penaltyForAnswer('globe');
            addEarnedXp(-penalty);
            setXpGain({ amount: -penalty });
        }

        if (nextTimerRef.current) clearTimeout(nextTimerRef.current);
        nextTimerRef.current = setTimeout(() => pickNext(), NEXT_DELAY_MS);
    }, [audio, streak, bestStreak, pickNext]);

    // Mount the globe once, with the water layer enabled.
    useEffect(() => {
        ensureWaterCatalog().then(() => setCatalogReady(true));
        if (!containerRef.current) return undefined;
        const globe = new Globe(containerRef.current, {
            loadWater: true,
            onReady: () => {
                if (!globeRef.current) return;
                globeRef.current.setWaterLayerVisible(true);
                eligibleIdsRef.current = globeRef.current.getAvailableWaterIds();
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

    // Re-tint on theme toggle, same as the Globe quiz.
    useEffect(() => {
        const observer = new MutationObserver(() => {
            if (globeRef.current) globeRef.current.applyTheme();
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
        return () => observer.disconnect();
    }, []);

    // First question once both the globe geometry and the name catalog are ready.
    useEffect(() => {
        if (globeReady && catalogReady && !currentRef.current) pickNext();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [globeReady, catalogReady]);

    const handleSkip = () => {
        const target = currentRef.current;
        if (!target || answeredRef.current) return;
        handleAnswer(' __skip__'); // never matches a real name → counts as wrong
    };

    const getChoiceState = (option) => {
        if (!answered || !current) return 'idle';
        if (option === current.name) return 'correct';
        if (option === chosen && option !== current.name) return 'incorrect';
        return 'idle';
    };

    const feedbackColor = feedback.tone === 'green'
        ? 'var(--color-success-deep)'
        : feedback.tone === 'red'
            ? 'var(--color-danger-deep)'
            : 'var(--color-ink-soft)';

    const empty = globeReady && catalogReady && eligibleIdsRef.current.length === 0;

    return (
        <div className={`quiz-box globe-quiz bow-quiz ${flashColor ? `flash-${flashColor}` : ''}`}>
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

            <div className="globe-quiz__stage bow-quiz__stage" aria-label="World globe">
                <div ref={containerRef} className="globe-quiz__canvas" />
                {(!globeReady || !catalogReady) && !globeError && (
                    <div className="globe-quiz__overlay">
                        <Spinner />
                        <span>Charting the waters…</span>
                    </div>
                )}
                {globeError && (
                    <div className="globe-quiz__overlay globe-quiz__overlay--error">
                        <Icon name="public_off" />
                        <span>{globeError}</span>
                        <Button variant="secondary" onClick={handleBack}>Back</Button>
                    </div>
                )}

                {current && (
                    <motion.div
                        className="globe-quiz__prompt globe-quiz__prompt--name bow-quiz__prompt"
                        key={`bow-${current.id}`}
                        initial={{ opacity: 0, y: 20, scale: 0.94 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={springs.bouncy}
                    >
                        <div className="globe-quiz__prompt-tag">Name this {TYPE_LABEL[current.type] || 'body of water'}</div>
                        <MasteryMeter streak={masteryStreak} />
                        <div className="globe-quiz__prompt-hint">
                            <Icon name="water_drop" /> Highlighted in violet.
                        </div>
                    </motion.div>
                )}

                <AnimatePresence>
                    {xpGain && (
                        <motion.div
                            className={`xp-gain ${xpGain.amount < 0 ? 'xp-gain--neg' : ''}`}
                            initial={{ y: 8, opacity: 0, scale: 0.9 }}
                            animate={{ y: -18, opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={springs.bouncy}
                            style={{ position: 'absolute', left: '50%', top: '14%', transform: 'translateX(-50%)' }}
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

            {empty ? (
                <div className="text-center" style={{ color: 'var(--color-ink-soft)' }}>
                    No water bodies loaded. Check your connection and try again.
                </div>
            ) : (
                <div className="options-box bow-quiz__options">
                    {options.map((option, i) => (
                        <div className="choice-wrap" key={`${current ? current.id : 'x'}-${option}`}>
                            <ChoiceCard
                                label={option}
                                index={i}
                                state={getChoiceState(option)}
                                disabled={answered || !current}
                                onSelect={handleAnswer}
                            />
                            <AnimatePresence>
                                {showConfetti && current && option === current.name && (
                                    <Confetti pieces={16} radius={110} />
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            )}

            <div className="quiz-actions">
                <button type="button" onClick={handleSkip} disabled={answered || !current} className="skip-button">
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

export default BodiesOfWaterQuiz;
