import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Download, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ExportListEntry {
  export_id: string;
  buchung_id: string;
  mandant_id: string;
  export_format: string;
  status: string;
  created_at: string;
  // Buchungsdetails
  buchungsdatum?: string;
  betrag?: number;
  buchungstext?: string;
  konto?: string;
  gegenkonto?: string;
  name?: string;
  belegnummer?: string;
}

export const ExportList = () => {
  const [exportList, setExportList] = useState<ExportListEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchExportList = async () => {
    try {
      const { data, error } = await supabase
        .from('export_queue')
        .select(`
          *,
          buchungshistorie (
            buchungsdatum,
            betrag,
            buchungstext,
            konto,
            gegenkonto,
            name,
            belegnummer
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Flatten the data to include buchungshistorie fields
      const flattenedData = data?.map(item => ({
        ...item,
        buchungsdatum: item.buchungshistorie?.buchungsdatum,
        betrag: item.buchungshistorie?.betrag,
        buchungstext: item.buchungshistorie?.buchungstext,
        konto: item.buchungshistorie?.konto,
        gegenkonto: item.buchungshistorie?.gegenkonto,
        name: item.buchungshistorie?.name,
        belegnummer: item.buchungshistorie?.belegnummer
      })) || [];

      setExportList(flattenedData);
    } catch (error) {
      console.error('Error fetching export list:', error);
      toast({
        title: "Fehler",
        description: "Export-Liste konnte nicht geladen werden",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExportList();
  }, []);

  const handleRemoveFromList = async (exportId: string) => {
    try {
      // Get the export entry details first
      const exportEntry = exportList.find(item => item.export_id === exportId);
      if (!exportEntry) throw new Error('Export entry not found');

      // Check if there's an existing beleg with the same buchung_id (beleg_id stored in buchungshistorie.beleg_id)
      const { data: existingBeleg } = await supabase
        .from('belege')
        .select('beleg_id')
        .eq('beleg_id', exportEntry.buchung_id)
        .maybeSingle();

      if (existingBeleg) {
        // Update existing beleg status back to pending
        const { error: updateError } = await supabase
          .from('belege')
          .update({ status: 'pending' })
          .eq('beleg_id', exportEntry.buchung_id);

        if (updateError) throw updateError;
      } else {
        // Create new beleg entry only if it doesn't exist
        const { error: belegeError } = await supabase
          .from('belege')
          .insert({
            beleg_id: exportEntry.buchung_id, // Use the same ID to maintain link
            original_filename: exportEntry.belegnummer || 'unknown',
            mandant_id: exportEntry.mandant_id,
            belegdatum: exportEntry.buchungsdatum,
            status: 'pending',
            ki_buchungsvorschlag: {
              konto: exportEntry.konto,
              buchungstext: exportEntry.buchungstext,
              betrag: exportEntry.betrag
            }
          });

        if (belegeError) throw belegeError;
      }

      // Remove from export queue
      const { error } = await supabase
        .from('export_queue')
        .delete()
        .eq('export_id', exportId);

      if (error) throw error;

      setExportList(prev => prev.filter(item => item.export_id !== exportId));
      toast({
        title: "Erfolg",
        description: "Eintrag zurück zur Buchungsübersicht verschoben",
      });
    } catch (error) {
      console.error('Error removing from export list:', error);
      toast({
        title: "Fehler",
        description: "Eintrag konnte nicht verschoben werden",
        variant: "destructive",
      });
    }
  };

  const handleExport = async (exportId: string) => {
    try {
      const { error } = await supabase
        .from('export_queue')
        .update({ status: 'exported' })
        .eq('export_id', exportId);

      if (error) throw error;

      setExportList(prev => 
        prev.map(item => 
          item.export_id === exportId 
            ? { ...item, status: 'exported' }
            : item
        )
      );

      toast({
        title: "Erfolg",
        description: "Export erfolgreich markiert",
      });
    } catch (error) {
      console.error('Error updating export status:', error);
      toast({
        title: "Fehler",
        description: "Export-Status konnte nicht aktualisiert werden",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Wartend</Badge>;
      case 'exported':
        return <Badge variant="default">Exportiert</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  if (loading) {
    return (
      <Card className="bg-gradient-card backdrop-blur-glass border-white/20 shadow-glass">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Export-Liste
            <RefreshCw className="h-4 w-4 animate-spin" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Lade Export-Liste...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-card backdrop-blur-glass border-white/20 shadow-glass">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Export-Liste
          <Button
            variant="outline"
            size="sm"
            onClick={fetchExportList}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {exportList.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            Keine Einträge in der Export-Liste
          </p>
        ) : (
          <div className="max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead className="font-modern text-xs">Datum</TableHead>
                  <TableHead className="font-modern text-xs">Mandant</TableHead>
                  <TableHead className="font-modern text-xs">Beschreibung</TableHead>
                  <TableHead className="font-modern text-xs">Konto</TableHead>
                  <TableHead className="font-modern text-xs">Betrag</TableHead>
                  <TableHead className="font-modern text-xs">Status</TableHead>
                  <TableHead className="font-modern text-xs">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exportList.map((item) => (
                  <TableRow 
                    key={item.export_id}
                    className="border-white/10 hover:bg-white/5"
                  >
                    <TableCell className="font-modern text-xs">
                      {item.buchungsdatum ? new Date(item.buchungsdatum).toLocaleDateString('de-DE') : '-'}
                    </TableCell>
                    <TableCell className="text-xs">
                      <Badge variant="outline" className="text-xs">
                        {item.name || 'Unbekannt'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-modern text-xs max-w-[200px] truncate" title={item.buchungstext}>
                      {item.buchungstext || '-'}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {item.konto || '-'}
                    </TableCell>
                    <TableCell className="font-semibold font-modern text-xs">
                      {item.betrag ? formatCurrency(item.betrag) : '-'}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(item.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {item.status === 'pending' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExport(item.export_id)}
                            className="h-6 w-6 p-0"
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveFromList(item.export_id)}
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};