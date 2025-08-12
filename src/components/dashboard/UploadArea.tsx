import { useState, useCallback } from 'react';
import { Upload, FileText, X, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useMandants } from "@/hooks/useMandants";

interface UploadFile {
  file: File;
  documentId: string;
  registryId: string;
  hash: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  isDuplicate?: boolean;
}

interface UploadAreaProps {
  selectedMandant?: string;
}

export const UploadArea = ({ selectedMandant: propSelectedMandant = "all" }: UploadAreaProps) => {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedMandant, setSelectedMandant] = useState<string>(propSelectedMandant);
  const { mandants, loading } = useMandants();
  const { toast } = useToast();

  // File validation constants
  const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const MAX_FILES = 10;

  // Generate SHA-256 hash for duplicate detection
  const generateFileHash = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  // Check for duplicate files in database
  const checkDuplicate = async (hash: string): Promise<boolean> => {
    const { data } = await supabase
      .from('document_registry')
      .select('id')
      .eq('file_hash', hash)
      .maybeSingle();
    
    return !!data;
  };

  // Generate IDs
  const generateIds = () => ({
    documentId: crypto.randomUUID(),
    registryId: crypto.randomUUID()
  });

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🎯 Drag event:', e.type);
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    console.log('📁 Files dropped:', e.dataTransfer.files.length);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  const processFiles = async (newFiles: File[]) => {
    console.log('🔄 processFiles called with', newFiles.length, 'files');
    console.log('📋 selectedMandant:', selectedMandant);
    console.log('👥 available mandants:', mandants.length);
    
    // Validate mandant selection
    if (!selectedMandant || selectedMandant === 'all') {
      console.error('❌ No mandant selected for upload');
      toast({
        title: "Mandant auswählen",
        description: "Bitte wählen Sie einen Mandanten vor dem Upload aus.",
        variant: "destructive"
      });
      return;
    }

    // Validate file count
    if (files.length + newFiles.length > MAX_FILES) {
      toast({
        title: "Zu viele Dateien",
        description: `Maximal ${MAX_FILES} Dateien gleichzeitig erlaubt.`,
        variant: "destructive"
      });
      return;
    }

    // Process each file
    const processedFiles: UploadFile[] = [];
    
    for (const file of newFiles) {
      // Validate type
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast({
          title: "Ungültiger Dateityp",
          description: `${file.name} ist kein unterstütztes Format.`,
          variant: "destructive"
        });
        continue;
      }

      // Validate size
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "Datei zu groß",
          description: `${file.name} überschreitet die maximale Größe von 10MB.`,
          variant: "destructive"
        });
        continue;
      }

      // Generate hash and check duplicate
      const hash = await generateFileHash(file);
      const isDuplicate = await checkDuplicate(hash);
      const ids = generateIds();

      processedFiles.push({
        file,
        ...ids,
        hash,
        status: 'pending',
        progress: 0,
        isDuplicate
      });
    }

    setFiles(prev => [...prev, ...processedFiles]);

    // Show duplicate warning if any
    const duplicates = processedFiles.filter(f => f.isDuplicate);
    if (duplicates.length > 0) {
      toast({
        title: "Duplikate erkannt",
        description: `${duplicates.length} Datei(en) wurden bereits hochgeladen.`,
        variant: "destructive"
      });
    }
  };

  const removeFile = (indexToRemove: number) => {
    setFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  // Upload to Supabase Storage with better filename sanitization
  const uploadToSupabase = async (uploadFile: UploadFile, mandantNr: string): Promise<string> => {
    console.log('uploadToSupabase called with:', { fileName: uploadFile.file.name, mandantNr });
    
    try {
      const timestamp = Date.now();
      const date = new Date();
      const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      // Better filename sanitization - remove all non-ASCII and special characters
      const fileExtension = uploadFile.file.name.split('.').pop() || '';
      const baseName = uploadFile.file.name.replace(/\.[^/.]+$/, ""); // Remove extension
      const sanitizedBaseName = baseName
        .replace(/[^\w\s-]/g, '') // Remove all non-word chars except spaces and hyphens
        .replace(/\s+/g, '_')     // Replace spaces with underscores
        .replace(/-+/g, '_')      // Replace hyphens with underscores
        .substring(0, 50);        // Limit length
      
      const fileName = `${sanitizedBaseName}_${timestamp}.${fileExtension}`;
      const filePath = `${mandantNr}/${yearMonth}/${fileName}`;

      console.log('uploadToSupabase: uploading to path:', filePath);
      
      const { data, error } = await supabase.storage
        .from('taxagent-documents')
        .upload(filePath, uploadFile.file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('uploadToSupabase: storage error:', error);
        throw new Error(`Storage upload failed: ${error.message}`);
      }
      
      console.log('uploadToSupabase: storage success:', data.path);
      return data.path;
    } catch (error) {
      console.error('uploadToSupabase: unexpected error:', error);
      throw error;
    }
  };

  const createRegistryEntry = async (
    uploadFile: UploadFile, 
    storagePath: string,
    mandant: any
  ) => {
    console.log('createRegistryEntry called with:', { uploadFile: uploadFile.file.name, storagePath, mandant });
    const { data: { user } } = await supabase.auth.getUser();
    
    const entry = {
      document_id: uploadFile.documentId,
      original_filename: uploadFile.file.name,
      file_hash: uploadFile.hash,
      file_size: uploadFile.file.size,
      mandant_id: mandant.id,
      processing_status: 'received',
      upload_source: 'web',
      gobd_compliant: true
    };

    console.log('createRegistryEntry: inserting entry:', entry);
    const { error } = await supabase
      .from('document_registry')
      .insert(entry);

    if (error) {
      console.error('createRegistryEntry: error inserting:', error);
      throw error;
    }
    console.log('createRegistryEntry: success');
  };

  // Send to n8n Webhook
  const sendToN8nWebhook = async () => {
    console.log('🚀 sendToN8nWebhook called, files:', files.length, 'selectedMandant:', selectedMandant);
    setIsUploading(true);
    const currentMandant = mandants.find(m => m.id === selectedMandant);
    
    console.log('👤 currentMandant found:', currentMandant);
    if (!currentMandant) {
      console.error('❌ No mandant found for ID:', selectedMandant);
      toast({
        title: "Fehler",
        description: "Mandant nicht gefunden.",
        variant: "destructive"
      });
      setIsUploading(false);
      return;
    }

    try {
      console.log('📁 sendToN8nWebhook: starting upload process for', files.length, 'files');
      
      // Mark all as uploading
      setFiles(prev => prev.map(f => ({ ...f, status: 'uploading', progress: 30 })));

      // Send files securely via Edge Function (secure-file-upload) as a single batch
      console.log('🛡️ Sending batch to secure edge upload...');
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) throw new Error('Nicht angemeldet');

      // Prepare multipart form data (batch)
      const form = new FormData();
      form.append('mandant_id', currentMandant.id);
      files.forEach((f) => {
        form.append('files', f.file, f.file.name);
      });

      // Update progress mid-way
      setFiles(prev => prev.map(f => ({ ...f, progress: 60 })));

      const functionUrl = 'https://awrduehwnyxbwtjbbrhw.supabase.co/functions/v1/secure-file-upload';
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3cmR1ZWh3bnl4Ynd0amJicmh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1MTA3NzQsImV4cCI6MjA2ODA4Njc3NH0.D9qdE99x88EKAFJxRHbseuaphVlncOGyICMbd1vZUSw'
        },
        body: form
      });

      console.log('📊 Edge upload status:', response.status);
      const raw = await response.text();
      let parsed: any = null;
      try { parsed = raw ? JSON.parse(raw) : null; } catch {}
      if (!response.ok) {
        const fd = parsed?.forwarding_details;
        const msg = parsed?.message || `Edge upload failed`;
        const extra = fd
          ? ` [n8n ${fd.status} ${fd.status_text}] ${fd.response_snippet?.slice(0,200) || ''}`
          : raw ? ` ${raw.slice(0,200)}` : '';
        throw new Error(`${msg} (${response.status})${extra}`);
      }

      // Success mapping per returned files
      const processed = parsed?.processed_files as Array<{ file_name: string }> | undefined;
      if (processed && Array.isArray(processed)) {
        setFiles(prev => prev.map(f => {
          const ok = processed.some(p => p.file_name === f.file.name);
          return ok ? { ...f, progress: 100, status: 'success' } : { ...f, status: 'error' };
        }));
      } else {
        // Fallback: mark all as success
        setFiles(prev => prev.map(f => ({ ...f, progress: 100, status: 'success' })));
      }

      const failedCount = (parsed?.validation_errors?.length || 0);
      toast({
        title: "Upload erfolgreich",
        description: `${files.length - failedCount} von ${files.length} Dateien wurden sicher übermittelt.`,
      });

      // Clear files after 3 seconds
      setTimeout(() => {
        setFiles([]);
      }, 3000);

    } catch (error) {
      console.error('💥 Upload error:', error);
      setFiles(prev => prev.map(f => ({ ...f, status: 'error' })));
      toast({
        title: "Upload fehlgeschlagen",
        description: error instanceof Error ? error.message : "Bitte versuchen Sie es erneut.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm font-modern">
          <span>Dokumente hochladen</span>
          <Badge variant="outline" className="text-xs">PDF/JPG/PNG</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="mb-4 p-3 bg-blue-500/20 border border-blue-500/50 rounded-lg">
            <p className="text-sm text-blue-100">Lade Mandanten...</p>
          </div>
        )}
        
        {/* Mandant Selection */}
        {!loading && mandants.length > 0 && (
          <div className="mb-4">
            <Label htmlFor="mandant-select" className="mb-2 block">
              Mandant auswählen
            </Label>
            <Select value={selectedMandant} onValueChange={(v) => setSelectedMandant(v)}>
              <SelectTrigger id="mandant-select" className="w-full bg-white/95 backdrop-blur-md border-white/30 hover:bg-white shadow-lg">
                <SelectValue placeholder="Bitte Mandant auswählen" />
              </SelectTrigger>
              <SelectContent className="bg-white/98 backdrop-blur-md border-white/50 shadow-xl z-50">
                <SelectItem value="all">Bitte Mandant auswählen</SelectItem>
                {mandants.map((mandant) => (
                  <SelectItem key={mandant.id} value={mandant.id}>
                    {mandant.mandant_nr} - {mandant.name1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        
        {/* Mandant Check */}
        {(!selectedMandant || selectedMandant === 'all') && (
          <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
            <p className="text-sm text-yellow-100 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Bitte wählen Sie einen Mandanten aus
            </p>
          </div>
        )}

        {/* Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { 
            e.preventDefault(); 
            setDragActive(true); 
            console.log('🎯 Drag over detected');
          }}
          onDragLeave={() => {
            setDragActive(false);
            console.log('🎯 Drag leave detected');
          }}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
            transition-all duration-200
            ${dragActive 
              ? 'border-blue-400 bg-blue-500/20' 
              : 'border-gray-500/50 hover:border-gray-400/50 hover:bg-white/5'
            }
            ${(!selectedMandant || selectedMandant === 'all') ? 'opacity-50 pointer-events-none' : ''}
          `}
          onClick={() => {
            console.log('🖱️ Drop zone clicked');
            document.getElementById('file-input')?.click();
          }}
        >
          <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-300">
            Dateien hier ablegen
          </p>
          <p className="text-xs text-gray-400 mt-1">
            oder klicken zum Auswählen
          </p>
          <input
            id="file-input"
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => {
              console.log('📂 File input changed:', e.target.files?.length);
              if (e.target.files && e.target.files.length > 0) {
                processFiles(Array.from(e.target.files));
              }
            }}
            className="hidden"
            disabled={!selectedMandant || selectedMandant === 'all'}
          />
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
            {files.map((file, index) => (
              <div key={index} className="bg-white/10 rounded-lg p-3 flex items-center gap-3">
                <FileText className="h-5 w-5 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{file.file.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 bg-gray-700 rounded-full h-1">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          file.status === 'error' ? 'bg-red-500' : 
                          file.status === 'success' ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400">{file.progress}%</span>
                  </div>
                  {file.isDuplicate && (
                    <p className="text-xs text-yellow-400 mt-1">Duplikat erkannt</p>
                  )}
                </div>
                {file.status === 'pending' && (
                  <button
                    onClick={() => removeFile(index)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                {file.status === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
                {file.status === 'error' && <AlertCircle className="h-5 w-5 text-red-500" />}
              </div>
            ))}
          </div>
        )}

        {/* Upload Button */}
        {files.length > 0 && (
          <Button
            onClick={() => {
              console.log('🔥 UPLOAD BUTTON CLICKED! Files:', files.length);
              console.log('🔥 Selected mandant:', selectedMandant);
              console.log('🔥 Is uploading:', isUploading);
              console.log('🔥 File statuses:', files.map(f => f.status));
              sendToN8nWebhook();
            }}
            disabled={isUploading || files.some(f => f.status !== 'pending')}
            className="mt-4 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 
                       text-white py-2 px-4 rounded-lg transition-colors duration-200
                       flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Verarbeite...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                {files.length} Datei(en) hochladen
              </>
            )}
          </Button>
        )}

        {/* Info Text */}
        <p className="text-xs text-gray-400 mt-4">
          Unterstützte Formate: PDF, JPG, PNG (max. 10MB)
        </p>
      </CardContent>
    </Card>
  );
};