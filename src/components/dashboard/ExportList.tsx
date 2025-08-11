import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ExportBatchEntry {
  id: string;
  batch_number: string;
  filename: string;
  generated_at: string | null;
  total_bookings: number | null;
  total_amount: number | null;
  export_status: string | null;
  client_number: string | null; // mandant_nr
}

export default function ExportList({ selectedMandant }: { selectedMandant: string }) {
  const [batches, setBatches] = useState<ExportBatchEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [mandantNr, setMandantNr] = useState<string | null>(null);
  const { toast } = useToast();

  // Resolve mandant_nr for filtering when a specific mandant is selected
  useEffect(() => {
    const resolveMandantNr = async () => {
      if (selectedMandant && selectedMandant !== "all") {
        const { data, error } = await supabase
          .from('mandants')
          .select('mandant_nr,name1')
          .eq('id', selectedMandant)
          .maybeSingle();
        if (error) {
          console.error('Error resolving mandant_nr:', error);
          setMandantNr(null);
        } else {
          setMandantNr(data?.mandant_nr || null);
        }
      } else {
        setMandantNr(null);
      }
    };
    resolveMandantNr();
  }, [selectedMandant]);

  const fetchExportData = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('dtvf_export_batches')
        .select('id,batch_number,filename,generated_at,total_bookings,total_amount,export_status,client_number')
        .order('generated_at', { ascending: false });

      if (mandantNr) {
        query = query.eq('client_number', mandantNr);
      }

      const { data, error } = await query;
      if (error) throw error;

      setBatches((data || []) as ExportBatchEntry[]);
    } catch (error) {
      console.error('Error fetching export history:', error);
      toast({
        title: "Fehler",
        description: "Export-Historie konnte nicht geladen werden",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExportData();
    // Realtime updates for newly generated export batches
    const channel = supabase
      .channel('dtvf-export-batches-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'dtvf_export_batches' },
        () => fetchExportData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [mandantNr]);

  const formatCurrency = (amount: number | null | undefined) => {
    const value = Number(amount || 0);
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return '-';
    const d = new Date(dateString);
    return `${d.toLocaleDateString('de-DE')} ${d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const visibleBatches = useMemo(() => batches, [batches]);

  if (loading) {
    return (
      <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-lg">
        <CardHeader>
          <CardTitle>Export-Historie</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Laden...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Export-Historie</CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{visibleBatches.length} Batches</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {visibleBatches.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Noch keine Exporte vorhanden
          </div>
        ) : (
          <div className="space-y-2">
            {visibleBatches.map((entry) => (
              <div
                key={entry.id}
                className="grid grid-cols-1 md:grid-cols-5 items-center gap-2 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="md:col-span-2">
                  <div className="font-medium">Batch {entry.batch_number}</div>
                  <div className="text-sm text-muted-foreground">
                    {entry.filename}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatDateTime(entry.generated_at)}
                </div>
                <div className="text-right">
                  <div className="font-semibold">
                    {formatCurrency(entry.total_amount)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {entry.total_bookings ?? 0} Buchungen
                  </div>
                </div>
                <div className="flex justify-end">
                  <Badge variant={entry.export_status === 'completed' ? 'default' : 'secondary'}>
                    {entry.export_status || 'preparing'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
