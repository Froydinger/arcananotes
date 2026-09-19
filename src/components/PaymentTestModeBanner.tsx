const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN;

export function PaymentTestModeBanner() {
  if (!clientToken) {
    return (
      <div className="w-full bg-destructive/10 border-b border-destructive/30 px-4 py-2 text-center text-sm text-destructive">
        Payments are not live yet, so support contributions can't be processed.
      </div>
    );
  }
  if (clientToken.startsWith("pk_test_")) {
    return (
      <div className="w-full bg-muted border-b border-border px-4 py-2 text-center text-sm text-muted-foreground">
        Test mode: no real money is charged in the preview.
      </div>
    );
  }
  return null;
}
