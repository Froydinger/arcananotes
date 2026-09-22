import { Sun, Moon, Monitor } from 'lucide-react';
import { usePreferences, ThemeType } from '@/contexts/PreferencesContext';

interface ThemeToggleProps {
  variant?: 'sidebar' | 'settings';
  showSystemToggle?: boolean;
}

const OPTIONS: { value: ThemeType; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

export default function ThemeToggle({ variant = 'sidebar' }: ThemeToggleProps) {
  const { preferences, updateTheme } = usePreferences();

  const isActive = (value: ThemeType) => preferences.theme === value;

  if (variant === 'settings') {
    return (
      <div className="flex items-center gap-1 rounded-full border border-border/40 bg-muted/40 p-1" role="radiogroup" aria-label="Theme">
        {OPTIONS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={isActive(value)}
            aria-label={`${label} theme`}
            onClick={() => updateTheme(value)}
            className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-200 ${
              isActive(value)
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 w-full rounded-lg border border-border/40 bg-muted/40 p-1" role="radiogroup" aria-label="Theme">
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={isActive(value)}
          onClick={() => updateTheme(value)}
          className={`flex flex-1 items-center justify-center gap-1.5 h-8 rounded-md text-xs transition-colors duration-200 ${
            isActive(value)
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Icon className="h-3.5 w-3.5" />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
