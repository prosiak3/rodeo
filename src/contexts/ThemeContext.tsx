import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

export type Theme = 'amber' | 'blue' | 'green' | 'red' | 'purple';

interface ThemeColors {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  gradient: string;
  gradientHover: string;
}

const themeColors: Record<Theme, ThemeColors> = {
  amber: {
    primary: 'rgb(245, 158, 11)',
    primaryDark: 'rgb(217, 119, 6)',
    primaryLight: 'rgb(251, 191, 36)',
    gradient: 'linear-gradient(to right, rgb(245, 158, 11), rgb(249, 115, 22))',
    gradientHover: 'linear-gradient(to right, rgb(217, 119, 6), rgb(234, 88, 12))',
  },
  blue: {
    primary: 'rgb(59, 130, 246)',
    primaryDark: 'rgb(37, 99, 235)',
    primaryLight: 'rgb(96, 165, 250)',
    gradient: 'linear-gradient(to right, rgb(59, 130, 246), rgb(37, 99, 235))',
    gradientHover: 'linear-gradient(to right, rgb(37, 99, 235), rgb(29, 78, 216))',
  },
  green: {
    primary: 'rgb(34, 197, 94)',
    primaryDark: 'rgb(22, 163, 74)',
    primaryLight: 'rgb(74, 222, 128)',
    gradient: 'linear-gradient(to right, rgb(34, 197, 94), rgb(22, 163, 74))',
    gradientHover: 'linear-gradient(to right, rgb(22, 163, 74), rgb(21, 128, 61))',
  },
  red: {
    primary: 'rgb(239, 68, 68)',
    primaryDark: 'rgb(220, 38, 38)',
    primaryLight: 'rgb(248, 113, 113)',
    gradient: 'linear-gradient(to right, rgb(239, 68, 68), rgb(220, 38, 38))',
    gradientHover: 'linear-gradient(to right, rgb(220, 38, 38), rgb(185, 28, 28))',
  },
  purple: {
    primary: 'rgb(168, 85, 247)',
    primaryDark: 'rgb(147, 51, 234)',
    primaryLight: 'rgb(192, 132, 252)',
    gradient: 'linear-gradient(to right, rgb(168, 85, 247), rgb(147, 51, 234))',
    gradientHover: 'linear-gradient(to right, rgb(147, 51, 234), rgb(126, 34, 206))',
  },
};

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('amber');

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('users')
        .select('theme')
        .eq('id', user.id)
        .single();

      if (data?.theme) {
        setThemeState(data.theme as Theme);
        applyTheme(data.theme as Theme);
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

  const applyTheme = (theme: Theme) => {
    const colors = themeColors[theme];
    document.documentElement.style.setProperty('--color-primary', colors.primary);
    document.documentElement.style.setProperty('--color-primary-dark', colors.primaryDark);
    document.documentElement.style.setProperty('--color-primary-light', colors.primaryLight);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, colors: themeColors[theme] }}>
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
