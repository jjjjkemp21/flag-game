import React, { useState } from 'react';
import Icon from './Icon';
import { Button } from './ui';
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
            setView('menu');
        } catch (err) {
            toast.danger(err.message || 'Could not publish.');
        } finally {
            setBusy(false);
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
        </div>
    );
}

export default AdminAnnounce;
