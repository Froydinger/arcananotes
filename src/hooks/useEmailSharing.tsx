import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';

export interface EmailShare {
  id: string;
  note_id: string;
  shared_with_email: string;
  permission: 'read' | 'write';
  is_registered_user: boolean;
  created_at: string;
}

export function useEmailSharing(noteId?: string) {
  const [shares, setShares] = useState<EmailShare[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const loadShares = useCallback(async (targetNoteId: string) => {
    if (!user) {
      setShares([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('shared_notes')
        .select('id, note_id, shared_with_email, shared_with_user_id, permission, created_at')
        .eq('note_id', targetNoteId)
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const emailShares: EmailShare[] = (data || []).map(share => ({
        id: share.id,
        note_id: share.note_id,
        shared_with_email: share.shared_with_email,
        permission: share.permission as 'read' | 'write',
        is_registered_user: !!share.shared_with_user_id,
        created_at: share.created_at
      }));

      setShares(emailShares);
    } catch (error) {
      console.error('Error loading shares:', error);
      toast.error("Failed to load shares", { description: "Please try again later." });
      setShares([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const addShare = useCallback(async (email: string, permission: 'read' | 'write') => {
    if (!user || !noteId) return { success: false, error: 'Missing requirements' };

    const trimmedEmail = email.toLowerCase().trim();
    
    // Basic email validation
    if (!trimmedEmail.includes('@') || trimmedEmail.length < 5) {
      return { success: false, error: 'Please enter a valid email address' };
    }

    try {
      const { data, error } = await supabase.rpc('create_email_share', {
        p_note_id: noteId,
        p_email: trimmedEmail,
        p_permission: permission
      });

      if (error) throw error;

      // Reload shares
      await loadShares(noteId);

      toast.success("Note shared successfully", { description: `Shared with ${trimmedEmail}` });

      return { success: true, data };
    } catch (error: any) {
      console.error('Error adding share:', error);
      const errorMessage = error.message || 'Failed to share note';
      toast.error("Failed to share note", { description: errorMessage });
      return { success: false, error: errorMessage };
    }
  }, [user, noteId, loadShares]);

  const updatePermission = useCallback(async (shareId: string, permission: 'read' | 'write') => {
    if (!user || !noteId) return false;

    try {
      const { error } = await supabase
        .from('shared_notes')
        .update({ permission })
        .eq('id', shareId)
        .eq('owner_id', user.id);

      if (error) throw error;

      // Update local state
      setShares(prev => prev.map(share => 
        share.id === shareId ? { ...share, permission } : share
      ));

      toast.success("Permission updated", { description: `Updated to ${permission} access` });

      return true;
    } catch (error: any) {
      console.error('Error updating permission:', error);
      toast.error("Failed to update permission", { description: error.message || 'Please try again' });
      return false;
    }
  }, [user, noteId]);

  const removeShare = useCallback(async (shareId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('shared_notes')
        .delete()
        .eq('id', shareId)
        .eq('owner_id', user.id);

      if (error) throw error;

      // Update local state
      setShares(prev => prev.filter(share => share.id !== shareId));

      toast.success("Share removed");

      return true;
    } catch (error: any) {
      console.error('Error removing share:', error);
      toast.error("Failed to remove share", { description: error.message || 'Please try again' });
      return false;
    }
  }, [user]);

  // Auto-load when noteId changes
  useEffect(() => {
    if (noteId && user) {
      loadShares(noteId);
    } else {
      setShares([]);
    }
  }, [noteId, user, loadShares]);

  return {
    shares,
    loading,
    addShare,
    updatePermission,
    removeShare,
    reload: () => noteId ? loadShares(noteId) : Promise.resolve()
  };
}
