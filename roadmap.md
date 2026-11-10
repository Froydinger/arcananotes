# Roadmap

## Done
- [x] Theme overhaul: dark default, navy removed, Light/Dark/System segmented control with instant switching, saved to device, cleared to dark on sign-out (verified in preview)
- [x] Dark mode menu check — looks good (crisp X + bubbles over blurred notes)
- [x] Repaired src/index.css after bad navy strip: restored intact version from commit 4dd3844, removed navy rules via postcss, build passes
- [x] Mobile create menu: + button and fan-out bubbles stay crisp above the blur overlay (portaled to body; `.glass-shimmer` forced position:relative and was overriding `.fixed` on the portal clone)
- [x] Mobile bottom nav: items left-aligned again, clear of the Arc bubble
- [x] Bubbles enlarged (56px) and spaced further out on mobile and desktop rail
- [x] Verified Arc FAB outer-circle removal (code + build; headless asset load inconclusive)
- [x] Arc's icon is the slime mascot everywhere: bubble, inline editor, format bar, AI panel, lander (brand mark + fake editor), header, sidebar, login, settings, splash, empty state, prompts
- [x] App icon / PWA icons / favicon: the slime holding a pencil (crisp at 64px, nothing clipped)
- [x] Pencil version of him while actively thinking or editing (Arc panel thinking bubble + header, inline editor loading, lander rewrite "writing..."), reverts to plain after
- [x] Create-menu bubbles rotated down: one directly below the button, one below-left, clamped so they can never touch the top or side edges (verified mobile 411, user 808, desktop 1280)
- [x] Every AI feature runs on GPT-6 Luna (verified live: spell check + Arc assist both answer)
- [x] Removed square mascot glow and login/AI empty-state backplates; regenerated transparent app icons; verified landing and login appearances and light/dark mascot rendering.


## Open
- (nothing pending)

## Latest completed update
- [x] Investigated reported stall: database healthy, fresh signed-in home responsive, no runtime errors; measured first Arc content at 2.2s and inline edit at 1.6s. User confirmed recovery; original transient stall was not reproduced, no speculative code change made.
- [x] Create menu blur animates out on dismissal and before new-note navigation; page arrivals fade in without moving fixed tools. Verified intermediate blur reduction, live new-note opening, desktop/mobile reduced motion, and successful build.
- [x] Note-writing functions use direct OpenAI GPT Terra 6.1, low reasoning, with no gateway fallback; secure key updated, both functions deployed, authenticated live chat and spell correction passed, provider regression test passed. Image generation remains unchanged.
- [x] Corner pencil enlarged to 80px; chat header, replies, and thinking icons enlarged to 48px with circular backings removed. Desktop/mobile layout checked with local asset substitution; no mobile overflow, build OK.
- [x] Approved pencil-shaped character replaces app/AI/thinking logos, favicon, Mac/iOS installed icons, share artwork, and email branding; verified desktop/mobile rendering, image backgrounds, metadata, and successful build. Updated email functions deployed.
- [x] Pencil mascot used for both shared app/AI logos, covering lander, header, sidebar, login, settings, bubble, and AI interfaces; verified landing render and successful build. In-app transparency and black installed icons preserved.
- [x] Black-backed Mac/iOS installed icons and updated mascot share card; verified opaque black pixels, served icons, social metadata, image layout, and successful preview build.




