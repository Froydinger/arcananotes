import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const PrivacyPage = () => {
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
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">Privacy Notice</h1>
            <p className="text-muted-foreground">Last updated: May 2026</p>
          </header>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">1. Who we are</h2>
            <p className="text-muted-foreground">
              Arcana Notes ("Arcana", "we", "us") is operated by{' '}
              <strong className="text-foreground">Win The Night™ Productions | Froydinger™ Design Systems</strong>{' '}
              ("the Company"). The Company is the data controller responsible for personal data processed through the
              Arcana service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">2. Categories of personal data we collect</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">Account data:</strong> email address, authentication identifiers, and (if you use social login) the name/avatar provided by Google or Apple.</li>
              <li><strong className="text-foreground">Content data:</strong> notes, checklists, images, and preferences you create or upload.</li>
              <li><strong className="text-foreground">Usage and telemetry:</strong> AI request counts, feature usage, error logs, device type, browser, and IP address.</li>
              <li><strong className="text-foreground">Support data:</strong> messages you send to help@noteily.app.</li>
              <li><strong className="text-foreground">Billing data:</strong> handled directly by Paddle (see Section 5). We receive only a subscription status, plan, and customer reference — never your full card details.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">3. Purposes and legal bases</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">Providing the service</strong> (account creation, syncing notes, AI features) — legal basis: performance of a contract.</li>
              <li><strong className="text-foreground">Security, fraud prevention, abuse detection</strong> — legal basis: legitimate interests.</li>
              <li><strong className="text-foreground">Product improvement and aggregate analytics</strong> — legal basis: legitimate interests.</li>
              <li><strong className="text-foreground">Customer support</strong> — legal basis: performance of a contract / legitimate interests.</li>
              <li><strong className="text-foreground">Legal and tax compliance</strong> (via Paddle) — legal basis: legal obligation.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">4. AI processing (Arc AI)</h2>
            <p className="text-muted-foreground">
              When you use Arc AI features, the text or image you select is sent to our model providers (Google Gemini
              and OpenAI) through the Lovable AI Gateway for real-time processing. We configure these APIs so that your
              data is <strong className="text-foreground">not used to train</strong> third-party models. Outputs are
              returned to you and not retained beyond what is needed to deliver the feature.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">5. Data sharing and recipients</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">Paddle.com Market Ltd</strong> — our Merchant of Record. Paddle processes payments, manages subscriptions, handles taxes, invoicing, and refunds, and receives the personal data necessary for those purposes. See{' '}
                <a href="https://www.paddle.com/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Paddle's Privacy Notice</a>.</li>
              <li><strong className="text-foreground">Hosting and backend:</strong> Supabase (hosted on AWS) stores your account, notes, and preferences.</li>
              <li><strong className="text-foreground">AI providers:</strong> Google (Gemini) and OpenAI, via the Lovable AI Gateway, for AI features only.</li>
              <li><strong className="text-foreground">Authentication providers:</strong> Google and Apple, if you choose social login.</li>
              <li><strong className="text-foreground">Professional advisers</strong> (legal, accounting) where strictly necessary.</li>
              <li><strong className="text-foreground">Authorities</strong> where required by law or to protect our rights.</li>
            </ul>
            <p className="text-muted-foreground">We do not sell your personal data.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">6. International transfers</h2>
            <p className="text-muted-foreground">
              Some recipients (including Paddle, Supabase/AWS, Google, OpenAI) are located outside the UK/EEA. Where
              required, we rely on adequacy decisions or Standard Contractual Clauses to safeguard such transfers.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">7. Data retention</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Account, content and preference data: kept while your account is active and deleted within 30 days of account deletion.</li>
              <li>Billing records held by Paddle: retained by Paddle for the period required by tax and accounting law (typically 7–10 years).</li>
              <li>Support correspondence: up to 24 months after the last contact.</li>
              <li>Server logs and security data: up to 90 days, then deleted or anonymised.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">8. Your rights</h2>
            <p className="text-muted-foreground">
              Depending on where you live, you have the right to access, correct, delete, export (portability), restrict
              or object to processing of your personal data, and to withdraw consent at any time. UK/EEA users may
              lodge a complaint with their local supervisory authority. California residents have rights under the CCPA
              including the right to know, delete, and opt out of "sale" or "sharing" of personal information (we do
              neither). You can exercise most rights directly from the in-app Settings page, or by emailing{' '}
              <a href="mailto:help@noteily.app" className="text-accent hover:underline">help@noteily.app</a>. We
              respond within 30 days.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">9. Security</h2>
            <p className="text-muted-foreground">
              We use appropriate technical and organisational measures including TLS in transit, encryption at rest,
              row-level security on our database, least-privilege access controls, and regular review of our
              dependencies.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">10. Cookies and similar technologies</h2>
            <p className="text-muted-foreground">
              We use only essential cookies and local storage needed to keep you signed in and to remember your
              preferences. We do not use advertising or third-party tracking cookies.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">11. Contact</h2>
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

export default PrivacyPage;
