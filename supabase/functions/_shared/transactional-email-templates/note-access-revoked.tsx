/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Img, Link, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import {
  BRAND_NAME, LOGO_URL, card, container, footer, h1, link,
  logoImg, logoWrap, main, muted, text,
} from '../email-templates/_brand.ts'
import type { TemplateEntry } from './registry.ts'

interface NoteAccessRevokedProps {
  ownerName?: string
  noteTitle?: string
}

const NoteAccessRevokedEmail = ({
  ownerName = 'The owner',
  noteTitle = 'a note',
}: NoteAccessRevokedProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your access to "{noteTitle}" was removed</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoWrap}>
          <Img src={LOGO_URL} alt={BRAND_NAME} style={logoImg} />
        </Section>
        <Section style={card}>
          <Heading style={h1}>Access removed</Heading>
          <Text style={text}>
            <strong>{ownerName}</strong> removed your access to <strong>"{noteTitle}"</strong>.
            You can no longer view or edit this note in {BRAND_NAME}.
          </Text>
          <Text style={muted}>
            If you think this was a mistake, reach out to {ownerName} directly.
          </Text>
        </Section>
        <Text style={footer}>
          {BRAND_NAME} ·{' '}
          <Link href="https://arcananotes.com" style={{ color: 'inherit' }}>arcananotes.com</Link>
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: NoteAccessRevokedEmail,
  subject: (d: NoteAccessRevokedProps) => `Your access to "${d.noteTitle || 'a note'}" was removed`,
  displayName: 'Note access revoked',
  previewData: { ownerName: 'Alex', noteTitle: 'Trip planning' },
} satisfies TemplateEntry

export default NoteAccessRevokedEmail
