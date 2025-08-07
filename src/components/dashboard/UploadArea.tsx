import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const UploadArea = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) {
      toast({ title: "No files selected", variant: "destructive" });
      return;
    }

    setIsUploading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: "Not authenticated", variant: "destructive" });
        return;
      }

      const formData = new FormData();
      selectedFiles.forEach(file => formData.append('file', file));
      formData.append('mandant_id', 'default');

      const response = await fetch('https://awrduehwnyxbwtjbbrhw.supabase.co/functions/v1/secure-file-upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        body: formData,
      });

      if (response.ok) {
        toast({ title: "Files uploaded successfully!" });
        setSelectedFiles([]);
      } else {
        const error = await response.text();
        toast({ title: "Upload failed", description: error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Upload error", description: String(error), variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-6 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Upload Files</h3>
      
      <input
        type="file"
        multiple
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={handleFileSelect}
        className="mb-4"
      />

      {selectedFiles.length > 0 && (
        <div className="mb-4">
          <p>Selected {selectedFiles.length} file(s):</p>
          <ul className="text-sm text-gray-600">
            {selectedFiles.map((file, index) => (
              <li key={index}>{file.name}</li>
            ))}
          </ul>
        </div>
      )}

      <Button 
        onClick={uploadFiles}
        disabled={isUploading || selectedFiles.length === 0}
        className="w-full"
      >
        {isUploading ? "Uploading..." : "Upload Files"}
      </Button>
    </div>
  );
};