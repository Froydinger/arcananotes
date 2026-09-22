# Roadmap

## Done
- [x] Theme overhaul: dark default, navy removed, Light/Dark/System segmented control with instant switching, saved to device, cleared to dark on sign-out (verified in preview)
- [x] Dark mode menu check — looks good (crisp X + bubbles over blurred notes)
- [x] Repaired src/index.css after bad navy strip: restored intact version from commit 4dd3844, removed navy rules via postcss, build passes
- [x] Mobile create menu: + button and fan-out bubbles stay crisp above the blur overlay (portaled to body; `.glass-shimmer` forced position:relative and was overriding `.fixed` on the portal clone)
- [x] Mobile bottom nav: items left-aligned again, clear of the Arc bubble
- [x] Bubbles enlarged (56px) and spaced further out on mobile and desktop rail
- [x] Verified Arc FAB outer-circle removal (code + build; headless asset load inconclusive)
