import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import Icon from './Icon';
import { Button, Modal } from './ui';
import { useToast } from './ui/Toast';
import Mascot from '../assets/illustrations/Mascot';
import AtlasBucksIcon from '../assets/illustrations/AtlasBucks';
import { useAuth } from '../auth/AuthProvider';
import { useCurrency } from '../lib/currency';
import {
    useBattlepass, loadBattlepass, buyPremium, claimReward, isClaimed,
    CHALLENGES_BY_ID, TIERS_BY_NUM, progressWithinTier,
} from '../lib/battlepass';
import { PREMIUM_PRICE, SEASON_NAME, TIER_COUNT } from '../lib/battlepassCatalog';
import { COLORS, HATS, GLASSES, EFFECTS } from '../lib/cosmetics';
import { springs } from '../motion';

// Lookup the catalog entry behind a tier's cosmetic reward so we can show its
// display name + preview swatch on the row without duplicating the catalog.
const CAT_TABLE = { color: COLORS, hat: HATS, glasses: GLASSES, effect: EFFECTS };
function cosmeticName(cat, id) {
    const entry = CAT_TABLE[cat] && CAT_TABLE[cat][id];
    return entry ? entry.name : id;
}
function categoryIcon(cat) {
    return ({ color: 'palette', hat: 'theater_comedy', glasses: 'eyeglasses', effect: 'auto_awesome' })[cat] || 'redeem';
}

// Reward chip rendered on a tier card. Bucks → coin + amount; cosmetic → mini
// Mascot preview with the item equipped so the player can see what they're
// unlocking before they claim it.
function RewardChip({ reward, dim }) {
    if (!reward) return null;
    if (reward.type === 'bucks') {
        return (
            <span className={`bp-reward ${dim ? 'bp-reward--dim' : ''}`}>
                <AtlasBucksIcon size={18} />
                <span className="bp-reward__amt">{reward.amount.toLocaleString()}</span>
            </span>
        );
    }
    if (reward.type === 'cosmetic') {
        // Color rewards preview on the globe itself; other slots layer on top of
        // the player's current globe colour so the hat/glasses are visible.
        const cos = reward.cat === 'color'
            ? { color: reward.id, hat: 'none', glasses: 'none', effect: 'none' }
            : { color: 'teal', hat: 'none', glasses: 'none', effect: 'none', [reward.cat]: reward.id };
        return (
            <span className={`bp-reward bp-reward--cos ${dim ? 'bp-reward--dim' : ''}`}>
                <span className="bp-reward__avatar"><Mascot size={42} mood="idle" cosmetics={cos} still /></span>
                <span className="bp-reward__meta">
                    <span className="bp-reward__cat"><Icon name={categoryIcon(reward.cat)} /> {reward.cat}</span>
                    <span className="bp-reward__name">{cosmeticName(reward.cat, reward.id)}</span>
                </span>
            </span>
        );
    }
    return null;
}

