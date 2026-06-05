import { useGetRentalRequest, getGetRentalRequestQueryKey } from "@workspace/api-client-react";
import { useRoute } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice, formatDateTime } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { CountdownTimer } from "@/components/countdown-timer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Car, Calendar, CreditCard, Clock, FileText } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function CustomerRequestDetail() {
  const [, params] = useRoute("/dashboard/demandes/:id");
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
    <div className="space-y-6 max-w-4xl mx-auto py-8 px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight">
            Ma Demande #{request.id}
          </h1>
          <p className="text-muted-foreground mt-1">Créée le {formatDateTime(request.createdAt)}</p>
        </div>
        <StatusBadge status={request.status} className="text-lg px-4 py-1.5" />
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
              Votre demande a été confirmée par téléphone. Veuillez vous présenter à notre agence avant le délai imparti pour finaliser le paiement et récupérer votre véhicule.
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
              <img src={request.car.mainImageUrl} alt={request.car.model} className="w-full h-48 object-cover rounded-lg mb-4" />
            )}
            <h3 className="font-bold text-xl">{request.car?.brand} {request.car?.model}</h3>
            <p className="text-muted-foreground">{request.car?.category} • {request.car?.year}</p>
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
                <p className="font-medium text-lg">{new Date(request.startDate).toLocaleDateString("fr-MA")}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Retour</p>
                <p className="font-medium text-lg">{new Date(request.returnDate).toLocaleDateString("fr-MA")}</p>
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
    </div>
  );
}
