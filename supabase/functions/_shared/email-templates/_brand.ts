// Shared brand tokens for Arc Notes auth emails.
// Body background MUST stay white (#ffffff) even though the app is dark-themed.

export const LOGO_URL =
  'https://arcananotes.com/__l5e/assets-v1/f14449f0-c17c-4620-8bf8-a09c7cf0e8a2/arc-notes-logo-on-black.png'

export const BRAND_NAME = 'Arc Notes'
export const PRIMARY = '#0EA5E9' // hsl(199 89% 48%)
export const PRIMARY_FG = '#ffffff'
export const FG = '#18181b'
export const MUTED = '#71717a'
export const FOOTER = '#a1a1aa'
export const BORDER = '#eceae3'
export const CARD_BG = '#faf8f3' // warm cream surface
export const RADIUS = '12px'

export const FONT_STACK =
  "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif"
export const HEADING_STACK =
  "'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif"

export const main = {
  backgroundColor: '#ffffff',
  fontFamily: FONT_STACK,
  margin: 0,
  padding: 0,
}

export const container = {
  maxWidth: '560px',
  margin: '0 auto',
  padding: '32px 28px 40px',
}

export const logoWrap = {
  textAlign: 'center' as const,
  margin: '0 0 28px',
}

export const logoImg = {
  width: '56px',
  height: '56px',
  margin: '0 auto',
  display: 'block',
}

export const card = {
  backgroundColor: CARD_BG,
  border: `1px solid ${BORDER}`,
  borderRadius: RADIUS,
  padding: '32px 28px',
}

export const h1 = {
  fontFamily: HEADING_STACK,
  fontSize: '24px',
  fontWeight: 600 as const,
  color: FG,
  margin: '0 0 16px',
  letterSpacing: '-0.01em',
}

export const text = {
  fontSize: '15px',
  color: FG,
  lineHeight: '1.6',
  margin: '0 0 20px',
}

export const muted = {
  fontSize: '13px',
  color: MUTED,
  lineHeight: '1.6',
  margin: '0 0 20px',
}

export const link = {
  color: PRIMARY,
  textDecoration: 'underline',
}

export const button = {
  display: 'inline-block',
  backgroundColor: PRIMARY,
  color: PRIMARY_FG,
  fontSize: '15px',
  fontWeight: 600 as const,
  borderRadius: RADIUS,
  padding: '13px 24px',
  textDecoration: 'none',
  margin: '8px 0 24px',
}

export const code = {
  fontFamily: "'JetBrains Mono', Menlo, Consolas, monospace",
  fontSize: '28px',
  fontWeight: 600 as const,
  letterSpacing: '0.2em',
  color: FG,
  backgroundColor: '#ffffff',
  border: `1px solid ${BORDER}`,
  borderRadius: RADIUS,
  padding: '16px 20px',
  textAlign: 'center' as const,
  margin: '0 0 24px',
  display: 'block',
}

export const footer = {
  fontSize: '12px',
  color: FOOTER,
  lineHeight: '1.6',
  margin: '28px 0 0',
  textAlign: 'center' as const,
}
