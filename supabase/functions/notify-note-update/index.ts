import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotifyRequest {
  noteId: string;
  originalContent: string;
  currentContent: string;
  originalTitle: string;
  currentTitle: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: corsHeaders }
      )
    }

    // Verify the user token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      console.error('Auth error:', authError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: corsHeaders }
      )
    }

    const { noteId, originalContent, currentContent, originalTitle, currentTitle }: NotifyRequest = await req.json()

    console.log('Processing notification request for note:', noteId)

    // Check if there are significant changes
    const contentChanged = originalContent !== currentContent
    const titleChanged = originalTitle !== currentTitle
    
    if (!contentChanged && !titleChanged) {
      console.log('No significant changes detected, skipping notifications')
      return new Response(
        JSON.stringify({ message: 'No significant changes' }),
        { status: 200, headers: corsHeaders }
      )
    }

    // Get the note details and verify ownership/access
    const { data: note, error: noteError } = await supabaseClient
      .from('notes')
      .select('title, user_id')
      .eq('id', noteId)
      .single()

    if (noteError || !note) {
      console.error('Note not found:', noteError)
      return new Response(
        JSON.stringify({ error: 'Note not found' }),
        { status: 404, headers: corsHeaders }
      )
    }

    // Verify user has access to this note (either owner or has share access)
    const isOwner = note.user_id === user.id
    let hasAccess = isOwner

    if (!isOwner) {
      const { data: shareAccess } = await supabaseClient
        .from('shared_notes')
        .select('permission')
        .eq('note_id', noteId)
        .eq('shared_with_user_id', user.id)
        .single()

      hasAccess = !!shareAccess
    }

    if (!hasAccess) {
      return new Response(
        JSON.stringify({ error: 'Access denied' }),
        { status: 403, headers: corsHeaders }
      )
    }

    // Get the user's email for the from_user_email field
    const { data: userDetails } = await supabaseClient.auth.admin.getUserById(user.id)
    const userEmail = userDetails.user?.email

    // Get all users who have access to this note (excluding the current user)
    const { data: shares, error: sharesError } = await supabaseClient
      .from('shared_notes')
      .select('shared_with_user_id, shared_with_email')
      .eq('note_id', noteId)
      .neq('shared_with_user_id', user.id) // Exclude the current user

    if (sharesError) {
      console.error('Error fetching shares:', sharesError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch shares' }),
        { status: 500, headers: corsHeaders }
      )
    }

    console.log(`Found ${shares?.length || 0} users to notify`)

    // Send notifications to each shared user
    const notifications = []
    for (const share of shares || []) {
      if (!share.shared_with_user_id) continue // Skip if user hasn't signed up yet

      // Check user's notification preferences
      const { data: prefs } = await supabaseClient
        .from('user_preferences')
        .select('notification_note_updated')
        .eq('user_id', share.shared_with_user_id)
        .single()

      // Only send if user wants update notifications (default to true if not set)
      if (prefs?.notification_note_updated === false) {
        console.log(`User ${share.shared_with_user_id} has disabled update notifications`)
        continue
      }

      // Create notification
      const { error: notifError } = await supabaseClient
        .from('notifications')
        .insert({
          user_id: share.shared_with_user_id,
          type: 'note_updated',
          title: 'Shared note updated',
          message: `"${note.title}" has been updated`,
          note_id: noteId,
          from_user_email: userEmail
        })

      if (notifError) {
        console.error(`Failed to create notification for user ${share.shared_with_user_id}:`, notifError)
      } else {
        notifications.push(share.shared_with_user_id)
        console.log(`Notification sent to user ${share.shared_with_user_id}`)
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Notifications sent', 
        notified_users: notifications.length,
        changes: { contentChanged, titleChanged }
      }),
      { status: 200, headers: corsHeaders }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    )
  }
})