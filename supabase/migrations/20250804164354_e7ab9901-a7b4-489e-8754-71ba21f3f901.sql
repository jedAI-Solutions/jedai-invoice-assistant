-- Fix remaining RLS issues and security vulnerabilities

-- Create the missing user_mandant_assignments table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_mandant_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  mandant_id uuid REFERENCES public.mandants(id) ON DELETE CASCADE NOT NULL,
  access_level text NOT NULL DEFAULT 'read',
  is_active boolean NOT NULL DEFAULT true,
  assigned_at timestamp with time zone NOT NULL DEFAULT now(),
  assigned_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, mandant_id)
);

-- Enable RLS on user_mandant_assignments
ALTER TABLE public.user_mandant_assignments ENABLE ROW LEVEL SECURITY;

-- Create policy for user_mandant_assignments
DROP POLICY IF EXISTS user_assignment_access_policy ON public.user_mandant_assignments;
CREATE POLICY user_assignment_access_policy ON public.user_mandant_assignments
FOR ALL
USING (
  auth.role() = 'service_role'::text 
  OR user_id = auth.uid()
);

-- Fix remaining search_path issues for security definer functions
CREATE OR REPLACE FUNCTION public.search_tax_knowledge(search_query text, limit_results integer DEFAULT 10)
 RETURNS TABLE(id bigint, title character varying, content text, category character varying, relevance_score numeric, ts_rank_score real)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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

CREATE OR REPLACE FUNCTION public.log_audit_event(p_session_id character varying, p_user_id character varying, p_action character varying, p_details jsonb DEFAULT '{}'::jsonb, p_ip_address inet DEFAULT NULL::inet, p_user_agent text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    INSERT INTO audit_log (session_id, user_id, action, details, ip_address, user_agent)
    VALUES (p_session_id, p_user_id, p_action, p_details, p_ip_address, p_user_agent);
END;
$function$;

-- Create a safe version of import_agenda_mandants with proper search_path
CREATE OR REPLACE FUNCTION public.import_agenda_mandants(p_konto text, p_name_unternehmen text, p_unternehmensgegenstand text, p_name_person text, p_vorname_person text, p_name_keine_angabe text, p_adressattyp text, p_kurzbezeichnung text, p_eu_land text, p_eu_ustid text, p_anrede text, p_titel text, p_strasse text, p_postfach text, p_plz text, p_ort text, p_land text, p_telefon text, p_email text, p_internet text, p_steuernummer text, p_iban text, p_bic text, p_bankname text, p_kontenrahmen text DEFAULT 'SKR03'::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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