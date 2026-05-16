/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: any) => string)
  displayName?: string
  previewData?: Record<string, unknown>
  to?: string | ((data: any) => string)
}

import { template as noteShared } from './note-shared.tsx'
import { template as noteSharedInvite } from './note-shared-invite.tsx'
import { template as noteAccessRevoked } from './note-access-revoked.tsx'
import { template as sharedNoteDeleted } from './shared-note-deleted.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'note-shared': noteShared,
  'note-shared-invite': noteSharedInvite,
  'note-access-revoked': noteAccessRevoked,
  'shared-note-deleted': sharedNoteDeleted,
}
