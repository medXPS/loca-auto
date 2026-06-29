import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, FileX, Search } from "lucide-react";
import { useListAuditLogs } from "@workspace/api-client-react";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/utils";

const PAGE_SIZE = 25;

function getAuditActorLabel(log: {
  userFullName?: string | null;
  userEmail?: string | null;
}) {
  return log.userFullName || log.userEmail || "System";
}

function getAuditSearchBlob(log: {
  userFullName?: string | null;
  userEmail?: string | null;
  userRole?: string | null;
  ipAddress?: string | null;
  action?: string | null;
  entityType?: string | null;
  details?: string | null;
  userAgent?: string | null;
}) {
  return [
    log.userFullName,
    log.userEmail,
    log.userRole,
    log.ipAddress,
    log.action,
    log.entityType,
    log.details,
    log.userAgent,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export default function AdminAuditLogs() {
  const [userFilter, setUserFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useListAuditLogs({ limit: 500 });

  const allActions = useMemo(() => {
    if (!data?.logs) return [];
    return Array.from(new Set(data.logs.map((log) => log.action))).sort();
  }, [data?.logs]);

  const filtered = useMemo(() => {
    if (!data?.logs) return [];
    const normalizedFilter = userFilter.trim().toLowerCase();

    return data.logs.filter((log) => {
      const matchesAction =
        actionFilter === "all" || log.action === actionFilter;
      const matchesUser =
        !normalizedFilter || getAuditSearchBlob(log).includes(normalizedFilter);
      return matchesAction && matchesUser;
    });
  }, [data?.logs, actionFilter, userFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const handleActionChange = (value: string) => {
    setActionFilter(value);
    setPage(1);
  };

  const handleUserChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUserFilter(event.target.value);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Journaux d'audit</h1>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex flex-1 items-center gap-2 rounded-lg border bg-card p-2">
          <Search className="ml-2 h-5 w-5 shrink-0 text-muted-foreground" />
          <Input
            placeholder="Filtrer par nom, email, IP..."
            className="border-0 shadow-none focus-visible:ring-0"
            value={userFilter}
            onChange={handleUserChange}
          />
        </div>
        <div className="w-full sm:w-64">
          <Select value={actionFilter} onValueChange={handleActionChange}>
            <SelectTrigger className="h-full min-h-[48px] bg-card">
              <SelectValue placeholder="Type d'action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les actions</SelectItem>
              {allActions.map((action) => (
                <SelectItem key={action} value={action}>
                  {action}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-medium">Date & Heure</th>
                <th className="px-6 py-4 font-medium">Utilisateur</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">IP</th>
                <th className="px-6 py-4 font-medium">Action</th>
                <th className="px-6 py-4 font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array(10)
                  .fill(0)
                  .map((_, index) => (
                    <tr key={index} className="border-b">
                      <td className="px-6 py-4">
                        <Skeleton className="h-5 w-32" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-5 w-32" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-5 w-20" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-5 w-24" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-5 w-24" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-5 w-48" />
                      </td>
                    </tr>
                  ))
              ) : paginated.length > 0 ? (
                paginated.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b last:border-0 hover:bg-muted/30"
                  >
                    <td className="whitespace-nowrap px-6 py-4 text-muted-foreground">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium">
                        {getAuditActorLabel(log)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {log.userEmail || "Email not available"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {log.userRole ? (
                        <span className="inline-flex rounded-full bg-primary/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
                          {log.userRole}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 font-mono text-xs text-muted-foreground">
                      {log.ipAddress || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded bg-muted px-2 py-1 font-mono text-xs">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      <div>
                        {log.entityType} #{log.entityId}
                      </div>
                      {log.details && (
                        <div className="mt-1 text-xs italic">{log.details}</div>
                      )}
                      {log.userAgent && (
                        <div
                          className="mt-1 truncate text-xs"
                          title={log.userAgent}
                        >
                          {log.userAgent}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12">
                    <Empty>
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <FileX />
                        </EmptyMedia>
                        <EmptyTitle>Aucun journal trouve</EmptyTitle>
                        <EmptyDescription>
                          {userFilter || actionFilter !== "all"
                            ? "Modifiez vos filtres pour afficher les journaux."
                            : "Aucune activite enregistree pour le moment."}
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {!isLoading && filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between border-t bg-muted/20 px-6 py-4">
            <span className="text-sm text-muted-foreground">
              {filtered.length} résultats - page {safePage} / {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={safePage <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Precedent
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPage((current) => Math.min(totalPages, current + 1))
                }
                disabled={safePage >= totalPages}
              >
                Suivant
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
