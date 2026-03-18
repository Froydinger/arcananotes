import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { EmailOtpType } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { clearAuthCallbackParams } from '@/lib/authRedirect';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Heart, Lock } from 'lucide-react';

const OTP_TYPES = new Set<EmailOtpType>(['recovery']);

function getRecoveryParams() {
  const url = new URL(window.location.href);

  return {
    tokenHash: url.searchParams.get('token_hash') ?? url.searchParams.get('token'),
    type: url.searchParams.get('type'),
  };
}

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recoveryParams = useMemo(() => getRecoveryParams(), []);

  useEffect(() => {
    let isActive = true;

    const initializeRecovery = async () => {
      try {
        const { tokenHash, type } = recoveryParams;

        if (tokenHash && type && OTP_TYPES.has(type as EmailOtpType)) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as EmailOtpType,
          });

          if (error) {
            throw error;
          }
        } else {
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (!session?.user) {
            throw new Error('This password reset link is invalid or has expired.');
          }
        }

        clearAuthCallbackParams();
        window.history.replaceState({}, document.title, window.location.pathname);

        if (isActive) {
          setIsReady(true);
        }
      } catch (err: any) {
        console.error('[ResetPassword] Failed to initialize recovery session', err);
        clearAuthCallbackParams();
        window.history.replaceState({}, document.title, window.location.pathname);

        if (isActive) {
          setError(err?.message ?? 'This password reset link is invalid or has expired.');
        }
      }
    };

    void initializeRecovery();

    return () => {
      isActive = false;
    };
  }, [recoveryParams]);

  const handleResetPassword = async () => {
    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: 'Please make sure both passwords are the same.',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 6 characters long.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        throw error;
      }

      toast({
        title: 'Password updated',
        description: 'You can now continue into your account.',
      });

      navigate('/home', { replace: true });
    } catch (err: any) {
      toast({
        title: 'Password reset failed',
        description: err?.message ?? 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-subtle px-4">
        <Card className="w-full max-w-md border-border/60 bg-card/95 backdrop-blur">
          <CardHeader className="text-center">
            <div className="mb-4 flex justify-center">
              <Heart className="h-8 w-8 text-accent" fill="currentColor" />
            </div>
            <CardTitle>Reset link invalid</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link to="/forgot-password">Request a new reset link</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-subtle px-4">
        <Card className="w-full max-w-md border-border/60 bg-card/95 backdrop-blur">
          <CardHeader className="text-center">
            <div className="mb-4 flex justify-center">
              <Heart className="h-8 w-8 text-accent" fill="currentColor" />
            </div>
            <CardTitle>Preparing reset</CardTitle>
            <CardDescription>Verifying your reset link…</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-8">
            <LoadingSpinner size="lg" text="Checking link..." />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-subtle px-4">
      <Card className="w-full max-w-md border-border/60 bg-card/95 backdrop-blur">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <Heart className="h-8 w-8 text-accent" fill="currentColor" />
          </div>
          <CardTitle>Set a new password</CardTitle>
          <CardDescription>Choose a new password for your account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 6 characters"
              disabled={isLoading}
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Re-enter your new password"
              disabled={isLoading}
              autoComplete="new-password"
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  handleResetPassword();
                }
              }}
            />
          </div>
          <Button
            type="button"
            onClick={handleResetPassword}
            className="w-full"
            disabled={isLoading || !password || !confirmPassword}
          >
            <Lock className="mr-2 h-4 w-4" />
            {isLoading ? 'Updating password...' : 'Update password'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPasswordPage;
