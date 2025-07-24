import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ExportListEntry {
  id: number;
  belegnummer: string;
  mandant: string;
  betrag: number;
  belegdatum: string;
  buchungstext: string;
  konto: string;
  gegenkonto: string;
  created_at: string;
}

const ExportList: React.FC = () => {
  const [exportList, setExportList] = useState<ExportListEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchExportList = async () => {
    try {
      setLoading(true);
      
      // Use approved_invoices table directly since it contains the approved bookings
      const { data, error } = await supabase
        .from('approved_invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }
      
      // Map the data to our expected format
      const mappedData: ExportListEntry[] = (data || []).map((item: any) => ({
        id: item.id,
        belegnummer: item.belegnummer || 'Unbekannt',
        mandant: item.mandant || 'Unbekannt',
        betrag: item.betrag || 0,
        belegdatum: item.belegdatum || new Date().toISOString(),
        buchungstext: item.buchungstext || 'Keine Beschreibung',
        konto: item.konto || '0000',
        gegenkonto: item.gegenkonto || '0000',
        created_at: item.created_at || new Date().toISOString()
      }));

      setExportList(mappedData);
    } catch (error) {
      console.error('Error fetching export list:', error);
      
      // Show some mock data for demonstration
      setExportList([
        {
          id: 1,
          belegnummer: 'R2024-001',
          mandant: 'Mustermann GmbH',
          betrag: 1250.00,
          belegdatum: '2024-01-15T00:00:00.000Z',
          buchungstext: 'Büromaterial und Software-Lizenzen',
          konto: '6815',
          gegenkonto: '1200',
          created_at: '2024-01-15T10:30:00Z'
        },
        {
          id: 2,
          belegnummer: 'R2024-002',
          mandant: 'Beispiel AG',
          betrag: 420.50,
          belegdatum: '2024-12-15T00:00:00.000Z',
          buchungstext: 'Stromkosten Büroräume Dezember',
          konto: '6400',
          gegenkonto: '1200',
          created_at: '2024-12-15T09:00:00Z'
        }
      ]);
      
      toast({
        title: "Info",
        description: "Export-Liste wird mit Beispieldaten angezeigt.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExportList();
  }, []);

  const handleDelete = async (id: number) => {
    try {
      const { error } = await supabase
        .from('approved_invoices')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setExportList(prev => prev.filter(item => item.id !== id));
      
      toast({
        title: "Erfolg",
        description: "Eintrag wurde aus der Export-Liste entfernt.",
      });
    } catch (error) {
      console.error('Error deleting export entry:', error);
      toast({
        title: "Fehler",
        description: "Eintrag konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    }
  };

  const handleExport = () => {
    if (exportList.length === 0) {
      toast({
        title: "Keine Daten",
        description: "Es sind keine Einträge zum Exportieren vorhanden.",
        variant: "destructive",
      });
      return;
    }

    const headers = [
      'Belegnummer',
      'Mandant',
      'Betrag',
      'Belegdatum',
      'Buchungstext',
      'Konto',
      'Gegenkonto',
      'Genehmigt am'
    ];

    const csvContent = [
      headers.join(';'),
      ...exportList.map(item => [
        item.belegnummer,
        item.mandant,
        item.betrag.toString().replace('.', ','),
        new Date(item.belegdatum).toLocaleDateString('de-DE'),
        item.buchungstext,
        item.konto,
        item.gegenkonto,
        new Date(item.created_at).toLocaleDateString('de-DE')
      ].join(';'))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `export_liste_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export erfolgreich",
      description: `${exportList.length} Einträge wurden exportiert.`,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-semibold">
          Export-Warteschlange ({exportList.length})
        </CardTitle>
        <div className="flex gap-2">
          <Button
            onClick={fetchExportList}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Aktualisieren
          </Button>
          <Button
            onClick={handleExport}
            variant="default"
            size="sm"
            disabled={exportList.length === 0}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Download className="h-4 w-4 mr-2" />
            DATEV Export
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Lade Export-Liste...</span>
          </div>
        ) : exportList.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Keine Einträge in der Export-Warteschlange.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Belegnummer</TableHead>
                  <TableHead>Mandant</TableHead>
                  <TableHead className="text-right">Betrag</TableHead>
                  <TableHead>Belegdatum</TableHead>
                  <TableHead>Buchungstext</TableHead>
                  <TableHead>Konto</TableHead>
                  <TableHead>Gegenkonto</TableHead>
                  <TableHead>Genehmigt am</TableHead>
                  <TableHead className="text-center">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exportList.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.belegnummer}</TableCell>
                    <TableCell>{item.mandant}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.betrag)}
                    </TableCell>
                    <TableCell>{formatDate(item.belegdatum)}</TableCell>
                    <TableCell className="max-w-xs truncate" title={item.buchungstext}>
                      {item.buchungstext}
                    </TableCell>
                    <TableCell>{item.konto}</TableCell>
                    <TableCell>{item.gegenkonto}</TableCell>
                    <TableCell>{formatDate(item.created_at)}</TableCell>
                    <TableCell className="text-center">
                      <Button
                        onClick={() => handleDelete(item.id)}
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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

export default ExportList;