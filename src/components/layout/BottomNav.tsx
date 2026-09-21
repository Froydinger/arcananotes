import { useLocation, useNavigate } from 'react-router-dom';
import { NotebookTabs, Lightbulb, Settings } from 'lucide-react';
import { useNotes } from '@/contexts/NoteContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { CreateNoteMenu } from '@/components/notes/CreateNoteMenu';
import { NoteType } from "@/types/sharing";

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { addNote, setCurrentNote } = useNotes();
  const isMobile = useIsMobile();
  const { state, toggleSidebar } = useSidebar();
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  // Detect keyboard open/close on mobile
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const handleResize = () => {
      // When keyboard opens, visual viewport height is smaller than window height
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const windowHeight = window.innerHeight;

      // If viewport is significantly smaller (more than 150px), keyboard is likely open
      setIsKeyboardOpen(windowHeight - viewportHeight > 150);
    };

    window.visualViewport.addEventListener('resize', handleResize);

    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
    };
  }, []);

  const isActive = (path: string) => {
    if (path === '/home') {
      return location.pathname === '/home' || location.pathname.startsWith('/note/');
    }
    return location.pathname === path;
  };

  const handleCreateNote = async (noteType: NoteType = 'note') => {
    try {
      const newNote = await addNote(noteType);
      setCurrentNote(newNote);
      if (isMobile && state === "expanded") {
        toggleSidebar();
        await new Promise(resolve => setTimeout(resolve, 350));
      }
      navigate(`/note/${newNote.id}`);
    } catch (error) {
      console.error('Failed to create note:', error);
    }
  };

  // Dynamic nav items based on AI button visibility
  const leftNavItems = [
    { path: '/home', icon: NotebookTabs, label: 'Notes' },
  ];

  const rightNavItems = [
    { path: '/prompts', icon: Lightbulb, label: 'Ideas' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  const isNotePage = location.pathname.startsWith('/note/');

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav className={cn(
        "fixed bottom-0 left-0 right-0 z-50 md:hidden transition-transform duration-300 overflow-visible",
        (isKeyboardOpen || isNotePage) && "translate-y-full"
      )}>
        {/* Navigation Items - Left aligned */}
        <div className="relative flex items-center justify-around px-4 gap-4 overflow-visible" style={{ paddingTop: '0.875rem', paddingBottom: '1.25rem' }}>
        {/* Navigation items */}

        {/* Other nav items */}
        {[...leftNavItems, ...rightNavItems].map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={cn(
              "flex items-center justify-center w-12 h-12 flex-shrink-0 rounded-full bg-background/60 backdrop-blur-md border border-border/30 hover:bg-secondary/80 hover:border-border/50 transition-all duration-200 shadow-sm glass-shimmer",
              isActive(item.path) && "border-accent/50 bg-accent/10"
            )}
            title={item.label}
          >
            <item.icon className={cn(
              "h-5 w-5 transition-transform duration-200",
              isActive(item.path) ? "text-accent scale-110" : "text-foreground"
            )} />
          </button>
        ))}
        </div>
      </nav>

      {/* Desktop Left Sidebar */}
      <nav className="hidden md:flex fixed left-0 top-0 bottom-0 z-50 flex-col items-center gap-4 py-6 px-3 bg-background/60 backdrop-blur-md border-r border-border/30 pwa-sidebar-safe">
        <CreateNoteMenu direction="right" onCreate={handleCreateNote} className="ml-1" />

        <div className="w-full h-px bg-border/30 my-2" />

        {/* Navigation icons */}
        {[...leftNavItems, ...rightNavItems].map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={cn(
              "flex items-center justify-center w-12 h-12 flex-shrink-0 rounded-full bg-background/60 backdrop-blur-md border border-border/30 hover:bg-secondary/80 hover:border-border/50 transition-all duration-200 shadow-sm glass-shimmer",
              isActive(item.path) && "border-accent/50 bg-accent/10"
            )}
            title={item.label}
          >
            <item.icon className={cn(
              "h-5 w-5 transition-transform duration-200",
              isActive(item.path) ? "text-accent scale-110" : "text-foreground"
            )} />
          </button>
        ))}
      </nav>
    </>
  );
}
