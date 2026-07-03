import { useMemo, useState } from "react";
import { Link } from "wouter";
import { getListCustomersQueryKey, useListCustomers } from "@workspace/api-client-react";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Search, Users } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";

type CustomerDocument = {
  id: number;
  type: string;
  status?: string | null;
  uploadedAt?: string | null;
  rentalRequestId?: number | null;
};

type CustomerRow = {
  id: number;
  cin?: string | null;
  drivingLicenseNumber?: string | null;
  city?: string | null;
  documents?: CustomerDocument[];
  user: {
    fullName: string;
    email: string;
    phone: string;
    createdAt?: string | null;
  };
};

function getLatestDocument(
  documents: CustomerDocument[] | undefined,
  acceptedTypes: string[],
) {
  const statusWeight = (status?: string | null) => {
    switch (status) {
      case "APPROVED":
      case "VALIDATED":
        return 3;
      case "PENDING":
      case "RCVD":
      case "RECEIVED":
      case "SENT":
        return 2;
      case "REJECTED":
        return 1;
      default:
        return 0;
    }
  };

  return [...(documents ?? [])]
    .filter((document) => acceptedTypes.includes(document.type))
    .sort(
      (left, right) =>
        new Date(right.uploadedAt ?? 0).getTime() -
          new Date(left.uploadedAt ?? 0).getTime() ||
        statusWeight(right.status) - statusWeight(left.status) ||
        Number(Boolean(right.rentalRequestId)) -
          Number(Boolean(left.rentalRequestId)),
    )[0] ?? null;
}

function getIdentityLabel(args: {
  label: string;
  value?: string | null;
  document?: CustomerDocument | null;
  missingLabel: string;
}) {
  if (args.value?.trim()) {
    return args.value.trim();
  }

  if (args.document) {
    return `${args.label} soumis`;
  }

  return args.missingLabel;
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
  const customersWithDocuments = useMemo(
    () =>
      customers.map((customer) => {
        const cinDocument = getLatestDocument(customer.documents, [
          "CIN",
          "PASSPORT",
        ]);
        const drivingLicenseDocument = getLatestDocument(customer.documents, [
          "PERMIS_CONDUIRE",
        ]);

        return {
          ...customer,
          cinDocument,
          drivingLicenseDocument,
        };
      }),
    [customers],
  );

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
              ) : customersWithDocuments.length > 0 ? (
                customersWithDocuments.map((customer) => (
                  <tr key={customer.id} className="border-b last:border-0 transition-colors hover:bg-muted/30">
                    <td className="px-6 py-4 font-medium">
                      <Link href={`/admin/clients/${customer.id}`} className="hover:text-primary hover:underline">
                        {customer.user.fullName}
                      </Link>
                      <div className="mt-2 space-y-2">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>
                            {getIdentityLabel({
                              label: "CIN",
                              value: customer.cin,
                              document: customer.cinDocument,
                              missingLabel: "CIN non renseigne",
                            })}
                          </span>
                          {customer.cinDocument?.status && (
                            <StatusBadge
                              status={customer.cinDocument.status}
                              type="document"
                              className="rounded-full text-[10px]"
                            />
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>
                            {getIdentityLabel({
                              label: "Permis",
                              value: customer.drivingLicenseNumber,
                              document: customer.drivingLicenseDocument,
                              missingLabel: "Permis non renseigne",
                            })}
                          </span>
                          {customer.drivingLicenseDocument?.status && (
                            <StatusBadge
                              status={customer.drivingLicenseDocument.status}
                              type="document"
                              className="rounded-full text-[10px]"
                            />
                          )}
                        </div>
                      </div>
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
