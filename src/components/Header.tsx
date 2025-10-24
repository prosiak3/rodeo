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

  const displayName = userName || userEmail || 'Użytkownik';

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
        <div className="flex flex-col items-center justify-center">
          <img src="/erasebg-transformed.png" alt="RODEO Logo" className="h-12 sm:h-16 object-contain" />
          {displayName && (
            <div className="text-xs sm:text-sm font-medium text-white/90 mt-1 truncate max-w-[200px]">
              {displayName}
            </div>
          )}
        </div>
        <div className="flex-1 flex justify-end gap-2">
          {showLogout && onLogoutClick && (
            <button
              onClick={onLogoutClick}
              className="w-10 h-10 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center transition"
              title="Wyloguj"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
          {showProfile && onProfileClick && (
            <button
              onClick={onProfileClick}
              className="w-10 h-10 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center transition"
              title="Profil"
            >
              <User className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
