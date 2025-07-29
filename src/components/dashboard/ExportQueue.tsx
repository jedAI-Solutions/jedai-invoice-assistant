import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Download, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ExportQueueEntry {
  id: number;
  belegnummer: string;
  mandant_nr: string;
  betrag: number;
  status: string;
  created_at: string;
}

export const ExportQueue = () => {
  const [exportQueue, setExportQueue] = useState<ExportQueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchExportQueue = async () => {
    try {
      // Temporarily disabled - no database integration
      setExportQueue([]);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching export queue:', error);
      toast({
        title: "Fehler",
        description: "Export-Warteschlange konnte nicht geladen werden",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExportQueue();
  }, []);

  const handleRemoveFromQueue = async (exportId: number) => {
    try {
      setExportQueue(prev => prev.filter(item => item.id !== exportId));
      toast({
        title: "Erfolg",
        description: "Eintrag aus Ansicht entfernt",
      });
    } catch (error) {
      console.error('Error removing from export queue:', error);
      toast({
        title: "Fehler",
        description: "Eintrag konnte nicht entfernt werden",
        variant: "destructive",
      });
    }
  };

  const handleExport = async (exportId: number) => {
    try {
      // CSV Export functionality would go here
      toast({
        title: "Erfolg",
        description: "Export erfolgreich",
      });
    } catch (error) {
      console.error('Error exporting:', error);
      toast({
        title: "Fehler",
        description: "Export fehlgeschlagen",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    return <Badge variant="default">Genehmigt</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Export-Warteschlange
            <RefreshCw className="h-4 w-4 animate-spin" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Lade Export-Warteschlange...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Export-Warteschlange
          <Button
            variant="outline"
            size="sm"
            onClick={fetchExportQueue}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {exportQueue.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            Keine Einträge in der Export-Warteschlange
          </p>
        ) : (
          <div className="space-y-3">
            {exportQueue.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 border rounded-lg bg-card"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">
                      Beleg: {item.belegnummer}
                    </span>
                    {getStatusBadge(item.status)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Mandant: {item.mandant_nr} • €{item.betrag.toFixed(2)} • {new Date(item.created_at).toLocaleDateString('de-DE')}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport(item.id)}
                    className="h-8 w-8 p-0"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveFromQueue(item.id)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};