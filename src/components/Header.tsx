import { User, ArrowLeft, LogOut } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import SessionTimer from './SessionTimer';

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
  userProfilePicture?: string;
  showSessionTimer?: boolean;
}

export default function Header({ title, subtitle, showProfile = true, onProfileClick, showBack = false, onBackClick, showLogout = true, onLogoutClick, userName, userEmail, userProfilePicture, showSessionTimer = true }: HeaderProps) {
  const { colors } = useTheme();

  return (
    <header
      className="fixed top-0 left-0 right-0 text-white shadow-lg z-30"
      style={{
        background: colors.gradient,
        paddingTop: 'max(env(safe-area-inset-top), 12px)',
        paddingBottom: '12px',
        paddingLeft: 'max(env(safe-area-inset-left), 8px)',
        paddingRight: 'max(env(safe-area-inset-right), 8px)',
      }}
    >
      <div className="flex items-center justify-between gap-2 px-2">
        <div className="flex-1 flex items-center gap-2">
          {showBack && onBackClick && (
            <button
              onClick={onBackClick}
              className="w-11 h-11 bg-white bg-opacity-20 hover:bg-opacity-30 active:bg-opacity-40 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 flex-shrink-0"
              aria-label="Wróć"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          {showSessionTimer && (
            <SessionTimer />
          )}
        </div>
        <div className="flex items-center justify-center flex-shrink-0">
          <img src="/erasebg-transformed.png" alt="RODEO Logo" className="h-14 object-contain" />
        </div>
        <div className="flex-1 flex justify-end items-center gap-2">
          {showLogout && onLogoutClick && (
            <button
              onClick={onLogoutClick}
              className="w-11 h-11 bg-white bg-opacity-20 hover:bg-opacity-30 active:bg-opacity-40 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 flex-shrink-0"
              aria-label="Wyloguj"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
          {showProfile && onProfileClick && (
            <button
              onClick={onProfileClick}
              className="w-11 h-11 bg-white bg-opacity-20 hover:bg-opacity-30 active:bg-opacity-40 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 flex-shrink-0 overflow-hidden"
              aria-label="Profil użytkownika"
            >
              {userProfilePicture ? (
                <img
                  src={userProfilePicture}
                  alt="Profil"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : null}
              {!userProfilePicture && <User className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
