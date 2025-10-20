import { useState } from 'react';
import { Eye, Grid, Maximize2, Check } from 'lucide-react';
import { ThemeStyle, THEME_CONFIGS } from '../types/themes';

import HomeScreen_Glassmorphism from './themes/HomeScreen_Glassmorphism';
import HomeScreen_Minimalist from './themes/HomeScreen_Minimalist';
import HomeScreen_Colorful from './themes/HomeScreen_Colorful';
import HomeScreen_Corporate from './themes/HomeScreen_Corporate';
import HomeScreen_DarkNeon from './themes/HomeScreen_DarkNeon';
import HomeScreen_Material from './themes/HomeScreen_Material';
import HomeScreen_Fluent from './themes/HomeScreen_Fluent';

type ViewMode = 'grid' | 'single' | 'comparison';

const THEME_COMPONENTS = {
  glassmorphism: HomeScreen_Glassmorphism,
  minimalist: HomeScreen_Minimalist,
  colorful: HomeScreen_Colorful,
  corporate: HomeScreen_Corporate,
  'dark-neon': HomeScreen_DarkNeon,
  material: HomeScreen_Material,
  fluent: HomeScreen_Fluent,
};

export default function StylesDemo() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedTheme, setSelectedTheme] = useState<ThemeStyle>('glassmorphism');
  const [comparisonThemes, setComparisonThemes] = useState<ThemeStyle[]>(['glassmorphism', 'minimalist']);

  const mockHandlers = {
    onNavigate: (tab: string) => console.log('Navigate to:', tab),
    onVoiceOrder: () => console.log('Voice order triggered'),
    userRole: 'admin',
  };

  const toggleComparisonTheme = (theme: ThemeStyle) => {
    if (comparisonThemes.includes(theme)) {
      if (comparisonThemes.length > 1) {
        setComparisonThemes(comparisonThemes.filter(t => t !== theme));
      }
    } else {
      if (comparisonThemes.length < 4) {
        setComparisonThemes([...comparisonThemes, theme]);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Styles Demo</h1>
              <p className="text-gray-600 text-sm mt-1">Porównanie 7 różnych stylów interfejsu RODEO</p>
            </div>
            <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                  viewMode === 'grid'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Grid className="w-4 h-4" />
                Siatka
              </button>
              <button
                onClick={() => setViewMode('single')}
                className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                  viewMode === 'single'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Maximize2 className="w-4 h-4" />
                Pojedynczo
              </button>
              <button
                onClick={() => setViewMode('comparison')}
                className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                  viewMode === 'comparison'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Eye className="w-4 h-4" />
                Porównanie
              </button>
            </div>
          </div>

          {viewMode === 'single' && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {Object.entries(THEME_CONFIGS).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => setSelectedTheme(key as ThemeStyle)}
                  className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                    selectedTheme === key
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {config.name}
                </button>
              ))}
            </div>
          )}

          {viewMode === 'comparison' && (
            <div className="space-y-2">
              <div className="text-sm text-gray-600 font-medium">
                Wybierz style do porównania (max 4):
              </div>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(THEME_CONFIGS).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => toggleComparisonTheme(key as ThemeStyle)}
                    disabled={!comparisonThemes.includes(key as ThemeStyle) && comparisonThemes.length >= 4}
                    className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                      comparisonThemes.includes(key as ThemeStyle)
                        ? 'bg-blue-600 text-white shadow-lg'
                        : comparisonThemes.length >= 4
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {comparisonThemes.includes(key as ThemeStyle) && <Check className="w-4 h-4" />}
                    {config.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-6">
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {Object.entries(THEME_CONFIGS).map(([key, config]) => {
              const Component = THEME_COMPONENTS[key as ThemeStyle];
              return (
                <div key={key} className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
                  <div className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                    <h3 className="font-bold text-lg">{config.name}</h3>
                    <p className="text-sm text-white/80">{config.description}</p>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {config.characteristics.map((char) => (
                        <span key={char} className="text-xs bg-white/20 px-2 py-1 rounded">
                          {char}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="relative" style={{ height: '600px', overflow: 'auto' }}>
                    <div className="absolute inset-0 pointer-events-none">
                      <Component {...mockHandlers} />
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                    <div className="flex gap-2">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: config.primaryColor }}></div>
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: config.secondaryColor }}></div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedTheme(key as ThemeStyle);
                        setViewMode('single');
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Zobacz pełny widok →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {viewMode === 'single' && (
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
              <div className="p-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <h2 className="text-2xl font-bold mb-2">{THEME_CONFIGS[selectedTheme].name}</h2>
                <p className="text-white/90 mb-3">{THEME_CONFIGS[selectedTheme].description}</p>
                <div className="flex gap-2 flex-wrap">
                  {THEME_CONFIGS[selectedTheme].characteristics.map((char) => (
                    <span key={char} className="text-sm bg-white/20 px-3 py-1 rounded-full">
                      {char}
                    </span>
                  ))}
                </div>
              </div>
              <div className="relative" style={{ height: 'calc(100vh - 300px)', overflow: 'auto' }}>
                {(() => {
                  const Component = THEME_COMPONENTS[selectedTheme];
                  return <Component {...mockHandlers} />;
                })()}
              </div>
            </div>
          </div>
        )}

        {viewMode === 'comparison' && (
          <div className={`grid gap-6 ${
            comparisonThemes.length === 1 ? 'grid-cols-1' :
            comparisonThemes.length === 2 ? 'grid-cols-1 lg:grid-cols-2' :
            comparisonThemes.length === 3 ? 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3' :
            'grid-cols-1 lg:grid-cols-2'
          }`}>
            {comparisonThemes.map((themeKey) => {
              const config = THEME_CONFIGS[themeKey];
              const Component = THEME_COMPONENTS[themeKey];
              return (
                <div key={themeKey} className="bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-blue-500">
                  <div className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                    <h3 className="font-bold text-lg">{config.name}</h3>
                    <p className="text-sm text-white/80 line-clamp-1">{config.description}</p>
                  </div>
                  <div className="relative" style={{ height: '700px', overflow: 'auto' }}>
                    <Component {...mockHandlers} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
