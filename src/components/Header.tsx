import { User, ArrowLeft } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showProfile?: boolean;
  onProfileClick?: () => void;
  showBack?: boolean;
  onBackClick?: () => void;
}

export default function Header({ title, subtitle, showProfile = true, onProfileClick, showBack = false, onBackClick }: HeaderProps) {
  const { colors } = useTheme();

  return (
    <div
      className="fixed top-0 left-0 right-0 text-white py-0 px-4 shadow-lg z-30"
      style={{ background: colors.gradient }}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {showBack && onBackClick && (
            <button
              onClick={onBackClick}
              className="w-10 h-10 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
        </div>
        <div className="flex items-center justify-center">
          <img src="/erasebg-transformed.png" alt="RODEO Logo" className="h-16 object-contain" />
        </div>
        <div className="flex-1 flex justify-end">
          {showProfile && onProfileClick && (
            <button
              onClick={onProfileClick}
              className="w-10 h-10 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center transition"
            >
              <User className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
