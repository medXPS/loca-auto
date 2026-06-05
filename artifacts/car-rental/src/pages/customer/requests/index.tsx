import { useListRentalRequests } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { formatPrice } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

export default function CustomerRequests() {
  const { data, isLoading } = useListRentalRequests({ limit: 100 });

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-serif font-bold tracking-tight mb-8">Historique des demandes</h1>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
                <tr>
                  <th className="px-6 py-4 font-medium">ID</th>
                  <th className="px-6 py-4 font-medium">Véhicule</th>
                  <th className="px-6 py-4 font-medium">Période</th>
                  <th className="px-6 py-4 font-medium">Total</th>
                  <th className="px-6 py-4 font-medium">Statut</th>
                  <th className="px-6 py-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array(3).fill(0).map((_, i) => (
                    <tr key={i} className="border-b">
                      <td className="px-6 py-4"><Skeleton className="h-5 w-16" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-5 w-32" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-5 w-24" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-5 w-20" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-6 w-24 rounded-full" /></td>
                      <td className="px-6 py-4 text-right"><Skeleton className="h-8 w-8 inline-block" /></td>
                    </tr>
                  ))
                ) : data?.requests && data.requests.length > 0 ? (
                  data.requests.map((req) => (
                    <tr key={req.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                        #{req.id}
                      </td>
                      <td className="px-6 py-4 font-medium">
                        {req.car?.brand} {req.car?.model}
                      </td>
                      <td className="px-6 py-4 text-xs whitespace-nowrap">
                        <div>{new Date(req.startDate).toLocaleDateString("fr-MA")}</div>
                        <div className="text-muted-foreground">au {new Date(req.returnDate).toLocaleDateString("fr-MA")}</div>
                      </td>
                      <td className="px-6 py-4 font-medium text-primary">
                        {formatPrice(req.finalPrice || req.estimatedTotalPrice)}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={req.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/dashboard/demandes/${req.id}`}>
                          <Button variant="ghost" size="icon" className="hover:bg-primary/10 hover:text-primary">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                      Aucune demande trouvée
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
