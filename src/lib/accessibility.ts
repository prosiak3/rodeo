/**
 * accessibility.ts - Utilities dla lepszej dostępności (a11y)
 *
 * Funkcjonalność:
 * - Helper functions dla ARIA attributes
 * - Keyboard navigation helpers
 * - Screen reader utilities
 * - Focus management
 */

/**
 * Generuj unique ID dla ARIA
 */
export function generateAriaId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * ARIA attributes dla button
 */
export function getButtonAriaProps(
  label: string,
  options?: {
    pressed?: boolean;
    expanded?: boolean;
    controls?: string;
    disabled?: boolean;
    describedBy?: string;
  }
) {
  return {
    'aria-label': label,
    'aria-pressed': options?.pressed,
    'aria-expanded': options?.expanded,
    'aria-controls': options?.controls,
    'aria-disabled': options?.disabled,
    'aria-describedby': options?.describedBy,
    role: 'button',
  };
}

/**
 * ARIA attributes dla navigation
 */
export function getNavAriaProps(label: string, current?: boolean) {
  return {
    'aria-label': label,
    'aria-current': current ? 'page' : undefined,
    role: 'navigation',
  };
}

/**
 * ARIA attributes dla form field
 */
export function getFormFieldAriaProps(
  label: string,
  options?: {
    required?: boolean;
    invalid?: boolean;
    describedBy?: string;
    errorMessage?: string;
  }
) {
  return {
    'aria-label': label,
    'aria-required': options?.required,
    'aria-invalid': options?.invalid,
    'aria-describedby': options?.describedBy,
    'aria-errormessage': options?.errorMessage,
  };
}

/**
 * ARIA attributes dla list
 */
export function getListAriaProps(label: string, itemCount?: number) {
  return {
    'aria-label': label,
    'aria-live': 'polite' as const,
    'aria-atomic': 'false',
    role: 'list',
    ...(itemCount !== undefined && { 'aria-setsize': itemCount }),
  };
}

/**
 * ARIA attributes dla dialog/modal
 */
export function getDialogAriaProps(
  labelledBy: string,
  describedBy?: string,
  modal: boolean = true
) {
  return {
    role: 'dialog',
    'aria-labelledby': labelledBy,
    'aria-describedby': describedBy,
    'aria-modal': modal,
  };
}

/**
 * Announce message dla screen readers
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Focus trap dla modali
 */
export function createFocusTrap(element: HTMLElement): () => void {
  const focusableElements = element.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    }
  };

  element.addEventListener('keydown', handleKeyDown);

  // Focus first element
  firstElement?.focus();

  // Cleanup
  return () => {
    element.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Check if reduced motion is preferred
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Screen reader only text (visually hidden but accessible)
 */
export const srOnlyClass = 'sr-only';

// Dodaj do index.css:
// .sr-only {
//   position: absolute;
//   width: 1px;
//   height: 1px;
//   padding: 0;
//   margin: -1px;
//   overflow: hidden;
//   clip: rect(0, 0, 0, 0);
//   white-space: nowrap;
//   border-width: 0;
// }
