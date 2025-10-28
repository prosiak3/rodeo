import { useEffect } from 'react';

/**
 * useKeyboardShortcuts - Hook do obsługi skrótów klawiszowych
 *
 * Funkcjonalność:
 * - Nasłuchuje kombinacji klawiszy (Ctrl/Cmd + klawisz)
 * - Zapobiega domyślnej akcji przeglądarki
 * - Działa tylko gdy nie ma aktywnego inputa (nie przeszkadza w pisaniu)
 * - Obsługuje zarówno Ctrl (Windows/Linux) jak i Cmd (Mac)
 *
 * Użycie:
 * useKeyboardShortcuts({
 *   'n': () => console.log('Ctrl+N pressed'),
 *   's': () => console.log('Ctrl+S pressed'),
 * });
 */

type ShortcutHandler = () => void;
type ShortcutMap = Record<string, ShortcutHandler>;

interface UseKeyboardShortcutsOptions {
  enabled?: boolean; // Czy skróty są włączone
  ignoreInputs?: boolean; // Czy ignorować gdy focus jest na input/textarea
}

export default function useKeyboardShortcuts(
  shortcuts: ShortcutMap,
  options: UseKeyboardShortcutsOptions = {}
) {
  const { enabled = true, ignoreInputs = true } = options;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Sprawdź czy Ctrl (Windows/Linux) lub Cmd (Mac) jest wciśnięty
      const isModifierPressed = event.ctrlKey || event.metaKey;

      if (!isModifierPressed) return;

      // Sprawdź czy focus jest na elemencie input/textarea
      if (ignoreInputs) {
        const activeElement = document.activeElement;
        const isInput =
          activeElement instanceof HTMLInputElement ||
          activeElement instanceof HTMLTextAreaElement ||
          activeElement?.getAttribute('contenteditable') === 'true';

        if (isInput) return;
      }

      // Pobierz klawisz (lowercase)
      const key = event.key.toLowerCase();

      // Sprawdź czy mamy handler dla tego skrótu
      if (shortcuts[key]) {
        event.preventDefault(); // Zapobiegnij domyślnej akcji przeglądarki
        shortcuts[key]();
      }
    };

    // Dodaj event listener
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts, enabled, ignoreInputs]);
}

/**
 * Przykładowe użycie w komponencie:
 *
 * function MyComponent() {
 *   const navigate = useNavigate();
 *
 *   useKeyboardShortcuts({
 *     'n': () => navigate('/new-order'),           // Ctrl+N - Nowe zamówienie
 *     's': () => handleSave(),                     // Ctrl+S - Zapisz
 *     'p': () => navigate('/profile'),             // Ctrl+P - Profil
 *     'h': () => navigate('/'),                    // Ctrl+H - Home
 *     'o': () => navigate('/orders'),              // Ctrl+O - Orders
 *     'escape': () => setModalOpen(false),         // ESC - Zamknij modal
 *   });
 *
 *   return <div>...</div>;
 * }
 */

/**
 * Dostępne skróty w aplikacji RODEO:
 *
 * Ctrl/Cmd + N - Nowe zamówienie
 * Ctrl/Cmd + S - Zapisz do koszyka
 * Ctrl/Cmd + H - Home
 * Ctrl/Cmd + O - Lista zamówień
 * Ctrl/Cmd + P - Profil
 * Ctrl/Cmd + C - Cennik
 * Ctrl/Cmd + A - Admin panel (tylko dla adminów)
 * ESC - Zamknij modal/dialog
 */
