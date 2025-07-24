import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Mandant {
  id: number;
  mandant_nr: string;
  name1: string;
}

interface MandantSelectorProps {
  selectedMandant: string;
  onMandantChange: (mandant: string) => void;
}

const MandantSelector: React.FC<MandantSelectorProps> = ({ selectedMandant, onMandantChange }) => {
  const [mandanten, setMandanten] = useState<Mandant[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchMandanten = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('mandantenstammdaten')
        .select('id, mandant_nr, name1')
        .order('name1', { ascending: true });

      if (error) {
        console.error('Error fetching mandanten:', error);
        toast({
          title: "Fehler beim Laden",
          description: "Mandanten konnten nicht geladen werden.",
          variant: "destructive",
        });
        return;
      }

      setMandanten(data || []);
    } catch (error) {
      console.error('Error fetching mandanten:', error);
      toast({
        title: "Fehler beim Laden",
        description: "Ein unerwarteter Fehler ist aufgetreten.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMandanten();
  }, []);

  const getSelectedMandantName = () => {
    if (selectedMandant === 'all') return 'Alle Mandanten';
    const mandant = mandanten.find(m => m.mandant_nr === selectedMandant);
    return mandant ? mandant.name1 : 'Mandant auswählen';
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Building className="h-5 w-5" />
          Mandantenfilter
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            Mandant auswählen
          </label>
          <Select
            value={selectedMandant}
            onValueChange={onMandantChange}
            disabled={loading}
          >
            <SelectTrigger className="w-full">
              <SelectValue>
                {loading ? (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Lade Mandanten...
                  </div>
                ) : (
                  getSelectedMandantName()
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-lg max-h-60 z-50">
              <SelectItem value="all" className="hover:bg-accent">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Alle Mandanten
                </div>
              </SelectItem>
              {mandanten.map((mandant) => (
                <SelectItem 
                  key={mandant.id} 
                  value={mandant.mandant_nr}
                  className="hover:bg-accent"
                >
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{mandant.name1}</span>
                    <span className="text-xs text-muted-foreground">Nr: {mandant.mandant_nr}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {mandanten.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {mandanten.length} Mandanten verfügbar
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MandantSelector;