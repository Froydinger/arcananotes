import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Note } from '@/contexts/NoteContext';
import { ChecklistItem } from '@/types/sharing';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Plus, GripVertical, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTitleFont, useBodyFont } from '@/hooks/useTitleFont';
import { useNotes } from '@/contexts/NoteContext';
import { FeaturedImage } from './FeaturedImage';

interface ChecklistEditorProps {
  note: Note;
}

export default function ChecklistEditor({ note }: ChecklistEditorProps) {
  const titleFont = useTitleFont();
  const bodyFont = useBodyFont();
  const { updateNote } = useNotes();
  const [title, setTitle] = useState(note.title);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const newItemInputRef = useRef<HTMLInputElement>(null);
  const titleSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const isReadOnly = note.isSharedWithUser && note.userPermission === 'read';

  // Auto-resize title textarea
  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.style.height = 'auto';
      titleRef.current.style.height = titleRef.current.scrollHeight + 'px';
    }
  }, [title]);

  // Update title when note changes
  useEffect(() => {
    setTitle(note.title);
  }, [note.id, note.title]);

  // Load checklist items
  useEffect(() => {
    // Use requestIdleCallback for initial load to not block main thread
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => loadItems());
    } else {
      setTimeout(loadItems, 50);
    }
    
    // Delay real-time subscription to allow page to render first
    let channel: ReturnType<typeof supabase.channel> | null = null;
    const subscriptionTimeout = setTimeout(() => {
      channel = supabase
        .channel(`checklist-${note.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'checklist_items',
            filter: `note_id=eq.${note.id}`
          },
          () => {
            loadItems();
          }
        )
        .subscribe();
    }, 200);

    return () => {
      clearTimeout(subscriptionTimeout);
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [note.id]);

  const loadItems = async () => {
    const { data, error } = await supabase
      .from('checklist_items')
      .select('*')
      .eq('note_id', note.id)
      .order('position', { ascending: true });

    if (!error && data) {
      setItems(data as ChecklistItem[]);
    }
    setLoading(false);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    
    if (titleSaveTimeoutRef.current) {
      clearTimeout(titleSaveTimeoutRef.current);
    }
    
    titleSaveTimeoutRef.current = setTimeout(() => {
      updateNote(note.id, { title: newTitle }, true);
    }, 500);
  };

  const addItem = async (content: string = '') => {
    if (isReadOnly) return;
    
    const newPosition = items.length > 0 ? Math.max(...items.map(i => i.position)) + 1 : 0;
    
    const { data, error } = await supabase
      .from('checklist_items')
      .insert({
        note_id: note.id,
        content,
        completed: false,
        position: newPosition
      })
      .select()
      .single();

    if (!error && data) {
      setItems(prev => [...prev, data as ChecklistItem]);
    }
  };

  const updateItem = async (id: string, updates: Partial<ChecklistItem>) => {
    if (isReadOnly) return;
    
    // Optimistic update
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));

    const { error } = await supabase
      .from('checklist_items')
      .update(updates)
      .eq('id', id);

    if (error) {
      // Revert on error
      loadItems();
    }
  };

  const deleteItem = async (id: string) => {
    if (isReadOnly) return;
    
    // Optimistic delete
    setItems(prev => prev.filter(item => item.id !== id));

    const { error } = await supabase
      .from('checklist_items')
      .delete()
      .eq('id', id);

    if (error) {
      loadItems();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, itemId: string, index: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addItem('');
      // Focus new item after render
      setTimeout(() => {
        const inputs = document.querySelectorAll('[data-checklist-input]');
        const lastInput = inputs[inputs.length - 1] as HTMLInputElement;
        lastInput?.focus();
      }, 100);
    } else if (e.key === 'Backspace' && (e.target as HTMLInputElement).value === '') {
      e.preventDefault();
      deleteItem(itemId);
      // Focus previous item
      setTimeout(() => {
        const inputs = document.querySelectorAll('[data-checklist-input]');
        const prevInput = inputs[Math.max(0, index - 1)] as HTMLInputElement;
        prevInput?.focus();
      }, 50);
    }
  };

  const completedItems = items.filter(i => i.completed);
  const incompleteItems = items.filter(i => !i.completed);

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6 sm:py-8 animate-content-fade">
      {/* Title */}
      <textarea
        ref={titleRef}
        value={title}
        onChange={handleTitleChange}
        placeholder="Checklist title..."
        disabled={isReadOnly}
        className={cn(
          "w-full text-2xl sm:text-3xl font-semibold bg-transparent border-none outline-none resize-none overflow-hidden",
          "placeholder:text-muted-foreground/40 text-foreground",
          "disabled:cursor-not-allowed disabled:opacity-60",
          "dynamic-title-font"
        )}
        rows={1}
      />

      {/* Featured Image */}
      {note.featured_image && (
        <FeaturedImage
          imageUrl={note.featured_image}
          alt={note.title}
          onDelete={() => updateNote(note.id, { featured_image: null }, true)}
        />
      )}

      {/* Progress indicator */}
      {items.length > 0 && (
        <div className="mt-4 mb-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span>{completedItems.length} of {items.length} completed</span>
            <span>{Math.round((completedItems.length / items.length) * 100)}%</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-accent transition-all duration-300 ease-out rounded-full"
              style={{ width: `${(completedItems.length / items.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Checklist items */}
      <div className="space-y-1 mt-6">
        {loading ? (
          <div className="text-muted-foreground text-sm py-4">Loading items...</div>
        ) : (
          <>
            {/* Incomplete items */}
            {incompleteItems.map((item, index) => (
              <ChecklistItemRow
                key={item.id}
                item={item}
                isReadOnly={isReadOnly}
                onToggle={() => updateItem(item.id, { completed: !item.completed })}
                onContentChange={(content) => updateItem(item.id, { content })}
                onDelete={() => deleteItem(item.id)}
                onKeyDown={(e) => handleKeyDown(e, item.id, index)}
              />
            ))}

            {/* Add new item button */}
            {!isReadOnly && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => addItem('')}
                className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground h-11 pl-3"
              >
                <Plus className="h-4 w-4" />
                <span>Add item</span>
              </Button>
            )}

            {/* Completed items section */}
            {completedItems.length > 0 && (
              <div className="mt-6 pt-4 border-t border-border/50">
                <div className="text-sm text-muted-foreground mb-3 font-medium">
                  Completed ({completedItems.length})
                </div>
                {completedItems.map((item, index) => (
                  <ChecklistItemRow
                    key={item.id}
                    item={item}
                    isReadOnly={isReadOnly}
                    onToggle={() => updateItem(item.id, { completed: !item.completed })}
                    onContentChange={(content) => updateItem(item.id, { content })}
                    onDelete={() => deleteItem(item.id)}
                    onKeyDown={(e) => handleKeyDown(e, item.id, incompleteItems.length + index)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

interface ChecklistItemRowProps {
  item: ChecklistItem;
  isReadOnly: boolean;
  onToggle: () => void;
  onContentChange: (content: string) => void;
  onDelete: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

function ChecklistItemRow({ 
  item, 
  isReadOnly, 
  onToggle, 
  onContentChange, 
  onDelete,
  onKeyDown 
}: ChecklistItemRowProps) {
  const [localContent, setLocalContent] = useState(item.content);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setLocalContent(item.content);
  }, [item.content]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [localContent]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setLocalContent(newContent);
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      onContentChange(newContent);
    }, 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onKeyDown(e as unknown as React.KeyboardEvent<HTMLInputElement>);
    } else if (e.key === 'Backspace' && localContent === '') {
      e.preventDefault();
      onKeyDown(e as unknown as React.KeyboardEvent<HTMLInputElement>);
    }
  };

  return (
    <div 
      className={cn(
        "group flex items-start gap-3 py-2 px-3 rounded-lg",
        "hover:bg-secondary/50 transition-colors duration-150",
        item.completed && "opacity-60"
      )}
    >
      <Checkbox
        checked={item.completed}
        onCheckedChange={onToggle}
        disabled={isReadOnly}
        className="h-5 w-5 rounded-full border-2 mt-0.5 flex-shrink-0"
      />
      
      <textarea
        ref={textareaRef}
        data-checklist-input
        value={localContent}
        onChange={handleContentChange}
        onKeyDown={handleKeyDown}
        disabled={isReadOnly}
        placeholder="Enter item..."
        rows={1}
        className={cn(
          "flex-1 bg-transparent border-none outline-none text-foreground resize-none overflow-hidden",
          "placeholder:text-muted-foreground/40",
          "disabled:cursor-not-allowed",
          "dynamic-body-font leading-normal",
          item.completed && "line-through text-muted-foreground"
        )}
      />

      {!isReadOnly && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive flex-shrink-0"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
