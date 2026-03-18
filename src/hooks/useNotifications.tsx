import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  note_id?: string;
  from_user_email?: string;
  is_read: boolean;
  read: boolean; // mapped from is_read for convenience
  created_at: string;
  updated_at: string;
}

const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Tracks last allowed time per key to throttle bursts
  const cooldownRef = useRef<Record<string, number>>({});

  const getKeyFor = (n: Pick<Notification, 'type' | 'note_id'>) =>
    n.note_id ? `note:${n.note_id}` : `type:${n.type || 'default'}`;

  const canEmitNow = (key: string) => {
    const now = Date.now();
    const last = cooldownRef.current[key] || 0;
    if (now - last >= COOLDOWN_MS) {
      cooldownRef.current[key] = now;
      return true;
    }
    return false;
  };

  const isSelf = (n: Notification) => {
    const actor = (n.from_user_email || '').trim().toLowerCase();
    const current = (user?.email || '').trim().toLowerCase();
    return Boolean(actor && current && actor === current);
  };

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Drop any self-generated notifications and map is_read -> read
      const filtered = (data || [])
        .map(n => ({ ...n, read: n.is_read }))
        .filter(n => !isSelf(n));

      setNotifications(filtered);
      setUnreadCount(filtered.filter(n => !n.read).length);

      // Warm cooldown with the newest item per key so we do not double-fire right away
      const seen = new Set<string>();
      for (const n of filtered) {
        const key = getKeyFor(n);
        if (!seen.has(key)) {
          cooldownRef.current[key] = Date.now();
          seen.add(key);
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true } as any)
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true } as any)
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => {
        const deleted = notifications.find(n => n.id === notificationId);
        return deleted && !deleted.read ? Math.max(0, prev - 1) : prev;
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const deleteAllNotifications = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Error deleting all notifications:', error);
    }
  };

  useEffect(() => {
    if (!user) return;

    fetchNotifications();

    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        payload => {
          const n = payload.new as Notification;

          // Ignore if the actor is the same as the current user
          if (isSelf(n)) return;

          // Throttle by note_id or type
          const key = getKeyFor(n);
          if (canEmitNow(key)) {
            setNotifications(prev => [n, ...prev]);
            if (!n.read) setUnreadCount(prev => prev + 1);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        payload => {
          const updated = payload.new as Notification;

          // If an update makes it self after the fact, still ignore in list
          if (isSelf(updated)) {
            setNotifications(prev => prev.filter(n => n.id !== updated.id));
            return;
          }

          setNotifications(prev =>
            prev.map(n => (n.id === updated.id ? updated : n))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    refetch: fetchNotifications
  };
};