import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Car,
  FileText,
  Users,
  UserCircle,
  Receipt,
  BookOpen,
  Settings,
  History,
  LogOut,
  Bell,
  Menu,
  X,
  CalendarDays,
  Shield,
} from "lucide-react";
import { useMemo, useState, type ComponentType } from "react";
import { cn } from "@/lib/utils";

type NavLink = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const isAgentMode = location.startsWith("/agent") || user?.role === "AGENT";
  const basePath = isAgentMode ? "/agent" : "/admin";

  const links = useMemo<NavLink[]>(() => {
    if (isAgentMode) {
      return [
        { href: `${basePath}`, label: "Vue d'ensemble", icon: LayoutDashboard },
        { href: `${basePath}/calendrier`, label: "Calendrier", icon: CalendarDays },
        { href: `${basePath}/voitures`, label: "Véhicules", icon: Car },
        { href: `${basePath}/demandes`, label: "Réservations", icon: FileText },
        { href: `${basePath}/clients`, label: "Clients", icon: Users },
        { href: `${basePath}/blog`, label: "Blog", icon: BookOpen },
      ];
    }

    return [
      { href: `${basePath}`, label: "Dashboard BI", icon: LayoutDashboard },
      { href: `${basePath}/calendrier`, label: "Calendrier", icon: CalendarDays },
      { href: `${basePath}/voitures`, label: "Véhicules", icon: Car },
      { href: `${basePath}/demandes`, label: "Réservations", icon: FileText },
      { href: `${basePath}/clients`, label: "Clients", icon: Users },
      { href: `${basePath}/agents`, label: "Agents", icon: UserCircle },
      { href: `${basePath}/charges`, label: "Charges", icon: Receipt },
      { href: `${basePath}/blog`, label: "Blog", icon: BookOpen },
      { href: `${basePath}/parametres`, label: "Paramètres", icon: Settings },
      { href: `${basePath}/audit`, label: "Audit", icon: History },
    ];
  }, [basePath, isAgentMode]);

  const title = isAgentMode ? "Espace agent" : "Centre admin";
  const subtitle = isAgentMode ? "Opérations, calendrier et suivi des réservations." : "Pilotage financier, flotte et gouvernance.";

  return (
    <div className={cn("min-h-screen flex", isAgentMode ? "bg-slate-950 text-slate-100" : "bg-muted/30")}>
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 border-r flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 md:sticky md:top-0",
          isAgentMode ? "bg-slate-950 border-white/10 text-slate-100" : "bg-sidebar border-border md:bg-sidebar",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="px-6 py-5 border-b border-white/10">
          <div className="flex items-center justify-between gap-3">
            <Link href={basePath} className="flex items-center gap-3">
              <span className={cn("flex h-11 w-11 items-center justify-center rounded-2xl shadow-[0_18px_35px_-24px_hsl(var(--primary)/0.55)]", isAgentMode ? "bg-primary text-primary-foreground" : "bg-primary text-primary-foreground")}>
                <Shield className="h-5 w-5" />
              </span>
              <div className="leading-tight">
                <span className="block text-lg font-semibold tracking-tight">{title}</span>
                <span className={cn("block text-[0.68rem] uppercase tracking-[0.24em]", isAgentMode ? "text-slate-400" : "text-muted-foreground")}>
                  {isAgentMode ? "Agent" : "Administrateur"}
                </span>
              </div>
            </Link>
            <button className="md:hidden" onClick={() => setIsSidebarOpen(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className={cn("mt-4 text-sm leading-6", isAgentMode ? "text-slate-400" : "text-muted-foreground")}>{subtitle}</p>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-3">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location === link.href || location.startsWith(link.href + "/");
              return (
                <Link key={link.href} href={link.href}>
                  <span
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors",
                      isAgentMode
                        ? isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-slate-300 hover:bg-white/8 hover:text-white"
                        : isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-white/10">
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start gap-2",
              isAgentMode ? "border-white/10 bg-white/5 text-slate-100 hover:bg-white/10" : "bg-background",
            )}
            onClick={logout}
          >
            <LogOut className="w-4 h-4" />
            Déconnexion
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header
          className={cn(
            "h-16 border-b flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 backdrop-blur",
            isAgentMode ? "border-white/10 bg-slate-950/80 text-slate-100" : "bg-background",
          )}
        >
          <button className="md:hidden p-2 -ml-2" onClick={() => setIsSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4 ml-auto">
            <Button variant={isAgentMode ? "outline" : "ghost"} size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full"></span>
            </Button>
              <div className="flex items-center gap-2">
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm", isAgentMode ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary")}>
                {user?.fullName?.charAt(0).toUpperCase() || "U"}
              </div>
              <span className="text-sm font-medium hidden sm:inline-block">{user?.fullName}</span>
            </div>
          </div>
        </header>

        <main className={cn("flex-1 p-4 sm:p-6 overflow-y-auto", isAgentMode && "bg-slate-950 text-slate-100")}>
          {children}
        </main>
      </div>
    </div>
  );
}
