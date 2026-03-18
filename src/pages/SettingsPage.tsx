import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useSidebar } from "@/components/ui/sidebar";
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
import arcanaLogo from '@/assets/arcana-logo.png';
import {
  LogOut,
  User,
  Download,
  Trash2,
  Key,
  Loader2,
  Brain,
  Sparkles,
  Crown,
  ChevronRight,
  ExternalLink,
  Settings,
  CreditCard,
  Shield,
  MessageCircle,
  HelpCircle,
  Monitor,
} from "lucide-react";
import { useTitleFont } from "@/hooks/useTitleFont";
import { supabase } from "@/integrations/supabase/client";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

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
  const { preferences, updateTheme, updateTitleFont, updateBodyFont, updateAiEnabled } = usePreferences();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isSubscribed, status, aiUsageToday, aiLimit, loading: subLoading, createCheckout, openPortal, checkSubscription } = useSubscription();

  useEffect(() => {
    if (searchParams.get('session_id')) {
      checkSubscription();
    }
  }, [searchParams]);

  const getThemeLabel = (theme: string) => {
    switch (theme) {
      case "light": return "Light";
      case "dark": return "Dark";
      case "navy": return "Night";
      case "system": return "System default";
      default: return "Dark";
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
    { question: "How do I create a new note?", answer: "Click the '+' button or use the 'New Note' option to create a new note. Start typing immediately." },
    { question: "Are my notes saved automatically?", answer: "Yes, all notes are automatically saved as you type. No need to manually save." },
    { question: "Can I access my notes offline?", answer: "Yes, Arcana Notes works offline. Your notes are stored locally and will sync when you're back online." },
    { question: "How do I format text in my notes?", answer: "Select text to see your device's formatting options like bold, italic, and more." },
    { question: "Is my data secure and private?", answer: "Yes, your notes are encrypted with your unique key and stored securely. Only you can access your notes." },
  ];

  const handleExportNotes = () => {
    if (!notes.length) { toast.error("No notes to export"); return; }
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
    if (!newPassword.trim()) { toast.error("Password required"); return; }
    if (newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
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

  const aiUsagePercent = Math.min((aiUsageToday / 10) * 100, 100);

  return (
    <div className="h-full md:pl-20">
      {/* Header */}
      <header className="sticky top-0 z-50 px-4 pt-4 pb-2 md:px-8 md:pt-8 pwa-safe-top pointer-events-none [&_button]:pointer-events-auto [&_a]:pointer-events-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-background/60 backdrop-blur-md border border-border/30 flex items-center justify-center shadow-sm glass-shimmer">
              <Settings className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h1 className="font-display text-xl text-foreground tracking-tight">Settings</h1>
              {user && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{user.email}</p>}
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 md:px-8 pb-32 pt-4 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

          {/* ─── Preferences ─── */}
          <section className="rounded-2xl bg-card/60 backdrop-blur-sm border border-border/50 overflow-hidden">
            <div className="px-5 py-4 border-b border-border/30">
              <h2 className="font-display text-base text-foreground tracking-tight">Preferences</h2>
            </div>
            <div className="divide-y divide-border/30">
              {/* Theme */}
              <div className="px-5 py-4 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">Theme</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{getThemeLabel(preferences.theme)}</p>
                </div>
                <ThemeToggle variant="settings" />
              </div>
              {/* System Theme */}
              <div className="px-5 py-3 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                    <Monitor className="h-3.5 w-3.5 text-muted-foreground" />
                    System default
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">Follow your device's light/dark setting</p>
                </div>
                <Switch
                  checked={preferences.theme === 'system'}
                  onCheckedChange={async (checked) => {
                    if (checked) {
                      await updateTheme('system');
                    } else {
                      await updateTheme('dark');
                    }
                  }}
                />
              </div>
              {/* AI Features */}
              <div className="px-5 py-4 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">Arc AI Assistant</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {preferences.aiEnabled ? (
                      <span className="text-accent">Enabled</span>
                    ) : (
                      "Disabled"
                    )}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleAiEnabledToggle}
                  className={`h-9 w-9 rounded-xl ${preferences.aiEnabled ? 'bg-accent/15 text-accent' : 'text-muted-foreground'}`}
                  title={`${preferences.aiEnabled ? "Disable" : "Enable"} AI features`}
                >
                  <Brain className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </section>

          {/* ─── Subscription ─── */}
          {user && (
            <section className="rounded-2xl bg-card/60 backdrop-blur-sm border border-accent/20 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-accent to-accent/30" />
              <div className="px-5 py-4 border-b border-border/30 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent" />
                <h2 className="font-display text-base text-foreground tracking-tight">Arcana Notes Pro</h2>
              </div>
              <div className="px-5 py-5">
                {isSubscribed ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-xl bg-accent/15 flex items-center justify-center">
                        <Crown className="h-4 w-4 text-accent" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-accent">Pro — Unlimited AI</p>
                        <p className="text-xs text-muted-foreground">{aiUsageToday} requests today</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={openPortal} className="w-full rounded-xl">
                      <CreditCard className="mr-2 h-4 w-4" />
                      Manage Subscription
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-foreground font-medium">AI Usage Today</p>
                      <p className="text-sm font-semibold text-foreground">{aiUsageToday}<span className="text-muted-foreground font-normal">/10</span></p>
                    </div>
                    <div className="w-full bg-muted/50 rounded-full h-1.5">
                      <div
                        className="bg-accent h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${aiUsagePercent}%` }}
                      />
                    </div>
                    <div className="p-4 rounded-xl bg-accent/5 border border-accent/15 space-y-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">Upgrade to Pro</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          $5/month — Unlimited AI powered by{" "}
                          <a href="https://askarc.chat" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">ArcAi™</a>
                        </p>
                      </div>
                      <Button
                        onClick={async () => {
                          setIsCheckingOut(true);
                          try { await createCheckout(); }
                          catch (err) { toast.error('Could not open checkout.'); console.error(err); }
                          finally { setIsCheckingOut(false); }
                        }}
                        disabled={isCheckingOut}
                        size="sm"
                        className="w-full rounded-xl bg-accent/15 border-2 border-accent text-accent hover:bg-accent/25 transition-all"
                      >
                        {isCheckingOut ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                        {isCheckingOut ? 'Opening checkout…' : 'Upgrade — $5/mo'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ─── Account ─── */}
          <section className="rounded-2xl bg-card/60 backdrop-blur-sm border border-border/50 overflow-hidden">
            <div className="px-5 py-4 border-b border-border/30 flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-display text-base text-foreground tracking-tight">Account</h2>
            </div>
            <div className="px-5 py-5">
              {user ? (
                <div className="space-y-5">
                  {/* Email */}
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-secondary flex items-center justify-center">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate text-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground">Signed in</p>
                    </div>
                  </div>

                  {/* Set / Change Password */}
                  <div className="space-y-3 pt-2 border-t border-border/30">
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium text-foreground">Set / Change Password</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {user?.app_metadata?.provider === 'google'
                        ? 'Add a password to also sign in with email. Once set, you can use either method.'
                        : 'Update your account password. Min. 6 characters.'}
                    </p>
                    <div className="flex gap-2">
                      <Input
                        type="password"
                        placeholder="New password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="flex-1 rounded-xl bg-secondary/50 border-border/50"
                      />
                      <Button
                        onClick={handleChangePassword}
                        size="sm"
                        disabled={isChangingPassword || !newPassword.trim()}
                        className="rounded-xl"
                      >
                        {isChangingPassword ? "..." : "Update"}
                      </Button>
                    </div>
                  </div>

                  {/* Sign Out */}
                  <Button onClick={handleSignOut} variant="outline" size="sm" className="w-full rounded-xl">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 text-center py-4">
                  <p className="text-sm text-muted-foreground">Sign in to sync your notes across all devices</p>
                  <Button onClick={handleSignIn} size="sm" className="rounded-xl">
                    Sign In
                  </Button>
                </div>
              )}
            </div>
          </section>

          {/* ─── Data Management ─── */}
          {user && (
            <section className="rounded-2xl bg-card/60 backdrop-blur-sm border border-border/50 overflow-hidden">
              <div className="px-5 py-4 border-b border-border/30 flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <h2 className="font-display text-base text-foreground tracking-tight">Data Management</h2>
              </div>
              <div className="px-5 py-5 space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button onClick={handleExportNotes} variant="outline" size="sm" className="flex-1 rounded-xl">
                    <Download className="mr-2 h-4 w-4" />
                    Export Notes
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" className="flex-1 rounded-xl" disabled={isDeleting}>
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
                <p className="text-xs text-muted-foreground">
                  Export downloads all notes as a text file. Delete removes your account and all data permanently.
                </p>
              </div>
            </section>
          )}

          {/* ─── FAQ ─── */}
          <section className="rounded-2xl bg-card/60 backdrop-blur-sm border border-border/50 overflow-hidden">
            <div className="px-5 py-4 border-b border-border/30 flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-display text-base text-foreground tracking-tight">FAQ</h2>
            </div>
            <div className="px-5 py-2">
              <Accordion type="single" collapsible className="w-full">
                {faqItems.map((item, index) => (
                  <AccordionItem key={index} value={`item-${index}`} className="border-b border-border/20 last:border-b-0">
                    <AccordionTrigger className="text-sm font-medium text-left py-3.5 hover:no-underline text-foreground">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground pb-3.5 leading-relaxed">{item.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </section>

          {/* ─── About & Credits ─── */}
          <section className="rounded-2xl bg-card/60 backdrop-blur-sm border border-border/50 overflow-hidden">
            <div className="px-5 py-4 border-b border-border/30 flex items-center gap-2">
              <img src={arcanaLogo} alt="Arcana" className="h-4 w-4" />
              <h2 className="font-display text-base text-foreground tracking-tight">About</h2>
            </div>
            <div className="px-5 py-5 space-y-4">
              <div className="flex items-center gap-3">
                <img src={arcanaLogo} alt="Arcana" className="h-10 w-10" />
                <div>
                  <p className="font-display text-foreground tracking-tight">Arcana Notes</p>
                  <p className="text-xs text-muted-foreground">Write what you love.</p>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-border/30">
                <p className="text-xs text-muted-foreground">
                  By{" "}
                  <a href="https://winthenight.org" target="_blank" rel="noopener noreferrer" className="text-foreground hover:text-accent transition-colors font-medium">
                    Win The Night™ Productions
                  </a>
                </p>
                <p className="text-xs text-muted-foreground">
                  Powered by{" "}
                  <a href="https://askarc.chat" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline font-medium">
                    ArcAi™
                  </a>
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/30">
                <p className="text-xs text-muted-foreground">Version 2.0.5</p>
                <div className="flex gap-3">
                  <a href="/terms" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Terms</a>
                  <a href="/privacy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Privacy</a>
                </div>
              </div>

              <a
                href="mailto:contact@winthenight.org"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-secondary/50 border border-border/30 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
              >
                <MessageCircle className="h-4 w-4" />
                Contact Support
              </a>
            </div>
          </section>

          {/* ─── Support ─── */}
          <section className="rounded-2xl bg-card/60 backdrop-blur-sm border border-border/50 overflow-hidden">
            <div className="px-5 py-5 text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                Enjoying Arcana Notes? Support our work ❤️
              </p>
              <a
                href="https://buymeacoffee.com/froydinger"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent/10 border border-accent/20 text-sm text-accent hover:bg-accent/20 transition-all"
              >
                Buy me a coffee
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
