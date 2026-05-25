import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import Icon from './Icon';
import { Button, Modal } from './ui';
import { useToast } from './ui/Toast';
import Mascot from '../assets/illustrations/Mascot';
import AtlasBucksIcon from '../assets/illustrations/AtlasBucks';
import ChallengeIcon from './ChallengeIcon';
import { useAuth } from '../auth/AuthProvider';
import { useCurrency, setBucksLocal } from '../lib/currency';
import { useProfile } from '../lib/profile';
import {
    useBattlepass, loadBattlepass, buyPremium, claimReward, claimChallenge, isClaimed,
    CHALLENGES_BY_ID, TIERS_BY_NUM, progressWithinTier,
} from '../lib/battlepass';
import { PREMIUM_PRICE, SEASON_NAME, TIER_COUNT } from '../lib/battlepassCatalog';
import { COLORS, HATS, GLASSES, EFFECTS, DEFAULT_COSMETICS } from '../lib/cosmetics';
import { springs } from '../motion';

// Look up the display name + category metadata of a reward's cosmetic so the
// stage card can label it without re-implementing the catalog.
const CAT_TABLE = { color: COLORS, hat: HATS, glasses: GLASSES, effect: EFFECTS };
function cosmeticName(cat, id) {
    return (CAT_TABLE[cat] && CAT_TABLE[cat][id] && CAT_TABLE[cat][id].name) || id;
}
function categoryLabel(cat) {
    return ({ color: 'Globe Color', hat: 'Hat', glasses: 'Glasses', effect: 'Effect' })[cat] || cat;
}
function categoryIcon(cat) {
    return ({ color: 'palette', hat: 'theater_comedy', glasses: 'eyeglasses', effect: 'auto_awesome' })[cat] || 'redeem';
}

// Tier-level rarity used to pick the stage's accent colour. Bigger numbered
// tiers get richer colours (silver → gold → dragon). Capstones (5, 10, 15,
// 20, 25) get extra-rich treatments.
function rarityOf(tier) {
    if (tier === 25)      return 'mythic';
    if (tier >= 21)       return 'legendary';
    if (tier >= 16)       return 'epic';
    if (tier >= 11)       return 'rare';
    if (tier >= 6)        return 'uncommon';
    return 'common';
}
const RARITY_HUE = {
    common:    { ring: '#7FE0A8', glow: '#19C37D', soft: '#D4F5E5' },
    uncommon:  { ring: '#A8E5D8', glow: '#2EC4D3', soft: '#D2F3F6' },
    rare:      { ring: '#A8B7FF', glow: '#5B5BF6', soft: '#E6E5FF' },
    epic:      { ring: '#D7A8FF', glow: '#7A4FD0', soft: '#ECDDFF' },
    legendary: { ring: '#FFD86B', glow: '#E5A018', soft: '#FFF1CA' },
    mythic:    { ring: '#FF8A3F', glow: '#E5414C', soft: '#FFDDE1' },
};

// Convert a reward into a stage-friendly preview shape. Bucks become a coin
// "stack"; cosmetic rewards yield a Mascot wearing the player's current skin
// with the previewed item swapped into its slot — same pattern the shop uses.
// That way the player sees the item layered onto THEIR Atlas (their color +
// their hat + their glasses + their effect), and a color reward replaces only
// the globe colour without stripping the accessories they have equipped.
function stagePreview(reward, fallbackCos) {
    if (!reward) return null;
    if (reward.type === 'bucks') {
        return {
            kind: 'bucks',
            amount: reward.amount,
            name: `${reward.amount.toLocaleString()} Atlas Bucks`,
            cat: 'currency',
        };
    }
    if (reward.type === 'cosmetic') {
        const cos = { ...fallbackCos, [reward.cat]: reward.id };
        return {
            kind: 'cosmetic',
            cos,
            name: cosmeticName(reward.cat, reward.id),
            cat: reward.cat,
        };
    }
    return null;
}

