import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Download, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ExportQueueEntry {
  export_id: string;
  buchung_id: string;
  mandant_id: string;
  export_format: string;
  status: string;
  created_at: string;
}

export const ExportQueue = () => {
  const [exportQueue, setExportQueue] = useState<ExportQueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchExportQueue = async () => {
    try {
      const { data, error } = await supabase
        .from('export_queue')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExportQueue(data || []);
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

  const handleRemoveFromQueue = async (exportId: string) => {
    try {
      const { error } = await supabase
        .from('export_queue')
        .delete()
        .eq('export_id', exportId);

      if (error) throw error;

      setExportQueue(prev => prev.filter(item => item.export_id !== exportId));
      toast({
        title: "Erfolg",
        description: "Eintrag aus Export-Warteschlange entfernt",
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

  const handleExport = async (exportId: string) => {
    try {
      const { error } = await supabase
        .from('export_queue')
        .update({ status: 'exported' })
        .eq('export_id', exportId);

      if (error) throw error;

      setExportQueue(prev => 
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
                key={item.export_id}
                className="flex items-center justify-between p-3 border rounded-lg bg-card"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">
                      Buchung: {item.buchung_id.slice(0, 8)}...
                    </span>
                    {getStatusBadge(item.status)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Format: {item.export_format} • {new Date(item.created_at).toLocaleDateString('de-DE')}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {item.status === 'pending' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExport(item.export_id)}
                      className="h-8 w-8 p-0"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveFromQueue(item.export_id)}
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