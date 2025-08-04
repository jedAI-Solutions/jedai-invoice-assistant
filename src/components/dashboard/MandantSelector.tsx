import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Mandant {
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
      const { data, error } = await supabase
        .rpc('get_mandantenstammdaten');
      
      if (error) throw error;
      setMandanten(data || []);
    } catch (error) {
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
          <SelectValue placeholder={loading ? "Lade Mandanten..." : "Alle Mandanten"} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alle Mandanten</SelectItem>
          {mandanten.map((mandant) => (
            <SelectItem key={mandant.mandant_nr} value={mandant.mandant_nr}>
              {mandant.name1} ({mandant.mandant_nr})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}