// Curated spectator messages. Reaction requests pass a numeric `messageId`
// that indexes into this array; free-text input is never accepted — that's
// how we prevent the chat being used for cheating (no answer hints, no
// arbitrary content). Phase 1 ships the 6 starter phrases.
//
// Adding new phrases is append-only: never reorder or remove, since older
// clients still send messageIds that index into this list. New phrases go
// at the end so historical ids remain stable.

const SPECTATOR_PHRASES = [
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

module.exports = SPECTATOR_PHRASES;
