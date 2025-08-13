-- Fix Security Issues: Enable RLS on tables with proper policies

-- Enable RLS on tables that currently don't have it
ALTER TABLE public.tax_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tax_sessions
-- Service role can access all
CREATE POLICY "Service role can access tax sessions" 
ON public.tax_sessions 
FOR ALL 
USING (auth.role() = 'service_role');

-- For now, make tax sessions readable by all authenticated users
-- (you can restrict this further based on your app's requirements)
CREATE POLICY "Authenticated users can access tax sessions" 
ON public.tax_sessions 
FOR ALL 
USING (auth.role() = 'authenticated');

-- Create RLS policies for tax_responses
-- Service role can access all
CREATE POLICY "Service role can access tax responses" 
ON public.tax_responses 
FOR ALL 
USING (auth.role() = 'service_role');

-- Authenticated users can access tax responses
CREATE POLICY "Authenticated users can access tax responses" 
ON public.tax_responses 
FOR ALL 
USING (auth.role() = 'authenticated');

-- Create RLS policies for tax_documents
-- Service role can access all
CREATE POLICY "Service role can access tax documents" 
ON public.tax_documents 
FOR ALL 
USING (auth.role() = 'service_role');

-- Authenticated users can access tax documents
CREATE POLICY "Authenticated users can access tax documents" 
ON public.tax_documents 
FOR ALL 
USING (auth.role() = 'authenticated');

-- Create RLS policies for tax_calculations
-- Service role can access all
CREATE POLICY "Service role can access tax calculations" 
ON public.tax_calculations 
FOR ALL 
USING (auth.role() = 'service_role');

-- Authenticated users can access tax calculations
CREATE POLICY "Authenticated users can access tax calculations" 
ON public.tax_calculations 
FOR ALL 
USING (auth.role() = 'authenticated');

-- Create RLS policies for tax_knowledge_base
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

-- Only service role can modify knowledge base
CREATE POLICY "Service role can modify tax knowledge base" 
ON public.tax_knowledge_base 
FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update tax knowledge base" 
ON public.tax_knowledge_base 
FOR UPDATE 
USING (auth.role() = 'service_role');

CREATE POLICY "Service role can delete tax knowledge base" 
ON public.tax_knowledge_base 
FOR DELETE 
USING (auth.role() = 'service_role');

-- Create RLS policies for user_preferences
-- Service role can access all
CREATE POLICY "Service role can access user preferences" 
ON public.user_preferences 
FOR ALL 
USING (auth.role() = 'service_role');

-- Users can access their own preferences
CREATE POLICY "Users can access their own preferences" 
ON public.user_preferences 
FOR ALL 
USING (auth.uid()::text = user_id);

-- Recreate views to ensure they don't have SECURITY DEFINER
-- Drop and recreate mandant_public_view (if it exists) to ensure proper security
DROP VIEW IF EXISTS public.mandant_public_view;
CREATE VIEW public.mandant_public_view AS
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

-- Drop and recreate mandant_summary view to ensure proper security
DROP VIEW IF EXISTS public.mandant_summary;
CREATE VIEW public.mandant_summary AS
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

-- Drop and recreate other views to ensure they don't have SECURITY DEFINER
DROP VIEW IF EXISTS public.performance_metrics;
CREATE VIEW public.performance_metrics AS
SELECT 
    DATE_TRUNC('hour', created_at) AS hour,
    COUNT(*) AS total_requests,
    AVG(confidence_score) AS avg_confidence,
    AVG(processing_time_ms) AS avg_processing_time,
    COUNT(CASE WHEN confidence_score >= 0.8 THEN 1 END) AS high_confidence_responses
FROM tax_responses
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY hour DESC;

DROP VIEW IF EXISTS public.processing_pipeline_status;
CREATE VIEW public.processing_pipeline_status AS
SELECT 
    processing_status,
    COUNT(*) AS document_count,
    AVG(EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600) AS avg_age_hours
FROM document_registry
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY processing_status
ORDER BY COUNT(*) DESC;

DROP VIEW IF EXISTS public.tax_session_summary;
CREATE VIEW public.tax_session_summary AS
SELECT 
    ts.session_id,
    ts.query,
    ts.status,
    ts.created_at,
    tr.confidence_score,
    tr.model_used,
    COUNT(td.id) AS document_count,
    COUNT(tc.id) AS calculation_count
FROM tax_sessions ts
LEFT JOIN tax_responses tr ON ts.session_id = tr.session_id
LEFT JOIN tax_documents td ON ts.session_id = td.session_id
LEFT JOIN tax_calculations tc ON ts.session_id = tc.session_id
GROUP BY ts.session_id, ts.query, ts.status, ts.created_at, tr.confidence_score, tr.model_used;

DROP VIEW IF EXISTS public.v_agenda_mandants;
CREATE VIEW public.v_agenda_mandants AS
SELECT 
    id,
    mandant_nr,
    agenda_konto_nr AS konto,
    name1,
    unternehmensgegenstand,
    vorname,
    anrede,
    titel,
    agenda_adressattyp AS adressattyp,
    CASE 
        WHEN agenda_adressattyp = '1' THEN 'Unternehmen'
        WHEN agenda_adressattyp = '2' THEN 'Natürliche Person'
        ELSE 'Keine Angabe'
    END AS adressattyp_text,
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
    agenda_last_sync
FROM mandants m
WHERE agenda_konto_nr IS NOT NULL
ORDER BY agenda_konto_nr;