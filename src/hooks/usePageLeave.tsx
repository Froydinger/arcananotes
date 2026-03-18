import { useEffect, useRef } from 'react';

interface UsePageLeaveProps {
  onPageLeave?: () => void;
  onVisibilityChange?: (isVisible: boolean) => void;
}

export const usePageLeave = ({ onPageLeave, onVisibilityChange }: UsePageLeaveProps) => {
  const isLeavingRef = useRef(false);

  useEffect(() => {
    const handleBeforeUnload = () => {
      isLeavingRef.current = true;
      onPageLeave?.();
    };

    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      onVisibilityChange?.(isVisible);
      
      if (!isVisible) {
        // User switched tabs or minimized - consider this "leaving"
        onPageLeave?.();
      }
    };

    const handlePageHide = () => {
      isLeavingRef.current = true;
      onPageLeave?.();
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [onPageLeave, onVisibilityChange]);

  return { isLeavingRef };
};