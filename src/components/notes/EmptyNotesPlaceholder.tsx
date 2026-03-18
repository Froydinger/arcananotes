
import { Plus, Heart } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { useNotes } from '@/contexts/NoteContext';
import { useNavigate } from 'react-router-dom';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';

export default function EmptyNotesPlaceholder() {
  const { addNote, setCurrentNote } = useNotes();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { state } = useSidebar();
  
  const handleCreateFirstNote = async () => {
    try {
      const newNote = await addNote();
      setCurrentNote(newNote);
      navigate(`/note/${newNote.id}`);
    } catch (error) {
      console.error('Failed to create note:', error);
    }
  };
  
  return (
    <div className="h-full pwa-safe-top">
      <div className="relative">
        {(isMobile || state === "collapsed") && (
          <div className="absolute top-4 left-4 z-10">
            <SidebarTrigger />
          </div>
        )}
        <EmptyState
          icon={Heart}
          title={
            <div className="flex items-center justify-center">
              Welcome to Arcana Notes<span className="text-xs text-muted-foreground ml-0.5 -mt-1">™</span>
            </div>
          }
          description="Take a sec to jot down your thoughts."
          action={{
            label: "Create Your First Note",
            onClick: handleCreateFirstNote
          }}
          className="min-h-[60vh] animate-fade-in"
        />
      </div>
    </div>
  );
}
