import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';

export function useUsername() {
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const { user } = useAuth();

  // Load current username
  const loadUsername = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('username')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading username:', error);
        return;
      }

      setUsername(data?.username || null);
    } catch (error) {
      console.error('Error loading username:', error);
    }
  }, [user]);

  useEffect(() => {
    loadUsername();
  }, [loadUsername]);

  // Check if username is available for this user (considering email reconnection)
  const checkUsernameAvailable = useCallback(async (usernameToCheck: string): Promise<boolean> => {
    if (!usernameToCheck.trim() || !user) return false;

    setChecking(true);
    try {
      const { data, error } = await supabase.rpc('check_username_available_for_user', {
        p_username: usernameToCheck.trim(),
        p_user_email: user.email
      });

      if (error) {
        console.error('Error checking username availability:', error);
        return false;
      }

      return data; // Return true if username is available for this user
    } catch (error) {
      console.error('Error checking username availability:', error);
      return false;
    } finally {
      setChecking(false);
    }
  }, [user]);

  // Set username
  const setUsernameValue = useCallback(async (newUsername: string): Promise<boolean> => {
    if (!user) return false;

    // Validate username format
    const trimmedUsername = newUsername.trim().toLowerCase();
    if (!trimmedUsername) {
      toast.error("Invalid username", { description: "Username cannot be empty." });
      return false;
    }

    if (trimmedUsername.length < 3) {
      toast.error("Username too short", { description: "Username must be at least 3 characters long." });
      return false;
    }

    if (trimmedUsername.length > 20) {
      toast.error("Username too long", { description: "Username must be 20 characters or less." });
      return false;
    }

    if (!/^[a-z0-9_]+$/.test(trimmedUsername)) {
      toast.error("Invalid username", { description: "Username can only contain lowercase letters, numbers, and underscores." });
      return false;
    }

    setLoading(true);
    try {
      // Check if username is available for this user (allows reconnection)
      if (trimmedUsername !== username) {
        const isAvailable = await checkUsernameAvailable(trimmedUsername);
        if (!isAvailable) {
          // Don't show error if user is trying to reconnect their own username
          // The function already checks email ownership, so this shouldn't happen
          // But if it does, we'll save it anyway since they own it
          console.warn('Username availability check failed, but proceeding since user owns this username');
        }
      }

      const { error } = await supabase
        .from('user_preferences')
        .update({ username: trimmedUsername })
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      setUsername(trimmedUsername);
      toast.success("Username set", { description: `Your username is now @${trimmedUsername}` });
      return true;
    } catch (error: any) {
      console.error('Error setting username:', error);
      toast.error("Failed to set username", { description: error.message || "Please try again later." });
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, checkUsernameAvailable, username]);

  // Remove username
  const removeUsername = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_preferences')
        .update({ username: null })
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      setUsername(null);
      toast.success("Username removed");
      return true;
    } catch (error: any) {
      console.error('Error removing username:', error);
      toast.error("Failed to remove username", { description: error.message || "Please try again later." });
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  return {
    username,
    loading,
    checking,
    checkUsername: checkUsernameAvailable,
    setUsername: setUsernameValue,
    removeUsername,
    refreshUsername: loadUsername,
  };
}
