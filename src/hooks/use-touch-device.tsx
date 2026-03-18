import * as React from "react"

export function useIsTouchDevice() {
  const [isTouchDevice, setIsTouchDevice] = React.useState<boolean | undefined>(undefined)
  const [isIOS, setIsIOS] = React.useState<boolean>(false)

  React.useEffect(() => {
    const checkTouchDevice = () => {
      // Check for touch support
      const hasTouchSupport = 'ontouchstart' in window || 
                             navigator.maxTouchPoints > 0 || 
                             (navigator as any).msMaxTouchPoints > 0;
      
      // Also check if it's a mobile/tablet device by user agent
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      // Check specifically for iOS
      const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
      
      setIsTouchDevice(hasTouchSupport || isMobileDevice);
      setIsIOS(isIOSDevice);
    };

    checkTouchDevice();
    
    // Listen for orientation changes which can indicate mobile/tablet
    window.addEventListener('orientationchange', checkTouchDevice);
    
    return () => {
      window.removeEventListener('orientationchange', checkTouchDevice);
    };
  }, []);

  return { isTouchDevice: !!isTouchDevice, isIOS };
}