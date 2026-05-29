import React from 'react';
import Icon from '../common/Icon';
import { useQuests, claimableCount } from '../../lib/quests';

// Header chip that mirrors the inbox bell — a single button with a count
// pill when there are quests waiting to be claimed. Click → Quests screen.
// Subscribes to the quests store so the badge updates the instant a quest
// flips to done (either from a progress flush or after the user dismisses
// the celebration modal without claiming).
export default function QuestsButton({ setView }) {
    useQuests();
    const count = claimableCount();
    const ariaLabel = count > 0 ? `Quests — ${count} ready to claim` : 'Quests';

    return (
        <button
            type="button"
            className={`bell-button quests-button${count > 0 ? ' has-claims' : ''}`}
            aria-label={ariaLabel}
            onClick={() => setView('quests')}
        >
            <Icon name="task_alt" />
            {count > 0 && (
                <span className="bell-badge">{count > 9 ? '9+' : count}</span>
            )}
        </button>
    );
}
