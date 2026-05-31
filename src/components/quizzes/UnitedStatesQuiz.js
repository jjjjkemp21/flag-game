import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../common/Icon';
import { ChoiceCard, ScoreBubble } from '../ui/index';
import Mascot from '../../assets/illustrations/Mascot';
import Confetti from '../../assets/illustrations/Confetti';
import Spinner from '../../assets/illustrations/Spinner';
import AtlasBucksIcon from '../../assets/illustrations/AtlasBucks';
import UsMap from '../../assets/illustrations/UsMap';
import MasteryMeter from './MasteryMeter';
import { useAudio } from '../../audio/AudioProvider';
import { useProfile } from '../../lib/profile';
import { recordHighScore, flushBonus, addEarnedXp } from '../../lib/progress';
import { refreshBattlepass } from '../../lib/battlepass';
import { bumpQuestMetric, reportStreakHwm } from '../../lib/quests';
import { addEarnedBucks } from '../../lib/currency';
import { awardForAnswer, awardBucksForAnswer, penaltyForAnswer, streakMultiplier, MASTERY_STREAK } from '../../lib/xp';
import { rollChest, MIN_CORRECT_FOR_CHEST, currentChestYieldMult } from '../../lib/chest';
import ChestReveal from '../economy/ChestReveal';
import { recordCorrect, recordIncorrect } from '../../lib/pet';
import { getStreak, saveStreak, resetStreak } from '../../lib/streak';
import { springs } from '../../motion/index';
import {
    useUsStates,
    ensureUsStatesCatalog,
    getUsStateById,
    getUsStateStat,
    recordUsStateAnswer,
    selectNextUsState,
    usCapitalDistractors,
    usStateNameDistractors,
    availableUsStateCodes,
    deckUsStateCodes,
} from '../../lib/usStates';

const FLAG_IMAGE_BASE = './assets/state-flags/';
const SUBMODE_CYCLE = ['map', 'capitals', 'flags'];

const STREAK_KEY = 'us-states';
const OPTIONS_PER_QUESTION = 4;

