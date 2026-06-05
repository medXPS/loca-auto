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
  X
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const links = [
    { href: "/admin", label: "Tableau de bord", icon: LayoutDashboard },
    { href: "/admin/voitures", label: "Voitures", icon: Car },
    { href: "/admin/demandes", label: "Demandes", icon: FileText },
    { href: "/admin/clients", label: "Clients", icon: Users },
    { href: "/admin/agents", label: "Agents", icon: UserCircle },
    { href: "/admin/charges", label: "Charges", icon: Receipt },
    { href: "/admin/blog", label: "Blog", icon: BookOpen },
    { href: "/admin/parametres", label: "Paramètres", icon: Settings },
    { href: "/admin/audit", label: "Audit", icon: History },
  ];

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Mobile sidebar backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden" 
          onClick={() => setIsSidebarOpen(false)} 
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 md:sticky md:top-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-16 flex items-center justify-between px-6 border-b">
          <Link href="/admin" className="font-serif font-bold text-xl text-primary">
            Admin
          </Link>
          <button className="md:hidden" onClick={() => setIsSidebarOpen(false)}>
            <X className="w-5 h-5 text-sidebar-foreground" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-3">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location === link.href || location.startsWith(link.href + "/");
              return (
                <Link key={link.href} href={link.href}>
                  <span className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}>
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t">
          <Button variant="outline" className="w-full justify-start gap-2" onClick={logout}>
            <LogOut className="w-4 h-4" />
            Déconnexion
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b bg-background flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
          <button className="md:hidden p-2 -ml-2" onClick={() => setIsSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4 ml-auto">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full"></span>
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                {user?.fullName.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium hidden sm:inline-block">{user?.fullName}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
