import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ExportEntry {
  id: string;
  belegnummer: string;
  mandant: string;
  betrag: number;
  created_at: string;
}

export default function ExportList() {
  const [exportData, setExportData] = useState<ExportEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchExportData = async () => {
    try {
      setLoading(true);
      // Temporarily disabled - no database integration
      setExportData([]);
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
    fetchExportData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE');
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
          <CardTitle>Export-Liste</CardTitle>
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
        <CardTitle>Export-Liste</CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{exportData.length} Einträge</Badge>
          {exportData.length > 0 && (
            <Button size="sm">
              <Download className="h-4 w-4 mr-2" />
              Alle exportieren
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {exportData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Keine Export-Einträge vorhanden
          </div>
        ) : (
          <div className="space-y-2">
            {exportData.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="font-medium">{entry.belegnummer}</div>
                  <div className="text-sm text-muted-foreground">
                    {entry.mandant} • {formatDate(entry.created_at)}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-semibold">{formatCurrency(entry.betrag)}</div>
                    <div className="text-xs text-green-600">Exportbereit</div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(entry.id)}
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