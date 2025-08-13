-- Fix Security Issues: Enable RLS on tables and remove any problematic views

-- First, let's check if any views exist with SECURITY DEFINER and drop them if they do
DO $$
DECLARE
    view_record RECORD;
BEGIN
    -- Drop any views that might have SECURITY DEFINER (if they exist)
    FOR view_record IN 
        SELECT viewname 
        FROM pg_views 
        WHERE schemaname = 'public' 
        AND definition ILIKE '%SECURITY DEFINER%'
    LOOP
        EXECUTE 'DROP VIEW IF EXISTS public.' || quote_ident(view_record.viewname);
        RAISE NOTICE 'Dropped SECURITY DEFINER view: %', view_record.viewname;
    END LOOP;
END $$;

-- Enable RLS on tables that currently don't have it
ALTER TABLE IF EXISTS public.tax_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tax_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tax_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tax_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tax_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tax_sessions (if the table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tax_sessions') THEN
        -- Service role can access all
        CREATE POLICY "Service role can access tax sessions" 
        ON public.tax_sessions 
        FOR ALL 
        USING (auth.role() = 'service_role');
        
        -- Users can access their own sessions
        CREATE POLICY "Users can access their own tax sessions" 
        ON public.tax_sessions 
        FOR ALL 
        USING (auth.uid()::text = user_id);
    END IF;
EXCEPTION WHEN duplicate_object THEN
    NULL; -- Policy already exists
END $$;

-- Create RLS policies for tax_responses (if the table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tax_responses') THEN
        -- Service role can access all
        CREATE POLICY "Service role can access tax responses" 
        ON public.tax_responses 
        FOR ALL 
        USING (auth.role() = 'service_role');
        
        -- Users can access responses for their sessions
        CREATE POLICY "Users can access their own tax responses" 
        ON public.tax_responses 
        FOR ALL 
        USING (session_id IN (
            SELECT session_id FROM public.tax_sessions WHERE user_id = auth.uid()::text
        ));
    END IF;
EXCEPTION WHEN duplicate_object THEN
    NULL; -- Policy already exists
END $$;

-- Create RLS policies for tax_documents (if the table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tax_documents') THEN
        -- Service role can access all
        CREATE POLICY "Service role can access tax documents" 
        ON public.tax_documents 
        FOR ALL 
        USING (auth.role() = 'service_role');
        
        -- Users can access documents for their sessions
        CREATE POLICY "Users can access their own tax documents" 
        ON public.tax_documents 
        FOR ALL 
        USING (session_id IN (
            SELECT session_id FROM public.tax_sessions WHERE user_id = auth.uid()::text
        ));
    END IF;
EXCEPTION WHEN duplicate_object THEN
    NULL; -- Policy already exists
END $$;

-- Create RLS policies for tax_calculations (if the table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tax_calculations') THEN
        -- Service role can access all
        CREATE POLICY "Service role can access tax calculations" 
        ON public.tax_calculations 
        FOR ALL 
        USING (auth.role() = 'service_role');
        
        -- Users can access calculations for their sessions
        CREATE POLICY "Users can access their own tax calculations" 
        ON public.tax_calculations 
        FOR ALL 
        USING (session_id IN (
            SELECT session_id FROM public.tax_sessions WHERE user_id = auth.uid()::text
        ));
    END IF;
EXCEPTION WHEN duplicate_object THEN
    NULL; -- Policy already exists
END $$;

-- Create RLS policies for tax_knowledge_base (if the table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tax_knowledge_base') THEN
        -- Service role can access all
        CREATE POLICY "Service role can access tax knowledge base" 
        ON public.tax_knowledge_base 
        FOR ALL 
        USING (auth.role() = 'service_role');
        
        -- All authenticated users can read public knowledge
        CREATE POLICY "Authenticated users can read tax knowledge base" 
        ON public.tax_knowledge_base 
        FOR SELECT 
        USING (auth.role() = 'authenticated');
    END IF;
EXCEPTION WHEN duplicate_object THEN
    NULL; -- Policy already exists
END $$;

-- Create RLS policies for user_preferences (if the table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_preferences') THEN
        -- Service role can access all
        CREATE POLICY "Service role can access user preferences" 
        ON public.user_preferences 
        FOR ALL 
        USING (auth.role() = 'service_role');
        
        -- Users can access their own preferences
        CREATE POLICY "Users can access their own preferences" 
        ON public.user_preferences 
        FOR ALL 
        USING (auth.uid() = user_id);
    END IF;
EXCEPTION WHEN duplicate_object THEN
    NULL; -- Policy already exists
END $$;

-- Recreate the existing views without SECURITY DEFINER (they should use SECURITY INVOKER by default)
-- This ensures they use the querying user's permissions, not the view creator's

-- Recreate mandant_public_view with proper security
CREATE OR REPLACE VIEW public.mandant_public_view AS
SELECT 
    id,
    mandant_nr,
    name1,
    name2,
    mandantentyp,
    strasse,
    plz,
    ort,
    land,
    telefon,
    rechtsform,
    kontenrahmen,
    versteuerung,
    status,
    created_at,
    updated_at
FROM mandants
WHERE status = 'active';

-- Recreate mandant_summary view with proper security
CREATE OR REPLACE VIEW public.mandant_summary AS
SELECT 
    m.id,
    m.mandant_nr,
    m.name1,
    m.ort,
    m.kontenrahmen,
    m.status,
    COUNT(d.id) AS total_documents,
    COUNT(CASE WHEN d.processing_status = 'approved' THEN 1 END) AS approved_documents,
    COUNT(ab.id) AS total_bookings,
    COALESCE(SUM(ab.betrag), 0) AS total_amount
FROM mandants m
LEFT JOIN document_registry d ON m.id = d.mandant_id
LEFT JOIN approved_bookings ab ON m.id = ab.mandant_id
GROUP BY m.id, m.mandant_nr, m.name1, m.ort, m.kontenrahmen, m.status;

-- Update function search paths to be immutable where possible
-- Fix the functions that were flagged for mutable search paths
CREATE OR REPLACE FUNCTION public.get_mandantenstammdaten()
RETURNS TABLE(name1 text, mandant_nr text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
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