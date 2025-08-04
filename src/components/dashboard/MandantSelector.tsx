import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Mandant {
  mandant_id: string;
  mandant_nr: string;
  name1: string;
}

interface MandantSelectorProps {
  selectedMandant: string;
  onMandantChange: (mandant: string) => void;
}

export default function MandantSelector({ selectedMandant, onMandantChange }: MandantSelectorProps) {
  const [mandanten, setMandanten] = useState<Mandant[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchMandanten = async () => {
    try {
      setLoading(true);
      
      // Get distinct mandants that have entries in either ai_classifications or approved_bookings
      const { data: classifiedMandants, error: classifiedError } = await supabase
        .from('ai_classifications')
        .select(`
          mandant_id,
          mandants!inner(name1, mandant_nr)
        `)
        .not('mandant_id', 'is', null);

      if (classifiedError) throw classifiedError;

      const { data: approvedMandants, error: approvedError } = await supabase
        .from('approved_bookings')
        .select(`
          mandant_id,
          mandant_name,
          mandant_nr
        `)
        .not('mandant_id', 'is', null);

      if (approvedError) throw approvedError;

      // Combine and deduplicate mandants
      const mandantMap = new Map<string, Mandant>();

      // Add mandants from classified entries
      classifiedMandants?.forEach((item: any) => {
        if (item.mandants) {
          mandantMap.set(item.mandant_id, {
            mandant_id: item.mandant_id,
            mandant_nr: item.mandants.mandant_nr,
            name1: item.mandants.name1
          });
        }
      });

      // Add mandants from approved entries
      approvedMandants?.forEach((item: any) => {
        if (item.mandant_nr && item.mandant_name) {
          mandantMap.set(item.mandant_id, {
            mandant_id: item.mandant_id,
            mandant_nr: item.mandant_nr,
            name1: item.mandant_name
          });
        }
      });

      // Convert map to array and sort by name
      const uniqueMandanten = Array.from(mandantMap.values())
        .sort((a, b) => a.name1.localeCompare(b.name1));

      setMandanten(uniqueMandanten);
    } catch (error) {
      console.error('Error fetching mandanten:', error);
      toast({
        title: "Fehler",
        description: "Mandanten konnten nicht geladen werden",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMandanten();
  }, []);

  return (
    <div className="space-y-2">
      <Label htmlFor="mandant-select">Mandant filtern</Label>
      <Select value={selectedMandant} onValueChange={onMandantChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={loading ? "Lade Mandanten..." : "Mandant nicht definiert"} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Mandant nicht definiert</SelectItem>
          {mandanten.map((mandant) => (
            <SelectItem key={mandant.mandant_id} value={mandant.mandant_id}>
              {mandant.name1} ({mandant.mandant_nr})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}