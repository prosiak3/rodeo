import { User, ArrowLeft, LogOut } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showProfile?: boolean;
  onProfileClick?: () => void;
  showBack?: boolean;
  onBackClick?: () => void;
  showLogout?: boolean;
  onLogoutClick?: () => void;
  userName?: string;
  userEmail?: string;
}

export default function Header({ title, subtitle, showProfile = true, onProfileClick, showBack = false, onBackClick, showLogout = true, onLogoutClick, userName, userEmail }: HeaderProps) {
  const { colors } = useTheme();

  const displayName = userName || userEmail?.split('@')[0] || '';

  return (
    <div
      className="fixed top-0 left-0 right-0 text-white py-3 px-2 sm:px-4 shadow-lg z-30"
      style={{ background: colors.gradient }}
    >
      <div className="flex items-center justify-between gap-1 sm:gap-2">
        <div className="flex-1 flex items-center">
          {showBack && onBackClick ? (
            <button
              onClick={onBackClick}
              className="w-9 h-9 sm:w-10 sm:h-10 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center transition flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          ) : displayName ? (
            <div className="text-xs sm:text-sm font-medium text-white/95 truncate max-w-[120px] sm:max-w-[180px]">
              {displayName}
            </div>
          ) : null}
        </div>
        <div className="flex items-center justify-center flex-shrink-0">
          <img src="/erasebg-transformed.png" alt="RODEO Logo" className="h-12 sm:h-16 object-contain" />
        </div>
        <div className="flex-1 flex justify-end gap-1 sm:gap-2">
          {showLogout && onLogoutClick && (
            <button
              onClick={onLogoutClick}
              className="w-9 h-9 sm:w-10 sm:h-10 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center transition flex-shrink-0"
              title="Wyloguj"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
          {showProfile && onProfileClick && (
            <button
              onClick={onProfileClick}
              className="w-9 h-9 sm:w-10 sm:h-10 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center transition flex-shrink-0"
              title="Profil"
            >
              <User className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
