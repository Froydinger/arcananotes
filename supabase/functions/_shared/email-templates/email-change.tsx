/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

import {
  BRAND_NAME,
  LOGO_URL,
  button,
  card,
  container,
  footer,
  h1,
  link,
  logoImg,
  logoWrap,
  main,
  muted,
  text,
} from './_brand.ts'

interface EmailChangeEmailProps {
  siteName: string
  oldEmail: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  oldEmail,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your new {BRAND_NAME} email</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoWrap}>
          <Img src={LOGO_URL} alt={BRAND_NAME} style={logoImg} />
        </Section>
        <Section style={card}>
          <Heading style={h1}>Confirm your new email</Heading>
          <Text style={text}>
            You asked to move your {BRAND_NAME} account from{' '}
            <Link href={`mailto:${oldEmail}`} style={link}>
              {oldEmail}
            </Link>{' '}
            to{' '}
            <Link href={`mailto:${newEmail}`} style={link}>
              {newEmail}
            </Link>
            . Confirm to make the switch.
          </Text>
          <Button style={button} href={confirmationUrl}>
            Confirm new email
          </Button>
          <Text style={muted}>
            Didn't request this change? Secure your account right away.
          </Text>
        </Section>
        <Text style={footer}>{BRAND_NAME} · arcananotes.com</Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail
