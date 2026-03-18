import { SidebarProvider } from "@/components/ui/sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { NoteProvider } from "@/contexts/NoteContext";
import { OfflineIndicator } from "@/components/notifications/OfflineIndicator";
import { useIsMobile } from "@/hooks/use-mobile";

type AppLayoutProps = {
  children: React.ReactNode;
};

export function AppLayout({ children }: AppLayoutProps) {
  const isMobile = useIsMobile();

  return (
    <NoteProvider>
      <SidebarProvider>
        <div className="flex min-h-[100dvh] w-full">
          <main className="flex-1 min-w-0" style={isMobile ? { paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' } : undefined}>
            {children}
          </main>
          <BottomNav />
        </div>
        <OfflineIndicator />
      </SidebarProvider>
    </NoteProvider>
  );
}
