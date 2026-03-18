import { Sun, Moon, Sparkles, Monitor } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { usePreferences, ThemeType } from '@/contexts/PreferencesContext';
import { useState } from 'react';

interface ThemeToggleProps {
  variant?: 'sidebar' | 'settings';
  showSystemToggle?: boolean;
}

export default function ThemeToggle({ variant = 'sidebar', showSystemToggle = false }: ThemeToggleProps) {
  const { preferences, updateTheme } = usePreferences();
  const [showTooltip, setShowTooltip] = useState(false);

  const isSystem = preferences.theme === 'system';

  // The "display" theme for the manual toggle (what was last picked before system, or current)
  const displayTheme = isSystem ? 'dark' : preferences.theme;
  
  const toggleTheme = async () => {
    if (isSystem) return; // disabled when system is on
    const themeOrder: ThemeType[] = ['dark', 'navy', 'light'];
    const currentIndex = themeOrder.indexOf(preferences.theme as any);
    const nextTheme = themeOrder[(currentIndex + 1) % themeOrder.length];
    
    await updateTheme(nextTheme);
    
    setShowTooltip(true);
    setTimeout(() => setShowTooltip(false), 1500);
  };

  const toggleSystem = async () => {
    if (isSystem) {
      // Turn off system, go to dark as default
      await updateTheme('dark');
    } else {
      await updateTheme('system');
    }
  };
  
  const getThemeIcon = () => {
    switch (displayTheme) {
      case 'light':
        return <Sun className="h-4 w-4" />;
      case 'dark':
        return <Sparkles className="h-4 w-4" />;
      case 'navy':
        return <Moon className="h-4 w-4" />;
      default:
        return <Sparkles className="h-4 w-4" />;
    }
  };

  const getThemeLabel = () => {
    switch (displayTheme) {
      case 'light':
        return 'Light Mode';
      case 'dark':
        return 'Dark Mode';
      case 'navy':
        return 'Night Mode';
      default:
        return 'Dark Mode';
    }
  };

  if (variant === 'settings') {
    return (
      <div className="flex flex-col items-end gap-0">
        <TooltipProvider>
          <Tooltip open={showTooltip}>
            <TooltipTrigger asChild>
              <Toggle 
                aria-label="Toggle theme"
                pressed={displayTheme !== 'light'}
                onPressedChange={toggleTheme}
                disabled={isSystem}
                className={`h-8 w-8 p-0 flex-shrink-0 btn-accessible rounded-full ${isSystem ? 'opacity-40 pointer-events-none' : ''}`}
                variant="outline"
                size="sm"
              >
                {getThemeIcon()}
              </Toggle>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {isSystem ? 'System mode active' : getThemeLabel()}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 w-full">
      <TooltipProvider>
        <Tooltip open={showTooltip}>
          <TooltipTrigger asChild>
            <Toggle 
              aria-label="Toggle theme"
              pressed={displayTheme !== 'light'}
              onPressedChange={toggleTheme}
              disabled={isSystem}
              className={`w-full justify-start btn-accessible h-9 ${isSystem ? 'opacity-40 pointer-events-none' : ''}`}
              variant="default"
              size="sm"
            >
              {getThemeIcon()}
              <span className="ml-2">{getThemeLabel()}</span>
            </Toggle>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            {isSystem ? 'System mode active' : getThemeLabel()}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      {showSystemToggle && (
        <button
          onClick={toggleSystem}
          className="w-full flex items-center justify-start gap-2 h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground transition-colors rounded-md"
        >
          <Monitor className="h-3.5 w-3.5" />
          <span>System default</span>
          <div className={`ml-auto w-7 h-4 rounded-full transition-colors ${isSystem ? 'bg-accent' : 'bg-muted'} relative`}>
            <div className={`absolute top-0.5 h-3 w-3 rounded-full bg-foreground transition-transform ${isSystem ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
          </div>
        </button>
      )}
    </div>
  );
}
