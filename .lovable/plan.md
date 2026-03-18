

## Problem

The published site at arcananotes.lovable.app shows a completely black/blank page. The preview works fine. Two issues:

1. **Stale project reference** — `src/lib/authStorage.ts` has `CURRENT_PROJECT_REF = 'zupjsghppxyvmgwxvycc'` (from the original project before remix), but the actual project ref is `cleqowfvjqnuybfdwrqc`. This could interfere with auth session handling on the published site.

2. **Published site needs republishing** — Since this is a remixed project, the published URL may still be serving the old build. After fixing the code, you'll need to republish.

## Plan

1. **Fix `src/lib/authStorage.ts`** — Update `CURRENT_PROJECT_REF` to `'cleqowfvjqnuybfdwrqc'` and add the old ref (`zupjsghppxyvmgwxvycc`) to `STALE_PROJECT_REFS` so leftover auth keys from the original project get cleaned up.

2. **Republish the site** — After the fix, you'll need to hit the publish button to push the latest build to arcananotes.lovable.app.

This should resolve the black screen by ensuring the auth system initializes correctly with the right project reference, allowing React to render the landing page.

