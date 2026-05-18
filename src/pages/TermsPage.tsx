import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const TermsPage = () => {
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
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">Terms &amp; Conditions</h1>
            <p className="text-muted-foreground">Last updated: May 2026</p>
          </header>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">1. Who you are contracting with</h2>
            <p className="text-muted-foreground">
              These Terms govern your use of Arcana Notes ("Arcana", "the Service"), provided by{' '}
              <strong className="text-foreground">Win The Night™ Productions | Froydinger™ Design Systems</strong>{' '}
              ("the Company", "we", "us"). By creating an account or otherwise using the Service you agree to these
              Terms. If you are using the Service on behalf of an organisation, you confirm that you have authority to
              bind that organisation. If you are an individual, you confirm that you are of legal age in your country.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">2. The Service</h2>
            <p className="text-muted-foreground">
              Arcana is a note-taking application with optional AI-assisted writing, image generation, and editing
              features ("Arc AI"). We grant you a limited, non-exclusive, non-transferable right to use the Service for
              your personal or internal business purposes in accordance with these Terms and your subscription plan.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">3. Accounts</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>You must provide accurate information and keep it up to date.</li>
              <li>You are responsible for keeping your credentials confidential and for all activity under your account.</li>
              <li>Notify us promptly at help@noteily.app of any unauthorised use.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">4. Acceptable use</h2>
            <p className="text-muted-foreground">You must not, and must not allow others to:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Use the Service for unlawful, fraudulent, infringing, or abusive purposes.</li>
              <li>Send spam, attempt phishing, or interfere with the Service's security (malware, probing, scraping, bypassing rate limits).</li>
              <li>Reverse engineer, decompile, resell, or redistribute the Service.</li>
              <li>Circumvent any plan limit or access control.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">5. AI features</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>You are responsible for the prompts you submit, the content you upload, and your use of any outputs, including verifying their accuracy and ensuring you have the rights to any input content.</li>
              <li>You must not use Arc AI to generate illegal content, non-consensual intimate imagery, deepfakes intended to deceive, content sexualising minors, malware, hate speech, harassment, or content designed to jailbreak or extract model weights.</li>
              <li>Outputs may be inaccurate, incomplete or biased and are not a substitute for professional advice (legal, medical, financial, or otherwise).</li>
              <li>We may filter, refuse, or restrict outputs and may remove content or suspend accounts that breach these rules. Repeated infringement of third-party rights will result in termination; rights-holders may submit takedown requests to help@noteily.app.</li>
              <li>As between you and us, you retain whatever rights you have in your inputs, and you own your outputs to the extent permitted by law and our model providers' terms.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">6. Intellectual property</h2>
            <p className="text-muted-foreground">
              The Service, including all software, design, branding, and documentation, is owned by the Company and its
              licensors and is protected by intellectual property laws. No rights are granted to you other than the
              limited licence in Section 2. You retain ownership of your content; you grant us a limited, worldwide,
              royalty-free licence to host, transmit and process your content solely to provide and improve the Service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">7. Plans, payments and Merchant of Record</h2>
            <p className="text-muted-foreground">
              Arcana offers a Free plan and a paid Pro plan (currently $6/month, billed monthly and renewing
              automatically until cancelled). Pricing, taxes, and any applicable VAT/sales tax will be shown at
              checkout. You can cancel at any time from the in-app Settings page; cancellation takes effect at the end
              of the current billing period and you retain access until then.
            </p>
            <p className="text-muted-foreground">
              <strong className="text-foreground">Merchant of Record notice:</strong> Our order process is conducted by
              our online reseller{' '}
              <a href="https://www.paddle.com" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Paddle.com</a>.
              Paddle.com is the Merchant of Record for all our orders. Paddle provides all customer service inquiries
              and handles returns. Payment, billing, tax, cancellation and refund mechanics are governed by{' '}
              <a href="https://www.paddle.com/legal/checkout-buyer-terms" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Paddle's Buyer Terms</a>.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">8. Refunds</h2>
            <p className="text-muted-foreground">
              See our <a href="/refunds" className="text-accent hover:underline">Refund Policy</a>. In short: 30-day
              money-back guarantee, requests handled via Paddle at{' '}
              <a href="https://paddle.net" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">paddle.net</a>{' '}
              or by emailing help@noteily.app.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">9. Suspension and termination</h2>
            <p className="text-muted-foreground">
              We may suspend or terminate your access for material breach of these Terms, non-payment, suspected fraud
              or security risk, or repeated or serious policy violations. You may delete your account at any time from
              the Settings page. On termination, your right to use the Service ends; we will delete your content within
              30 days unless we are legally required to keep it for longer.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">10. Service availability and warranties</h2>
            <p className="text-muted-foreground">
              The Service is provided "as is" and "as available". We do not warrant that it will be uninterrupted,
              error-free, or fit for any particular purpose, and to the fullest extent permitted by law we disclaim all
              implied warranties.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">11. Limitation of liability</h2>
            <p className="text-muted-foreground">
              To the maximum extent permitted by law, our aggregate liability arising out of or relating to the Service
              is limited to the fees you paid to us (via Paddle) in the 12 months preceding the event giving rise to
              the claim. We are not liable for indirect, incidental, special, consequential or punitive damages,
              including loss of profits, data, or goodwill. Nothing in these Terms excludes liability for fraud, death
              or personal injury caused by negligence, or any liability that cannot be excluded by law.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">12. Indemnity</h2>
            <p className="text-muted-foreground">
              You will indemnify and hold the Company harmless from any third-party claim arising out of your content,
              your unlawful or infringing use of the Service, or your breach of these Terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">13. Changes</h2>
            <p className="text-muted-foreground">
              We may update these Terms from time to time. Material changes will be notified in-app or by email, and
              continued use after the effective date constitutes acceptance.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">14. Governing law</h2>
            <p className="text-muted-foreground">
              These Terms are governed by the laws of the State of New Jersey, USA, without regard to its conflict of
              law rules. The exclusive venue for any dispute is the state or federal courts located in New Jersey,
              unless mandatory local law gives you the right to bring proceedings elsewhere.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">15. Miscellaneous</h2>
            <p className="text-muted-foreground">
              You may not assign these Terms without our consent. We may assign them to an affiliate or in connection
              with a merger, acquisition or sale of assets. Neither party is liable for delays caused by events beyond
              its reasonable control (force majeure). If any provision is unenforceable, the rest remains in effect.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">16. Contact</h2>
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

export default TermsPage;
