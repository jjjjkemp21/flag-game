import React, { useCallback, useEffect, useState } from 'react';
import Icon from './Icon';
import { Modal, Button } from './ui';
import { useToast } from './ui/Toast';
import { useAuth } from '../auth/AuthProvider';
import Markdown from './Markdown';
import { api } from '../api/client';

const FEEDBACK_CATEGORIES = [
    { id: 'bug',        label: 'Bug',        icon: 'bug_report' },
    { id: 'suggestion', label: 'Suggestion', icon: 'lightbulb'  },
    { id: 'other',      label: 'Other',      icon: 'chat'       },
];

const MSG_MAX = 1000;

function formatDate(ms) {
    try {
        return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (_) {
        return '';
    }
}

function InboxButton() {
    const { user } = useAuth();
    const toast = useToast();
    const isAdmin = !!user?.is_admin;

    const [open, setOpen] = useState(false);
    const [tab, setTab] = useState('messages'); // 'messages' | 'news' | 'send' | 'inbox'

    // Announcements
    const [announcements, setAnnouncements] = useState([]);
    const [unreadNews, setUnreadNews] = useState(0);
    const [removingId, setRemovingId] = useState(null);

    // Messages (DMs between friends)
    const [received, setReceived] = useState([]);
    const [sent, setSent] = useState([]);
    const [unreadMsgs, setUnreadMsgs] = useState(0);
    const [showSent, setShowSent] = useState(false);
    const [composing, setComposing] = useState(false);
    const [friends, setFriends] = useState([]);
    const [friendsLoaded, setFriendsLoaded] = useState(false);
    const [recipient, setRecipient] = useState('');
    const [msgBody, setMsgBody] = useState('');
    const [sending, setSending] = useState(false);
    const [deletingMsgId, setDeletingMsgId] = useState(null);

    // Send feedback
    const [category, setCategory] = useState('suggestion');
    const [body, setBody] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Admin feedback inbox
    const [adminFeedback, setAdminFeedback] = useState([]);
    const [busyId, setBusyId] = useState(null);

    const loadAnnouncements = useCallback(async () => {
        try {
            const res = await api.get('/announcements');
            setAnnouncements(res.announcements || []);
            setUnreadNews(res.unreadCount || 0);
        } catch (_) { /* ignore — empty inbox is fine */ }
    }, []);

    const loadMessages = useCallback(async () => {
        try {
            const res = await api.get('/messages');
            setReceived(res.received || []);
            setSent(res.sent || []);
            setUnreadMsgs(res.unreadCount || 0);
        } catch (_) { /* ignore — guests/offline see empty */ }
    }, []);

    const loadFriends = useCallback(async () => {
        try {
            const res = await api.get('/friends');
            setFriends(res.friends || []);
            setFriendsLoaded(true);
        } catch (_) {
            setFriends([]);
            setFriendsLoaded(true);
        }
    }, []);

    const loadAdminFeedback = useCallback(async () => {
        if (!isAdmin) return;
        try {
            const res = await api.get('/feedback');
            setAdminFeedback(res.feedback || []);
        } catch (_) { /* stay empty */ }
    }, [isAdmin]);

    useEffect(() => { loadAnnouncements(); loadMessages(); }, [loadAnnouncements, loadMessages]);

    // Refresh whenever the admin posts a new announcement / wipes the list, or
    // a DM is sent in another tab — keeps the badge accurate without a reload.
    useEffect(() => {
        const onAnn = () => loadAnnouncements();
        const onMsg = () => loadMessages();
        window.addEventListener('flagGame:announcementsChanged', onAnn);
        window.addEventListener('flagGame:messagesChanged', onMsg);
        return () => {
            window.removeEventListener('flagGame:announcementsChanged', onAnn);
            window.removeEventListener('flagGame:messagesChanged', onMsg);
        };
    }, [loadAnnouncements, loadMessages]);

    const openPanel = async () => {
        setOpen(true);
        // Default to whichever tab actually has unread items, falling back to
        // Messages so the user lands on the personal stuff first.
        setTab(unreadMsgs > 0 ? 'messages' : (unreadNews > 0 ? 'news' : 'messages'));
        if (unreadNews > 0) {
            try {
                await api.post('/announcements/mark-read');
                setUnreadNews(0);
            } catch (_) { /* ignore */ }
        }
        if (unreadMsgs > 0) {
            try {
                await api.post('/messages/mark-read');
                setUnreadMsgs(0);
                // Reflect read_at locally so the dot disappears immediately.
                setReceived((list) => list.map((m) => (m.read_at ? m : { ...m, read_at: Date.now() })));
            } catch (_) { /* ignore */ }
        }
    };

    const removeAnnouncement = async (id) => {
        if (!isAdmin) return;
        setRemovingId(id);
        try {
            await api.del(`/announcements/${id}`);
            setAnnouncements((list) => list.filter((a) => a.id !== id));
            window.dispatchEvent(new CustomEvent('flagGame:announcementsChanged'));
        } catch (err) {
            toast.danger(err.message || 'Could not delete.');
        } finally {
            setRemovingId(null);
        }
    };

    const submitFeedback = async (e) => {
        e?.preventDefault?.();
        const text = body.trim();
        if (!text || submitting) return;
        setSubmitting(true);
        try {
            await api.post('/feedback', { category, body: text });
            toast.success('Thanks — sent to the devs!');
            setBody('');
            setCategory('suggestion');
            if (isAdmin) {
                loadAdminFeedback();
                setTab('inbox');
            } else {
                setOpen(false);
            }
        } catch (err) {
            toast.danger(err.message || 'Could not send feedback.');
        } finally {
            setSubmitting(false);
        }
    };

    const resolveFeedback = async (id) => {
        setBusyId(id);
        try {
            await api.post(`/feedback/${id}/resolve`);
            setAdminFeedback((arr) => arr.map((f) => (f.id === id ? { ...f, resolved_at: Date.now() } : f)));
        } catch (err) {
            toast.danger(err.message || 'Could not update.');
        } finally {
            setBusyId(null);
        }
    };

    const removeFeedback = async (id) => {
        setBusyId(id);
        try {
            await api.del(`/feedback/${id}`);
            setAdminFeedback((arr) => arr.filter((f) => f.id !== id));
        } catch (err) {
            toast.danger(err.message || 'Could not delete.');
        } finally {
            setBusyId(null);
        }
    };

    const openCompose = () => {
        setComposing(true);
        setRecipient('');
        setMsgBody('');
        if (!friendsLoaded) loadFriends();
    };

    const sendMessage = async (e) => {
        e?.preventDefault?.();
        const text = msgBody.trim();
        if (!recipient || !text || sending) return;
        setSending(true);
        try {
            await api.post('/messages', { recipient, body: text });
            toast.success(`Sent to @${recipient}.`);
            setComposing(false);
            setRecipient('');
            setMsgBody('');
            await loadMessages();
            setShowSent(true);
        } catch (err) {
            toast.danger(err.message || 'Could not send message.');
        } finally {
            setSending(false);
        }
    };

    const deleteMessage = async (id) => {
        setDeletingMsgId(id);
        try {
            await api.del(`/messages/${id}`);
            setReceived((list) => list.filter((m) => m.id !== id));
            setSent((list) => list.filter((m) => m.id !== id));
        } catch (err) {
            toast.danger(err.message || 'Could not delete.');
        } finally {
            setDeletingMsgId(null);
        }
    };

    // Lazy-load admin feedback when the admin tab is first viewed.
    useEffect(() => {
        if (open && isAdmin && tab === 'inbox') loadAdminFeedback();
    }, [open, isAdmin, tab, loadAdminFeedback]);

    const totalUnread = unreadNews + unreadMsgs;
    const feedbackCharsLeft = 2000 - body.length;
    const msgCharsLeft = MSG_MAX - msgBody.length;

    const messageList = (items, side) => (
        <ul className="message-list">
            {items.map((m) => (
                <li key={m.id} className={`message-item${m.read_at || side === 'sent' ? '' : ' is-unread'}`}>
                    <div className="message-head">
                        <strong>
                            {side === 'received' ? '@' + m.from_username : 'To @' + m.to_username}
                        </strong>
                        <span className="message-date">{formatDate(m.created_at)}</span>
                        <button
                            type="button"
                            className="announcement-remove"
                            onClick={() => deleteMessage(m.id)}
                            disabled={deletingMsgId === m.id}
                            aria-label={`Delete message`}
                            title="Delete this message"
                        >
                            <Icon name={deletingMsgId === m.id ? 'hourglass_empty' : 'delete'} />
                        </button>
                    </div>
                    <p className="message-body">{m.body}</p>
                </li>
            ))}
        </ul>
    );

    return (
        <>
            <button className="bell-button" aria-label="Inbox" onClick={openPanel}>
                <Icon name="inbox" />
                {totalUnread > 0 && <span className="bell-badge">{totalUnread > 9 ? '9+' : totalUnread}</span>}
            </button>

            <Modal open={open} onClose={() => setOpen(false)} title="Inbox">
                <div className="feedback-category" role="tablist" aria-label="Inbox sections">
                    <button
                        type="button"
                        role="tab"
                        aria-selected={tab === 'messages'}
                        className={`feedback-category__chip${tab === 'messages' ? ' is-active' : ''}`}
                        onClick={() => setTab('messages')}
                    >
                        <Icon name="forum" /> Messages
                        {unreadMsgs > 0 && <span className="tab-pill">{unreadMsgs > 9 ? '9+' : unreadMsgs}</span>}
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={tab === 'news'}
                        className={`feedback-category__chip${tab === 'news' ? ' is-active' : ''}`}
                        onClick={() => setTab('news')}
                    >
                        <Icon name="campaign" /> News
                        {unreadNews > 0 && <span className="tab-pill">{unreadNews > 9 ? '9+' : unreadNews}</span>}
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={tab === 'send'}
                        className={`feedback-category__chip${tab === 'send' ? ' is-active' : ''}`}
                        onClick={() => setTab('send')}
                    >
                        <Icon name="send" /> Send feedback
                    </button>
                    {isAdmin && (
                        <button
                            type="button"
                            role="tab"
                            aria-selected={tab === 'inbox'}
                            className={`feedback-category__chip${tab === 'inbox' ? ' is-active' : ''}`}
                            onClick={() => setTab('inbox')}
                        >
                            <Icon name="mail" /> Feedback inbox
                        </button>
                    )}
                </div>

                {tab === 'messages' && (
                    <div className="message-pane">
                        <div className="message-toolbar">
                            <Button
                                variant={composing ? 'secondary' : 'primary'}
                                icon={composing ? 'close' : 'edit'}
                                onClick={() => (composing ? setComposing(false) : openCompose())}
                            >
                                {composing ? 'Cancel' : 'New message'}
                            </Button>
                            {sent.length > 0 && (
                                <button
                                    type="button"
                                    className={`feedback-category__chip${showSent ? ' is-active' : ''}`}
                                    onClick={() => setShowSent((v) => !v)}
                                >
                                    <Icon name="outbox" /> Sent
                                </button>
                            )}
                        </div>

                        {composing && (
                            <form className="message-compose" onSubmit={sendMessage}>
                                {!friendsLoaded ? (
                                    <p className="auth-hint">Loading friends…</p>
                                ) : friends.length === 0 ? (
                                    <p className="auth-hint">
                                        Add a friend first — only accepted friends can DM each other.
                                    </p>
                                ) : (
                                    <>
                                        <label className="message-field">
                                            <span className="message-field__label">To</span>
                                            <select
                                                className="auth-field__input"
                                                value={recipient}
                                                onChange={(e) => setRecipient(e.target.value)}
                                                required
                                            >
                                                <option value="" disabled>Pick a friend…</option>
                                                {friends.map((f) => (
                                                    <option key={f.id} value={f.username}>@{f.username}</option>
                                                ))}
                                            </select>
                                        </label>
                                        <textarea
                                            className="feedback-textarea"
                                            value={msgBody}
                                            onChange={(e) => setMsgBody(e.target.value.slice(0, MSG_MAX))}
                                            placeholder="Say hi, share a high score, trash-talk a flag…"
                                            rows={4}
                                            maxLength={MSG_MAX}
                                            required
                                        />
                                        <div className="feedback-foot">
                                            <span className="feedback-count">{msgCharsLeft} chars left</span>
                                            <Button
                                                type="submit"
                                                variant="primary"
                                                icon="send"
                                                disabled={sending || !recipient || !msgBody.trim()}
                                            >
                                                {sending ? 'Sending…' : 'Send'}
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </form>
                        )}

                        {!showSent && (
                            received.length === 0 ? (
                                <p className="auth-hint">No messages yet. Your friends can DM you here.</p>
                            ) : messageList(received, 'received')
                        )}
                        {showSent && (
                            sent.length === 0 ? (
                                <p className="auth-hint">You haven't sent any messages yet.</p>
                            ) : messageList(sent, 'sent')
                        )}
                    </div>
                )}

                {tab === 'news' && (
                    announcements.length === 0 ? (
                        <p className="auth-hint">Nothing here yet. Check back for release notes and updates.</p>
                    ) : (
                        <ul className="announcement-list">
                            {announcements.map((a) => (
                                <li key={a.id} className="announcement-item">
                                    <div className="announcement-head">
                                        <strong>{a.title}</strong>
                                        <span className="announcement-date">{formatDate(a.created_at)}</span>
                                        {isAdmin && (
                                            <button
                                                type="button"
                                                className="announcement-remove"
                                                onClick={() => removeAnnouncement(a.id)}
                                                disabled={removingId === a.id}
                                                aria-label={`Delete announcement: ${a.title}`}
                                                title="Delete this announcement"
                                            >
                                                <Icon name={removingId === a.id ? 'hourglass_empty' : 'delete'} />
                                            </button>
                                        )}
                                    </div>
                                    <Markdown className="announcement-body">{a.body}</Markdown>
                                </li>
                            ))}
                        </ul>
                    )
                )}

                {tab === 'send' && (
                    <form className="feedback-form" onSubmit={submitFeedback}>
                        <p className="auth-hint">
                            Spot something broken or have an idea? Send it straight to the devs.
                        </p>
                        <div className="feedback-category" role="radiogroup" aria-label="Feedback type">
                            {FEEDBACK_CATEGORIES.map((c) => (
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
                            <span className="feedback-count">{feedbackCharsLeft} chars left</span>
                            <Button type="submit" variant="primary" icon="send" disabled={submitting || !body.trim()}>
                                {submitting ? 'Sending…' : 'Send'}
                            </Button>
                        </div>
                    </form>
                )}

                {tab === 'inbox' && isAdmin && (
                    <div className="feedback-admin">
                        <h3 className="feedback-admin__heading">
                            Inbox <span className="feedback-admin__count">{adminFeedback.length}</span>
                        </h3>
                        {adminFeedback.length === 0 ? (
                            <p className="auth-hint">No feedback yet.</p>
                        ) : (
                            <ul className="feedback-list">
                                {adminFeedback.map((f) => (
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
                                                        onClick={() => resolveFeedback(f.id)}
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
                                                    onClick={() => removeFeedback(f.id)}
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

export default InboxButton;
