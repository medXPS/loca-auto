import { useMemo, useState } from "react";
import { useLocation, Link } from "wouter";
import FullCalendar from "@fullcalendar/react";
import "@/styles/fullcalendar.css";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import type { EventInput } from "@fullcalendar/core";
import { customFetch, useListCars, useListRentalRequests } from "@workspace/api-client-react";
import { addMinutes } from "@workspace/api-client-react/availability";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/status-badge";
import { cn } from "@/lib/utils";
import { CalendarDays, CarFront, Filter, RefreshCw, CalendarRange } from "lucide-react";

type CalendarEvent = EventInput & {
  extendedProps?: {
    requestId: number;
    status: string;
    carId: number;
    carLabel: string;
    clientName: string;
    agentId?: number | null;
    agentLabel?: string | null;
    amount: number;
  };
};

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: "#16A34A",
  DOCUMENT_SUBMISSION_WINDOW: "#F59E0B",
  PENDING_CALL_CONFIRMATION: "#0EA5E9",
  PENDING: "#EF4444",
  UNDER_REVIEW: "#DC2626",
  CALL_ATTEMPTED: "#B91C1C",
  CALL_CONFIRMED: "#1F2937",
  EXTENDED_PAYMENT_DEADLINE: "#6366F1",
  WAITING_AGENCY_PAYMENT: "#374151",
  RESERVED: "#111827",
  PAID: "#047857",
  ACTIVE_RENTAL: "#047857",
  CAR_DELIVERED: "#4B5563",
  RENTED: "#1F2937",
  CAR_RETURNED: "#374151",
  RETURNED: "#111827",
  COMPLETED: "#000000",
  ABANDONED: "#7F1D1D",
  CANCELLED: "#991B1B",
  REJECTED: "#B91C1C",
};

function getEventStart(request: any) {
  return request.startAt || `${request.startDate}T09:00:00`;
}

function getEventEnd(request: any) {
  const returnAt = request.returnAt ? new Date(request.returnAt) : new Date(`${request.returnDate}T18:00:00`);
  return addMinutes(returnAt, 60).toISOString();
}

function getVisualStatus(request: any) {
  if (request.status === "PAID" || request.status === "ACTIVE_RENTAL") return "ACTIVE_RENTAL";
  return request.status;
}

