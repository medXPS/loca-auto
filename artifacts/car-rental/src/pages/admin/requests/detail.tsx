import { useRoute } from "wouter";
import { useGetRentalRequest, getGetRentalRequestQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice, formatDateTime } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { CountdownTimer } from "@/components/countdown-timer";
import { RequestActions } from "@/components/request-actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { User, Phone, Mail, Calendar, MapPin, CreditCard, Clock, FileText } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminRequestDetail() {
  const [, params] = useRoute("/admin/demandes/:id");
  const id = Number(params?.id);
  const { data: request, isLoading } = useGetRentalRequest(id, { query: { enabled: !!id, queryKey: getGetRentalRequestQueryKey(id) } });
  const queryClient = useQueryClient();

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: getGetRentalRequestQueryKey(id) });
  };

  if (isLoading) return <div className="p-6"><Skeleton className="h-96 w-full rounded-xl" /></div>;
  if (!request) return <div className="p-6 text-center">Demande introuvable</div>;

  const showCountdown = request.paymentDeadline && (request.status === "CALL_CONFIRMED" || request.status === "WAITING_AGENCY_PAYMENT");

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
        
        {/* Action Buttons */}
        <div className="bg-card p-2 rounded-lg border shadow-sm">
          <RequestActions requestId={request.id} status={request.status} onSuccess={handleSuccess} />
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
              <div className="font-medium">{request.car?.brand} {request.car?.model}</div>
              <StatusBadge status={request.car?.status || ""} type="car" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Date de départ</p>
                <p className="font-medium">{new Date(request.startDate).toLocaleDateString("fr-MA")}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Date de retour</p>
                <p className="font-medium">{new Date(request.returnDate).toLocaleDateString("fr-MA")}</p>
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
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status History & Notes (Placeholder) */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Notes & Commentaires
            </CardTitle>
          </CardHeader>
          <CardContent>
            {request.notes ? (
              <p className="whitespace-pre-wrap bg-muted/30 p-4 rounded-lg border">{request.notes}</p>
            ) : (
              <p className="text-muted-foreground italic">Aucune note pour cette demande.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
