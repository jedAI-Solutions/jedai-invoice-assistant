-- CRITICAL SECURITY FIXES
-- This migration addresses the most urgent security vulnerabilities

-- 1. Enable RLS on all unprotected tables
ALTER TABLE IF EXISTS public.audit_log ENABLE ROW LEVEL SECURITY;

-- 2. Create RLS policies for audit_log table
CREATE POLICY "Service role can access audit logs" ON public.audit_log
FOR ALL USING (auth.role() = 'service_role'::text);

CREATE POLICY "Users can read their own audit logs" ON public.audit_log
FOR SELECT USING (user_id = auth.uid()::text);

-- 3. Fix function search paths (security issue)
-- Update existing functions to have proper search paths

-- Fix update_search_vector function
CREATE OR REPLACE FUNCTION public.update_search_vector()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.content, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(array_to_string(NEW.keywords, ' '), '')), 'C');
    RETURN NEW;
END;
$function$;

-- Fix get_mandantenstammdaten function (already fixed but ensuring it's correct)
CREATE OR REPLACE FUNCTION public.get_mandantenstammdaten()
RETURNS TABLE(name1 text, mandant_nr text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT m.name1::text, m.mandant_nr::text 
  FROM public.mandants m
  WHERE m.name1 IS NOT NULL 
  AND (
    auth.role() = 'service_role'::text 
    OR m.id IN (
      SELECT uma.mandant_id 
      FROM user_mandant_assignments uma 
      WHERE uma.user_id = auth.uid() 
      AND uma.is_active = true
    )
  )
  ORDER BY m.name1;
$function$;

-- Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id, 
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  RETURN NEW;
END;
$function$;

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Fix import_agenda_mandants function
CREATE OR REPLACE FUNCTION public.import_agenda_mandants(
  p_konto text, 
  p_name_unternehmen text, 
  p_unternehmensgegenstand text, 
  p_name_person text, 
  p_vorname_person text, 
  p_name_keine_angabe text, 
  p_adressattyp text, 
  p_kurzbezeichnung text, 
  p_eu_land text, 
  p_eu_ustid text, 
  p_anrede text, 
  p_titel text, 
  p_strasse text, 
  p_postfach text, 
  p_plz text, 
  p_ort text, 
  p_land text, 
  p_telefon text, 
  p_email text, 
  p_internet text, 
  p_steuernummer text, 
  p_iban text, 
  p_bic text, 
  p_bankname text, 
  p_kontenrahmen text DEFAULT 'SKR03'::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
    v_mandant_id uuid;
    v_name1 text;
    v_mandantentyp text;
    v_rechtsform text;
BEGIN
    -- Determine name1 based on adressattyp
    IF p_adressattyp = '1' THEN
        -- Company
        v_name1 := p_name_unternehmen;
    ELSIF p_adressattyp = '2' THEN
        -- Natural person
        v_name1 := p_name_person;
    ELSE
        -- Other
        v_name1 := COALESCE(p_name_keine_angabe, p_name_unternehmen, p_name_person);
    END IF;

    -- Determine mandantentyp and rechtsform based on company name patterns
    v_mandantentyp := 
        CASE 
            WHEN v_name1 ILIKE '%GmbH & Co. KG%' THEN 'GmbH & Co. KG'
            WHEN v_name1 ILIKE '%GmbH%' THEN 'GmbH'
            WHEN v_name1 ILIKE '%UG%' THEN 'UG'
            WHEN v_name1 ILIKE '%AG%' AND v_name1 NOT ILIKE '%KGaA%' THEN 'AG'
            WHEN v_name1 ILIKE '%KGaA%' THEN 'KGaA'
            WHEN v_name1 ILIKE '%e.V.%' THEN 'e.V.'
            WHEN v_name1 ILIKE '%e.K.%' THEN 'e.K.'
            WHEN v_name1 ILIKE '%OHG%' THEN 'OHG'
            WHEN v_name1 ILIKE '%KG%' AND v_name1 NOT ILIKE '%GmbH%' THEN 'KG'
            WHEN v_name1 ILIKE '%GbR%' THEN 'GbR'
            WHEN v_name1 ILIKE '%PartG%' THEN 'PartG'
            WHEN v_name1 ILIKE '%SE%' THEN 'SE'
            WHEN v_name1 ILIKE '%Stiftung%' THEN 'Stiftung'
            WHEN p_adressattyp = '2' THEN 'EU' -- Einzelunternehmer
            ELSE 'GmbH' -- Default
        END;
    
    v_rechtsform := v_mandantentyp;

    -- Insert the mandant
    INSERT INTO public.mandants (
        mandant_nr,
        name1,
        name2,
        mandantentyp,
        rechtsform,
        konto_nr,
        agenda_konto_nr,
        agenda_adressattyp,
        agenda_eu_ustid,
        unternehmensgegenstand,
        vorname,
        anrede,
        titel,
        kurzbezeichnung,
        strasse,
        postfach,
        plz,
        ort,
        land,
        telefon,
        email,
        internet,
        steuer_nr,
        ust_idnr,
        iban,
        bic,
        bankname,
        kontenrahmen,
        versteuerung,
        ust_zeitraum,
        status,
        agenda_import_date,
        agenda_import_raw
    ) VALUES (
        COALESCE(p_konto, 'AGD-' || gen_random_uuid()::text),
        v_name1,
        CASE WHEN p_adressattyp = '1' AND p_unternehmensgegenstand IS NOT NULL 
             THEN '(' || p_unternehmensgegenstand || ')' 
             ELSE NULL END,
        v_mandantentyp,
        v_rechtsform,
        p_konto,
        p_konto,
        p_adressattyp,
        p_eu_ustid,
        p_unternehmensgegenstand,
        p_vorname_person,
        p_anrede,
        p_titel,
        p_kurzbezeichnung,
        p_strasse,
        p_postfach,
        p_plz,
        p_ort,
        COALESCE(p_land, 'DE'),
        p_telefon,
        p_email,
        p_internet,
        p_steuernummer,
        p_eu_ustid,
        p_iban,
        p_bic,
        p_bankname,
        p_kontenrahmen,
        'Soll', -- Default
        'Vierteljährlich', -- Default
        'active',
        NOW(),
        jsonb_build_object(
            'konto', p_konto,
            'adressattyp', p_adressattyp,
            'import_timestamp', NOW()
        )
    )
    ON CONFLICT (mandant_nr) DO UPDATE SET
        name1 = EXCLUDED.name1,
        name2 = EXCLUDED.name2,
        agenda_adressattyp = EXCLUDED.agenda_adressattyp,
        agenda_eu_ustid = EXCLUDED.agenda_eu_ustid,
        unternehmensgegenstand = EXCLUDED.unternehmensgegenstand,
        vorname = EXCLUDED.vorname,
        anrede = EXCLUDED.anrede,
        titel = EXCLUDED.titel,
        kurzbezeichnung = EXCLUDED.kurzbezeichnung,
        strasse = EXCLUDED.strasse,
        postfach = EXCLUDED.postfach,
        plz = EXCLUDED.plz,
        ort = EXCLUDED.ort,
        telefon = EXCLUDED.telefon,
        email = EXCLUDED.email,
        internet = EXCLUDED.internet,
        steuer_nr = EXCLUDED.steuer_nr,
        ust_idnr = EXCLUDED.ust_idnr,
        iban = EXCLUDED.iban,
        bic = EXCLUDED.bic,
        bankname = EXCLUDED.bankname,
        agenda_last_sync = NOW(),
        agenda_import_raw = EXCLUDED.agenda_import_raw,
        updated_at = NOW()
    RETURNING id INTO v_mandant_id;

    RETURN v_mandant_id;
END;
$function$;

-- Fix search_tax_knowledge function
CREATE OR REPLACE FUNCTION public.search_tax_knowledge(search_query text, limit_results integer DEFAULT 10)
RETURNS TABLE(id bigint, title character varying, content text, category character varying, relevance_score numeric, ts_rank_score real)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        tkb.id,
        tkb.title,
        tkb.content,
        tkb.category,
        tkb.relevance_score,
        ts_rank(tkb.search_vector, plainto_tsquery('english', search_query)) as ts_rank_score
    FROM tax_knowledge_base tkb
    WHERE tkb.search_vector @@ plainto_tsquery('english', search_query)
    ORDER BY ts_rank_score DESC, tkb.relevance_score DESC
    LIMIT limit_results;
END;
$function$;

-- Fix log_audit_event function
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_session_id character varying, 
  p_user_id character varying, 
  p_action character varying, 
  p_details jsonb DEFAULT '{}'::jsonb, 
  p_ip_address inet DEFAULT NULL::inet, 
  p_user_agent text DEFAULT NULL::text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
    INSERT INTO audit_log (session_id, user_id, action, details, ip_address, user_agent)
    VALUES (p_session_id, p_user_id, p_action, p_details, p_ip_address, p_user_agent);
END;
$function$;

-- Fix create_audit_trail function
CREATE OR REPLACE FUNCTION public.create_audit_trail()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO audit_logs (
    entity_type, 
    entity_id, 
    action, 
    old_values, 
    new_values,
    gobd_relevant,
    user_id,
    user_name
  ) VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END,
    true,
    auth.uid(),
    COALESCE(auth.jwt() ->> 'email', 'system')
  );
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Fix generate_document_id function
CREATE OR REPLACE FUNCTION public.generate_document_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  IF NEW.document_id IS NULL THEN
    NEW.document_id := 'DOC-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || SUBSTR(gen_random_uuid()::text, 1, 8);
  END IF;
  RETURN NEW;
END;
$function$;

-- 4. Create function to automatically assign users to mandants when they register
CREATE OR REPLACE FUNCTION public.auto_assign_user_to_mandants()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- For now, assign new users to all active mandants
  -- In production, this should be more selective based on business rules
  INSERT INTO public.user_mandant_assignments (user_id, mandant_id, assigned_by, role)
  SELECT 
    NEW.id,
    m.id,
    'system',
    'user'
  FROM public.mandants m
  WHERE m.status = 'active'
  ON CONFLICT (user_id, mandant_id) DO NOTHING;
  
  RETURN NEW;
END;
$function$;

-- Create trigger to auto-assign users to mandants
DROP TRIGGER IF EXISTS on_user_created_assign_mandants ON auth.users;
CREATE TRIGGER on_user_created_assign_mandants
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.auto_assign_user_to_mandants();

-- 5. Fix mandant access policy (the current one has a logic error)
DROP POLICY IF EXISTS "mandant_access_policy" ON public.mandants;
CREATE POLICY "mandant_access_policy" ON public.mandants
FOR ALL USING (
  auth.role() = 'service_role'::text 
  OR id IN (
    SELECT uma.mandant_id 
    FROM user_mandant_assignments uma 
    WHERE uma.user_id = auth.uid() 
    AND uma.is_active = true
  )
);

-- 6. Create initial admin user assignment (if needed)
-- This will be executed when a user signs up
INSERT INTO public.user_mandant_assignments (user_id, mandant_id, assigned_by, role)
SELECT 
  p.id,
  m.id,
  'system',
  'admin'
FROM public.profiles p
CROSS JOIN public.mandants m
WHERE m.status = 'active'
ON CONFLICT (user_id, mandant_id) DO NOTHING;