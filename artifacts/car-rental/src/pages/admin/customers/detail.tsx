import { useGetCustomer, getGetCustomerQueryKey } from "@workspace/api-client-react";
import { useRoute, Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, User, Phone, Mail, MapPin, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminCustomerDetail() {
  const [, params] = useRoute("/admin/clients/:id");
  const id = Number(params?.id);
  const { data: customer, isLoading } = useGetCustomer(id, { query: { enabled: !!id, queryKey: getGetCustomerQueryKey(id) } });

  if (isLoading) return <div className="p-6"><Skeleton className="h-[400px] w-full max-w-4xl mx-auto rounded-xl" /></div>;
  if (!customer) return <div className="p-6 text-center">Client introuvable</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Link href="/admin/clients">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Détails du client</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Profil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-xl font-bold">{customer.user.fullName}</h3>
              <p className="text-sm text-muted-foreground">Client depuis {new Date(customer.user.createdAt || "").toLocaleDateString("fr-MA")}</p>
            </div>
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>{customer.user.phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="truncate">{customer.user.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span>{customer.address || "Adresse non renseignée"} {customer.city ? `(${customer.city})` : ""}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-muted/30 rounded-xl border">
                <p className="text-sm text-muted-foreground mb-1">CIN (Carte Nationale)</p>
                <p className="font-medium">{customer.cin || "Non renseigné"}</p>
              </div>
              <div className="p-4 bg-muted/30 rounded-xl border">
                <p className="text-sm text-muted-foreground mb-1">Numéro de passeport</p>
                <p className="font-medium">{customer.passportNumber || "Non renseigné"}</p>
              </div>
              <div className="p-4 bg-muted/30 rounded-xl border sm:col-span-2">
                <p className="text-sm text-muted-foreground mb-1">Permis de conduire</p>
                <p className="font-medium">{customer.drivingLicenseNumber || "Non renseigné"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Historique des locations</CardTitle>
          </CardHeader>
          <CardContent>
            {customer.rentalRequests && customer.rentalRequests.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
                    <tr>
                      <th className="px-4 py-3 font-medium">ID</th>
                      <th className="px-4 py-3 font-medium">Dates</th>
                      <th className="px-4 py-3 font-medium">Statut</th>
                      <th className="px-4 py-3 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customer.rentalRequests.map((req) => (
                      <tr key={req.id} className="border-b last:border-0">
                        <td className="px-4 py-3 font-mono">#{req.id}</td>
                        <td className="px-4 py-3">
                          {new Date(req.startDate).toLocaleDateString("fr-MA")} - {new Date(req.returnDate).toLocaleDateString("fr-MA")}
                        </td>
                        <td className="px-4 py-3">{req.status}</td>
                        <td className="px-4 py-3 text-right">
                          <Link href={`/admin/demandes/${req.id}`}>
                            <Button variant="ghost" size="sm">Voir</Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">Ce client n'a pas encore d'historique de location.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
