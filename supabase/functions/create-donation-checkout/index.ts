import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";

async function createDonationCheckout(options: {
  amountInCents: number;
  customerEmail?: string;
  returnUrl: string;
  environment: StripeEnv;
}) {
  if (!options.amountInCents || options.amountInCents < 100 || options.amountInCents > 100000) {
    throw new Error("Amount must be between $1 and $1,000");
  }
  const stripe = createStripeClient(options.environment);
  const session = await stripe.checkout.sessions.create({
    line_items: [{
      price_data: {
        currency: "usd",
        product_data: { name: "Support Arc Notes" },
        unit_amount: options.amountInCents,
      },
      quantity: 1,
    }],
    mode: "payment",
    ui_mode: "embedded_page",
    return_url: options.returnUrl,
    payment_intent_data: { description: "Support Arc Notes" },
    ...(options.customerEmail && { customer_email: options.customerEmail }),
  });
  return session.client_secret;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const amountInCents = Number(body?.amountInCents);
    const environment = body?.environment;
    const returnUrl = String(body?.returnUrl ?? '');
    const customerEmail = body?.customerEmail ? String(body.customerEmail) : undefined;

    if (!Number.isInteger(amountInCents)) {
      throw new Error('Invalid amount');
    }
    if (environment !== 'sandbox' && environment !== 'live') {
      throw new Error('Invalid environment');
    }
    if (!returnUrl.startsWith('http')) {
      throw new Error('Invalid return URL');
    }

    const clientSecret = await createDonationCheckout({
      amountInCents,
      customerEmail,
      returnUrl,
      environment,
    });

    return new Response(JSON.stringify({ clientSecret }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (e) {
    console.error('create-donation-checkout error:', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
