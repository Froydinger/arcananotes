import { Sun, Moon, Waves, FileText, Sparkles } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { usePreferences, ThemeType } from '@/contexts/PreferencesContext';
import { useState } from 'react';

interface ThemeToggleProps {
  variant?: 'sidebar' | 'settings';
}

export default function ThemeToggle({ variant = 'sidebar' }: ThemeToggleProps) {
  const { preferences, updateTheme } = usePreferences();
  const [showTooltip, setShowTooltip] = useState(false);
  
  const toggleTheme = async () => {
    const themeOrder: ThemeType[] = ['navy', 'dark', 'light'];
    const currentIndex = themeOrder.indexOf(preferences.theme);
    const nextTheme = themeOrder[(currentIndex + 1) % themeOrder.length];
    
    await updateTheme(nextTheme);
    
    // Show tooltip briefly
    setShowTooltip(true);
    setTimeout(() => setShowTooltip(false), 1500);
  };
  
  const getThemeIcon = () => {
    switch (preferences.theme) {
      case 'light':
        return <Sun className="h-4 w-4" />;
      case 'dark':
        return <Sparkles className="h-4 w-4" />;
      case 'navy':
        return <Moon className="h-4 w-4" />;
      default:
        return <Moon className="h-4 w-4" />;
    }
  };

  const getThemeLabel = () => {
    switch (preferences.theme) {
      case 'light':
        return 'Light Mode';
      case 'dark':
        return 'Dark Mode';
      case 'navy':
        return 'Night Mode';
      default:
        return 'Night Mode';
    }
  };

  if (variant === 'settings') {
    return (
      <TooltipProvider>
        <Tooltip open={showTooltip}>
          <TooltipTrigger asChild>
            <Toggle 
              aria-label="Toggle theme"
              pressed={preferences.theme !== 'light'}
              onPressedChange={toggleTheme}
              className="h-8 w-8 p-0 flex-shrink-0 btn-accessible rounded-full"
              variant="outline"
              size="sm"
            >
              {getThemeIcon()}
            </Toggle>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            {getThemeLabel()}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip open={showTooltip}>
        <TooltipTrigger asChild>
          <Toggle 
            aria-label="Toggle theme"
            pressed={preferences.theme !== 'light'}
            onPressedChange={toggleTheme}
            className="w-full justify-start btn-accessible h-9"
            variant="default"
            size="sm"
          >
            {getThemeIcon()}
            <span className="ml-2">{getThemeLabel()}</span>
          </Toggle>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {getThemeLabel()}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}