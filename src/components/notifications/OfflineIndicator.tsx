import React from 'react';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WifiOff, Wifi } from 'lucide-react';

export const OfflineIndicator = () => {
  const { isOnline, wasOffline } = useOfflineStatus();

  if (isOnline && !wasOffline) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4">
      <Alert 
        className={`border ${
          isOnline 
            ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200' 
            : 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200'
        } animate-slide-up-smooth`}
      >
        {isOnline ? (
          <Wifi className="h-4 w-4" />
        ) : (
          <WifiOff className="h-4 w-4" />
        )}
        <AlertDescription>
          {isOnline ? (
            wasOffline ? "Back online! Your notes will sync automatically." : "Connected"
          ) : (
            "You're offline. Changes will sync when you reconnect."
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
};