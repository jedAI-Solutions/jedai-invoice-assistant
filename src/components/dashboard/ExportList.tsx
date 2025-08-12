
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Copy, RefreshCw } from "lucide-react";

interface ExportBatchEntry {
  id: string;
  batch_number: string;
  filename: string;
  generated_at: string | null;
  total_bookings: number | null;
  total_amount: number | null;
  export_status: string | null;
  client_number: string | null; // mandant_nr
  // Neue Felder aus der Migration
  storage_path?: string | null;
  mime_type?: string | null;
  storage_uploaded_at?: string | null;
  file_size?: number | null;
}

export default function ExportList({ selectedMandant }: { selectedMandant: string }) {
  const [batches, setBatches] = useState<ExportBatchEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [mandantNr, setMandantNr] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const { toast } = useToast();
  const [linkTtl, setLinkTtl] = useState<number>(3600);

  // Resolve mandant_nr for filtering when a specific mandant is selected
  useEffect(() => {
    const resolveMandantNr = async () => {
      if (selectedMandant && selectedMandant !== "all") {
        const { data, error } = await supabase
          .from('mandant_public_view')
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
        .select('id,batch_number,filename,generated_at,total_bookings,total_amount,export_status,client_number,storage_path,mime_type,storage_uploaded_at,file_size')
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
  
  const bytesToSize = (bytes?: number | null) => {
    if (bytes == null) return null;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const val = bytes / Math.pow(1024, i);
    return `${val.toFixed(val >= 100 ? 0 : val >= 10 ? 1 : 2)} ${sizes[i]}`;
  };

  const visibleBatches = useMemo(() => batches, [batches]);

  // Try to create a signed URL with sensible fallbacks (normalize keys and try multiple locations)
  const createSignedUrlWithFallback = async (entry: ExportBatchEntry, ttl: number) => {
    const bucket = supabase.storage.from('exports');
    const candidates: string[] = [];

    const addCandidate = (k?: string | null) => {
      if (!k) return;
      const raw = k.replace(/^\/+/, '');
      if (!candidates.includes(raw)) candidates.push(raw);
      if (raw.startsWith('exports/')) {
        const stripped = raw.replace(/^exports\//, '');
        if (!candidates.includes(stripped)) candidates.push(stripped);
      } else {
        const prefixed = `exports/${raw}`;
        if (!candidates.includes(prefixed)) candidates.push(prefixed);
      }
    };

    // As-is from DB and variants
    addCandidate(entry.storage_path);
    // Plain filename as fallback
    addCandidate(entry.filename);
    addCandidate(entry.batch_number);
    // Common folder pattern: <client_number>/<filename>
    if (entry.client_number && entry.filename) addCandidate(`${entry.client_number}/${entry.filename}`);
    if (entry.client_number && entry.storage_path && !entry.storage_path.includes('/')) addCandidate(`${entry.client_number}/${entry.storage_path}`);

    // Gewünschter Download-Dateiname erzwingen (CSV)
    const baseName = entry.filename || entry.batch_number || 'export';
    const suggestedName = /\.csv$/i.test(baseName) ? baseName : `${baseName}.csv`;

    for (const key of candidates) {
      const { data } = await bucket.createSignedUrl(key, ttl, { download: suggestedName });
      if (data?.signedUrl) return { signedUrl: data.signedUrl, key };
    }
    return { signedUrl: null as string | null, key: null as string | null };
  };

  const handleDownload = async (entry: ExportBatchEntry) => {
    try {
      if (entry.export_status !== 'completed') {
        toast({
          title: "Noch nicht verfügbar",
          description: "Für diesen Export liegt noch keine Datei vor.",
        });
        return;
      }

      setDownloadingId(entry.id);
      const { signedUrl, key } = await createSignedUrlWithFallback(entry, linkTtl);

      // 1) Bevorzugt: signierte URL nutzen
      if (signedUrl) {
        const link = document.createElement('a');
        link.href = signedUrl;
        const suggestedName = entry.filename || entry.batch_number || 'export';
        link.download = suggestedName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      // 2) Fallback: Direktdownload über Storage API (ohne signierte URL)
      const bucket = supabase.storage.from('exports');
      const candidates: string[] = [];
      const pushKey = (k?: string | null) => {
        if (!k) return;
        const raw = k.replace(/^\/+/, '');
        // Original
        if (!candidates.includes(raw)) candidates.push(raw);
        // Wenn der Pfad mit "exports/" beginnt, auch die Variante ohne Präfix testen
        if (raw.startsWith('exports/')) {
          const stripped = raw.replace(/^exports\//, '');
          if (!candidates.includes(stripped)) candidates.push(stripped);
        } else {
          const prefixed = `exports/${raw}`;
          if (!candidates.includes(prefixed)) candidates.push(prefixed);
        }
      };

      // Kandidaten analog zur Signed-URL-Logik
      pushKey(entry.storage_path);
      pushKey(entry.filename);
      pushKey(entry.batch_number);
      if (entry.client_number && entry.filename) pushKey(`${entry.client_number}/${entry.filename}`);
      if (entry.client_number && entry.storage_path && !entry.storage_path.includes('/')) pushKey(`${entry.client_number}/${entry.storage_path}`);

      for (const k of candidates) {
        const { data } = await bucket.download(k.startsWith('exports/') ? k.replace(/^exports\//, '') : k);
        if (data) {
          const blobUrl = URL.createObjectURL(data);
          const link = document.createElement('a');
          link.href = blobUrl;
          const suggestedName = entry.filename || entry.batch_number || 'export';
          link.download = suggestedName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          // Objekt-URL wieder freigeben
          setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
          return;
        }
      }

      // Wenn weder signierte URL noch Direktdownload funktioniert
      console.error('Download failed for all candidate paths', {
        storage_path: entry.storage_path,
        filename: entry.filename,
        client_number: entry.client_number,
        lastTriedKey: key,
      });
      toast({
        title: "Download fehlgeschlagen",
        description: "Datei im Speicher nicht gefunden (Pfad prüfen).",
        variant: "destructive",
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleCopyLink = async (entry: ExportBatchEntry) => {
    if (entry.export_status !== 'completed') {
      toast({
        title: "Noch nicht verfügbar",
        description: "Für diesen Export liegt noch keine Datei vor.",
      });
      return;
    }

    const { signedUrl } = await createSignedUrlWithFallback(entry, linkTtl);

    if (!signedUrl) {
      toast({
        title: "Link konnte nicht erstellt werden",
        description: "Datei im Speicher nicht gefunden (Pfad prüfen).",
        variant: "destructive",
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(signedUrl);
      toast({
        title: "Link kopiert",
        description: `Signierter Link ist für ${Math.round(linkTtl / 60)} Minuten gültig.`,
      });
    } catch {
      toast({
        title: "Kopieren fehlgeschlagen",
        description: "Der Link konnte nicht in die Zwischenablage kopiert werden.",
        variant: "destructive",
      });
    }
  };

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
          <div className="flex items-center gap-2">
            <Select
              value={String(linkTtl)}
              onValueChange={(v) => setLinkTtl(Number(v))}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Link TTL" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="600">10 Min</SelectItem>
                <SelectItem value="3600">1 Std</SelectItem>
                <SelectItem value="86400">24 Std</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchExportData}
              disabled={loading}
              title="Liste aktualisieren"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {visibleBatches.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Noch keine Exporte vorhanden
          </div>
        ) : (
          <div className="space-y-2">
            {visibleBatches.map((entry) => {
              const canDownload = Boolean(entry.storage_path) && entry.export_status === 'completed';
              const isDownloading = downloadingId === entry.id;

              return (
                <div
                  key={entry.id}
                  className="grid grid-cols-1 md:grid-cols-6 items-center gap-2 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="md:col-span-2">
                    <div className="font-medium">Batch {entry.batch_number}</div>
                    <div className="text-sm text-muted-foreground">
                      {entry.filename}
                    </div>
                    {(entry.file_size || entry.mime_type) && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {entry.file_size ? bytesToSize(entry.file_size) : null}
                        {entry.file_size && entry.mime_type ? " · " : ""}
                        {entry.mime_type || null}
                      </div>
                    )}
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
                  <div className="flex md:justify-center">
                    <Badge variant={entry.export_status === 'completed' ? 'default' : 'secondary'}>
                      {entry.export_status || 'preparing'}
                    </Badge>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyLink(entry)}
                      disabled={!canDownload}
                      title={canDownload ? 'Signierten Link kopieren' : 'Datei noch nicht verfügbar'}
                      className="gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      Link
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDownload(entry)}
                      disabled={!canDownload || isDownloading}
                      title={canDownload ? 'Export herunterladen' : 'Datei noch nicht verfügbar'}
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      {isDownloading ? 'Lädt...' : 'Download'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
