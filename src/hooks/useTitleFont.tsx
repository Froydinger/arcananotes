import { useEffect } from 'react';
import { usePreferences } from '@/contexts/PreferencesContext';

export const useTitleFont = () => {
  const { preferences } = usePreferences();

  useEffect(() => {
    // Apply the title font to the document
    document.documentElement.setAttribute('data-title-font', preferences.titleFont);
  }, [preferences.titleFont]);

  return preferences.titleFont;
};

export const useBodyFont = () => {
  const { preferences } = usePreferences();

  useEffect(() => {
    // Apply the body font to the document
    document.documentElement.setAttribute('data-body-font', preferences.bodyFont);
  }, [preferences.bodyFont]);

  return preferences.bodyFont;
};