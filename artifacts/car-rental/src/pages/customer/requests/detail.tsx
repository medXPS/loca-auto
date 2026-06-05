import {
  useGetRentalRequest,
  getGetRentalRequestQueryKey,
  useCancelRentalRequest,
  useGetUploadUrl,
  useUploadDocument,
  useListDocuments,
  getListDocumentsQueryKey,
} from "@workspace/api-client-react";
import { useRoute } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice, formatDateTime } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { CountdownTimer } from "@/components/countdown-timer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Calendar, Clock, FileText, Upload, X, CheckCircle2, AlertTriangle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function DocumentUploadField({
  label,
  docType,
  rentalRequestId,
  onUploaded,
}: {
  label: string;
  docType: string;
  rentalRequestId: number;
  onUploaded: () => void;
}) {
  const { toast } = useToast();
  const getUploadUrl = useGetUploadUrl();
  const uploadDocument = useUploadDocument();
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setProgress("uploading");

    try {
      const presignResult = await new Promise<{ uploadUrl: string; fileUrl: string }>(
        (resolve, reject) => {
          getUploadUrl.mutate(
            { data: { fileName: file.name, fileType: file.type, context: "documents" } },
            {
              onSuccess: (data) => resolve(data as { uploadUrl: string; fileUrl: string }),
              onError: reject,
            }
          );
        }
      );

      await fetch(presignResult.uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      await new Promise<void>((resolve, reject) => {
        uploadDocument.mutate(
          {
            data: {
              rentalRequestId,
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
      toast({ title: `${label} téléversé avec succès` });
      onUploaded();
    } catch {
      setProgress("error");
      toast({
        title: "Erreur de téléversement",
        description: "Réessayez ou contactez le support.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={progress === "uploading" || progress === "done"}
          onClick={() => inputRef.current?.click()}
        >
          {progress === "uploading" ? (
            <>
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Téléversement...
            </>
          ) : progress === "done" ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Téléversé
            </>
          ) : progress === "error" ? (
            <>
              <AlertTriangle className="w-4 h-4 text-destructive" />
              Réessayer
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Choisir un fichier
            </>
          )}
        </Button>
        {fileName && (
          <span className="text-sm text-muted-foreground truncate max-w-[160px]">{fileName}</span>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}

export default function CustomerRequestDetail() {
  const [, params] = useRoute("/dashboard/demandes/:id");
  const id = Number(params?.id);
  const { data: request, isLoading } = useGetRentalRequest(id, {
    query: { enabled: !!id, queryKey: getGetRentalRequestQueryKey(id) },
  });
  const { data: documents } = useListDocuments(id, {
    query: { enabled: !!id, queryKey: getListDocumentsQueryKey(id) },
  });
  const cancelRequest = useCancelRentalRequest();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: getGetRentalRequestQueryKey(id) });
  };

  const handleDocsRefresh = () => {
    queryClient.invalidateQueries({ queryKey: getListDocumentsQueryKey(id) });
  };

  const handleCancel = () => {
    cancelRequest.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "Demande annulée avec succès" });
          handleSuccess();
        },
        onError: (error: any) => {
          toast({
            title: "Erreur",
            description: error.message || "Impossible d'annuler la demande.",
            variant: "destructive",
          });
        },
      }
    );
  };

  if (isLoading)
    return (
      <div className="p-6">
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  if (!request) return <div className="p-6 text-center">Demande introuvable</div>;

  const showCountdown =
    request.paymentDeadline &&
    (request.status === "CALL_CONFIRMED" || request.status === "WAITING_AGENCY_PAYMENT");

  const canCancel = request.status === "PENDING" || request.status === "CALL_ATTEMPTED";

  const hasCin = documents?.some((d) => d.type === "CIN");
  const hasLicense = documents?.some((d) => d.type === "DRIVING_LICENSE");

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-8 px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight">Ma Demande #{request.id}</h1>
          <p className="text-muted-foreground mt-1">Créée le {formatDateTime(request.createdAt)}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={request.status} className="text-lg px-4 py-1.5" />
          {canCancel && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="gap-2">
                  <X className="w-4 h-4" />
                  Annuler
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Annuler la demande ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action est irréversible. Votre demande de location sera annulée et le
                    véhicule sera remis à disposition.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Garder la demande</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleCancel}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={cancelRequest.isPending}
                  >
                    {cancelRequest.isPending ? "Annulation..." : "Confirmer l'annulation"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {showCountdown && request.paymentDeadline && (
        <CountdownTimer deadline={request.paymentDeadline} onExpire={handleSuccess} className="mb-8" />
      )}

      {request.status === "CALL_CONFIRMED" && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl mb-6 flex gap-3">
          <Clock className="w-6 h-6 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold">Prochaine étape : Paiement à l'agence</h3>
            <p className="text-sm mt-1">
              Votre demande a été confirmée par téléphone. Veuillez vous présenter à notre agence
              avant le délai imparti pour finaliser le paiement et récupérer votre véhicule.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="w-5 h-5 text-primary" />
              Véhicule Réservé
            </CardTitle>
          </CardHeader>
          <CardContent>
            {request.car?.mainImageUrl && (
              <img
                src={request.car.mainImageUrl}
                alt={request.car.model}
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
            )}
            <h3 className="font-bold text-xl">
              {request.car?.brand} {request.car?.model}
            </h3>
            <p className="text-muted-foreground">
              {request.car?.category} • {request.car?.year}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Détails de location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Départ</p>
                <p className="font-medium text-lg">
                  {new Date(request.startDate).toLocaleDateString("fr-MA")}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Retour</p>
                <p className="font-medium text-lg">
                  {new Date(request.returnDate).toLocaleDateString("fr-MA")}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex justify-between items-center mb-2">
                <p className="text-muted-foreground">Prix estimé</p>
                <p>{formatPrice(request.estimatedTotalPrice)}</p>
              </div>
              <div className="flex justify-between items-center font-bold text-xl text-primary mt-2 pt-2 border-t border-dashed">
                <p>Total à payer</p>
                <p>{formatPrice(request.finalPrice || request.estimatedTotalPrice)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Document Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Documents requis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Veuillez téléverser vos documents d'identité pour finaliser votre dossier. Les fichiers
            acceptés sont les images (JPG, PNG) et les PDF.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              {hasCin ? (
                <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  CIN / Passeport téléversé
                </div>
              ) : (
                <DocumentUploadField
                  label="CIN / Passeport"
                  docType="CIN"
                  rentalRequestId={id}
                  onUploaded={handleDocsRefresh}
                />
              )}
            </div>

            <div className="space-y-2">
              {hasLicense ? (
                <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  Permis de conduire téléversé
                </div>
              ) : (
                <DocumentUploadField
                  label="Permis de conduire"
                  docType="DRIVING_LICENSE"
                  rentalRequestId={id}
                  onUploaded={handleDocsRefresh}
                />
              )}
            </div>
          </div>

          {documents && documents.length > 0 && (
            <div className="pt-4 border-t">
              <p className="text-xs font-medium text-muted-foreground mb-3">Documents envoyés :</p>
              <ul className="space-y-2">
                {documents.map((doc) => (
                  <li key={doc.id} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="font-medium">
                      {doc.type === "CIN" ? "CIN / Passeport" : "Permis de conduire"}
                    </span>
                    <span className="text-muted-foreground truncate">— {doc.fileUrl.split("/").pop()}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
