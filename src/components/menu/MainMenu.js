import React, { useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import Icon from '../common/Icon';
import Logo from '../../assets/illustrations/Logo';
import Mascot from '../../assets/illustrations/Mascot';
import BackgroundBlobs from '../../assets/illustrations/BackgroundBlobs';
import WorldDots from '../../assets/illustrations/WorldDots';
import Scene, { isCustomScene } from '../../assets/illustrations/Scene';
import PetPanel from '../profile/PetPanel';
import BattlepassCard from '../economy/BattlepassCard';
import { Modal, Button } from '../ui/index';
import { useToast } from '../ui/Toast';
import { useAudio } from '../../audio/AudioProvider';
import { useAuth } from '../../auth/AuthProvider';
import { api } from '../../api/client';
import { usePet } from '../../lib/pet';
import { useProfile } from '../../lib/profile';
import { useQuests, claimableCount } from '../../lib/quests';
import { getStreak } from '../../lib/streak';
import { useWaters, getWaterMasteredCount, getWaterTotal } from '../../lib/waters';
import { GLOBE_RENDERABLE_ISO2 } from '../../lib/achievements';
import { MASTERY_STREAK } from '../../lib/xp';
import { springs } from '../../motion/index';

// Flags a player must master before the Reptile Kingdom Pass appears on the home
// screen — keeping the first-run UI calm and tying the pass to the learning loop.
// Mirrors MASTERY_GATE in server/routes/battlepass.js (the server enforces it on
// every claim/buy, so this is purely about when to surface the card).
const PASS_MASTERY_GATE = 20;

// Number of consecutive title taps that exposes the hidden admin password
// prompt, and the no-tap window after which the counter resets so normal
// clicks don't accumulate over the course of a session.
const ADMIN_TAPS_REQUIRED = 5;
const ADMIN_TAP_WINDOW_MS = 3000;

const SECTIONS = [
    {
        key: 'play',
        label: 'Play',
        modes: [
            { key: 'multiple-choice', title: 'Multiple Choice', desc: 'Pick from four options',         icon: 'quiz',          tone: 'primary' },
            { key: 'free-response',   title: 'Free Response',   desc: 'Type the country name',          icon: 'edit_note',     tone: 'success' },
            { key: 'globe',           title: 'Globe',           desc: 'Find the country on a 3D globe', icon: 'public',        tone: 'info'    },
            { key: 'bodies-of-water', title: 'Bodies of Water', desc: 'Name seas, lakes & rivers on the globe', icon: 'waves',  tone: 'info'    },
            { key: 'bonus',           title: 'Bonus Modes',     desc: 'Frenzy, Pixelated, Language…',   icon: 'rocket_launch', tone: 'purple'  },
        ],
    },
    {
        key: 'compete',
        label: 'Compete',
        modes: [
            { key: 'multiplayer', title: 'Multiplayer', desc: 'Host a lobby, race friends live', icon: 'sports_esports', tone: 'versus' },
            { key: 'leaderboard', title: 'Leaderboard', desc: 'Compete on the global ranks',     icon: 'leaderboard',    tone: 'info'   },
            { key: 'friends',     title: 'Friends',     desc: 'Add friends, compare progress',   icon: 'group',          tone: 'danger' },
        ],
    },
    {
        key: 'you',
        label: 'You',
        modes: [
            { key: 'quests',       title: 'Quests',       desc: 'Daily + weekly Atlas Bucks bounties', icon: 'task_alt',     tone: 'success' },
            { key: 'achievements', title: 'Achievements', desc: 'Earn badges and mastery ranks',        icon: 'emoji_events', tone: 'accent'  },
            { key: 'statistics',   title: 'Statistics',   desc: 'Your progress and high scores',        icon: 'insights',     tone: 'neutral' },
        ],
    },
];

function ModeCard({ mode, onClick, index, masteryHint, streak }) {
    const audio = useAudio();
    const prefersReduced = useReducedMotion();
    return (
        <motion.button
            className={`mode-card tone-${mode.tone}`}
            onClick={() => { audio.play('click'); onClick(); }}
            initial={prefersReduced ? false : { opacity: 0, y: 24 }}
            animate={prefersReduced ? false : { opacity: 1, y: 0 }}
            transition={{ ...springs.gentle, delay: 0.1 + index * 0.06 }}
            whileHover={prefersReduced ? undefined : { y: -3 }}
            whileTap={prefersReduced ? undefined : { scale: 0.97 }}
            aria-label={mode.title}
        >
            {masteryHint && <div className="mode-card__badge">{masteryHint}</div>}
            {streak > 0 && (
                <div className="mode-card__streak" title={`${streak} answer streak`}>
                    <Icon name="local_fire_department" /> {streak}
                </div>
            )}
            <div className="mode-card__title">{mode.title}</div>
            <div className="mode-card__desc">{mode.desc}</div>
            <Icon name={mode.icon} className="mode-card__icon" />
        </motion.button>
    );
}

function MainMenu({ setView, flagsData, setQuizMode }) {
    const pet = usePet();
    const profile = useProfile();
    const toast = useToast();
    const { isAuthed, refresh } = useAuth();
    // Subscribe to quests so the "Quests" card shows a live claimable count.
    useQuests();
    const questsClaimable = claimableCount();
    // Subscribe to the water store so the Bodies-of-Water card's mastery badge
    // ticks up live as bodies are mastered.
    useWaters();
    const waterTotal = getWaterTotal();
    const waterMasteryHint = waterTotal > 0 ? `${getWaterMasteredCount()}/${waterTotal} mastered` : null;
    // Flag-recognition mastery (MC / FR / bonus modes share this streak). The
    // raw count gates the Reptile Kingdom Pass card below; the hint string drives
    // the hero pill + the per-mode card badges.
    const masteredCount = useMemo(
        () => (flagsData?.length ? flagsData.filter(f => (f.streak || 0) > MASTERY_STREAK).length : 0),
        [flagsData]
    );
    const masteryHint = useMemo(
        () => (flagsData?.length ? `${masteredCount}/${flagsData.length} mastered` : null),
        [flagsData, masteredCount]
    );

    // Geography mastery — Globe mode tracks its own per-flag streak and can
    // only ask about flags whose ISO-A2 has a Natural Earth polygon, so the
    // denominator is the renderable subset, not the whole catalog.
    const globeMasteryHint = useMemo(() => {
        if (!flagsData?.length) return null;
        const eligible = flagsData.filter(f => GLOBE_RENDERABLE_ISO2.has((f.code || '').toUpperCase()));
        const mastered = eligible.filter(f => (f.geoStreak || 0) > MASTERY_STREAK).length;
        return `${mastered}/${eligible.length} mastered`;
    }, [flagsData]);

    // Hidden admin promotion: tap the "Flag Game" title five times within a
    // short window to expose the password prompt. Stealth-gated to authed
    // users so a guest tap-mashing the title never even sees the modal.
    const tapCountRef = useRef(0);
    const tapTimerRef = useRef(null);
    const [adminOpen, setAdminOpen] = useState(false);
    const [adminPassword, setAdminPassword] = useState('');
    const [adminBusy, setAdminBusy] = useState(false);

    const onTitleTap = () => {
        if (!isAuthed) return;
        if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
        tapCountRef.current += 1;
        if (tapCountRef.current >= ADMIN_TAPS_REQUIRED) {
            tapCountRef.current = 0;
            setAdminOpen(true);
            return;
        }
        tapTimerRef.current = setTimeout(() => { tapCountRef.current = 0; }, ADMIN_TAP_WINDOW_MS);
    };

    const closeAdmin = () => {
        setAdminOpen(false);
        setAdminPassword('');
    };

    const submitAdmin = async () => {
        if (adminBusy || !adminPassword) return;
        setAdminBusy(true);
        try {
            await api.post('/auth/claim-admin', { password: adminPassword });
            toast.success('Admin access granted.');
            await refresh();
            closeAdmin();
        } catch (err) {
            toast.danger(err.message || 'Wrong password.');
        } finally {
            setAdminBusy(false);
        }
    };

    const handleStartQuiz = (mode) => {
        setQuizMode(mode);
        setView('quiz-menu');
    };

    const onCardClick = (modeKey) => {
        if (modeKey === 'multiple-choice' || modeKey === 'free-response' || modeKey === 'globe') {
            handleStartQuiz(modeKey);
        } else if (modeKey === 'bodies-of-water') {
            // Standalone mode — straight into the quiz, no deck picker.
            setView('bodies-of-water');
        } else if (modeKey === 'multiplayer') {
            setView('multiplayer');
        } else if (modeKey === 'bonus') {
            setView('bonus-menu');
        } else if (modeKey === 'leaderboard') {
            setView('leaderboard');
        } else if (modeKey === 'achievements') {
            setView('achievements');
        } else if (modeKey === 'quests') {
            setView('quests');
        } else if (modeKey === 'friends') {
            setView('friends');
        } else if (modeKey === 'statistics') {
            setView('statistics');
        }
    };

    const sceneId = profile.cosmetics?.scene || 'default';
    const hasScene = isCustomScene(sceneId);

    return (
        <div className="main-menu-box">
            <section
                className={`hero-band ${hasScene ? 'hero-band--scene' : ''}`}
                data-scene={sceneId}
                aria-labelledby="main-menu-title"
            >
                {hasScene ? (
                    <Scene id={sceneId} />
                ) : (
                    <>
                        <BackgroundBlobs density="normal" />
                        <div style={{ color: 'var(--color-primary-deep)', position: 'absolute', inset: 0, zIndex: 1 }}>
                            <WorldDots opacity={0.18} />
                        </div>
                    </>
                )}
                <div className="hero-band__logo-row">
                    <Logo size={56} />
                    {/* Tapping the title is the only entry point to the hidden admin
                        password prompt; the heading stays a plain <h1> for screen
                        readers (no role/aria), so the easter egg is invisible. */}
                    <h1
                        id="main-menu-title"
                        className="menu-title hero-band__title"
                        onClick={onTitleTap}
                        style={{ cursor: isAuthed ? 'pointer' : undefined, userSelect: 'none' }}
                    >Flag Game</h1>
                </div>
                <p className="menu-subtitle hero-band__subtitle">
                    Master 200+ world flags with spaced repetition, frenzy challenges, and pixel reveals.
                </p>
                <div style={{ position: 'relative', zIndex: 2, marginTop: 'var(--space-xs)' }}>
                    <Mascot size={92} mood={pet.mood} cosmetics={profile.cosmetics} chubby={pet.obese} bruised={pet.bruised} />
                </div>
                {masteryHint && (
                    <div className="knowledge-stats" style={{ position: 'relative', zIndex: 2 }}>
                        <span className="ui-pill ui-pill--primary">
                            <Icon name="star" /> {masteryHint}
                        </span>
                    </div>
                )}
            </section>

            <PetPanel setView={setView} />

            {/* Atlas Pass — hero card that spans the menu width via its own
                .mode-card--xl rules. Lives in its own .mode-grid so it isn't
                forced into a section column. Hidden until the player has mastered
                PASS_MASTERY_GATE flags so newcomers aren't met with a wall of
                progression UI before they've learned anything; the server also
                refuses any claim/buy below the gate. */}
            {masteredCount >= PASS_MASTERY_GATE && (
                <div className="mode-grid">
                    <BattlepassCard onClick={() => setView('battlepass')} index={0} />
                </div>
            )}

            {SECTIONS.map((section, sIdx) => (
                <section
                    key={section.key}
                    className="menu-section"
                    data-tour={section.key === 'play' ? 'modes' : undefined}
                >
                    <h2 className="section-heading">{section.label}</h2>
                    <div className="mode-grid">
                        {section.modes.map((mode, i) => (
                            <ModeCard
                                key={mode.key}
                                mode={mode}
                                index={sIdx * 10 + i + 1}
                                onClick={() => onCardClick(mode.key)}
                                masteryHint={
                                    mode.key === 'multiple-choice' || mode.key === 'free-response'
                                        ? masteryHint
                                        : mode.key === 'globe'
                                            ? globeMasteryHint
                                            : mode.key === 'bodies-of-water'
                                                ? waterMasteryHint
                                                : mode.key === 'quests' && questsClaimable > 0
                                                    ? `${questsClaimable} ready to claim`
                                                    : null
                                }
                                streak={(mode.key === 'multiple-choice' || mode.key === 'free-response' || mode.key === 'globe' || mode.key === 'bodies-of-water') ? getStreak(mode.key) : 0}
                            />
                        ))}
                    </div>
                </section>
            ))}

            <Modal open={adminOpen} onClose={closeAdmin} title="Enter Admin Password">
                <p className="auth-hint">Grant this account admin access.</p>
                <input
                    type="password"
                    className="auth-field__input"
                    value={adminPassword}
                    autoFocus
                    placeholder="Password"
                    onChange={(e) => setAdminPassword(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') submitAdmin(); }}
                />
                <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'flex-end' }}>
                    <Button variant="secondary" onClick={closeAdmin} disabled={adminBusy}>Cancel</Button>
                    <Button variant="primary" icon="check" onClick={submitAdmin} disabled={adminBusy || !adminPassword}>
                        Submit
                    </Button>
                </div>
            </Modal>
        </div>
    );
}

export default MainMenu;
