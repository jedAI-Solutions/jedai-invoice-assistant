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
      
      // Load all active mandants from public view (unrestricted listing)
      const { data: allMandants, error } = await supabase
        .from('mandant_public_view')
        .select('id, mandant_nr, name1')
        .eq('status', 'active')
        .order('name1');

      if (error) throw error;

      const mapped: Mandant[] = (allMandants || []).map((m: any) => ({
        mandant_id: m.id,
        mandant_nr: m.mandant_nr,
        name1: m.name1,
      }));

      setMandanten(mapped);
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
        <SelectTrigger className="w-full bg-white/10 backdrop-blur-md border-white/20 shadow-lg text-white">
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