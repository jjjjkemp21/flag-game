import React, { useState } from 'react';
import Icon from './Icon';
import { Button, Modal } from './ui';
import { useToast } from './ui/Toast';
import { useAuth } from '../auth/AuthProvider';
import { api } from '../api/client';
import Markdown from './Markdown';

function AdminAnnounce({ setView }) {
    const { user } = useAuth();
    const toast = useToast();
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [busy, setBusy] = useState(false);
    const [clearOpen, setClearOpen] = useState(false);
    const [clearBusy, setClearBusy] = useState(false);

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
