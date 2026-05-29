import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from './Icon';
import { Button } from './ui';
import { useToast } from './ui/Toast';
import AtlasBucksIcon from '../assets/illustrations/AtlasBucks';
import Confetti from '../assets/illustrations/Confetti';
import ChestReveal from './ChestReveal';
import { useAuth } from '../auth/AuthProvider';
import { useAudio } from '../audio/AudioProvider';
import {
    useQuests,
    peekQuestNotice,
    dismissQuestNotice,
    claimQuest,
} from '../lib/quests';
import { springs } from '../motion';

// QuestCompleteModal — pops a celebration card the moment a quest's progress
// crosses its goal. Subscribes to the quests store (via useQuests()) so any
// applyBlob diff that adds a quest to the noticeQueue surfaces here. Two
// paths: Claim → opens the shared ChestReveal for the bucks payout; Save
// for later → dismisses the notice but leaves the quest claimable from the
// Quests screen (and the TopBar bell-style badge).

const TIER_LABEL = {
    stone: 'Stone tier', bronze: 'Bronze tier', silver: 'Silver tier',
    gold: 'Gold tier', platinum: 'Platinum tier', legend: 'Legend tier',
};

// Tier → chest rarity mapping for the reveal animation. Daily/weekly quests
// cap at platinum so we never bump anything up to legendary chest here.
const TIER_RARITY = {
    stone: 'common', bronze: 'common', silver: 'rare',
    gold: 'epic', platinum: 'epic', legend: 'legendary',
};

export default function QuestCompleteModal() {
    const { isAuthed } = useAuth();
    const toast = useToast();
    const audio = useAudio();
    useQuests(); // subscribe so noticeQueue changes re-render

    const quest = isAuthed ? peekQuestNotice() : null;
    const [claiming, setClaiming] = useState(false);
    const [reveal, setReveal] = useState(null); // { bucks, quest } once claimed

    // Play a celebratory ping the first time a quest notice appears so the
    // user notices it even if they're not looking at the screen.
    useEffect(() => {
        if (quest && !reveal && audio.isUnlocked) {
            audio.play('correct', { volume: 0.7 });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [quest?.id]);

    const onClaim = async () => {
        if (!quest || claiming) return;
        setClaiming(true);
        try {
            const out = await claimQuest(quest.id);
            // Pull the quest snapshot forward into the reveal so it survives
            // the post-claim applyBlob (which clears it from the queue).
            setReveal({ bucks: out.claimed || quest.bucks, quest });
        } catch (err) {
            toast.danger(err.message || 'Could not claim this quest.');
        } finally {
            setClaiming(false);
        }
    };

    const onSaveForLater = () => {
        if (!quest || claiming) return;
        dismissQuestNotice(quest.id);
    };

    const onRevealClose = () => {
        // Drop this quest from the notice queue (it's claimed now anyway, but
        // the post-claim applyBlob already pruned it — dismiss is a no-op
        // when the ID is gone, kept for safety).
        if (reveal?.quest?.id) dismissQuestNotice(reveal.quest.id);
        setReveal(null);
    };

    if (reveal) {
        return (
            <ChestReveal
                open
                rarity={TIER_RARITY[reveal.quest.tier] || 'rare'}
                bucks={reveal.bucks}
                title="Quest reward"
                subtitle={reveal.quest.title}
                showRarity={false}
                onClose={onRevealClose}
            />
        );
    }

    const tier = quest?.tier || 'silver';

    return (
        <AnimatePresence>
            {quest && (
                <motion.div
                    className="chest-reveal-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div
                        className={`quest-complete quest-complete--${tier}`}
                        initial={{ scale: 0.7, y: 30, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.85, y: 20, opacity: 0 }}
                        transition={springs.bouncy}
                    >
                        <div className="quest-complete__confetti" aria-hidden="true">
                            <Confetti pieces={28} radius={140} />
                        </div>

                        <motion.div
                            className="quest-complete__eyebrow"
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15, duration: 0.3 }}
                        >
                            <Icon name="auto_awesome" /> Quest Complete!
                        </motion.div>

                        <motion.div
                            className="quest-complete__icon"
                            initial={{ scale: 0.5, rotate: -10 }}
                            animate={{ scale: [0.5, 1.18, 1], rotate: [-10, 6, 0] }}
                            transition={{ duration: 0.55, ease: [0.18, 0.89, 0.32, 1.28] }}
                        >
                            <Icon name={quest.icon || 'task_alt'} />
                        </motion.div>

                        <h2 className="quest-complete__title">{quest.title}</h2>

                        <span
                            className={`ach-badge ach-badge--${tier} quest-complete__tier`}
                            title={TIER_LABEL[tier] || tier}
                            aria-label={TIER_LABEL[tier] || tier}
                        >
                            <Icon name="military_tech" />
                            {TIER_LABEL[tier] || tier}
                        </span>

                        <div className="quest-complete__bar">
                            <motion.div
                                className="quest-complete__fill"
                                initial={{ width: 0 }}
                                animate={{ width: '100%' }}
                                transition={{ delay: 0.25, duration: 0.7, ease: 'easeOut' }}
                            />
                        </div>
                        <div className="quest-complete__progress">
                            {quest.goal} / {quest.goal}
                        </div>

                        <motion.div
                            className="quest-complete__reward"
                            initial={{ scale: 0.85, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.4, ...springs.bouncy }}
                        >
                            <AtlasBucksIcon size={28} />
                            <span className="quest-complete__reward-num">
                                +{(quest.bucks || 0).toLocaleString()}
                            </span>
                        </motion.div>

                        <div className="quest-complete__actions">
                            <Button
                                variant="secondary"
                                onClick={onSaveForLater}
                                disabled={claiming}
                            >
                                Save for later
                            </Button>
                            <Button
                                variant="primary"
                                icon="redeem"
                                onClick={onClaim}
                                disabled={claiming}
                            >
                                {claiming ? 'Claiming…' : 'Claim Reward'}
                            </Button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
