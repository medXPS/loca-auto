import {
  useGetRentalRequest,
  getGetRentalRequestQueryKey,
  useCancelRentalRequest,
  useListDocuments,
  getListDocumentsQueryKey,
} from "@workspace/api-client-react";
import { useRoute } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice, formatDateTime } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { CountdownTimer } from "@/components/countdown-timer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Calendar, Clock, FileText, X, CheckCircle2 } from "lucide-react";
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
import { DocumentUploadField } from "@/components/document-upload-field";

function fileNameFromUrl(fileUrl: string) {
  const fileName = fileUrl.split("/").pop();
  return fileName && fileName.trim() ? fileName : fileUrl;
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
          toast({ title: "Demande annulee avec succes" });
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

  if (isLoading) {
    return (
      <div className="p-6">
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (!request) return <div className="p-6 text-center">Demande introuvable</div>;

  const showCountdown =
    request.paymentDeadline &&
    (request.status === "CALL_CONFIRMED" || request.status === "WAITING_AGENCY_PAYMENT");

  const canCancel = request.status === "PENDING" || request.status === "CALL_ATTEMPTED";

  const cinDocument = documents?.find((doc) => doc.type === "CIN" || doc.type === "PASSPORT");
  const licenseDocument = documents?.find((doc) => doc.type === "PERMIS_CONDUIRE");

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight">Ma Demande #{request.id}</h1>
          <p className="mt-1 text-muted-foreground">Creee le {formatDateTime(request.createdAt)}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={request.status} className="px-4 py-1.5 text-lg" />
          {canCancel && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="gap-2">
                  <X className="h-4 w-4" />
                  Annuler
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Annuler la demande ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action est irreversible. Votre demande de location sera annulee et le vehicule
                    sera remis a disposition.
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
        <div className="mb-6 flex gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-800">
          <Clock className="mt-0.5 h-6 w-6 shrink-0" />
          <div>
            <h3 className="font-bold">Prochaine etape : Paiement a l'agence</h3>
            <p className="mt-1 text-sm">
              Votre demande a ete confirmee par telephone. Veuillez vous presenter a notre agence avant
              le delai imparti pour finaliser le paiement et recuperer votre vehicule.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5 text-primary" />
              Vehicule reserve
            </CardTitle>
          </CardHeader>
          <CardContent>
            {request.car?.mainImageUrl && (
              <img
                src={request.car.mainImageUrl}
                alt={request.car.model}
                className="mb-4 h-48 w-full rounded-lg object-cover"
              />
            )}
            <h3 className="text-xl font-bold">
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
              <Calendar className="h-5 w-5 text-primary" />
              Details de location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="mb-1 text-sm text-muted-foreground">Depart</p>
                <p className="text-lg font-medium">{new Date(request.startDate).toLocaleDateString("fr-MA")}</p>
              </div>
              <div>
                <p className="mb-1 text-sm text-muted-foreground">Retour</p>
                <p className="text-lg font-medium">{new Date(request.returnDate).toLocaleDateString("fr-MA")}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-muted-foreground">Prix estime</p>
                <p>{formatPrice(request.estimatedTotalPrice)}</p>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-dashed pt-2 text-xl font-bold text-primary">
                <p>Total a payer</p>
                <p>{formatPrice(request.finalPrice || request.estimatedTotalPrice)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Documents requis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Televersez vos documents d'identite pour finaliser votre dossier. Les fichiers acceptes sont
            les images (JPG, PNG) et les PDF. Vous pouvez remplacer chaque fichier a tout moment.
          </p>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <DocumentUploadField
              label="CIN / Passeport"
              docType="CIN"
              rentalRequestId={id}
              existingDocument={cinDocument || null}
              onUploaded={handleDocsRefresh}
            />

            <DocumentUploadField
              label="Permis de conduire"
              docType="PERMIS_CONDUIRE"
              rentalRequestId={id}
              existingDocument={licenseDocument || null}
              onUploaded={handleDocsRefresh}
            />
          </div>

          {documents && documents.length > 0 && (
            <div className="border-t pt-4">
              <p className="mb-3 text-xs font-medium text-muted-foreground">Documents envoyes :</p>
              <ul className="space-y-2">
                {documents.map((doc) => (
                  <li key={doc.id} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                    <span className="font-medium">
                      {doc.type === "CIN" ? "CIN / Passeport" : doc.type === "PASSPORT" ? "Passeport" : "Permis de conduire"}
                    </span>
                    <span className="truncate text-muted-foreground">— {fileNameFromUrl(doc.fileUrl)}</span>
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
