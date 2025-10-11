import { User } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showProfile?: boolean;
  onProfileClick?: () => void;
}

export default function Header({ title, subtitle, showProfile = true, onProfileClick }: HeaderProps) {
  return (
    <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-amber-500 to-orange-600 text-white p-4 shadow-lg z-30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <span className="text-4xl">🐃</span>
          <div>
            <h2 className="text-xl font-bold">{title}</h2>
            {subtitle && <p className="text-amber-100 text-sm">{subtitle}</p>}
          </div>
        </div>
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
  );
}
