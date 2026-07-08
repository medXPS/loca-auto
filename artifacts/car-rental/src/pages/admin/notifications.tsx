import { Link, useLocation } from "wouter";
import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale/fr";
import {
  ArrowRight,
  Bell,
  CheckCheck,
  Clock3,
  Loader2,
  RefreshCcw,
} from "lucide-react";
import {
  getListNotificationsQueryKey,
  useListNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  type Notification,
} from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function getBasePath(location: string) {
  if (location.startsWith("/dashboard")) return "/dashboard";
  return location.startsWith("/agent") ? "/agent" : "/admin";
}

function extractRequestId(notification: Pick<Notification, "title" | "message">) {
  const text = `${notification.title} ${notification.message}`;
  const match = text.match(/#(\d+)/);
  return match ? Number(match[1]) : null;
}

function formatNotificationTime(value: string) {
  return formatDistanceToNow(new Date(value), {
    addSuffix: true,
    locale: fr,
  });
}

function NotificationRow({
  notification,
  basePath,
  onMarkRead,
  isMarking,
}: {
  notification: Notification;
  basePath: string;
  onMarkRead: (id: number) => void;
  isMarking: boolean;
}) {
  const requestId = extractRequestId(notification);

  return (
    <article
      className={cn(
        "rounded-2xl border p-4 shadow-sm transition-colors sm:p-5",
        notification.read
          ? "border-border bg-card"
          : "border-primary/25 bg-primary/5",
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold tracking-tight text-foreground">
              {notification.title}
            </h3>
            <Badge variant={notification.read ? "outline" : "default"}>
              {notification.read ? "Lue" : "Non lue"}
            </Badge>
            {requestId ? (
              <Badge variant="secondary">Demande #{requestId}</Badge>
            ) : null}
          </div>

          <p className="whitespace-pre-line text-sm leading-7 text-muted-foreground">
            {notification.message}
          </p>

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Clock3 className="h-3.5 w-3.5" />
            <span>{formatNotificationTime(notification.createdAt)}</span>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          {requestId ? (
            <Button asChild variant="outline" size="sm">
              <Link
                href={`${basePath}/demandes/${requestId}`}
                onClick={() => {
                  if (!notification.read) {
                    onMarkRead(notification.id);
                  }
                }}
              >
                Ouvrir
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          ) : null}

          {!notification.read ? (
            <Button
              type="button"
              size="sm"
              onClick={() => onMarkRead(notification.id)}
              disabled={isMarking}
            >
              {isMarking ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Marquer comme lue
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export default function AdminNotificationsPage() {
  const [location] = useLocation();
  const queryClient = useQueryClient();
  const basePath = useMemo(() => getBasePath(location), [location]);

  const notificationsQuery = useListNotifications({
    query: {
      queryKey: getListNotificationsQueryKey(),
      refetchInterval: 60_000,
    },
  });
  const markOneRead = useMarkNotificationRead({
    mutation: {
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: getListNotificationsQueryKey(),
        });
      },
    },
  });
  const markAllRead = useMarkAllNotificationsRead({
    mutation: {
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: getListNotificationsQueryKey(),
        });
      },
    },
  });

  const sortedNotifications = useMemo(() => {
    const list = notificationsQuery.data ?? [];
    return [...list].sort((a, b) => {
      if (a.read !== b.read) {
        return Number(a.read) - Number(b.read);
      }

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [notificationsQuery.data]);

  const unreadCount = useMemo(
    () => sortedNotifications.filter((notification) => !notification.read).length,
    [sortedNotifications],
  );

  const totalCount = sortedNotifications.length;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-border bg-card px-5 py-6 shadow-sm sm:px-6 md:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-primary">
              <Bell className="h-3.5 w-3.5" />
              Flux opérationnel
            </div>

            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Notifications
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-8 text-muted-foreground">
              Les alertes utiles pour les retours, départs, paiements et documents.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <Badge variant="secondary">Total: {totalCount}</Badge>
              <Badge variant={unreadCount > 0 ? "default" : "outline"}>
                Non lues: {unreadCount}
              </Badge>
              <Badge variant="secondary">
                {basePath === "/dashboard"
                  ? "Espace client"
                  : basePath === "/agent"
                    ? "Espace agent"
                    : "Espace admin"}
              </Badge>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={() => notificationsQuery.refetch()}
              disabled={notificationsQuery.isFetching}
            >
              {notificationsQuery.isFetching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCcw className="h-4 w-4" />
              )}
              Rafraîchir
            </Button>

            <Button
              type="button"
              className="gap-2"
              onClick={() => markAllRead.mutate()}
              disabled={unreadCount === 0 || markAllRead.isPending}
            >
              {markAllRead.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCheck className="h-4 w-4" />
              )}
              Tout marquer comme lu
            </Button>
          </div>
        </div>
      </section>

      <Card className="border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-foreground">Dernières notifications</CardTitle>
          <CardDescription>
            Les notifications les plus récentes apparaissent en premier, avec les alertes non lues en haut.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {notificationsQuery.isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-36 w-full rounded-2xl" />
              ))}
            </div>
          ) : sortedNotifications.length > 0 ? (
            <div className="space-y-4">
              {sortedNotifications.map((notification) => (
                <NotificationRow
                  key={notification.id}
                  notification={notification}
                  basePath={basePath}
                  onMarkRead={(id) => markOneRead.mutate({ id })}
                  isMarking={
                    markOneRead.isPending &&
                    markOneRead.variables?.id === notification.id
                  }
                />
              ))}
            </div>
          ) : (
            <div className="flex min-h-[240px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
              <Bell className="h-10 w-10 text-muted-foreground" />
              <h2 className="mt-4 text-lg font-semibold text-foreground">
                Aucune notification
              </h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                Les alertes opérationnelles apparaîtront ici dès qu&apos;une réservation, un retour,
                un paiement ou un document demandera votre attention.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
