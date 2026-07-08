import { useQueryClient } from "@tanstack/react-query";
import {
  getListAgentsQueryKey,
  useDeleteAgent,
  useListAgents,
} from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Plus, Trash2, Users } from "lucide-react";
import { Link } from "wouter";

type AgentCardModel = {
  id: number;
  createdAt?: string;
  status: string;
  user: {
    fullName: string;
    email: string;
    phone: string;
    status: string;
  };
};

function getInitials(fullName: string) {
  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase() || "AG";
}

function formatStatusLabel(status?: string) {
  return status === "ACTIVE" ? "Actif" : "Inactif";
}

function formatDateLabel(value?: string) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("fr-MA");
}

function AgentCard({ agent }: { agent: AgentCardModel }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const deleteAgent = useDeleteAgent();

  const handleDelete = () => {
    deleteAgent.mutate(
      { id: agent.id },
      {
        onSuccess: () => {
          toast({ title: "Agent supprime" });
          queryClient.invalidateQueries({ queryKey: getListAgentsQueryKey() });
        },
        onError: (error: any) => {
          toast({
            title: "Erreur",
            description: error.message,
            variant: "destructive",
          });
        },
      },
    );
  };

  const isActive = agent.user.status === "ACTIVE";

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-900 to-slate-600 text-sm font-semibold text-white">
            {getInitials(agent.user.fullName)}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold text-foreground">
              {agent.user.fullName}
            </h3>
            <p className="truncate text-sm text-muted-foreground">
              {agent.user.email}
            </p>
            <p className="truncate text-sm text-muted-foreground">
              {agent.user.phone}
            </p>
          </div>
        </div>
        <Badge variant={isActive ? "secondary" : "outline"}>
          {formatStatusLabel(agent.user.status)}
        </Badge>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t pt-4">
        <p className="text-xs text-muted-foreground">
          Cree le {formatDateLabel(agent.createdAt)}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link href={`/admin/agents/${agent.id}`}>
              <Pencil className="h-4 w-4" />
              Modifier
            </Link>
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                className="gap-2"
                disabled={deleteAgent.isPending}
              >
                <Trash2 className="h-4 w-4" />
                Supprimer
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer cet agent ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Ce compte sera desactive et ne pourra plus se connecter.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={handleDelete}
                  disabled={deleteAgent.isPending}
                >
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}

export default function AdminAgents() {
  const { data: agents, isLoading } = useListAgents();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-bold tracking-tight">
          Gestion des agents
        </h1>
        <Button asChild className="gap-2">
          <Link href="/admin/agents/nouveau">
            <Plus className="h-4 w-4" />
            Nouvel agent
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-48 w-full rounded-2xl" />
          ))
        ) : agents && agents.length > 0 ? (
          (agents as AgentCardModel[]).map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))
        ) : (
          <div className="col-span-full">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Users />
                </EmptyMedia>
                <EmptyTitle>Aucun agent trouve</EmptyTitle>
                <EmptyDescription>
                  Ajoutez un agent pour lui donner acces au tableau de bord.
                </EmptyDescription>
              </EmptyHeader>
              <Button asChild size="sm" className="gap-2">
                <Link href="/admin/agents/nouveau">
                  <Plus className="h-4 w-4" />
                  Ajouter un agent
                </Link>
              </Button>
            </Empty>
          </div>
        )}
      </div>
    </div>
  );
}
