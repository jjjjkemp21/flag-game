// Client mirror of server/spectatorPhrases.js. The client renders the text;
// the server is authoritative on the id -> phrase mapping (a stale client
// sending an out-of-range id is rejected). Append-only — never reorder.

export const SPECTATOR_PHRASES = [
    'Good luck!',     // 0
    'Nice!',          // 1
    'Tough one!',     // 2
    'You got this!',  // 3
    'GG',             // 4
    'So close!',      // 5
    'Ouch.',          // 6
    'Easy.',          // 7
    'Wow!',           // 8
    'Streak!',        // 9
    'Watch out!',     // 10
    'Big brain.',     // 11
    'Speed!',         // 12
    'Calm down.',     // 13
    'Hi!',            // 14
    'Bye!',           // 15
    'No way.',        // 16
    'Try again!',     // 17
];