// United States quiz screen — runs the same loop the other modes use (streak,
// XP, Bucks, end-of-run chest), but the prompt swaps between three sub-modes
// driven by the subMode prop:
//   'map'      — state name shown, player clicks the right state on the SVG.
//   'capitals' — state name shown, player picks its capital from four options.
//   'flags'    — state flag shown, player picks the state name from four options.
//   'mixed'    — cycles through map → capitals → flags each question.
// All four share one per-state mastery stat (so progress grows no matter the
// lens — same trick Globe's find/name pair uses).
function UnitedStatesQuiz({ setView, subMode = 'map', deck = { type: 'all', value: null } }) {
    const usState = useUsStates();
    const catalogReady = usState.catalogLoaded;

    const questionCodes = useMemo(
        () => (catalogReady ? deckUsStateCodes(deck) : []),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [catalogReady, deck.type, deck.value]
    );
    const distractorCodes = useMemo(() => {
        if (!catalogReady) return [];
        return [...new Set([...availableUsStateCodes(), ...questionCodes])];
    }, [catalogReady, questionCodes]);

    const [current, setCurrent] = useState(null);  // catalog entry { code, name, capital, region }
    const [activeMode, setActiveMode] = useState(subMode === 'mixed' ? 'map' : subMode);
    const [options, setOptions] = useState([]);    // capitals mode
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(() => getStreak(STREAK_KEY));
    const [masteryStreak, setMasteryStreak] = useState(0);
    const [feedback, setFeedback] = useState({ text: ' ' });
    const [answered, setAnswered] = useState(false);
    const [chosenOption, setChosenOption] = useState(null);  // capitals: clicked option
    const [chosenCode, setChosenCode] = useState(null);      // map: clicked state code
    const [flashColor, setFlashColor] = useState(null);
    const [xpGain, setXpGain] = useState(null);
    const [showConfetti, setShowConfetti] = useState(false);
    const [bestStreak, setBestStreak] = useState(0);
    const [answeredTotal, setAnsweredTotal] = useState(0);
    const [chest, setChest] = useState(null);

    const audio = useAudio();
    const profile = useProfile();
    const recentRef = useRef([]);
    // Alternation seed for 'mixed' mode — flips each question. Held in a ref so
    // changing it doesn't re-run the question generator.
    const mixedTurnRef = useRef(0);

    useEffect(() => { ensureUsStatesCatalog(); }, []);

    const isMap = activeMode === 'map';
    const isFlags = activeMode === 'flags';
    const isCapitals = activeMode === 'capitals';
    // The XP-mode key tells `awardForAnswer` / `penaltyForAnswer` which rate to
    // use. The three US sub-modes map onto their server-side cousins.
    const xpModeKey = isMap
        ? 'us-states-map'
        : isFlags
            ? 'us-states-flags'
            : 'us-states-capitals';

    const nextQuestion = useCallback(() => {
        setFlashColor(null);
        setFeedback({ text: ' ' });
        setAnswered(false);
        setChosenOption(null);
        setChosenCode(null);
        setXpGain(null);
        setShowConfetti(false);

        if (!questionCodes.length) { setCurrent(null); return; }

        const code = selectNextUsState(questionCodes, recentRef.current);
        const entry = getUsStateById(code);
        if (!entry) { setCurrent(null); return; }
        recentRef.current = [...recentRef.current.slice(-4), code];

        // Pick the lens for this question. Fixed sub-modes always use their own
        // mode; 'mixed' cycles map → capitals → flags so each gets a fair share.
        let modeForThisQuestion = subMode === 'mixed'
            ? SUBMODE_CYCLE[mixedTurnRef.current % SUBMODE_CYCLE.length]
            : subMode;
        mixedTurnRef.current += 1;
        setActiveMode(modeForThisQuestion);

        if (modeForThisQuestion === 'capitals') {
            if (distractorCodes.length < OPTIONS_PER_QUESTION) { setCurrent(null); return; }
            const distractors = usCapitalDistractors(code, distractorCodes, OPTIONS_PER_QUESTION - 1);
            const shuffled = [entry.capital, ...distractors].sort(() => Math.random() - 0.5);
            setOptions(shuffled);
        } else if (modeForThisQuestion === 'flags') {
            if (distractorCodes.length < OPTIONS_PER_QUESTION) { setCurrent(null); return; }
            const distractors = usStateNameDistractors(code, distractorCodes, OPTIONS_PER_QUESTION - 1);
            const shuffled = [entry.name, ...distractors].sort(() => Math.random() - 0.5);
            setOptions(shuffled);
        } else {
            setOptions([]);
        }

        setCurrent(entry);
        setMasteryStreak(getUsStateStat(code).streak || 0);
    }, [questionCodes, distractorCodes, subMode]);

    useEffect(() => {
        if (catalogReady && !current) nextQuestion();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [catalogReady]);

    const navigateBack = () => setView('united-states-menu');

    // End-of-run chest, mirrors CapitalsQuiz.
    const handleBack = () => {
        if (score > 0) {
            recordHighScore('us-states', score);
            flushBonus().then(() => refreshBattlepass());
        }
        if (chest || score < MIN_CORRECT_FOR_CHEST) {
            navigateBack();
            return;
        }
        const accuracy = answeredTotal > 0 ? score / answeredTotal : 0;
        const rolled = rollChest({ correct: score, accuracy, bestStreak, mode: 'us-states', yieldMult: currentChestYieldMult() });
        if (!rolled) { navigateBack(); return; }
        addEarnedBucks(rolled.bucks);
        setChest(rolled);
    };

    const resolveAnswer = useCallback((wasCorrect, picked) => {
        if (!current || answered) return;
        setAnswered(true);
        setFlashColor(wasCorrect ? 'correct' : 'incorrect');
        setAnsweredTotal((n) => n + 1);

        const preStat = getUsStateStat(current.code);
        const { before, after } = recordUsStateAnswer(current.code, wasCorrect);
        setMasteryStreak(after);

        if (wasCorrect) {
            audio.play('correct');
            setScore((s) => s + 1);
            recordCorrect(1);
            const next = streak + 1;
            if (next === 3 || next === 5 || next === 10) audio.play('streak');
            setStreak(next);
            saveStreak(STREAK_KEY, next);
            if (next > bestStreak) setBestStreak(next);
            const award = awardForAnswer({ correct: preStat.correct, streak: before }, xpModeKey, next);
            addEarnedXp(award.amount);
            const bucksAward = awardBucksForAnswer(award);
            if (bucksAward > 0) addEarnedBucks(bucksAward);
            setXpGain({ ...award, bucks: bucksAward });
            bumpQuestMetric('capitals_play', 1);
            bumpQuestMetric('any_correct', 1);
            reportStreakHwm(next);
            const verb = isCapitals ? 'The capital is:' : 'The state is:';
            const answerStr = isCapitals ? current.capital : current.name;
            setFeedback({ text: `Correct! ${verb}`, answer: answerStr, tone: 'green' });
            setShowConfetti(true);
            if (before <= MASTERY_STREAK && after > MASTERY_STREAK) audio.play('levelUp');
        } else {
            audio.play('incorrect');
            recordIncorrect(1);
            setStreak(0);
            resetStreak(STREAK_KEY);
            const penalty = penaltyForAnswer(xpModeKey);
            addEarnedXp(-penalty);
            setXpGain({ amount: -penalty });
            const verb = isCapitals ? 'The capital is:' : 'The state is:';
            const answerStr = isCapitals ? current.capital : current.name;
            setFeedback({ text: `Incorrect. ${verb}`, answer: answerStr, tone: 'red' });
        }

        setTimeout(() => { nextQuestion(); }, 2000);
    }, [current, answered, audio, streak, bestStreak, isCapitals, xpModeKey, nextQuestion]);

    const handleMapPick = (code) => {
        if (!current || answered) return;
        setChosenCode(code);
        resolveAnswer(code === current.code, code);
    };

    // Used by both the capitals (text option = capital) and flags (text option =
    // state name) sub-modes — only the option pool differs, the click handler
    // is identical.
    const handleOptionPick = (option) => {
        if (!current || answered) return;
        const correctText = isCapitals ? current.capital : current.name;
        setChosenOption(option);
        resolveAnswer(option === correctText, option);
    };

    const handleSkip = () => {
        if (!current || answered) return;
        setAnswered(true);
        setFlashColor('incorrect');
        audio.play('incorrect');
        setStreak(0);
        resetStreak(STREAK_KEY);
        setAnsweredTotal((n) => n + 1);
        const { after } = recordUsStateAnswer(current.code, false);
        setMasteryStreak(after);
        const verb = isCapitals ? 'The capital is:' : 'The state is:';
        const answerStr = isCapitals ? current.capital : current.name;
        setFeedback({ text: `Skipped. ${verb}`, answer: answerStr, tone: 'red' });
        setTimeout(() => { nextQuestion(); }, 2000);
    };

    const getChoiceState = (option) => {
        if (!answered || !current) return 'idle';
        const correctText = isCapitals ? current.capital : current.name;
        if (option === correctText) return 'correct';
        if (option === chosenOption && option !== correctText) return 'incorrect';
        return 'idle';
    };

    // Keyboard support for the 4-option modes (capitals + flags). Map mode has
    // no keyboard input — the player taps the SVG instead.
    const kbRef = useRef({});
    kbRef.current = { answered, options, handleOptionPick, nextQuestion, hasQuestion: !!current, isMap };
    useEffect(() => {
        const onKey = (e) => {
            const st = kbRef.current;
            if (!st.hasQuestion || st.isMap) return;
            const tag = e.target && e.target.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
            if (!st.answered) {
                let idx = -1;
                if (e.key >= '1' && e.key <= '4') idx = Number(e.key) - 1;
                else {
                    const k = e.key.toLowerCase();
                    if (k >= 'a' && k <= 'd') idx = k.charCodeAt(0) - 97;
                }
                if (idx >= 0 && idx < st.options.length) {
                    e.preventDefault();
                    st.handleOptionPick(st.options[idx]);
                }
            } else if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                st.nextQuestion();
            }
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, []);

    if (!catalogReady) {
        return (
            <div className="loading-box">
                <Spinner />
                <span>Loading states…</span>
            </div>
        );
    }

    if (!current) {
        return (
            <div className="quiz-box">
                <div className="quiz-topbar">
                    <button className="back-button" onClick={navigateBack} aria-label="Back to menu">
                        <Icon name="arrow_back" />
                    </button>
                </div>
                <Mascot size={120} mood="cheer" cosmetics={profile.cosmetics} />
                <h1 className="text-center">No states to show.</h1>
                <p className="text-center" style={{ color: 'var(--color-ink-soft)' }}>
                    {deck.type === 'review'
                        ? 'Nothing due for review — come back later.'
                        : 'Try a different deck.'}
                </p>
            </div>
        );
    }

    const feedbackColor = feedback.tone === 'green'
        ? 'var(--color-success-deep)'
        : feedback.tone === 'red'
            ? 'var(--color-danger-deep)'
            : 'var(--color-ink-soft)';

    return (
        <div className={`quiz-box us-states-quiz-box ${flashColor ? `flash-${flashColor}` : ''}`}>
            <div className="quiz-topbar">
                <button className="back-button" onClick={handleBack} aria-label="Back">
                    <Icon name="arrow_back" />
                </button>
                <span className="ui-pill ui-pill--primary">
                    <Icon name="local_fire_department" /> Streak {streak}
                    {streak > 0 && <span className="streak-mult">×{streakMultiplier(streak).toFixed(1)}</span>}
                </span>
                <ScoreBubble score={score} icon="star" />
                <span className="ui-pill ui-pill--accent" aria-label={`Sub-mode: ${activeMode}`}>
                    <Icon name={isMap ? 'map' : isFlags ? 'flag' : 'location_city'} />
                    {' '}
                    {isMap ? 'Map' : isFlags ? 'Flag' : 'Capital'}
                </span>
            </div>

            <MasteryMeter streak={masteryStreak} />

            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', width: '100%' }}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`${current.code}-${activeMode}`}
                        className="us-states-prompt"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={springs.gentle}
                    >
                        {isFlags ? (
                            <>
                                <img
                                    src={`${FLAG_IMAGE_BASE}${current.code}.svg`}
                                    alt=""
                                    className="flag-image us-state-flag"
                                />
                                <p className="menu-subtitle capitals-subtitle">Which state has this flag?</p>
                            </>
                        ) : (
                            <>
                                <h2 className="capitals-country">{current.name}</h2>
                                <p className="menu-subtitle capitals-subtitle">
                                    {isMap ? 'Tap this state on the map.' : "What is its capital?"}
                                </p>
                            </>
                        )}
                    </motion.div>
                </AnimatePresence>
                <AnimatePresence>
                    {answered && flashColor === 'correct' && (
                        <motion.div
                            initial={{ x: 40, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={springs.bouncy}
                            style={{ position: 'absolute', right: 'min(2vw, 12px)', bottom: 'min(2vw, 12px)' }}
                            aria-hidden="true"
                        >
                            <Mascot size={56} mood="cheer" cosmetics={profile.cosmetics} still />
                        </motion.div>
                    )}
                    {answered && flashColor === 'incorrect' && (
                        <motion.div
                            initial={{ y: 16, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={springs.gentle}
                            style={{ position: 'absolute', right: 'min(2vw, 12px)', bottom: 'min(2vw, 12px)' }}
                            aria-hidden="true"
                        >
                            <Mascot size={56} mood="sad" cosmetics={profile.cosmetics} still />
                        </motion.div>
                    )}
                    {xpGain && (
                        <motion.div
                            className={`xp-gain ${xpGain.amount < 0 ? 'xp-gain--neg' : ''}`}
                            initial={{ x: '-50%', y: 8, opacity: 0, scale: 0.9 }}
                            animate={{ x: '-50%', y: -18, opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={springs.bouncy}
                            style={{ position: 'absolute', left: '50%', top: 'min(2vw, 12px)' }}
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
            </div>

            <div className="feedback-label" style={{ color: feedbackColor }} aria-live="polite">
                <div className="feedback-row">
                    {flashColor === 'correct' && <Icon name="check_circle" variant="correct" size="lg" pop />}
                    {flashColor === 'incorrect' && <Icon name="cancel" variant="incorrect" size="lg" pop />}
                    <span>{feedback.text}</span>
                </div>
                {feedback.answer && <span className="feedback-answer">{feedback.answer}</span>}
            </div>

            {isMap ? (
                <div className="us-map-wrap">
                    <UsMap
                        highlightedCode={null}
                        answerCode={answered ? current.code : null}
                        chosenCode={chosenCode}
                        onPick={handleMapPick}
                        disabled={answered}
                        revealCode={answered ? current.code : null}
                    />
                </div>
            ) : (
                <div className="options-box">
                    {options.map((option, i) => {
                        const correctText = isCapitals ? current.capital : current.name;
                        return (
                            <div className="choice-wrap" key={`${current.code}-${option}`}>
                                <ChoiceCard
                                    label={option}
                                    index={i}
                                    state={getChoiceState(option)}
                                    disabled={answered}
                                    onSelect={handleOptionPick}
                                />
                                <AnimatePresence>
                                    {showConfetti && option === correctText && (
                                        <Confetti pieces={16} radius={110} />
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="quiz-actions">
                <button type="button" onClick={handleSkip} disabled={answered} className="skip-button">
                    Skip
                </button>
            </div>

            <ChestReveal
                open={!!chest}
                rarity={chest?.rarity || 'common'}
                bucks={chest?.bucks || 0}
                title="United States run complete!"
                subtitle={`${score} correct · streak ${bestStreak}`}
                showRarity
                onClose={() => { setChest(null); navigateBack(); }}
            />
        </div>
    );
}

export default UnitedStatesQuiz;
