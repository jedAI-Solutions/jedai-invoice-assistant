import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PDFJsViewer } from "./PDFJsViewer";

interface PDFViewerProps {
  documentUrl: string;
}

export const PDFViewer = ({ documentUrl }: PDFViewerProps) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useFallback, setUseFallback] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);


  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        setUseFallback(false);
        setSignedUrl(null);
        setPdfBlob(null);
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
            const pdfBlob = blob.type === 'application/pdf' ? blob : new Blob([blob], { type: 'application/pdf' });
            if (cancelled) return;
            const url = URL.createObjectURL(pdfBlob);
            setBlobUrl(url);
            setPdfBlob(pdfBlob);
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
                const su = retrySigned.data.signedUrl;
                setSignedUrl(su);
                // Try to fetch into Blob for Safari and strict browsers
                try {
                  const resp = await fetch(su, { credentials: 'omit' });
                  if (resp.ok) {
                    const b = await resp.blob();
                    const pdfBlob = b.type === 'application/pdf' ? b : new Blob([b], { type: 'application/pdf' });
                    if (!cancelled) {
                      const url = URL.createObjectURL(pdfBlob);
                      setBlobUrl(url);
                    }
                  }
                } catch {}
                return;
              }

              if (signed.error) throw signed.error;
              if (cancelled) return;
              const su = signed.data.signedUrl;
              setSignedUrl(su);
              // Try to fetch into Blob for Safari and strict browsers
              try {
                const resp = await fetch(su, { credentials: 'omit' });
                if (resp.ok) {
                  const b = await resp.blob();
                  const pdfBlob = b.type === 'application/pdf' ? b : new Blob([b], { type: 'application/pdf' });
                  if (!cancelled) {
                    const url = URL.createObjectURL(pdfBlob);
                    setBlobUrl(url);
                  }
                }
              } catch {}
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
          const pdfBlob = blob.type === 'application/pdf' ? blob : new Blob([blob], { type: 'application/pdf' });
          if (cancelled) return;
          const url = URL.createObjectURL(pdfBlob);
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

  if (error || (!signedUrl && !blobUrl)) {
    return (
      <div className="w-full h-96 border border-white/20 rounded-lg bg-white/5 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-12 h-12 text-muted-foreground mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-sm text-muted-foreground">{error || 'Dokument konnte nicht geladen werden'}</p>
          {signedUrl && (
            <a href={signedUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline mt-2 inline-block">In neuem Tab öffnen</a>
          )}
        </div>
      </div>
    );
  }

  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  
  const viewerSrc = blobUrl || signedUrl || "";
  const safariSrc = signedUrl || viewerSrc;

  return (
    <div className="w-full h-96 border border-white/20 rounded-lg overflow-hidden bg-white">
      {viewerSrc ? (
        isSafari ? (
          // Safari: native PDF embed is more reliable
          <object data={safariSrc} type="application/pdf" className="w-full h-full">
            <div className="p-4 text-center">
              <p className="text-sm text-muted-foreground mb-2">Inline-Vorschau nicht möglich (Safari).</p>
              {safariSrc && (
                <a href={safariSrc} target="_blank" rel="noopener noreferrer" className="text-primary underline">In neuem Tab öffnen</a>
              )}
            </div>
          </object>
        ) : !useFallback ? (
          // Primary: PDF.js canvas-based rendering
          <PDFJsViewer src={viewerSrc} className="w-full h-full" onError={() => setUseFallback(true)} />
        ) : (
          // Fallback: native PDF embed
          <object data={viewerSrc} type="application/pdf" className="w-full h-full">
            <div className="p-4 text-center">
              <p className="text-sm text-muted-foreground mb-2">Inline-Vorschau nicht möglich.</p>
              {signedUrl && (
                <a href={signedUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">In neuem Tab öffnen</a>
              )}
            </div>
          </object>
        )
      ) : (
        <div className="p-4 text-center">
          <p className="text-sm text-muted-foreground mb-2">PDF-Vorschau wird nicht unterstützt.</p>
          {signedUrl && (
            <a href={signedUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">In neuem Tab öffnen</a>
          )}
        </div>
      )}
    </div>
  );
};
