import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { SupportCheckout } from "@/components/SupportCheckout";
import { isPaymentsConfigured } from "@/lib/stripe";
import { useAuth } from "@/contexts/AuthContext";

const PRESETS = [3, 5, 10, 25];

export default function SupportPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const thanks = searchParams.get("status") === "thanks";

  const [selected, setSelected] = useState<number | null>(5);
  const [custom, setCustom] = useState("");
  const [checkoutAmount, setCheckoutAmount] = useState<number | null>(null);

  const amount = selected ?? Number(custom);
  const validAmount = Number.isFinite(amount) && amount >= 1 && amount <= 1000;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PaymentTestModeBanner />
      <div className="max-w-xl mx-auto px-4 py-10">
        <Button variant="ghost" size="sm" className="mb-6 -ml-2" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>

        {thanks ? (
          <div className="text-center space-y-4 py-12">
            <Heart className="h-10 w-10 mx-auto text-accent" fill="currentColor" />
            <h1 className="text-2xl font-medium font-serif">Thank you</h1>
            <p className="text-muted-foreground">
              Your support keeps Arc Notes free for everyone. It genuinely means a lot.
            </p>
            <Button onClick={() => navigate("/home")}>Back to my notes</Button>
          </div>
        ) : (
          <>
            <div className="space-y-2 mb-8">
              <h1 className="text-2xl font-medium font-serif flex items-center gap-2">
                <Heart className="h-5 w-5 text-accent" fill="currentColor" />
                Support Arc Notes
              </h1>
              <p className="text-muted-foreground text-sm">
                Arc Notes is free, with everything unlocked and no ads. If it's useful to you and
                you'd like to chip in toward the running costs, you can do that here. Totally
                optional, and nothing changes in the app either way.
              </p>
            </div>

            {!isPaymentsConfigured() ? (
              <p className="text-sm text-muted-foreground">
                Contributions aren't available right now. Please check back soon.
              </p>
            ) : checkoutAmount ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Contributing ${checkoutAmount}</span>
                  <Button variant="ghost" size="sm" onClick={() => setCheckoutAmount(null)}>
                    Change amount
                  </Button>
                </div>
                <SupportCheckout
                  amountInCents={Math.round(checkoutAmount * 100)}
                  customerEmail={user?.email ?? undefined}
                />
              </div>
            ) : (
              <div className="space-y-5">
                <div className="grid grid-cols-4 gap-2">
                  {PRESETS.map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        setSelected(value);
                        setCustom("");
                      }}
                      className={`py-3 rounded-md border text-sm transition-colors ${
                        selected === value
                          ? "border-accent bg-accent/10 text-foreground"
                          : "border-border hover:bg-accent/5 text-muted-foreground"
                      }`}
                    >
                      ${value}
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground" htmlFor="custom-amount">
                    Or enter your own amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      $
                    </span>
                    <Input
                      id="custom-amount"
                      inputMode="decimal"
                      placeholder="0"
                      className="pl-7"
                      value={custom}
                      onChange={(e) => {
                        setCustom(e.target.value.replace(/[^\d.]/g, ""));
                        setSelected(null);
                      }}
                    />
                  </div>
                </div>

                <Button
                  className="w-full"
                  disabled={!validAmount}
                  onClick={() => setCheckoutAmount(Number(amount))}
                >
                  Continue
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  One-time contribution. No subscription, no recurring charge.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
