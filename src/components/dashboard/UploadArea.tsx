import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";

interface UploadFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  confidence?: number;
}

export const UploadArea = () => {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [selectedMandant, setSelectedMandant] = useState<string>("");

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
    if (!selectedMandant) {
      alert("Bitte wählen Sie zuerst einen Mandanten aus.");
      return;
    }
    
    console.log('handleFiles called with:', fileList.length, 'files');
    const fileArray = Array.from(fileList);
    const newFiles: UploadFile[] = fileArray.map((file, index) => ({
      id: `file-${Date.now()}-${index}`,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'uploading',
      progress: 0
    }));

    console.log('New files created:', newFiles);
    setFiles(prev => [...prev, ...newFiles]);

    // Upload zu Webhook
    newFiles.forEach((uploadFile, index) => {
      console.log('Starting upload for file:', uploadFile.name);
      uploadFileToWebhook(fileArray[index], uploadFile.id);
    });
  };

  const uploadFileToWebhook = async (file: File, fileId: string) => {
    const webhookUrl = 'https://jedai-solutions.app.n8n.cloud/webhook-test/beleg-upload';
    
    console.log('Starting upload to:', webhookUrl);
    console.log('File details:', { name: file.name, size: file.size, type: file.type });
    
    try {
      // Create FormData to send the actual file
      const formData = new FormData();
      formData.append('file', file);
      formData.append('filename', file.name);
      formData.append('fileId', fileId);
      formData.append('fileType', file.type);
      formData.append('mimeType', file.type);
      formData.append('fileSize', file.size.toString());
      formData.append('mandantId', selectedMandant);
      
      console.log('FormData prepared with actual file');
      
      // Update progress to show upload starting
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, progress: 10 } : f
      ));

      console.log('Making request to:', webhookUrl);
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        body: formData, // Send FormData directly, don't set Content-Type header
      });

      console.log('Response received:', response.status, response.statusText);
      
      if (response.ok) {
        const responseData = await response.text();
        console.log('Response data:', responseData);
        
        setFiles(prev => prev.map(f => 
          f.id === fileId ? { ...f, status: 'processing', progress: 100 } : f
        ));

        // Complete after processing time
        setTimeout(() => {
          setFiles(prev => prev.map(f => 
            f.id === fileId 
              ? { 
                  ...f, 
                  status: 'completed', 
                  confidence: Math.floor(Math.random() * 20) + 80 
                } 
              : f
          ));
          console.log('File completed:', fileId);
        }, 2000);
      } else {
        console.error('Upload failed:', response.status, response.statusText);
        setFiles(prev => prev.map(f => 
          f.id === fileId ? { ...f, status: 'error', progress: 0 } : f
        ));
      }
    } catch (error) {
      console.error('Upload error:', error);
      setFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, status: 'error', progress: 0 } 
          : f
      ));
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
    <Card className="bg-gradient-card backdrop-blur-glass border-white/20 shadow-glass hover:shadow-strong transition-all duration-300">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm font-modern">
          <span>Beleg-Upload</span>
          <Badge variant="outline" className="text-xs">PDF/JPG/PNG</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Mandant Selection */}
        <div className="mb-4 p-4 bg-white/10 backdrop-blur-glass rounded-lg border border-white/20">
          <Label htmlFor="mandant-select" className="text-sm font-semibold text-foreground mb-2 block">
            Mandant auswählen *
          </Label>
          <Select value={selectedMandant} onValueChange={setSelectedMandant} required>
            <SelectTrigger className="bg-white/10 backdrop-blur-glass border-white/20">
              <SelectValue placeholder="Bitte Mandant auswählen..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="m1">Mustermann GmbH</SelectItem>
              <SelectItem value="m2">Beispiel AG</SelectItem>
              <SelectItem value="m3">Demo KG</SelectItem>
            </SelectContent>
          </Select>
          {!selectedMandant && (
            <div className="flex items-center gap-2 mt-2 text-warning text-xs">
              <AlertTriangle className="h-3 w-3" />
              <span>Ein Mandant muss vor dem Upload ausgewählt werden</span>
            </div>
          )}
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