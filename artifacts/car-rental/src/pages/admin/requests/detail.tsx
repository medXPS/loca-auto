import { useRoute, useLocation } from "wouter";
import {
  customFetch,
  getGetCustomerQueryKey,
  useGetRentalRequest,
  getGetRentalRequestQueryKey,
  getListAuditLogsQueryKey,
  getListDocumentsQueryKey,
  useListAuditLogs,
  useListDocuments,
} from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice, formatDateTime } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { CountdownTimer } from "@/components/countdown-timer";
import { RequestActions } from "@/components/request-actions";
import { ReceiptDownloadButton } from "@/components/receipt-download-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getStatusLabel } from "@/lib/utils";
import {
  BadgeCheck,
  CalendarDays,
  Download,
  User,
  Phone,
  Mail,
  Calendar,
  FileText,
  History,
  CreditCard,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

function fileNameFromUrl(fileUrl: string) {
  const fileName = fileUrl.split("/").pop();
  return fileName && fileName.trim() ? fileName : fileUrl;
}

function getDocumentLabel(type?: string | null) {
  if (type === "CIN") return "CIN";
  if (type === "PASSPORT") return "Passeport";
  if (type === "PERMIS_CONDUIRE") return "Permis";
  return type || "Document";
}

export default function AdminRequestDetail() {
  const [location] = useLocation();
  const [, adminParams] = useRoute("/admin/demandes/:id");
  const [, agentParams] = useRoute("/agent/demandes/:id");
  const params = adminParams ?? agentParams;
  const id = Number(params?.id);

  const { data: request, isLoading } = useGetRentalRequest(id, {
    query: { enabled: !!id, queryKey: getGetRentalRequestQueryKey(id) },
  });
  const { data: documents, isLoading: isDocumentsLoading } = useListDocuments(id, {
    query: {
      enabled: !!id,
      queryKey: getListDocumentsQueryKey(id),
      refetchInterval: 15000,
      refetchIntervalInBackground: true,
    },
  });
  const { data: auditData, isLoading: isAuditLoading } = useListAuditLogs({
    limit: 500,
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const validateDocuments = useMutation({
    mutationFn: async () => customFetch(`/api/documents/${id}/approve`, { method: "PATCH" }),
    onSuccess: async () => {
      toast({ title: "Documents validés avec succès" });
      queryClient.invalidateQueries({ queryKey: getGetRentalRequestQueryKey(id) });
      queryClient.invalidateQueries({ queryKey: getListDocumentsQueryKey(id) });
      if (request?.customerId) {
        queryClient.invalidateQueries({ queryKey: getGetCustomerQueryKey(request.customerId) });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error?.message || "Impossible de valider les documents.",
        variant: "destructive",
      });
    },
  });

  const handleSuccess = () => {
    queryClient.invalidateQueries({
      queryKey: getGetRentalRequestQueryKey(id),
    });
    queryClient.invalidateQueries({ queryKey: getListAuditLogsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListDocumentsQueryKey(id) });
  };

  if (isLoading)
    return (
      <div className="p-6">
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  if (!request)
    return <div className="p-6 text-center">Demande introuvable</div>;

  const showCountdown =
    request.paymentDeadline &&
    (request.status === "CALL_CONFIRMED" ||
      request.status === "WAITING_AGENCY_PAYMENT" ||
      request.status === "EXTENDED_PAYMENT_DEADLINE");
  const canPrintReceipt = [
    "RESERVED",
    "CAR_DELIVERED",
    "RENTED",
    "CAR_RETURNED",
    "RETURNED",
    "COMPLETED",
  ].includes(request.status);

  const timelineEntries = (auditData?.logs || [])
    .filter(
      (log) =>
        log.entityType === "rental_request" &&
        String(log.entityId) === String(id),
    )
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  const requestDocuments = [...(documents ?? [])].sort(
    (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
  );
  const allDocumentsApproved =
    requestDocuments.length > 0 && requestDocuments.every((document) => document.status === "APPROVED");

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
            Demande #{request.id}
            <StatusBadge status={request.status} />
          </h1>
          <p className="text-muted-foreground mt-1">
            Créée le {formatDateTime(request.createdAt)}
          </p>
        </div>

        <div className="bg-card p-2 rounded-lg border shadow-sm">
          <div className="flex flex-col gap-3">
            <RequestActions
              requestId={request.id}
              status={request.status}
              estimatedPrice={request.estimatedTotalPrice}
              onSuccess={handleSuccess}
            />
            {canPrintReceipt && (
              <ReceiptDownloadButton
                requestId={request.id}
                filename={`recu-RCPF-${String(request.id).padStart(6, "0")}.pdf`}
                className="w-full justify-center"
              >
                Imprimer le reçu
              </ReceiptDownloadButton>
            )}
          </div>
        </div>
      </div>

      {showCountdown && request.paymentDeadline && (
        <CountdownTimer
          deadline={request.paymentDeadline}
          onExpire={handleSuccess}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Informations Client
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Nom complet
                </p>
                <p className="font-medium">{request.fullName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Téléphone</p>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <p className="font-medium">{request.phone}</p>
                </div>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground mb-1">Email</p>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <p className="font-medium">{request.email}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  CIN / Passeport
                </p>
                <p className="font-medium">
                  {request.cinOrPassport || "Non renseigné"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Permis de conduire
                </p>
                <p className="font-medium">
                  {request.drivingLicenseNumber || "Non renseigné"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rental Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Détails de location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-muted/50 rounded-lg flex items-center justify-between mb-4 border">
              <div className="font-medium">
                {request.car?.brand} {request.car?.model}
              </div>
              <StatusBadge status={request.car?.status || ""} type="car" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Date de départ
                </p>
                <p className="font-medium">
                  {new Date(request.startDate).toLocaleDateString("fr-MA")}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Date de retour
                </p>
                <p className="font-medium">
                  {new Date(request.returnDate).toLocaleDateString("fr-MA")}
                </p>
              </div>

              <div className="col-span-2 pt-4 border-t mt-2">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-muted-foreground">Prix estimé</p>
                  <p>{formatPrice(request.estimatedTotalPrice)}</p>
                </div>
                <div className="flex justify-between items-center font-bold text-lg text-primary">
                  <p>Prix final</p>
                  <p>
                    {formatPrice(
                      request.finalPrice || request.estimatedTotalPrice,
                    )}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Paiement
                    </p>
                    <div className="mt-2 flex items-center gap-2 font-medium">
                      <CreditCard className="h-4 w-4 text-primary" />
                      {request.paymentStatus || "Non payé"}
                    </div>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Mode
                    </p>
                    <p className="mt-2 font-medium">
                      {request.paymentMethod || "Non renseigné"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 overflow-hidden">
          <CardHeader className="border-b bg-muted/20">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Documents soumis
                </CardTitle>
                <p className="mt-2 text-sm text-muted-foreground">
                  Les fichiers les plus récents liés à cette réservation sont regroupés ici pour téléchargement et vérification.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => validateDocuments.mutate()}
                disabled={requestDocuments.length === 0 || allDocumentsApproved || validateDocuments.isPending || isDocumentsLoading}
                className="gap-2"
              >
                <BadgeCheck className="h-4 w-4" />
                {allDocumentsApproved
                  ? "Documents validés"
                  : validateDocuments.isPending
                    ? "Validation..."
                    : "Valider les documents"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {isDocumentsLoading ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {Array(2)
                  .fill(0)
                  .map((_, index) => (
                    <Skeleton key={index} className="h-36 w-full rounded-2xl" />
                  ))}
              </div>
            ) : requestDocuments.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {requestDocuments.map((document) => (
                  <div key={document.id} className="rounded-2xl border bg-background p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold">{getDocumentLabel(document.type)}</p>
                        <p className="mt-1 text-xs text-muted-foreground">Demande #{request.id}</p>
                      </div>
                      <Badge variant="outline" className="rounded-full">
                        {getStatusLabel(document.status, "document")}
                      </Badge>
                    </div>

                    <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {formatDateTime(document.uploadedAt)}
                    </div>

                    <div className="mt-3 truncate rounded-xl border border-dashed bg-muted/20 px-3 py-2 text-sm text-slate-600">
                      {fileNameFromUrl(document.fileUrl)}
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <Badge variant="secondary" className="rounded-full">
                        {document.status === "APPROVED"
                          ? "Validé"
                          : document.status === "REJECTED"
                            ? "Refusé"
                            : "En attente"}
                      </Badge>
                      <Button asChild size="sm" variant="outline" className="rounded-full border-border/70 bg-white">
                        <a href={document.fileUrl} download={fileNameFromUrl(document.fileUrl)}>
                          Télécharger
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
                Aucun document n'a encore été soumis pour cette réservation.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Notes & Commentaires
            </CardTitle>
          </CardHeader>
          <CardContent>
            {request.notes ? (
              <p className="whitespace-pre-wrap bg-muted/30 p-4 rounded-lg border">
                {request.notes}
              </p>
            ) : (
              <p className="text-muted-foreground italic">
                Aucune note pour cette demande.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Status History Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              Historique des statuts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isAuditLoading ? (
              <div className="space-y-3">
                {Array(3)
                  .fill(0)
                  .map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-lg" />
                  ))}
              </div>
            ) : timelineEntries.length > 0 ? (
              <ol className="relative border-l border-muted-foreground/20 ml-3 space-y-4">
                {timelineEntries.map((entry, idx) => (
                  <li key={entry.id} className="ml-6">
                    <span
                      className={`absolute flex items-center justify-center w-3 h-3 rounded-full -left-1.5 border border-background ${
                        idx === timelineEntries.length - 1
                          ? "bg-primary"
                          : "bg-muted-foreground/40"
                      }`}
                    />
                    <div className="bg-muted/30 rounded-lg p-3 border">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">
                          {entry.action}
                        </span>
                        <time className="text-xs text-muted-foreground">
                          {formatDateTime(entry.createdAt)}
                        </time>
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <p>
                          Par :{" "}
                          {entry.userFullName || entry.userEmail || "System"}
                        </p>
                        {entry.userEmail && <p>Email : {entry.userEmail}</p>}
                        {entry.userRole && <p>Role : {entry.userRole}</p>}
                        {entry.ipAddress && <p>IP : {entry.ipAddress}</p>}
                      </div>
                      {entry.details && (
                        <p className="text-xs text-muted-foreground italic mt-1">
                          {entry.details}
                        </p>
                      )}
                      {entry.userAgent && (
                        <p
                          className="text-xs text-muted-foreground mt-1 truncate"
                          title={entry.userAgent}
                        >
                          {entry.userAgent}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-muted-foreground italic text-sm">
                Aucun historique disponible pour cette demande.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
