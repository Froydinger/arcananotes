import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface AiHistoryEntry {
  id: string;
  note_id: string;
  user_id: string;
  action_type: 'spell' | 'grammar' | 'rewrite';
  instruction?: string;
  original_content: string;
  original_title?: string;
  new_content: string;
  new_title?: string;
  created_at: string;
}

export function useAiHistory(noteId: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [history, setHistory] = useState<AiHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const loadHistory = async () => {
    if (!user || !noteId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('note_ai_history')
        .select('*')
        .eq('note_id', noteId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistory((data || []) as AiHistoryEntry[]);
    } catch (error) {
      console.error('Error loading AI history:', error);
    } finally {
      setLoading(false);
    }
  };

  const addHistoryEntry = async (
    actionType: 'spell' | 'grammar' | 'rewrite',
    originalContent: string,
    newContent: string,
    originalTitle?: string,
    newTitle?: string,
    instruction?: string
  ) => {
    if (!user || !noteId) return;

    try {
      const { error } = await supabase
        .from('note_ai_history')
        .insert({
          note_id: noteId,
          user_id: user.id,
          action_type: actionType,
          instruction,
          original_content: originalContent,
          original_title: originalTitle,
          new_content: newContent,
          new_title: newTitle
        });

      if (error) throw error;
      
      // Reload history to get the latest entries
      await loadHistory();
    } catch (error) {
      console.error('Error adding AI history entry:', error);
      toast({
        title: "Error saving history",
        description: "Failed to save AI change history.",
        variant: "destructive",
      });
    }
  };

  const revertToVersion = async (entry: AiHistoryEntry) => {
    return {
      content: entry.original_content,
      title: entry.original_title || undefined
    };
  };

  const clearHistory = async () => {
    if (!user || !noteId) return;

    try {
      const { error } = await supabase
        .from('note_ai_history')
        .delete()
        .eq('note_id', noteId);

      if (error) throw error;
      setHistory([]);
      
      toast({
        title: "History cleared",
        description: "AI chat history has been cleared for this note.",
      });
    } catch (error) {
      console.error('Error clearing AI history:', error);
      toast({
        title: "Error clearing history",
        description: "Failed to clear AI history.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadHistory();
  }, [noteId, user]);

  return {
    history,
    loading,
    addHistoryEntry,
    revertToVersion,
    clearHistory,
    refreshHistory: loadHistory
  };
}