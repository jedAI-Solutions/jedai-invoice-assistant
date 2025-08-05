import { useState, useEffect } from 'react';
import { removeBackground, loadImageFromUrl } from '@/utils/backgroundRemoval';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface TransparentLogoProps {
  src: string;
  alt: string;
  className?: string;
  showExportButton?: boolean;
}

export const TransparentLogo = ({ src, alt, className, showExportButton = false }: TransparentLogoProps) => {
  const [transparentLogoUrl, setTransparentLogoUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const processLogo = async () => {
      setIsProcessing(true);
      setError(null);
      
      try {
        console.log('Loading logo for background removal...');
        toast({
          title: "Logo wird verarbeitet",
          description: "Hintergrund wird entfernt..."
        });

        // Load the original image
        const originalImage = await loadImageFromUrl(src);
        
        // Remove background
        const transparentBlob = await removeBackground(originalImage);
        
        // Create URL for the transparent image
        const url = URL.createObjectURL(transparentBlob);
        setTransparentLogoUrl(url);
        
        toast({
          title: "Logo erfolgreich verarbeitet",
          description: "Transparenter Hintergrund wurde erstellt!"
        });
        
        console.log('Logo background removal completed successfully');
      } catch (err) {
        console.error('Error processing logo:', err);
        setError('Fehler beim Entfernen des Hintergrunds');
        toast({
          title: "Fehler",
          description: "Logo konnte nicht verarbeitet werden. Verwende Original.",
          variant: "destructive"
        });
      } finally {
        setIsProcessing(false);
      }
    };

    processLogo();

    // Cleanup function to revoke object URL
    return () => {
      if (transparentLogoUrl) {
        URL.revokeObjectURL(transparentLogoUrl);
      }
    };
  }, [src]);

  const exportLogo = async () => {
    if (!transparentLogoUrl) return;
    
    try {
      // Create a high-resolution canvas (2x original size)
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Set canvas to high resolution (2048x2048 max)
        const maxSize = 2048;
        const scale = Math.min(maxSize / img.width, maxSize / img.height);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        
        // Enable high-quality rendering
        ctx!.imageSmoothingEnabled = true;
        ctx!.imageSmoothingQuality = 'high';
        
        // Draw the image at high resolution
        ctx!.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Convert to blob and download
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'logo-transparent-hd.png';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            toast({
              title: "Logo exportiert",
              description: "High-Resolution PNG wurde heruntergeladen!"
            });
          }
        }, 'image/png', 1.0);
      };
      
      img.src = transparentLogoUrl;
    } catch (err) {
      console.error('Error exporting logo:', err);
      toast({
        title: "Export-Fehler",
        description: "Logo konnte nicht exportiert werden.",
        variant: "destructive"
      });
    }
  };

  // Show original image if processing failed or while processing
  if (isProcessing || error || !transparentLogoUrl) {
    return (
      <div className="relative">
        <img 
          src={src} 
          alt={alt} 
          className={className}
          style={isProcessing ? { opacity: 0.7 } : undefined}
        />
        {showExportButton && (
          <Button
            onClick={exportLogo}
            variant="outline"
            size="sm"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            disabled={isProcessing || !!error}
          >
            <Download className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  // Show transparent logo when ready
  return (
    <div className="relative group">
      <img 
        src={transparentLogoUrl} 
        alt={alt} 
        className={className}
      />
      {showExportButton && (
        <Button
          onClick={exportLogo}
          variant="outline"
          size="sm"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white"
        >
          <Download className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};