import React, { useState, useEffect, useRef } from 'react';
import Icon from '../common/Icon';
import { Modal, Button } from '../ui/index';
import { useAuth } from '../../auth/AuthProvider';
import { useProfile } from '../../lib/profile';
import { useCurrency } from '../../lib/currency';
import { ACHIEVEMENTS_BY_ID } from '../../lib/achievements';
import AtlasBucksIcon from '../../assets/illustrations/AtlasBucks';
import AchievementBadge from '../profile/AchievementBadge';
import InboxButton from '../social/InboxButton';
import FriendsButton from '../social/FriendsButton';
import QuestsButton from '../economy/QuestsButton';

function TopBar({ setView, view }) {
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
    // Economy v2: pulse the chip when Bucks land directly during play. We
    // track the previous value in a ref so the animation only fires on actual
    // increases (not on first render, decrements from purchases, or rerenders
    // where the number is unchanged).
    const [pulseKey, setPulseKey] = useState(0);
    const prevBucksRef = useRef(bucks);
    useEffect(() => {
        if (bucks > prevBucksRef.current) setPulseKey((k) => k + 1);
        prevBucksRef.current = bucks;
    }, [bucks]);

    return (
        <header className="topbar">
            {view && view !== 'menu' && (
                <button className="topbar__home" onClick={() => setView('menu')} aria-label="Home">
                    <Icon name="home" />
                </button>
            )}
            <div className="topbar__right" data-tour="topbar">
                {isAuthed && (
                    <button
                        className="ab-chip"
                        aria-label={`Atlas Bucks balance: ${bucks}`}
                        onClick={() => setView('store')}
                    >
                        <AtlasBucksIcon size={16} />
                        <span key={pulseKey} className="ab-chip__num">{bucks.toLocaleString()}</span>
                    </button>
                )}

                {isAuthed && <QuestsButton setView={setView} />}

                {isAuthed && <FriendsButton setView={setView} />}

                {isAuthed && <InboxButton />}

                {isAuthed ? (
                    <button className="account-chip" onClick={() => setMenuOpen(true)} aria-label="Account menu" aria-haspopup="dialog">
                        <Icon name="account_circle" />
                        <span className="account-chip__name">
                            {user?.username}
                            {selectedTitle && (
                                <span className="account-chip__title">{selectedTitle}</span>
                            )}
                        </span>
                        <Icon name="expand_more" className="account-chip__caret" />
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
                    <Button variant="secondary" fullWidth icon="settings"
                        onClick={() => { setMenuOpen(false); setView('settings'); }}>
                        Settings
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
