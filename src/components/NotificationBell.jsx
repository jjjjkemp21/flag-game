import React, { useEffect, useState, useCallback } from 'react';
import Icon from './Icon';
import { Modal } from './ui';
import { useToast } from './ui/Toast';
import { useAuth } from '../auth/AuthProvider';
import Markdown from './Markdown';
import { api } from '../api/client';

function formatDate(ms) {
    try {
        return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (_) {
        return '';
    }
}

function NotificationBell() {
    const { user } = useAuth();
    const toast = useToast();
    const [open, setOpen] = useState(false);
    const [announcements, setAnnouncements] = useState([]);
    const [unread, setUnread] = useState(0);
    const [removingId, setRemovingId] = useState(null);
    const isAdmin = !!user?.is_admin;

    const load = useCallback(async () => {
        try {
            const res = await api.get('/announcements');
            setAnnouncements(res.announcements || []);
            setUnread(res.unreadCount || 0);
        } catch (_) {
            /* ignore — bell just stays empty */
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    // Refresh whenever the admin posts a new announcement or wipes the list so
    // the badge updates without a page reload (TopBar + bell are persistent).
    useEffect(() => {
        const onChanged = () => load();
        window.addEventListener('flagGame:announcementsChanged', onChanged);
        return () => window.removeEventListener('flagGame:announcementsChanged', onChanged);
    }, [load]);

    const openPanel = async () => {
        setOpen(true);
        if (unread > 0) {
            try {
                await api.post('/announcements/mark-read');
                setUnread(0);
            } catch (_) { /* ignore */ }
        }
    };

    const removeOne = async (id) => {
        if (!isAdmin) return;
        setRemovingId(id);
        try {
            await api.del(`/announcements/${id}`);
            // Drop locally so the modal updates without waiting for the refetch.
            setAnnouncements((list) => list.filter((a) => a.id !== id));
            // Tell any other listeners (and refresh the unread count from the
            // server — deleting a previously-unread post should lower the badge).
            window.dispatchEvent(new CustomEvent('flagGame:announcementsChanged'));
        } catch (err) {
            toast.danger(err.message || 'Could not delete.');
        } finally {
            setRemovingId(null);
        }
    };

    return (
        <>
            <button className="bell-button" aria-label="Announcements" onClick={openPanel}>
                <Icon name="notifications" />
                {unread > 0 && <span className="bell-badge">{unread > 9 ? '9+' : unread}</span>}
            </button>

            <Modal open={open} onClose={() => setOpen(false)} title="Announcements">
                {announcements.length === 0 ? (
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
                                            onClick={() => removeOne(a.id)}
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
                )}
            </Modal>
        </>
    );
}

export default NotificationBell;
