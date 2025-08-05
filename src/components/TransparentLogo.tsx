import { useState, useEffect } from 'react';
import { removeBackground, loadImageFromUrl } from '@/utils/backgroundRemoval';
import { useToast } from '@/hooks/use-toast';

interface TransparentLogoProps {
  src: string;
  alt: string;
  className?: string;
}

export const TransparentLogo = ({ src, alt, className }: TransparentLogoProps) => {
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

  // Show original image if processing failed or while processing
  if (isProcessing || error || !transparentLogoUrl) {
    return (
      <img 
        src={src} 
        alt={alt} 
        className={className}
        style={isProcessing ? { opacity: 0.7 } : undefined}
      />
    );
  }

  // Show transparent logo when ready
  return (
    <img 
      src={transparentLogoUrl} 
      alt={alt} 
      className={className}
    />
  );
};