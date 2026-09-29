import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { EmailAPIError } from 'npm:@lovable.dev/email-js@0.1.0'
import { sendTemplateEmail } from '../_shared/transactional-email-templates/send-email.ts'

// Sends the fixed set of note-sharing emails. Only signed-in users can call it,
// and only these four templates are allowed.
const ALLOWED = new Set(['note-shared', 'note-shared-invite', 'note-access-revoked', 'shared-note-deleted'])

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, serviceKey)

  const token = (req.headers.get('Authorization') || '').replace('Bearer ', '')
  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) return json({ error: 'Unauthorized' }, 401)

  let body: any
  try { body = await req.json() } catch { return json({ error: 'Invalid JSON' }, 400) }
  const templateName = String(body?.templateName || '')
  const recipientEmail = String(body?.recipientEmail || '').trim()
  const idempotencyKey = String(body?.idempotencyKey || crypto.randomUUID()).slice(0, 200)
  const rawData = body?.templateData && typeof body.templateData === 'object' ? body.templateData : {}
  if (!ALLOWED.has(templateName)) return json({ error: 'Unknown template' }, 400)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail) || recipientEmail.length > 255) {
    return json({ error: 'Invalid recipient' }, 400)
  }
  const templateData: Record<string, string> = {}
  for (const [k, v] of Object.entries(rawData)) {
    if (typeof v === 'string') templateData[k] = v.slice(0, 500)
  }

  const log = async (status: string, error_message?: string) => {
    const { error } = await supabase.from('email_send_log').insert({
      message_id: null, template_name: templateName, recipient_email: recipientEmail, status,
      ...(error_message ? { error_message } : {}),
    })
    if (error) console.error('email_send_log insert failed', { code: error.code, message: error.message })
  }

  try {
    const result = await sendTemplateEmail(templateName, recipientEmail, { templateData, idempotencyKey })
    if (result.sent) { await log('sent'); return json({ success: true }) }
    await log('suppressed')
    return json({ success: false, reason: 'email_suppressed' })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    await log('failed', msg)
    const status = e instanceof EmailAPIError && e.status === 429 ? 429 : 500
    return json({ error: 'Failed to send email' }, status)
  }
})
