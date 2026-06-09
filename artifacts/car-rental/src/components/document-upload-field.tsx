import { useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Upload } from "lucide-react";
import { useGetUploadUrl, useUploadDocument } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

type SupportedDocumentType = "CIN" | "PASSPORT" | "PERMIS_CONDUIRE" | "AUTRE";

type ExistingDocument = {
  id: number;
  fileUrl: string;
  status?: string;
  uploadedAt?: string;
} | null | undefined;

interface DocumentUploadFieldProps {
  label: string;
  docType: SupportedDocumentType;
  onUploaded: () => void;
  existingDocument?: ExistingDocument;
  rentalRequestId?: number | null;
  helperText?: string;
}

function fileNameFromUrl(fileUrl: string) {
  const fileName = fileUrl.split("/").pop();
  return fileName && fileName.trim() ? fileName : fileUrl;
}

export function DocumentUploadField({
  label,
  docType,
  onUploaded,
  existingDocument,
  rentalRequestId,
  helperText,
}: DocumentUploadFieldProps) {
  const { toast } = useToast();
  const getUploadUrl = useGetUploadUrl();
  const uploadDocument = useUploadDocument();
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [fileName, setFileName] = useState<string | null>(null);

  const existingName = existingDocument ? fileNameFromUrl(existingDocument.fileUrl) : null;
  const titleHint = existingDocument
    ? `Actuel: ${existingName}${existingDocument.uploadedAt ? ` · ${new Date(existingDocument.uploadedAt).toLocaleDateString("fr-MA")}` : ""}`
    : helperText;

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setProgress("uploading");

    try {
      const presignResult = await new Promise<{ uploadUrl: string; fileUrl: string }>((resolve, reject) => {
        getUploadUrl.mutate(
          { data: { fileName: file.name, fileType: file.type, context: "documents" } },
          {
            onSuccess: (data) => resolve(data as { uploadUrl: string; fileUrl: string }),
            onError: reject,
          }
        );
      });

      await fetch(presignResult.uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      await new Promise<void>((resolve, reject) => {
        uploadDocument.mutate(
          {
            data: {
              rentalRequestId: rentalRequestId ?? undefined,
              type: docType,
              fileUrl: presignResult.fileUrl,
            },
          },
          {
            onSuccess: () => resolve(),
            onError: reject,
          }
        );
      });

      setProgress("done");
      inputRef.current && (inputRef.current.value = "");
      toast({ title: `${label} televerse avec succes` });
      onUploaded();
    } catch {
      setProgress("error");
      toast({
        title: "Erreur de televersement",
        description: "Reessayez ou contactez le support.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <p className="text-sm font-medium">{label}</p>
        {titleHint && <p className="text-xs text-muted-foreground">{titleHint}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={progress === "uploading"}
          onClick={() => inputRef.current?.click()}
        >
          {progress === "uploading" ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Televersement...
            </>
          ) : progress === "done" ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Remplacer le fichier
            </>
          ) : progress === "error" ? (
            <>
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Reessayer
            </>
          ) : existingDocument ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Remplacer le fichier
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Choisir un fichier
            </>
          )}
        </Button>
        {fileName && <span className="max-w-[220px] truncate text-sm text-muted-foreground">{fileName}</span>}
        <input ref={inputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileChange} />
      </div>
    </div>
  );
}
