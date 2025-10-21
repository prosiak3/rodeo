/**
 * FontSizeContext - Zarządzanie rozmiarem czcionki w aplikacji
 *
 * Kontekst globalny do zarządzania preferencjami rozmiaru czcionki użytkownika.
 * Rozmiar czcionki jest zapisywany w bazie danych i synchronizowany między sesjami.
 *
 * Dostępne rozmiary:
 * - small: 14px (skala 0.875)
 * - medium: 16px (skala 1.0) - domyślny
 * - large: 18px (skala 1.125)
 * - extra-large: 20px (skala 1.25)
 *
 * Zastosowanie:
 * - Automatyczne ładowanie preferencji użytkownika przy logowaniu
 * - Dynamiczna zmiana rozmiaru czcionki w całej aplikacji
 * - Zapisywanie zmian w tabeli users (pole font_size_preference)
 * - Aplikacja skali CSS za pomocą CSS custom property --font-scale
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase, FontSize } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface FontSizeContextType {
  fontSize: FontSize;
  setFontSize: (size: FontSize) => Promise<void>;
  loading: boolean;
}

const FontSizeContext = createContext<FontSizeContextType | undefined>(undefined);

const FONT_SIZE_MAP: Record<FontSize, string> = {
  small: '14px',
  medium: '16px',
  large: '18px',
  'extra-large': '20px',
};

const FONT_SIZE_SCALE: Record<FontSize, number> = {
  small: 0.875,
  medium: 1,
  large: 1.125,
  'extra-large': 1.25,
};

export function FontSizeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [fontSize, setFontSizeState] = useState<FontSize>('medium');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadFontSize();
    } else {
      applyFontSize('medium');
      setLoading(false);
    }
  }, [user?.id]);

  const loadFontSize = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('font_size_preference')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;

      const savedSize = (data?.font_size_preference as FontSize) || 'medium';
      setFontSizeState(savedSize);
      applyFontSize(savedSize);
    } catch (error) {
      console.error('Error loading font size preference:', error);
      applyFontSize('medium');
    } finally {
      setLoading(false);
    }
  };

  const setFontSize = async (size: FontSize) => {
    if (!user) {
      applyFontSize(size);
      setFontSizeState(size);
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({ font_size_preference: size })
        .eq('id', user.id);

      if (error) throw error;

      setFontSizeState(size);
      applyFontSize(size);
    } catch (error) {
      console.error('Error saving font size preference:', error);
      throw error;
    }
  };

  const applyFontSize = (size: FontSize) => {
    const root = document.documentElement;
    const baseSize = FONT_SIZE_MAP[size];
    const scale = FONT_SIZE_SCALE[size];

    root.style.setProperty('--base-font-size', baseSize);
    root.style.setProperty('--font-scale', scale.toString());

    root.style.fontSize = baseSize;
  };

  return (
    <FontSizeContext.Provider value={{ fontSize, setFontSize, loading }}>
      {children}
    </FontSizeContext.Provider>
  );
}

export function useFontSize() {
  const context = useContext(FontSizeContext);
  if (context === undefined) {
    throw new Error('useFontSize must be used within a FontSizeProvider');
  }
  return context;
}
