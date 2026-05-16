/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Img, Link, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import {
  BRAND_NAME, LOGO_URL, button, card, container, footer, h1,
  logoImg, logoWrap, main, muted, text,
} from '../email-templates/_brand.ts'
import type { TemplateEntry } from './registry.ts'

interface NoteSharedInviteProps {
  ownerName?: string
  noteTitle?: string
  permission?: 'read' | 'write'
  signupUrl?: string
  recipient?: string
}

const NoteSharedInviteEmail = ({
  ownerName = 'Someone',
  noteTitle = 'a note',
  permission = 'read',
  signupUrl = 'https://arcananotes.com',
  recipient = '',
}: NoteSharedInviteProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{ownerName} shared "{noteTitle}" with you on {BRAND_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoWrap}>
          <Img src={LOGO_URL} alt={BRAND_NAME} style={logoImg} />
        </Section>
        <Section style={card}>
          <Heading style={h1}>You've been invited to a note</Heading>
          <Text style={text}>
            <strong>{ownerName}</strong> shared <strong>"{noteTitle}"</strong> with you on {BRAND_NAME}
            with <strong>{permission === 'write' ? 'edit' : 'view'}</strong> access.
          </Text>
          <Text style={text}>
            You don't have an {BRAND_NAME} account yet. Create one with{' '}
            <strong>{recipient || 'this email address'}</strong> and the note will be waiting for you.
          </Text>
          <Button style={button} href={signupUrl}>Create your account</Button>
          <Text style={muted}>
            {BRAND_NAME} is a private home for your notes, ideas, and writing. Free to start, no credit card needed.
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
  component: NoteSharedInviteEmail,
  subject: (d: NoteSharedInviteProps) =>
    `${d.ownerName || 'Someone'} invited you to "${d.noteTitle || 'a note'}" on ${BRAND_NAME}`,
  displayName: 'Note shared invite (new user)',
  previewData: {
    ownerName: 'Alex',
    noteTitle: 'Trip planning',
    permission: 'write',
    signupUrl: 'https://arcananotes.com',
    recipient: 'friend@example.com',
  },
} satisfies TemplateEntry

export default NoteSharedInviteEmail
