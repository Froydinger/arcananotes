import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useNotifications } from '@/hooks/useNotifications';
import { useNavigate } from 'react-router-dom';
import { useSidebar } from '@/components/ui/sidebar';
import { formatDistanceToNow } from 'date-fns';
import { CheckCheck, Share2, Edit3, Bell, Trash2, X } from 'lucide-react';

interface NotificationsPanelProps {
  children: React.ReactNode;
}

export function NotificationsPanel({ children }: NotificationsPanelProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, deleteAllNotifications } = useNotifications();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { setOpenMobile } = useSidebar();

  const handleNotificationClick = async (notification: any) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    
    if (notification.note_id) {
      navigate(`/note/${notification.note_id}`);
      setOpen(false); // Close notification panel
      setOpenMobile(false); // Close main sidebar on mobile
    }
  };

  const handleDeleteNotification = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation(); // Prevent the notification click
    await deleteNotification(notificationId);
  };

  const handleDeleteAll = async () => {
    await deleteAllNotifications();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'note_shared':
        return <Share2 className="h-4 w-4 text-blue-500" />;
      case 'note_updated':
        return <Edit3 className="h-4 w-4 text-green-500" />;
      default:
        return null;
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <div className="relative">
          {children}
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </div>
      </SheetTrigger>
      
      <SheetContent side="right" className="w-80 sm:w-96 p-0 bg-background/80 backdrop-blur-xl border-l border-border/30">
        <SheetHeader className="p-4 border-b border-border/20 bg-background/40 backdrop-blur-md">
          <div className="space-y-3">
            <SheetTitle className="flex items-center gap-3 text-lg font-serif tracking-tight">
              <div className="h-9 w-9 rounded-full bg-background/60 backdrop-blur-md border border-border/30 flex items-center justify-center shadow-sm">
                <Bell className="h-4 w-4" />
              </div>
              Notifications
            </SheetTitle>
            {unreadCount > 0 && (
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20 rounded-full px-3">
                  {unreadCount} new
                </Badge>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="h-8 text-xs btn-accessible rounded-full bg-background/40 backdrop-blur-sm border border-border/20 hover:bg-background/60"
                  >
                    <CheckCheck className="h-3 w-3 mr-1" />
                    Read all
                  </Button>
                  {notifications.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDeleteAll}
                      className="h-8 text-xs btn-accessible rounded-full bg-background/40 backdrop-blur-sm border border-border/20 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete all
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </SheetHeader>

        <div className="p-4 bg-background/20">
          <ScrollArea className="h-[calc(100dvh-160px)]">
            {notifications.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="h-16 w-16 rounded-full bg-background/60 backdrop-blur-md border border-border/30 flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <Bell className="h-7 w-7 opacity-50" />
                </div>
                <p className="text-foreground/80 text-sm font-medium tracking-tight">
                  No notifications yet
                </p>
                <p className="text-muted-foreground text-xs mt-2 leading-relaxed">
                  You'll see updates when notes are shared with you
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-2xl cursor-pointer transition-all duration-200 hover:scale-[1.01] border backdrop-blur-sm ${
                      !notification.read
                        ? 'bg-primary/8 border-primary/25 shadow-sm'
                        : 'bg-background/50 border-border/30 hover:bg-background/70 hover:border-border/40'
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                          !notification.read ? 'bg-primary/15' : 'bg-background/60 border border-border/30'
                        }`}>
                          {getNotificationIcon(notification.type)}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-semibold text-foreground leading-tight tracking-tight">
                            {notification.title}
                          </h3>
                          <div className="flex items-center gap-1.5">
                            {!notification.read && (
                              <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 animate-pulse" />
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleDeleteNotification(e, notification.id)}
                              className="h-6 w-6 p-0 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {notification.message}
                        </p>

                        <div className="flex items-center justify-between pt-1">
                          <span className="text-xs text-muted-foreground/80 font-medium">
                            {formatDistanceToNow(new Date(notification.created_at), {
                              addSuffix: true
                            })}
                          </span>
                          {notification.from_user_email && (
                            <span className="text-xs text-muted-foreground bg-background/60 backdrop-blur-sm px-2 py-1 rounded-full border border-border/20 truncate max-w-32">
                              {notification.from_user_email}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}