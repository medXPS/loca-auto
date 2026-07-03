import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale/fr";
import {
  ArrowRight,
  Bell,
  CheckCheck,
  Clock3,
  Loader2,
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

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

export function NotificationsPopover({
  basePath,
  isDark = false,
}: {
  basePath: "/admin" | "/agent";
  isDark?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

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

  const previewNotifications = sortedNotifications.slice(0, 6);

  const handleOpenNotification = async (notification: Notification) => {
    const requestId = extractRequestId(notification);

    try {
      if (!notification.read) {
        await markOneRead.mutateAsync({ id: notification.id });
      }
    } finally {
      setOpen(false);
    }

    if (requestId) {
      setLocation(`${basePath}/demandes/${requestId}`);
    }
  };

  const handleMarkAll = async () => {
    await markAllRead.mutateAsync();
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant={isDark ? "outline" : "ghost"}
          size="icon"
          className="relative"
          aria-label={
            unreadCount > 0
              ? `Notifications, ${unreadCount} non lues`
              : "Notifications"
          }
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 ? (
            <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-destructive-foreground shadow-sm">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={10}
        className="w-[calc(100vw-1rem)] max-w-[26rem] overflow-hidden p-0"
      >
        <div className="border-b bg-card px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Notifications</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {unreadCount > 0
                  ? `${unreadCount} alertes à traiter`
                  : "Aucune alerte non lue"}
              </p>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={handleMarkAll}
              disabled={unreadCount === 0 || markAllRead.isPending}
            >
              {markAllRead.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCheck className="h-4 w-4" />
              )}
              Tout lire
            </Button>
          </div>
        </div>

        <div className="max-h-[24rem] overflow-y-auto">
          {notificationsQuery.isLoading ? (
            <div className="space-y-2 p-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="rounded-2xl border p-3">
                  <div className="mb-2 h-4 w-3/5 animate-pulse rounded bg-muted" />
                  <div className="mb-3 h-3 w-full animate-pulse rounded bg-muted/70" />
                  <div className="h-3 w-1/3 animate-pulse rounded bg-muted/60" />
                </div>
              ))}
            </div>
          ) : previewNotifications.length > 0 ? (
            <div className="divide-y">
              {previewNotifications.map((notification) => {
                const requestId = extractRequestId(notification);

                return (
                  <button
                    key={notification.id}
                    type="button"
                    className={cn(
                      "flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60",
                      notification.read ? "bg-background" : "bg-primary/5",
                    )}
                    onClick={() => void handleOpenNotification(notification)}
                    disabled={markOneRead.isPending}
                  >
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Bell className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {notification.title}
                        </p>
                        {!notification.read ? (
                          <span className="h-2 w-2 rounded-full bg-primary" />
                        ) : null}
                      </div>

                      <p className="max-h-12 overflow-hidden text-sm leading-6 text-muted-foreground">
                        {notification.message}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <Clock3 className="h-3.5 w-3.5" />
                        <span>{formatNotificationTime(notification.createdAt)}</span>
                        {requestId ? (
                          <Badge variant="secondary">Demande #{requestId}</Badge>
                        ) : null}
                      </div>
                    </div>

                    <ArrowRight className="mt-2 h-4 w-4 shrink-0 text-muted-foreground" />
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Aucune notification
                </p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Les alertes importantes apparaîtront ici.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="border-t bg-card p-3">
          <Button
            asChild
            variant="outline"
            className="w-full justify-center gap-2"
            onClick={() => setOpen(false)}
          >
            <Link href={`${basePath}/notifications`}>
              Voir toutes les notifications
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