export default function AdminCalendarPage() {
  const [location, setLocation] = useLocation();
  const isAgentMode = location.startsWith("/agent");
  const basePath = isAgentMode ? "/agent" : "/admin";

  const [carFilter, setCarFilter] = useState("all");
  const [agentFilter, setAgentFilter] = useState("all");

  const { data: requestsData, isLoading: isRequestsLoading, refetch } = useListRentalRequests({ limit: 200 });
  const { data: carsData, isLoading: isCarsLoading } = useListCars({ limit: 200 });

  const requests = (requestsData?.requests ?? []) as any[];
  const cars = carsData?.cars ?? [];

  const eventSource = useMemo(() => {
    return requests
      .filter((request) => carFilter === "all" || String(request.carId) === carFilter)
      .filter((request) => {
        if (agentFilter === "all") return true;
        const handledBy = request.paymentConfirmedBy ?? request.callConfirmedBy;
        return handledBy ? String(handledBy) === agentFilter : false;
      })
      .map<CalendarEvent>((request) => {
        const visualStatus = getVisualStatus(request);
        const color = STATUS_COLORS[visualStatus] ?? "#1F2937";
        const carLabel = request.car ? `${request.car.brand} ${request.car.model}` : `Véhicule #${request.carId}`;
        const amount = Number(request.finalPrice || request.estimatedTotalPrice || 0);
        const handledBy = request.paymentConfirmedBy ?? request.callConfirmedBy;
        return {
          id: String(request.id),
          title: `${carLabel} • ${request.fullName}`,
          start: getEventStart(request),
          end: getEventEnd(request),
          allDay: false,
          backgroundColor: color,
          borderColor: color,
          textColor: "#ffffff",
          extendedProps: {
            requestId: request.id,
            status: visualStatus,
            carId: request.carId,
            carLabel,
            clientName: request.fullName,
            agentId: handledBy ?? null,
            agentLabel: handledBy ? `Agent #${handledBy}` : null,
            amount,
          },
        };
      });
  }, [agentFilter, carFilter, requests]);

  const unavailableCars = useMemo(() => {
    const activeCarIds = new Set(
      requests
        .filter((request) => ["DOCUMENT_SUBMISSION_WINDOW", "PENDING_CALL_CONFIRMATION", "CALL_CONFIRMED", "EXTENDED_PAYMENT_DEADLINE", "WAITING_AGENCY_PAYMENT", "PAID", "ACTIVE_RENTAL", "RESERVED", "CAR_DELIVERED", "RENTED"].includes(request.status))
        .map((request) => request.carId),
    );
    return cars.filter((car) => car.status !== "AVAILABLE" || activeCarIds.has(car.id));
  }, [cars, requests]);

  const agentOptions = useMemo(() => {
    const ids = new Set<number>();
    requests.forEach((request) => {
      if (request.callConfirmedBy) ids.add(request.callConfirmedBy);
      if (request.paymentConfirmedBy) ids.add(request.paymentConfirmedBy);
    });
    return Array.from(ids).sort((a, b) => a - b);
  }, [requests]);

  const updateDates = async (requestId: number, start: Date, end: Date) => {
    const returnAt = new Date(end.getTime() - 60 * 60 * 1000);
    await customFetch(`/api/rental-requests/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startDate: start.toISOString().slice(0, 10),
        returnDate: returnAt.toISOString().slice(0, 10),
        startAt: start.toISOString(),
        returnAt: returnAt.toISOString(),
      }),
    });

    await refetch();
  };

  const handleEventDrop = async (info: any) => {
    const requestId = Number(info.event.id);
    try {
      await updateDates(requestId, info.event.start!, info.event.end!);
    } catch {
      info.revert();
    }
  };

  const handleEventResize = async (info: any) => {
    const requestId = Number(info.event.id);
    try {
      await updateDates(requestId, info.event.start!, info.event.end!);
    } catch {
      info.revert();
    }
  };

  const handleEventClick = (info: any) => {
    const requestId = info.event.extendedProps.requestId as number;
    setLocation(`${basePath}/demandes/${requestId}`);
  };

  if (isRequestsLoading || isCarsLoading) {
    return <Skeleton className="h-[70vh] w-full rounded-3xl bg-muted/60" />;
  }

  return (
    <div className="space-y-6 text-foreground">
      <section
        className={cn(
          "overflow-hidden rounded-[2rem] border px-5 py-7 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.22)] sm:px-6",
          isAgentMode ? "border-border bg-card text-card-foreground" : "border-border bg-background",
        )}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-primary">
              <CalendarRange className="h-3.5 w-3.5" />
              Calendrier opérationnel
            </div>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl md:text-4xl">
              Vue calendrier des réservations
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
              Passez rapidement de la vue jour à la vue mois, filtrez par véhicule ou par agent, puis déplacez une réservation pour ajuster ses dates.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button variant="outline" className="gap-2 rounded-full" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
              Actualiser
            </Button>
            <Link href={`${basePath}/demandes`}>
              <Button className="gap-2 rounded-full">
                <CalendarDays className="h-4 w-4" />
                Demandes
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[1fr_0.55fr]">
        <Card className={cn("border", isAgentMode ? "border-border bg-card text-card-foreground" : "bg-background")}>
          <CardHeader className="flex flex-col gap-4 border-b border-border sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Filter className="h-5 w-5 text-primary" />
              Filtres
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-3">
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Véhicule</p>
              <Select value={carFilter} onValueChange={setCarFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les véhicules" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les véhicules</SelectItem>
                  {cars.map((car) => (
                    <SelectItem key={car.id} value={String(car.id)}>
                      {car.brand} {car.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Agent</p>
              <Select value={agentFilter} onValueChange={setAgentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les agents" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les agents</SelectItem>
                  {agentOptions.map((agentId) => (
                    <SelectItem key={agentId} value={String(agentId)}>
                      Agent #{agentId}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Légende</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Documents 30min</Badge>
                <Badge variant="outline">Appel a confirmer</Badge>
                <Badge variant="outline">Paiement 24h</Badge>
                <Badge variant="outline">Délai prolongé</Badge>
                <Badge variant="outline">Location active</Badge>
                <Badge variant="outline">Abandonnee</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={cn("border", isAgentMode ? "border-border bg-card text-card-foreground" : "bg-background")}>
          <CardHeader className="border-b border-border">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <CarFront className="h-5 w-5 text-primary" />
              Véhicules indisponibles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-6">
            {unavailableCars.length > 0 ? (
              unavailableCars.slice(0, 6).map((car) => (
                <div key={car.id} className="flex items-center justify-between rounded-2xl border border-border bg-muted/40 px-4 py-3">
                  <div>
                    <p className="font-medium text-foreground">
                      {car.brand} {car.model}
                    </p>
                    <p className="text-xs text-muted-foreground">{car.city || "Ville non renseignée"}</p>
                  </div>
                  <StatusBadge status={car.status} type="car" />
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Tous les véhicules sont disponibles sur la période actuelle.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className={cn("overflow-hidden", isAgentMode ? "border-border bg-card text-card-foreground" : "bg-background")}>
        <CardContent className="p-4 md:p-6">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
            }}
            height="auto"
            nowIndicator
            editable
            selectable={false}
            eventStartEditable
            eventDurationEditable
            eventDrop={handleEventDrop}
            eventResize={handleEventResize}
            eventClick={handleEventClick}
            events={eventSource}
            eventDisplay="block"
            dayMaxEvents
            slotMinTime="07:00:00"
            slotMaxTime="22:00:00"
            firstDay={1}
          />
        </CardContent>
      </Card>
    </div>
  );
}
