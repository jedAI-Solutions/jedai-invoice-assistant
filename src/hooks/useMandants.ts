import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Mandant {
  id: string;
  mandant_nr: string;
  name1: string;
}

export function useMandants() {
  const [mandants, setMandants] = useState<Mandant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMandants();
  }, []);

  const fetchMandants = async () => {
    try {
      const { data, error } = await supabase
        .from('mandants')
        .select('id, mandant_nr, name1')
        .eq('status', 'active')
        .order('mandant_nr');

      if (error) throw error;
      setMandants(data || []);
    } catch (error) {
      console.error('Error fetching mandants:', error);
    } finally {
      setLoading(false);
    }
  };

  return { mandants, loading };
}