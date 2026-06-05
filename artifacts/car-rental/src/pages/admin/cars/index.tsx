import { useListCars } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { Plus, Search, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { formatPrice } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";

export default function AdminCars() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useListCars({ search: search || undefined, limit: 100 });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Flotte de véhicules</h1>
        <Link href="/admin/voitures/nouvelle">
          <Button className="gap-2">
            <Plus className="w-4 h-4" /> Nouvelle voiture
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-2 bg-card p-2 rounded-lg border">
        <Search className="w-5 h-5 text-muted-foreground ml-2" />
        <Input 
          placeholder="Rechercher par marque, modèle ou matricule..." 
          className="border-0 shadow-none focus-visible:ring-0"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
              <tr>
                <th className="px-6 py-4 font-medium">Véhicule</th>
                <th className="px-6 py-4 font-medium">Catégorie</th>
                <th className="px-6 py-4 font-medium">Prix/Jour</th>
                <th className="px-6 py-4 font-medium">Matricule</th>
                <th className="px-6 py-4 font-medium">Statut</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="border-b">
                    <td className="px-6 py-4"><Skeleton className="h-5 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-20" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-24 rounded-full" /></td>
                    <td className="px-6 py-4 text-right"><Skeleton className="h-8 w-8 inline-block" /></td>
                  </tr>
                ))
              ) : data?.cars && data.cars.length > 0 ? (
                data.cars.map((car) => (
                  <tr key={car.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {car.mainImageUrl ? (
                          <div className="w-12 h-12 rounded bg-muted overflow-hidden shrink-0">
                            <img src={car.mainImageUrl} alt={car.model} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded bg-muted flex items-center justify-center text-xs shrink-0">
                            Img
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-foreground">{car.brand} {car.model}</div>
                          <div className="text-xs text-muted-foreground">{car.year} • {car.city || "Maroc"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">{car.category}</td>
                    <td className="px-6 py-4 font-medium">{formatPrice(car.dailyPrice)}</td>
                    <td className="px-6 py-4 text-muted-foreground">{car.licensePlate || "—"}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={car.status} type="car" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <Link href={`/admin/voitures/${car.id}`}>
                            <DropdownMenuItem className="cursor-pointer gap-2">
                              <Pencil className="w-4 h-4" /> Modifier
                            </DropdownMenuItem>
                          </Link>
                          <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer gap-2">
                            <Trash2 className="w-4 h-4" /> Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    Aucune voiture trouvée
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
