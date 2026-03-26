import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

// Qualifying plans: price IDs and product IDs that grant Pro access
const QUALIFYING_PRICE_IDS = new Set([
  "price_1TBoC0AB32948AKDSNYNhxHG", // Arcana Notes Pro
  "price_1TB5D3AB32948AKDJTYd74X4", // Win The Night "Pro Supporter"
]);

const QUALIFYING_PRODUCT_IDS = new Set([
  "prod_UAtIOiu4df3Rso", // ArcAi Pro (current)
  "prod_U4U5QGmibWU8wD", // ArcAi Pro (legacy)
]);

type SubscriptionSource = "arcana" | "wtn" | "arcai" | "arcai_legacy" | null;

function identifySource(priceId: string, productId: string): SubscriptionSource {
  if (priceId === "price_1TBoC0AB32948AKDSNYNhxHG") return "arcana";
  if (priceId === "price_1TB5D3AB32948AKDJTYd74X4") return "wtn";
  if (productId === "prod_UAtIOiu4df3Rso") return "arcai";
  if (productId === "prod_U4U5QGmibWU8wD") return "arcai_legacy";
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("Not authenticated");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const customers = await stripe.customers.list({ email: user.email, limit: 5 });

    if (customers.data.length === 0) {
      logStep("No Stripe customer found");
      await supabaseClient.from("subscriptions").upsert({
        user_id: user.id,
        status: "free",
        stripe_customer_id: null,
        stripe_subscription_id: null,
        current_period_end: null,
      }, { onConflict: "user_id" });

      return new Response(JSON.stringify({ subscribed: false, source: null, product_id: null, subscription_end: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check ALL customers for this email (could have accounts across different Stripe integrations)
    let matchedSub: any = null;
    let matchedSource: SubscriptionSource = null;
    let matchedCustomerId: string | null = null;
    let matchedProductId: string | null = null;

    for (const customer of customers.data) {
      logStep("Checking customer", { customerId: customer.id });

      const subscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        status: "active",
        limit: 50,
      });

      for (const sub of subscriptions.data) {
        for (const item of sub.items.data) {
          const priceId = item.price.id;
          const productId = typeof item.price.product === "string" ? item.price.product : item.price.product?.id ?? "";

          if (QUALIFYING_PRICE_IDS.has(priceId) || QUALIFYING_PRODUCT_IDS.has(productId)) {
            const source = identifySource(priceId, productId);
            logStep("Qualifying subscription found", { source, priceId, productId, subId: sub.id });
            matchedSub = sub;
            matchedSource = source;
            matchedCustomerId = customer.id;
            matchedProductId = productId;
            break;
          }
        }
        if (matchedSub) break;
      }
      if (matchedSub) break;
    }

    const isActive = !!matchedSub;
    const periodEnd = matchedSub?.current_period_end
      ? new Date(matchedSub.current_period_end * 1000).toISOString()
      : null;

    await supabaseClient.from("subscriptions").upsert({
      user_id: user.id,
      stripe_customer_id: matchedCustomerId ?? customers.data[0].id,
      stripe_subscription_id: matchedSub?.id ?? null,
      status: isActive ? "active" : "free",
      current_period_end: periodEnd,
    }, { onConflict: "user_id" });

    logStep("Subscription status", { isActive, source: matchedSource });

    return new Response(JSON.stringify({
      subscribed: isActive,
      source: matchedSource,
      product_id: matchedProductId,
      subscription_end: periodEnd,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("check-subscription error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
