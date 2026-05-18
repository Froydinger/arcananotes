import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const RefundsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-3xl mx-auto">
        <Button
          onClick={() => navigate(-1)}
          variant="ghost"
          className="mb-6 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <article className="prose prose-invert max-w-none text-foreground space-y-6">
          <header>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">Refund Policy</h1>
            <p className="text-muted-foreground">Last updated: May 2026</p>
          </header>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">30-day money-back guarantee</h2>
            <p className="text-muted-foreground">
              We want you to be happy with Arcana Notes Pro. If you are not satisfied with your purchase, you can
              request a full refund within <strong className="text-foreground">30 days</strong> of your order date,
              for any reason.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">How to request a refund</h2>
            <p className="text-muted-foreground">
              Refunds are processed by our payment provider and Merchant of Record,{' '}
              <a href="https://www.paddle.com" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Paddle</a>.
              You can request a refund in either of two ways:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Go to <a href="https://paddle.net" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">paddle.net</a>, look up your order using the email address you used at checkout, and request a refund directly.</li>
              <li>Email us at <a href="mailto:help@noteily.app" className="text-accent hover:underline">help@noteily.app</a> with your order email, and we will pass the request to Paddle on your behalf.</li>
            </ul>
            <p className="text-muted-foreground">
              Approved refunds are returned to the original payment method, usually within 5–10 business days depending
              on your bank.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">Cancellations</h2>
            <p className="text-muted-foreground">
              You can cancel your subscription at any time from the in-app Settings page. Cancellation stops future
              renewals; you keep Pro access until the end of the current billing period.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">Contact</h2>
            <p className="text-muted-foreground">
              Win The Night™ Productions | Froydinger™ Design Systems —{' '}
              <a href="mailto:help@noteily.app" className="text-accent hover:underline">help@noteily.app</a>
            </p>
          </section>
        </article>
      </div>
    </div>
  );
};

export default RefundsPage;
