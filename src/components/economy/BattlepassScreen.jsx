import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import Icon from '../common/Icon';
import { Button, Modal } from '../ui/index';
import { useToast } from '../ui/Toast';
import Mascot from '../../assets/illustrations/Mascot';
import Scene from '../../assets/illustrations/Scene';
import AtlasBucksIcon from '../../assets/illustrations/AtlasBucks';
import ChallengeIcon from '../profile/ChallengeIcon';
import { useAuth } from '../../auth/AuthProvider';
import { useCurrency, setBucksLocal, applyOwnedAndBucks } from '../../lib/currency';
import { useProfile, toggleEmoteInLoadout } from '../../lib/profile';
import {
    useBattlepass, loadBattlepass, buyPremium, claimReward, claimChallenge, isClaimed,
    CHALLENGES_BY_ID, TIERS_BY_NUM, progressWithinTier,
} from '../../lib/battlepass';
import { PREMIUM_PRICE, SEASON_NAME, TIER_COUNT } from '../../lib/battlepassCatalog';
import { COLORS, HATS, GLASSES, MOUTHS, EFFECTS, SCENES, EMOTES, DEFAULT_COSMETICS } from '../../lib/cosmetics';
import { EMOTE_DURATION_S } from '../../assets/illustrations/Cosmetics';
import { springs } from '../../motion/index';

// Auto-replay interval = animation length + a short idle gap so the burst
// finishes before it restarts. Sourced from EMOTE_DURATION_S so this stays in
// sync if the underlying SMIL duration is tweaked.
const EMOTE_REPLAY_MS = Math.round(EMOTE_DURATION_S * 1000) + 500;

// Catalog lookup so reward tiles can label the cosmetic without re-implementing
// the cosmetics catalog inline.
const CAT_TABLE = { color: COLORS, hat: HATS, glasses: GLASSES, mouth: MOUTHS, effect: EFFECTS, scene: SCENES, emote: EMOTES };
function cosmeticName(cat, id) {
    return (CAT_TABLE[cat] && CAT_TABLE[cat][id] && CAT_TABLE[cat][id].name) || id;
}

// Rarity tints each tier — the node + the premium tile pick up the colour so a
// quick glance down the road tells you how richly the season ramps up.
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
function rewardPreview(reward, fallbackCos) {
    if (!reward) return null;
    if (reward.type === 'bucks') {
        return {
            kind: 'bucks',
            amount: reward.amount,
            name: `${reward.amount.toLocaleString()} Bucks`,
        };
    }
    if (reward.type === 'cosmetic') {
        const cos = { ...fallbackCos, [reward.cat]: reward.id };
        // Scenes get a dedicated preview kind so the tile can render the scene
        // SVG (a tiny mascot in front of it would barely show through).
        if (reward.cat === 'scene') {
            return {
                kind: 'scene',
                sceneId: reward.id,
                cos,
                cat: reward.cat,
                name: cosmeticName(reward.cat, reward.id),
            };
        }
        // Emotes get their own kind so the tile/modal can auto-replay the
        // one-shot animation — otherwise the Mascot's emote slot would be
        // silently ignored (animations only fire via the `emotePlay` prop).
        if (reward.cat === 'emote') {
            return {
                kind: 'emote',
                emoteId: reward.id,
                cos,
                cat: reward.cat,
                name: cosmeticName(reward.cat, reward.id),
            };
        }
        return {
            kind: 'cosmetic',
            cos,
            cat: reward.cat,
            name: cosmeticName(reward.cat, reward.id),
        };
    }
    return null;
}

// Mini auto-replaying Mascot for emote reward previews. Sets up its own
// interval so each tile / modal independently loops the emote without
// driving extra parent re-renders. `bumpKey` lets a parent trigger an
// extra replay on demand (the modal's Replay button).
function EmoteRewardPreview({ emoteId, cosmetics, size = 64, intervalMs = EMOTE_REPLAY_MS, bumpKey = 0 }) {
    const [playId, setPlayId] = useState(0);
    useEffect(() => {
        if (!emoteId) return undefined;
        const t = setInterval(() => setPlayId((p) => p + 1), intervalMs);
        return () => clearInterval(t);
    }, [emoteId, intervalMs]);
    useEffect(() => {
        if (bumpKey > 0) setPlayId((p) => p + 1);
    }, [bumpKey]);
    return (
        <Mascot
            size={size}
            mood="cheer"
            cosmetics={cosmetics}
            still
            emotePlay={emoteId ? { id: emoteId, playId } : null}
        />
    );
}

