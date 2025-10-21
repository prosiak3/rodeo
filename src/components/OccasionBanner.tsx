import { X, Tag, Gift, Heart, Zap, Sparkles, Sun, Snowflake, Leaf, Award } from 'lucide-react';
import { ActiveBanner } from '../hooks/useActiveBanners';

interface OccasionBannerProps {
  banner: ActiveBanner;
  onDismiss: () => void;
  onClick?: () => void;
}

const iconMap: Record<string, any> = {
  Tag,
  Gift,
  Heart,
  Zap,
  Sparkles,
  Sun,
  Snowflake,
  Leaf,
  Award,
};

export default function OccasionBanner({ banner, onDismiss, onClick }: OccasionBannerProps) {
  const Icon = iconMap[banner.styling.icon] || Tag;
  const animationClass =
    banner.styling.animation === 'pulse' ? 'animate-pulse' :
    banner.styling.animation === 'bounce' ? 'animate-bounce' : '';

  const gradientStyle = {
    background: `linear-gradient(to right, ${banner.styling.gradientFrom}, ${banner.styling.gradientTo})`,
  };

  // Decorations overlay
  const renderDecorations = () => {
    if (!banner.styling.decorations) return null;

    const decorationMap: Record<string, string> = {
      snowflakes: '❄️',
      hearts: '💕',
      flowers: '🌸',
      eggs: '🥚',
      pumpkins: '🎃',
      leaves: '🍂',
    };

    const emoji = decorationMap[banner.styling.decorations];
    if (!emoji) return null;

    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="text-4xl absolute top-2 left-4">{emoji}</div>
        <div className="text-3xl absolute top-8 right-8">{emoji}</div>
        <div className="text-2xl absolute bottom-4 left-12">{emoji}</div>
        <div className="text-3xl absolute bottom-6 right-4">{emoji}</div>
      </div>
    );
  };

  return (
    <div
      className={`rounded-xl shadow-lg p-6 relative ${animationClass}`}
      style={gradientStyle}
    >
      {renderDecorations()}

      <button
        onClick={onDismiss}
        className="absolute top-4 right-4 hover:opacity-80 transition z-10"
        style={{ color: banner.styling.textColor }}
      >
        <X className="w-6 h-6" />
      </button>

      <div className="flex items-start gap-4 relative z-10">
        <div className="flex-shrink-0 mt-1">
          <Icon
            className="w-8 h-8"
            style={{ color: banner.styling.textColor }}
          />
        </div>

        <div className="flex-1" style={{ color: banner.styling.textColor }}>
          <h3 className="font-bold text-xl mb-2">{banner.title}</h3>
          <p className="text-base opacity-95 mb-4">{banner.message}</p>

          {banner.promotion_details && banner.promotion_details.percentage && (
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🔥</span>
                <span className="font-bold text-lg">
                  RABAT {banner.promotion_details.percentage}%
                </span>
              </div>
            </div>
          )}

          {onClick && (
            <button
              onClick={onClick}
              className="bg-white text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition w-full text-base shadow-lg"
            >
              Zobacz promocje
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
