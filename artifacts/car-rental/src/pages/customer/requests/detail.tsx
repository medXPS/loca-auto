import {
  useGetRentalRequest,
  getGetRentalRequestQueryKey,
  getGetMyCustomerProfileQueryKey,
  useGetMyCustomerProfile,
  useCancelRentalRequest,
  useListDocuments,
  getListDocumentsQueryKey,
} from "@workspace/api-client-react";
import { calculateRentalDays } from "@workspace/api-client-react/availability";
import { useRoute } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { CountdownTimer } from "@/components/countdown-timer";
import { RequestJourneyStepper } from "@/components/request-journey-stepper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Clock, FileText, X, CheckCircle2 } from "lucide-react";
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

type RequestSummary = {
  id?: number | string | null;
  status: string;
  car?: {
    brand?: string | null;
    model?: string | null;
    category?: string | null;
    year?: string | number | null;
    mainImageUrl?: string | null;
  } | null;
  startAt?: string | Date | null;
  startDate?: string | Date | null;
  returnAt?: string | Date | null;
  returnDate?: string | Date | null;
  estimatedTotalPrice?: number | string | null;
  finalPrice?: number | string | null;
};

function toIsoDateValue(value?: string | Date | null) {
  if (!value) return "";

  if (typeof value === "string") {
    return value.slice(0, 10);
  }

  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getReservationDays(start?: string | Date | null, end?: string | Date | null) {
  const startDate = toIsoDateValue(start);
  const endDate = toIsoDateValue(end);

  if (!startDate || !endDate) {
    return 0;
  }

  return calculateRentalDays(startDate, endDate);
}

function ReservationOverviewCard({
  request,
  reservationStart,
  reservationEnd,
  rentalDays,
}: {
  request: RequestSummary;
  reservationStart?: string | Date | null;
  reservationEnd?: string | Date | null;
  rentalDays: number;
}) {
  const carName = [request.car?.brand, request.car?.model].filter(Boolean).join(" ").trim() || "Véhicule réservé";
  const carMeta =
    [request.car?.category, request.car?.year != null ? String(request.car.year) : null].filter(Boolean).join(" • ") ||
    "Résumé de la commande";
  const rentalDaysLabel = rentalDays > 0 ? `${rentalDays} jour${rentalDays > 1 ? "s" : ""}` : "À définir";

  return (
    <Card className="overflow-hidden rounded-[1.9rem] border border-slate-900/10 bg-white shadow-[0_24px_60px_-36px_rgba(16,23,34,0.18)] xl:sticky xl:top-6">
      <div className="relative">
        {request.car?.mainImageUrl ? (
          <img src={request.car.mainImageUrl} alt={carName} className="h-56 w-full object-cover" />
        ) : (
          <div className="flex h-56 w-full items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-sky-50 text-slate-400">
            <Car className="h-14 w-14" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/15 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 p-5 text-white">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">
                Commande #{request.id ?? "—"}
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight">{carName}</h2>
              <p className="mt-1 text-sm text-white/75">{carMeta}</p>
            </div>

            <StatusBadge status={request.status} className="border-white/15 bg-white/95 px-3 py-1.5 text-xs text-slate-800" />
          </div>
        </div>
      </div>

      <CardHeader className="space-y-1 pb-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/8 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          <Car className="h-3.5 w-3.5" />
          Résumé de la commande
        </div>
        <CardTitle className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">
          Tout ce qu’il faut voir d’un coup d’œil
        </CardTitle>
        <p className="text-sm leading-7 text-slate-500">
          Les dates, la durée et les montants essentiels restent visibles dans cette colonne.
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
              Depart: {formatDateTime(reservationStart)}
            </span>
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
              Retour: {formatDateTime(reservationEnd)}
            </span>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              <Clock className="h-3.5 w-3.5 text-primary" />
              Jours réservés
            </div>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{rentalDaysLabel}</p>
            <p className="mt-1 text-xs text-slate-500">Durée calculée à partir des dates sélectionnées.</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="outline" className="flex-1 rounded-full">
            <a href="#request-top">Retour au suivi</a>
          </Button>
          <Button asChild variant="secondary" className="flex-1 rounded-full">
            <a href="#request-top">Retour en haut</a>
          </Button>
        </div>
      </CardContent>
    </Card>
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
  const { data: profile } = useGetMyCustomerProfile({
    query: {
      enabled: !!id,
      queryKey: getGetMyCustomerProfileQueryKey(),
    },
  });
  const cancelRequest = useCancelRentalRequest();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: getGetRentalRequestQueryKey(id) });
  };

  const handleDocsRefresh = () => {
    handleSuccess();
    queryClient.invalidateQueries({ queryKey: getListDocumentsQueryKey(id) });
    queryClient.invalidateQueries({ queryKey: getGetMyCustomerProfileQueryKey() });
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
      },
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

  const showPaymentCountdown =
    request.paymentDeadline &&
    (request.status === "CALL_CONFIRMED" || request.status === "EXTENDED_PAYMENT_DEADLINE" || request.status === "WAITING_AGENCY_PAYMENT");
  const showDocumentCountdown = request.documentDeadline && request.status === "DOCUMENT_SUBMISSION_WINDOW";

  const canCancel = request.status === "PENDING" || request.status === "DOCUMENT_SUBMISSION_WINDOW" || request.status === "CALL_ATTEMPTED";

  const profileDocuments = (profile?.documents ?? []).filter((doc) => doc.rentalRequestId == null);
  const requestCinDocument = documents?.find((doc) => doc.type === "CIN" || doc.type === "PASSPORT");
  const requestLicenseDocument = documents?.find((doc) => doc.type === "PERMIS_CONDUIRE");
  const profileCinDocument = profileDocuments.find((doc) => doc.type === "CIN" || doc.type === "PASSPORT");
  const profileLicenseDocument = profileDocuments.find((doc) => doc.type === "PERMIS_CONDUIRE");
  const cinDocument = requestCinDocument || profileCinDocument || null;
  const licenseDocument = requestLicenseDocument || profileLicenseDocument || null;
  const hasReusableProfileDocuments = Boolean(profileCinDocument || profileLicenseDocument) && (!requestCinDocument || !requestLicenseDocument);

  const requestSummary = request as RequestSummary;
  const reservationStart = requestSummary.startAt || requestSummary.startDate;
  const reservationEnd = requestSummary.returnAt || requestSummary.returnDate;
  const rentalDays = getReservationDays(reservationStart, reservationEnd);
  const piecesContent = (
    <div id="journey-pieces" className="space-y-6 rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/8 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            <FileText className="h-3.5 w-3.5" />
            Soumission des pièces
          </div>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
            Validez vos documents pour passer à l'étape suivante
          </h2>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            Vos documents déjà présents dans le profil apparaissent ici. Vous pouvez les réutiliser ou les remplacer avant de
            valider cette demande.
          </p>
        </div>
      </div>

      {hasReusableProfileDocuments && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Nous avons trouvé vos documents dans votre profil. Vous pouvez les soumettre directement ou les remplacer pour cette
          reservation.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <DocumentUploadField
          label="CIN / Passeport"
          docType="CIN"
          rentalRequestId={id}
          existingDocument={cinDocument || null}
          allowExistingDocumentSubmit
          confirmBeforeSubmit
          confirmTitle="Valider le document"
          confirmDescription={
            cinDocument
              ? `Le document ${fileNameFromUrl(cinDocument.fileUrl)} sera rattaché à cette demande.`
              : "Le document sera rattaché à cette demande."
          }
          confirmActionLabel="Valider"
          onUploaded={handleDocsRefresh}
        />

        <DocumentUploadField
          label="Permis de conduire"
          docType="PERMIS_CONDUIRE"
          rentalRequestId={id}
          existingDocument={licenseDocument || null}
          allowExistingDocumentSubmit
          confirmBeforeSubmit
          confirmTitle="Valider le document"
          confirmDescription={
            licenseDocument
              ? `Le document ${fileNameFromUrl(licenseDocument.fileUrl)} sera rattaché à cette demande.`
              : "Le document sera rattaché à cette demande."
          }
          confirmActionLabel="Valider"
          onUploaded={handleDocsRefresh}
        />
      </div>

      {documents && documents.length > 0 && (
        <div className="border-t pt-4">
          <p className="mb-3 text-xs font-medium text-muted-foreground">Documents envoyés :</p>
          <ul className="space-y-2">
            {documents.map((doc) => (
              <li key={doc.id} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                <span className="font-medium">
                  {doc.type === "CIN" ? "CIN / Passeport" : doc.type === "PASSPORT" ? "Passeport" : "Permis de conduire"}
                </span>
                <span className="truncate text-muted-foreground">- {fileNameFromUrl(doc.fileUrl)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  return (
    <div id="request-top" className="mx-auto max-w-[96rem] space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Ma Demande #{request.id}</h1>
          <p className="mt-1 text-muted-foreground">Créée le {formatDateTime(request.createdAt)}</p>
        </div>
        <div className="flex items-center gap-3">
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
                    Cette action est irréversible. Votre demande de location sera annulée et le véhicule sera remis à disposition.
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

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[400px_minmax(0,1fr)] xl:items-start">
        <aside className="space-y-6 xl:sticky xl:top-6">
          <ReservationOverviewCard
            request={requestSummary}
            reservationStart={reservationStart}
            reservationEnd={reservationEnd}
            rentalDays={rentalDays}
          />
        </aside>

        <main className="min-w-0 space-y-6">
          <RequestJourneyStepper status={request.status} request={request} piecesContent={piecesContent} />

          {showDocumentCountdown && request.documentDeadline && (
            <CountdownTimer
              deadline={request.documentDeadline}
              onExpire={handleSuccess}
              label="Délai pour envoyer vos documents"
              description="Envoyez votre CIN ou passeport et votre permis avant la fin du compte à rebours pour garder le véhicule bloqué."
              expiredDescription="Le délai d'envoi des documents est dépassé. La demande peut être libérée."
            />
          )}

          {showPaymentCountdown && request.paymentDeadline && (
            <div id="payment">
              <CountdownTimer deadline={request.paymentDeadline} onExpire={handleSuccess} />
            </div>
          )}

          {request.status === "DOCUMENT_SUBMISSION_WINDOW" && (
            <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
              <FileText className="mt-0.5 h-6 w-6 shrink-0" />
              <div>
                <h3 className="font-bold">Documents requis sous 30 minutes</h3>
                <p className="mt-1 text-sm">
                  Téléversez votre CIN ou passeport et votre permis de conduire pour garder le véhicule bloqué.
                </p>
              </div>
            </div>
          )}

          {(request.status === "CALL_CONFIRMED" || request.status === "EXTENDED_PAYMENT_DEADLINE") && (
            <div className="flex gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-800">
              <Clock className="mt-0.5 h-6 w-6 shrink-0" />
              <div>
                <h3 className="font-bold">Prochaine etape : Paiement a l'agence</h3>
                <p className="mt-1 text-sm">
                  Votre demande a ete confirmee par telephone. Veuillez vous presenter a notre agence avant la limite de 24h pour
                  finaliser le paiement en espèces et récupérer votre véhicule.
                </p>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
