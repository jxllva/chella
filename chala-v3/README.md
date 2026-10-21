# chala v3

Third version, blending the other two. The originals are untouched for reference: `../chala-original.html` (chala) and `../faiit/` (Faiit).

**From Faiit:** the shell. Welcome, phone sign-up, money source picker, hello, bottom nav, home, Wraps gallery, Profile, breakdown.

**From chala:** the stories, restyled in Faiit's look (Bricolage Grotesque, Instrument Serif italic, paper and soft sky colours):
- Roast Wrapped, then the pause slide, then Real talk
- The plan survey: goal, habits, how hard, limits. The tone step was dropped because nothing in the Faiit shell uses it.
- The monthly recap story

## How they connect
- `chala-bridge.js` is the glue. chala's screens live in `#chala-layer`, a full-screen overlay above Faiit's app.
- **First unwrap:** roast, then Real talk, then the survey. The survey writes Faiit's plan (`faiit-plan-v1`).
- **Wraps tab / home hero:** September (the persona's finished month) replays the roast. The current month plays the live recap. Any other month falls back to Faiit's own Wrapped.
- **Limits:** Faiit's plan is the one source of truth. Every chala story reads it first, so a limit changed on the dashboard shows up in the recap.
- **Demo bank:** connecting it loads chala's persona statement (Zoe) into Faiit, so both halves show the same money.

## Files
| File | What |
|---|---|
| `chala-engine.js` | categories, analysis, icons, persona, state (from chala.html) |
| `chala-art.js` | the SVG illustrations (from chala.html) |
| `chala-stories.js` | roast, Real talk, survey, recap (from chala.html) |
| `chala-base.css` | chala.html's styles, scoped under `#chala-layer` (generated) |
| `chala-theme.css` | Faiit-look overrides, wordmark, home play button, Cards tab, Profile |
| `chala-cards.js` | Cards tab: card stack, flip for balance, low balance tag |
| `chala-premium.css` | the premium theme, loaded last: Inter, warm off-white, charcoal pills, soft peach / lavender / blush light |
| `chala-tree.js` | Home's money tree: banknote leaves, autumn and fallen leaves track how you're pacing against your limits; tap to shake, swipe or arrows for periods, Month / Week |
| `chala-insights.js` | the Recap page from the tree: earned, spent, saved, by day, pace and category |
| `chala-bridge.js` | the glue described above |

Edits to Faiit's own files are marked with `chala v3` comments: `app.js` (routing, demo bank, sign-out), `faiit-home.js` (play button), `faiit-onboarding.js` (wordmark).
