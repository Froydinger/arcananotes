# New Note button move: top-right + with fan-out menu, remove bottom-nav +

## What changes

The + button for creating notes moves from the mobile bottom nav to the top right of the All Notes screen, replacing the account icon and its modal. The Note/Checklist menu is redesigned as two icon bubbles that spring out of the + button, with the page blurred behind while open.

### 1. Top right of All Notes (mobile + desktop) — `src/pages/Index.tsx`
- Remove the account button (arc logo with crown badge) from the header on both mobile and desktop.
- Nuke the "Your Account" modal entirely (plan callout, email, Settings button). Account/settings access already exists via the Settings nav item.
- Put a + button in the account button's place, styled like the neighboring Sync button (same size, glass circle).
- Tapping + opens the new create menu (below), tapping again closes it. The + rotates 45 degrees into an X while open.

### 2. Create menu — two fan-out bubbles (new shared behavior)
- Replaces the current plain dropdown menu (used by the bottom-nav + and the desktop rail +).
- While open: the whole page behind gets a blurred dim overlay; tapping the overlay closes the menu.
- Two circular bubbles spring out from the + button in a small arc: a note icon (FileText) and a checklist icon (CheckSquare). Icons only, no labels.
- Animation is snappy, rubbery, jello-like: spring motion (high stiffness, low damping, visible overshoot/wobble), bubbles stagger slightly; the + wobbles as they pop out. Reverse on close. Honors reduced-motion settings.
- Tapping a bubble creates that note type (existing `handleCreateNote`) and closes the menu.
- Implemented with Motion for React spring transitions (already the house animation library); keyframes in `src/index.css` only if a pure-CSS fallback is needed.

### 3. Mobile bottom nav — `src/components/layout/BottomNav.tsx`
- Remove the + button and its dropdown from the mobile bottom nav. Remaining items (Notes, Ideas, Settings) stay and re-space to fill the row evenly.
- Keyboard-hide and note-page-hide behavior unchanged.

### 4. Desktop left rail — `src/components/layout/BottomNav.tsx`
- The rail + swaps its plain dropdown for the same fan-out bubble menu, anchored to fan out to the right of the rail, so creation feels identical everywhere.
- Same blur overlay and jello animation.

## Files touched
- `src/pages/Index.tsx` — header swap, remove account modal, add create menu state
- `src/components/layout/BottomNav.tsx` — remove mobile +, replace rail + menu
- New `src/components/notes/CreateNoteMenu.tsx` — the fan-out bubble menu (shared by header and rail)
- `src/index.css` — any supporting keyframes/overlay styles

## Not changing
- Search, Sync, pull-to-refresh, note cards, and all other screens.
- The Settings page and nav access.
