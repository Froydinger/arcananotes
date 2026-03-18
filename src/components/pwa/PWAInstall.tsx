import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, X } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showAddToHomePrompt, setShowAddToHomePrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallPrompt(true);
    };

    // Check if user is in PWA mode
    const isInPWA = window.matchMedia('(display-mode: standalone)').matches || 
                    (window.navigator as any).standalone === true;
    
    // Check if we've already shown the add to home prompt
    const hasSeenAddToHome = localStorage.getItem('arcana-notes-add-to-home-seen');
    
    // Show add to home prompt if not in PWA and haven't seen it before
    if (!isInPWA && !hasSeenAddToHome) {
      const timer = setTimeout(() => {
        setShowAddToHomePrompt(true);
        localStorage.setItem('arcana-notes-add-to-home-seen', 'true');
      }, 2000); // Show after 2 seconds
      
      return () => clearTimeout(timer);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    await deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const choiceResult = await deferredPrompt.userChoice;
    
    if (choiceResult.outcome === 'accepted') {
      toast.success("App installed!");
    }
    
    // Clear the deferredPrompt
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
  };

  const handleAddToHomeDismiss = () => {
    setShowAddToHomePrompt(false);
  };

  if (!showInstallPrompt && !showAddToHomePrompt) return null;

  // Show native install prompt if available
  if (showInstallPrompt) {
    return (
      <Card className="fixed z-50 w-80 animate-slide-up shadow-lg border-neon-blue/20 apple-pwa-floating">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-serif">Install Arcana Notes</CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleDismiss}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            Install Arcana Notes on your device for quick access and offline usage.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <Button 
            onClick={handleInstallClick}
            className="w-full"
            size="sm"
          >
            <Download className="mr-2 h-4 w-4" />
            Install App
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show add to home screen prompt for non-PWA users
  return (
    <Card className="fixed z-50 w-80 animate-slide-up shadow-lg border-neon-blue/20 apple-pwa-floating">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-serif">Add to Home Screen</CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleAddToHomeDismiss}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          Add Arcana Notes to your home screen for faster access and a native app experience.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-sm text-muted-foreground space-y-2">
          <div>• <strong>iOS:</strong> Tap the share button and select "Add to Home Screen"</div>
          <div>• <strong>Android:</strong> Tap the menu and select "Add to Home screen"</div>
        </div>
      </CardContent>
    </Card>
  );
};