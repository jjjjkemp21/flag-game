import React, { useEffect, useRef, useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Icon from '../common/Icon';
import { useAuth } from '../../auth/AuthProvider';
import { spectate, useSpectateAsTarget } from '../../lib/spectate';
import Mascot from '../../assets/illustrations/Mascot';

// On-screen lifetime of a floating reaction (client-clock relative; matches
// REACTION_FLOAT_MS in SpectatorScreen).
const REACTION_DISMISS_MS = 2800;

// A compact widget the active-player sees in the corner of any quiz/match
// when one or more friends are spectating. Polls the spectate endpoint only
// while watchers > 0 (gated by the heartbeat response in usePresence) so
// nothing extra hits the server in the common no-watchers case.
function SpectatorsBadge({ watchers, lastReactionId }) {
    const { user } = useAuth();
    const myId = user && user.id;
    const hasWatchers = !!myId && watchers > 0;

    const state = useSpectateAsTarget(myId, hasWatchers, lastReactionId);
    const [expanded, setExpanded] = useState(false);
    const [visibleReactions, setVisibleReactions] = useState([]);
    const seenRef = useRef(new Set());

    // Cap at 3 simultaneous reactions over the badge — anything more would stack
    // into a column tall enough to overlap the quiz HUD. Newest wins.
    const MAX_BADGE_REACTIONS = 3;
    useEffect(() => {
        if (!state || !Array.isArray(state.reactions)) return;
        const fresh = state.reactions.filter((r) => !seenRef.current.has(r.id));
        if (fresh.length === 0) return;
        fresh.forEach((r) => seenRef.current.add(r.id));
        setVisibleReactions((prev) => [...prev, ...fresh].slice(-MAX_BADGE_REACTIONS));
    }, [state]);

    const spectators = useMemo(() => {
        if (!state || !Array.isArray(state.spectators)) return [];
        return state.spectators;
    }, [state]);

    // Auto-dismiss reactions after a fixed on-screen lifetime. Deriving the
    // delay from the server's absolute expiresAt minus the CLIENT's Date.now()
    // misbehaves under clock skew (reactions linger or flash); a fixed duration
    // (matching SpectatorScreen's REACTION_FLOAT_MS) is skew-immune.
    useEffect(() => {
        if (visibleReactions.length === 0) return undefined;
        const timers = visibleReactions.map((r) => (
            setTimeout(() => {
                setVisibleReactions((prev) => prev.filter((x) => x.id !== r.id));
            }, REACTION_DISMISS_MS)
        ));
        return () => timers.forEach(clearTimeout);
    }, [visibleReactions]);

    if (!hasWatchers && visibleReactions.length === 0) return null;

    return (
        <div className="spectators-badge" data-expanded={expanded ? 'true' : 'false'}>
            <button
                type="button"
                className="spectators-badge-button"
                onClick={() => setExpanded((v) => !v)}
                aria-label={`${watchers} ${watchers === 1 ? 'friend' : 'friends'} watching`}
            >
                <span className="spectators-badge-eye">
                    <Icon name="visibility" />
                    <span className="spectators-badge-pulse" aria-hidden="true" />
                </span>
                <span className="spectators-badge-count">{watchers}</span>
                <span className="spectators-badge-label">watching</span>
            </button>

            {expanded && spectators.length > 0 && (
                <div className="spectators-badge-popover">
                    <span className="auth-hint">Watching</span>
                    {spectators.slice(0, 8).map((s) => (
                        <span key={s.id} className="spectators-badge-row">
                            <Mascot size={28} cosmetics={s.cosmetics} still />
                            <span className="spectators-badge-rowname">{s.username}</span>
                            <button
                                type="button"
                                className="spectators-badge-kick"
                                aria-label={`Boot ${s.username}`}
                                title={`Boot ${s.username}`}
                                onClick={() => {
                                    // Fire-and-forget; the spectator drops on
                                    // the server's next prune and disappears
                                    // from the popover on the next poll.
                                    spectate.kick(myId, s.id).catch(() => {});
                                }}
                            >
                                <Icon name="person_remove" />
                            </button>
                        </span>
                    ))}
                    {spectators.length > 8 && (
                        <span className="auth-hint">+{spectators.length - 8} more</span>
                    )}
                </div>
            )}

            <div className="spectators-badge-reactions" aria-live="polite">
                <AnimatePresence>
                    {visibleReactions.map((r) => (
                        <motion.div
                            key={r.id}
                            className={`spectators-badge-reaction ${r.kind === 'message' ? 'is-message' : 'is-emote'}`}
                            initial={{ opacity: 0, x: 10, scale: 0.92 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 16, scale: 0.95 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Mascot
                                size={36}
                                mood="cheer"
                                cosmetics={r.fromCosmetics}
                                still
                                emotePlay={r.kind === 'emote' ? { id: r.payload && r.payload.emoteId, playId: r.id } : null}
                            />
                            <span className="spectators-badge-reaction__body">
                                <span className="spectators-badge-from">{r.fromUsername}</span>
                                {r.kind === 'message' && r.payload && (
                                    <span className="spectators-badge-bubble">{r.payload.text}</span>
                                )}
                            </span>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}

export default SpectatorsBadge;
