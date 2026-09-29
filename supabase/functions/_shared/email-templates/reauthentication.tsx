/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
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
  card,
  code,
  container,
  footer,
  h1,
  logoImg,
  logoWrap,
  main,
  muted,
  text,
} from './_brand.ts'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your {BRAND_NAME} verification code</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoWrap}>
          <Img src={LOGO_URL} alt={BRAND_NAME} style={logoImg} />
        </Section>
        <Section style={card}>
          <Heading style={h1}>Confirm it's you</Heading>
          <Text style={text}>
            Use this code to confirm your identity in {BRAND_NAME}:
          </Text>
          <Text style={code}>{token}</Text>
          <Text style={muted}>
            The code expires soon. Didn't request it? You can ignore this
            email.
          </Text>
        </Section>
        <Text style={footer}>{BRAND_NAME} · arcananotes.com</Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail
