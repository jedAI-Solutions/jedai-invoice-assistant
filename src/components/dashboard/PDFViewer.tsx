import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PDFViewerProps {
  documentUrl: string;
}

export const PDFViewer = ({ documentUrl }: PDFViewerProps) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        setSignedUrl(null);
        // Revoke previously created blob URLs
        setBlobUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return null;
        });

        if (!documentUrl) {
          throw new Error('Kein Dokumentenpfad übergeben');
        }

        // If a full URL is provided, try to fetch as Blob for reliable inline preview
        if (/^https?:\/\//.test(documentUrl)) {
          try {
            const resp = await fetch(documentUrl, { credentials: 'omit' });
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const blob = await resp.blob();
            if (cancelled) return;
            const url = URL.createObjectURL(blob);
            setBlobUrl(url);
            return;
          } catch (e) {
            // Fallback to using the direct URL in the embed
            if (cancelled) return;
            setSignedUrl(documentUrl);
            return;
          }
        }

        const BUCKET = 'taxagent-documents';
        // Normalize to a path relative to the bucket
        const normalizedPath = documentUrl
          .replace(/^\/?taxagent-documents\//, '')
          .replace(/^\/+/, '');

        // Attempt to download the file as a Blob for stable inline preview
        const tryDownload = async (path: string) => {
          const { data, error } = await supabase.storage
            .from(BUCKET)
            .download(path);
          if (error || !data) throw error || new Error('Download fehlgeschlagen');
          return data;
        };

        let blob: Blob | null = null;
        try {
          blob = await tryDownload(normalizedPath);
        } catch (e) {
          // Retry with .pdf suffix if missing
          if (!/\.pdf$/i.test(normalizedPath)) {
            const altPath = `${normalizedPath}.pdf`;
            try {
              blob = await tryDownload(altPath);
            } catch (e2) {
              // Final fallback: create a signed URL for embedding
              const signed = await supabase.storage
                .from(BUCKET)
                .createSignedUrl(normalizedPath, 3600);

              if (signed.error && !/\.pdf$/i.test(normalizedPath)) {
                const retrySigned = await supabase.storage
                  .from(BUCKET)
                  .createSignedUrl(`${normalizedPath}.pdf`, 3600);
                if (retrySigned.error) throw retrySigned.error;
                if (cancelled) return;
                setSignedUrl(retrySigned.data.signedUrl);
                return;
              }

              if (signed.error) throw signed.error;
              if (cancelled) return;
              setSignedUrl(signed.data.signedUrl);
              return;
            }
          } else {
            // Path had .pdf but download failed: fallback to signed URL
            const signed = await supabase.storage
              .from(BUCKET)
              .createSignedUrl(normalizedPath, 3600);
            if (signed.error) throw signed.error;
            if (cancelled) return;
            setSignedUrl(signed.data.signedUrl);
            return;
          }
        }

        if (blob) {
          if (cancelled) return;
          const url = URL.createObjectURL(blob);
          setBlobUrl(url);
          return;
        }
      } catch (err) {
        console.error('Error preparing PDF preview:', err);
        if (!cancelled) setError('Fehler beim Laden der Vorschau');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [documentUrl]);

  // Cleanup any object URLs when they change/unmount
  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  if (loading) {
    return (
      <div className="w-full h-96 border border-white/20 rounded-lg bg-white/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Dokument wird geladen...</p>
        </div>
      </div>
    );
  }

  if (error || !signedUrl) {
    return (
      <div className="w-full h-96 border border-white/20 rounded-lg bg-white/5 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-12 h-12 text-muted-foreground mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-sm text-muted-foreground">{error || 'Dokument konnte nicht geladen werden'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-96 border border-white/20 rounded-lg overflow-hidden bg-white">
      <object
        data={blobUrl || (signedUrl ? `${signedUrl}#view=FitH` : undefined)}
        type="application/pdf"
        width="100%"
        height="100%"
      >
        <div className="p-4 text-center">
          <p className="text-sm text-muted-foreground mb-2">PDF-Vorschau wird nicht unterstützt.</p>
          <a href={blobUrl || signedUrl || '#'} target="_blank" rel="noopener noreferrer" className="text-primary underline">In neuem Tab öffnen</a>
        </div>
      </object>
    </div>
  );
};
