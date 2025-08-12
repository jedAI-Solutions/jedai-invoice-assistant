import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";

// Use a workerless setup for maximum bundler/browser compatibility
// Note: Do not reassign GlobalWorkerOptions (read-only in some environments).
// disableWorker is passed per-document below
interface PDFJsViewerProps {
  src: string; // blob: URL or signed HTTPS URL
  data?: ArrayBuffer | Uint8Array | Blob; // raw bytes if available (avoids blob fetch issues)
  className?: string;
  onError?: (error: unknown) => void;
}

export const PDFJsViewer = ({ src, data, className, onError }: PDFJsViewerProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let renderTask: any | null = null;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!src) throw new Error("Kein PDF-Quellpfad übergeben");
        const container = containerRef.current;
        const canvas = canvasRef.current;
        if (!container || !canvas) return;

        // Build loadingTask using provided data when available to avoid blob URL fetch issues (e.g., Safari)
        let loadingTask: any;
        if (data) {
          const bytes = data instanceof Blob ? await data.arrayBuffer() : data;
          if (cancelled) return;
          loadingTask = (pdfjsLib as any).getDocument({
            data: bytes,
            disableWorker: true,
            isEvalSupported: false,
          });
        } else if (src.startsWith("blob:")) {
          // blob: URLs are not reliably fetchable in Safari; try fetch and surface errors to fallback
          const resp = await fetch(src).catch((e) => { throw e; });
          if (!resp || !resp.ok) throw new Error(`HTTP ${resp?.status}`);
          const buf = await resp.arrayBuffer();
          if (cancelled) return;
          loadingTask = (pdfjsLib as any).getDocument({
            data: buf,
            disableWorker: true,
            isEvalSupported: false,
          });
        } else {
          // HTTPS URL: try fetch bytes first, then let PDF.js loader handle URL as fallback
          try {
            const resp = await fetch(src, { credentials: "omit" });
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const buf = await resp.arrayBuffer();
            if (cancelled) return;
            loadingTask = (pdfjsLib as any).getDocument({
              data: buf,
              disableWorker: true,
              isEvalSupported: false,
            });
          } catch (fetchErr) {
            if (cancelled) return;
            loadingTask = (pdfjsLib as any).getDocument({
              url: src,
              disableWorker: true,
              isEvalSupported: false,
            });
          }
        }

        const pdf = await loadingTask.promise;
        if (cancelled) return;
        const page = await pdf.getPage(1);

        // Compute scale to fit container width
        const viewportBase = page.getViewport({ scale: 1 });
        const targetWidth = container.clientWidth || 800;
        const scale = Math.max(0.5, Math.min(3, targetWidth / viewportBase.width));
        const viewport = page.getViewport({ scale });

        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("CanvasContext fehlt");

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        renderTask = page.render({ canvasContext: ctx, viewport });
        await renderTask.promise;
        if (cancelled) return;
      } catch (e) {
        if (!cancelled) {
          console.error("PDFJsViewer render error:", e);
          setError("Fehler beim Rendern der PDF-Vorschau");
          onError?.(e);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
      try {
        renderTask?.cancel();
      } catch {}
    };
  }, [src, data, onError]);

  return (
    <div ref={containerRef} className={className} style={{ width: "100%", height: "100%", position: "relative" }}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">PDF wird geladen...</p>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <svg className="w-12 h-12 text-muted-foreground mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
      )}
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: error ? "none" : "block" }} />
    </div>
  );
};
