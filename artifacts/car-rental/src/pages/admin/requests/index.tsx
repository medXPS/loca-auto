import { useListRentalRequests } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useLocation } from "wouter";
import { Search, Eye, Filter, ClipboardList } from "lucide-react";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { StatusBadge } from "@/components/status-badge";
import { formatPrice, formatDateTime } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RequestActions } from "@/components/request-actions";

export default function AdminRequests() {
  const [location] = useLocation();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { data, isLoading, refetch } = useListRentalRequests({ 
    limit: 100,
    status: statusFilter !== "all" ? statusFilter : undefined
  });
  const basePath = location.startsWith("/agent") ? "/agent" : "/admin";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Demandes de location</h1>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 flex items-center gap-2 bg-card p-2 rounded-lg border">
          <Search className="w-5 h-5 text-muted-foreground ml-2" />
          <Input 
            placeholder="Rechercher un client..." 
            className="border-0 shadow-none focus-visible:ring-0"
          />
        </div>
        <div className="w-full sm:w-64">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-card h-full min-h-[48px]">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <SelectValue placeholder="Filtrer par statut" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="PENDING">En attente</SelectItem>
              <SelectItem value="CALL_ATTEMPTED">Appel effectué</SelectItem>
              <SelectItem value="CALL_CONFIRMED">Confirmée</SelectItem>
              <SelectItem value="RESERVED">Réservée</SelectItem>
              <SelectItem value="CAR_DELIVERED">Livrée</SelectItem>
              <SelectItem value="COMPLETED">Terminée</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
              <tr>
                <th className="px-6 py-4 font-medium">ID / Date</th>
                <th className="px-6 py-4 font-medium">Client</th>
                <th className="px-6 py-4 font-medium">Véhicule</th>
                <th className="px-6 py-4 font-medium">Période</th>
                <th className="px-6 py-4 font-medium">Total</th>
                <th className="px-6 py-4 font-medium">Statut</th>
                <th className="px-6 py-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="border-b">
                    <td className="px-6 py-4"><Skeleton className="h-5 w-16" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-20" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-24 rounded-full" /></td>
                    <td className="px-6 py-4 text-right"><Skeleton className="h-8 w-8 inline-block" /></td>
                  </tr>
                ))
              ) : data?.requests && data.requests.length > 0 ? (
                data.requests.map((req) => (
                  <tr key={req.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-mono text-xs mb-1">#{req.id}</div>
                      <div className="text-xs text-muted-foreground">{formatDateTime(req.createdAt).split(' ')[0]}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{req.fullName}</div>
                      <div className="text-xs text-muted-foreground">{req.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{req.car?.brand} {req.car?.model}</div>
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
                      <div className="flex flex-col items-end gap-2">
                        <RequestActions
                          requestId={req.id}
                          status={req.status}
                          estimatedPrice={req.estimatedTotalPrice}
                          onSuccess={() => refetch()}
                        />
                        <Link href={`${basePath}/demandes/${req.id}`}>
                          <Button variant="ghost" size="icon" className="hover:bg-primary/10 hover:text-primary">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-2">
                    <Empty className="border-0">
                      <EmptyHeader>
                        <EmptyMedia variant="icon"><ClipboardList /></EmptyMedia>
                        <EmptyTitle>Aucune demande trouvée</EmptyTitle>
                        <EmptyDescription>Il n'y a aucune demande correspondant aux filtres sélectionnés.</EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
