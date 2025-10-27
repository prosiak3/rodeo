import { useState, useEffect, useRef, ReactNode } from 'react';
import { HelpCircle, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTheme } from '../contexts/ThemeContext';
import { useDeviceType } from '../hooks/useDeviceType';

type TooltipPosition = 'top' | 'bottom' | 'left' | 'right' | 'auto';

interface HelpTooltipProps {
  tooltipId: string;
  title?: string;
  content: string | ReactNode;
  position?: TooltipPosition;
  iconSize?: number;
  maxWidth?: number;
  disabled?: boolean;
  showIcon?: boolean;
  className?: string;
  children?: ReactNode;
}

export default function HelpTooltip({
  tooltipId,
  title,
  content,
  position = 'auto',
  iconSize = 18,
  maxWidth = 320,
  disabled = false,
  showIcon = true,
  className = '',
  children
}: HelpTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [calculatedPosition, setCalculatedPosition] = useState<TooltipPosition>(position);
  const [userId, setUserId] = useState<string | null>(null);
  const [showTooltips, setShowTooltips] = useState(true);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const { colors } = useTheme();
  const deviceType = useDeviceType();
  const isMobile = deviceType === 'phone';
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadUserPreferences();
  }, []);

  useEffect(() => {
    if (isVisible && position === 'auto') {
      calculateBestPosition();
    }
  }, [isVisible, position]);

  useEffect(() => {
    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscKey);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscKey);
      };
    }
  }, [isVisible]);

  const loadUserPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);

      const { data, error } = await supabase
        .from('users')
        .select('show_help_tooltips')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        if (error.code === '42703') {
          setShowTooltips(true);
        }
        return;
      }

      if (data && data.show_help_tooltips !== undefined) {
        setShowTooltips(data.show_help_tooltips);
      }
    } catch (error) {
      console.error('Error loading tooltip preferences:', error);
      setShowTooltips(true);
    }
  };

  const calculateBestPosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const tooltipHeight = tooltipRef.current.offsetHeight;
    const tooltipWidth = tooltipRef.current.offsetWidth;

    const spaceTop = triggerRect.top;
    const spaceBottom = viewportHeight - triggerRect.bottom;
    const spaceLeft = triggerRect.left;
    const spaceRight = viewportWidth - triggerRect.right;

    if (spaceBottom >= tooltipHeight || spaceBottom > spaceTop) {
      setCalculatedPosition('bottom');
    } else if (spaceTop >= tooltipHeight) {
      setCalculatedPosition('top');
    } else if (spaceRight >= tooltipWidth) {
      setCalculatedPosition('right');
    } else if (spaceLeft >= tooltipWidth) {
      setCalculatedPosition('left');
    } else {
      setCalculatedPosition('bottom');
    }
  };

  const trackTooltipView = async () => {
    if (!userId) return;

    try {
      const { data: existing } = await supabase
        .from('help_tooltip_views')
        .select('id, view_count')
        .eq('user_id', userId)
        .eq('tooltip_id', tooltipId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('help_tooltip_views')
          .update({
            view_count: existing.view_count + 1,
            last_viewed_at: new Date().toISOString()
          })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('help_tooltip_views')
          .insert({
            user_id: userId,
            tooltip_id: tooltipId,
            view_count: 1,
            first_viewed_at: new Date().toISOString(),
            last_viewed_at: new Date().toISOString()
          });
      }
    } catch (error) {
      console.error('Error tracking tooltip view:', error);
    }
  };

  const handleShow = () => {
    if (disabled || !showTooltips) return;

    if (isMobile) {
      setIsVisible(true);
      trackTooltipView();
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setIsVisible(true);
        trackTooltipView();
      }, 300);
    }
  };

  const handleHide = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (!isMobile) {
      timeoutRef.current = setTimeout(() => {
        setIsVisible(false);
      }, 200);
    }
  };

  const handleToggle = () => {
    if (disabled || !showTooltips) return;

    if (isMobile) {
      if (isVisible) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
        trackTooltipView();
      }
    }
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (
      tooltipRef.current &&
      triggerRef.current &&
      !tooltipRef.current.contains(event.target as Node) &&
      !triggerRef.current.contains(event.target as Node)
    ) {
      setIsVisible(false);
    }
  };

  const handleEscKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsVisible(false);
    }
  };

  if (!showTooltips && !disabled) {
    return children ? <>{children}</> : null;
  }

  const getPositionStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      position: 'absolute',
      maxWidth: `${maxWidth}px`,
      zIndex: 9999,
    };

    const actualPosition = position === 'auto' ? calculatedPosition : position;

    switch (actualPosition) {
      case 'top':
        return { ...baseStyles, bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '8px' };
      case 'bottom':
        return { ...baseStyles, top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '8px' };
      case 'left':
        return { ...baseStyles, right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: '8px' };
      case 'right':
        return { ...baseStyles, left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: '8px' };
      default:
        return { ...baseStyles, top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '8px' };
    }
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <div
        ref={triggerRef}
        onMouseEnter={!isMobile ? handleShow : undefined}
        onMouseLeave={!isMobile ? handleHide : undefined}
        onClick={isMobile ? handleToggle : undefined}
        className="inline-flex items-center cursor-help"
      >
        {children ? (
          children
        ) : (
          showIcon && (
            <HelpCircle
              size={iconSize}
              className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
              style={{ color: isVisible ? colors.primary : undefined }}
            />
          )
        )}
      </div>

      {isVisible && (
        <div
          ref={tooltipRef}
          style={getPositionStyles()}
          className="animate-fade-in"
          onMouseEnter={!isMobile ? handleShow : undefined}
          onMouseLeave={!isMobile ? handleHide : undefined}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
            style={{ borderColor: colors.border }}
          >
            {title && (
              <div
                className="px-4 py-3 font-semibold text-white flex items-center justify-between"
                style={{ background: colors.gradient }}
              >
                <span>{title}</span>
                {isMobile && (
                  <button
                    onClick={() => setIsVisible(false)}
                    className="text-white hover:text-gray-200 transition-colors"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            )}
            <div className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {typeof content === 'string' ? (
                <p>{content}</p>
              ) : (
                content
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
