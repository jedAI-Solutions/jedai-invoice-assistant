
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Download, RotateCcw, UploadCloud } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ApprovedInvoice {
  id: string;
  belegnummer: string;
  mandant: string;
  betrag: number;
  created_at: string;
  classification_id?: string;
  document_id?: string;
}

export default function ApprovedInvoicesTable({ selectedMandant }: { selectedMandant: string }) {
  const [approvedInvoices, setApprovedInvoices] = useState<ApprovedInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();
  const fetchApprovedInvoices = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('approved_bookings')
        .select('*')
        .eq('export_status', 'pending')
        .order('created_at', { ascending: false });

      // Filter by mandant if one is selected (accepts UUID or mandant_nr)
      if (selectedMandant !== "all") {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(selectedMandant);
        console.log('ApprovedInvoicesTable: applying filter', { selectedMandant, isUuid });
        query = isUuid
          ? query.eq('mandant_id', selectedMandant)
          : query.eq('mandant_nr', selectedMandant);
      }

      const { data, error } = await query;

      if (error) throw error;

      const mappedInvoices: ApprovedInvoice[] = data?.map((item: any) => ({
        id: item.id,
        belegnummer: item.belegnummer || 'Unbekannt',
        mandant: item.mandant_name || 'Unbekannt',
        betrag: item.betrag || 0,
        created_at: item.created_at || new Date().toISOString(),
        classification_id: item.classification_id,
        document_id: item.document_id
      })) || [];

      setApprovedInvoices(mappedInvoices);
    } catch (error) {
      console.error('Error fetching approved invoices:', error);
      toast({
        title: "Fehler",
        description: "Genehmigte Rechnungen konnten nicht geladen werden",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovedInvoices();
  }, [selectedMandant]);

  // Realtime-Updates: aktualisiere Tabelle bei Änderungen an approved_bookings
  useEffect(() => {
    const channel = supabase
      .channel('approved-bookings-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'approved_bookings' },
        () => {
          console.log('approved_bookings changed, refreshing approved invoices...');
          fetchApprovedInvoices();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedMandant]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const handleSendBackForReview = async (invoice: ApprovedInvoice) => {
    try {
      // Update status in ai_classifications table back to pending if classification_id exists
      if (invoice.classification_id) {
        const { error: updateError } = await supabase
          .from('ai_classifications')
          .update({ status: 'pending' })
          .eq('id', invoice.classification_id);

        if (updateError) throw updateError;
      }

      // Remove from approved_bookings
      const { error: deleteError } = await supabase
        .from('approved_bookings')
        .delete()
        .eq('id', invoice.id);

      if (deleteError) throw deleteError;

      toast({
        title: "Erfolg",
        description: "Rechnung wurde zur erneuten Prüfung gesendet",
      });

      // Refresh the list
      fetchApprovedInvoices();
    } catch (error) {
      console.error('Error sending back for review:', error);
      toast({
        title: "Fehler",
        description: "Rechnung konnte nicht zur Prüfung gesendet werden",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (invoice: ApprovedInvoice) => {
    try {
      // Completely delete from approved_bookings
      const { error: deleteError } = await supabase
        .from('approved_bookings')
        .delete()
        .eq('id', invoice.id);

      if (deleteError) throw deleteError;

      toast({
        title: "Erfolg",
        description: "Rechnung wurde gelöscht",
      });

      fetchApprovedInvoices();
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast({
        title: "Fehler",
        description: "Rechnung konnte nicht gelöscht werden",
        variant: "destructive",
      });
    }
  };

  const handleDownload = async (invoice: ApprovedInvoice) => {
    try {
      // Create CSV content
      const csvHeader = "Belegnummer,Mandant,Betrag,Datum,Konto,Gegenkonto,Buchungstext,Steuersatz\n";
      const csvRow = `"${invoice.belegnummer}","${invoice.mandant}","${invoice.betrag}","${invoice.created_at}","","","",""\n`;
      const csvContent = csvHeader + csvRow;
      
      // Create and download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `rechnung_${invoice.belegnummer}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Erfolg",
        description: "CSV-Datei wurde heruntergeladen",
      });
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast({
        title: "Fehler",
        description: "Download fehlgeschlagen",
        variant: "destructive",
      });
    }
  };
  
  const handleExportAll = async () => {
    try {
      setExporting(true);
      const mandantId = selectedMandant === 'all' ? null : selectedMandant;
      const { data, error } = await supabase.functions.invoke('export-approved-invoices', {
        body: {
          mandantId,
          invoiceIds: approvedInvoices.map(i => i.id),
        },
      });
      if (error) throw error;
      toast({
        title: "Export gestartet",
        description: "n8n Workflow wurde ausgelöst.",
      });
    } catch (error) {
      console.error('Error triggering export:', error);
      toast({
        title: "Fehler beim Export",
        description: "Export konnte nicht gestartet werden",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-lg">
        <CardHeader>
          <CardTitle>Genehmigte Rechnungen</CardTitle>
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
        <CardTitle>Genehmigte Rechnungen</CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{approvedInvoices.length} Einträge</Badge>
          <Button
            variant="gradient"
            size="sm"
            onClick={handleExportAll}
            disabled={exporting || approvedInvoices.length === 0}
            title="Alle angezeigten Rechnungen an n8n exportieren"
          >
            <UploadCloud className="h-4 w-4" />
            <span className="hidden sm:inline">An n8n exportieren</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {approvedInvoices.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Keine genehmigten Rechnungen vorhanden
          </div>
        ) : (
          <div className="space-y-2">
            {approvedInvoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="font-medium">{invoice.belegnummer}</div>
                  <div className="text-sm text-muted-foreground">
                    {invoice.mandant} • {formatDate(invoice.created_at)}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-semibold">{formatCurrency(invoice.betrag)}</div>
                    <div className="text-xs text-muted-foreground">Genehmigt</div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDownload(invoice)}
                      title="Als CSV herunterladen"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSendBackForReview(invoice)}
                      title="Zur erneuten Prüfung senden"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(invoice)}
                      title="Rechnung löschen"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