// Single tier row: tier badge in the middle, free reward left, premium right.
// Each side has its own state — locked / unlocked-claimable / claimed.
function TierRow({ tier, def, currentTier, ownsPass, onClaim, claimingKey }) {
    const prefersReduced = useReducedMotion();
    const unlocked = tier <= currentTier;
    const freeClaimed = isClaimed('free', tier);
    const premClaimed = isClaimed('prem', tier);
    const claimingFree = claimingKey === `free:${tier}`;
    const claimingPrem = claimingKey === `prem:${tier}`;

    return (
        <motion.div
            className={`bp-row ${unlocked ? 'is-unlocked' : 'is-locked'}`}
            initial={prefersReduced ? false : { opacity: 0, x: -16 }}
            animate={prefersReduced ? false : { opacity: 1, x: 0 }}
            transition={{ ...springs.gentle, delay: Math.min(0.02 * tier, 0.4) }}
        >
            <div className={`bp-row__cell bp-row__cell--free ${freeClaimed ? 'is-claimed' : ''}`}>
                <span className="bp-row__track-label"><Icon name="check_circle" /> Free</span>
                <RewardChip reward={def?.free} dim={!unlocked || freeClaimed} />
                {freeClaimed ? (
                    <span className="bp-row__chip is-on"><Icon name="check" /> Claimed</span>
                ) : (
                    <Button
                        variant={unlocked ? 'success' : 'secondary'}
                        size="sm"
                        icon={unlocked ? 'redeem' : 'lock'}
                        disabled={!unlocked || claimingFree}
                        onClick={() => onClaim('free', tier)}
                    >
                        {claimingFree ? 'Claiming…' : unlocked ? 'Claim' : 'Locked'}
                    </Button>
                )}
            </div>

            <div className={`bp-row__tier ${unlocked ? 'is-unlocked' : ''}`}>
                <span className="bp-row__tier-num">{tier}</span>
                <span className="bp-row__tier-label">Tier</span>
            </div>

            <div className={`bp-row__cell bp-row__cell--prem ${premClaimed ? 'is-claimed' : ''} ${ownsPass ? '' : 'is-pass-locked'}`}>
                <span className="bp-row__track-label bp-row__track-label--prem">
                    <Icon name="workspace_premium" /> Premium
                </span>
                <RewardChip reward={def?.prem} dim={!unlocked || premClaimed || !ownsPass} />
                {premClaimed ? (
                    <span className="bp-row__chip is-on"><Icon name="check" /> Claimed</span>
                ) : !ownsPass ? (
                    <span className="bp-row__chip is-prem-locked"><Icon name="lock" /> Pass needed</span>
                ) : (
                    <Button
                        variant={unlocked ? 'accent' : 'secondary'}
                        size="sm"
                        icon={unlocked ? 'workspace_premium' : 'lock'}
                        disabled={!unlocked || claimingPrem}
                        onClick={() => onClaim('prem', tier)}
                    >
                        {claimingPrem ? 'Claiming…' : unlocked ? 'Claim' : 'Locked'}
                    </Button>
                )}
            </div>
        </motion.div>
    );
}

function ChallengeCard({ challenge, def }) {
    const pct = def.goal > 0 ? Math.min(1, challenge.cur / def.goal) : 0;
    return (
        <div className={`bp-quest ${challenge.done ? 'is-done' : ''}`}>
            <span className="bp-quest__icon"><Icon name={def.icon} /></span>
            <span className="bp-quest__body">
                <span className="bp-quest__head">
                    <span className="bp-quest__title">{def.title}</span>
                    <span className="bp-quest__stars" aria-label={`${def.stars} battle stars`}>
                        <Icon name="star" /> {def.stars}
                    </span>
                </span>
                <span className="bp-quest__desc">{def.desc}</span>
                <span className="bp-quest__bar">
                    <span className="bp-quest__bar-fill" style={{ width: `${Math.round(pct * 100)}%` }} />
                </span>
                <span className="bp-quest__progress">
                    {challenge.done
                        ? <><Icon name="check_circle" /> Complete</>
                        : <>{Math.min(challenge.cur, def.goal).toLocaleString()} / {def.goal.toLocaleString()}</>
                    }
                </span>
            </span>
        </div>
    );
}

