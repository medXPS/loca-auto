import { useListAuditLogs } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/utils";

export default function AdminAuditLogs() {
  const { data, isLoading } = useListAuditLogs({ limit: 100 });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Journaux d'audit</h1>

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
                Array(10).fill(0).map((_, i) => (
                  <tr key={i} className="border-b">
                    <td className="px-6 py-4"><Skeleton className="h-5 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-48" /></td>
                  </tr>
                ))
              ) : data?.logs && data.logs.length > 0 ? (
                data.logs.map((log) => (
                  <tr key={log.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {log.userFullName || "Système"}
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-muted px-2 py-1 rounded text-xs font-mono">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {log.entityType} #{log.entityId}
                      {log.details && <div className="text-xs mt-1 italic">{log.details}</div>}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                    Aucun journal trouvé
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
