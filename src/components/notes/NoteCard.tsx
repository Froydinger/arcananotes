import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';

import { Note } from '@/contexts/NoteContext';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Eye, Edit, ArrowUpRight, Pin, Trash2, CheckSquare, Circle, CheckCircle2, Clock, Copy } from 'lucide-react';
import type { NoteWithSharing, ChecklistItem } from '@/types/sharing';
import { useIsTouchDevice } from '@/hooks/use-touch-device';
import { useTitleFont } from '@/hooks/useTitleFont';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';

interface NoteCardProps {
  note: Note | NoteWithSharing;
  onShareClick?: (note: Note | NoteWithSharing) => void;
  isSelected?: boolean;
  onPress?: (note: Note | NoteWithSharing) => void;
  onOpen?: (note: Note | NoteWithSharing) => void;
  isPinned?: boolean;
  onTogglePin?: (note: Note | NoteWithSharing) => void;
  onDelete?: (note: Note | NoteWithSharing) => void;
  onDuplicate?: (note: Note | NoteWithSharing) => void;
}

export default function NoteCard({ note, onShareClick, isSelected = false, onPress, onOpen, isPinned = false, onTogglePin, onDelete, onDuplicate }: NoteCardProps) {
  const titleFont = useTitleFont();
  const { isTouchDevice, isIOS } = useIsTouchDevice();
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);

  const isChecklist = 'note_type' in note && note.note_type === 'checklist';

  // Load checklist items for checklist notes - with delay to prevent thundering herd
  useEffect(() => {
    if (!isChecklist) return;
    
    // Small staggered delay based on note id to prevent all cards querying at once
    const delay = Math.random() * 200;
    const timeoutId = setTimeout(() => {
      supabase
        .from('checklist_items')
        .select('*')
        .eq('note_id', note.id)
        .order('position', { ascending: true })
        .limit(5)
        .then(({ data }) => {
          if (data) setChecklistItems(data as ChecklistItem[]);
        });
    }, delay);
    
    return () => clearTimeout(timeoutId);
  }, [note.id, isChecklist]);

  // Check if this note is shared with the user (they don't own it)
  const isSharedWithUser = 'isSharedWithUser' in note && note.isSharedWithUser && !note.isOwnedByUser;

  // Check if this note is shared by the user (they own it and have shared it with others)
  const isSharedByUser = 'shares' in note && note.shares && note.shares.length > 0;

  const contentPreview = note.content
    ? note.content
        .replace(/<\/p>/gi, ' ')
        .replace(/<\/div>/gi, ' ')
        .replace(/<br\s*\/>?/gi, ' ')
        .replace(/<[^>]*>/g, '')
        .replace(/&lt;[^&]*&gt;/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\n+/g, ' ')
        .replace(/\r+/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim()
    : 'No content';

  // Variable content length for masonry effect
  const contentLength = note.content?.length || 0;
  const maxChars = contentLength > 300 ? 200 : contentLength > 150 ? 150 : 100;
  
  const truncatedContent = contentPreview.length > maxChars
    ? contentPreview.substring(0, maxChars) + '...'
    : contentPreview;

  return (
    <Card
      className={`
        cursor-pointer group relative overflow-hidden
        glass-card note-card-outline
        transition-all duration-350 ease-bounce-out
        ${!isTouchDevice ? 'hover:shadow-elevated-lg hover:-translate-y-1 hover:ring-1 hover:ring-accent/20' : ''}
        ${isSelected ? 'ring-2 ring-accent/40 shadow-glow' : ''}
      `}
      onClick={(e) => {
        e.stopPropagation();
        if (isIOS) {
          // iOS: Always open immediately to avoid triple tap issues
          onOpen?.(note);
        } else if (isTouchDevice && isSelected) {
          // Android/Other touch devices: Second tap opens note
          onOpen?.(note);
        } else {
          // First tap on touch devices, or any tap on non-touch devices
          onPress?.(note);
          if (!isTouchDevice) {
            // On non-touch devices, open immediately
            onOpen?.(note);
          }
        }
      }}
    >
      {/* Gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/[0.03] via-transparent to-primary/[0.02] pointer-events-none" />
      
      {/* Shimmer effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      </div>

      {/* Pin button in top right corner */}
      <Button
        variant="secondary"
        size="sm"
        className={`
          absolute top-3 right-3 h-8 w-8 rounded-full p-0 z-10
          glass backdrop-blur-md border-border/30
          transition-all duration-250 ease-bounce-out
          ${isSelected ? 'opacity-100 pointer-events-auto' : 'opacity-0 group-hover:opacity-100 group-hover:pointer-events-auto'}
          ${isPinned ? 'opacity-100 pointer-events-auto' : ''}
          hover:scale-110
        `}
        aria-label={isPinned ? 'Unpin note' : 'Pin note'}
        onClick={(e) => {
          e.stopPropagation();
          onTogglePin?.(note);
        }}
      >
        <Pin className={`h-4 w-4 ${isPinned ? 'text-accent' : ''}`} fill={isPinned ? "currentColor" : "none"} />
      </Button>

      {/* Duplicate button */}
      {onDuplicate && (
        <Button
          variant="ghost"
          size="sm"
          className={`
            absolute top-3 right-12 h-8 w-8 rounded-full p-0 z-10
            glass backdrop-blur-md border-border/30
            hover:bg-accent/10 hover:border-accent/30
            transition-all duration-250 ease-bounce-out
            ${isSelected ? 'opacity-100 pointer-events-auto' : 'opacity-0 group-hover:opacity-100 group-hover:pointer-events-auto'}
            hover:scale-110
          `}
          aria-label="Duplicate note"
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate(note);
          }}
        >
          <Copy className="h-4 w-4" />
        </Button>
      )}

      {/* Delete button */}
      {onDelete && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={`
                absolute top-3 h-8 w-8 rounded-full p-0 z-10
                glass backdrop-blur-md border-border/30
                hover:bg-destructive/10 hover:border-destructive/30
                transition-all duration-250 ease-bounce-out
                ${isSelected ? 'opacity-100 pointer-events-auto' : 'opacity-0 group-hover:opacity-100 group-hover:pointer-events-auto'}
                hover:scale-110
              `}
              style={{ right: onDuplicate ? '5.25rem' : '3rem' }}
              aria-label="Delete note"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="glass-card border-border/30">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-display flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-destructive" />
                Permanently Delete Note
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <span className="block font-medium text-destructive">⚠️ This action cannot be undone.</span>
                <span className="block">This note will be permanently deleted. We don't have a Recently Deleted folder — once it's gone, it's gone forever.</span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(note);
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-full"
              >
                Delete Forever
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Share button */}
      {onShareClick && (
        <Button
          variant="ghost"
          size="sm"
          className={`
            absolute bottom-3 right-12 h-7 w-7 rounded-full p-0 z-10
            glass backdrop-blur-md border-border/30
            hover:bg-accent/10 hover:border-accent/30
            transition-all duration-250 ease-bounce-out
            ${isSelected ? 'opacity-100 pointer-events-auto' : 'opacity-0 group-hover:opacity-100 group-hover:pointer-events-auto'}
            hover:scale-110
          `}
          onClick={(e) => {
            e.stopPropagation();
            onShareClick(note);
          }}
        >
          <Users className="h-3.5 w-3.5" />
        </Button>
      )}

      {/* Quick open arrow */}
      <Button
        variant="secondary"
        size="sm"
        className={`
          absolute bottom-3 right-3 h-7 w-7 rounded-full p-0 z-10
          bg-accent/20 backdrop-blur-md border border-accent/30
          text-accent hover:bg-accent hover:text-accent-foreground
          transition-all duration-250 ease-bounce-out
          ${isSelected ? 'opacity-100 pointer-events-auto' : 'opacity-0 group-hover:opacity-100 group-hover:pointer-events-auto'}
          hover:scale-110 hover:shadow-glow
        `}
        aria-label="Open note"
        onClick={(e) => {
          e.stopPropagation();
          onOpen?.(note);
        }}
      >
        <ArrowUpRight className="h-3.5 w-3.5" />
      </Button>

      <CardContent className={`p-5 transition-all duration-300 ${!isTouchDevice ? 'group-hover:translate-y-[-1px]' : ''} select-none relative flex-1`}>
        {/* Shared note tags at top of content */}
        {isSharedWithUser && (
          <Badge
            variant="secondary"
            className="h-6 px-2.5 text-xs flex items-center gap-1.5 mb-3 w-fit rounded-full glass bg-accent/10 text-accent border-accent/20"
          >
            {('userPermission' in note && note.userPermission === 'read') ? (
              <Eye className="h-3 w-3" />
            ) : (
              <Edit className="h-3 w-3" />
            )}
            Shared With Me
          </Badge>
        )}

        {isSharedByUser && (
          <Badge
            variant="secondary"
            className="h-6 px-2.5 text-xs flex items-center gap-1.5 mb-3 w-fit rounded-full glass bg-accent/10 text-accent border-accent/20"
          >
            <Users className="h-3 w-3" />
            I Shared
          </Badge>
        )}

        <div className="flex items-center gap-2 mb-3 pr-10">
          {('note_type' in note && note.note_type === 'checklist') && (
            <CheckSquare className="h-4 w-4 text-accent/70 flex-shrink-0" />
          )}
          <h3 className={`
            font-display font-semibold text-lg
            break-words overflow-wrap-anywhere leading-tight
            text-foreground transition-colors duration-300
            dynamic-title-font
            ${!isTouchDevice ? 'group-hover:text-accent' : ''}
          `}>
            {note.title || (('note_type' in note && note.note_type === 'checklist') ? "Untitled Checklist" : "Untitled Note")}
          </h3>
        </div>

        {isChecklist ? (
          <div className="space-y-2">
            {checklistItems.length > 0 ? (
              checklistItems.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center gap-2.5 text-sm">
                  {item.completed ? (
                    <CheckCircle2 className="h-4 w-4 text-accent flex-shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
                  )}
                  <span className={`truncate ${item.completed ? 'line-through text-muted-foreground/50' : 'text-foreground/80'}`}>
                    {item.content || 'Empty item'}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground/50 italic">No items yet</p>
            )}
            {checklistItems.length > 5 && (
              <p className="text-xs text-muted-foreground/40 pl-6">+{checklistItems.length - 5} more</p>
            )}
          </div>
        ) : (
          <p className={`
            text-sm text-muted-foreground/80
            ${!isTouchDevice ? 'group-hover:text-foreground/70' : ''}
            transition-colors duration-300 leading-relaxed
          `}>
            {truncatedContent}
          </p>
        )}
      </CardContent>

      <CardFooter className={`
        px-5 pb-4 pt-0 text-xs text-muted-foreground/60
        transition-all duration-300 mt-auto
        ${!isTouchDevice ? 'group-hover:text-muted-foreground/80' : ''}
      `}>
        <span className="flex items-center gap-1.5">
          <Clock className="h-3 w-3" />
          {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
        </span>
      </CardFooter>
    </Card>
  );
}