function BattlepassScreen({ setView }) {
    const { isAuthed, patchUser } = useAuth();
    const currency = useCurrency();
    const toast = useToast();
    const bp = useBattlepass();
    const [tab, setTab] = useState('rewards');
    const [buyOpen, setBuyOpen] = useState(false);
    const [buying, setBuying] = useState(false);
    const [claimingKey, setClaimingKey] = useState(null);
    const tiersRef = useRef(null);
    const prefersReduced = useReducedMotion();

    // Refresh on mount so the latest server-derived metrics (mp wins, high
    // scores, mastery count) land — Atlas Pass state can change outside the
    // pass screen, and the store may be stale from the last session.
    useEffect(() => {
        if (isAuthed) loadBattlepass().catch(() => {});
    }, [isAuthed]);

    // Scroll the next-unclaimed tier into view on first paint so a returning
    // player lands on their action item instead of tier 1.
    useEffect(() => {
        if (!bp.loaded || !tiersRef.current) return;
        const target = tiersRef.current.querySelector('.bp-row.is-unlocked .bp-row__chip:not(.is-on)') ||
            tiersRef.current.querySelector('.bp-row.is-unlocked');
        if (target && typeof target.scrollIntoView === 'function') {
            target.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'center' });
        }
    }, [bp.loaded, prefersReduced]);

    const tierProgress = useMemo(() => progressWithinTier(bp.stars), [bp.stars]);
    const challengesWithDef = useMemo(
        () => (bp.challenges || [])
            .map((c) => ({ challenge: c, def: CHALLENGES_BY_ID[c.id] }))
            .filter((x) => x.def),
        [bp.challenges]
    );
    const completedCount = challengesWithDef.filter(({ challenge }) => challenge.done).length;

    if (!isAuthed) {
        return (
            <div className="quiz-box bp-box">
                <div className="quiz-topbar">
                    <button className="back-button" onClick={() => setView('menu')} aria-label="Back">
                        <Icon name="arrow_back" /> Back
                    </button>
                </div>
                <div className="signin-prompt">
                    <Icon name="workspace_premium" size="xl" />
                    <h2>Atlas Pass</h2>
                    <p>Log in to grind challenges, unlock cosmetic tiers, and grab exclusive premium rewards.</p>
                    <Button variant="primary" icon="login" onClick={() => setView('login')}>Log in or sign up</Button>
                </div>
            </div>
        );
    }

    const onBuy = async () => {
        if (buying || bp.owned) return;
        if (currency.bucks < PREMIUM_PRICE) {
            toast.danger(`Need ${PREMIUM_PRICE.toLocaleString()} Atlas Bucks — trade in some XP first.`);
            return;
        }
        setBuying(true);
        try {
            const out = await buyPremium();
            patchUser({ bucks: out.bucks });
            toast.success('Atlas Pass Premium activated!');
            setBuyOpen(false);
        } catch (err) {
            toast.danger(err.message || 'Could not buy the pass right now.');
        } finally {
            setBuying(false);
        }
    };

    const onClaim = async (track, tier) => {
        const key = `${track}:${tier}`;
        if (claimingKey) return;
        setClaimingKey(key);
        try {
            const out = await claimReward(track, tier);
            patchUser({ bucks: out.bucks, ownedCosmetics: out.ownedCosmetics });
            if (out.reward?.type === 'bucks') {
                toast.success(`+${out.reward.amount.toLocaleString()} Atlas Bucks!`);
            } else if (out.reward?.type === 'cosmetic') {
                toast.success(`Unlocked ${cosmeticName(out.reward.cat, out.reward.id)}!`);
            }
        } catch (err) {
            toast.danger(err.message || 'Could not claim that.');
        } finally {
            setClaimingKey(null);
        }
    };

    const pct = bp.totalStars > 0 ? Math.min(1, bp.stars / bp.totalStars) : 0;

    return (
        <div className="quiz-box bp-box">
            <div className="quiz-topbar">
                <button className="back-button" onClick={() => setView('menu')} aria-label="Back">
                    <Icon name="arrow_back" /> Back
                </button>
            </div>

            <div className="bp-hero">
                <div className="bp-hero__bg" aria-hidden="true" />
                <div className="bp-hero__inner">
                    <span className="bp-hero__badge">
                        <Icon name="workspace_premium" /> Season Pass
                    </span>
                    <h2 className="bp-hero__title">{SEASON_NAME}</h2>
                    <p className="bp-hero__sub">
                        Complete challenges across every mode to climb tiers and unlock cosmetics.
                    </p>

                    <div className="bp-stats">
                        <div className="bp-stat">
                            <span className="bp-stat__num">{bp.tier}</span>
                            <span className="bp-stat__label">Tier · {TIER_COUNT}</span>
                        </div>
                        <div className="bp-stat">
                            <span className="bp-stat__num"><Icon name="star" /> {bp.stars.toLocaleString()}</span>
                            <span className="bp-stat__label">Battle Stars</span>
                        </div>
                        <div className="bp-stat">
                            <span className="bp-stat__num">{completedCount}/{challengesWithDef.length}</span>
                            <span className="bp-stat__label">Challenges</span>
                        </div>
                    </div>

                    <div className="bp-tier-bar" aria-label={`Tier ${bp.tier} of ${TIER_COUNT}`}>
                        <div className="bp-tier-bar__fill" style={{ width: `${Math.round(pct * 100)}%` }} />
                        {tierProgress.span > 0 && bp.tier < TIER_COUNT && (
                            <span className="bp-tier-bar__hint">
                                {tierProgress.into.toLocaleString()} / {tierProgress.span.toLocaleString()} stars to tier {bp.tier + 1}
                            </span>
                        )}
                        {bp.tier >= TIER_COUNT && (
                            <span className="bp-tier-bar__hint">Max tier reached — all rewards available.</span>
                        )}
                    </div>

                    {!bp.owned ? (
                        <div className="bp-buy">
                            <Button variant="accent" icon="workspace_premium" onClick={() => setBuyOpen(true)}>
                                Unlock Premium · {PREMIUM_PRICE.toLocaleString()} Bucks
                            </Button>
                            <span className="bp-buy__hint">
                                Free tier rewards are always claimable. Premium adds an extra reward at every tier.
                            </span>
                        </div>
                    ) : (
                        <span className="bp-owned-chip">
                            <Icon name="verified" /> Premium pass active
                        </span>
                    )}
                </div>
            </div>

            <div className="bp-tabs">
                <button
                    className={`bp-tab ${tab === 'rewards' ? 'is-active' : ''}`}
                    onClick={() => setTab('rewards')}
                >
                    <Icon name="redeem" /> Rewards
                </button>
                <button
                    className={`bp-tab ${tab === 'challenges' ? 'is-active' : ''}`}
                    onClick={() => setTab('challenges')}
                >
                    <Icon name="flag" /> Challenges
                </button>
            </div>

            <AnimatePresence mode="wait">
                {tab === 'rewards' ? (
                    <motion.div
                        key="rewards"
                        initial={prefersReduced ? false : { opacity: 0, y: 8 }}
                        animate={prefersReduced ? false : { opacity: 1, y: 0 }}
                        exit={prefersReduced ? false : { opacity: 0, y: -8 }}
                        transition={{ duration: 0.18 }}
                        className="bp-tiers"
                        ref={tiersRef}
                    >
                        {Array.from({ length: TIER_COUNT }, (_, i) => i + 1).map((tier) => (
                            <TierRow
                                key={tier}
                                tier={tier}
                                def={TIERS_BY_NUM[tier]}
                                currentTier={bp.tier}
                                ownsPass={bp.owned}
                                onClaim={onClaim}
                                claimingKey={claimingKey}
                            />
                        ))}
                    </motion.div>
                ) : (
                    <motion.div
                        key="challenges"
                        initial={prefersReduced ? false : { opacity: 0, y: 8 }}
                        animate={prefersReduced ? false : { opacity: 1, y: 0 }}
                        exit={prefersReduced ? false : { opacity: 0, y: -8 }}
                        transition={{ duration: 0.18 }}
                        className="bp-quests"
                    >
                        {challengesWithDef.map(({ challenge, def }) => (
                            <ChallengeCard key={challenge.id} challenge={challenge} def={def} />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            <Modal open={buyOpen} onClose={() => setBuyOpen(false)} title="Unlock Atlas Pass Premium">
                <p className="auth-hint">
                    Premium adds an exclusive cosmetic reward at every one of {TIER_COUNT} tiers — globe colors,
                    hats, glasses, and effects. Your free tier rewards stay available either way.
                </p>
                <div className="bp-buy-summary">
                    <span><Icon name="workspace_premium" /> Premium pass · this season</span>
                    <span className="bp-buy-summary__price">
                        <AtlasBucksIcon size={18} /> {PREMIUM_PRICE.toLocaleString()}
                    </span>
                </div>
                <p className="auth-hint">
                    Balance: <strong>{currency.bucks.toLocaleString()}</strong> Atlas Bucks
                </p>
                <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'flex-end' }}>
                    <Button variant="secondary" onClick={() => setBuyOpen(false)} disabled={buying}>Cancel</Button>
                    <Button
                        variant="accent"
                        icon="workspace_premium"
                        onClick={onBuy}
                        disabled={buying || currency.bucks < PREMIUM_PRICE}
                    >
                        {buying ? 'Activating…' : 'Buy & activate'}
                    </Button>
                </div>
            </Modal>
        </div>
    );
}

export default BattlepassScreen;
