import { useEffect, useState, useRef, useCallback } from "react";
import { usePreferences } from "@/contexts/PreferencesContext";
import { useParams, useNavigate } from "react-router-dom";
import { useNotes } from "@/contexts/NoteContext";
import { supabase } from "@/integrations/supabase/client";
import NoteEditor from "@/components/notes/NoteEditor";
import ChecklistEditor from "@/components/notes/ChecklistEditor";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Trash, Users, Eye, Edit, Undo2, Redo2 } from "lucide-react";
import { ArcPanel } from "@/components/notes/ArcPanel";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
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
import { FeaturedImageUpload } from "@/components/notes/FeaturedImageUpload";
import { ExportMenu } from "@/components/notes/ExportMenu";
import { ShareManager } from "@/components/notes/ShareManager";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import { handleNoteKeyboard } from "@/lib/viewport";
import { useUndoRedo } from "@/hooks/useUndoRedo";


const NotePage = () => {
  const { id } = useParams<{ id: string }>();
  const { getNote, setCurrentNote, deleteNote, loading, updateNote, addNote } = useNotes();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { preferences } = usePreferences();
  const { unreadCount } = useNotifications();
  const [showShareManager, setShowShareManager] = useState(false);
  const [entered, setEntered] = useState(false);
  
  const [aiReplacementFunction, setAiReplacementFunction] = useState<
    ((newContent: string, isSelectionReplacement: boolean) => void) | null
  >(null);
  const headerRef = useRef<HTMLElement>(null);

  const note = getNote(id || "");

  // Simple undo/redo based on auto-save snapshots
  const { pushSnapshot, undo, redo, canUndo, canRedo, clearHistory } = useUndoRedo(
    note?.title || "",
    note?.content || ""
  );

  // Called by NoteEditor whenever a save happens
  const handleNoteSaved = useCallback((title: string, content: string) => {
    pushSnapshot(title, content);
  }, [pushSnapshot]);

  const handleUndo = useCallback(() => {
    const state = undo();
    if (state && note) {
      updateNote(note.id, { title: state.title, content: state.content }, true);
    }
  }, [undo, note, updateNote]);

  const handleRedo = useCallback(() => {
    const state = redo();
    if (state && note) {
      updateNote(note.id, { title: state.title, content: state.content }, true);
    }
  }, [redo, note, updateNote]);

  // Keyboard handling - let native browser undo/redo work naturally
  useEffect(() => {
    const cleanup = handleNoteKeyboard();
    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (note) {
      setCurrentNote(note);
    }

    return () => setCurrentNote(null);
  }, [id, note, setCurrentNote]);

  // Always start at top when opening a note + play enter transition (no autofocus)
  useEffect(() => {
    setEntered(false);
    clearHistory();
    if (document.activeElement && document.activeElement !== document.body) {
      (document.activeElement as HTMLElement).blur();
    }
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });

    const timer = setTimeout(() => setEntered(true), 50);
    return () => clearTimeout(timer);
  }, [id]);

  const handleDelete = () => {
    if (id) {
      deleteNote(id);

      if (note?.isSharedWithUser && !note?.isOwnedByUser) {
        toast({
          title: "Access removed",
          description: "You no longer have access to this shared note.",
        });
      } else {
        toast({
          title: "Note deleted",
          description: "This note has been permanently deleted.",
        });
      }
      navigate("/home");
    }
  };

  const handleCopy = () => {
    if (!note) return;

    const contentElement = document.createElement("div");
    contentElement.innerHTML = note.content;

    const textContent = contentElement.textContent || contentElement.innerText || "";
    const cleanText = textContent.replace(/\s+/g, " ").trim();
    const plainText = `${note.title}\n\n${cleanText}`;

    navigator.clipboard
      .writeText(plainText)
      .then(() => {
        toast({
          title: "Copied to clipboard",
          description: "Note content copied to clipboard.",
        });
      })
      .catch((err) => {
        toast({
          title: "Copy failed",
          description: "Could not copy to clipboard.",
          variant: "destructive",
        });
        console.error("Copy failed:", err);
      });
  };

  const handleShare = async () => {
    if (!note) return;

    const contentElement = document.createElement("div");
    contentElement.innerHTML = note.content;
    const textContent = contentElement.textContent || contentElement.innerText || "";
    const cleanText = textContent.replace(/\s+/g, " ").trim();
    const plainText = `${note.title}\n\n${cleanText}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: note.title || "Untitled Note",
          text: plainText,
        });
      } else {
        handleCopy();
        toast({
          title: "No share functionality",
          description: "Content copied to clipboard instead.",
        });
      }
    } catch (error) {
      console.error("Share failed:", error);
    }
  };

  const handleFeaturedImageSet = (imageUrl: string) => {
    if (note) {
      updateNote(note.id, { featured_image: imageUrl }, true);
    }
  };

  if (!note) {
    return <div className="p-8">Note not found</div>;
  }

  const isReadOnly = note.isSharedWithUser && note.userPermission === 'read';

  return (
    <>
    <div
      key={id}
      className={`min-h-[100dvh] md:pl-20 transition-opacity duration-200 ease-out ${entered ? "opacity-100" : "opacity-90"}`}
    >
      <header
        ref={headerRef}
        data-note-header
        className="sticky top-0 z-[100] p-4 pwa-safe-top md:bg-background/60 md:backdrop-blur-md md:border-b md:border-border/20"
        style={{ position: "sticky", top: 0, zIndex: 100 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/home")}
              className="h-10 w-10 p-0 bg-background/60 backdrop-blur-md border border-border/30 rounded-full hover:bg-secondary/80 hover:border-border/50 transition-all duration-200 shadow-sm glass-shimmer"
              title="Back to notes"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>

            {note.isSharedWithUser && (
              <Badge variant="secondary" className="flex items-center gap-1 px-2">
                <Users className="h-3 w-3" />
                {note.userPermission === "read" ? <Eye className="h-3 w-3" /> : <Edit className="h-3 w-3" />}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Undo/Redo buttons - only for editable notes */}
            {!isReadOnly && note.note_type !== "checklist" && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleUndo}
                  disabled={!canUndo}
                  className="h-10 w-10 p-0 bg-background/60 backdrop-blur-md border border-border/30 rounded-full hover:bg-secondary/80 hover:border-border/50 transition-all duration-200 shadow-sm glass-shimmer disabled:opacity-30"
                  title="Undo"
                >
                  <Undo2 className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRedo}
                  disabled={!canRedo}
                  className="h-10 w-10 p-0 bg-background/60 backdrop-blur-md border border-border/30 rounded-full hover:bg-secondary/80 hover:border-border/50 transition-all duration-200 shadow-sm glass-shimmer disabled:opacity-30"
                  title="Redo"
                >
                  <Redo2 className="h-5 w-5" />
                </Button>
              </>
            )}


            {/* Show people icon for owned notes (to share) or shared notes (to manage) */}
            {(note.isOwnedByUser || (note.isSharedWithUser && !note.isOwnedByUser)) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowShareManager(true)}
                className="h-10 w-10 p-0 bg-background/60 backdrop-blur-md border border-border/30 rounded-full hover:bg-secondary/80 hover:border-border/50 transition-all duration-200 shadow-sm glass-shimmer"
                title={note.isOwnedByUser ? "Share note" : "Manage sharing"}
              >
                <Users className="h-5 w-5" />
              </Button>
            )}

            <FeaturedImageUpload
              noteId={note.id}
              onImageSet={handleFeaturedImageSet}
              hasImage={!!note.featured_image}
            />

            <ExportMenu note={note} onShare={handleShare} />

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 w-10 p-0 bg-background/60 backdrop-blur-md border border-border/30 rounded-full text-destructive hover:bg-destructive/15 hover:border-destructive/40 transition-all duration-200 shadow-sm glass-shimmer"
                >
                  <Trash className="h-5 w-5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    {note.isSharedWithUser && !note.isOwnedByUser ? (
                      "Remove Access"
                    ) : (
                      <>
                        <Trash className="h-5 w-5 text-destructive" />
                        Permanently Delete Note
                      </>
                    )}
                  </AlertDialogTitle>
                  <AlertDialogDescription className="space-y-2">
                    {note.isSharedWithUser && !note.isOwnedByUser ? (
                      "Are you sure you want to remove your access to this shared note? You will no longer be able to view or edit it."
                    ) : (
                      <>
                        <span className="block font-medium text-destructive">⚠️ This action cannot be undone.</span>
                        <span className="block">This note will be permanently deleted. We don't have a Recently Deleted folder — once it's gone, it's gone forever.</span>
                      </>
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="btn-accessible">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                    {note.isSharedWithUser && !note.isOwnedByUser ? "Remove Access" : "Delete Forever"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </header>

      <div className="relative">
        {note.note_type === "checklist" ? (
          <ChecklistEditor note={note} />
        ) : (
          <NoteEditor
            note={note}
            onNoteSaved={handleNoteSaved}
            onAIContentReplace={(replacementFn) => setAiReplacementFunction(() => replacementFn)}
          />
        )}
      </div>

      {/* Share Manager - now accessible from persistent people icon */}
      {showShareManager && (
        <ShareManager
          isOpen={showShareManager}
          onClose={() => setShowShareManager(false)}
          note={note}
          onShareUpdate={() => {
            setShowShareManager(false);
            window.location.reload();
          }}
        />
      )}

    </div>

      {/* Arc AI Panel - outside transform context so position:fixed works correctly */}
      {preferences.aiEnabled && <ArcPanel
        noteId={note.id}
        noteContent={note.content}
        noteTitle={note.title}
        onContentReplace={(content) => updateNote(note.id, { content })}
        onTitleReplace={(title) => updateNote(note.id, { title })}
        onCreateChecklist={async (title, items) => {
          const newNote = await addNote("checklist");
          if (newNote) {
            await updateNote(newNote.id, { title });
            const rows = items.map((item, i) => ({
              note_id: newNote.id,
              content: item.content,
              completed: item.completed,
              position: i,
            }));
            if (rows.length > 0) {
              await supabase.from('checklist_items').insert(rows);
            }
            navigate(`/note/${newNote.id}`);
          }
        }}
      />}
    </>
  );
};

export default NotePage;
