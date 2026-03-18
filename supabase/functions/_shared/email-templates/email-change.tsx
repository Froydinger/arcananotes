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
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface EmailChangeEmailProps {
  siteName: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteName,
  email,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your email change for Arcana Notes</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerStripe} />
        <Section style={content}>
          <Img src={LOGO_URL} alt="Arcana Notes" width="44" height="44" style={logo} />
          <Heading style={h1}>Confirm your email change</Heading>
          <Text style={text}>
            You requested to change your Arcana Notes email from{' '}
            <Link href={`mailto:${email}`} style={link}>{email}</Link>{' '}
            to{' '}
            <Link href={`mailto:${newEmail}`} style={link}>{newEmail}</Link>.
          </Text>
          <Text style={text}>Tap below to confirm:</Text>
          <Section style={buttonContainer}>
            <Button style={button} href={confirmationUrl}>
              Confirm Email Change
            </Button>
          </Section>
          <Hr style={divider} />
          <Text style={footer}>
            If you didn't request this change, please secure your account immediately.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail

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
const link = { color: '#0ea5e9', textDecoration: 'underline' }
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
