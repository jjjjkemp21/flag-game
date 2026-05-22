import React, { useState } from 'react';
import Icon from './Icon';
import { Modal, Button, Pill } from './ui';
import { useToast } from './ui/Toast';
import Mascot from '../assets/illustrations/Mascot';
import AchievementBadge from './AchievementBadge';
import { useAuth } from '../auth/AuthProvider';
import { api } from '../api/client';
import { masteryRank } from '../lib/mastery';
import { ACHIEVEMENTS, ACHIEVEMENTS_BY_ID } from '../lib/achievements';

const FLAG_BASE = './assets/flags/';

// Read-only summary of another player: their Atlas (cosmetics + name/level),
// region, XP, mastery rank, showcased achievements, and an add-friend action.
// `row` is a leaderboard entry shape.
function ProfileCard({ row, flagsData, onClose }) {
    const { user } = useAuth();
    const toast = useToast();
    const [sent, setSent] = useState(false);
    const [busy, setBusy] = useState(false);

    const total = (flagsData && flagsData.length) || 0;
    const rank = masteryRank(row.masteredCount || 0, total);
    const badges = (row.showcase || []).map((id) => ACHIEVEMENTS_BY_ID[id]).filter(Boolean);
    const isMe = user && row.id === user.id;
    const petName = row.petName || 'Atlas';

    const addFriend = async () => {
        setBusy(true);
        try {
            const res = await api.post('/friends/request', { username: row.username });
            toast.success(res.status === 'accepted' ? 'Friend added!' : 'Request sent!');
            setSent(true);
        } catch (err) {
            toast.danger(err.message || 'Could not send request.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <Modal open onClose={onClose} title={row.username}>
            <div className="profile-card">
                <div className="profile-card__atlas">
                    <Mascot size={104} mood="idle" cosmetics={row.cosmetics} still />
                    <span className="profile-card__petname">
                        {petName} · Lv {row.petLevel || 1}
                    </span>
                </div>

                <div className="profile-card__meta">
                    {row.region && (
                        <span className="profile-card__region">
                            <img
                                className="leaderboard-flag"
                                src={`${FLAG_BASE}${row.region.toLowerCase()}.svg`}
                                alt=""
                            />
                        </span>
                    )}
                    <span className={`rank-pill rank-pill--${rank.tier}`}>
                        <Icon name="military_tech" /> {rank.title}
                    </span>
                </div>

                <div className="profile-card__stats">
                    <Pill tone="primary" icon="star">{row.xp || 0} XP</Pill>
                    <Pill tone="info" icon="public">{row.masteredCount || 0} / {total} mastered</Pill>
                    <Pill tone="accent" icon="emoji_events">
                        {row.achievementCount || 0} / {ACHIEVEMENTS.length} achievements
                    </Pill>
                </div>

                {badges.length > 0 && (
                    <div className="profile-card__badges">
                        {badges.map((a) => (
                            <AchievementBadge key={a.id} ach={a} showName />
                        ))}
                    </div>
                )}

                {!isMe && (
                    <Button
                        variant="primary"
                        fullWidth
                        icon={sent ? 'check' : 'person_add'}
                        onClick={addFriend}
                        disabled={busy || sent}
                    >
                        {sent ? 'Request sent' : 'Add friend'}
                    </Button>
                )}
            </div>
        </Modal>
    );
}

export default ProfileCard;
