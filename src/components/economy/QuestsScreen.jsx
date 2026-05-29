import React, { useState } from 'react';
import Icon from '../common/Icon';
import { Button } from '../ui/index';
import { useToast } from '../ui/Toast';
import AtlasBucksIcon from '../../assets/illustrations/AtlasBucks';
import ChestReveal from './ChestReveal';
import { useAuth } from '../../auth/AuthProvider';
import { useQuests, claimQuest } from '../../lib/quests';

// Quests screen — Daily (3) + Weekly (2) tabs. Each row: icon, title, progress
// bar, Bucks reward, Claim button when done. Claiming opens a small chest
// reveal so the reward feels celebratory (re-uses the shared component).

// Tier → badge label shown in the tooltip next to the title chip. Mirrors the
// achievement tier vocabulary so a "gold" quest reads the same as a gold
// achievement card.
const TIER_LABEL = {
    stone: 'Stone tier', bronze: 'Bronze tier', silver: 'Silver tier',
    gold: 'Gold tier', platinum: 'Platinum tier', legend: 'Legend tier',
};

function QuestRow({ quest, onClaim, claiming }) {
    const pct = Math.min(100, Math.round((Number(quest.cur) || 0) / quest.goal * 100));
    const tier = quest.tier || 'silver';
    return (
        <div className={`quest-row quest-row--${tier} ${quest.done ? 'is-done' : ''} ${quest.claimed ? 'is-claimed' : ''}`}>
            <div className="quest-row__icon">
                <Icon name={quest.icon || 'task_alt'} />
            </div>
            <div className="quest-row__body">
                <div className="quest-row__title">
                    <span className="quest-row__title-text">{quest.title}</span>
                    <span
                        className={`ach-badge ach-badge--${tier} quest-row__tier`}
                        title={TIER_LABEL[tier] || tier}
                        aria-label={TIER_LABEL[tier] || tier}
                    >
                        <Icon name="military_tech" />
                    </span>
                </div>
                <div className="quest-row__bar">
                    <div className="quest-row__fill" style={{ width: `${pct}%` }} />
                </div>
                <div className="quest-row__progress">
                    {Math.min(quest.cur, quest.goal)} / {quest.goal}
                </div>
            </div>
            <div className="quest-row__reward">
                <div className="quest-row__bucks">
                    <AtlasBucksIcon size={14} /> {quest.bucks.toLocaleString()}
                </div>
                {quest.claimed ? (
                    <span className="ui-pill ui-pill--success"><Icon name="check" /> Claimed</span>
                ) : quest.done ? (
                    <Button
                        variant="primary"
                        size="sm"
                        icon="redeem"
                        onClick={() => onClaim(quest)}
                        disabled={claiming}
                    >
                        Claim
                    </Button>
                ) : (
                    <span className="quest-row__pending">In progress</span>
                )}
            </div>
        </div>
    );
}

export default function QuestsScreen({ setView }) {
    const { isAuthed } = useAuth();
    const quests = useQuests();
    const toast = useToast();
    const [tab, setTab] = useState('daily');
    const [claiming, setClaiming] = useState(false);
    const [reveal, setReveal] = useState(null); // { bucks, quest } when chest is showing

    if (!isAuthed) {
        return (
            <div className="quiz-box">
                <div className="quiz-topbar">
                    <button className="back-button" onClick={() => setView('menu')} aria-label="Back">
                        <Icon name="arrow_back" /> Back
                    </button>
                </div>
                <div className="signin-prompt">
                    <Icon name="assignment" size="xl" />
                    <h2>Quests</h2>
                    <p>Log in to take on daily and weekly quests for Atlas Bucks.</p>
                    <Button variant="primary" icon="login" onClick={() => setView('login')}>Log in or sign up</Button>
                </div>
            </div>
        );
    }

    const list = tab === 'daily' ? quests.daily.quests : quests.weekly.quests;

    const onClaim = async (quest) => {
        if (claiming) return;
        setClaiming(true);
        try {
            const out = await claimQuest(quest.id);
            setReveal({ bucks: out.claimed || quest.bucks, quest });
        } catch (err) {
            toast.danger(err.message || 'Could not claim this quest.');
        } finally {
            setClaiming(false);
        }
    };

    return (
        <div className="quiz-box quests-box">
            <div className="quiz-topbar">
                <button className="back-button" onClick={() => setView('menu')} aria-label="Back">
                    <Icon name="arrow_back" /> Back
                </button>
                <h2 className="text-center" style={{ margin: 0 }}>Quests</h2>
            </div>

            <div className="lb-filter store-tabs">
                <button
                    className={`lb-filter__btn ${tab === 'daily' ? 'is-active' : ''}`}
                    onClick={() => setTab('daily')}
                >
                    <Icon name="today" /> Daily
                </button>
                <button
                    className={`lb-filter__btn ${tab === 'weekly' ? 'is-active' : ''}`}
                    onClick={() => setTab('weekly')}
                >
                    <Icon name="date_range" /> Weekly
                </button>
            </div>

            <p className="quests-box__hint">
                {tab === 'daily'
                    ? 'New quests every UTC midnight. Three a day.'
                    : 'New quests every Monday UTC. Two a week.'}
            </p>

            <div className="quests-list">
                {list.length === 0 ? (
                    <p className="text-center" style={{ color: 'var(--color-ink-soft)' }}>
                        Loading quests…
                    </p>
                ) : list.map((q) => (
                    <QuestRow key={q.id} quest={q} onClaim={onClaim} claiming={claiming} />
                ))}
            </div>

            <ChestReveal
                open={!!reveal}
                rarity="rare"
                bucks={reveal?.bucks || 0}
                title="Quest reward"
                subtitle={reveal?.quest?.title}
                showRarity={false}
                onClose={() => setReveal(null)}
            />
        </div>
    );
}
