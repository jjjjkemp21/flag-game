import React, { useState } from 'react';
import Icon from './Icon';
import { Button, Modal } from './ui';
import { useToast } from './ui/Toast';
import { useAuth } from '../auth/AuthProvider';
import { api } from '../api/client';
import { loadCurrency } from '../lib/currency';
import Markdown from './Markdown';
import AtlasBucksIcon from '../assets/illustrations/AtlasBucks';

function AdminAnnounce({ setView }) {
    const { user } = useAuth();
    const toast = useToast();
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [busy, setBusy] = useState(false);
    const [clearOpen, setClearOpen] = useState(false);
    const [clearBusy, setClearBusy] = useState(false);
    const [grantUser, setGrantUser] = useState('');
    const [grantAmount, setGrantAmount] = useState('');
    const [grantBusy, setGrantBusy] = useState(false);

    if (!user?.is_admin) {
        return (
            <div className="quiz-box">
                <div className="quiz-topbar">
                    <button className="back-button" onClick={() => setView('menu')} aria-label="Back">
                        <Icon name="arrow_back" /> Back
                    </button>
                </div>
                <div className="signin-prompt">
                    <Icon name="lock" size="xl" />
                    <h2>Admins only</h2>
                    <p>You don't have permission to post announcements.</p>
                </div>
            </div>
        );
    }

    const publish = async (e) => {
        e.preventDefault();
        if (!title.trim() || !body.trim()) {
            toast.danger('Title and body are required.');
            return;
        }
        setBusy(true);
        try {
            await api.post('/announcements', { title: title.trim(), body });
            toast.success('Announcement published!');
            setTitle('');
            setBody('');
            // Let the bell re-fetch so the new post lands immediately.
            window.dispatchEvent(new CustomEvent('flagGame:announcementsChanged'));
            setView('menu');
        } catch (err) {
            toast.danger(err.message || 'Could not publish.');
        } finally {
            setBusy(false);
        }
    };

    const grant = async (e) => {
        e.preventDefault();
        const name = grantUser.trim();
        const amount = parseInt(grantAmount, 10);
        if (!name) {
            toast.danger('Enter a username.');
            return;
        }
        if (!Number.isFinite(amount) || amount === 0) {
            toast.danger('Enter a non-zero amount.');
            return;
        }
        setGrantBusy(true);
        try {
            const res = await api.post('/currency/admin/grant', { username: name, amount });
            const verb = res.granted >= 0 ? 'Gave' : 'Removed';
            const abs = Math.abs(res.granted);
            toast.success(`${verb} ${abs.toLocaleString()} bucks ${res.granted >= 0 ? 'to' : 'from'} ${res.username}.`);
            setGrantUser('');
            setGrantAmount('');
            // If the admin granted to themselves, sync the topbar chip.
            if (user?.username && res.username.toLowerCase() === user.username.toLowerCase()) {
                try { await loadCurrency(); } catch (_) { /* topbar will catch up on next poll */ }
            }
        } catch (err) {
            toast.danger(err.message || 'Could not grant bucks.');
        } finally {
            setGrantBusy(false);
        }
    };

    const clearAll = async () => {
        setClearBusy(true);
        try {
            const res = await api.del('/announcements');
            toast.success(`Cleared ${res.deleted || 0} announcement${(res.deleted || 0) === 1 ? '' : 's'}.`);
            // Force the bell to refresh so the badge clears across the app.
            window.dispatchEvent(new CustomEvent('flagGame:announcementsChanged'));
            setClearOpen(false);
        } catch (err) {
            toast.danger(err.message || 'Could not clear.');
        } finally {
            setClearBusy(false);
        }
    };

    return (
        <div className="quiz-box admin-box">
            <div className="quiz-topbar">
                <button className="back-button" onClick={() => setView('menu')} aria-label="Back">
                    <Icon name="arrow_back" /> Back
                </button>
            </div>
            <h2 className="text-center">New Announcement</h2>

            <form className="auth-form" onSubmit={publish} style={{ width: '100%' }}>
                <label className="auth-field">
                    <span className="auth-field__label">Title</span>
                    <input
                        className="auth-field__input"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. New: Daily Challenge mode"
                    />
                </label>
                <label className="auth-field">
                    <span className="auth-field__label">Body — Markdown supported (**bold**, *italic*, lists, &gt; quotes)</span>
                    <textarea
                        className="auth-field__input admin-textarea"
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        rows={8}
                        placeholder={'**What\'s new**\n\n- First change\n- Second change'}
                    />
                </label>

                {body.trim() && (
                    <div className="admin-preview">
                        <span className="auth-field__label">Preview</span>
                        <Markdown className="announcement-body">{body}</Markdown>
                    </div>
                )}

                <Button type="submit" variant="primary" fullWidth icon="campaign" disabled={busy}>
                    {busy ? 'Publishing…' : 'Publish announcement'}
                </Button>
            </form>

            {/* Grant Atlas Bucks — separate form so its own Enter key doesn't
                fire the publish handler. Negative amounts claw back bucks. */}
            <div className="admin-section">
                <h3 className="settings-section-title">
                    <AtlasBucksIcon size={18} /> Grant Atlas Bucks
                </h3>
                <p className="auth-hint">
                    Adds bucks to any player's balance by username. Use a negative
                    amount to remove bucks (balances are clamped at zero).
                </p>
                <form className="auth-form" onSubmit={grant} style={{ width: '100%' }}>
                    <label className="auth-field">
                        <span className="auth-field__label">Username</span>
                        <input
                            className="auth-field__input"
                            value={grantUser}
                            onChange={(e) => setGrantUser(e.target.value)}
                            placeholder="e.g. globetrotter"
                            autoComplete="off"
                        />
                    </label>
                    <label className="auth-field">
                        <span className="auth-field__label">Amount</span>
                        <input
                            className="auth-field__input"
                            type="number"
                            inputMode="numeric"
                            value={grantAmount}
                            onChange={(e) => setGrantAmount(e.target.value)}
                            placeholder="e.g. 500"
                        />
                    </label>
                    <Button type="submit" variant="accent" fullWidth icon="redeem" disabled={grantBusy}>
                        {grantBusy ? 'Granting…' : 'Grant bucks'}
                    </Button>
                </form>
            </div>

            {/* Bulk wipe — separated from the publish form so an accidental Enter
                in the title/body fields can't trigger it. Confirmation modal
                gates the actual DELETE call. */}
            <div className="admin-danger">
                <h3 className="settings-section-title">Danger zone</h3>
                <p className="auth-hint">Removes every announcement from the bell for every player. There is no undo.</p>
                <Button
                    variant="danger"
                    icon="delete_sweep"
                    onClick={() => setClearOpen(true)}
                    disabled={clearBusy}
                >
                    Clear all alerts
                </Button>
            </div>

            <Modal open={clearOpen} onClose={() => setClearOpen(false)} title="Clear all alerts?">
                <p style={{ color: 'var(--color-ink-soft)' }}>
                    Every announcement will be deleted for every player, and the unread
                    badge will reset to zero. This cannot be undone.
                </p>
                <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'flex-end' }}>
                    <Button variant="secondary" onClick={() => setClearOpen(false)} disabled={clearBusy}>
                        Cancel
                    </Button>
                    <Button variant="danger" icon="delete_sweep" onClick={clearAll} disabled={clearBusy}>
                        {clearBusy ? 'Clearing…' : 'Yes, clear all'}
                    </Button>
                </div>
            </Modal>
        </div>
    );
}

export default AdminAnnounce;
