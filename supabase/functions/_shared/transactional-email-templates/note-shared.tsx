/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Img, Link, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import {
  BRAND_NAME, LOGO_URL, button, card, container, footer, h1, link,
  logoImg, logoWrap, main, muted, text,
} from '../email-templates/_brand.ts'
import type { TemplateEntry } from './registry.ts'

interface NoteSharedProps {
  ownerName?: string
  noteTitle?: string
  permission?: 'read' | 'write'
  noteUrl?: string
}

const NoteSharedEmail = ({
  ownerName = 'Someone',
  noteTitle = 'a note',
  permission = 'read',
  noteUrl = 'https://arcananotes.com',
}: NoteSharedProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{ownerName} shared "{noteTitle}" with you</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoWrap}>
          <Img src={LOGO_URL} alt={BRAND_NAME} style={logoImg} />
        </Section>
        <Section style={card}>
          <Heading style={h1}>A note was shared with you</Heading>
          <Text style={text}>
            <strong>{ownerName}</strong> shared <strong>"{noteTitle}"</strong> with you on {BRAND_NAME}.
            You have <strong>{permission === 'write' ? 'edit' : 'view'}</strong> access.
          </Text>
          <Button style={button} href={noteUrl}>Open the note</Button>
          <Text style={muted}>
            If you don't have an {BRAND_NAME} account yet, sign in with this email and the note will be waiting.
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
  component: NoteSharedEmail,
  subject: (d: NoteSharedProps) => `${d.ownerName || 'Someone'} shared "${d.noteTitle || 'a note'}" with you`,
  displayName: 'Note shared',
  previewData: { ownerName: 'Alex', noteTitle: 'Trip planning', permission: 'write', noteUrl: 'https://arcananotes.com' },
} satisfies TemplateEntry

export default NoteSharedEmail
