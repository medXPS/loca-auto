import { useEffect } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  getGetAgentQueryKey,
  getListAgentsQueryKey,
  useGetAgent,
  useUpdateAgent,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Mail, Shield, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const agentSchema = z.object({
  fullName: z.string().trim().min(2, "Nom requis"),
  phone: z.string().trim().min(10, "Telephone requis"),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

type AgentFormValues = z.infer<typeof agentSchema>;

function formatStatusLabel(status?: string) {
  return status === "ACTIVE" ? "Actif" : "Inactif";
}

export default function AdminEditAgent() {
  const [, params] = useRoute("/admin/agents/:id");
  const agentId = Number(params?.id ?? 0);
  const resolvedAgentId = Number.isFinite(agentId) ? agentId : 0;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const updateAgent = useUpdateAgent();

  const { data: agent, isLoading } = useGetAgent(resolvedAgentId, {
    query: {
      enabled: resolvedAgentId > 0,
      queryKey: getGetAgentQueryKey(resolvedAgentId),
    },
  });

  const form = useForm<AgentFormValues>({
    resolver: zodResolver(agentSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      status: "ACTIVE",
    },
  });

  useEffect(() => {
    if (!agent) return;

    form.reset({
      fullName: agent.user.fullName,
      phone: agent.user.phone,
      status: agent.user.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
    });
  }, [agent, form]);

  const onSubmit = (values: AgentFormValues) => {
    if (!agent) return;

    updateAgent.mutate(
      { id: agent.id, data: values },
      {
        onSuccess: () => {
          toast({ title: "Agent mis a jour" });
          queryClient.invalidateQueries({ queryKey: getListAgentsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetAgentQueryKey(agent.id) });
          setLocation("/admin/agents");
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

  if (isLoading) {
    return (
      <div className="p-6">
        <Skeleton className="mx-auto h-[520px] w-full max-w-3xl rounded-2xl" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-6 text-center">
        <p className="text-muted-foreground">Agent introuvable.</p>
        <Button asChild variant="outline">
          <Link href="/admin/agents">Retour a la liste</Link>
        </Button>
      </div>
    );
  }

  const isActive = agent.user.status === "ACTIVE";

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/admin/agents">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">Modifier l'agent</h1>
            <Badge variant={isActive ? "secondary" : "outline"}>
              {formatStatusLabel(agent.user.status)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Mettez a jour le nom, le telephone et le statut du compte.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b bg-muted/20">
          <CardTitle>Informations du compte</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border bg-background p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                Nom
              </div>
              <p className="mt-2 font-medium">{agent.user.fullName}</p>
            </div>
            <div className="rounded-2xl border bg-background p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                Email
              </div>
              <p className="mt-2 truncate font-medium">{agent.user.email}</p>
            </div>
            <div className="rounded-2xl border bg-background p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                Statut
              </div>
              <p className="mt-2 font-medium">{formatStatusLabel(agent.user.status)}</p>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom complet</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Hassan Agent" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telephone</FormLabel>
                      <FormControl>
                        <Input placeholder="+212 6..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Statut du compte</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choisir un statut" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ACTIVE">Actif</SelectItem>
                          <SelectItem value="INACTIVE">Inactif</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex flex-col-reverse justify-end gap-3 border-t pt-6 sm:flex-row">
                <Button asChild variant="outline">
                  <Link href="/admin/agents">Annuler</Link>
                </Button>
                <Button type="submit" disabled={updateAgent.isPending}>
                  {updateAgent.isPending ? "Mise a jour..." : "Enregistrer les modifications"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
