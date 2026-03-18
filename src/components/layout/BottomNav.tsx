import { useLocation, useNavigate } from 'react-router-dom';
import { NotebookTabs, Plus, Lightbulb, Settings, FileText, CheckSquare } from 'lucide-react';
import { useNotes } from '@/contexts/NoteContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
        <div className="relative flex items-center justify-start px-6 gap-4 overflow-visible" style={{ paddingTop: '0.875rem', paddingBottom: '1.25rem' }}>
        {/* Plus button - slightly larger */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center justify-center w-14 h-14 flex-shrink-0 rounded-full bg-background/60 backdrop-blur-md border border-border/30 hover:bg-secondary/80 hover:border-border/50 transition-all duration-200 shadow-sm glass-shimmer">
              <Plus className="h-6 w-6 text-accent" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="center" 
            side="top"
            sideOffset={12}
            className="w-[200px] glass-card border-border/30 rounded-2xl shadow-elevated-lg"
          >
            <DropdownMenuItem 
              onClick={() => handleCreateNote('note')} 
              className="flex items-center gap-3 py-3 px-4 cursor-pointer rounded-xl hover:bg-accent/20 hover:text-foreground focus:bg-accent/20 focus:text-foreground"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent/10">
                <FileText className="h-4 w-4 text-accent" />
              </div>
              <div className="flex flex-col">
                <span className="font-medium">Note</span>
                <span className="text-xs text-muted-foreground">Free-form writing</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleCreateNote('checklist')} 
              className="flex items-center gap-3 py-3 px-4 cursor-pointer rounded-xl hover:bg-accent/20 hover:text-foreground focus:bg-accent/20 focus:text-foreground"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent/10">
                <CheckSquare className="h-4 w-4 text-accent" />
              </div>
              <div className="flex flex-col">
                <span className="font-medium">Checklist</span>
                <span className="text-xs text-muted-foreground">Task list with checkboxes</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

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
        {/* Plus button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center justify-center w-12 h-12 flex-shrink-0 rounded-full bg-background/60 backdrop-blur-md border border-border/30 hover:bg-secondary/80 hover:border-border/50 transition-all duration-200 shadow-sm glass-shimmer">
              <Plus className="h-6 w-6 text-accent" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            side="right"
            sideOffset={12}
            className="w-[200px] glass-card border-border/30 rounded-2xl shadow-elevated-lg"
          >
            <DropdownMenuItem
              onClick={() => handleCreateNote('note')}
              className="flex items-center gap-3 py-3 px-4 cursor-pointer rounded-xl hover:bg-accent/20 hover:text-foreground focus:bg-accent/20 focus:text-foreground"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent/10">
                <FileText className="h-4 w-4 text-accent" />
              </div>
              <div className="flex flex-col">
                <span className="font-medium">Note</span>
                <span className="text-xs text-muted-foreground">Free-form writing</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleCreateNote('checklist')}
              className="flex items-center gap-3 py-3 px-4 cursor-pointer rounded-xl hover:bg-accent/20 hover:text-foreground focus:bg-accent/20 focus:text-foreground"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent/10">
                <CheckSquare className="h-4 w-4 text-accent" />
              </div>
              <div className="flex flex-col">
                <span className="font-medium">Checklist</span>
                <span className="text-xs text-muted-foreground">Task list with checkboxes</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

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
