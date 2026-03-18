import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "@/components/ui/sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useNotes } from "@/contexts/NoteContext";
import { usePreferences } from "@/contexts/PreferencesContext";
import { useNotifications } from "@/hooks/useNotifications";
import { useSubscription } from "@/hooks/useSubscription";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  LogOut,
  User,
  HelpCircle,
  Download,
  Trash2,
  Key,
  Heart,
  Check,
  X as XIcon,
  Loader2,
  Brain,
  Sparkles,
  Crown,
} from "lucide-react";
import { useTitleFont } from "@/hooks/useTitleFont";
import { supabase } from "@/integrations/supabase/client";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { Input } from "@/components/ui/input";

const SettingsPage = () => {
  const titleFont = useTitleFont();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const isMobile = useIsMobile();
  const { state } = useSidebar();
  const { user, signOut } = useAuth();
  const { notes } = useNotes();
  const { preferences, updateTitleFont, updateBodyFont, updateAiEnabled } = usePreferences();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showSupportDialog, setShowSupportDialog] = useState(false);
  const { isSubscribed, status, aiUsageToday, aiLimit, loading: subLoading, createCheckout, openPortal, checkSubscription } = useSubscription();

  // Check subscription on return from Stripe
  useEffect(() => {
    if (searchParams.get('session_id')) {
      checkSubscription();
    }
  }, [searchParams]);

  const getThemeLabel = (theme: string) => {
    switch (theme) {
      case "light":
        return "Light Mode";
      case "dark":
        return "Dark Mode";
      case "navy":
        return "Night Mode";
      case "sepia":
        return "Fresh Page";
      default:
        return "Night Mode";
    }
  };

  const handleAiEnabledToggle = async () => {
    await updateAiEnabled(!preferences.aiEnabled);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out");
      navigate("/");
    } catch (error) {
      console.error("Settings page sign out error:", error);
      navigate("/");
    }
  };

  const handleSignIn = () => {
    navigate("/");
  };

  const faqItems = [
    {
      question: "How do I create a new note?",
      answer: "Click the '+' button or use the 'New Note' option to create a new note. Start typing immediately.",
    },
    {
      question: "Are my notes saved automatically?",
      answer: "Yes, all notes are automatically saved as you type. No need to manually save.",
    },
    {
      question: "Can I access my notes offline?",
      answer: "Yes, Arcana Notes works offline. Your notes are stored locally and will sync when you're back online.",
    },
    {
      question: "How do I format text in my notes?",
      answer:
        "Select text to see your device's formatting options like bold, italic, and more. Most devices support native text formatting when you select text.",
    },
    {
      question: "Is my data secure and private?",
      answer:
        "Yes, your notes are encrypted with your unique key and stored securely. Only you can access your notes - we cannot read them, and neither can anyone else. When signed in, your encrypted notes sync across your devices.",
    },
  ];

  const handleExportNotes = () => {
    if (!notes.length) {
      toast.error("No notes to export");
      return;
    }

    const exportContent = notes
      .map((note) => {
        const createdDate = new Date(note.createdAt).toLocaleDateString();
        const updatedDate = new Date(note.updatedAt).toLocaleDateString();
        return `\n=====================================\nTitle: ${note.title}\nCreated: ${createdDate}\nUpdated: ${updatedDate}\n=====================================\n\n${note.content}\n\n`;
      })
      .join("\n");

    const blob = new Blob([exportContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `arcana-notes-export-${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${notes.length} notes`);
  };

  const handleChangePassword = async () => {
    if (!newPassword.trim()) {
      toast.error("Password required");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setNewPassword("");
      toast.success("Password updated");
    } catch (error: any) {
      console.error("Error changing password:", error);
      toast.error("Error changing password", { description: error.message });
    } finally {
      setIsChangingPassword(false);
    }
  };


  const handleDeleteAccount = async () => {
    if (!user) return;
    setIsDeleting(true);

    try {
      const { error: preferencesError } = await supabase.from("user_preferences").delete().eq("user_id", user.id);
      if (preferencesError) console.warn("Error deleting user preferences:", preferencesError);

      const { error: notesError } = await supabase.from("notes").delete().eq("user_id", user.id);
      if (notesError) throw notesError;

      await signOut();
      localStorage.clear();
      toast.success("Account deleted");
      navigate("/");
    } catch (error: any) {
      console.error("Error deleting account:", error);
      toast.error("Error deleting account", { description: error.message });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="h-full md:pl-20">
      {/* Sticky floating header */}
      <header className="sticky top-0 z-50 p-4 md:p-8 pb-4 pwa-safe-top">
        {/* Mobile layout - matches desktop */}
        <div className="md:hidden">
          <div className="flex items-center justify-end">
            <button
              onClick={() => setShowSupportDialog(true)}
              className="h-11 w-11 rounded-full bg-background/60 backdrop-blur-md border border-border/30 hover:bg-secondary/80 transition-all duration-200 shadow-sm glass-shimmer flex items-center justify-center"
            >
              <Heart className="h-5 w-5 text-accent" fill="currentColor" />
            </button>
          </div>
        </div>

        {/* Desktop layout */}
        <div className="hidden md:block">
          <div className="flex items-center justify-end">
            <button
              onClick={() => setShowSupportDialog(true)}
              className="h-11 w-11 rounded-full bg-background/60 backdrop-blur-md border border-border/30 hover:bg-secondary/80 transition-all duration-200 shadow-sm glass-shimmer flex items-center justify-center"
            >
              <Heart className="h-5 w-5 text-accent" fill="currentColor" />
            </button>
          </div>
        </div>
      </header>

      <div className="px-4 md:px-8 pb-32 animate-fade-in">
        <div className="max-w-2xl mx-auto">
          <div className="space-y-4 md:space-y-6">
            <div className="bg-card rounded-lg p-4 border">
              <h2 className="text-lg font-light mb-3 dynamic-title-font flex items-center gap-2">
                <span>Preferences</span>
              </h2>
              <div className="space-y-4">
                {/* Theme setting */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <Label htmlFor="theme" className="text-sm font-medium">
                      Theme
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">Choose your preferred theme</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm text-muted-foreground hidden sm:inline">
                      {getThemeLabel(preferences.theme)}
                    </span>
                    <ThemeToggle variant="settings" />
                  </div>
                </div>

                {/* AI Features setting */}
                <div className="flex items-start justify-between gap-3 border-t pt-4">
                  <div className="flex-1 min-w-0">
                    <Label htmlFor="aiEnabled" className="text-sm font-medium">
                      AI Features
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Enable or disable Arc AI writing assistant
                    </p>
                    <p className="text-xs text-primary mt-1 font-medium">
                      Current: {preferences.aiEnabled ? "Enabled" : "Disabled"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAiEnabledToggle}
                      className="p-2 h-8 w-8"
                      title={`${preferences.aiEnabled ? "Disable" : "Enable"} AI features`}
                    >
                      <Brain className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Arcana Notes Pro Subscription */}
            {user && (
              <div className="bg-card rounded-lg p-4 border border-accent/20">
                <h2 className="text-lg font-medium mb-3 font-serif flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-accent" />
                  Arcana Notes Pro
                </h2>
                {isSubscribed ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-accent" />
                      <span className="text-sm font-medium text-accent">Active — Unlimited AI</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Unlimited AI requests powered by <a href="https://askarc.chat" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">ArcAi™</a>. Today: {aiUsageToday} requests.
                    </p>
                    <Button variant="outline" size="sm" onClick={openPortal} className="w-full">
                      Manage Subscription
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      You're on the free plan — <strong>{aiUsageToday}/20</strong> AI requests used today.
                    </p>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-accent h-2 rounded-full transition-all"
                        style={{ width: `${Math.min((aiUsageToday / 20) * 100, 100)}%` }}
                      />
                    </div>
                    <div className="p-3 rounded-xl bg-accent/10 border border-accent/20">
                      <p className="text-sm font-medium text-foreground mb-1">Upgrade to Arcana Notes Pro</p>
                      <p className="text-xs text-muted-foreground mb-3">
                        $5/month — Unlimited AI powered by <a href="https://askarc.chat" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">ArcAi™</a>.
                      </p>
                      <Button
                        onClick={async () => {
                          setIsCheckingOut(true);
                          try {
                            await createCheckout();
                          } catch (err) {
                            toast.error('Could not open checkout. Please try again.');
                            console.error('Checkout error:', err);
                          } finally {
                            setIsCheckingOut(false);
                          }
                        }}
                        disabled={isCheckingOut}
                        size="sm"
                        className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                      >
                        {isCheckingOut ? (
                          <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        ) : (
                          <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                        )}
                        {isCheckingOut ? 'Opening checkout…' : 'Upgrade — $5/mo'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="bg-card rounded-lg p-4 border">
              <h2 className="text-lg font-medium mb-3 font-serif">Account</h2>
              {user ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{user.email}</p>
                      <p className="text-xs text-muted-foreground">Signed in</p>
                    </div>
                  </div>

                  <div className="space-y-3 border-t pt-3">
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor="new-password" className="text-sm font-medium">
                        Change Password
                      </Label>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        id="new-password"
                        type="password"
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        onClick={handleChangePassword}
                        size="sm"
                        disabled={isChangingPassword || !newPassword.trim()}
                      >
                        {isChangingPassword ? "Updating..." : "Update"}
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">Password must be at least 6 characters long</p>
                      <button
                        type="button"
                        onClick={() => navigate('/forgot-password')}
                        className="text-xs text-primary hover:text-primary/80 transition-colors underline underline-offset-2"
                      >
                        Forgot password?
                      </button>
                    </div>
                  </div>


                  <Button onClick={handleSignOut} variant="outline" size="sm" className="w-full">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">Sign in to sync your notes across all devices</p>
                  <Button onClick={handleSignIn} size="sm" className="w-full">
                    Sign In
                  </Button>
                </div>
              )}
            </div>

            <div className="bg-card rounded-lg p-4 border">
              <h2 className="text-lg font-medium mb-3 font-serif flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                FAQ
              </h2>
              <Accordion type="single" collapsible className="w-full">
                {faqItems.map((item, index) => (
                  <AccordionItem key={index} value={`item-${index}`} className="border-b last:border-b-0">
                    <AccordionTrigger className="text-sm font-medium text-left py-3 hover:no-underline">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground pb-3">{item.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            <div className="bg-card rounded-lg p-4 border">
              <h2 className="text-lg font-medium mb-3 font-serif">About Arcana Notes</h2>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Arcana Notes - "Write What You Love" is a minimalist notes app focused on creative expression and
                  passionate writing.
                </p>
                <p className="text-xs text-muted-foreground">Version 2.0.5</p>
              </div>
            </div>

            <div className="bg-card rounded-lg p-4 border">
              <h2 className="text-lg font-medium mb-3 font-serif flex items-center gap-2">
                <Heart className="h-5 w-5 text-pink-500" fill="#e91e63" />
                Support Arcana Notes
              </h2>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Enjoying Arcana Notes? Consider supporting development to help keep the app running and add new features.
                </p>
                <a
                  href="https://buymeacoffee.com/froydinger"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm btn-accessible py-2 px-3 rounded-md border border-border hover:bg-accent transition-colors"
                >
                  <Heart className="h-4 w-4 text-pink-500" fill="#e91e63" />
                  <span>Buy me a coffee</span>
                </a>
              </div>
            </div>

            {user && (
              <div className="bg-card rounded-lg p-4 border">
                <h2 className="text-lg font-medium mb-3 font-serif">Data Management</h2>
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button onClick={handleExportNotes} variant="outline" size="sm" className="flex-1">
                      <Download className="mr-2 h-4 w-4" />
                      Export Notes
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="flex-1" disabled={isDeleting}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          {isDeleting ? "Deleting..." : "Delete Account"}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Account</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your account and remove all your
                            notes from our servers.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeleteAccount}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Yes, delete my account
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    <p>
                      <strong>Export Notes:</strong> Download all your notes as a single text file.
                    </p>
                    <p>
                      <strong>Delete Account:</strong> Permanently remove your account and all associated data.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Support Dialog */}
        <AlertDialog open={showSupportDialog} onOpenChange={setShowSupportDialog}>
          <AlertDialogContent className="max-w-sm">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 justify-center">
                <Heart className="h-5 w-5 text-accent" fill="currentColor" />
                Support Arcana Notes!
              </AlertDialogTitle>
              <AlertDialogDescription className="text-center">
                Arcana Notes is made with love by Win The Night. If you enjoy using Arcana Notes, consider supporting our work!
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-col gap-2">
              <AlertDialogAction
                onClick={() => window.open("https://winthenight.org/support", "_blank")}
                className="w-full bg-accent hover:bg-accent/90"
              >
                Support Us
              </AlertDialogAction>
              <AlertDialogCancel className="w-full">Maybe Later</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default SettingsPage;
