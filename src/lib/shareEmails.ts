import { supabase } from '@/integrations/supabase/client';

/**
 * Fire-and-forget transactional email sender for shared-note events.
 * Never throws — errors are logged so they don't break the UI flow.
 */
export async function sendShareEmail(
  templateName: 'note-shared' | 'note-access-revoked' | 'shared-note-deleted',
  recipientEmail: string,
  templateData: { ownerName?: string; noteTitle?: string; permission?: string; noteUrl?: string },
  idempotencyKey: string,
) {
  try {
    if (!recipientEmail || !recipientEmail.includes('@')) return;
    await supabase.functions.invoke('send-transactional-email', {
      body: {
        templateName,
        recipientEmail,
        idempotencyKey,
        templateData,
      },
    });
  } catch (e) {
    console.error(`[sendShareEmail:${templateName}]`, e);
  }
}

export function getOwnerDisplayName(user: { email?: string | null; user_metadata?: any } | null): string {
  if (!user) return 'Someone';
  const meta = user.user_metadata || {};
  return meta.full_name || meta.name || meta.username || user.email || 'Someone';
}
