/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({
  siteName,
  confirmationUrl,
}: MagicLinkEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your Arcana Notes login link</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerStripe} />
        <Section style={content}>
          <Img src={LOGO_URL} alt="Arcana Notes" width="44" height="44" style={logo} />
          <Heading style={h1}>Your login link</Heading>
          <Text style={text}>
            Hey! Tap the button below to sign in to Arcana Notes. This link will expire shortly.
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={confirmationUrl}>
              Sign In
            </Button>
          </Section>
          <Hr style={divider} />
          <Text style={footer}>
            If you didn't request this link, you can safely ignore this email.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

const LOGO_URL = 'https://cleqowfvjqnuybfdwrqc.supabase.co/storage/v1/object/public/email-assets/arcana-logo-2026.png'

const main = { backgroundColor: '#f0ece6', fontFamily: "'DM Sans', Arial, sans-serif", padding: '40px 0' }
const container = { maxWidth: '480px', margin: '0 auto', borderRadius: '16px', overflow: 'hidden' as const, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }
const headerStripe = { backgroundColor: '#142544', height: '6px' }
const content = { backgroundColor: '#ffffff', padding: '40px 32px 32px' }
const logo = { marginBottom: '20px' }
const h1 = {
  fontSize: '24px',
  fontWeight: '600' as const,
  color: '#142544',
  margin: '0 0 16px',
  fontFamily: "'Space Grotesk', 'DM Sans', Arial, sans-serif",
  letterSpacing: '-0.02em',
}
const text = { fontSize: '15px', color: '#55575d', lineHeight: '1.65', margin: '0 0 20px' }
const buttonContainer = { textAlign: 'center' as const, margin: '8px 0 24px' }
const button = {
  backgroundColor: '#0ea5e9',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '600' as const,
  borderRadius: '12px',
  padding: '14px 28px',
  textDecoration: 'none',
}
const divider = { borderColor: '#e8e4de', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '0' }
