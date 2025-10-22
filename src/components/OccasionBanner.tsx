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

  const getBestPromotion = () => {
    if (!banner.promotion_details) return null;

    const hasPercentage = banner.promotion_details.percentage;
    const hasBuyXGetY = banner.promotion_details.buy_x_get_y;

    if (hasPercentage && hasBuyXGetY) {
      if (banner.promotion_details.percentage >= 15) {
        return { type: 'percentage', value: banner.promotion_details.percentage };
      }
      return { type: 'buy_x_get_y' };
    }

    if (hasPercentage) {
      return { type: 'percentage', value: banner.promotion_details.percentage };
    }

    if (hasBuyXGetY) {
      return { type: 'buy_x_get_y' };
    }

    return null;
  };

  const bestPromo = getBestPromotion();

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
      onClick={onClick}
      className={`rounded-lg shadow-md p-3 relative cursor-pointer hover:shadow-lg transition ${animationClass}`}
      style={gradientStyle}
    >
      {renderDecorations()}

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDismiss();
        }}
        className="absolute top-2 right-2 hover:opacity-80 transition z-10"
        style={{ color: banner.styling.textColor }}
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex items-center gap-3 relative z-10 pr-8">
        <div className="flex-shrink-0">
          <Icon
            className="w-7 h-7"
            style={{ color: banner.styling.textColor }}
          />
        </div>

        <div className="flex-1" style={{ color: banner.styling.textColor }}>
          <h3 className="font-bold text-base mb-1">{banner.title}</h3>

          {bestPromo && bestPromo.type === 'percentage' && (
            <div className="inline-flex items-center gap-1 bg-white/30 backdrop-blur-sm rounded px-2 py-0.5 text-sm font-bold">
              <span>🔥</span>
              <span>-{bestPromo.value}%</span>
            </div>
          )}

          {bestPromo && bestPromo.type === 'buy_x_get_y' && (
            <div className="inline-flex items-center gap-1 bg-white/30 backdrop-blur-sm rounded px-2 py-0.5 text-sm font-bold">
              <span>🎁</span>
              <span>10+1 GRATIS</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