// The stage rendering — pedestal + spotlight + animated preview. Reused for
// both the premium reward (always centre) and a smaller free-track inset.
function Stage({ preview, rarity, big = true }) {
    if (!preview) return null;
    const hue = RARITY_HUE[rarity] || RARITY_HUE.common;
    return (
        <div
            className={`bp-stage ${big ? 'bp-stage--big' : 'bp-stage--mini'}`}
            style={{ '--stage-glow': hue.glow, '--stage-ring': hue.ring, '--stage-soft': hue.soft }}
        >
            <div className="bp-stage__beam" aria-hidden="true" />
            <div className="bp-stage__halo" aria-hidden="true" />
            <div className="bp-stage__platform">
                {preview.kind === 'bucks' ? (
                    <div className="bp-stage__coins" aria-hidden="true">
                        <AtlasBucksIcon size={big ? 56 : 30} />
                        <span className="bp-stage__coinNum">{preview.amount.toLocaleString()}</span>
                    </div>
                ) : (
                    <Mascot size={big ? 96 : 46} mood="cheer" cosmetics={preview.cos} />
                )}
            </div>
            <div className="bp-stage__pedestal" aria-hidden="true" />
            <div className="bp-stage__floor" aria-hidden="true" />
        </div>
    );
}

// Single tier "column". Vertical card with: ribbon → big stage → cosmetic name
// → free row → premium row. Horizontal-scroll list of these is the centrepiece.
function TierCard({ tier, def, currentTier, ownsPass, onClaim, claimingKey, fallbackCos }) {
    const prefersReduced = useReducedMotion();
    const unlocked = tier <= currentTier;
    const freeClaimed = isClaimed('free', tier);
    const premClaimed = isClaimed('prem', tier);
    const claimingFree = claimingKey === `free:${tier}`;
    const claimingPrem = claimingKey === `prem:${tier}`;
    const rarity = rarityOf(tier);
    const isCapstone = tier === 5 || tier === 10 || tier === 15 || tier === 20 || tier === 25;

    const premPreview = useMemo(() => stagePreview(def?.prem, fallbackCos), [def, fallbackCos]);
    const freePreview = useMemo(() => stagePreview(def?.free, fallbackCos), [def, fallbackCos]);

    return (
        <motion.div
            className={`bp-tier-card bp-tier-card--${rarity} ${unlocked ? 'is-unlocked' : 'is-locked'} ${isCapstone ? 'is-capstone' : ''}`}
            initial={prefersReduced ? false : { opacity: 0, y: 12 }}
            animate={prefersReduced ? false : { opacity: 1, y: 0 }}
            transition={{ ...springs.gentle, delay: Math.min(0.02 * tier, 0.4) }}
        >
            <div className="bp-tier-card__ribbon">
                <span className="bp-tier-card__tier-num">Tier {tier}</span>
                <span className="bp-tier-card__rarity">{rarity}</span>
            </div>

            <Stage preview={premPreview} rarity={rarity} big />

            <div className="bp-tier-card__name">
                <span className="bp-tier-card__cat">
                    <Icon name={categoryIcon(premPreview?.cat)} /> {categoryLabel(premPreview?.cat) || 'Reward'}
                </span>
                <span className="bp-tier-card__title">{premPreview?.name || '—'}</span>
            </div>

            <div className="bp-tier-card__divider" aria-hidden="true">
                <span>Tracks</span>
            </div>

            <div className={`bp-track bp-track--free ${freeClaimed ? 'is-claimed' : unlocked ? 'is-ready' : 'is-locked'}`}>
                <div className="bp-track__head">
                    <span className="bp-track__label"><Icon name="check_circle" /> Free</span>
                    {freePreview?.kind === 'cosmetic' ? (
                        <span className="bp-track__chip"><Icon name={categoryIcon(freePreview.cat)} /> {freePreview.name}</span>
                    ) : (
                        <span className="bp-track__chip"><AtlasBucksIcon size={14} /> {freePreview?.amount?.toLocaleString() || 0}</span>
                    )}
                </div>
                {freeClaimed ? (
                    <span className="bp-track__status is-on"><Icon name="check" /> Claimed</span>
                ) : (
                    <Button
                        variant={unlocked ? 'success' : 'secondary'}
                        size="sm"
                        fullWidth
                        icon={unlocked ? 'redeem' : 'lock'}
                        disabled={!unlocked || claimingFree}
                        onClick={() => onClaim('free', tier)}
                    >
                        {claimingFree ? 'Claiming…' : unlocked ? 'Claim' : 'Locked'}
                    </Button>
                )}
            </div>

            <div className={`bp-track bp-track--prem ${premClaimed ? 'is-claimed' : unlocked && ownsPass ? 'is-ready' : 'is-locked'}`}>
                <div className="bp-track__head">
                    <span className="bp-track__label bp-track__label--prem"><Icon name="workspace_premium" /> Premium</span>
                    <span className="bp-track__chip bp-track__chip--prem"><Icon name={categoryIcon(premPreview?.cat)} /> {premPreview?.name || '—'}</span>
                </div>
                {premClaimed ? (
                    <span className="bp-track__status is-on"><Icon name="check" /> Claimed</span>
                ) : !ownsPass ? (
                    <span className="bp-track__status is-pass-locked"><Icon name="lock" /> Pass required</span>
                ) : (
                    <Button
                        variant={unlocked ? 'accent' : 'secondary'}
                        size="sm"
                        fullWidth
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

function ChallengeCard({ challenge, def, onClaim, claiming }) {
    const pct = def.goal > 0 ? Math.min(1, challenge.cur / def.goal) : 0;
    const bucks = Number(challenge.bucks) || 0;
    const claimed = !!challenge.claimed;
    const claimable = challenge.done && !claimed && bucks > 0;
    return (
        <div className={`bp-quest ${challenge.done ? 'is-done' : ''} ${claimable ? 'is-claimable' : ''}`}>
            <ChallengeIcon metric={def.metric} size={56} done={challenge.done} />
            <span className="bp-quest__body">
                <span className="bp-quest__head">
                    <span className="bp-quest__title">{def.title}</span>
                    <span className="bp-quest__rewards">
                        {bucks > 0 && (
                            <span className="bp-quest__bucks" aria-label={`${bucks} Atlas Bucks reward`}>
                                <AtlasBucksIcon size={14} /> {bucks.toLocaleString()}
                            </span>
                        )}
                        <span className="bp-quest__stars" aria-label={`${def.stars} battle stars`}>
                            <Icon name="star" /> {def.stars.toLocaleString()}
                        </span>
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
                {challenge.done && bucks > 0 && (
                    claimed ? (
                        <span className="bp-quest__claimed"><Icon name="check" /> Reward claimed</span>
                    ) : (
                        <Button
                            variant="success"
                            size="sm"
                            icon="redeem"
                            disabled={claiming}
                            onClick={() => onClaim(challenge.id)}
                        >
                            {claiming ? 'Claiming…' : `Claim ${bucks.toLocaleString()} Bucks`}
                        </Button>
                    )
                )}
            </span>
        </div>
    );
}

function BattlepassScreen({ setView }) {
    const { isAuthed, patchUser } = useAuth();
    const currency = useCurrency();
    const toast = useToast();
    const bp = useBattlepass();
    const profile = useProfile();
    const [tab, setTab] = useState('rewards');
    const [buyOpen, setBuyOpen] = useState(false);
    const [buying, setBuying] = useState(false);
    const [claimingKey, setClaimingKey] = useState(null);
    const [claimingChallengeId, setClaimingChallengeId] = useState(null);
    const tiersRef = useRef(null);
    const prefersReduced = useReducedMotion();

    useEffect(() => {
        if (isAuthed) loadBattlepass().catch(() => {});
    }, [isAuthed]);

    // Auto-scroll the horizontal tier strip so the player lands near the
    // next-claimable tier on first paint.
    useEffect(() => {
        if (!bp.loaded || !tiersRef.current) return;
        const target = tiersRef.current.querySelector('.bp-tier-card.is-unlocked .ui-button:not([disabled])')
            ?.closest('.bp-tier-card')
            || tiersRef.current.querySelector('.bp-tier-card.is-unlocked')
            || tiersRef.current.querySelector('.bp-tier-card');
        if (target && typeof target.scrollIntoView === 'function') {
            target.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', inline: 'center', block: 'nearest' });
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

    // Preview each reward against the player's currently equipped skin, so
    // they see exactly how the new item would layer onto THEIR Atlas — same
    // pattern the cosmetics shop uses. Falls back to the default cosmetics if
    // the profile hasn't loaded yet (e.g. fresh login race).
    const fallbackCos = useMemo(
        () => ({
            color: profile.cosmetics?.color || DEFAULT_COSMETICS.color,
            hat: profile.cosmetics?.hat || DEFAULT_COSMETICS.hat,
            glasses: profile.cosmetics?.glasses || DEFAULT_COSMETICS.glasses,
            effect: profile.cosmetics?.effect || DEFAULT_COSMETICS.effect,
            hatPos: profile.cosmetics?.hatPos,
            glassesPos: profile.cosmetics?.glassesPos,
        }),
        [profile.cosmetics]
    );

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
                    <p>Log in to grind challenges, unlock reptile cosmetics, and grab exclusive premium rewards.</p>
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

    const onClaimChallenge = async (id) => {
        if (claimingChallengeId) return;
        setClaimingChallengeId(id);
        try {
            const out = await claimChallenge(id);
            patchUser({ bucks: out.bucks });
            setBucksLocal(out.bucks);
            toast.success(`+${Number(out.payout || 0).toLocaleString()} Atlas Bucks!`);
        } catch (err) {
            toast.danger(err.message || 'Could not claim that challenge.');
        } finally {
            setClaimingChallengeId(null);
        }
    };

    const onClaim = async (track, tier) => {
        const key = `${track}:${tier}`;
        if (claimingKey) return;
        setClaimingKey(key);
        try {
            const out = await claimReward(track, tier);
            patchUser({ bucks: out.bucks, ownedCosmetics: out.ownedCosmetics });
            // Mirror the new balance into the currency store so the topbar
            // chip updates immediately, matching onClaimChallenge above.
            if (typeof out.bucks === 'number') setBucksLocal(out.bucks);
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
                <div className="bp-hero__scales" aria-hidden="true" />
                <div className="bp-hero__inner">
                    <span className="bp-hero__badge">
                        <Icon name="workspace_premium" /> Reptile Kingdom · Season 1
                    </span>
                    <h2 className="bp-hero__title">{SEASON_NAME}</h2>
                    <p className="bp-hero__sub">
                        25 tiers of dragon-themed cosmetics. Complete challenges across every mode to climb.
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
                                Free tier rewards are always claimable. Premium adds a reptile cosmetic at every tier.
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
                        className="bp-rewards"
                    >
                        <div className="bp-rewards__scroll" ref={tiersRef}>
                            {Array.from({ length: TIER_COUNT }, (_, i) => i + 1).map((tier) => (
                                <TierCard
                                    key={tier}
                                    tier={tier}
                                    def={TIERS_BY_NUM[tier]}
                                    currentTier={bp.tier}
                                    ownsPass={bp.owned}
                                    onClaim={onClaim}
                                    claimingKey={claimingKey}
                                    fallbackCos={fallbackCos}
                                />
                            ))}
                        </div>
                        <div className="bp-rewards__hint">
                            <Icon name="swipe" /> Swipe horizontally — 25 tiers all the way to Dragon Fire.
                        </div>
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
                            <ChallengeCard
                                key={challenge.id}
                                challenge={challenge}
                                def={def}
                                onClaim={onClaimChallenge}
                                claiming={claimingChallengeId === challenge.id}
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            <Modal open={buyOpen} onClose={() => setBuyOpen(false)} title="Unlock Atlas Pass Premium">
                <p className="auth-hint">
                    Premium adds an exclusive reptile cosmetic at every one of {TIER_COUNT} tiers — dragon
                    horns, scaled hoods, animated colour palettes. Your free tier rewards stay available either way.
                </p>
                <div className="bp-buy-summary">
                    <span><Icon name="workspace_premium" /> Reptile Kingdom · Season pass</span>
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
