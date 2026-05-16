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

interface SharedNoteDeletedProps {
  ownerName?: string
  noteTitle?: string
}

const SharedNoteDeletedEmail = ({
  ownerName = 'The owner',
  noteTitle = 'a note',
}: SharedNoteDeletedProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>"{noteTitle}" was deleted</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoWrap}>
          <Img src={LOGO_URL} alt={BRAND_NAME} style={logoImg} />
        </Section>
        <Section style={card}>
          <Heading style={h1}>A shared note was deleted</Heading>
          <Text style={text}>
            <strong>{ownerName}</strong> deleted <strong>"{noteTitle}"</strong>.
            It's no longer available in your {BRAND_NAME} library.
          </Text>
          <Text style={muted}>
            Deleted notes can't be recovered from this email. Reach out to {ownerName} if you need the contents back.
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
  component: SharedNoteDeletedEmail,
  subject: (d: SharedNoteDeletedProps) => `"${d.noteTitle || 'A shared note'}" was deleted`,
  displayName: 'Shared note deleted',
  previewData: { ownerName: 'Alex', noteTitle: 'Trip planning' },
} satisfies TemplateEntry

export default SharedNoteDeletedEmail
