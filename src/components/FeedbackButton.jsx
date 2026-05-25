import React, { useCallback, useEffect, useState } from 'react';
import Icon from './Icon';
import { Modal, Button } from './ui';
import { useToast } from './ui/Toast';
import { useAuth } from '../auth/AuthProvider';
import { api } from '../api/client';

const CATEGORIES = [
    { id: 'bug',        label: 'Bug',        icon: 'bug_report' },
    { id: 'suggestion', label: 'Suggestion', icon: 'lightbulb' },
    { id: 'other',      label: 'Other',      icon: 'chat' },
];

function formatDate(ms) {
    try {
        return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (_) {
        return '';
    }
}

function FeedbackButton() {
    const { user, isAuthed } = useAuth();
    const toast = useToast();
    const [open, setOpen] = useState(false);
    const [category, setCategory] = useState('suggestion');
    const [body, setBody] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [list, setList] = useState([]);
    const [busyId, setBusyId] = useState(null);
    const isAdmin = !!user?.is_admin;

    const loadAdminList = useCallback(async () => {
        if (!isAdmin) return;
        try {
            const res = await api.get('/feedback');
            setList(res.feedback || []);
        } catch (_) {
            /* stay empty */
        }
    }, [isAdmin]);

    useEffect(() => {
        if (open && isAdmin) loadAdminList();
    }, [open, isAdmin, loadAdminList]);

    const submit = async (e) => {
        e?.preventDefault?.();
        const text = body.trim();
        if (!text || submitting) return;
        setSubmitting(true);
        try {
            await api.post('/feedback', { category, body: text });
            toast.success('Thanks — sent to the devs!');
            setBody('');
            setCategory('suggestion');
            if (isAdmin) loadAdminList();
            else setOpen(false);
        } catch (err) {
            toast.danger(err.message || 'Could not send feedback.');
        } finally {
            setSubmitting(false);
        }
    };

    const resolve = async (id) => {
        setBusyId(id);
        try {
            await api.post(`/feedback/${id}/resolve`);
            setList((arr) => arr.map((f) => (f.id === id ? { ...f, resolved_at: Date.now() } : f)));
        } catch (err) {
            toast.danger(err.message || 'Could not update.');
        } finally {
            setBusyId(null);
        }
    };

    const remove = async (id) => {
        setBusyId(id);
        try {
            await api.del(`/feedback/${id}`);
            setList((arr) => arr.filter((f) => f.id !== id));
        } catch (err) {
            toast.danger(err.message || 'Could not delete.');
        } finally {
            setBusyId(null);
        }
    };

    if (!isAuthed) return null;

    const charsLeft = 2000 - body.length;

    return (
        <>
            <button
                className="bell-button"
                aria-label="Send feedback"
                title="Send feedback to the devs"
                onClick={() => setOpen(true)}
            >
                <Icon name="campaign" />
            </button>

            <Modal open={open} onClose={() => setOpen(false)} title="Feedback & bug reports">
                <p className="auth-hint">
                    Spot something broken or have an idea? Send it straight to the devs.
                </p>

                <form className="feedback-form" onSubmit={submit}>
                    <div className="feedback-category" role="radiogroup" aria-label="Feedback type">
                        {CATEGORIES.map((c) => (
                            <button
                                key={c.id}
                                type="button"
                                role="radio"
                                aria-checked={category === c.id}
                                className={`feedback-category__chip${category === c.id ? ' is-active' : ''}`}
                                onClick={() => setCategory(c.id)}
                            >
                                <Icon name={c.icon} /> {c.label}
                            </button>
                        ))}
                    </div>

                    <textarea
                        className="feedback-textarea"
                        value={body}
                        onChange={(e) => setBody(e.target.value.slice(0, 2000))}
                        placeholder={
                            category === 'bug'
                                ? 'What went wrong? Steps to reproduce help a lot.'
                                : category === 'suggestion'
                                ? "What would make Flag Game more fun?"
                                : 'Tell us anything.'
                        }
                        rows={6}
                        maxLength={2000}
                        required
                    />
                    <div className="feedback-foot">
                        <span className="feedback-count">{charsLeft} chars left</span>
                        <Button type="submit" variant="primary" icon="send" disabled={submitting || !body.trim()}>
                            {submitting ? 'Sending…' : 'Send'}
                        </Button>
                    </div>
                </form>

                {isAdmin && (
                    <div className="feedback-admin">
                        <h3 className="feedback-admin__heading">
                            Inbox <span className="feedback-admin__count">{list.length}</span>
                        </h3>
                        {list.length === 0 ? (
                            <p className="auth-hint">No feedback yet.</p>
                        ) : (
                            <ul className="feedback-list">
                                {list.map((f) => (
                                    <li
                                        key={f.id}
                                        className={`feedback-item${f.resolved_at ? ' is-resolved' : ''}`}
                                    >
                                        <div className="feedback-item__head">
                                            <span className={`feedback-tag feedback-tag--${f.category}`}>{f.category}</span>
                                            <strong>@{f.username}</strong>
                                            <span className="feedback-date">{formatDate(f.created_at)}</span>
                                            <span className="feedback-actions">
                                                {!f.resolved_at && (
                                                    <button
                                                        type="button"
                                                        className="feedback-icon-btn"
                                                        title="Mark resolved"
                                                        aria-label={`Mark feedback #${f.id} resolved`}
                                                        disabled={busyId === f.id}
                                                        onClick={() => resolve(f.id)}
                                                    >
                                                        <Icon name="check_circle" />
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    className="feedback-icon-btn feedback-icon-btn--danger"
                                                    title="Delete"
                                                    aria-label={`Delete feedback #${f.id}`}
                                                    disabled={busyId === f.id}
                                                    onClick={() => remove(f.id)}
                                                >
                                                    <Icon name={busyId === f.id ? 'hourglass_empty' : 'delete'} />
                                                </button>
                                            </span>
                                        </div>
                                        <p className="feedback-body">{f.body}</p>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </Modal>
        </>
    );
}

export default FeedbackButton;
