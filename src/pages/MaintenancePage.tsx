import { useState } from "react";
import arcanaLogo from "@/assets/arcana-logo.png";

export default function MaintenancePage() {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    const subject = encodeURIComponent("Arcana waitlist");
    const body = encodeURIComponent(
      `Please add me to the Arcana waitlist.\n\nEmail: ${trimmed}\n`
    );
    window.location.href = `mailto:wait@froydinger.com?subject=${subject}&body=${body}`;
  };

  return (
    <main className="min-h-[100dvh] bg-background text-foreground flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md text-center space-y-8 animate-fade-in">
        <div className="flex flex-col items-center gap-4">
          <img src={arcanaLogo} alt="Arcana" className="h-16 w-16" />
          <h1 className="text-3xl font-semibold tracking-tight">
            Arcana is taking a quick break
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            We've paused the app while we sort out some things behind the scenes.
            Drop your email and we'll let you know the moment it's back.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-lg border border-border bg-card px-4 py-3 text-base outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-primary text-primary-foreground px-4 py-3 font-medium hover:opacity-90 transition"
          >
            Join the waitlist
          </button>
          <p className="text-xs text-muted-foreground">
            This opens your email app to send to wait@froydinger.com.
          </p>
        </form>

        <p className="text-xs text-muted-foreground pt-4">
          Questions? <a href="mailto:help@noteily.app" className="underline">help@noteily.app</a>
        </p>
      </div>
    </main>
  );
}
