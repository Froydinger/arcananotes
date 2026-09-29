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

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({ confirmationUrl }: RecoveryEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Reset your {BRAND_NAME} password</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoWrap}>
          <Img src={LOGO_URL} alt={BRAND_NAME} style={logoImg} />
        </Section>
        <Section style={card}>
          <Heading style={h1}>Reset your password</Heading>
          <Text style={text}>
            We got a request to reset your {BRAND_NAME} password. Pick a new
            one using the button below.
          </Text>
          <Button style={button} href={confirmationUrl}>
            Choose a new password
          </Button>
          <Text style={muted}>
            Didn't ask for this? Ignore the email and your current password
            stays the same.
          </Text>
        </Section>
        <Text style={footer}>{BRAND_NAME} · arcananotes.com</Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail
