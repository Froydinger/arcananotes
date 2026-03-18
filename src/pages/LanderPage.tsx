import { useState, useEffect } from "react";
import { Heart, PenLine, CheckSquare, Brain, Shield, Smartphone, ArrowRight, Check, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoginDialog } from "@/components/auth/LoginDialog";
import FakeNoteEditor from "@/components/landing/FakeNoteEditor";

export default function LanderPage() {
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowStickyHeader(window.scrollY > 100);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const features = [
    {
      icon: PenLine,
      title: "Focused Editor",
      description: "A beautiful, distraction-free writing space with rich formatting. No clutter, just your words.",
    },
    {
      icon: CheckSquare,
      title: "Smart Checklists",
      description: "Plan and organize with interactive checklists. Track ideas, to-dos, and creative projects.",
    },
    {
      icon: Brain,
      title: "Arc AI Assistant",
      description: "Built-in AI that helps you brainstorm, improve your writing, and craft compelling content.",
    },
  ];

  const freeHighlights = [
    "Unlimited notes & checklists",
    "Rich text editor with formatting",
    "Cloud sync across all devices",
    "Private & secure by default",
    "Works offline as a PWA",
    "20 AI requests per day",
  ];

  const proHighlights = [
    "Everything in Free",
    "Unlimited AI powered by ArcAi™",
    "Priority AI access",
  ];

  return (
    <div className="relative min-h-screen w-full bg-background">
      {/* Sticky Header */}
      <nav
        className={`fixed left-0 right-0 z-50 border-b border-border/40 backdrop-blur-xl bg-background/80 transition-all duration-300 ${
          showStickyHeader ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
        }`}
        style={{ top: 0, paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="flex items-center justify-between px-4 py-3 md:px-8 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-accent" fill="currentColor" />
            <span className="font-display text-lg text-foreground tracking-tight">Arcana Notes</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#features" className="hidden md:block text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#why" className="hidden md:block text-sm text-muted-foreground hover:text-foreground transition-colors">Why Arcana Notes</a>
            <button
              onClick={() => setShowLoginDialog(true)}
              className="px-4 py-2 rounded-full text-sm font-semibold bg-accent/15 border-2 border-accent text-accent hover:bg-accent/25 transition-all"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Top Navigation */}
      <nav className="relative z-50 flex items-center justify-between px-4 py-4 md:px-8 max-w-7xl mx-auto pwa-safe-top">
        <div className="flex items-center gap-2.5">
          <Heart className="h-8 w-8 text-accent" fill="currentColor" />
          <span className="font-display text-xl text-foreground tracking-tight">
            Arcana Notes<span className="text-xs text-muted-foreground ml-0.5 -mt-1 align-super">™</span>
          </span>
        </div>
        <div className="hidden md:flex items-center gap-6">
          <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
          <a href="#why" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Why Arcana Notes</a>
          <button
            onClick={() => setShowLoginDialog(true)}
            className="px-5 py-2.5 rounded-full text-sm font-semibold bg-accent/15 border-2 border-accent text-accent hover:bg-accent/25 transition-all"
          >
            Get Started Free
          </button>
        </div>
        <button className="md:hidden text-foreground" onClick={() => setShowMobileMenu(!showMobileMenu)}>
          {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div
          className="md:hidden fixed right-6 z-50 rounded-2xl p-4 space-y-3 min-w-[200px] bg-card/95 backdrop-blur-xl border border-border/50 shadow-elevated-lg animate-scale-in"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + 5rem)' }}
        >
          <a href="#features" onClick={() => setShowMobileMenu(false)} className="block text-muted-foreground hover:text-foreground transition-colors">Features</a>
          <a href="#why" onClick={() => setShowMobileMenu(false)} className="block text-muted-foreground hover:text-foreground transition-colors">Why Arcana Notes</a>
          <button
            onClick={() => { setShowLoginDialog(true); setShowMobileMenu(false); }}
            className="w-full px-4 py-2 rounded-full text-sm font-semibold bg-accent/15 border-2 border-accent text-accent text-center"
          >
            Get Started Free
          </button>
        </div>
      )}

      {/* Hero */}
      <main className="relative z-10 pt-4 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <Heart
                className="w-24 h-24 md:w-32 md:h-32 text-accent drop-shadow-lg"
                fill="currentColor"
                style={{ filter: 'drop-shadow(0 0 20px hsl(var(--accent) / 0.3))' }}
              />
              <div className="absolute inset-0 w-24 h-24 md:w-32 md:h-32 bg-accent/20 rounded-full blur-2xl -z-10 animate-pulse-soft" />
            </div>
          </div>

          <h1
            className="font-display text-5xl md:text-7xl text-foreground tracking-tight mb-6 leading-tight"
          >
            Write what you{" "}
            <span className="text-accent">love.</span>
          </h1>
          <p
            className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl mx-auto leading-relaxed font-sans"
          >
            The note-taking app designed for passionate writers. Beautiful, fast, and built for your creative flow.
          </p>

          <div
            className="flex flex-col items-center justify-center space-y-4 w-full max-w-sm mx-auto"
          >
            <Button
              onClick={() => setShowLoginDialog(true)}
              className="w-full h-14 rounded-full bg-accent/15 border-2 border-accent text-accent hover:bg-accent/25 font-sans text-lg gap-3 transition-all hover:scale-105 shadow-glow-sm"
            >
              <Heart className="h-5 w-5" fill="currentColor" />
              Start Writing — It's Free
            </Button>
            <span className="text-xs text-muted-foreground/60">Free to use · Unlimited AI for $5/mo</span>
          </div>
        </div>

        {/* App Mockup */}
        <FakeNoteEditor />
      </main>

      {/* Features */}
      <section className="relative z-10 py-24 px-6 max-w-4xl mx-auto text-center" id="features">
        <div className="space-y-6 flex flex-col items-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-xs text-accent font-medium">
            <PenLine className="w-3.5 h-3.5" />
            Built for writers
          </div>
          <h2 className="font-display text-3xl md:text-5xl text-foreground leading-tight">
            Everything you need<br />
            <span className="text-accent">to write beautifully.</span>
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-lg font-sans">
            A distraction-free editor with AI assistance that turns rough ideas into polished, expressive notes.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div
                key={i}
                className="p-6 rounded-2xl space-y-3 text-left bg-card/60 backdrop-blur-sm border border-border/50 hover:border-accent/30 transition-all duration-300 group"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center shadow-glow-sm group-hover:shadow-glow transition-shadow duration-300">
                  <Icon className="w-5 h-5 text-accent" />
                </div>
                <h3 className="text-lg font-semibold text-foreground font-sans">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed font-sans">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Why Arcana Notes */}
      <section className="relative z-10 py-20 px-6 max-w-4xl mx-auto text-center" id="why">
        <div className="space-y-6 flex flex-col items-center mb-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent/30 to-accent/10 flex items-center justify-center shadow-glow-sm">
            <Shield className="w-6 h-6 text-accent" />
          </div>
          <h2 className="font-display text-3xl md:text-5xl text-foreground leading-tight">
            Private, secure,<br />
            <span className="text-accent">and truly yours.</span>
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-lg font-sans">
            Your notes stay private. Share only when you want to. Works on every device, even offline.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {['Private by Default', 'Cloud Synced', 'Works Offline', 'Share & Collaborate', 'Beautiful Themes'].map((tag, i) => (
            <div
              key={i}
              className="px-5 py-3 rounded-full text-sm text-foreground/80 bg-card/60 backdrop-blur-sm border border-border/50 hover:border-accent/30 transition-colors cursor-default"
            >
              {tag}
            </div>
          ))}
        </div>
      </section>

      {/* Everything Included */}
      <section className="relative z-10 py-24 px-6 max-w-4xl mx-auto text-center">
        <div className="space-y-6 flex flex-col items-center mb-10">
          <h2 className="font-display text-3xl md:text-5xl text-foreground leading-tight">
            Simple pricing,<br />
            <span className="text-accent">powerful writing.</span>
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-lg font-sans">
            Start for free. Upgrade when you need unlimited AI.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Free Plan */}
          <div className="rounded-3xl p-8 bg-card/60 backdrop-blur-sm border border-border/50 relative overflow-hidden">
            <div className="mb-6">
              <div className="flex items-baseline justify-center gap-1 mb-2">
                <span className="font-display text-4xl text-foreground">Free</span>
              </div>
              <p className="text-sm text-muted-foreground font-sans">No credit card required</p>
            </div>
            <div className="space-y-3 text-left mb-8">
              {freeHighlights.map((feature, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-foreground/80 font-sans">
                  <Check className="w-4 h-4 text-accent shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
            <Button
              onClick={() => setShowLoginDialog(true)}
              className="w-full h-12 rounded-full bg-muted border border-border text-foreground hover:bg-muted/80 font-sans text-base gap-2 transition-all"
            >
              Get Started Free
            </Button>
          </div>

          {/* Pro Plan */}
          <div className="rounded-3xl p-8 bg-card/60 backdrop-blur-sm border-2 border-accent/40 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent to-accent/50" />
            <div className="mb-6">
              <div className="flex items-baseline justify-center gap-1 mb-2">
                <span className="font-display text-4xl text-foreground">$5</span>
                <span className="text-muted-foreground font-sans">/mo</span>
              </div>
              <p className="text-sm text-accent font-sans font-medium">Arcana Notes Pro</p>
            </div>
            <div className="space-y-3 text-left mb-8">
              {["Everything in Free", "Unlimited AI powered by ArcAi™", "Priority AI access"].map((feature, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-foreground/80 font-sans">
                  <Check className="w-4 h-4 text-accent shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
            <Button
              onClick={() => setShowLoginDialog(true)}
              className="w-full h-12 rounded-full bg-accent/15 border-2 border-accent text-accent hover:bg-accent/25 font-sans text-base gap-2 transition-all hover:scale-105 shadow-glow-sm"
            >
              <Heart className="h-4 w-4" fill="currentColor" />
              Start Writing with Pro
            </Button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-16 pb-32 px-6 text-center">
        <div className="max-w-2xl mx-auto space-y-8">
          <h2 className="font-display text-3xl md:text-5xl text-foreground leading-tight">
            Ready to write<br />
            <span className="text-accent">what you love?</span>
          </h2>
          <Button
            onClick={() => setShowLoginDialog(true)}
            className="h-14 px-8 rounded-full bg-accent/15 border-2 border-accent text-accent hover:bg-accent/25 font-sans text-lg gap-3 transition-all hover:scale-105 shadow-glow-sm"
          >
            <ArrowRight className="w-5 h-5" />
            Start Writing Today
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 px-6 border-t border-border/40 text-center space-y-3">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Heart className="h-5 w-5 text-accent/60" fill="currentColor" />
          <span className="font-display text-foreground/60">
            Arcana Notes<span className="text-xs text-muted-foreground/40 ml-0.5 align-super">™</span>
          </span>
        </div>
        <p className="text-xs text-muted-foreground/50 font-sans">
          Questions?{" "}
          <a href="mailto:help@noteily.app" className="hover:text-muted-foreground transition-colors underline underline-offset-2">
            help@noteily.app
          </a>
        </p>
        <p className="text-xs text-muted-foreground/30 font-sans mt-2">
          <a href="/terms" className="hover:text-muted-foreground transition-colors underline underline-offset-2">Terms</a>
          {" · "}
          <a href="/privacy" className="hover:text-muted-foreground transition-colors underline underline-offset-2">Privacy</a>
        </p>
      </footer>

      {/* Login Dialog */}
      <LoginDialog open={showLoginDialog} onOpenChange={setShowLoginDialog} />
    </div>
  );
}
