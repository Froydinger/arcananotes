import { createClient } from 'npm:@supabase/supabase-js@2';
import { getPaddleClient, type PaddleEnv } from '../_shared/paddle.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error('Not authenticated');

    const { data: sub } = await supabase
      .from('subscriptions')
      .select('paddle_customer_id, paddle_subscription_id, environment')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!sub) throw new Error('No subscription found');

    const env = sub.environment as PaddleEnv;
    const paddle = getPaddleClient(env);
    const portalSession = await paddle.customerPortalSessions.create(
      sub.paddle_customer_id as string,
      [sub.paddle_subscription_id as string]
    );

    return new Response(JSON.stringify({ url: portalSession.urls.general.overview }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('customer-portal error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
