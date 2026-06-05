import { useListAuditLogs } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/utils";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { FileX } from "lucide-react";

const PAGE_SIZE = 25;

export default function AdminAuditLogs() {
  const [userFilter, setUserFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useListAuditLogs({ limit: 500 });

  const allActions = useMemo(() => {
    if (!data?.logs) return [];
    const unique = Array.from(new Set(data.logs.map((l) => l.action))).sort();
    return unique;
  }, [data?.logs]);

  const filtered = useMemo(() => {
    if (!data?.logs) return [];
    return data.logs.filter((log) => {
      const matchesAction = actionFilter === "all" || log.action === actionFilter;
      const matchesUser =
        !userFilter ||
        (log.userFullName || "Système").toLowerCase().includes(userFilter.toLowerCase());
      return matchesAction && matchesUser;
    });
  }, [data?.logs, actionFilter, userFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleActionChange = (value: string) => {
    setActionFilter(value);
    setPage(1);
  };

  const handleUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserFilter(e.target.value);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Journaux d'audit</h1>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 flex items-center gap-2 bg-card p-2 rounded-lg border">
          <Search className="w-5 h-5 text-muted-foreground ml-2 shrink-0" />
          <Input
            placeholder="Filtrer par utilisateur..."
            className="border-0 shadow-none focus-visible:ring-0"
            value={userFilter}
            onChange={handleUserChange}
          />
        </div>
        <div className="w-full sm:w-64">
          <Select value={actionFilter} onValueChange={handleActionChange}>
            <SelectTrigger className="bg-card h-full min-h-[48px]">
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

      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
              <tr>
                <th className="px-6 py-4 font-medium">Date & Heure</th>
                <th className="px-6 py-4 font-medium">Utilisateur</th>
                <th className="px-6 py-4 font-medium">Action</th>
                <th className="px-6 py-4 font-medium">Détails</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array(10)
                  .fill(0)
                  .map((_, i) => (
                    <tr key={i} className="border-b">
                      <td className="px-6 py-4">
                        <Skeleton className="h-5 w-32" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-5 w-32" />
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
                  <tr key={log.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="px-6 py-4 font-medium">{log.userFullName || "Système"}</td>
                    <td className="px-6 py-4">
                      <span className="bg-muted px-2 py-1 rounded text-xs font-mono">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {log.entityType} #{log.entityId}
                      {log.details && (
                        <div className="text-xs mt-1 italic">{log.details}</div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12">
                    <Empty>
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <FileX />
                        </EmptyMedia>
                        <EmptyTitle>Aucun journal trouvé</EmptyTitle>
                        <EmptyDescription>
                          {userFilter || actionFilter !== "all"
                            ? "Modifiez vos filtres pour afficher les journaux."
                            : "Aucune activité enregistrée pour le moment."}
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/20">
            <span className="text-sm text-muted-foreground">
              {filtered.length} résultats — page {safePage} / {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
              >
                <ChevronLeft className="w-4 h-4" />
                Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
              >
                Suivant
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
