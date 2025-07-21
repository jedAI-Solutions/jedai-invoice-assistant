-- Entferne alle doppelten Buchungen und behalte nur die neueste Version
-- (basierend auf der created_at Zeit)

DELETE FROM buchungshistorie 
WHERE buchung_id NOT IN (
  SELECT DISTINCT ON (buchungsdatum, betrag, buchungstext, konto) buchung_id
  FROM buchungshistorie 
  ORDER BY buchungsdatum, betrag, buchungstext, konto, created_at DESC
);

-- Auch doppelte Export Queue Einträge entfernen
DELETE FROM export_queue 
WHERE export_id NOT IN (
  SELECT DISTINCT ON (buchung_id) export_id
  FROM export_queue 
  ORDER BY buchung_id, created_at DESC
);