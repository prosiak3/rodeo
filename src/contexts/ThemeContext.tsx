import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { ThemeStyle } from '../types/themes';

export type Theme = 'amber' | 'blue' | 'green' | 'red' | 'purple';

interface ThemeColors {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  gradient: string;
  gradientHover: string;
  text: string;
  textLight: string;
  bg: string;
  bgLight: string;
  bgHover: string;
  border: string;
  ring: string;
}

const themeColors: Record<Theme, ThemeColors> = {
  amber: {
    primary: 'rgb(245, 158, 11)',
    primaryDark: 'rgb(217, 119, 6)',
    primaryLight: 'rgb(251, 191, 36)',
    gradient: 'linear-gradient(to right, rgb(245, 158, 11), rgb(249, 115, 22))',
    gradientHover: 'linear-gradient(to right, rgb(217, 119, 6), rgb(234, 88, 12))',
    text: 'rgb(245, 158, 11)',
    textLight: 'rgb(251, 191, 36)',
    bg: 'rgb(254, 243, 199)',
    bgLight: 'rgb(254, 252, 232)',
    bgHover: 'rgb(253, 230, 138)',
    border: 'rgb(252, 211, 77)',
    ring: 'rgb(245, 158, 11)',
  },
  blue: {
    primary: 'rgb(59, 130, 246)',
    primaryDark: 'rgb(37, 99, 235)',
    primaryLight: 'rgb(96, 165, 250)',
    gradient: 'linear-gradient(to right, rgb(59, 130, 246), rgb(37, 99, 235))',
    gradientHover: 'linear-gradient(to right, rgb(37, 99, 235), rgb(29, 78, 216))',
    text: 'rgb(59, 130, 246)',
    textLight: 'rgb(96, 165, 250)',
    bg: 'rgb(219, 234, 254)',
    bgLight: 'rgb(239, 246, 255)',
    bgHover: 'rgb(191, 219, 254)',
    border: 'rgb(147, 197, 253)',
    ring: 'rgb(59, 130, 246)',
  },
  green: {
    primary: 'rgb(34, 197, 94)',
    primaryDark: 'rgb(22, 163, 74)',
    primaryLight: 'rgb(74, 222, 128)',
    gradient: 'linear-gradient(to right, rgb(34, 197, 94), rgb(22, 163, 74))',
    gradientHover: 'linear-gradient(to right, rgb(22, 163, 74), rgb(21, 128, 61))',
    text: 'rgb(34, 197, 94)',
    textLight: 'rgb(74, 222, 128)',
    bg: 'rgb(220, 252, 231)',
    bgLight: 'rgb(240, 253, 244)',
    bgHover: 'rgb(187, 247, 208)',
    border: 'rgb(134, 239, 172)',
    ring: 'rgb(34, 197, 94)',
  },
  red: {
    primary: 'rgb(239, 68, 68)',
    primaryDark: 'rgb(220, 38, 38)',
    primaryLight: 'rgb(248, 113, 113)',
    gradient: 'linear-gradient(to right, rgb(239, 68, 68), rgb(220, 38, 38))',
    gradientHover: 'linear-gradient(to right, rgb(220, 38, 38), rgb(185, 28, 28))',
    text: 'rgb(239, 68, 68)',
    textLight: 'rgb(248, 113, 113)',
    bg: 'rgb(254, 226, 226)',
    bgLight: 'rgb(254, 242, 242)',
    bgHover: 'rgb(254, 202, 202)',
    border: 'rgb(252, 165, 165)',
    ring: 'rgb(239, 68, 68)',
  },
  purple: {
    primary: 'rgb(168, 85, 247)',
    primaryDark: 'rgb(147, 51, 234)',
    primaryLight: 'rgb(192, 132, 252)',
    gradient: 'linear-gradient(to right, rgb(168, 85, 247), rgb(147, 51, 234))',
    gradientHover: 'linear-gradient(to right, rgb(147, 51, 234), rgb(126, 34, 206))',
    text: 'rgb(168, 85, 247)',
    textLight: 'rgb(192, 132, 252)',
    bg: 'rgb(243, 232, 255)',
    bgLight: 'rgb(250, 245, 255)',
    bgHover: 'rgb(233, 213, 255)',
    border: 'rgb(216, 180, 254)',
    ring: 'rgb(168, 85, 247)',
  },
};

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  colors: ThemeColors;
  uiTheme: ThemeStyle | null;
  setUiTheme: (theme: ThemeStyle | null) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('amber');
  const [uiTheme, setUiThemeState] = useState<ThemeStyle | null>(null);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('users')
        .select('theme, ui_theme')
        .eq('id', user.id)
        .single();

      console.log('[ThemeContext] Loaded theme data:', data);

      if (data?.theme) {
        setThemeState(data.theme as Theme);
        applyTheme(data.theme as Theme);
      }

      if (data?.ui_theme) {
        console.log('[ThemeContext] Setting UI theme to:', data.ui_theme);
        setUiThemeState(data.ui_theme as ThemeStyle);
      } else {
        console.log('[ThemeContext] No UI theme set, using default');
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const setTheme = async (newTheme: Theme) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('users')
        .update({ theme: newTheme })
        .eq('id', user.id);

      setThemeState(newTheme);
      applyTheme(newTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const setUiTheme = async (newUiTheme: ThemeStyle | null) => {
    try {
      console.log('[ThemeContext] Attempting to set UI theme to:', newUiTheme);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('[ThemeContext] No user found');
        return;
      }

      console.log('[ThemeContext] Updating user:', user.id);
      const { error } = await supabase
        .from('users')
        .update({ ui_theme: newUiTheme })
        .eq('id', user.id);

      if (error) {
        console.error('[ThemeContext] Error updating theme:', error);
        throw error;
      }

      console.log('[ThemeContext] UI theme saved successfully, reloading...');
      setUiThemeState(newUiTheme);

      window.location.reload();
    } catch (error) {
      console.error('Error saving UI theme:', error);
    }
  };

  const applyTheme = (theme: Theme) => {
    const colors = themeColors[theme];
    document.documentElement.style.setProperty('--color-primary', colors.primary);
    document.documentElement.style.setProperty('--color-primary-dark', colors.primaryDark);
    document.documentElement.style.setProperty('--color-primary-light', colors.primaryLight);
    document.documentElement.style.setProperty('--color-text', colors.text);
    document.documentElement.style.setProperty('--color-text-light', colors.textLight);
    document.documentElement.style.setProperty('--color-bg', colors.bg);
    document.documentElement.style.setProperty('--color-bg-light', colors.bgLight);
    document.documentElement.style.setProperty('--color-bg-hover', colors.bgHover);
    document.documentElement.style.setProperty('--color-border', colors.border);
    document.documentElement.style.setProperty('--color-ring', colors.ring);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, colors: themeColors[theme], uiTheme, setUiTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
