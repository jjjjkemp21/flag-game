import React, { useState } from 'react';
import Icon from './Icon';
import { Modal, Button } from './ui';
import { useAuth } from '../auth/AuthProvider';
import { useProfile } from '../lib/profile';
import { useCurrency } from '../lib/currency';
import { ACHIEVEMENTS_BY_ID } from '../lib/achievements';
import AtlasBucksIcon from '../assets/illustrations/AtlasBucks';
import AchievementBadge from './AchievementBadge';
import NotificationBell from './NotificationBell';
import FeedbackButton from './FeedbackButton';

function TopBar({ setView }) {
    const { isAuthed, user, logout } = useAuth();
    const profile = useProfile();
    const currency = useCurrency();
    const [menuOpen, setMenuOpen] = useState(false);
    const badges = (profile.achievements.showcase || []).map((id) => ACHIEVEMENTS_BY_ID[id]).filter(Boolean);
    // Profile store loads on sign-in; before then we fall back to the title baked
    // into the user payload so the chip never shows a blank line.
    const selectedTitle = profile.selectedTitle || user?.selectedTitle || null;
    // Bucks live in the currency store after login; fall back to the user
    // payload so the chip doesn't flicker between login and the first poll.
    const bucks = currency.loaded ? currency.bucks : (user?.bucks || 0);

    return (
        <header className="topbar">
            <div className="topbar__right">
                {isAuthed && (
                    <button
                        className="ab-chip"
                        aria-label={`Atlas Bucks balance: ${bucks}`}
                        onClick={() => setView('store')}
                    >
                        <AtlasBucksIcon size={16} />
                        <span>{bucks.toLocaleString()}</span>
                    </button>
                )}

                {isAuthed && <NotificationBell />}
                {isAuthed && <FeedbackButton />}

                <button className="bell-button" aria-label="Settings" onClick={() => setView('settings')}>
                    <Icon name="settings" />
                </button>

                {isAuthed ? (
                    <button className="account-chip" onClick={() => setMenuOpen(true)} aria-label="Account">
                        <Icon name="account_circle" />
                        <span className="account-chip__name">
                            {user?.username}
                            {selectedTitle && (
                                <span className="account-chip__title">{selectedTitle}</span>
                            )}
                        </span>
                    </button>
                ) : (
                    <button className="account-chip account-chip--guest" onClick={() => setView('login')}>
                        <Icon name="login" /> Log in
                    </button>
                )}
            </div>

            <Modal open={menuOpen} onClose={() => setMenuOpen(false)} title={user?.username}>
                <p className="auth-hint">
                    {selectedTitle && <strong>{selectedTitle} · </strong>}
                    {user?.xp ?? 0} XP{user?.is_admin ? ' · admin' : ''}
                </p>
                {badges.length > 0 && (
                    <div className="profile-badges">
                        {badges.map((a) => (
                            <AchievementBadge key={a.id} ach={a} showName />
                        ))}
                    </div>
                )}
                <div className="account-menu">
                    <Button variant="secondary" fullWidth icon="leaderboard"
                        onClick={() => { setMenuOpen(false); setView('leaderboard'); }}>
                        Leaderboard
                    </Button>
                    <Button variant="secondary" fullWidth icon="emoji_events"
                        onClick={() => { setMenuOpen(false); setView('achievements'); }}>
                        Achievements
                    </Button>
                    <Button variant="secondary" fullWidth icon="group"
                        onClick={() => { setMenuOpen(false); setView('friends'); }}>
                        Friends
                    </Button>
                    <Button variant="secondary" fullWidth icon="storefront"
                        onClick={() => { setMenuOpen(false); setView('store'); }}>
                        Atlas Shop
                    </Button>
                    <Button variant="accent" fullWidth icon="workspace_premium"
                        onClick={() => { setMenuOpen(false); setView('battlepass'); }}>
                        Atlas Pass
                    </Button>
                    {user?.is_admin && (
                        <Button variant="accent" fullWidth icon="campaign"
                            onClick={() => { setMenuOpen(false); setView('admin'); }}>
                            Post announcement
                        </Button>
                    )}
                    <Button variant="danger" fullWidth icon="logout"
                        onClick={() => { setMenuOpen(false); logout(); setView('menu'); }}>
                        Log out
                    </Button>
                </div>
            </Modal>
        </header>
    );
}

export default TopBar;
