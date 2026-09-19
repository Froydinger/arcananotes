import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { supabase } from "@/integrations/supabase/client";

interface SupportCheckoutProps {
  amountInCents: number;
  customerEmail?: string;
  returnUrl?: string;
}

export function SupportCheckout({ amountInCents, customerEmail, returnUrl }: SupportCheckoutProps) {
  const fetchClientSecret = async (): Promise<string> => {
    const { data, error } = await supabase.functions.invoke("create-donation-checkout", {
      body: {
        amountInCents,
        customerEmail,
        returnUrl: returnUrl ?? `${window.location.origin}/support?status=thanks`,
        environment: getStripeEnvironment(),
      },
    });
    if (error || !data?.clientSecret) {
      throw new Error(error?.message || data?.error || "Could not start checkout");
    }
    return data.clientSecret;
  };

  return (
    <div id="checkout" className="rounded-lg overflow-hidden">
      <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
