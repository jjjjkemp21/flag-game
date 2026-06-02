import React, { useMemo } from 'react';
import {
    US_STATE_PATHS,
    US_MAP_VIEW_WIDTH,
    US_MAP_VIEW_HEIGHT,
    US_MAP_SEPARATOR_D,
} from '../../data/usStatesPaths';

// Clickable 2D US states map. Geometry comes from a CC0 Wikimedia source
// (see tools/extract_us_states_paths.js) baked into a JS module so the bundle
// ships it with no runtime fetch. Alaska + Hawaii sit in the standard
// bottom-left insets, separated from the contiguous body by US_MAP_SEPARATOR_D.
//
// Props:
//   highlightedCode      lowercase state postal code (e.g. 'ca') to glow as the prompt
//   answerCode           after the player has answered, the actual correct state
//                         (drives the green flash regardless of pick)
//   chosenCode           the state the player clicked (drives the red flash on miss)
//   onPick(code)         click handler; receives the lowercase code
//   disabled             ignore clicks (e.g. while a question is locked in)
//   showLabels           overlay every state's 2-letter postal code (default
//                         FALSE — labels would give the quiz away)
//   revealCode           label JUST this one state, regardless of showLabels.
//                         Used by the quiz after the player has answered, so
//                         the reveal also teaches the postal code.
function UsMap({
    highlightedCode = null,
    answerCode = null,
    chosenCode = null,
    onPick,
    disabled = false,
    showLabels = false,
    revealCode = null,
    className = '',
    ariaLabel = 'Map of the United States',
}) {
    const codes = useMemo(() => Object.keys(US_STATE_PATHS).sort(), []);

    const handleClick = (code) => () => {
        if (disabled || !onPick) return;
        onPick(code);
    };

    return (
        <svg
            className={`us-map ${className}`}
            viewBox={`0 0 ${US_MAP_VIEW_WIDTH} ${US_MAP_VIEW_HEIGHT}`}
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label={ariaLabel}
        >
            {/* Inset separators around AK/HI — purely decorative. */}
            {US_MAP_SEPARATOR_D && (
                <path d={US_MAP_SEPARATOR_D} className="us-map__separator" fill="none" />
            )}
            <g className={`us-map__states ${disabled ? 'is-disabled' : ''}`}>
                {codes.map((code) => {
                    let stateClass = 'us-map__state';
                    if (code === answerCode) stateClass += ' is-correct';
                    else if (code === chosenCode) stateClass += ' is-wrong';
                    else if (code === highlightedCode) stateClass += ' is-prompt';
                    return (
                        <path
                            key={code}
                            d={US_STATE_PATHS[code]}
                            className={stateClass}
                            data-code={code}
                            tabIndex={disabled ? -1 : 0}
                            role={onPick ? 'button' : undefined}
                            aria-label={code.toUpperCase()}
                            onClick={handleClick(code)}
                            onKeyDown={(e) => {
                                if (disabled || !onPick) return;
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    onPick(code);
                                }
                            }}
                        />
                    );
                })}
            </g>
            {(showLabels || revealCode || chosenCode) && (
                <g className="us-map__labels" aria-hidden="true">
                    {codes.map((code) => {
                        const isCorrect = code === revealCode;
                        const isWrong = code === chosenCode && code !== answerCode;
                        // showLabels = every state; otherwise just the revealed
                        // correct answer plus the player's wrong pick (if any).
                        if (!showLabels && !isCorrect && !isWrong) return null;
                        const c = LABEL_CENTERS[code];
                        if (!c) return null;
                        let labelClass = 'us-map__label';
                        if (isCorrect) labelClass += ' is-reveal is-correct';
                        else if (isWrong) labelClass += ' is-reveal is-wrong';
                        return (
                            <text
                                key={code}
                                x={c.x}
                                y={c.y}
                                className={labelClass}
                                textAnchor="middle"
                            >
                                {code.toUpperCase()}
                            </text>
                        );
                    })}
                </g>
            )}
        </svg>
    );
}

// Hand-tuned label anchors per state for the cleaned-up overlay. Coordinates
// are in the SVG's viewBox space (959 × 593). Picked by eye to sit roughly at
// each state's visual centroid; small states (RI/CT/DE/etc.) are nudged so the
// label doesn't spill into a neighbour.
const LABEL_CENTERS = {
    ak: { x: 110, y: 530 },
    al: { x: 657, y: 410 },
    ar: { x: 567, y: 380 },
    az: { x: 175, y: 380 },
    ca: { x: 70,  y: 320 },
    co: { x: 270, y: 290 },
    ct: { x: 868, y: 230 },
    dc: { x: 815, y: 257 },
    de: { x: 825, y: 250 },
    fl: { x: 728, y: 490 },
    ga: { x: 710, y: 420 },
    hi: { x: 230, y: 555 },
    ia: { x: 520, y: 245 },
    id: { x: 195, y: 175 },
    il: { x: 580, y: 270 },
    in: { x: 625, y: 270 },
    ks: { x: 425, y: 305 },
    ky: { x: 655, y: 320 },
    la: { x: 555, y: 445 },
    ma: { x: 870, y: 200 },
    md: { x: 805, y: 245 },
    me: { x: 875, y: 130 },
    mi: { x: 625, y: 195 },
    mn: { x: 500, y: 165 },
    mo: { x: 555, y: 310 },
    ms: { x: 600, y: 415 },
    mt: { x: 270, y: 130 },
    nc: { x: 750, y: 335 },
    nd: { x: 400, y: 135 },
    ne: { x: 405, y: 240 },
    nh: { x: 855, y: 175 },
    nj: { x: 825, y: 225 },
    nm: { x: 275, y: 380 },
    nv: { x: 130, y: 270 },
    ny: { x: 805, y: 195 },
    oh: { x: 680, y: 255 },
    ok: { x: 460, y: 365 },
    or: { x: 100, y: 165 },
    pa: { x: 775, y: 230 },
    ri: { x: 880, y: 215 },
    sc: { x: 735, y: 385 },
    sd: { x: 410, y: 190 },
    tn: { x: 640, y: 355 },
    tx: { x: 445, y: 445 },
    ut: { x: 200, y: 280 },
    va: { x: 770, y: 295 },
    vt: { x: 838, y: 175 },
    wa: { x: 135, y: 105 },
    wi: { x: 555, y: 195 },
    wv: { x: 730, y: 280 },
    wy: { x: 285, y: 215 },
};

export default UsMap;
