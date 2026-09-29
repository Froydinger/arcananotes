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

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your email to start using {BRAND_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoWrap}>
          <Img src={LOGO_URL} alt={BRAND_NAME} style={logoImg} />
        </Section>
        <Section style={card}>
          <Heading style={h1}>Welcome to {BRAND_NAME}</Heading>
          <Text style={text}>
            You're almost in. Confirm{' '}
            <Link href={`mailto:${recipient}`} style={link}>
              {recipient}
            </Link>{' '}
            and your notes are ready when you are.
          </Text>
          <Button style={button} href={confirmationUrl}>
            Confirm email
          </Button>
          <Text style={muted}>
            Didn't sign up? Ignore this email and nothing happens.
          </Text>
        </Section>
        <Text style={footer}>
          {BRAND_NAME} ·{' '}
          <Link href={siteUrl} style={{ color: 'inherit' }}>
            arcananotes.com
          </Link>
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail
