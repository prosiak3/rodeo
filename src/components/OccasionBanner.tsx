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
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-15">
        <div className="text-xl absolute top-1 right-2">{emoji}</div>
        <div className="text-lg absolute bottom-1 left-2">{emoji}</div>
      </div>
    );
  };

  return (
    <div
      className={`rounded-lg shadow-md p-3 relative ${animationClass}`}
      style={gradientStyle}
    >
      {renderDecorations()}

      <button
        onClick={onDismiss}
        className="absolute top-2 right-2 hover:opacity-80 transition z-10"
        style={{ color: banner.styling.textColor }}
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-3 relative z-10">
        <div className="flex-shrink-0">
          <Icon
            className="w-5 h-5"
            style={{ color: banner.styling.textColor }}
          />
        </div>

        <div className="flex-1 pr-6" style={{ color: banner.styling.textColor }}>
          <h3 className="font-bold text-sm mb-1">{banner.title}</h3>
          <p className="text-xs opacity-90 mb-2 line-clamp-2">{banner.message}</p>

          {banner.promotion_details && banner.promotion_details.percentage && (
            <div className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded px-2 py-0.5 text-xs font-bold">
              <span>🔥</span>
              <span>RABAT {banner.promotion_details.percentage}%</span>
            </div>
          )}

          {onClick && (
            <button
              onClick={onClick}
              className="mt-2 bg-white text-gray-900 px-3 py-1.5 rounded text-xs font-semibold hover:bg-gray-100 transition shadow"
            >
              Zobacz promocje
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
