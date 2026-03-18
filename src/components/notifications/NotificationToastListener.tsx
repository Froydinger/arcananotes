import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';
import { useNavigate } from 'react-router-dom';

export const NotificationToastListener = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const lastNotificationId = useRef<string | null>(null);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'note_shared':
        return '🔗';
      case 'note_updated':
        return '✏️';
      default:
        return '🔔';
    }
  };

  const handleToastClick = (noteId: string) => {
    navigate(`/note/${noteId}`);
  };

  useEffect(() => {
    if (!user) return;

    // Subscribe to real-time notifications
    const channel = supabase
      .channel('notification-toasts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const notification = payload.new as any;
          
          // Prevent duplicate toasts for the same notification
          if (lastNotificationId.current === notification.id) {
            return;
          }
          lastNotificationId.current = notification.id;

          // Show toast notification
          toast(`${getNotificationIcon(notification.type)} ${notification.title}`, {
            description: notification.message,
            duration: 4000,
            action: notification.note_id ? {
              label: 'View →',
              onClick: () => handleToastClick(notification.note_id)
            } : undefined,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, navigate]);

  return null; // This is an invisible component that just listens
};
