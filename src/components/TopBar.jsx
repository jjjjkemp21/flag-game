import React, { useState } from 'react';
import Icon from './Icon';
import { Modal, Button } from './ui';
import { useAuth } from '../auth/AuthProvider';
import NotificationBell from './NotificationBell';

function TopBar({ setView }) {
    const { isAuthed, user, logout } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <header className="topbar">
            <div className="topbar__right">
                {isAuthed && <NotificationBell />}

                {isAuthed ? (
                    <button className="account-chip" onClick={() => setMenuOpen(true)} aria-label="Account">
                        <Icon name="account_circle" />
                        <span className="account-chip__name">{user?.username}</span>
                    </button>
                ) : (
                    <button className="account-chip account-chip--guest" onClick={() => setView('login')}>
                        <Icon name="login" /> Log in
                    </button>
                )}
            </div>

            <Modal open={menuOpen} onClose={() => setMenuOpen(false)} title={user?.username}>
                <p className="auth-hint">{user?.xp ?? 0} XP{user?.is_admin ? ' · admin' : ''}</p>
                <div className="account-menu">
                    <Button variant="secondary" fullWidth icon="leaderboard"
                        onClick={() => { setMenuOpen(false); setView('leaderboard'); }}>
                        Leaderboard
                    </Button>
                    <Button variant="secondary" fullWidth icon="group"
                        onClick={() => { setMenuOpen(false); setView('friends'); }}>
                        Friends
                    </Button>
                    <Button variant="secondary" fullWidth icon="storefront"
                        onClick={() => { setMenuOpen(false); setView('store'); }}>
                        Atlas Shop
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
