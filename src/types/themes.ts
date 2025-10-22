export type ThemeStyle =
  | 'glassmorphism'
  | 'minimalist'
  | 'colorful'
  | 'corporate'
  | 'material'
  | 'fluent';

export interface ThemeConfig {
  id: ThemeStyle;
  name: string;
  description: string;
  characteristics: string[];
  primaryColor: string;
  secondaryColor: string;
}

export const THEME_CONFIGS: Record<ThemeStyle, ThemeConfig> = {
  glassmorphism: {
    id: 'glassmorphism',
    name: 'Glassmorphism',
    description: 'Nowoczesny, futurystyczny wygląd z przezroczystościami i rozmytymi tłami',
    characteristics: ['Transparency', 'Blur effects', 'Layered depth', 'Light & airy'],
    primaryColor: 'rgba(255, 255, 255, 0.1)',
    secondaryColor: 'rgba(255, 255, 255, 0.05)',
  },
  minimalist: {
    id: 'minimalist',
    name: 'Minimalistyczny',
    description: 'Czysty, profesjonalny design skupiony na treści',
    characteristics: ['Clean lines', 'Limited colors', 'Whitespace', 'Typography focus'],
    primaryColor: '#FFFFFF',
    secondaryColor: '#F5F5F5',
  },
  colorful: {
    id: 'colorful',
    name: 'Kolorowy',
    description: 'Energetyczny, kreatywny i przyjazny z żywymi barwami',
    characteristics: ['Vibrant colors', 'Playful', 'Energetic', 'Creative'],
    primaryColor: '#FF6B6B',
    secondaryColor: '#4ECDC4',
  },
  corporate: {
    id: 'corporate',
    name: 'Corporate',
    description: 'Elegancki, biznesowy styl ze stonowanymi kolorami',
    characteristics: ['Professional', 'Trust', 'Stability', 'Elegance'],
    primaryColor: '#1E3A8A',
    secondaryColor: '#64748B',
  },
  material: {
    id: 'material',
    name: 'Material Design',
    description: 'Intuicyjny design z elementami cieni i ruchu',
    characteristics: ['Elevation', 'Motion', 'Grid-based', 'Bold colors'],
    primaryColor: '#6200EE',
    secondaryColor: '#03DAC6',
  },
  fluent: {
    id: 'fluent',
    name: 'Fluent Design',
    description: 'Płynny design z efektami głębi i światła',
    characteristics: ['Depth', 'Light', 'Motion', 'Material'],
    primaryColor: '#0078D4',
    secondaryColor: '#F3F2F1',
  },
};
