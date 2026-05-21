# Flag Quest — Patch Notes

A complete UI overhaul, head to toe.

## What's new

### A brand-new look
- Fresh, playful palette: warm cream + indigo + sunny yellow + mint, with a deep-midnight dark mode.
- Custom display font (Fredoka) for headings, friendly body font (Nunito) everywhere else.
- Soft layered shadows, larger pill-shaped corners, and gentle gradients across every card and button.
- A subtle animated radial wash sits behind every page so the app no longer feels flat.

### A friendly mascot
- Meet your new globe-faced sidekick. They wave on the menu, cheer when you get a flag right, and look a little sad when you don't.
- Mood-rigged (idle / wave / cheer / sad / think) and shows up at the right moments throughout the app.

### Real motion, everywhere
- Page-to-page transitions now spring in and out, no more jump-cuts.
- Flag cards "pop" in with a satisfying bounce on every new question.
- Multiple-choice answers stagger in like dominoes; tapping one gives it a real tactile press.
- Correct answers burst with confetti; wrong answers shake and glow red.
- Score numbers spring when they change, and floating "+10 / -5" chips fly out next to your score.
- Modal dialogs (like Reset Progress) now animate in with a soft scale and blur the background.

### Sound effects (toggleable)
- Subtle UI clicks, soft chimes for correct answers, low thunks for wrong ones, sparkly streak rewards.
- Off by default. Flip "Sound effects" on in Settings and use the new "Try a sound" preview button.
- Volume slider so you can keep things low while studying.

### Richer Stats
- A big circular **Mastery ring** showing your overall progress, with the percentage animating up when the screen loads.
- New **Mastery Tiers** — Bronze (10 mastered), Silver (50), Gold (150), Platinum (every flag) — each as a medal that lights up when you earn it.
- All counters now count up with motion when you visit the page.

### Reimagined screens

**Main Menu**
- New animated logo, gradient title, mascot waving hello, and a soft world-dot pattern behind everything.
- Four big illustrated mode cards (Multiple Choice, Free Response, Bonus Modes, Settings) instead of a stack of plain buttons.

**Bonus Modes**
- Mascot greeting in the header. Each mode now has its own colored card with a faint illustration and a "High Score" chip that sits cleanly above the title (no more overlap!).
- Mode cards: Pixelated (mint), Frenzy (yellow), Longest Chain (indigo), Language (purple).

**Quiz screens**
- Bigger flag display in a floating card with a subtle dot-pattern surface.
- Streak chip that updates as you go, plus a score bubble that pops on every change.
- Choice cards (instead of plain buttons) with stagger-in animation, letter labels (A/B/C/D), and tactile press effects.
- Correct answer: confetti + chime + mascot pops out from the corner cheering. Wrong answer: card shakes red, mascot looks dejected.

**Free Response**
- Same hero card + bouncy flag reveal. Input wiggles on empty submit. Score bubble + streak chip in the header.

**Pixelated Guess**
- Circular timer ring replaces the plain countdown number — it changes color (blue → yellow → coral) as time runs low, and ticks softly in the last 5 seconds.
- Lives now scale + shrink when lost.
- Confetti when you guess correctly.

**Frenzy Mode**
- Big circular timer in the header, slot timer bars that turn yellow then coral as they run out.
- The whole screen shakes on a combo break. Cooldown overlays slide in over the flag tile.
- Tap a sound on score change with floating +10 / -5 above the score bubble.

**Longest Route Chain**
- Mascot waves on the intro screen. Animated confetti when you guess each leg correctly. Big chain progress pill at the top.

**Language Quiz**
- The phrase now lives in a softly tinted card that flips between questions.
- Choice cards with letter labels. Mascot cheers on a correct guess, looks sad on game over.

### Settings
- Sections — **Appearance**, **Sound**, **Gameplay**, **Data**.
- New **Sound effects** toggle, **Volume** slider, **Try a sound** preview, **Strict spelling** (existing), **Dark mode** (existing).
- The "Reset progress" button now opens a confirmation **modal** (no more browser confirm popup), with a focused Cancel/Reset choice.

### Polish & quality
- Lazy-loaded heavy bonus modes (Frenzy, Pixelated, Longest Route, Language) so the main menu loads faster.
- All screens now scale fluidly across mobile (360px), tablet (768px), and desktop (1280px+) — type, spacing, and grids all adjust.
- **`prefers-reduced-motion` is fully honored** — page transitions fade, motion-heavy effects fall back to opacity, confetti and mascot bobbing pause, audio chimes remain (separate toggle).
- High-contrast focus rings on every interactive element.
- ARIA labels added to icon-only buttons; feedback areas use `aria-live` so screen-reader users hear results.
- Modal traps focus, closes on ESC, locks page scroll.

### Under-the-hood
- New design-token system: a single `tokens.css` defines every color, font, spacing, radius, shadow, and motion easing. Dark mode swaps tokens, not files.
- Stylesheets consolidated from 8 component-specific files into 4 layered system files (`tokens.css`, `base.css`, `components.css`, `animations.css`).
- New shared UI library (`src/components/ui/`): `Button`, `Card`, `Toggle`, `Pill`, `ProgressRing`, `ProgressBar`, `ScoreBubble`, `ChoiceCard`, `Modal`, `Toast`.
- New audio system (`src/audio/AudioProvider.jsx`) generated procedurally via Web Audio — no audio files in the bundle, but rich tones.
- New inline-SVG illustration library (`src/assets/illustrations/`): `Logo`, `Mascot`, `Confetti`, `BackgroundBlobs`, `WorldDots`, `Spinner`, `BadgeRing`.

### Things you might notice
- Sound is muted on first launch. Open Settings → Sound and toggle it on whenever you're ready.
- Your existing progress, streaks, and high scores were preserved across the redesign.
- The Frenzy game still uses keyboard shortcuts 1–4 to swap between flag slots, and Pixelated still uses "1" to skip.

Enjoy! 🌍
