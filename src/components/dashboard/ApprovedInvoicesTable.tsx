import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ApprovedInvoice {
  id: string;
  belegnummer: string;
  mandant: string;
  betrag: number;
  created_at: string;
}

export default function ApprovedInvoicesTable({ selectedMandant }: { selectedMandant: string }) {
  const [approvedInvoices, setApprovedInvoices] = useState<ApprovedInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchApprovedInvoices = async () => {
    try {
      setLoading(true);
      // Temporarily disabled - no database integration
      setApprovedInvoices([]);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const handleDelete = async (id: string) => {
    // Disabled - no database integration
    toast({
      title: "Info",
      description: "Database-Integration ist deaktiviert",
    });
  };

  if (loading) {
    return (
      <Card>
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Genehmigte Rechnungen</CardTitle>
        <Badge variant="secondary">{approvedInvoices.length} Einträge</Badge>
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
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(invoice.id)}
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