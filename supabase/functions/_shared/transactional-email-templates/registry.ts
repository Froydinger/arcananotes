/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: any) => string)
  displayName?: string
  previewData?: Record<string, unknown>
  to?: string | ((data: any) => string)
}

// Register transactional email templates here as you add them.
// Example:
//   import { template as welcomeTemplate } from './welcome.tsx'
//   export const TEMPLATES: Record<string, TemplateEntry> = {
//     welcome: welcomeTemplate,
//   }
export const TEMPLATES: Record<string, TemplateEntry> = {}
