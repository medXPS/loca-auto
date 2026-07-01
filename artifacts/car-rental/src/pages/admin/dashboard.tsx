import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useGetDashboardStats,
  useGetRecentRequests,
  useGetRevenueChart,
  useGetRequestsByStatus,
} from "@workspace/api-client-react";
import { formatPrice, getStatusLabel } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { ReceiptDownloadButton } from "@/components/receipt-download-button";
import { Car, Banknote, CalendarClock, TrendingUp } from "lucide-react";
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
  Legend,
} from "recharts";

const REQUEST_STATUS_COLORS: Record<string, string> = {
  PENDING: "#F59E0B",
  UNDER_REVIEW: "#14B8A6",
  CALL_ATTEMPTED: "#F97316",
  CALL_CONFIRMED: "#3B82F6",
  WAITING_AGENCY_PAYMENT: "#8B5CF6",
  WAITING_DOCUMENTS: "#EC4899",
  RESERVED: "#06B6D4",
  PAID: "#10B981",
  ACTIVE_RENTAL: "#22C55E",
  CAR_DELIVERED: "#6366F1",
  CAR_RETURNED: "#0EA5E9",
  RETURNED: "#64748B",
  COMPLETED: "#84CC16",
  REJECTED: "#EF4444",
  CANCELLED: "#9CA3AF",
  ABANDONED: "#DB2777",
};

const DEFAULT_STATUS_COLORS = ["#2563EB", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#14B8A6"];

function getRequestStatusColor(status: string, index: number) {
  return REQUEST_STATUS_COLORS[status] ?? DEFAULT_STATUS_COLORS[index % DEFAULT_STATUS_COLORS.length];
}

export default function AdminDashboard() {
  const { data: stats, isLoading: isStatsLoading } = useGetDashboardStats();
  const { data: recentRequests, isLoading: isRecentLoading } = useGetRecentRequests({ limit: 5 });
  const { data: revenueData, isLoading: isRevenueLoading } = useGetRevenueChart();
  const { data: statusData, isLoading: isStatusLoading } = useGetRequestsByStatus();

  if (isStatsLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-48 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
        </div>
      </div>
    );
  }

  const formattedRevenue = (revenueData || []).map((point) => ({
    ...point,
    label: point.month,
  }));

  const formattedStatus = (statusData || []).map((s) => ({
    status: s.status,
    name: s.label && s.label !== s.status ? s.label : getStatusLabel(s.status, "rental"),
    value: s.count,
  }));

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
            <h3 className="text-2xl font-bold">{formatPrice(stats?.totalRevenue || 0)}</h3>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground">Bénéfice net</p>
              <div className="p-2 bg-primary/10 rounded-full text-primary">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl font-bold">{formatPrice(stats?.netProfit || 0)}</h3>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground">Demandes actives</p>
              <div className="p-2 bg-secondary/30 rounded-full text-secondary-foreground">
                <CalendarClock className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl font-bold">{stats?.pendingRequests || 0}</h3>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground">Flotte disponible</p>
              <div className="p-2 bg-primary/10 rounded-full text-primary">
                <Car className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold">{stats?.availableCars || 0}</h3>
              <p className="text-sm text-muted-foreground">
                /{" "}
                {(stats?.availableCars || 0) +
                  (stats?.rentedCars || 0) +
                  (stats?.maintenanceCars || 0)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Line Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Aperçu des revenus (12 derniers mois)</CardTitle>
          </CardHeader>
          <CardContent>
            {isRevenueLoading ? (
              <Skeleton className="h-[300px] w-full rounded-lg" />
            ) : formattedRevenue.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={formattedRevenue}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value: number) => [formatPrice(value), "Revenus"]}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid hsl(var(--border))",
                      background: "hsl(var(--card))",
                      color: "hsl(var(--foreground))",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Aucune donnée de revenus disponible
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Statut des demandes</CardTitle>
          </CardHeader>
          <CardContent>
            {isStatusLoading ? (
              <Skeleton className="h-[300px] w-full rounded-lg" />
            ) : formattedStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={formattedStatus}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    outerRadius={90}
                    label={false}
                  >
                    {formattedStatus.map((entry, index) => (
                      <Cell key={`cell-${entry.status}-${index}`} fill={getRequestStatusColor(entry.status, index)} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [value, name]}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid hsl(var(--border))",
                      background: "hsl(var(--card))",
                      color: "hsl(var(--foreground))",
                    }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => (
                      <span className="text-xs text-foreground">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Aucune donnée disponible
              </div>
            )}
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
                  <th className="px-4 py-3 font-medium">Statut</th>
                  <th className="px-4 py-3 font-medium rounded-tr-lg">Reçu</th>
                </tr>
              </thead>
              <tbody>
                {isRecentLoading ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center">
                      Chargement...
                    </td>
                  </tr>
                ) : recentRequests && recentRequests.length > 0 ? (
                  recentRequests.map((req) => (
                    <tr key={req.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">
                        <Link
                          href={`/admin/demandes/${req.id}`}
                          className="hover:text-primary hover:underline"
                        >
                          {req.fullName}
                        </Link>
                        <div className="text-xs text-muted-foreground">{req.phone}</div>
                      </td>
                      <td className="px-4 py-3">
                        {req.car?.brand} {req.car?.model}
                      </td>
                      <td className="px-4 py-3">
                        {new Date(req.startDate).toLocaleDateString("fr-MA")} -{" "}
                        {new Date(req.returnDate).toLocaleDateString("fr-MA")}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {formatPrice(req.finalPrice || req.estimatedTotalPrice)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={req.status} />
                      </td>
                      <td className="px-4 py-3">
                        {["RESERVED", "CAR_DELIVERED", "RENTED", "CAR_RETURNED", "RETURNED", "COMPLETED"].includes(req.status) ? (
                          <ReceiptDownloadButton
                            requestId={req.id}
                            filename={`recu-RCPF-${String(req.id).padStart(6, "0")}.pdf`}
                            size="sm"
                            className="w-full justify-center"
                          >
                            PDF
                          </ReceiptDownloadButton>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-muted-foreground">
                      Aucune demande récente
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
