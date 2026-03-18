import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Lock, Mail, X } from 'lucide-react';
import arcanaLogo from '@/assets/arcana-logo.png';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';
import { lovable } from '@/integrations/lovable/index';

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [showEmail, setShowEmail] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const copy = useMemo(() => {
    if (mode === 'signup') {
      return {
        title: 'Create your account',
        description: 'Start writing immediately with a single email and password.',
        submit: isSubmitting ? 'Creating account...' : 'Create account',
        switchLabel: 'Already have an account?',
        switchAction: 'Sign in',
      };
    }

    return {
      title: 'Welcome back',
      description: 'Sign in to sync your notes and pick up where you left off.',
      submit: isSubmitting ? 'Signing in...' : 'Sign in',
      switchLabel: "Don't have an account?",
      switchAction: 'Create one',
    };
  }, [isSubmitting, mode]);

  const resetState = () => {
    setMode('signin');
    setShowEmail(false);
    setEmail('');
    setPassword('');
    setShowPassword(false);
    setIsSubmitting(false);
    setInlineError(null);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetState();
    }
    onOpenChange(nextOpen);
  };

  const handleModeChange = (nextMode: 'signin' | 'signup') => {
    setMode(nextMode);
    setPassword('');
    setInlineError(null);
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();

    if (!email.trim() || !password) {
      setInlineError('Enter both your email and password.');
      return;
    }

    setIsSubmitting(true);
    setInlineError(null);

    const { error } = mode === 'signup'
      ? await signUp(email, password)
      : await signIn(email, password);

    if (error) {
      setInlineError(error.message || 'Something went wrong. Please try again.');
      setIsSubmitting(false);
      return;
    }

    toast.success(mode === 'signup' ? 'Account created' : 'Signed in');
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[460px] overflow-hidden border-0 bg-transparent p-0 shadow-none [&>button]:hidden">
        <div className="relative overflow-hidden rounded-[2rem] border border-border/60 bg-card/90 shadow-2xl backdrop-blur-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-card/95 via-card/90 to-background/95" />
          <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-accent/15 blur-3xl" />
          <div className="absolute -bottom-20 -left-12 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />

          <div className="relative p-6 sm:p-8">
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              className="absolute right-5 top-5 inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-background/50 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mb-8 pr-10 text-center">
              <div className="mb-4 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-[1.35rem] border border-accent/20 bg-accent/10 shadow-glow-sm">
                  <img src={arcanaLogo} alt="Arcana" className="h-10 w-10" />
                </div>
              </div>
              <DialogTitle className="font-display text-3xl text-foreground">
                Arcana Notes<span className="ml-1 align-super text-xs text-muted-foreground">™</span>
              </DialogTitle>
              <DialogDescription className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
                {copy.description}
              </DialogDescription>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-2 rounded-full border border-border/60 bg-background/50 p-1">
              <button
                type="button"
                onClick={() => handleModeChange('signin')}
                disabled={isSubmitting}
                className={cn(
                  'rounded-full px-4 py-2.5 text-sm font-medium transition-all',
                  mode === 'signin'
                    ? 'bg-accent text-accent-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('signup')}
                disabled={isSubmitting}
                className={cn(
                  'rounded-full px-4 py-2.5 text-sm font-medium transition-all',
                  mode === 'signup'
                    ? 'bg-accent text-accent-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Create account
              </button>
            </div>

            <div className="mb-5 text-center">
              <h2 className="text-xl font-semibold text-foreground">{copy.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {mode === 'signup' ? 'Create your account with email and password.' : 'Use your email and password to get back in.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="auth-email">Email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="auth-email"
                    type="email"
                    inputMode="email"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    autoComplete={mode === 'signin' ? 'username' : 'email'}
                    placeholder="you@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="h-12 rounded-2xl border-border/60 bg-background/60 pl-10 text-base"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auth-password">Password</Label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => {
                        handleOpenChange(false);
                        navigate('/forgot-password');
                      }}
                      className="text-xs text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                    placeholder={mode === 'signup' ? 'At least 6 characters' : 'Enter your password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="h-12 rounded-2xl border-border/60 bg-background/60 pl-10 pr-12 text-base"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {inlineError && (
                <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
                  {inlineError}
                </div>
              )}

              <Button type="submit" className="h-12 w-full rounded-2xl text-base font-semibold" disabled={isSubmitting}>
                {copy.submit}
                {!isSubmitting && <ArrowRight className="h-4 w-4" />}
              </Button>
            </form>

            <div className="relative my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-border/60" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="h-px flex-1 bg-border/60" />
            </div>

            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                className="h-12 w-full rounded-2xl border-border/60 bg-background/60 text-base font-medium"
                disabled={isSubmitting}
                onClick={async () => {
                  setIsSubmitting(true);
                  setInlineError(null);
                  const result = await lovable.auth.signInWithOAuth('google', {
                    redirect_uri: window.location.origin,
                  });
                  if (result?.error) {
                    setInlineError('Google sign-in failed. Please try again.');
                    setIsSubmitting(false);
                  }
                }}
              >
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </Button>

              <Button
                type="button"
                variant="outline"
                className="h-12 w-full rounded-2xl border-border/60 bg-foreground text-background text-base font-medium hover:bg-foreground/90 hover:text-background"
                disabled={isSubmitting}
                onClick={async () => {
                  setIsSubmitting(true);
                  setInlineError(null);
                  const result = await lovable.auth.signInWithOAuth('apple', {
                    redirect_uri: window.location.origin,
                  });
                  if (result?.error) {
                    setInlineError('Apple sign-in failed. Please try again.');
                    setIsSubmitting(false);
                  }
                }}
              >
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
                Continue with Apple
              </Button>
            </div>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              <span>{copy.switchLabel} </span>
              <button
                type="button"
                onClick={() => handleModeChange(mode === 'signin' ? 'signup' : 'signin')}
                className="font-medium text-foreground underline underline-offset-4 transition-colors hover:text-accent"
                disabled={isSubmitting}
              >
                {copy.switchAction}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
