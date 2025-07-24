-- Erstelle RLS Policies für alle relevanten Tabellen damit Daten angezeigt werden können

-- Policies für classified_invoices (alle können lesen)
CREATE POLICY "Allow public read access to classified_invoices" 
ON public.classified_invoices 
FOR SELECT 
USING (true);

-- Policies für mandantenstammdaten (alle können lesen)
CREATE POLICY "Allow public read access to mandantenstammdaten" 
ON public.mandantenstammdaten 
FOR SELECT 
USING (true);

-- Policies für approved_invoices (alle können lesen)
CREATE POLICY "Allow public read access to approved_invoices" 
ON public.approved_invoices 
FOR SELECT 
USING (true);

-- Policies für booking_history (alle können lesen)
CREATE POLICY "Allow public read access to booking_history" 
ON public.booking_history 
FOR SELECT 
USING (true);

-- Policies für audit_trails (alle können lesen)
CREATE POLICY "Allow public read access to audit_trails" 
ON public.audit_trails 
FOR SELECT 
USING (true);

-- Policies für ki_trainingsdaten (alle können lesen)
CREATE POLICY "Allow public read access to ki_trainingsdaten" 
ON public.ki_trainingsdaten 
FOR SELECT 
USING (true);