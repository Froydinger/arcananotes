

## Plan: Replace support email across all references

All instances of `help@noteily.app` will be replaced with `contact@winthenight.org` in these files:

1. **src/pages/PrivacyPage.tsx** -- mailto link and display text
2. **src/pages/LanderPage.tsx** -- footer mailto link and display text
3. **src/pages/SettingsPage.tsx** -- contact/support link
4. **src/components/layout/MarketingSplashScreen.tsx** -- SEO structured data, meta contact info, and visible contact link
5. **README.md** -- support section
6. **mem://index.md** -- update stored support email preference

5 files + memory update. Straightforward find-and-replace of the email address everywhere it appears.

