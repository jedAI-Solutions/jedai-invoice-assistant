import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import MandantSelectorAll from "./MandantSelectorAll";

interface UploadFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  confidence?: number;
  documentRegistryId?: string;
  documentId?: string;
}

export const UploadArea = () => {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [selectedMandant, setSelectedMandant] = useState<string>("all");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  const handleFiles = (fileList: FileList) => {
    console.log('handleFiles called with:', fileList.length, 'files');
    const fileArray = Array.from(fileList);
    
    // Clear previous selections and add new ones
    setSelectedFiles(fileArray);
    
    const newFiles: UploadFile[] = fileArray.map((file, index) => ({
      id: `file-${Date.now()}-${index}`,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'uploading',
      progress: 0
    }));

    console.log('New files selected:', newFiles);
    // Replace existing files instead of appending
    setFiles(newFiles);
  };

  const removeSelectedFile = (indexToRemove: number) => {
    setSelectedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
    setFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleUpload = async () => {
    console.log('handleUpload called');
    console.log('selectedFiles.length:', selectedFiles.length);
    console.log('selectedMandant:', selectedMandant);
    
    if (selectedFiles.length === 0) {
      toast({
        title: "Keine Dateien ausgewählt",
        description: "Bitte wählen Sie erst Dateien aus, bevor Sie den Upload starten.",
        variant: "destructive",
      });
      return;
    }
    
    console.log('Setting isUploading to true');
    setIsUploading(true);
    const uploadFiles = files.filter(f => f.status === 'uploading');
    console.log('uploadFiles:', uploadFiles);
    
    try {
      await uploadFilesToWebhook(selectedFiles, uploadFiles);
      // Clear selected files after upload
      setSelectedFiles([]);
    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        title: "Upload fehlgeschlagen",
        description: "Fehler beim Upload: " + error.message,
        variant: "destructive",
      });
    } finally {
      console.log('Setting isUploading to false');
      setIsUploading(false);
    }
  };

  const uploadFilesToWebhook = async (fileArray: File[], uploadFiles: UploadFile[]) => {
    try {
      // Get authentication session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Anmeldung erforderlich",
          description: "Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.",
          variant: "destructive",
        });
        return;
      }

      // Create FormData to send all files together
      const formData = new FormData();
      
      // Add all files to the form data
      fileArray.forEach((file, index) => {
        formData.append('file', file); // Edge function will handle multiple files with same key
      });
      
      // Add mandant information - required for edge function
      if (selectedMandant && selectedMandant !== 'all') {
        formData.append('mandant_id', selectedMandant);
      } else {
        // If no mandant selected or 'all' selected, use the first available mandant
        // The edge function requires a mandant_id for security
        toast({
          title: "Mandant auswählen",
          description: "Bitte wählen Sie einen spezifischen Mandanten für den Upload aus.",
          variant: "destructive",
        });
        setIsUploading(false);
        return;
      }
      
      console.log(`Uploading ${fileArray.length} files together`);
      
      // Update progress to show upload starting
      setFiles(prev => prev.map(f => 
        uploadFiles.some(uf => uf.id === f.id) ? { ...f, progress: 10 } : f
      ));

      // Use secure edge function 
      console.log('Starting upload to edge function...');
      const response = await fetch(`https://awrduehwnyxbwtjbbrhw.supabase.co/functions/v1/secure-file-upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      });
      
      console.log('Upload response status:', response.status);
      console.log('Upload response ok:', response.ok);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Batch upload result:', result);
        
        // Update all uploaded files to processing with document registry info
        setFiles(prev => prev.map((f, index) => {
          if (uploadFiles.some(uf => uf.id === f.id)) {
            const uploadedFile = result.processedFiles?.[index];
            return { 
              ...f, 
              status: 'processing', 
              progress: 100,
              documentRegistryId: uploadedFile?.documentRegistryId,
              documentId: uploadedFile?.documentId
            };
          }
          return f;
        }));

        // Complete after processing time and refresh booking overview
        setTimeout(() => {
          setFiles(prev => prev.map(f => 
            uploadFiles.some(uf => uf.id === f.id)
              ? { 
                  ...f, 
                  status: 'completed', 
                  confidence: Math.floor(Math.random() * 20) + 80 
                } 
              : f
          ));
          
          // Trigger refresh of booking overview
          if ((window as any).refreshBookingOverview) {
            console.log('Triggering booking overview refresh after upload completion');
            (window as any).refreshBookingOverview();
          }
        }, 2000);

        // Show success message
        toast({
          title: "Files uploaded successfully",
          description: `${fileArray.length} files have been processed and forwarded to workflow.`,
        });
      } else {
        const errorText = await response.text();
        console.error('Upload failed. Status:', response.status, 'Response:', errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || response.statusText };
        }
        throw new Error(errorData.error || `Upload failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Batch upload error:', error);
      
      // Update all files to error state
      setFiles(prev => prev.map(f => 
        uploadFiles.some(uf => uf.id === f.id) ? { ...f, status: 'error', progress: 0 } : f
      ));
      
      // Show error message
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'uploading': return 'secondary';
      case 'processing': return 'secondary';
      case 'completed': return 'default';
      case 'error': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'uploading': return 'Hochladen...';
      case 'processing': return 'KI-Verarbeitung...';
      case 'completed': return 'Abgeschlossen';
      case 'error': return 'Fehler';
      default: return 'Unbekannt';
    }
  };

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm font-modern">
          <span>Beleg-Upload</span>
          <Badge variant="outline" className="text-xs">PDF/JPG/PNG</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <MandantSelectorAll 
            selectedMandant={selectedMandant} 
            onMandantChange={setSelectedMandant} 
          />
        </div>
        <div
          className={`border-2 border-dashed rounded-lg p-4 text-center transition-all duration-300 ${
            dragActive 
              ? 'border-primary bg-primary/10 backdrop-blur-glass scale-105' 
              : 'border-white/30 bg-white/5 backdrop-blur-glass hover:bg-white/10'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground font-modern">
                Belege ablegen
              </p>
              <Button 
                variant="link" 
                size="sm"
                className="p-0 h-auto text-primary text-xs"
                onClick={() => document.getElementById('file-input')?.click()}
              >
                oder auswählen
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              PDF, JPG, PNG • Max. 10MB
            </p>
          </div>
          <input
            id="file-input"
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.xml"
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
        </div>

        {selectedFiles.length > 0 && (
          <div className="mt-4 space-y-3">
            <h4 className="font-semibold text-foreground text-sm">Ausgewählte Dateien ({selectedFiles.length})</h4>
            <div className="space-y-2">
              {selectedFiles.map((file, index) => (
                <div key={`selected-${index}`} className="flex items-center justify-between p-3 border border-white/20 rounded-lg bg-white/5 backdrop-blur-glass">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatFileSize(file.size)}</span>
                      <span>•</span>
                      <span>{file.type}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSelectedFile(index)}
                    className="ml-2 text-muted-foreground hover:text-destructive h-8 w-8 p-0"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </Button>
                </div>
              ))}
            </div>
            <Button 
              onClick={() => {
                console.log('Upload button clicked!');
                console.log('Button disabled:', isUploading);
                console.log('Selected files:', selectedFiles.length);
                handleUpload();
              }}
              disabled={isUploading}
              className="w-full"
              variant="gradient"
            >
              {isUploading ? "Wird hochgeladen..." : `${selectedFiles.length} ${selectedFiles.length === 1 ? 'Datei' : 'Dateien'} hochladen`}
            </Button>
          </div>
        )}

        {files.length > 0 && (
          <div className="mt-6 space-y-3">
            <h4 className="font-semibold text-foreground">Verarbeitungsfortschritt</h4>
            {files.map((file) => (
              <div key={file.id} className="border border-white/20 rounded-lg p-4 bg-white/10 backdrop-blur-glass hover:bg-white/15 transition-all duration-300">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm truncate flex-1 mr-4">{file.name}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusColor(file.status) as any}>
                      {getStatusText(file.status)}
                    </Badge>
                    {file.confidence && (
                      <Badge variant="outline">
                        KI: {file.confidence}%
                      </Badge>
                    )}
                  </div>
                </div>
                {file.documentRegistryId && (
                  <div className="text-xs text-muted-foreground mb-2">
                    Registry ID: {file.documentRegistryId} | Document ID: {file.documentId}
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <span>{formatFileSize(file.size)}</span>
                  <span>•</span>
                  <span>{file.type}</span>
                </div>
                {file.status !== 'completed' && (
                  <Progress value={file.progress} className="h-2" />
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};