// A single Brawl Stars-style portrait reward card. State drives the variant:
//  • claimed       → tile fades, a green check "sticker" floats above
//  • ready         → tile glows, a small Claim CTA appears
//  • locked        → desaturated, lock veil overlays the art
//  • pass-required → premium-only — desaturated, gold "pass" veil overlays
//
// The whole tile is a button — clicking opens the preview modal, so players
// can inspect any reward (locked, claimed, or claimable) on a big Atlas. The
// inner Claim button stops propagation so claiming stays one click.
function RewardTile({ track, preview, state, claiming, onClaim, onPreview, rarity, isPremPlaceholder }) {
    const hue = RARITY_HUE[rarity] || RARITY_HUE.common;
    const isPrem = track === 'prem';
    // Pass-required wins over lock when the tier is unlocked but the player
    // doesn't own the pass — that's the actionable barrier, not "wait longer".
    const showPassVeil = isPremPlaceholder;
    const showLockVeil = state === 'locked' && !showPassVeil;

    const tileClass = [
        'bp-tile',
        `bp-tile--${track}`,
        `bp-tile--${rarity}`,
        `is-${state}`,
        showPassVeil ? 'is-pass-locked' : '',
    ].filter(Boolean).join(' ');

    const handleKey = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onPreview?.();
        }
    };

    return (
        <div
            className={tileClass}
            style={{ '--tile-ring': hue.ring, '--tile-glow': hue.glow, '--tile-soft': hue.soft, cursor: 'pointer' }}
            role="button"
            tabIndex={0}
            onClick={onPreview}
            onKeyDown={handleKey}
            aria-label={`Preview ${preview?.name || 'reward'}`}
        >
            <span className="bp-tile__track">
                {isPrem ? <><Icon name="workspace_premium" /> Premium</> : <><Icon name="check_circle" /> Free</>}
            </span>

            <div className="bp-tile__art" aria-hidden="true">
                {preview?.kind === 'cosmetic' ? (
                    <Mascot size={64} mood="cheer" cosmetics={preview.cos} />
                ) : preview?.kind === 'emote' ? (
                    <EmoteRewardPreview emoteId={preview.emoteId} cosmetics={preview.cos} size={64} />
                ) : preview?.kind === 'scene' ? (
                    <div className="bp-tile__scene">
                        <Scene id={preview.sceneId} />
                    </div>
                ) : preview?.kind === 'bucks' ? (
                    <div className="bp-tile__bucks">
                        <AtlasBucksIcon size={44} />
                        <span className="bp-tile__bucksNum">{preview.amount.toLocaleString()}</span>
                    </div>
                ) : (
                    <Icon name="redeem" />
                )}
                {showLockVeil && (
                    <span className="bp-tile__veil" aria-label="Locked">
                        <Icon name="lock" />
                    </span>
                )}
                {showPassVeil && (
                    <span className="bp-tile__veil" aria-label="Pass required">
                        <Icon name="workspace_premium" />
                    </span>
                )}
            </div>

            {state === 'claimed' && (
                <span className="bp-tile__stamp" aria-label="Claimed">
                    <Icon name="check" />
                </span>
            )}

            <span className="bp-tile__name" title={preview?.name}>{preview?.name || '—'}</span>

            <div className="bp-tile__action">
                {state === 'claimed' ? (
                    <span className="bp-tile__status is-on"><Icon name="check" /> Claimed</span>
                ) : showPassVeil ? (
                    <span className="bp-tile__status is-pass">Pass required</span>
                ) : state === 'ready' ? (
                    <Button
                        variant={isPrem ? 'accent' : 'success'}
                        size="sm"
                        fullWidth
                        icon="redeem"
                        disabled={claiming}
                        onClick={(e) => { e.stopPropagation(); onClaim(); }}
                    >
                        {claiming ? 'Claiming…' : 'Claim'}
                    </Button>
                ) : (
                    <span className="bp-tile__status is-locked"><Icon name="lock" /> Locked</span>
                )}
            </div>
        </div>
    );
}

