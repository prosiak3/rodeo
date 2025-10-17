#!/bin/bash

# Skrypt przywracania backupu aplikacji RODEO
# Użycie: ./restore-backup.sh <ścieżka-do-backupu.tar.gz>

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

if [ $# -eq 0 ]; then
    echo -e "${RED}Błąd: Nie podano ścieżki do backupu${NC}"
    echo "Użycie: $0 <ścieżka-do-backupu.tar.gz>"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}Błąd: Plik $BACKUP_FILE nie istnieje${NC}"
    exit 1
fi

echo -e "${GREEN}=== Przywracanie backupu aplikacji RODEO ===${NC}"
echo ""
echo "Backup: $BACKUP_FILE"
echo ""

# Sprawdź czy katalog project już istnieje
if [ -d "project" ]; then
    echo -e "${YELLOW}UWAGA: Katalog 'project' już istnieje!${NC}"
    read -p "Czy chcesz utworzyć backup istniejącego katalogu? (t/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Tt]$ ]]; then
        EXISTING_BACKUP="project-before-restore-$(date +%Y%m%d-%H%M%S).tar.gz"
        echo "Tworzenie backupu istniejącego katalogu..."
        tar -czf "$EXISTING_BACKUP" --exclude='node_modules' --exclude='dist' project/
        echo -e "${GREEN}Backup zapisany jako: $EXISTING_BACKUP${NC}"
    fi

    read -p "Czy chcesz usunąć istniejący katalog i przywrócić backup? (t/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Tt]$ ]]; then
        echo "Anulowano przywracanie backupu"
        exit 0
    fi

    echo "Usuwanie istniejącego katalogu..."
    rm -rf project
fi

# Rozpakuj backup
echo "Rozpakowywanie backupu..."
tar -xzf "$BACKUP_FILE"

if [ ! -d "project" ]; then
    echo -e "${RED}Błąd: Katalog 'project' nie został utworzony po rozpakowaniu${NC}"
    exit 1
fi

cd project

echo -e "${GREEN}Backup rozpakowany pomyślnie!${NC}"
echo ""

# Sprawdź czy .env istnieje
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}UWAGA: Plik .env nie został znaleziony!${NC}"
    echo "Tworzenie pliku .env z przykładowymi wartościami..."
    cat > .env << 'EOF'
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Zastąp powyższe wartości danymi z twojego projektu Supabase:
# 1. Wejdź na https://app.supabase.com
# 2. Wybierz swój projekt
# 3. Przejdź do Settings > API
# 4. Skopiuj URL i anon key
EOF
    echo -e "${RED}WAŻNE: Musisz edytować plik .env i uzupełnić dane Supabase!${NC}"
fi

# Instaluj zależności
echo ""
read -p "Czy chcesz zainstalować zależności npm? (t/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Tt]$ ]]; then
    echo "Instalowanie zależności..."
    npm install
    echo -e "${GREEN}Zależności zainstalowane!${NC}"
fi

echo ""
echo -e "${GREEN}=== Przywracanie zakończone ===${NC}"
echo ""
echo "Następne kroki:"
echo "1. Edytuj plik .env i uzupełnij dane Supabase"
echo "2. Przywróć bazę danych:"
echo "   - Wykonaj migracje z folderu supabase/migrations/"
echo "   - W kolejności alfabetycznej przez Supabase Dashboard"
echo "3. Uruchom aplikację:"
echo "   npm run dev (development)"
echo "   npm run build && npm run preview (production)"
echo ""
echo "Dokumentacja: ./BACKUP_INFO.md"
