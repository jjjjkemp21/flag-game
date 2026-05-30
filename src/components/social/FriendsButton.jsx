import React from 'react';
import Icon from '../common/Icon';
import { useAuth } from '../../auth/AuthProvider';
import { usePlayingFriendsCount } from '../../lib/presence';

// Header indicator: at a glance, how many friends are playing right now. Polls
// presence globally while signed in, and tapping it jumps to the Friends screen
// to spectate whoever's live. The count badge only lights up when ≥1 friend is
// active, styled like a live notification so it's obvious the moment you log in.
function FriendsButton({ setView }) {
    const { isAuthed } = useAuth();
    const playing = usePlayingFriendsCount();
    if (!isAuthed) return null;

    const active = playing > 0;
    const label = active
        ? `${playing} ${playing === 1 ? 'friend' : 'friends'} playing now`
        : 'Friends';

    return (
        <button
            className={`bell-button friends-button${active ? ' is-active' : ''}`}
            aria-label={label}
            title={label}
            onClick={() => setView('friends')}
        >
            <Icon name="group" />
            {active && (
                <span className="friends-button__badge" aria-hidden="true">
                    {playing > 9 ? '9+' : playing}
                </span>
            )}
        </button>
    );
}

export default FriendsButton;
