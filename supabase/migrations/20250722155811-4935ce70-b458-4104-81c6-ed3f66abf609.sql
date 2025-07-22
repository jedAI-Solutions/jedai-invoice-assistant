-- Erstelle eine RPC-Funktion für Zugriff auf agenda.mandantenstammdaten
CREATE OR REPLACE FUNCTION public.get_mandantenstammdaten()
RETURNS TABLE(name1 text, mandant_nr text)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT name1::text, mandant_nr::text 
  FROM agenda.mandantenstammdaten 
  WHERE name1 IS NOT NULL 
  ORDER BY name1;
$$;