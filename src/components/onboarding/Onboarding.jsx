import React, { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'framer-motion';
import Icon from '../common/Icon';
import { ChoiceCard } from '../ui/index';
import Mascot from '../../assets/illustrations/Mascot';
import { useAudio } from '../../audio/AudioProvider';
import { useProfile } from '../../lib/profile';
import { springs } from '../../motion/index';

// First-run interactive tour. Walks a brand-new player through two guided
// Multiple Choice rounds (with a hint) and then points out the rest of the home
// screen with coach-marks. Every step is skippable.
//
// IMPORTANT: this is a *demo*. It mutates NOTHING — no XP, bucks, streaks, flag
// stats, quests, or battlepass metrics. It runs on a fixed two-flag deck so it's
// deterministic and can't feed the very systems (like the mastery-gated pass)
// the player hasn't unlocked yet. That's why it's a dedicated flow rather than a
// reuse of MultipleChoiceQuiz (which awards on every answer + auto-advances).

const IMAGE_BASE_URL = './assets/flags/';

// Iconic, unmistakable flags so a first-timer can't trip on lookalikes.
const TUTORIAL_DECK = [
    { code: 'jp', name: 'Japan',  options: ['Brazil', 'Japan', 'Canada', 'France'] },
    { code: 'ca', name: 'Canada', options: ['Italy', 'Germany', 'Canada', 'Australia'] },
];

// Step script — module-level so each entry keeps a stable identity (the coach
// measurement effect keys its target lookup off the active step).
const STEPS = [
    { kind: 'intro' },
    { kind: 'mc', round: 0 },
    { kind: 'mc', round: 1 },
    { kind: 'bridge' },
    {
        kind: 'coach', target: '.pet-panel', icon: 'pets',
        title: 'Meet Atlas',
        body: 'Your globe buddy. Answering flags earns XP and levels Atlas up — keep it fed and happy as you play.',
    },
    {
        kind: 'coach', target: "[data-tour='modes']", icon: 'sports_esports',
        title: 'Pick a mode',
        body: 'Multiple Choice, Free Response, Globe and more live here. Start with Multiple Choice any time.',
    },
    {
        kind: 'coach', target: "[data-tour='topbar']", icon: 'paid',
        title: 'Bucks & Quests',
        body: 'Earn Atlas Bucks from your runs and spend them in the store. Daily Quests up here pay bonus rewards.',
    },
    { kind: 'outro' },
];

const CARD_COPY = {
    intro: {
        icon: 'flag',
        title: 'Welcome to Flag Game!',
        body: 'Learn the flags of the world through quick quizzes. Let’s play two warm-up questions together — it only takes a minute.',
    },
    bridge: {
        icon: 'check_circle',
        title: 'That’s Multiple Choice!',
        body: 'See a flag, pick the country. Correct answers build streaks, earn XP, and feed Atlas. Now here’s the rest of your home screen.',
    },
    outro: {
        icon: 'rocket_launch',
        title: 'You’re all set!',
        body: 'Keep mastering flags — reach 20 mastered to unlock the Reptile Kingdom Pass and its dragon-themed rewards. Have fun exploring the world!',
    },
};

// Position a coach tooltip relative to a target rect, clamped to the viewport.
function tooltipStyle(rect, placeBelow) {
    const margin = 14;
    const vw = typeof window !== 'undefined' ? window.innerWidth : 360;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 640;
    const width = Math.min(340, vw - margin * 2);
    if (!rect) {
        return { left: '50%', top: '50%', width, transform: 'translate(-50%, -50%)' };
    }
    let left = rect.left + rect.width / 2 - width / 2;
    left = Math.max(margin, Math.min(left, vw - width - margin));
    if (placeBelow) {
        return { left, top: rect.top + rect.height + margin, width };
    }
    // Anchor by bottom edge so we don't need to know the tooltip's height.
    return { left, bottom: vh - (rect.top - margin), width };
}

export default function Onboarding({ onClose }) {
    const audio = useAudio();
    const profile = useProfile();
    const prefersReduced = useReducedMotion();
    const [stepIndex, setStepIndex] = useState(0);
    const [mc, setMc] = useState({ answered: false, chosen: null });
    const [hintOpen, setHintOpen] = useState(true);
    const [rect, setRect] = useState(null);

    const step = STEPS[stepIndex];
    const deck = step.kind === 'mc' ? TUTORIAL_DECK[step.round] : null;

    const finish = useCallback(() => { onClose?.(); }, [onClose]);
    const back = useCallback(() => setStepIndex((i) => Math.max(0, i - 1)), []);
    const next = useCallback(() => {
        setStepIndex((i) => {
            if (i >= STEPS.length - 1) { finish(); return i; }
            return i + 1;
        });
    }, [finish]);

    // Reset per-round answer state on every step change. Round 0 reveals the
    // hint up-front (max hand-holding); round 1 hides it behind a tap so the
    // player gets to try on their own first.
    useEffect(() => {
        const s = STEPS[stepIndex];
        setMc({ answered: false, chosen: null });
        setHintOpen(s.kind === 'mc' ? s.round === 0 : true);
    }, [stepIndex]);

    // Coach steps: scroll the target into view and track its rect (kept fresh on
    // scroll/resize). Re-measuring on scroll never re-scrolls, so there's no loop.
    useLayoutEffect(() => {
        const s = STEPS[stepIndex];
        if (s.kind !== 'coach') { setRect(null); return undefined; }
        const el = document.querySelector(s.target);
        if (!el) { setRect(null); return undefined; }
        const measure = () => {
            const r = el.getBoundingClientRect();
            setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
        };
        el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'auto' });
        const raf = requestAnimationFrame(measure);
        window.addEventListener('resize', measure);
        window.addEventListener('scroll', measure, true);
        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('resize', measure);
            window.removeEventListener('scroll', measure, true);
        };
    }, [stepIndex]);

    const nextDisabled = step.kind === 'mc' && !mc.answered;

    // Enter advances (once the current round is answered); Escape skips.
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape') { e.preventDefault(); finish(); return; }
            if (e.key === 'Enter') {
                const s = STEPS[stepIndex];
                // Block the default (and don't advance) until the round is answered.
                if (s.kind === 'mc' && !mc.answered) { e.preventDefault(); return; }
                e.preventDefault();
                next();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [stepIndex, mc.answered, finish, next]);

    const onPick = (label) => {
        if (!deck || mc.answered) return;
        const correct = label === deck.name;
        audio.play(correct ? 'correct' : 'incorrect');
        setMc({ answered: true, chosen: label });
    };

    const choiceState = (option) => {
        if (!mc.answered) return 'idle';
        if (option === deck.name) return 'correct';
        if (option === mc.chosen) return 'incorrect';
        return 'idle';
    };

    const nextLabel =
        step.kind === 'intro' ? 'Start tour'
        : step.kind === 'outro' ? 'Start playing'
        : step.kind === 'bridge' ? 'Show me around'
        : step.kind === 'mc' ? (mc.answered ? 'Next' : 'Pick an answer')
        : 'Got it';

    const renderControls = (compact) => (
        <div className={`tour-controls ${compact ? 'tour-controls--compact' : ''}`}>
            <button type="button" className="tour-skip" onClick={finish}>Skip tour</button>
            <div className="tour-dots" aria-hidden="true">
                {STEPS.map((_, i) => (
                    <span
                        key={i}
                        className={`tour-dot ${i === stepIndex ? 'is-active' : ''} ${i < stepIndex ? 'is-done' : ''}`}
                    />
                ))}
            </div>
            <div className="tour-nav">
                {stepIndex > 0 && (
                    <button type="button" className="tour-btn tour-btn--ghost" onClick={back}>Back</button>
                )}
                <button type="button" className="tour-btn tour-btn--primary" onClick={next} disabled={nextDisabled}>
                    {nextLabel}
                </button>
            </div>
        </div>
    );

    const renderCard = () => {
        const c = CARD_COPY[step.kind];
        return (
            <div className="tour-scrim tour-scrim--card">
                <motion.div
                    className="tour-card"
                    initial={prefersReduced ? false : { opacity: 0, y: 16, scale: 0.96 }}
                    animate={prefersReduced ? false : { opacity: 1, y: 0, scale: 1 }}
                    transition={springs.gentle}
                >
                    <div className="tour-card__mascot">
                        <Mascot size={96} mood="cheer" cosmetics={profile.cosmetics} still />
                    </div>
                    <span className="tour-card__icon"><Icon name={c.icon} /></span>
                    <h2 className="tour-card__title">{c.title}</h2>
                    <p className="tour-card__body">{c.body}</p>
                    {renderControls(false)}
                </motion.div>
            </div>
        );
    };

    const renderMc = () => (
        <div className="tour-scrim tour-scrim--stage">
            <div className="tour-stage">
                <span className="tour-badge">
                    <Icon name="quiz" /> Multiple Choice · Round {step.round + 1} of 2
                </span>
                <div className="quiz-box tour-quiz">
                    <img src={`${IMAGE_BASE_URL}${deck.code}.svg`} alt="Flag" className="flag-image" />

                    <div
                        className="feedback-label"
                        aria-live="polite"
                        style={{ color: mc.answered && mc.chosen === deck.name ? 'var(--color-success-deep)' : 'var(--color-ink-soft)' }}
                    >
                        {!mc.answered ? (
                            <span>Which country owns this flag?</span>
                        ) : mc.chosen === deck.name ? (
                            <div className="feedback-row">
                                <Icon name="check_circle" variant="correct" size="lg" pop />
                                <span>Correct — that’s {deck.name}! 🎉</span>
                            </div>
                        ) : (
                            <div className="feedback-row">
                                <Icon name="cancel" variant="incorrect" size="lg" pop />
                                <span>That’s {mc.chosen}. This flag belongs to {deck.name} — now you know!</span>
                            </div>
                        )}
                    </div>

                    <div className="options-box">
                        {deck.options.map((option, i) => (
                            <div
                                className={`choice-wrap ${hintOpen && !mc.answered && option === deck.name ? 'tour-hint-target' : ''}`}
                                key={option}
                            >
                                <ChoiceCard
                                    label={option}
                                    index={i}
                                    state={choiceState(option)}
                                    disabled={mc.answered}
                                    onSelect={onPick}
                                />
                            </div>
                        ))}
                    </div>

                    {!mc.answered && (
                        <div className="tour-hint">
                            {hintOpen ? (
                                <span className="tour-hint__text">
                                    <Icon name="lightbulb" /> Tip: it’s <strong>{deck.name}</strong> — tap the highlighted answer.
                                </span>
                            ) : (
                                <button type="button" className="tour-hint__toggle" onClick={() => setHintOpen(true)}>
                                    <Icon name="lightbulb" /> Need a hint?
                                </button>
                            )}
                        </div>
                    )}
                </div>
                {renderControls(false)}
            </div>
        </div>
    );

    const renderCoach = () => {
        const vh = typeof window !== 'undefined' ? window.innerHeight : 640;
        const placeBelow = !rect || (rect.top + rect.height + 250 <= vh);
        return (
            <>
                <div className="tour-blocker" />
                {rect ? (
                    <div
                        className="tour-spotlight"
                        style={{ top: rect.top - 8, left: rect.left - 8, width: rect.width + 16, height: rect.height + 16 }}
                        aria-hidden="true"
                    />
                ) : (
                    <div className="tour-scrim--dim" aria-hidden="true" />
                )}
                <motion.div
                    className={`tour-tooltip ${placeBelow ? 'is-below' : 'is-above'}`}
                    style={tooltipStyle(rect, placeBelow)}
                    initial={prefersReduced ? false : { opacity: 0 }}
                    animate={prefersReduced ? false : { opacity: 1 }}
                    transition={{ duration: 0.18 }}
                >
                    <span className="tour-tooltip__icon"><Icon name={step.icon} /></span>
                    <h3 className="tour-tooltip__title">{step.title}</h3>
                    <p className="tour-tooltip__body">{step.body}</p>
                    {renderControls(true)}
                </motion.div>
            </>
        );
    };

    return createPortal(
        <div className="tour-root" role="dialog" aria-modal="true" aria-label="Getting started tour">
            {step.kind === 'coach' ? renderCoach() : step.kind === 'mc' ? renderMc() : renderCard()}
        </div>,
        document.body
    );
}
