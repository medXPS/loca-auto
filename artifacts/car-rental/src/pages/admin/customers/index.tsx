import { useMemo, useState } from "react";
import { Link } from "wouter";
import { getListCustomersQueryKey, useListCustomers } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime, getStatusLabel } from "@/lib/utils";
import { CalendarDays, Download, MapPin, Search, Users } from "lucide-react";

type CustomerDocument = {
  id: number;
  type?: string | null;
  status?: string | null;
  fileUrl: string;
  uploadedAt?: string | null;
  rentalRequestId?: number | null;
};

type CustomerRow = {
  id: number;
  cin?: string | null;
  drivingLicenseNumber?: string | null;
  city?: string | null;
  user: {
    fullName: string;
    email: string;
    phone: string;
    createdAt?: string | null;
  };
  documents?: CustomerDocument[];
};

function getDocumentLabel(type?: string | null) {
  if (type === "CIN") return "CIN";
  if (type === "PASSPORT") return "Passeport";
  if (type === "PERMIS_CONDUIRE") return "Permis";
  return type || "Document";
}

function getDocumentFileName(fileUrl: string) {
  const fileName = fileUrl.split("/").pop();
  return fileName && fileName.trim() ? fileName : fileUrl;
}

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
  const recentDocuments = useMemo(() => {
    return customers
      .flatMap((customer) =>
        (customer.documents ?? []).map((document) => ({
          customer,
          document,
        })),
      )
      .filter(({ document }) => Boolean(document.fileUrl))
      .sort(
        (a, b) =>
          new Date(b.document.uploadedAt ?? 0).getTime() -
          new Date(a.document.uploadedAt ?? 0).getTime(),
      )
      .slice(0, 6);
  }, [customers]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
      </div>

      <div className="flex items-center gap-2 rounded-lg border bg-card p-2">
        <Search className="ml-2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Rechercher par nom, téléphone ou CIN..."
          className="border-0 shadow-none focus-visible:ring-0"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {recentDocuments.length > 0 && (
        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="flex flex-col gap-2 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Derniers documents reçus</h2>
              <p className="text-sm text-muted-foreground">
                Les dernières pièces téléversées apparaissent ici pour vérification et téléchargement.
              </p>
            </div>
            <Badge variant="secondary" className="w-fit rounded-full px-3 py-1">
              {recentDocuments.length} fichier{recentDocuments.length > 1 ? "s" : ""}
            </Badge>
          </div>

          <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
            {recentDocuments.map(({ customer, document }) => (
              <div key={document.id} className="rounded-2xl border bg-background p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/admin/clients/${customer.id}`}
                      className="block truncate font-semibold hover:text-primary hover:underline"
                    >
                      {customer.user.fullName}
                    </Link>
                    <p className="mt-1 text-xs text-muted-foreground">{customer.user.email}</p>
                  </div>
                  <Badge variant="outline" className="shrink-0 rounded-full">
                    {getDocumentLabel(document.type)}
                  </Badge>
                </div>

                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {document.uploadedAt ? formatDateTime(document.uploadedAt) : "À l'instant"}
                </div>

                <div className="mt-3 rounded-xl border border-dashed bg-muted/30 px-3 py-2 text-sm text-slate-600">
                  {getDocumentFileName(document.fileUrl)}
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <Badge variant="secondary" className="rounded-full">
                    {getStatusLabel(document.status, "document")}
                  </Badge>
                  <Button asChild size="sm" variant="outline" className="rounded-full border-border/70 bg-white">
                    <a href={document.fileUrl} download={getDocumentFileName(document.fileUrl)}>
                      Télécharger
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
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
                      <td className="px-6 py-4">
                        <Skeleton className="h-5 w-24" />
                      </td>
                    </tr>
                  ))
              ) : customers.length > 0 ? (
                customers.map((customer) => {
                  const customerDocuments = customer.documents ?? [];
                  const latestDocument = customerDocuments[0] ?? null;

                  return (
                    <tr key={customer.id} className="border-b last:border-0 transition-colors hover:bg-muted/30">
                      <td className="px-6 py-4 font-medium">
                        <Link href={`/admin/clients/${customer.id}`} className="hover:text-primary hover:underline">
                          {customer.user.fullName}
                        </Link>
                        <div className="text-xs text-muted-foreground">{customer.cin || "CIN non renseigné"}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div>{customer.user.email}</div>
                        <div className="text-xs text-muted-foreground">{customer.user.phone}</div>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <div className="space-y-1">
                          <div className="font-medium text-foreground">
                            {customerDocuments.length > 0
                              ? `${customerDocuments.length} fichier${customerDocuments.length > 1 ? "s" : ""}`
                              : "Aucun document"}
                          </div>
                          {latestDocument ? (
                            <div className="text-muted-foreground">
                              Dernier: {getDocumentLabel(latestDocument.type)} · {formatDateTime(latestDocument.uploadedAt)}
                            </div>
                          ) : (
                            <div className="text-amber-600">En attente de téléversement</div>
                          )}
                          <div className="flex flex-wrap gap-1 pt-1">
                            {customer.cin || customerDocuments.some((doc) => doc.type === "CIN" || doc.type === "PASSPORT") ? (
                              <Badge variant="secondary" className="rounded-full text-[10px] uppercase">
                                CIN
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="rounded-full text-[10px] uppercase">
                                CIN manquant
                              </Badge>
                            )}
                            {customer.drivingLicenseNumber ||
                            customerDocuments.some((doc) => doc.type === "PERMIS_CONDUIRE") ? (
                              <Badge variant="secondary" className="rounded-full text-[10px] uppercase">
                                Permis
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="rounded-full text-[10px] uppercase">
                                Permis manquant
                              </Badge>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {customer.city || "Non renseigné"}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {customer.user.createdAt ? new Date(customer.user.createdAt).toLocaleDateString("fr-MA") : "—"}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-2">
                    <Empty className="border-0">
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <Users />
                        </EmptyMedia>
                        <EmptyTitle>Aucun client trouvé</EmptyTitle>
                        <EmptyDescription>
                          {search
                            ? "Aucun client ne correspond à votre recherche."
                            : "Les clients apparaîtront ici après leur première réservation."}
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
