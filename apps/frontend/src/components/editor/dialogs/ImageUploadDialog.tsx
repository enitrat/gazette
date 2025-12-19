import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { IMAGE_CONSTRAINTS } from "@gazette/shared/constants";
import { apiBaseUrl } from "@/lib/api";
import { getAuthToken } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/components/ui/use-toast";

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

type ImageUploadDialogProps = {
  open: boolean;
  projectId?: string | null;
  onOpenChange: (open: boolean) => void;
  onUploadComplete: (result: ImageUploadResult) => void;
};

const MAX_MB = Math.round(IMAGE_CONSTRAINTS.MAX_FILE_SIZE / (1024 * 1024));

export function ImageUploadDialog({
  open,
  projectId,
  onOpenChange,
  onUploadComplete,
}: ImageUploadDialogProps) {
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

  const validateFile = useCallback((file: File) => {
    if (!IMAGE_CONSTRAINTS.SUPPORTED_MIME_TYPES.includes(file.type as never)) {
      return "Unsupported file type. Please upload JPG, PNG, or WebP.";
    }
    if (file.size > IMAGE_CONSTRAINTS.MAX_FILE_SIZE) {
      return `File is too large. Max size is ${MAX_MB}MB.`;
    }
    return null;
  }, []);

  const handleFile = useCallback(
    (file?: File | null) => {
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
    },
    [validateFile]
  );

  useEffect(() => {
    if (!open) return;

    const handlePaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items || items.length === 0) return;
      const imageItem = Array.from(items).find((item) => item.type.startsWith("image/"));
      if (!imageItem) return;
      const file = imageItem.getAsFile();
      if (!file) return;
      event.preventDefault();
      handleFile(file);
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [open, handleFile]);

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    handleFile(file);
  };

  const handleBrowse = () => {
    if (isUploading) return;
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
            toast({
              title: "Image uploaded",
              description: "Your photo is ready to place on the page.",
              variant: "success",
            });
            onOpenChange(false);
          } catch {
            setErrorMessage("Upload succeeded but response was invalid.");
            toast({
              title: "Upload error",
              description: "Upload succeeded but the response was invalid.",
              variant: "destructive",
            });
          } finally {
            setIsUploading(false);
            resolve();
          }
          return;
        }

        try {
          const response = JSON.parse(xhr.responseText) as { error?: { message?: string } };
          setErrorMessage(response?.error?.message || "Upload failed. Please try again.");
          toast({
            title: "Upload failed",
            description: response?.error?.message || "Upload failed. Please try again.",
            variant: "destructive",
          });
        } catch {
          setErrorMessage("Upload failed. Please try again.");
          toast({
            title: "Upload failed",
            description: "Upload failed. Please try again.",
            variant: "destructive",
          });
        } finally {
          setIsUploading(false);
          resolve();
        }
      };

      xhr.onerror = () => {
        setErrorMessage("Network error during upload. Please try again.");
        toast({
          title: "Network error",
          description: "Network error during upload. Please try again.",
          variant: "destructive",
        });
        setIsUploading(false);
        resolve();
      };

      xhr.send(formData);
    });
  };

  const showPreview = Boolean(previewUrl);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[600px] rounded-[8px] border-sepia/30 bg-parchment shadow-2xl">
        <DialogHeader>
          <DialogTitle>Add Photo</DialogTitle>
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
              if (!isUploading) {
                setIsDragging(true);
              }
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={cn(
              "relative flex min-h-[260px] flex-col items-center justify-center gap-3 rounded-[8px] border-2 border-dashed border-sepia/40 bg-cream/70 p-6 text-center transition",
              !isUploading && "cursor-pointer",
              isDragging && "border-gold bg-parchment/90"
            )}
          >
            {showPreview ? (
              <div className="flex w-full flex-col items-center gap-3">
                <img
                  src={previewUrl}
                  alt="Selected upload preview"
                  className="max-h-56 w-full rounded-[6px] object-contain shadow-sm"
                />
                <div className="text-xs text-muted">
                  {selectedFile?.name} • {selectedFile ? Math.round(selectedFile.size / 1024) : 0}KB
                </div>
                {!isUploading ? (
                  <div className="text-xs text-sepia">Click to choose another image</div>
                ) : null}
              </div>
            ) : (
              <>
                <div className="text-4xl" aria-hidden="true">
                  📷
                </div>
                <div className="text-base font-semibold text-ink">
                  Drop image here or click to browse
                </div>
                <div className="text-xs text-muted">
                  Supports: JPG, PNG, WebP | Max size: {MAX_MB}MB
                </div>
              </>
            )}
          </div>

          {isUploading ? (
            <div className="space-y-2 rounded-[8px] border border-sepia/20 bg-cream/70 p-3">
              <div className="flex items-center justify-between text-xs text-muted">
                <span>Uploading image...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          ) : null}

          {errorMessage ? (
            <div
              role="alert"
              className="rounded-[8px] border border-aged-red/40 bg-white/60 p-3 text-xs text-aged-red"
            >
              {errorMessage}
            </div>
          ) : null}

          <div className="flex items-center justify-between">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="bg-gold text-ink hover:bg-gold/90"
            >
              {isUploading ? "Uploading..." : "Upload photo"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
