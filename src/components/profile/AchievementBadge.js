import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from '../common/Icon';

// A showcased achievement badge that reveals a small info popover (name +
// description) on hover or tap. Used on the leaderboard, profile cards, and the
// account menu. `showName` renders the name inline (pill style) next to the icon.
//
// The popover renders in a portal with fixed positioning so it is never clipped
// by a scrolling ancestor (e.g. the leaderboard list) or a modal's overflow.
function AchievementBadge({ ach, showName = false }) {
    const [open, setOpen] = useState(false);
    const [pos, setPos] = useState(null); // { left, top, placement }
    const wrapRef = useRef(null);
    const popRef = useRef(null);

    useLayoutEffect(() => {
        if (!open) return;
        const btn = wrapRef.current;
        if (!btn) return;
        const r = btn.getBoundingClientRect();
        const above = r.top > 140; // enough room to sit above?
        setPos({
            left: r.left + r.width / 2,
            top: above ? r.top - 8 : r.bottom + 8,
            placement: above ? 'above' : 'below',
        });
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const onDocClick = (e) => {
            if (wrapRef.current && wrapRef.current.contains(e.target)) return;
            if (popRef.current && popRef.current.contains(e.target)) return;
            setOpen(false);
        };
        const onScroll = () => setOpen(false);
        document.addEventListener('pointerdown', onDocClick);
        window.addEventListener('scroll', onScroll, true);
        window.addEventListener('resize', onScroll);
        return () => {
            document.removeEventListener('pointerdown', onDocClick);
            window.removeEventListener('scroll', onScroll, true);
            window.removeEventListener('resize', onScroll);
        };
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
            {open && pos && createPortal(
                <span
                    ref={popRef}
                    className={`ach-popover ach-popover--fixed ach-popover--${pos.placement}`}
                    role="tooltip"
                    style={{ left: pos.left, top: pos.top }}
                >
                    <span className={`ach-popover__title ach-popover__title--${ach.tier}`}>
                        <Icon name={ach.icon} /> {ach.name}
                    </span>
                    <span className="ach-popover__desc">{ach.desc}</span>
                </span>,
                document.body
            )}
        </span>
    );
}

export default AchievementBadge;
