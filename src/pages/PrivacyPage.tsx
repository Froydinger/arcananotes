import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Shield, Sparkles, Mail, Database } from 'lucide-react';

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

        <div className="space-y-6">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
              Privacy & Terms
            </h1>
            <p className="text-muted-foreground">
              Simple, honest, and transparent
            </p>
          </div>

          {/* The Short Version */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Shield className="h-5 w-5 text-accent" />
                The Short Version
              </CardTitle>
            </CardHeader>
            <CardContent className="text-foreground space-y-3">
              <p>
                Arcana Notes is a free note-taking tool. We keep it simple:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong className="text-foreground">We don't collect your data</strong> - Your notes stay on your device and sync to your account. That's it.</li>
                <li><strong className="text-foreground">We don't spam you</strong> - No marketing emails, no newsletters, no nonsense.</li>
                <li><strong className="text-foreground">We don't sell anything</strong> - No ads, no premium tiers, no hidden monetization.</li>
                <li><strong className="text-foreground">We don't read your notes</strong> - Your content is yours. We don't look at it.</li>
              </ul>
            </CardContent>
          </Card>

          {/* AI Features */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Sparkles className="h-5 w-5 text-accent" />
                AI Features (Gemini)
              </CardTitle>
            </CardHeader>
            <CardContent className="text-foreground space-y-3">
              <p>
                Our AI rewrite and spell/grammar check features are powered by Google's Gemini API.
              </p>
              <p className="text-muted-foreground">
                When you use these features, your selected text is sent to Google for processing. Here's what you should know:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>We've configured our API to <strong className="text-foreground">not share or store your data</strong> for Google's training purposes</li>
                <li>Data is processed in real-time and not retained by our systems</li>
                <li>However, Google's data handling is subject to their own privacy policies</li>
                <li>If you're concerned, simply don't use the AI features - everything else works without them</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-4">
                For more information about how Google handles API data, see{' '}
                <a
                  href="https://ai.google.dev/gemini-api/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  Google's Gemini API Terms
                </a>
              </p>
            </CardContent>
          </Card>

          {/* Data Storage */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Database className="h-5 w-5 text-accent" />
                Data Storage
              </CardTitle>
            </CardHeader>
            <CardContent className="text-foreground space-y-3">
              <p>
                Your notes are stored securely using Supabase (hosted on AWS). We store:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Your email address (for login)</li>
                <li>Your notes and checklists</li>
                <li>Your app preferences (theme, fonts, etc.)</li>
              </ul>
              <p className="text-muted-foreground mt-3">
                You can delete your account and all associated data at any time from the Settings page.
              </p>
            </CardContent>
          </Card>

          {/* Terms of Use */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                Terms of Use
              </CardTitle>
            </CardHeader>
            <CardContent className="text-foreground space-y-3">
              <p className="text-muted-foreground">
                By using Arcana Notes, you agree to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Not use the service for anything illegal</li>
                <li>Keep your login credentials secure</li>
                <li>Accept that the service is provided "as is" without warranties</li>
              </ul>
              <p className="text-muted-foreground mt-3">
                That's really it. We're not trying to trap you in legal jargon. Just use the app responsibly and we're good.
              </p>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Mail className="h-5 w-5 text-accent" />
                Questions?
              </CardTitle>
            </CardHeader>
            <CardContent className="text-foreground">
              <p className="text-muted-foreground">
                If you have any questions or concerns, reach out:{' '}
                <a
                  href="mailto:help@noteily.app"
                  className="text-accent hover:underline"
                >
                  help@noteily.app
                </a>
              </p>
            </CardContent>
          </Card>

          {/* Footer */}
          <p className="text-center text-sm text-muted-foreground pt-4">
            Last updated: December 2024
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
