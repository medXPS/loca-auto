import { useListAgents } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Plus, UserCheck, Shield, Users } from "lucide-react";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/utils";

export default function AdminAgents() {
  const { data: agents, isLoading } = useListAgents();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Gestion des agents</h1>
        <Link href="/admin/agents/nouveau">
          <Button className="gap-2">
            <Plus className="w-4 h-4" /> Nouvel agent
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)
        ) : agents && agents.length > 0 ? (
          agents.map((agent) => (
            <div key={agent.id} className="bg-card border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl">
                  {agent.user.fullName.charAt(0)}
                </div>
                <div className="bg-primary/10 text-primary text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Agent
                </div>
              </div>
              <h3 className="font-bold text-lg">{agent.user.fullName}</h3>
              <p className="text-muted-foreground text-sm mb-4">{agent.user.email}</p>
              <div className="pt-4 border-t flex justify-between items-center text-sm">
                <div className="flex items-center gap-2 text-emerald-600">
                  <UserCheck className="w-4 h-4" />
                  Actif
                </div>
                <span className="text-muted-foreground text-xs">
                  Créé le {agent.createdAt ? formatDateTime(agent.createdAt).split(' ')[0] : "—"}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon"><Users /></EmptyMedia>
                <EmptyTitle>Aucun agent trouvé</EmptyTitle>
                <EmptyDescription>Ajoutez un agent pour lui donner accès au tableau de bord.</EmptyDescription>
              </EmptyHeader>
              <Link href="/admin/agents/nouveau">
                <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> Ajouter un agent</Button>
              </Link>
            </Empty>
          </div>
        )}
      </div>
    </div>
  );
}
