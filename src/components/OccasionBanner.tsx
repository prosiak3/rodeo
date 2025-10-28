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
    banner.styling.animation === 'bounce' ? 'animate-pulse' : '';

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
      className={`rounded-lg shadow-xl p-8 relative cursor-pointer hover:shadow-2xl transition border-2 border-orange-400 ${animationClass}`}
      style={{
        ...gradientStyle,
        background: 'linear-gradient(135deg, #ff6b35 0%, #ff8c42 50%, #ffa500 100%)',
      }}
    >
      {renderDecorations()}

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDismiss();
        }}
        className="absolute top-3 right-3 hover:opacity-80 transition z-10 bg-white/20 rounded-full p-1"
        style={{ color: '#ffffff' }}
      >
        <X className="w-6 h-6" />
      </button>

      <div className="flex items-center gap-4 relative z-10 pr-10">
        <div className="flex-shrink-0">
          <Icon
            className="w-10 h-10"
            style={{ color: '#ffffff' }}
          />
        </div>

        <div className="flex-1" style={{ color: '#ffffff' }}>
          <h3 className="font-bold text-xl mb-2">{banner.title}</h3>

          {bestPromo && bestPromo.type === 'percentage' && (
            <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-1.5 text-lg font-bold text-orange-600 shadow-md">
              <span>🔥</span>
              <span>-{bestPromo.value}%</span>
            </div>
          )}

          {bestPromo && bestPromo.type === 'buy_x_get_y' && (
            <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-1.5 text-lg font-bold text-orange-600 shadow-md">
              <span>🎁</span>
              <span>10+1 GRATIS</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
