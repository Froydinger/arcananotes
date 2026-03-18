

## Problem

The `check-subscription` edge function queries Stripe for **any** active subscription belonging to the customer. Your Stripe account ("Win The Night") has multiple products, so users who subscribe to other products (not Arcana) are incorrectly shown as Pro.

From the logs: customer `cus_U4UUKuoDC11s3Z` (jkrd09@gmail.com) has an active subscription `sub_1T6LVnAB32948AKDhotVB2sb`, but it's likely for a different product, not the Arcana `price_1TBoC0AB32948AKDSNYNhxHG` price.

## Fix

Update `supabase/functions/check-subscription/index.ts` to filter active subscriptions by the Arcana-specific price ID.

### Change in `check-subscription/index.ts`

After fetching active subscriptions (line 63-67), add a filter to only count subscriptions that contain the Arcana price:

```typescript
const subscriptions = await stripe.subscriptions.list({
  customer: customer.id,
  status: "active",
  limit: 10,
});

// Only count subscriptions for the Arcana price
const ARCANA_PRICE_ID = "price_1TBoC0AB32948AKDSNYNhxHG";
const arcanaSubscription = subscriptions.data.find(sub =>
  sub.items.data.some(item => item.price.id === ARCANA_PRICE_ID)
);

const isActive = !!arcanaSubscription;
const sub = arcanaSubscription ?? null;
```

This ensures only the Arcana-specific subscription is matched, not subscriptions from your other Stripe products.

No other files need changes -- the rest of the flow (settings UI, `useSubscription` hook, `increment_ai_usage` function) all depend on the response from this single edge function.

