import { useRoute, useLocation } from "wouter";
import {
  useGetRentalRequest,
  getGetRentalRequestQueryKey,
  getListAuditLogsQueryKey,
  useListAuditLogs,
} from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice, formatDateTime } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { CountdownTimer } from "@/components/countdown-timer";
import { RequestActions } from "@/components/request-actions";
import { ReceiptDownloadButton } from "@/components/receipt-download-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Phone, Mail, Calendar, FileText, History, CreditCard } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminRequestDetail() {
  const [location] = useLocation();
  const [, adminParams] = useRoute("/admin/demandes/:id");
  const [, agentParams] = useRoute("/agent/demandes/:id");
  const params = adminParams ?? agentParams;
  const id = Number(params?.id);

  const { data: request, isLoading } = useGetRentalRequest(id, {
    query: { enabled: !!id, queryKey: getGetRentalRequestQueryKey(id) },
  });
  const { data: auditData, isLoading: isAuditLoading } = useListAuditLogs({ limit: 500 });
  const queryClient = useQueryClient();

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: getGetRentalRequestQueryKey(id) });
    queryClient.invalidateQueries({ queryKey: getListAuditLogsQueryKey() });
  };

  if (isLoading) return <div className="p-6"><Skeleton className="h-96 w-full rounded-xl" /></div>;
  if (!request) return <div className="p-6 text-center">Demande introuvable</div>;

  const showCountdown =
    request.paymentDeadline &&
    (request.status === "CALL_CONFIRMED" || request.status === "WAITING_AGENCY_PAYMENT" || request.status === "EXTENDED_PAYMENT_DEADLINE");
  const canPrintReceipt = ["RESERVED", "CAR_DELIVERED", "RENTED", "CAR_RETURNED", "RETURNED", "COMPLETED"].includes(request.status);

  const timelineEntries = (auditData?.logs || [])
    .filter(
      (log) =>
        log.entityType === "rental_request" && String(log.entityId) === String(id)
    )
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
            Demande #{request.id}
            <StatusBadge status={request.status} />
          </h1>
          <p className="text-muted-foreground mt-1">Créée le {formatDateTime(request.createdAt)}</p>
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
        <CountdownTimer deadline={request.paymentDeadline} onExpire={handleSuccess} />
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
                <p className="text-sm text-muted-foreground mb-1">Nom complet</p>
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
                <p className="text-sm text-muted-foreground mb-1">CIN / Passeport</p>
                <p className="font-medium">{request.cinOrPassport || "Non renseigné"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Permis de conduire</p>
                <p className="font-medium">{request.drivingLicenseNumber || "Non renseigné"}</p>
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
                <p className="text-sm text-muted-foreground mb-1">Date de départ</p>
                <p className="font-medium">
                  {new Date(request.startDate).toLocaleDateString("fr-MA")}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Date de retour</p>
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
                  <p>{formatPrice(request.finalPrice || request.estimatedTotalPrice)}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Paiement</p>
                    <div className="mt-2 flex items-center gap-2 font-medium">
                      <CreditCard className="h-4 w-4 text-primary" />
                      {request.paymentStatus || "Non payé"}
                    </div>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Mode</p>
                    <p className="mt-2 font-medium">{request.paymentMethod || "Non renseigné"}</p>
                  </div>
                </div>
              </div>
            </div>
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
              <p className="text-muted-foreground italic">Aucune note pour cette demande.</p>
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
                {Array(3).fill(0).map((_, i) => (
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
                      {entry.userFullName && (
                        <p className="text-xs text-muted-foreground">
                          Par : {entry.userFullName}
                        </p>
                      )}
                      {entry.details && (
                        <p className="text-xs text-muted-foreground italic mt-1">
                          {entry.details}
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
