import React, { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from 'react';

const AudioContext = createContext(null);

const STORAGE_KEY_MUTED = 'audioMuted';
const STORAGE_KEY_VOLUME = 'audioVolume';

/* Procedurally generated tones via Web Audio API so no media files are required.
   Each "sound" is a short tone-shape with envelope. Keeps bundle tiny.

   `chestTap` + `chestSparkle` are designed to be played together each tap —
   sawtooth body for the wooden knock + rising triangle sparkle for magic.
   Pass opts.pitchShift to scale both base and end frequency, so callers
   can ramp pitch up across a tap sequence and sell anticipation. */
const SOUND_DEFS = {
    click:     { type: 'sine',     freq: 520, dur: 0.06, gain: 0.10, slide: -60 },
    hover:     { type: 'sine',     freq: 700, dur: 0.04, gain: 0.04, slide: 0 },
    correct:   { type: 'triangle', freq: 660, dur: 0.18, gain: 0.18, slide: 220 }, // rising chime
    incorrect: { type: 'square',   freq: 220, dur: 0.18, gain: 0.13, slide: -90 },  // low thud
    transition:{ type: 'sine',     freq: 320, dur: 0.18, gain: 0.10, slide: 180 },  // whoosh up
    tick:      { type: 'square',   freq: 880, dur: 0.04, gain: 0.07, slide: 0 },
    streak:    { type: 'triangle', freq: 520, dur: 0.30, gain: 0.18, slide: 600 },  // sparkle
    levelUp:   { type: 'triangle', freq: 440, dur: 0.40, gain: 0.20, slide: 540 },
    gameOver:  { type: 'sawtooth', freq: 320, dur: 0.45, gain: 0.16, slide: -180 },
    chestTap:    { type: 'sawtooth', freq: 220,  dur: 0.11, gain: 0.13, slide: 200 },   // wooden tap, rises
    chestSparkle:{ type: 'triangle', freq: 1480, dur: 0.20, gain: 0.04, slide: 420 },   // high magical layer
};

function getAudioCtx() {
    if (typeof window === 'undefined') return null;
    if (!window.__flagQuizAudioCtx) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return null;
        window.__flagQuizAudioCtx = new Ctx();
    }
    return window.__flagQuizAudioCtx;
}

export function AudioProvider({ children }) {
    const [isMuted, setMuted] = useState(() => {
        const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_MUTED) : null;
        if (saved === null) return true; // default muted until user opts in
        return saved === 'true';
    });
    const [volume, setVolume] = useState(() => {
        const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_VOLUME) : null;
        const parsed = saved !== null ? parseFloat(saved) : 0.6;
        return Number.isFinite(parsed) ? Math.min(1, Math.max(0, parsed)) : 0.6;
    });
    const [isUnlocked, setUnlocked] = useState(false);
    const lastPlayedRef = useRef({}); // throttle: name -> timestamp

    useEffect(() => {
        try { localStorage.setItem(STORAGE_KEY_MUTED, String(isMuted)); } catch {}
    }, [isMuted]);
    useEffect(() => {
        try { localStorage.setItem(STORAGE_KEY_VOLUME, String(volume)); } catch {}
    }, [volume]);

    // Unlock on first user interaction (browser autoplay policy)
    useEffect(() => {
        const handler = () => {
            const ctx = getAudioCtx();
            if (ctx && ctx.state === 'suspended') {
                ctx.resume().catch(() => {});
            }
            setUnlocked(true);
            window.removeEventListener('pointerdown', handler);
            window.removeEventListener('keydown', handler);
            window.removeEventListener('touchstart', handler);
        };
        window.addEventListener('pointerdown', handler);
        window.addEventListener('keydown', handler);
        window.addEventListener('touchstart', handler);
        return () => {
            window.removeEventListener('pointerdown', handler);
            window.removeEventListener('keydown', handler);
            window.removeEventListener('touchstart', handler);
        };
    }, []);

    const play = useCallback((name, opts = {}) => {
        if (isMuted) return;
        const def = SOUND_DEFS[name];
        if (!def) return;
        const ctx = getAudioCtx();
        if (!ctx) return;

        // Mobile browsers (esp. iOS Safari) re-suspend the AudioContext when the
        // page is backgrounded or after periods of inactivity, which silences all
        // playback even though sound is enabled. Re-resume on every play so audio
        // keeps working for the rest of the session.
        if (ctx.state === 'suspended') ctx.resume().catch(() => {});

        // Throttle identical sounds firing too close together
        const now = ctx.currentTime;
        const last = lastPlayedRef.current[name] || 0;
        if (now - last < 0.04) return;
        lastPlayedRef.current[name] = now;

        const gain = ctx.createGain();
        const osc = ctx.createOscillator();
        osc.type = def.type;
        const shift = opts.pitchShift ?? 1;
        const baseFreq = def.freq * shift;
        const endFreq  = Math.max(80, baseFreq + (def.slide || 0) * shift);
        osc.frequency.setValueAtTime(baseFreq, now);
        if (def.slide) {
            osc.frequency.exponentialRampToValueAtTime(endFreq, now + def.dur);
        }
        const volMul = (opts.volume ?? 1) * volume;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(def.gain * volMul, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + def.dur);

        osc.connect(gain).connect(ctx.destination);
        osc.start(now);
        osc.stop(now + def.dur + 0.05);
    }, [isMuted, volume]);

    const playSequence = useCallback((names, gap = 0.08) => {
        if (isMuted) return;
        names.forEach((n, i) => {
            setTimeout(() => play(n), i * gap * 1000);
        });
    }, [isMuted, play]);

    const value = useMemo(() => ({
        play,
        playSequence,
        isMuted,
        setMuted,
        volume,
        setVolume,
        isUnlocked,
    }), [play, playSequence, isMuted, volume, isUnlocked]);

    return (
        <AudioContext.Provider value={value}>{children}</AudioContext.Provider>
    );
}

export function useAudio() {
    const ctx = useContext(AudioContext);
    if (!ctx) {
        // Safe fallback if a consumer is rendered outside provider
        return {
            play: () => {},
            playSequence: () => {},
            isMuted: true,
            setMuted: () => {},
            volume: 0,
            setVolume: () => {},
            isUnlocked: false,
        };
    }
    return ctx;
}
