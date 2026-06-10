import { useGetCustomer, getGetCustomerQueryKey } from "@workspace/api-client-react";
import { useRoute, Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BadgeCheck, CreditCard, FileText, History, MapPin, Phone, User, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { formatPrice, isActiveRentalStatus } from "@/lib/utils";

type CustomerDetailView = {
  id: number;
  cin?: string | null;
  passportNumber?: string | null;
  drivingLicenseNumber?: string | null;
  address?: string | null;
  city?: string | null;
  user?: {
    fullName: string;
    email: string;
    phone: string;
    createdAt?: string | null;
  } | null;
  rentalRequests: Array<{
    id: number;
    status: string;
    startDate: string;
    returnDate: string;
    estimatedTotalPrice: number;
    finalPrice: number | null;
  }>;
  activeRentalRequests?: Array<{
    id: number;
    status: string;
    startDate: string;
    returnDate: string;
    estimatedTotalPrice: number;
    finalPrice: number | null;
  }>;
  summary?: {
    totalSpent: number;
    activeReservations: number;
    completedRentals: number;
    status: string;
    lastRentalAt: string | null;
  };
};

export default function AdminCustomerDetail() {
  const [, params] = useRoute("/admin/clients/:id");
  const id = Number(params?.id);
  const { data: rawCustomer, isLoading } = useGetCustomer(id, { query: { enabled: !!id, queryKey: getGetCustomerQueryKey(id) } });
  const customer = rawCustomer as CustomerDetailView | undefined;

  if (isLoading) return <div className="p-6"><Skeleton className="h-[400px] w-full max-w-4xl mx-auto rounded-xl" /></div>;
  if (!customer) return <div className="p-6 text-center">Client introuvable</div>;

  const activeRequests = customer.activeRentalRequests ?? customer.rentalRequests.filter((request) => isActiveRentalStatus(request.status));
  const summary = customer.summary ?? {
    totalSpent: customer.rentalRequests.reduce((sum, request) => sum + Number(request.finalPrice ?? request.estimatedTotalPrice ?? 0), 0),
    activeReservations: activeRequests.length,
    completedRentals: customer.rentalRequests.filter((request) => ["CAR_RETURNED", "RETURNED", "COMPLETED"].includes(request.status)).length,
    status: activeRequests.length > 0 ? "Actif" : customer.rentalRequests.length > 0 ? "Déjà client" : "Nouveau",
    lastRentalAt: customer.rentalRequests[0]?.startDate ?? null,
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Link href="/admin/clients">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">Fiche client</h1>
            <Badge variant="outline" className="uppercase tracking-[0.14em]">
              {summary.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">Vue complète du profil, des documents et de l’historique de location</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-primary/10 bg-primary/5">
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">CIN</p>
            <p className="mt-2 text-lg font-semibold">{customer.cin || "Non renseigné"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Réservations en cours</p>
            <p className="mt-2 text-lg font-semibold">{summary.activeReservations}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Montant total dépensé</p>
            <p className="mt-2 text-lg font-semibold">{formatPrice(summary.totalSpent)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Statut client</p>
            <p className="mt-2 text-lg font-semibold">{summary.status}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-muted/20">
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Profil client
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 p-6">
            <div>
              <h3 className="text-2xl font-semibold tracking-tight">{customer.user?.fullName || "Nom non renseigné"}</h3>
              <p className="text-sm text-muted-foreground">
                Client depuis {customer.user?.createdAt ? new Date(customer.user.createdAt).toLocaleDateString("fr-MA") : "—"}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border bg-background p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  Téléphone
                </div>
                <p className="mt-2 font-medium">{customer.user?.phone || "Non renseigné"}</p>
              </div>
              <div className="rounded-2xl border bg-background p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CreditCard className="h-4 w-4" />
                  Email
                </div>
                <p className="mt-2 truncate font-medium">{customer.user?.email || "Non renseigné"}</p>
              </div>
              <div className="rounded-2xl border bg-background p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  Adresse
                </div>
                <p className="mt-2 font-medium">
                  {customer.address || "Adresse non renseignée"}
                  {customer.city ? ` • ${customer.city}` : ""}
                </p>
              </div>
              <div className="rounded-2xl border bg-background p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <BadgeCheck className="h-4 w-4" />
                  Permis
                </div>
                <p className="mt-2 font-medium">{customer.drivingLicenseNumber || "Non renseigné"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-muted/20">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Documents et identifiants
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border bg-background p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">CIN</p>
                <p className="mt-2 font-medium">{customer.cin || "Non renseigné"}</p>
              </div>
              <div className="rounded-2xl border bg-background p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Passeport</p>
                <p className="mt-2 font-medium">{customer.passportNumber || "Non renseigné"}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-dashed bg-muted/20 p-4">
              <p className="text-sm font-medium">Dernière activité</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {summary.lastRentalAt ? new Date(summary.lastRentalAt).toLocaleDateString("fr-MA") : "Aucune location enregistrée"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-muted/20">
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-primary" />
              Réservations en cours
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {activeRequests.length > 0 ? (
              <div className="space-y-3">
                {activeRequests.map((request) => (
                  <div key={request.id} className="flex flex-col gap-3 rounded-2xl border bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">#{request.id}</span>
                        <StatusBadge status={request.status} />
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {new Date(request.startDate).toLocaleDateString("fr-MA")} - {new Date(request.returnDate).toLocaleDateString("fr-MA")}
                      </p>
                    </div>
                    <p className="text-sm font-medium">
                      {formatPrice(request.finalPrice || request.estimatedTotalPrice)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aucune réservation active pour ce client.</p>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-muted/20">
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              Historique des locations
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {customer.rentalRequests.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
                    <tr>
                      <th className="px-4 py-3 font-medium">ID</th>
                      <th className="px-4 py-3 font-medium">Dates</th>
                      <th className="px-4 py-3 font-medium">Statut</th>
                      <th className="px-4 py-3 font-medium text-right">Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customer.rentalRequests.map((request) => (
                      <tr key={request.id} className="border-b last:border-0">
                        <td className="px-4 py-3 font-mono">#{request.id}</td>
                        <td className="px-4 py-3">
                          {new Date(request.startDate).toLocaleDateString("fr-MA")} - {new Date(request.returnDate).toLocaleDateString("fr-MA")}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={request.status} />
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {formatPrice(request.finalPrice || request.estimatedTotalPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center text-muted-foreground">
                Ce client n'a pas encore d'historique de location.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
