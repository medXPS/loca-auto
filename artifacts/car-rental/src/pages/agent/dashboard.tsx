import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useListCars, useListCustomers, useListRentalRequests } from "@workspace/api-client-react";
import { StatusBadge } from "@/components/status-badge";
import { formatPrice } from "@/lib/utils";
import { CalendarDays, Car, ClipboardList, Users, BookOpen, ArrowRight, PhoneCall, BadgeCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { type ComponentType } from "react";

function StatCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="border-white/10 bg-white/5 text-slate-100 shadow-none backdrop-blur">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{title}</p>
            <div className="mt-2 text-3xl font-semibold tracking-tight">{value}</div>
            <p className="mt-2 text-sm text-slate-400">{description}</p>
          </div>
          <div className="rounded-2xl bg-primary/15 p-3 text-primary">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AgentDashboard() {
  const { data: requestsData, isLoading: isRequestsLoading } = useListRentalRequests({ limit: 100 });
  const { data: carsData, isLoading: isCarsLoading } = useListCars({ limit: 100 });
  const { data: customersData, isLoading: isCustomersLoading } = useListCustomers({ limit: 100 });

  const requests = requestsData?.requests ?? [];
  const cars = carsData?.cars ?? [];
  const customers = customersData?.customers ?? [];

  const pendingRequests = requests.filter((request) => ["PENDING", "UNDER_REVIEW", "CALL_ATTEMPTED"].includes(request.status));
  const callConfirmedRequests = requests.filter((request) => ["CALL_CONFIRMED", "WAITING_AGENCY_PAYMENT"].includes(request.status));
  const activeRentals = requests.filter((request) => ["RESERVED", "CAR_DELIVERED", "RENTED"].includes(request.status));
  const availableCars = cars.filter((car) => car.status === "AVAILABLE");
  const urgentRequests = [...pendingRequests, ...callConfirmedRequests].slice(0, 6);

  if (isRequestsLoading || isCarsLoading || isCustomersLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-3xl bg-white/10" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-3xl bg-white/10" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(17,89,183,0.30),transparent_45%),linear-gradient(135deg,rgba(9,13,25,0.96),rgba(15,23,42,0.98))] px-6 py-8 shadow-[0_24px_70px_-30px_rgba(15,23,42,0.65)] md:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-slate-300">
              <BadgeCheck className="h-3.5 w-3.5 text-primary" />
              Espace agent
            </div>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white md:text-5xl">
              Pilotez les réservations sans friction.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">
              Accédez rapidement aux demandes urgentes, aux véhicules disponibles, aux clients et au calendrier opérationnel.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/agent/calendrier">
              <Button className="gap-2 rounded-full bg-primary text-primary-foreground">
                <CalendarDays className="h-4 w-4" />
                Calendrier
              </Button>
            </Link>
            <Link href="/agent/demandes">
              <Button variant="outline" className="gap-2 rounded-full border-white/10 bg-white/5 text-slate-100 hover:bg-white/10">
                <ClipboardList className="h-4 w-4" />
                Réservations
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Demandes en attente" value={pendingRequests.length} description="À appeler ou à qualifier en priorité." icon={PhoneCall} />
        <StatCard title="Appels confirmés" value={callConfirmedRequests.length} description="Clients ayant 12h pour se présenter." icon={BadgeCheck} />
        <StatCard title="Locations actives" value={activeRentals.length} description="Réservations validées ou en cours." icon={Car} />
        <StatCard title="Véhicules disponibles" value={availableCars.length} description={`Sur ${cars.length} véhicules au total.`} icon={Car} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="border-white/10 bg-white/5 text-slate-100 shadow-none backdrop-blur">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-white">Demandes prioritaires</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-6">
            {urgentRequests.length > 0 ? (
              urgentRequests.map((request) => (
                <div key={request.id} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-white">#{request.id}</span>
                      <StatusBadge status={request.status} />
                    </div>
                    <p className="mt-1 text-sm text-slate-300">
                      {request.fullName} • {request.phone}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {new Date(request.startDate).toLocaleDateString("fr-MA")} - {new Date(request.returnDate).toLocaleDateString("fr-MA")}
                    </p>
                  </div>
                  <div className="text-sm font-medium text-slate-100">
                    {formatPrice(request.finalPrice || request.estimatedTotalPrice)}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">Aucune demande prioritaire pour le moment.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 text-slate-100 shadow-none backdrop-blur">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-white">Raccourcis utiles</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 p-6">
            <Link href="/agent/voitures">
              <Button variant="outline" className="w-full justify-between border-white/10 bg-white/5 text-slate-100 hover:bg-white/10">
                Gérer les véhicules
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/agent/clients">
              <Button variant="outline" className="w-full justify-between border-white/10 bg-white/5 text-slate-100 hover:bg-white/10">
                Rechercher un client
                <Users className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/agent/blog">
              <Button variant="outline" className="w-full justify-between border-white/10 bg-white/5 text-slate-100 hover:bg-white/10">
                Publier un article
                <BookOpen className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/agent/demandes">
              <Button variant="outline" className="w-full justify-between border-white/10 bg-white/5 text-slate-100 hover:bg-white/10">
                Suivre les demandes
                <ClipboardList className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card className="border-white/10 bg-white/5 text-slate-100 shadow-none backdrop-blur">
        <CardHeader className="border-b border-white/10">
          <CardTitle className="text-white">Vue rapide clients et flotte</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3 p-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Clients</p>
            <p className="mt-2 text-2xl font-semibold">{customers.length}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Véhicules en entretien</p>
            <p className="mt-2 text-2xl font-semibold">{cars.filter((car) => car.status === "MAINTENANCE").length}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Réservations aujourd'hui</p>
            <p className="mt-2 text-2xl font-semibold">
              {requests.filter((request) => new Date(request.startDate).toDateString() === new Date().toDateString()).length}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
