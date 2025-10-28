/*
  # Przeniesienie rozszerzenia pg_trgm z public do extensions schema
  
  1. Problem
    - Rozszerzenie pg_trgm jest w schemacie public
    - Rekomendacja Supabase: rozszerzenia powinny być w osobnym schemacie
    
  2. Rozwiązanie
    - Utwórz schemat extensions jeśli nie istnieje
    - Przenieś rozszerzenie pg_trgm do extensions
*/

-- Utwórz schemat extensions jeśli nie istnieje
CREATE SCHEMA IF NOT EXISTS extensions;

-- Przenieś rozszerzenie do schematu extensions
ALTER EXTENSION pg_trgm SET SCHEMA extensions;

-- Upewnij się, że search_path zawiera extensions
ALTER DATABASE postgres SET search_path TO public, extensions;