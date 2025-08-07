import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PDFViewerProps {
  documentUrl: string;
}

export const PDFViewer = ({ documentUrl }: PDFViewerProps) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getSignedUrl = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase.storage
          .from('documents')
          .createSignedUrl(documentUrl, 3600); // 1 hour expiry

        if (error) throw error;

        setSignedUrl(data.signedUrl);
      } catch (err) {
        console.error('Error getting signed URL:', err);
        setError('Fehler beim Laden des Dokuments');
      } finally {
        setLoading(false);
      }
    };

    if (documentUrl) {
      getSignedUrl();
    }
  }, [documentUrl]);

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
      <iframe
        src={signedUrl}
        width="100%"
        height="100%"
        className="border-0"
        title="PDF Dokument"
      />
    </div>
  );
};