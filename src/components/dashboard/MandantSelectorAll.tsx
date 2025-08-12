import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Mandant {
  id: string;
  mandant_nr: string;
  name1: string;
}

interface MandantSelectorAllProps {
  selectedMandant: string;
  onMandantChange: (mandant: string) => void;
}

export default function MandantSelectorAll({ selectedMandant, onMandantChange }: MandantSelectorAllProps) {
  const [mandanten, setMandanten] = useState<Mandant[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchMandanten = async () => {
    try {
      setLoading(true);
      
      // Get all active mandants from the mandants table
      const { data: allMandants, error } = await supabase
        .from('mandant_public_view')
        .select('id, mandant_nr, name1')
        .eq('status', 'active')
        .order('name1');

      if (error) throw error;

      setMandanten(allMandants || []);
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
      <Label htmlFor="mandant-select">Mandant auswählen</Label>
      <Select value={selectedMandant} onValueChange={onMandantChange}>
        <SelectTrigger className="w-full bg-white/95 backdrop-blur-md border-white/30 hover:bg-white shadow-lg">
          <SelectValue placeholder={loading ? "Lade Mandanten..." : "Mandant auswählen"} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Mandant nicht definiert</SelectItem>
          {mandanten.map((mandant) => (
            <SelectItem key={mandant.id} value={mandant.id}>
              {mandant.name1} ({mandant.mandant_nr})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}