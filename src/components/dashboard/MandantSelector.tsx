import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface Mandant {
  id: string;
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
      // Temporarily disabled - no database integration
      setMandanten([]);
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
          <SelectValue placeholder={loading ? "Lade Mandanten..." : "Alle Mandanten"} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alle Mandanten</SelectItem>
          {mandanten.map((mandant) => (
            <SelectItem key={mandant.id} value={mandant.mandant_nr}>
              {mandant.name1}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}