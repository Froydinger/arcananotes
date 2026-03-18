import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

export type ThemeType = 'light' | 'dark' | 'navy';
export type TitleFontType = 'serif' | 'sans' | 'mono';
export type BodyFontType = 'serif' | 'sans' | 'mono';

interface UserPreferences {
  theme: ThemeType;
  titleFont: TitleFontType;
  bodyFont: BodyFontType;
  aiEnabled: boolean;
}

interface PreferencesContextType {
  preferences: UserPreferences;
  updateTheme: (theme: ThemeType) => Promise<void>;
  updateTitleFont: (font: TitleFontType) => Promise<void>;
  updateBodyFont: (font: BodyFontType) => Promise<void>;
  updateAiEnabled: (enabled: boolean) => Promise<void>;
  refreshPreferences: () => Promise<void>;
  loading: boolean;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
};

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>({ theme: 'dark', titleFont: 'sans', bodyFont: 'sans', aiEnabled: true });
  const [loading, setLoading] = useState(false);

  // Load user preferences - prioritize localStorage, sync with Supabase
  const loadPreferences = async () => {
    // Always start with localStorage as primary source
    const localTheme = (localStorage.getItem('theme') as ThemeType) || 'dark';
    const localTitleFont = (localStorage.getItem('titleFont') as TitleFontType) || 'sans';
    const localBodyFont = (localStorage.getItem('bodyFont') as BodyFontType) || 'sans';
    const localAiEnabled = localStorage.getItem('aiEnabled') !== 'false'; // Default to true
    setPreferences({ theme: localTheme, titleFont: localTitleFont, bodyFont: localBodyFont, aiEnabled: localAiEnabled });
    
    // Apply theme immediately if not already applied
    const html = document.documentElement;
    if (!html.classList.contains(localTheme)) {
      applyTheme(localTheme);
    } else {
      updateBrowserThemeColor(localTheme);
    }

    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Try to sync with Supabase for authenticated users
      const { data, error } = await supabase
        .from('user_preferences')
        .select('theme, title_font, body_font, ai_enabled')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        // Error other than "not found" - keep local theme
        console.error('Error loading preferences:', error);
      } else if (data) {
        // Check if Supabase data differs from local
        const supabaseTitleFont = (data.title_font as TitleFontType) || 'sans';
        const supabaseBodyFont = (data.body_font as BodyFontType) || 'sans';
        const supabaseAiEnabled = data.ai_enabled !== false; // Default to true
        if (data.theme !== localTheme || supabaseTitleFont !== localTitleFont || supabaseBodyFont !== localBodyFont || supabaseAiEnabled !== localAiEnabled) {
          // Supabase has different preferences - use them and update localStorage
          setPreferences({ theme: data.theme as ThemeType, titleFont: supabaseTitleFont, bodyFont: supabaseBodyFont, aiEnabled: supabaseAiEnabled });
          applyTheme(data.theme as ThemeType);
          applyTitleFont(supabaseTitleFont);
          applyBodyFont(supabaseBodyFont);
          applyAiEnabled(supabaseAiEnabled);
        }
      } else {
        // No preferences found in Supabase - sync local to Supabase
        await createDefaultPreferences(localTheme, localTitleFont, localBodyFont, localAiEnabled);
      }
    } catch (error) {
      console.error('Error syncing preferences:', error);
      // Keep local theme on error
    }

    setLoading(false);
  };

  useEffect(() => {
    loadPreferences();

    // Listen for sync events from NoteContext
    const handleRefreshPreferences = () => {
      loadPreferences();
    };

    window.addEventListener('refresh-preferences', handleRefreshPreferences);
    
    return () => {
      window.removeEventListener('refresh-preferences', handleRefreshPreferences);
    };
  }, [user]);

  const createDefaultPreferences = async (theme: ThemeType = 'dark', titleFont: TitleFontType = 'sans', bodyFont: BodyFontType = 'sans', aiEnabled: boolean = true) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_preferences')
        .insert({
          user_id: user.id,
          theme: theme,
          title_font: titleFont,
          body_font: bodyFont,
          ai_enabled: aiEnabled
        });

      if (error) {
        console.error('Error creating default preferences:', error);
      }
    } catch (error) {
      console.error('Error creating default preferences:', error);
    }
  };

  const updateAiEnabled = async (newAiEnabled: boolean) => {
    // Update local state immediately for responsive UI
    setPreferences(prev => ({ ...prev, aiEnabled: newAiEnabled }));
    applyAiEnabled(newAiEnabled);

    if (!user) {
      // For non-authenticated users, only update local state
      return;
    }

    try {
      const { error } = await supabase
        .from('user_preferences')
        .update({ ai_enabled: newAiEnabled })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating AI enabled preference:', error);
        // Revert local state on error
        setPreferences(prev => ({ ...prev, aiEnabled: preferences.aiEnabled }));
        applyAiEnabled(preferences.aiEnabled);
      }
    } catch (error) {
      console.error('Error updating AI enabled preference:', error);
      // Revert local state on error
      setPreferences(prev => ({ ...prev, aiEnabled: preferences.aiEnabled }));
      applyAiEnabled(preferences.aiEnabled);
    }
  };

  const updateTheme = async (newTheme: ThemeType) => {
    // Update local state immediately for responsive UI
    setPreferences(prev => ({ ...prev, theme: newTheme }));
    applyTheme(newTheme);
    
    // Update browser color when user explicitly changes theme
    updateBrowserThemeColor(newTheme);

    if (!user) {
      // For non-authenticated users, only update local state
      return;
    }

    try {
      const { error } = await supabase
        .from('user_preferences')
        .update({ theme: newTheme })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating theme preference:', error);
        // Revert local state on error
        setPreferences(prev => ({ ...prev, theme: preferences.theme }));
        applyTheme(preferences.theme);
      }
    } catch (error) {
      console.error('Error updating theme preference:', error);
      // Revert local state on error
      setPreferences(prev => ({ ...prev, theme: preferences.theme }));
      applyTheme(preferences.theme);
    }
  };

  const updateBodyFont = async (newBodyFont: BodyFontType) => {
    // Update local state immediately for responsive UI
    setPreferences(prev => ({ ...prev, bodyFont: newBodyFont }));
    applyBodyFont(newBodyFont);

    if (!user) {
      // For non-authenticated users, only update local state
      return;
    }

    try {
      const { error } = await supabase
        .from('user_preferences')
        .update({ body_font: newBodyFont })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating body font preference:', error);
        // Revert local state on error
        setPreferences(prev => ({ ...prev, bodyFont: preferences.bodyFont }));
        applyBodyFont(preferences.bodyFont);
      }
    } catch (error) {
      console.error('Error updating body font preference:', error);
      // Revert local state on error
      setPreferences(prev => ({ ...prev, bodyFont: preferences.bodyFont }));
      applyBodyFont(preferences.bodyFont);
    }
  };

  const updateTitleFont = async (newTitleFont: TitleFontType) => {
    // Update local state immediately for responsive UI
    setPreferences(prev => ({ ...prev, titleFont: newTitleFont }));
    applyTitleFont(newTitleFont);

    if (!user) {
      // For non-authenticated users, only update local state
      return;
    }

    try {
      const { error } = await supabase
        .from('user_preferences')
        .update({ title_font: newTitleFont })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating title font preference:', error);
        // Revert local state on error
        setPreferences(prev => ({ ...prev, titleFont: preferences.titleFont }));
        applyTitleFont(preferences.titleFont);
      }
    } catch (error) {
      console.error('Error updating title font preference:', error);
      // Revert local state on error
      setPreferences(prev => ({ ...prev, titleFont: preferences.titleFont }));
      applyTitleFont(preferences.titleFont);
    }
  };

  const refreshPreferences = async () => {
    if (!user) return;
    await loadPreferences();
  };

  const applyTheme = (theme: ThemeType) => {
    const html = document.documentElement;
    
    // Remove all theme classes
    html.classList.remove('light', 'dark', 'navy');
    
    // Add the new theme class
    html.classList.add(theme);
    
    // Save to localStorage immediately
    localStorage.setItem('theme', theme);
    
    // Update browser theme color to match the applied theme
    updateBrowserThemeColor(theme);
  };

  const applyTitleFont = (titleFont: TitleFontType) => {
    // Save to localStorage immediately
    localStorage.setItem('titleFont', titleFont);
    
    // Apply the font preference to the document
    document.documentElement.setAttribute('data-title-font', titleFont);
  };

  const applyBodyFont = (bodyFont: BodyFontType) => {
    // Save to localStorage immediately
    localStorage.setItem('bodyFont', bodyFont);
    
    // Apply the font preference to the document
    document.documentElement.setAttribute('data-body-font', bodyFont);
  };

  const applyAiEnabled = (aiEnabled: boolean) => {
    // Save to localStorage immediately
    localStorage.setItem('aiEnabled', aiEnabled.toString());
  };

  const updateBrowserThemeColor = (theme: ThemeType) => {
    const themeColors = {
      light: '#ffffff',
      dark: '#0a0a0a',
      navy: '#192028'
    };

    const color = themeColors[theme];

    // Update ALL possible meta tags to ensure consistency
    const metaTags = [
      document.querySelector('meta[name="theme-color"]'),
      document.getElementById('theme-meta'),
      document.querySelector('meta[name="msapplication-navbutton-color"]')
    ];

    metaTags.forEach(meta => {
      if (meta) {
        meta.setAttribute('content', color);
      }
    });

    // Create theme-color meta if missing
    if (!metaTags[0] && !metaTags[1]) {
      const newMeta = document.createElement('meta');
      newMeta.name = 'theme-color';
      newMeta.id = 'theme-meta';  // Add same ID as inline script
      newMeta.content = color;
      document.head.appendChild(newMeta);
    }

    console.log('PreferencesContext updated browser color to:', color, 'for theme:', theme);
  };

  // Apply title font on mount
  useEffect(() => {
    applyTitleFont(preferences.titleFont);
    applyBodyFont(preferences.bodyFont);
  }, [preferences.titleFont, preferences.bodyFont]);

  return (
    <PreferencesContext.Provider value={{ preferences, updateTheme, updateTitleFont, updateBodyFont, updateAiEnabled, refreshPreferences, loading }}>
      {children}
    </PreferencesContext.Provider>
  );
};