// A single column on the trophy road: free tile up top, tier node in the
// middle (with the connecting rail running through it), premium tile below.
function TierColumn({ tier, def, currentTier, ownsPass, onClaim, onPreview, claimingKey, fallbackCos }) {
    const prefersReduced = useReducedMotion();
    const unlocked = tier <= currentTier;
    const isCurrent = tier === currentTier + 1; // the tier the player is actively grinding toward
    const isMax = currentTier >= TIER_COUNT && tier === TIER_COUNT;
    const rarity = rarityOf(tier);
    const isCapstone = tier === 5 || tier === 10 || tier === 15 || tier === 20 || tier === 25;
    const hue = RARITY_HUE[rarity] || RARITY_HUE.common;

    const freeClaimed = isClaimed('free', tier);
    const premClaimed = isClaimed('prem', tier);
    const claimingFree = claimingKey === `free:${tier}`;
    const claimingPrem = claimingKey === `prem:${tier}`;

    const freeState = freeClaimed ? 'claimed' : unlocked ? 'ready' : 'locked';
    const premState = premClaimed ? 'claimed' : unlocked && ownsPass ? 'ready' : 'locked';

    const freePreview = useMemo(() => rewardPreview(def?.free, fallbackCos), [def, fallbackCos]);
    const premPreview = useMemo(() => rewardPreview(def?.prem, fallbackCos), [def, fallbackCos]);

    // Connector states drive the colour of the half-rails on either side of
    // the node. A rail segment is "filled" when the tier on its higher-numbered
    // side is unlocked (because that means the player has crossed that gap).
    const leftFilled = tier - 1 >= 0 && (tier - 1) <= currentTier; // left rail filled if previous tier passed
    const rightFilled = tier <= currentTier;                         // right rail filled if this tier passed

    const nodeClass = [
        'bp-node',
        `bp-node--${rarity}`,
        unlocked ? 'is-passed' : 'is-future',
        isCurrent ? 'is-current' : '',
        isCapstone ? 'is-capstone' : '',
        isMax ? 'is-max' : '',
    ].filter(Boolean).join(' ');

    return (
        <motion.div
            className={`bp-col ${isCapstone ? 'bp-col--capstone' : ''}`}
            initial={prefersReduced ? false : { opacity: 0, y: 12 }}
            animate={prefersReduced ? false : { opacity: 1, y: 0 }}
            transition={{ ...springs.gentle, delay: Math.min(0.015 * tier, 0.3) }}
            style={{ '--col-ring': hue.ring, '--col-glow': hue.glow, '--col-soft': hue.soft }}
        >
            <RewardTile
                track="free"
                preview={freePreview}
                state={freeState}
                rarity={rarity}
                claiming={claimingFree}
                onClaim={() => onClaim('free', tier)}
                onPreview={() => onPreview('free', tier, def, freePreview, freeState, rarity, false)}
            />

            <div className="bp-rail">
                <span className={`bp-rail__seg bp-rail__seg--l ${leftFilled ? 'is-filled' : ''} ${tier === 1 ? 'is-edge' : ''}`} aria-hidden="true" />
                <div className={nodeClass}>
                    <span className="bp-node__num">{tier}</span>
                    {isCapstone && <span className="bp-node__star" aria-hidden="true">★</span>}
                </div>
                <span className={`bp-rail__seg bp-rail__seg--r ${rightFilled ? 'is-filled' : ''} ${tier === TIER_COUNT ? 'is-edge' : ''}`} aria-hidden="true" />
            </div>

            <RewardTile
                track="prem"
                preview={premPreview}
                state={premState}
                rarity={rarity}
                claiming={claimingPrem}
                onClaim={() => onClaim('prem', tier)}
                onPreview={() => onPreview('prem', tier, def, premPreview, premState, rarity, unlocked && !ownsPass && !premClaimed)}
                isPremPlaceholder={unlocked && !ownsPass && !premClaimed}
            />
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
    // Preview modal: snapshot of the tile the player tapped, so they can see
    // any reward (locked, claimable, or already claimed) on a big Atlas.
    const [previewState, setPreviewState] = useState(null);
    // Bumped by the modal's Replay button to re-trigger emote one-shots
    // without remounting the Mascot. Reset whenever a different tile is opened.
    const [emoteBump, setEmoteBump] = useState(0);
    const roadRef = useRef(null);
    const prefersReduced = useReducedMotion();

    useEffect(() => {
        setEmoteBump(0);
    }, [previewState?.tier, previewState?.track]);

    useEffect(() => {
        if (isAuthed) loadBattlepass().catch(() => {});
    }, [isAuthed]);

    // On first paint, scroll the trophy road so the player's current tier
    // (or the next claimable tile) is centred — they should land on "where
    // they are" not at tier 1.
    useEffect(() => {
        if (!bp.loaded || !roadRef.current) return;
        const target =
            roadRef.current.querySelector('.bp-node.is-current')?.closest('.bp-col')
            || roadRef.current.querySelector('.bp-col .bp-tile .ui-button:not([disabled])')?.closest('.bp-col')
            || roadRef.current.querySelector('.bp-col');
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

    // Preview every reward layered onto the player's currently equipped skin,
    // so the cosmetic shows how it'd look on THEIR Atlas — same pattern the
    // cosmetics shop uses. Placements are intentionally omitted so previewed
    // items render at default size/position, not the player's customized scale.
    const fallbackCos = useMemo(
        () => ({
            color: profile.cosmetics?.color || DEFAULT_COSMETICS.color,
            hat: profile.cosmetics?.hat || DEFAULT_COSMETICS.hat,
            glasses: profile.cosmetics?.glasses || DEFAULT_COSMETICS.glasses,
            mouth: profile.cosmetics?.mouth || DEFAULT_COSMETICS.mouth,
            effect: profile.cosmetics?.effect || DEFAULT_COSMETICS.effect,
            scene: profile.cosmetics?.scene || DEFAULT_COSMETICS.scene,
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
            const short = PREMIUM_PRICE - currency.bucks;
            toast.danger(`Need ${short.toLocaleString()} more Atlas Bucks — earn them by playing, finishing runs, and claiming quests.`);
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
            // Merge the server's owned set into the currency store BEFORE the
            // emote toggle below — otherwise isOwnedKey('emote', id) is false for
            // the just-claimed BP-exclusive emote and the equip silently no-ops.
            applyOwnedAndBucks({ bucks: out.bucks, ownedCosmetics: out.ownedCosmetics });
            if (typeof out.bucks === 'number') setBucksLocal(out.bucks);
            if (out.reward?.type === 'bucks') {
                toast.success(`+${out.reward.amount.toLocaleString()} Atlas Bucks!`);
            } else if (out.reward?.type === 'cosmetic') {
                const name = cosmeticName(out.reward.cat, out.reward.id);
                // Emotes auto-slot into the quick-react bar so the player can
                // use them without a trip to the Atlas Shop. We drop into the
                // first empty loadout slot; toast tells them which.
                if (out.reward.cat === 'emote') {
                    const currentLoadout = (profile.cosmetics && profile.cosmetics.emoteLoadout) || [];
                    const alreadyIn = currentLoadout.indexOf(out.reward.id);
                    const emptySlot = currentLoadout.indexOf('none');
                    toggleEmoteInLoadout(out.reward.id);
                    if (alreadyIn >= 0) {
                        // toggleEmoteInLoadout removed it because it was already there.
                        // This shouldn't normally happen on first claim — log a soft toast.
                        toast.success(`Unlocked ${name}!`);
                    } else if (emptySlot >= 0) {
                        toast.success(`Unlocked ${name}! Equipped to slot ${emptySlot + 1}.`);
                    } else {
                        toast.success(`Unlocked ${name}! Swap it into your quick-react bar from the Atlas Shop.`);
                    }
                } else {
                    toast.success(`Unlocked ${name}!`);
                }
            }
            // Reflect the claim in the open preview (sticker, hide CTA) so the
            // modal doesn't have to be closed and reopened to see the new state.
            setPreviewState((p) => (p && p.track === track && p.tier === tier ? { ...p, state: 'claimed', isPremPlaceholder: false } : p));
        } catch (err) {
            toast.danger(err.message || 'Could not claim that.');
        } finally {
            setClaimingKey(null);
        }
    };

    const onPreview = (track, tier, def, preview, state, rarity, isPremPlaceholder) => {
        setPreviewState({ track, tier, def, preview, state, rarity, isPremPlaceholder });
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
                            <span className="bp-stat__num">{bp.tier}/{TIER_COUNT}</span>
                            <span className="bp-stat__label">Tier</span>
                        </div>
                        <div className="bp-stat">
                            <span className="bp-stat__num"><Icon name="star" /> {bp.stars.toLocaleString()}</span>
                            <span className="bp-stat__label">Battle Stars</span>
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
                        <div className="bp-rewards__legend" aria-hidden="true">
                            <span className="bp-rewards__legend-label">Free</span>
                            <span className="bp-rewards__legend-divider" />
                            <span className="bp-rewards__legend-label bp-rewards__legend-label--prem">
                                <Icon name="workspace_premium" /> Premium
                            </span>
                        </div>
                        <div className="bp-road" ref={roadRef}>
                            {Array.from({ length: TIER_COUNT }, (_, i) => i + 1).map((tier) => (
                                <TierColumn
                                    key={tier}
                                    tier={tier}
                                    def={TIERS_BY_NUM[tier]}
                                    currentTier={bp.tier}
                                    ownsPass={bp.owned}
                                    onClaim={onClaim}
                                    onPreview={onPreview}
                                    claimingKey={claimingKey}
                                    fallbackCos={fallbackCos}
                                />
                            ))}
                        </div>
                        <div className="bp-rewards__hint">
                            <Icon name="swipe" /> Swipe along the road — 25 tiers all the way to Dragon Fire.
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

            <Modal
                open={!!previewState}
                onClose={() => setPreviewState(null)}
                title={previewState ? `Tier ${previewState.tier} · ${previewState.track === 'prem' ? 'Premium' : 'Free'}` : 'Reward preview'}
            >
                {previewState && (() => {
                    const { track, tier, preview, state, rarity, isPremPlaceholder } = previewState;
                    const hue = RARITY_HUE[rarity] || RARITY_HUE.common;
                    const isPrem = track === 'prem';
                    const claimingThis = claimingKey === `${track}:${tier}`;
                    const stageMod = preview?.kind === 'scene'
                        ? 'bp-preview__stage--scene'
                        : preview?.kind === 'emote'
                            ? 'bp-preview__stage--emote'
                            : '';
                    return (
                        <div className="bp-preview" style={{ '--tile-ring': hue.ring, '--tile-glow': hue.glow, '--tile-soft': hue.soft }}>
                            <div className={`bp-preview__stage bp-preview__stage--${rarity} ${stageMod}`}>
                                {preview?.kind === 'scene' && <Scene id={preview.sceneId} />}
                                {preview?.kind === 'cosmetic' ? (
                                    <Mascot size={160} mood="cheer" cosmetics={preview.cos} />
                                ) : preview?.kind === 'emote' ? (
                                    <EmoteRewardPreview
                                        emoteId={preview.emoteId}
                                        cosmetics={preview.cos}
                                        size={170}
                                        intervalMs={1800}
                                        bumpKey={emoteBump}
                                    />
                                ) : preview?.kind === 'scene' ? (
                                    <Mascot size={110} mood="cheer" cosmetics={preview.cos} />
                                ) : preview?.kind === 'bucks' ? (
                                    <div className="bp-preview__bucks">
                                        <AtlasBucksIcon size={88} />
                                        <span className="bp-preview__bucksNum">{preview.amount.toLocaleString()}</span>
                                    </div>
                                ) : (
                                    <Icon name="redeem" size="xl" />
                                )}
                            </div>
                            {preview?.kind === 'emote' && (
                                <div className="bp-preview__replay">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        icon="replay"
                                        onClick={() => setEmoteBump((b) => b + 1)}
                                    >
                                        Replay
                                    </Button>
                                </div>
                            )}
                            {preview?.kind === 'scene' && (
                                <span className="bp-preview__caption">
                                    <Icon name="landscape" /> Appears as your home screen backdrop
                                </span>
                            )}
                            <div className="bp-preview__meta">
                                <span className={`bp-preview__rarity bp-preview__rarity--${rarity}`}>
                                    {isPrem ? <><Icon name="workspace_premium" /> Premium</> : <><Icon name="check_circle" /> Free</>}
                                    {' · '}{rarity}
                                </span>
                                <h3 className="bp-preview__name">{preview?.name || '—'}</h3>
                            </div>
                            <div className="bp-preview__action">
                                {state === 'claimed' ? (
                                    <span className="bp-tile__status is-on"><Icon name="check" /> Claimed</span>
                                ) : isPremPlaceholder ? (
                                    <Button
                                        variant="accent"
                                        icon="workspace_premium"
                                        onClick={() => { setPreviewState(null); setBuyOpen(true); }}
                                    >
                                        Unlock Premium · {PREMIUM_PRICE.toLocaleString()} Bucks
                                    </Button>
                                ) : state === 'ready' ? (
                                    <Button
                                        variant={isPrem ? 'accent' : 'success'}
                                        icon="redeem"
                                        disabled={claimingThis}
                                        onClick={() => onClaim(track, tier)}
                                    >
                                        {claimingThis ? 'Claiming…' : 'Claim reward'}
                                    </Button>
                                ) : (
                                    <span className="bp-tile__status is-locked">
                                        <Icon name="lock" /> Reach tier {tier} to unlock
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })()}
            </Modal>

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
