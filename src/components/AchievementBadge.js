import React, { useEffect, useRef, useState } from 'react';
import Icon from './Icon';

// A showcased achievement badge that reveals a small info popover (name +
// description) on hover or tap. Used on the leaderboard, profile cards, and the
// account menu. `showName` renders the name inline (pill style) next to the icon.
function AchievementBadge({ ach, showName = false }) {
    const [open, setOpen] = useState(false);
    const wrapRef = useRef(null);

    useEffect(() => {
        if (!open) return;
        const onDocClick = (e) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('pointerdown', onDocClick);
        return () => document.removeEventListener('pointerdown', onDocClick);
    }, [open]);

    if (!ach) return null;

    return (
        <span
            ref={wrapRef}
            className="ach-badge-wrap"
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
        >
            <button
                type="button"
                className={`ach-badge ach-badge--${ach.tier}`}
                aria-label={ach.name}
                aria-expanded={open}
                onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
            >
                <Icon name={ach.icon} />
                {showName && <span className="profile-badge__name">{ach.name}</span>}
            </button>
            {open && (
                <span className="ach-popover" role="tooltip">
                    <span className={`ach-popover__title ach-popover__title--${ach.tier}`}>
                        <Icon name={ach.icon} /> {ach.name}
                    </span>
                    <span className="ach-popover__desc">{ach.desc}</span>
                </span>
            )}
        </span>
    );
}

export default AchievementBadge;
