import { useState } from "react";
import { Link } from "wouter";
import { getListCustomersQueryKey, useListCustomers } from "@workspace/api-client-react";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Search, Users } from "lucide-react";

type CustomerRow = {
  id: number;
  cin?: string | null;
  city?: string | null;
  user: {
    fullName: string;
    email: string;
    phone: string;
    createdAt?: string | null;
  };
};

export default function AdminCustomers() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useListCustomers(
    { search: search || undefined, limit: 100 },
    {
      query: {
        queryKey: getListCustomersQueryKey({ search: search || undefined, limit: 100 }),
        refetchInterval: 15000,
        refetchIntervalInBackground: true,
      },
    },
  );

  const customers = (data?.customers ?? []) as CustomerRow[];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
      </div>

      <div className="flex items-center gap-2 rounded-lg border bg-card p-2">
        <Search className="ml-2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Rechercher par nom, telephone ou CIN..."
          className="border-0 shadow-none focus-visible:ring-0"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-medium">Client</th>
                <th className="px-6 py-4 font-medium">Contact</th>
                <th className="px-6 py-4 font-medium">Localisation</th>
                <th className="px-6 py-4 font-medium">Inscription</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array(5)
                  .fill(0)
                  .map((_, index) => (
                    <tr key={index} className="border-b">
                      <td className="px-6 py-4">
                        <Skeleton className="h-5 w-32" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-5 w-40" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-5 w-24" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-5 w-24" />
                      </td>
                    </tr>
                  ))
              ) : customers.length > 0 ? (
                customers.map((customer) => (
                  <tr key={customer.id} className="border-b last:border-0 transition-colors hover:bg-muted/30">
                    <td className="px-6 py-4 font-medium">
                      <Link href={`/admin/clients/${customer.id}`} className="hover:text-primary hover:underline">
                        {customer.user.fullName}
                      </Link>
                      <div className="text-xs text-muted-foreground">{customer.cin || "CIN non renseigne"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div>{customer.user.email}</div>
                      <div className="text-xs text-muted-foreground">{customer.user.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {customer.city || "Non renseignee"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {customer.user.createdAt ? new Date(customer.user.createdAt).toLocaleDateString("fr-MA") : "-"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-2">
                    <Empty className="border-0">
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <Users />
                        </EmptyMedia>
                        <EmptyTitle>Aucun client trouve</EmptyTitle>
                        <EmptyDescription>
                          {search
                            ? "Aucun client ne correspond a votre recherche."
                            : "Les clients apparaitront ici apres leur premiere reservation."}
                        </EmptyDescription>
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
