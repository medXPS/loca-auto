import { useListCustomers } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Search, MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { Link } from "wouter";

export default function AdminCustomers() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useListCustomers({ search: search || undefined, limit: 100 });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
      </div>

      <div className="flex items-center gap-2 bg-card p-2 rounded-lg border">
        <Search className="w-5 h-5 text-muted-foreground ml-2" />
        <Input 
          placeholder="Rechercher un client..." 
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
                <th className="px-6 py-4 font-medium">Client</th>
                <th className="px-6 py-4 font-medium">Contact</th>
                <th className="px-6 py-4 font-medium">Documents</th>
                <th className="px-6 py-4 font-medium">Localisation</th>
                <th className="px-6 py-4 font-medium">Inscription</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="border-b">
                    <td className="px-6 py-4"><Skeleton className="h-5 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-40" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-24" /></td>
                  </tr>
                ))
              ) : data?.customers && data.customers.length > 0 ? (
                data.customers.map((customer) => (
                  <tr key={customer.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium">
                      <Link href={`/admin/clients/${customer.id}`} className="hover:text-primary hover:underline">
                        {customer.user.fullName}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div>{customer.user.email}</div>
                      <div className="text-xs text-muted-foreground">{customer.user.phone}</div>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {customer.cin ? <div className="text-emerald-600">CIN: Oui</div> : <div className="text-amber-600">CIN: Manquant</div>}
                      {customer.drivingLicenseNumber ? <div className="text-emerald-600">Permis: Oui</div> : <div className="text-amber-600">Permis: Manquant</div>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        {customer.city || "Non renseigné"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {customer.user.createdAt ? new Date(customer.user.createdAt).toLocaleDateString("fr-MA") : "—"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    Aucun client trouvé
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
