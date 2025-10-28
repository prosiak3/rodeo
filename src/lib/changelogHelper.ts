/**
 * Changelog Helper - Automatyczne logowanie zmian w systemie
 *
 * Ten moduł odpowiada za automatyczne dodawanie wpisów do changelogu.
 * Przy każdym zalogowaniu admina, system sprawdza listę zmian i dodaje
 * nowe wpisy do bazy danych, unikając duplikatów.
 *
 * @module changelogHelper
 */

import { supabase } from './supabase';

/**
 * Struktura wpisu changelog
 */
interface ChangelogEntryInput {
  version: string;  // Semantic versioning (np. "1.6.0")
  title: string;    // Krótki tytuł zmiany
  description: string;  // Szczegółowy opis
  category: 'feature' | 'improvement' | 'bugfix' | 'breaking' | 'security';
  file_references?: string[];  // Odnośniki do kodu (np. "src/file.ts:123")
}

/**
 * Dodaje pojedynczy wpis do changelogu
 *
 * @param entry - Dane wpisu do dodania
 * @returns Promise<boolean> - true jeśli sukces, false jeśli błąd
 */
export async function addChangelogEntry(entry: ChangelogEntryInput) {
  try {
    const { error } = await supabase
      .from('changelog_entries')
      .insert([{
        version: entry.version,
        title: entry.title,
        description: entry.description,
        category: entry.category,
        file_references: entry.file_references || [],
        release_date: new Date().toISOString(),
        order_index: 0
      }]);

    if (error) {
      console.error('Error adding changelog entry:', error);
      return false;
    }

    console.log('✅ Changelog entry added:', entry.title);
    return true;
  } catch (error) {
    console.error('Exception adding changelog entry:', error);
    return false;
  }
}

/**
 * Automatycznie loguje ostatnie zmiany do changelogu
 *
 * Funkcja jest wywoływana przy zalogowaniu admina (App.tsx).
 * Sprawdza czy wpisy już istnieją w bazie (po version + title)
 * i dodaje tylko nowe wpisy.
 *
 * Aby dodać nową zmianę:
 * 1. Dodaj wpis na początku tablicy entries (zachowaj kolejność chronologiczną)
 * 2. Wypełnij wszystkie pola: version, title, description, category, file_references
 * 3. System automatycznie doda wpis przy następnym logowaniu admina
 *
 * @returns Promise<number> - liczba dodanych wpisów
 */
export async function logRecentChanges() {
  const entries: ChangelogEntryInput[] = [
    {
      version: '1.6.1',
      title: 'Automatyczne logowanie zmian do Changelog',
      description: 'Dodano funkcję automatycznego dodawania wpisów do changelogu po każdym uruchomieniu aplikacji przez admina. System sprawdza czy wpis już istnieje i dodaje tylko nowe wpisy. Helper function zawiera szczegółowe opisy zmian z odnośnikami do kodu.',
      category: 'improvement',
      file_references: [
        'src/lib/changelogHelper.ts:40-115',
        'src/App.tsx:22',
        'src/App.tsx:106-111'
      ]
    },
    {
      version: '1.6.0',
      title: 'System Changelog z automatycznym logowaniem',
      description: 'Dodano kompletny system changelogu z automatycznym dodawaniem wpisów po wprowadzonych zmianach. System grupuje wpisy po wersjach, pokazuje kategorie zmian i odnośniki do kodu.',
      category: 'feature',
      file_references: [
        'src/components/ChangelogPanel.tsx',
        'src/lib/changelogHelper.ts',
        'supabase/migrations/20251028220000_add_changelog_system.sql'
      ]
    },
    {
      version: '1.5.1',
      title: 'Komunikat "Dodano do notatnika" - preferencje użytkownika',
      description: 'Dodano ustawienie w profilu użytkownika oraz w panelu admina pozwalające włączyć/wyłączyć wyświetlanie komunikatu toast po dodaniu produktu do notatnika.',
      category: 'feature',
      file_references: [
        'src/components/PriceList.tsx:544-548',
        'src/components/ProfileScreen.tsx:1266-1287',
        'src/components/SystemSettings.tsx:456-486',
        'supabase/migrations/20251028215000_add_show_notebook_toast_preference.sql'
      ]
    },
    {
      version: '1.5.0',
      title: 'Zmiana terminologii "Szkic" na "Koszyk"',
      description: 'Zmieniono nazwę statusu zamówienia ze "Szkic" na "Koszyk" w całej aplikacji dla lepszej intuicyjności i zrozumiałości dla użytkowników. Aktualizacja obejmuje wszystkie komponenty, etykiety przycisków i komunikaty.',
      category: 'improvement',
      file_references: [
        'src/components/OrdersList.tsx:16',
        'src/components/OrderDetails.tsx:553-554',
        'src/components/PriceListOrderScreen.tsx:281',
        'src/components/PriceListOrderListMode.tsx:241',
        'src/components/EditDraftOrderScreen.tsx:455',
        'src/components/VoiceOrderScreen.tsx:1157',
        'src/components/AutoOrderScreen.tsx:270',
        'src/components/CopyOrderScreen.tsx:191',
        'src/components/ProfileScreen.tsx:885',
        'src/components/SystemSettings.tsx:363',
        'src/hooks/useKeyboardShortcuts.tsx:96'
      ]
    },
    {
      version: '1.5.0',
      title: 'Animacja toast message dla komunikatów',
      description: 'Dodano płynną animację fade-in-out dla komunikatów toast wyświetlanych po dodaniu produktu do notatnika. Komunikat pojawia się na górze ekranu przez 2 sekundy z zielonym tłem i ikoną checkmark.',
      category: 'improvement',
      file_references: [
        'src/index.css:127-144',
        'src/components/PriceList.tsx:600-609'
      ]
    }
  ];

  let successCount = 0;

  for (const entry of entries) {
    // Sprawdź czy wpis już istnieje
    const { data: existing } = await supabase
      .from('changelog_entries')
      .select('id')
      .eq('version', entry.version)
      .eq('title', entry.title)
      .maybeSingle();

    if (!existing) {
      const success = await addChangelogEntry(entry);
      if (success) successCount++;
    }
  }

  console.log(`✅ Added ${successCount} new changelog entries`);
  return successCount;
}
