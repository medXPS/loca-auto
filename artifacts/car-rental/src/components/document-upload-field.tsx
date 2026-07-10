import { type ChangeEvent, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Upload } from "lucide-react";
import { customFetch, useGetUploadUrl, useUploadDocument } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type SupportedDocumentType = "CIN" | "PASSPORT" | "PERMIS_CONDUIRE" | "AUTRE";

type ExistingDocument = {
  id: number;
  fileUrl: string;
  type?: string;
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
  allowExistingDocumentSubmit?: boolean;
  confirmBeforeSubmit?: boolean;
  confirmTitle?: string;
  confirmDescription?: string;
  confirmActionLabel?: string;
  confirmCancelLabel?: string;
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
  allowExistingDocumentSubmit = false,
  confirmBeforeSubmit = false,
  confirmTitle = "Confirmer l'envoi",
  confirmDescription,
  confirmActionLabel = "Valider",
  confirmCancelLabel = "Annuler",
}: DocumentUploadFieldProps) {
  const { toast } = useToast();
  const getUploadUrl = useGetUploadUrl();
  const uploadDocument = useUploadDocument();
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<"idle" | "uploading" | "error">("idle");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const existingName = existingDocument ? fileNameFromUrl(existingDocument.fileUrl) : null;
  const titleHint = existingDocument
    ? `Actuel : ${existingName}${existingDocument.uploadedAt ? ` · ${new Date(existingDocument.uploadedAt).toLocaleDateString("fr-MA")}` : ""}`
    : helperText;
  const canSubmitExistingDocument = allowExistingDocumentSubmit && Boolean(existingDocument);
  const confirmText =
    confirmDescription ||
    (selectedFile
      ? `Vous allez envoyer ${selectedFile.name} pour cette demande.`
      : existingDocument
        ? `Le document actuel ${existingName || "sélectionné"} sera lié à cette demande.`
        : "Vous allez valider l'envoi de ce document.");

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setSelectedFile(file);
    setProgress("idle");
  };

  const handleUpload = async () => {
    if (progress === "uploading") return;
    if (!selectedFile && !canSubmitExistingDocument) return;

    setProgress("uploading");

    try {
      let fileUrl = existingDocument?.fileUrl ?? "";
      let documentType = existingDocument?.type || docType;

      if (selectedFile) {
        const presignResult = await getUploadUrl.mutateAsync({
          data: { fileName: selectedFile.name, fileType: selectedFile.type, context: "documents" },
        });

        const uploadResponse = await customFetch<{ fileUrl: string }>(presignResult.uploadUrl, {
          method: "PUT",
          body: selectedFile,
          ...(selectedFile.type
            ? { headers: { "Content-Type": selectedFile.type } }
            : {}),
        });

        fileUrl = uploadResponse.fileUrl || presignResult.fileUrl;
        documentType = docType;
      }

      await uploadDocument.mutateAsync({
        data: {
          rentalRequestId: rentalRequestId ?? undefined,
          type: documentType,
          fileUrl,
        },
      });

      setProgress("idle");
      setSelectedFile(null);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      toast({ title: selectedFile ? `${label} téléversé avec succès` : `${label} soumis avec succès` });
      onUploaded();
    } catch {
      setProgress("error");
      toast({
        title: "Erreur de téléversement",
        description: "Reessayez ou contactez le support.",
        variant: "destructive",
      });
    }
  };

  const isUploading = progress === "uploading";

  const submitButton = (
    <Button
      type="button"
      size="sm"
      className="gap-2"
      disabled={(!selectedFile && !canSubmitExistingDocument) || isUploading}
      onClick={confirmBeforeSubmit ? () => setIsConfirmOpen(true) : () => void handleUpload()}
    >
      {isUploading ? (
        <>
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
          {selectedFile ? "Envoi..." : "Validation..."}
        </>
      ) : (
        "Soumettre le document"
      )}
    </Button>
  );

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
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
        >
          {isUploading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Téléversement...
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

        {confirmBeforeSubmit ? (
          <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
            {submitButton}
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{confirmTitle}</AlertDialogTitle>
                <AlertDialogDescription>{confirmText}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{confirmCancelLabel}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    setIsConfirmOpen(false);
                    void handleUpload();
                  }}
                >
                  {confirmActionLabel}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          submitButton
        )}

        {selectedFile && <span className="max-w-[220px] truncate text-sm text-muted-foreground">{selectedFile.name}</span>}
        {progress === "error" && (
          <span className="inline-flex items-center gap-2 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4" />
            Le téléversement a échoué. Réessayez.
          </span>
        )}
        <input ref={inputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileChange} />
      </div>
    </div>
  );
}
