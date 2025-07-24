import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ApprovedInvoice {
  id: number;
  belegnummer: string;
  mandant: string;
  mandant_nr: string;
  betrag: number;
  belegdatum: string;
  created_at: string;
  buchungstext: string;
  konto: string;
  gegenkonto: string;
}

interface ApprovedInvoicesTableProps {
  selectedMandant: string;
}

const ApprovedInvoicesTable: React.FC<ApprovedInvoicesTableProps> = ({ selectedMandant }) => {
  const [invoices, setInvoices] = useState<ApprovedInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchApprovedInvoices = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('approved_invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (selectedMandant && selectedMandant !== 'all') {
        query = query.eq('mandant_nr', selectedMandant);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching approved invoices:', error);
        toast({
          title: "Fehler beim Laden",
          description: "Genehmigte Rechnungen konnten nicht geladen werden.",
          variant: "destructive",
        });
        return;
      }

      setInvoices(data || []);
    } catch (error) {
      console.error('Error fetching approved invoices:', error);
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
    fetchApprovedInvoices();
  }, [selectedMandant]);

  const exportToCsv = () => {
    if (invoices.length === 0) {
      toast({
        title: "Keine Daten",
        description: "Es sind keine genehmigten Rechnungen zum Exportieren vorhanden.",
        variant: "destructive",
      });
      return;
    }

    const headers = [
      'Belegnummer',
      'Mandant',
      'Betrag',
      'Belegdatum',
      'Genehmigt am',
      'Buchungstext',
      'Konto',
      'Gegenkonto'
    ];

    const csvContent = [
      headers.join(';'),
      ...invoices.map(invoice => [
        invoice.belegnummer,
        invoice.mandant,
        invoice.betrag.toString().replace('.', ','),
        new Date(invoice.belegdatum).toLocaleDateString('de-DE'),
        new Date(invoice.created_at).toLocaleDateString('de-DE'),
        invoice.buchungstext,
        invoice.konto,
        invoice.gegenkonto
      ].join(';'))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `genehmigte_rechnungen_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export erfolgreich",
      description: `${invoices.length} genehmigte Rechnungen wurden exportiert.`,
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

  const filteredInvoices = useMemo(() => {
    if (!selectedMandant || selectedMandant === 'all') {
      return invoices;
    }
    return invoices.filter(invoice => invoice.mandant_nr === selectedMandant);
  }, [invoices, selectedMandant]);

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-semibold">
          Genehmigte Rechnungen ({filteredInvoices.length})
        </CardTitle>
        <div className="flex gap-2">
          <Button
            onClick={fetchApprovedInvoices}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Aktualisieren
          </Button>
          <Button
            onClick={exportToCsv}
            variant="default"
            size="sm"
            disabled={filteredInvoices.length === 0}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Download className="h-4 w-4 mr-2" />
            CSV Export
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Lade genehmigte Rechnungen...</span>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Keine genehmigten Rechnungen gefunden.
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
                  <TableHead>Genehmigt am</TableHead>
                  <TableHead>Buchungstext</TableHead>
                  <TableHead>Konto</TableHead>
                  <TableHead>Gegenkonto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.belegnummer}</TableCell>
                    <TableCell>{invoice.mandant}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(invoice.betrag)}
                    </TableCell>
                    <TableCell>{formatDate(invoice.belegdatum)}</TableCell>
                    <TableCell>{formatDate(invoice.created_at)}</TableCell>
                    <TableCell className="max-w-xs truncate" title={invoice.buchungstext}>
                      {invoice.buchungstext}
                    </TableCell>
                    <TableCell>{invoice.konto}</TableCell>
                    <TableCell>{invoice.gegenkonto}</TableCell>
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

export default ApprovedInvoicesTable;