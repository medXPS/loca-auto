import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetDashboardStats, useGetRecentRequests } from "@workspace/api-client-react";
import { formatPrice, formatDateTime } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { Users, Car, CreditCard, Banknote, CalendarClock, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function AdminDashboard() {
  const { data: stats, isLoading: isStatsLoading } = useGetDashboardStats();
  const { data: recentRequests, isLoading: isRecentLoading } = useGetRecentRequests({ limit: 5 });

  const PIE_COLORS = ['#157550', '#215025', '#409050', '#174045', '#340545'];

  if (isStatsLoading) {
    return <div className="p-6 space-y-6">
      <Skeleton className="h-10 w-48 mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
      </div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Tableau de bord</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground">Revenu total</p>
              <div className="p-2 bg-primary/10 rounded-full text-primary">
                <Banknote className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold">{formatPrice(stats?.totalRevenue || 0)}</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground">Bénéfice net</p>
              <div className="p-2 bg-emerald-500/10 rounded-full text-emerald-500">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold">{formatPrice(stats?.netProfit || 0)}</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground">Demandes actives</p>
              <div className="p-2 bg-amber-500/10 rounded-full text-amber-500">
                <CalendarClock className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold">{stats?.pendingRequests || 0}</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground">Flotte disponible</p>
              <div className="p-2 bg-blue-500/10 rounded-full text-blue-500">
                <Car className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold">{stats?.availableCars || 0}</h3>
              <p className="text-sm text-muted-foreground">/ {(stats?.availableCars || 0) + (stats?.rentedCars || 0) + (stats?.maintenanceCars || 0)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Charts area - placeholder for now */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Aperçu des revenus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center border border-dashed rounded-lg bg-muted/20 text-muted-foreground">
              Graphique des revenus (Recharts)
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statut des demandes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center border border-dashed rounded-lg bg-muted/20 text-muted-foreground">
              Graphique en secteurs
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent requests */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Dernières demandes</CardTitle>
          <Link href="/admin/demandes" className="text-sm text-primary hover:underline">
            Voir tout
          </Link>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium rounded-tl-lg">Client</th>
                  <th className="px-4 py-3 font-medium">Véhicule</th>
                  <th className="px-4 py-3 font-medium">Dates</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium rounded-tr-lg">Statut</th>
                </tr>
              </thead>
              <tbody>
                {isRecentLoading ? (
                  <tr><td colSpan={5} className="p-4 text-center">Chargement...</td></tr>
                ) : recentRequests && recentRequests.length > 0 ? (
                  recentRequests.map((req) => (
                    <tr key={req.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">
                        <Link href={`/admin/demandes/${req.id}`} className="hover:text-primary hover:underline">
                          {req.fullName}
                        </Link>
                        <div className="text-xs text-muted-foreground">{req.phone}</div>
                      </td>
                      <td className="px-4 py-3">{req.car?.brand} {req.car?.model}</td>
                      <td className="px-4 py-3">
                        {new Date(req.startDate).toLocaleDateString("fr-MA")} - {new Date(req.returnDate).toLocaleDateString("fr-MA")}
                      </td>
                      <td className="px-4 py-3 font-medium">{formatPrice(req.finalPrice || req.estimatedTotalPrice)}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={req.status} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">Aucune demande récente</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
