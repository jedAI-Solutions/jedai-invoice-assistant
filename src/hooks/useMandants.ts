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
      console.log('useMandants: fetching mandants...');
      const { data, error } = await supabase
        .from('mandant_public_view')
        .select('id, mandant_nr, name1')
        .eq('status', 'active')
        .order('mandant_nr');

      console.log('useMandants: query result:', { data, error });
      if (error) {
        console.error('useMandants: error fetching mandants:', error);
        throw error;
      }
      console.log('useMandants: setting mandants:', data?.length || 0);
      setMandants(data || []);
    } catch (error) {
      console.error('useMandants: Error fetching mandants:', error);
    } finally {
      setLoading(false);
    }
  };

  return { mandants, loading };
}