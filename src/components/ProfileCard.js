import React, { useState, useEffect } from 'react';
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
    const isMe = user && row.id === user.id;
    // Relationship: 'unknown' | 'none' | 'friends' | 'outgoing' | 'incoming'
    const [rel, setRel] = useState(isMe ? 'self' : 'unknown');
    const [incomingId, setIncomingId] = useState(null);
    const [busy, setBusy] = useState(false);

    const total = (flagsData && flagsData.length) || 0;
    const rank = masteryRank(row.masteredCount || 0, total);
    const badges = (row.showcase || []).map((id) => ACHIEVEMENTS_BY_ID[id]).filter(Boolean);
    const petName = row.petName || 'Atlas';

    // Look up the real relationship so we don't offer "Add friend" to someone
    // who's already a friend (or has a pending request either direction).
    useEffect(() => {
        if (isMe) return;
        let cancelled = false;
        (async () => {
            try {
                const { friends, incoming, outgoing } = await api.get('/friends');
                if (cancelled) return;
                if ((friends || []).some((f) => f.id === row.id)) { setRel('friends'); return; }
                const inc = (incoming || []).find((f) => f.id === row.id);
                if (inc) { setRel('incoming'); setIncomingId(inc.requestId); return; }
                if ((outgoing || []).some((f) => f.id === row.id)) { setRel('outgoing'); return; }
                setRel('none');
            } catch (_) {
                if (!cancelled) setRel('none');
            }
        })();
        return () => { cancelled = true; };
    }, [row.id, isMe]);

    const addFriend = async () => {
        setBusy(true);
        try {
            const res = await api.post('/friends/request', { username: row.username });
            const accepted = res.status === 'accepted';
            toast.success(accepted ? 'Friend added!' : 'Request sent!');
            setRel(accepted ? 'friends' : 'outgoing');
        } catch (err) {
            toast.danger(err.message || 'Could not send request.');
        } finally {
            setBusy(false);
        }
    };

    const acceptRequest = async () => {
        setBusy(true);
        try {
            await api.post('/friends/respond', { requestId: incomingId, accept: true });
            toast.success('Friend added!');
            setRel('friends');
        } catch (err) {
            toast.danger(err.message || 'Could not accept request.');
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
                        {petName} · {row.petStage || 'Hatchling'} · Lv {row.petLevel || 1}
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

                {!isMe && rel === 'friends' && (
                    <Button variant="secondary" fullWidth icon="how_to_reg" disabled>
                        Friends
                    </Button>
                )}
                {!isMe && rel === 'outgoing' && (
                    <Button variant="secondary" fullWidth icon="schedule" disabled>
                        Request sent
                    </Button>
                )}
                {!isMe && rel === 'incoming' && (
                    <Button variant="primary" fullWidth icon="person_add" onClick={acceptRequest} disabled={busy}>
                        Accept friend request
                    </Button>
                )}
                {!isMe && rel === 'none' && (
                    <Button variant="primary" fullWidth icon="person_add" onClick={addFriend} disabled={busy}>
                        Add friend
                    </Button>
                )}
            </div>
        </Modal>
    );
}

export default ProfileCard;
