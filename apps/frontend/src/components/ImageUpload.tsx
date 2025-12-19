import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { IMAGE_CONSTRAINTS } from "@gazette/shared/constants";
import { UploadCloud } from "lucide-react";
import { apiBaseUrl } from "@/lib/api";
import { getAuthToken } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type UploadedImage = {
  id: string;
  originalFilename: string;
  mimeType: string;
  width: number;
  height: number;
  url: string;
  uploadedAt: string;
};

export type ImageUploadResult = {
  image: UploadedImage;
  previewUrl: string;
};

type ImageUploadProps = {
  open: boolean;
  projectId?: string | null;
  onOpenChange: (open: boolean) => void;
  onUploadComplete: (result: ImageUploadResult) => void;
};

const MAX_MB = Math.round(IMAGE_CONSTRAINTS.MAX_FILE_SIZE / (1024 * 1024));

export function ImageUpload({ open, projectId, onOpenChange, onUploadComplete }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const acceptedTypes = useMemo(() => IMAGE_CONSTRAINTS.SUPPORTED_MIME_TYPES.join(","), []);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl("");
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedFile]);

  useEffect(() => {
    if (!open) {
      setIsDragging(false);
      setSelectedFile(null);
      setProgress(0);
      setIsUploading(false);
      setErrorMessage(null);
    }
  }, [open]);

  const validateFile = (file: File) => {
    if (!IMAGE_CONSTRAINTS.SUPPORTED_MIME_TYPES.includes(file.type as never)) {
      return "Unsupported file type. Please upload JPG, PNG, or WebP.";
    }
    if (file.size > IMAGE_CONSTRAINTS.MAX_FILE_SIZE) {
      return `File is too large. Max size is ${MAX_MB}MB.`;
    }
    return null;
  };

  const handleFile = (file?: File | null) => {
    if (!file) return;
    const validationError = validateFile(file);
    if (validationError) {
      setSelectedFile(null);
      setErrorMessage(validationError);
      return;
    }
    setErrorMessage(null);
    setSelectedFile(file);
    setProgress(0);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    handleFile(file);
  };

  const handleBrowse = () => {
    inputRef.current?.click();
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setErrorMessage("Choose an image before uploading.");
      return;
    }
    if (!projectId) {
      setErrorMessage("Missing project ID.");
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);
    setProgress(0);

    const uploadUrl = `${apiBaseUrl}/projects/${projectId}/images`;
    const formData = new FormData();
    formData.append("file", selectedFile);

    await new Promise<void>((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", uploadUrl);
      const token = getAuthToken();
      if (token) {
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      }

      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) return;
        const next = Math.round((event.loaded / event.total) * 100);
        setProgress(next);
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText) as UploadedImage;
            const normalizedUrl = response.url.startsWith("http")
              ? response.url
              : `${apiBaseUrl}${response.url}`;
            onUploadComplete({
              image: { ...response, url: normalizedUrl },
              previewUrl,
            });
            onOpenChange(false);
          } catch {
            setErrorMessage("Upload succeeded but response was invalid.");
          } finally {
            setIsUploading(false);
            resolve();
          }
          return;
        }

        try {
          const response = JSON.parse(xhr.responseText) as { error?: { message?: string } };
          setErrorMessage(response?.error?.message || "Upload failed. Please try again.");
        } catch {
          setErrorMessage("Upload failed. Please try again.");
        } finally {
          setIsUploading(false);
          resolve();
        }
      };

      xhr.onerror = () => {
        setErrorMessage("Network error during upload. Please try again.");
        setIsUploading(false);
        resolve();
      };

      xhr.send(formData);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl border-sepia/30 bg-parchment">
        <DialogHeader>
          <DialogTitle className="text-ink-effect">Add Photo</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 font-ui text-sm text-muted">
          <input
            ref={inputRef}
            type="file"
            accept={acceptedTypes}
            className="hidden"
            onChange={(event) => handleFile(event.target.files?.[0])}
          />

          <div
            role="button"
            tabIndex={0}
            onClick={handleBrowse}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                handleBrowse();
              }
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={cn(
              "relative flex min-h-[260px] cursor-pointer flex-col items-center justify-center gap-3 rounded-sm border-2 border-dashed border-sepia/40 bg-cream/70 p-6 text-center transition",
              isDragging && "border-gold bg-parchment/90"
            )}
          >
            {previewUrl ? (
              <div className="flex h-full w-full flex-col items-center gap-3">
                <img
                  src={previewUrl}
                  alt="Selected upload preview"
                  className="max-h-48 w-full rounded-sm object-contain shadow-sm"
                />
                <div className="text-xs text-muted">
                  {selectedFile?.name} • {selectedFile ? Math.round(selectedFile.size / 1024) : 0}KB
                </div>
                <div className="text-xs text-sepia">Click to choose another image</div>
              </div>
            ) : (
              <>
                <UploadCloud className="h-10 w-10 text-sepia" aria-hidden="true" />
                <div className="text-base text-ink">Drop image here</div>
                <div className="text-xs text-muted">or click to browse</div>
                <div className="text-xs text-muted">
                  Supports: JPG, PNG, WebP • Max size: {MAX_MB}MB
                </div>
              </>
            )}
          </div>

          {isUploading ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted">
                <span>Uploading image...</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-sepia/20">
                <div className="h-full bg-gold transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          ) : null}

          {errorMessage ? (
            <div
              role="alert"
              className="rounded-sm border border-aged-red/40 bg-white/60 p-3 text-xs text-aged-red"
            >
              {errorMessage}
            </div>
          ) : null}

          <div className="flex items-center justify-between">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleUpload} disabled={!selectedFile || isUploading}>
              {isUploading ? "Uploading..." : "Upload photo"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
