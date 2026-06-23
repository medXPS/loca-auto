import { useListRentalRequests } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { formatPrice } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Car, CheckCircle, Clock, UserCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CustomerDashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useListRentalRequests({ limit: 50 });

  const requests = data?.requests ?? [];
  const activeCount = requests.filter(r => ["ACTIVE", "CAR_DELIVERED", "RESERVED", "CALL_CONFIRMED", "WAITING_AGENCY_PAYMENT"].includes(r.status)).length;
  const completedCount = requests.filter(r => r.status === "COMPLETED").length;
  const recentRequests = requests.slice(0, 5);

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight">Bonjour, {user?.fullName}</h1>
          <p className="text-muted-foreground mt-2">Bienvenue sur votre espace client Location Auto Maroc.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard/profil">
            <Button variant="outline" className="gap-2">
              <UserCircle2 className="w-4 h-4" /> Mon profil
            </Button>
          </Link>
          <Link href="/voitures">
            <Button className="gap-2">
              <Car className="w-4 h-4" /> Nouvelle réservation
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-4 bg-primary/10 rounded-full text-primary">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total demandes</p>
              <p className="text-2xl font-bold">{isLoading ? "—" : requests.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-4 bg-blue-500/10 rounded-full text-blue-600">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">En cours</p>
              <p className="text-2xl font-bold">{isLoading ? "—" : activeCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-4 bg-emerald-500/10 rounded-full text-emerald-600">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Terminées</p>
              <p className="text-2xl font-bold">{isLoading ? "—" : completedCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Mes demandes récentes</CardTitle>
          <Link href="/dashboard/demandes" className="text-sm text-primary hover:underline">
            Voir tout
          </Link>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium rounded-tl-lg">Véhicule</th>
                  <th className="px-4 py-3 font-medium">Dates</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium rounded-tr-lg">Statut</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={4} className="p-4"><Skeleton className="h-8 w-full" /></td></tr>
                ) : recentRequests.length > 0 ? (
                  recentRequests.map((req) => (
                    <tr key={req.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">
                        <Link href={`/dashboard/demandes/${req.id}`} className="hover:text-primary hover:underline">
                          {req.car ? `${req.car.brand} ${req.car.model}` : `Demande #${req.id}`}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {new Date(req.startDate).toLocaleDateString("fr-MA")} – {new Date(req.returnDate).toLocaleDateString("fr-MA")}
                      </td>
                      <td className="px-4 py-3 font-medium text-primary">
                        {formatPrice(req.finalPrice || req.estimatedTotalPrice)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={req.status} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                      Vous n'avez aucune demande de location pour le moment.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
