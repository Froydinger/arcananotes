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
  logoImg,
  logoWrap,
  main,
  muted,
  text,
} from './_brand.ts'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({ confirmationUrl }: MagicLinkEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your sign-in link for {BRAND_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoWrap}>
          <Img src={LOGO_URL} alt={BRAND_NAME} style={logoImg} />
        </Section>
        <Section style={card}>
          <Heading style={h1}>Your sign-in link</Heading>
          <Text style={text}>
            Tap the button below to sign in to {BRAND_NAME}. The link expires
            soon, so use it while it's warm.
          </Text>
          <Button style={button} href={confirmationUrl}>
            Sign in to {BRAND_NAME}
          </Button>
          <Text style={muted}>
            Didn't request this? Just ignore it. Your account stays put.
          </Text>
        </Section>
        <Text style={footer}>{BRAND_NAME} · arcananotes.com</Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail
