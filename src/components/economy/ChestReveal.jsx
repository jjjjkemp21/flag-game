import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { Button } from '../ui/index';
import Icon from '../common/Icon';
import Confetti from '../../assets/illustrations/Confetti';
import AtlasBucksIcon from '../../assets/illustrations/AtlasBucks';
import TreasureChest, { CHEST_PALETTES } from '../../assets/illustrations/TreasureChest';
import { useAudio } from '../../audio/AudioProvider';
import { springs } from '../../motion/index';

// Confetti volume scales with rarity so a Legendary feels meaningfully bigger
// than a Common without making Common feel under-celebrated.
const CONFETTI_FOR = { common: 16, rare: 28, epic: 44, legendary: 64 };

const RARITY_LABEL = {
    common: 'COMMON',
    rare: 'RARE',
    epic: 'EPIC',
    legendary: 'LEGENDARY!',
};

// Total taps the player must land on the chest before it bursts open.
const TAPS_TO_OPEN = 3;

// Shared reveal modal — three-phase choreography: drop in → tap-to-shake
// (anticipation, player drives the pace by clicking the chest) →
// burst-and-count-up. Used by the daily login chest, quest claims, and
// end-of-run chest.
//
// Props:
//   open       boolean — controls visibility
//   rarity     'common' | 'rare' | 'epic' | 'legendary'
//   bucks      payout to count up to
//   title      headline above the chest ("Day 3 chest", "Quest reward", etc.)
//   subtitle   optional secondary line
//   showRarity render the RARITY label (used by run-end chest, hidden on login chest)
//   onClose    fires when the player taps Continue (or backdrop)
export default function ChestReveal({
    open,
    rarity = 'common',
    bucks = 0,
    title,
    subtitle,
    showRarity = true,
    onClose,
}) {
    const audio = useAudio();
    // Phases: 'idle' (waiting for player taps), 'burst' (lid pops + confetti
    // + count-up), 'rest' (Continue button enabled).
    const [phase, setPhase] = useState('idle');
    const [tapsRemaining, setTapsRemaining] = useState(TAPS_TO_OPEN);
    const [displayBucks, setDisplayBucks] = useState(0);

    const palette = CHEST_PALETTES[rarity] || CHEST_PALETTES.common;
    const confettiPieces = CONFETTI_FOR[rarity] || CONFETTI_FOR.common;

    // Imperative animation controls — each tap fires a one-shot shake,
    // and the final tap fires the launch+ajar physics arc. Driving these
    // imperatively (instead of via animate-prop diffing) makes repeated
    // shakes restart cleanly each click.
    const lidControls = useAnimation();
    const wrapControls = useAnimation();

    // Reset on every open so re-opening shows the full sequence.
    useEffect(() => {
        if (!open) return;
        setPhase('idle');
        setTapsRemaining(TAPS_TO_OPEN);
        setDisplayBucks(0);
        lidControls.set({ rotate: 0, y: 0 });
        wrapControls.set({ x: 0 });
    }, [open, lidControls, wrapControls]);

    // Schedule rest after burst so the Continue button activates.
    useEffect(() => {
        if (phase !== 'burst') return undefined;
        const t = setTimeout(() => setPhase('rest'), 900);
        return () => clearTimeout(t);
    }, [phase]);

    // Count-up — runs during burst, 600ms total. Eases out so the last digits
    // tick more slowly (the satisfying "settle" beat).
    useEffect(() => {
        if (phase !== 'burst' || bucks <= 0) {
            if (phase === 'rest') setDisplayBucks(bucks);
            return undefined;
        }
        const startAt = performance.now();
        const dur = 600;
        let raf = 0;
        const tick = (now) => {
            const t = Math.min(1, (now - startAt) / dur);
            const eased = 1 - Math.pow(1 - t, 3);
            setDisplayBucks(Math.round(bucks * eased));
            if (t < 1) raf = requestAnimationFrame(tick);
            else setDisplayBucks(bucks);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [phase, bucks]);

    // Tap handler — each click shakes the chest a little harder; the last
    // click triggers the lid's launch+ajar physics arc. Pivot is at the
    // lid's bottom-center (set inside TreasureChest), so rotation tips
    // the lid like a balanced plate rather than swinging it sideways.
    const handleChestTap = useCallback(() => {
        if (phase !== 'idle') return;

        const remainingAfter = tapsRemaining - 1;
        setTapsRemaining(remainingAfter);

        if (remainingAfter > 0) {
            // Anticipation shake — intensity ramps up with each tap so the
            // player feels the chest "loading up" before it bursts. The
            // layered chest-tap sound also rises in pitch with each tap.
            const tapNumber = TAPS_TO_OPEN - remainingAfter; // 1, 2
            const rot = 4 + tapNumber * 1.5; // 5.5°, 7°
            const off = 2 + tapNumber;       // 3, 4
            const pitch = 1 + tapNumber * 0.18; // 1.18, 1.36
            audio.play('chestTap', { pitchShift: pitch });
            audio.play('chestSparkle', { pitchShift: pitch });
            lidControls.start({
                rotate: [0, -rot, rot, -rot * 0.6, rot * 0.6, 0],
                transition: { duration: 0.4, ease: 'easeInOut' },
            });
            wrapControls.start({
                x: [0, -off, off, -off * 0.6, off * 0.6, 0],
                transition: { duration: 0.4, ease: 'easeInOut' },
            });
        } else {
            // Final tap — open the chest with a richer chest-tap layered
            // under the "correct" chime so the burst feels earned.
            setPhase('burst');
            audio.play('chestTap', { pitchShift: 1.55 });
            audio.play('chestSparkle', { pitchShift: 1.55 });
            audio.play('correct');
            lidControls.start({
                rotate: [0, 3, 6],
                y: [0, -14, -3],
                transition: { duration: 0.75, times: [0, 0.56, 1], ease: ['easeOut', 'easeIn'] },
            });
        }
    }, [phase, tapsRemaining, audio, lidControls, wrapControls]);

    // Lid motion is driven imperatively via controls.
    const lidMotion = useMemo(() => ({ animate: lidControls }), [lidControls]);

    // Sparks during idle — three tiny stars hopping out from the lid edges
    // so the chest feels alive before it bursts. Hint that it's interactive.
    const sparks = phase === 'idle' ? [-1, 0, 1] : [];

    const buttonLabel =
        phase === 'rest' ? 'Continue'
        : phase === 'burst' ? 'Opening…'
        : tapsRemaining === TAPS_TO_OPEN ? 'Tap the chest!'
        : `${tapsRemaining} more tap${tapsRemaining === 1 ? '' : 's'}…`;

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="chest-reveal-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={(e) => { if (phase === 'rest' && e.target === e.currentTarget) onClose?.(); }}
                >
                    <motion.div
                        className={`chest-reveal chest-reveal--${rarity}`}
                        initial={{ scale: 0.6, y: 40, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.7, y: 20, opacity: 0 }}
                        transition={springs.bouncy}
                    >
                        {title && <h2 className="chest-reveal__title">{title}</h2>}
                        {subtitle && <p className="chest-reveal__subtitle">{subtitle}</p>}

                        <div className="chest-reveal__stage">
                            {/* Sparks during idle (invitation to tap) */}
                            <AnimatePresence>
                                {sparks.map((i) => (
                                    <motion.div
                                        key={`spark-${i}`}
                                        className="chest-reveal__spark"
                                        style={{
                                            left: `${50 + i * 22}%`,
                                            color: palette.sparkle,
                                        }}
                                        initial={{ opacity: 0, y: 0, scale: 0.6 }}
                                        animate={{
                                            opacity: [0, 1, 0],
                                            y: [-4, -22, -32],
                                            scale: [0.6, 1, 0.5],
                                        }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 1.0, repeat: Infinity, delay: i * 0.18, ease: 'easeOut' }}
                                    >
                                        <Icon name="auto_awesome" />
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {/* The chest itself — click to advance */}
                            <motion.button
                                type="button"
                                className="chest-reveal__chest-wrap"
                                animate={wrapControls}
                                onClick={handleChestTap}
                                disabled={phase !== 'idle'}
                                aria-label={phase === 'idle' ? `Tap the chest (${tapsRemaining} taps remaining)` : 'Chest'}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    padding: 0,
                                    cursor: phase === 'idle' ? 'pointer' : 'default',
                                }}
                            >
                                <TreasureChest size={180} rarity={rarity} lidMotion={lidMotion} open={phase !== 'idle'} />
                            </motion.button>

                            {/* Burst — confetti + light flash */}
                            <AnimatePresence>
                                {(phase === 'burst' || phase === 'rest') && (
                                    <>
                                        <motion.div
                                            className="chest-reveal__flash"
                                            style={{ background: palette.glow }}
                                            initial={{ opacity: 0, scale: 0.4 }}
                                            animate={{ opacity: [0, 0.55, 0], scale: [0.4, 1.6, 2.2] }}
                                            transition={{ duration: 0.7, ease: 'easeOut' }}
                                        />
                                        <Confetti pieces={confettiPieces} radius={120} />
                                    </>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Payout — counts up during burst phase */}
                        <motion.div
                            className="chest-reveal__payout"
                            animate={phase !== 'idle' ? { scale: [0.8, 1.12, 1] } : { scale: 1 }}
                            transition={{ duration: 0.55, ease: [0.18, 0.89, 0.32, 1.28] }}
                        >
                            <AtlasBucksIcon size={32} />
                            <span className="chest-reveal__payout-num">
                                +{displayBucks.toLocaleString()}
                            </span>
                        </motion.div>

                        {showRarity && (phase === 'burst' || phase === 'rest') && (
                            <motion.div
                                className={`chest-reveal__rarity chest-reveal__rarity--${rarity}`}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2, duration: 0.4 }}
                            >
                                {RARITY_LABEL[rarity] || ''}
                            </motion.div>
                        )}

                        <div className="chest-reveal__actions">
                            <Button
                                variant="primary"
                                icon="arrow_forward"
                                onClick={() => onClose?.()}
                                disabled={phase !== 'rest'}
                            >
                                {buttonLabel}
                            </Button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
