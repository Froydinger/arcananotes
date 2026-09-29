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

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({ siteUrl, confirmationUrl }: InviteEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You've been invited to {BRAND_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoWrap}>
          <Img src={LOGO_URL} alt={BRAND_NAME} style={logoImg} />
        </Section>
        <Section style={card}>
          <Heading style={h1}>You're invited to {BRAND_NAME}</Heading>
          <Text style={text}>
            Someone wants you on{' '}
            <Link href={siteUrl} style={link}>
              {BRAND_NAME}
            </Link>
            . Accept below and your account is ready in seconds.
          </Text>
          <Button style={button} href={confirmationUrl}>
            Accept invite
          </Button>
          <Text style={muted}>
            Not expecting this? You can safely ignore it.
          </Text>
        </Section>
        <Text style={footer}>{BRAND_NAME} · arcananotes.com</Text>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail
