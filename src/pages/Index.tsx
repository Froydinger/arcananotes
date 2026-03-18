import { useState, useMemo, useEffect } from "react";
import { usePreferences } from "@/contexts/PreferencesContext";
import { ArcPanel } from "@/components/notes/ArcPanel";
import { useAuth } from "@/contexts/AuthContext";
import { useNotes } from "@/contexts/NoteContext";
import { Note } from "@/contexts/NoteContext";
import { supabase } from "@/integrations/supabase/client";
import NoteCard from "@/components/notes/NoteCard";
import EmptyNotesPlaceholder from "@/components/notes/EmptyNotesPlaceholder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, ArrowUpDown, Filter, X, Heart, FileText, CheckSquare, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNotifications } from "@/hooks/useNotifications";
import PullToRefresh from "react-simple-pull-to-refresh";
import { ShareManager } from "@/components/notes/ShareManager";
import { toast } from "@/components/ui/sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NoteType } from "@/types/sharing";

const Index = () => {
  const { user } = useAuth();
  const { preferences } = usePreferences();
  const {
    notes,
    addNote,
    updateNote,
    setCurrentNote,
    loading,
    syncNotes,
    hasInitialLoad,
    deleteNote,
    togglePinNote,
    duplicateNote,
  } = useNotes();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { state, toggleSidebar } = useSidebar();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("latest");
  const [shareFilter, setShareFilter] = useState("all");
  const [shareManagerNote, setShareManagerNote] = useState<Note | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [shareChanged, setShareChanged] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [openSelect, setOpenSelect] = useState<string | null>(null);
  const [showSupportDialog, setShowSupportDialog] = useState(false);

  const filteredAndSortedNotes = useMemo(() => {
    const filtered = notes.filter((note) => {
      const matchesSearch =
        note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (note.content && note.content.toLowerCase().includes(searchTerm.toLowerCase()));
      if (!matchesSearch) return false;
      switch (shareFilter) {
        case "shared-with-me":
          return note.isSharedWithUser === true;
        case "shared-with-others":
          return note.isOwnedByUser === true && (note.shares?.length ?? 0) > 0;
        case "all":
        default:
          return true;
      }
    });

    let sorted: Note[] = [];
    switch (sortOrder) {
      case "alphabetical":
        sorted = filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "oldest":
        sorted = filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case "latest":
      default:
        sorted = filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        break;
    }

    if (shareFilter === "shared-with-me" || shareFilter === "shared-with-others") {
      return sorted;
    }

    const pinned = sorted.filter((n) => n.pinned);
    const unpinned = sorted.filter((n) => !n.pinned);
    return [...pinned, ...unpinned];
  }, [notes, searchTerm, sortOrder, shareFilter]);

  const handleCreateNote = async (noteType: NoteType = "note") => {
    try {
      const newNote = await addNote(noteType);
      setCurrentNote(newNote);
      if (isMobile && state === "expanded") {
        toggleSidebar();
        await new Promise((resolve) => setTimeout(resolve, 350));
      }
      navigate(`/note/${newNote.id}`);
    } catch (error) {
      console.error("Failed to create note:", error);
    }
  };

  const handleRefresh = async () => {
    await syncNotes();
  };

  const handleShareClick = (note: Note) => {
    setShareChanged(false);
    setShareManagerNote(note);
  };

  const handleShareClose = () => {
    setShareManagerNote(null);
    if (shareChanged) {
      syncNotes();
    }
    setShareChanged(false);
  };

  const handleShareUpdated = () => {
    setShareChanged(true);
  };

  const handleCardPress = (note: Note) => {
    setSelectedNoteId(note.id);
  };

  const handleDeleteNote = async (note: Note, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await deleteNote(note.id);
      setSelectedNoteId(null);
      toast.success("Note deleted");
    } catch (error) {
      console.error("Failed to delete note:", error);
      toast.error("Failed to delete note");
    }
  };

  const handleDuplicateNote = async (note: Note) => {
    try {
      const newNote = await duplicateNote(note.id);
      if (newNote) {
        toast.success("Note duplicated");
      }
    } catch (error) {
      console.error("Failed to duplicate note:", error);
      toast.error("Failed to duplicate note");
    }
  };

  console.log("Index render state:", { loading, notesLength: notes.length, hasUser: !!user, hasInitialLoad });

  if (!user) {
    return null;
  }

  if (hasInitialLoad && !loading && notes.length === 0) {
    console.log("Showing EmptyNotesPlaceholder - hasInitialLoad:", hasInitialLoad);
    return <EmptyNotesPlaceholder />;
  }

  // Header component - stays outside PullToRefresh for sticky to work on mobile
  const header = (
    <header className="sticky top-0 z-[100] px-4 pt-4 md:px-8 md:pt-8 pb-4 pwa-safe-top">
      {/* Mobile layout - matches desktop */}
      <div className="md:hidden">
        <div className="flex items-center justify-between">
          {/* Left: Search button */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="h-11 w-11 rounded-full bg-background/60 backdrop-blur-md border border-border/30 hover:bg-secondary/80 transition-all duration-250 shadow-sm glass-shimmer"
              onClick={() => {
                setOpenSelect(null);
                if (showSearch) {
                  setShowSearch(false);
                  setSearchTerm("");
                } else {
                  setShowSearch(true);
                  setTimeout(() => {
                    const input = document.getElementById("search-input") as HTMLInputElement;
                    input?.focus();
                    input?.click();
                  }, 150);
                }
              }}
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>

          {/* Right: Sync and Support */}
          <div className="flex items-center gap-2">
            {/* Sync button */}
            <button
              onClick={handleRefresh}
              className="h-11 w-11 rounded-full bg-background/60 backdrop-blur-md border border-border/30 hover:bg-secondary/80 transition-all duration-200 shadow-sm glass-shimmer flex items-center justify-center"
              title="Sync notes"
            >
              <RefreshCw className="h-5 w-5" />
            </button>

            {/* Support heart icon */}
            <button
              onClick={() => setShowSupportDialog(true)}
              className="h-11 w-11 rounded-full bg-background/60 backdrop-blur-md border border-border/30 hover:bg-secondary/80 transition-all duration-200 shadow-sm glass-shimmer flex items-center justify-center"
            >
              <Heart className="h-5 w-5 text-accent" fill="currentColor" />
            </button>
          </div>
        </div>
      </div>

      {/* Desktop layout */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="h-11 w-11 rounded-full bg-background/60 backdrop-blur-md border border-border/30 hover:bg-secondary/80 transition-all duration-250 shadow-sm glass-shimmer"
              onClick={() => {
                setOpenSelect(null);
                if (showSearch) {
                  setShowSearch(false);
                  setSearchTerm("");
                } else {
                  setShowSearch(true);
                  setTimeout(() => {
                    const input = document.getElementById("search-input") as HTMLInputElement;
                    input?.focus();
                    input?.click();
                  }, 150);
                }
              }}
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {/* Notifications */}
            {user && unreadCount > 0 && (
              <div className="relative">
                <button className="h-11 w-11 rounded-full bg-background/60 backdrop-blur-md border border-border/30 hover:bg-secondary/80 transition-all duration-200 shadow-sm glass-shimmer flex items-center justify-center">
                  <span className="text-sm font-medium">{unreadCount > 99 ? "99+" : unreadCount}</span>
                </button>
              </div>
            )}

            {/* Sync button */}
            <button
              onClick={handleRefresh}
              className="h-11 w-11 rounded-full bg-background/60 backdrop-blur-md border border-border/30 hover:bg-secondary/80 transition-all duration-200 shadow-sm glass-shimmer flex items-center justify-center"
              title="Sync notes"
            >
              <RefreshCw className="h-5 w-5" />
            </button>

            {/* Support */}
            <button
              onClick={() => setShowSupportDialog(true)}
              className="h-11 w-11 rounded-full bg-background/60 backdrop-blur-md border border-border/30 hover:bg-secondary/80 transition-all duration-200 shadow-sm glass-shimmer flex items-center justify-center"
            >
              <Heart className="h-5 w-5 text-accent" fill="currentColor" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );

  // Scrollable content - wrapped in PullToRefresh on mobile
  const scrollableContent = (
    <div
      className="px-4 pb-4 md:px-8 animate-fade-in"
      style={{ animationDelay: "0.05s", animationFillMode: "both" }}
      onClick={() => setSelectedNoteId(null)}
    >
      {showSearch && (
        <div data-search-container className="relative mb-6 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                id="search-input"
                placeholder="Search notes by title or content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-11 pr-10 h-12 rounded-xl bg-card/80 backdrop-blur-sm border-border/50 focus:border-accent/50 focus:ring-accent/20 transition-all duration-250"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 rounded-lg hover:bg-secondary"
                  onClick={() => {
                    setSearchTerm("");
                    setShowSearch(false);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
            </div>

            {/* Sort dropdown */}
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="h-12 w-12 rounded-xl bg-card/80 backdrop-blur-sm border-border/50 [&>svg[data-radix-select-icon]]:hidden [&_span]:hidden">
                <ArrowUpDown className="h-4 w-4" />
              </SelectTrigger>
              <SelectContent className="z-50 bg-card/95 backdrop-blur-xl border-border/50 rounded-xl">
                <SelectItem value="latest">Latest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="alphabetical">A-Z</SelectItem>
              </SelectContent>
            </Select>

            {/* Filter dropdown */}
            <Select value={shareFilter} onValueChange={setShareFilter}>
              <SelectTrigger className="h-12 w-12 rounded-xl bg-card/80 backdrop-blur-sm border-border/50 [&>svg[data-radix-select-icon]]:hidden [&_span]:hidden">
                <Filter className="h-4 w-4" />
              </SelectTrigger>
              <SelectContent className="z-50 bg-card/95 backdrop-blur-xl border-border/50 rounded-xl">
                <SelectItem value="all">All Notes</SelectItem>
                <SelectItem value="shared-with-me">Shared with Me</SelectItem>
                <SelectItem value="shared-with-others">My Shared Notes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {searchTerm && (
        <div className="text-sm text-muted-foreground mb-6 flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium">
            {filteredAndSortedNotes.length}
          </span>
          <span>of {notes.length} notes</span>
        </div>
      )}

      {/* Masonry grid layout */}
      <div className="flex flex-col gap-4 pb-24 pt-1">
        {filteredAndSortedNotes.map((note, index) => (
          <div
            key={note.id}
            className="animate-float-in"
            style={{ animationDelay: `${index * 0.03}s`, animationFillMode: "both" }}
          >
            <NoteCard
              note={note}
              onShareClick={handleShareClick}
              isSelected={selectedNoteId === note.id}
              onPress={handleCardPress}
              onOpen={(n) => navigate(`/note/${n.id}`)}
              isPinned={note.pinned}
              onTogglePin={(n) => togglePinNote(n.id)}
              onDelete={handleDeleteNote}
              onDuplicate={handleDuplicateNote}
            />
          </div>
        ))}
      </div>

      {shareManagerNote && (
        <ShareManager
          isOpen={!!shareManagerNote}
          onClose={handleShareClose}
          note={shareManagerNote}
          onShareUpdate={handleShareUpdated}
        />
      )}

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
  );

  return (
    <div className="min-h-full md:pl-20">
      {header}
      {isMobile ? (
        <PullToRefresh onRefresh={handleRefresh} pullingContent="">
          {scrollableContent}
        </PullToRefresh>
      ) : (
        scrollableContent
      )}
      {/* Arc AI Panel - available on index for general writing help */}
      {preferences.aiEnabled && <ArcPanel
        onCreateNote={async (content, title) => {
          const note = await addNote("note");
          if (note) {
            await updateNote(note.id, { content, title });
            navigate(`/note/${note.id}`);
          }
        }}
        onCreateChecklist={async (title, items) => {
          const note = await addNote("checklist");
          if (note) {
            await updateNote(note.id, { title });
            // Insert checklist items
            const rows = items.map((item, i) => ({
              note_id: note.id,
              content: item.content,
              completed: item.completed,
              position: i,
            }));
            if (rows.length > 0) {
              await supabase.from('checklist_items').insert(rows);
            }
            navigate(`/note/${note.id}`);
          }
        }}
      />}
    </div>
  );
};

export default Index;
