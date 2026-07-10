import { useMemo, useState, type ComponentType, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SiteLogo } from "@/components/site-logo";
import { getListNotificationsQueryKey, useListNotifications } from "@workspace/api-client-react";
import {
  ArrowRight,
  CarFront,
  Bell,
  ChevronDown,
  Facebook,
  House,
  Instagram,
  LogOut,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Music2,
  Newspaper,
  Phone,
  Sparkles,
  UserCircle2,
  X,
  Youtube,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

function getDashboardHref(role?: string) {
  if (role === "ADMIN") return "/admin";
  if (role === "AGENT") return "/agent";
  return "/dashboard";
}

function getInitials(name?: string | null) {
  return (
    name
      ?.trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "U"
  );
}

const navLinks: NavItem[] = [
  { href: "/", label: "Accueil", icon: House },
  { href: "/voitures", label: "Véhicules", icon: CarFront },
  { href: "/a-propos", label: "À propos", icon: Sparkles },
  { href: "/blog", label: "Blog", icon: Newspaper },
  { href: "/contact", label: "Contact", icon: Phone },
];

const socialLinks = [
  { label: "Facebook", href: "https://facebook.com", icon: Facebook },
  { label: "Instagram", href: "https://instagram.com", icon: Instagram },
  { label: "TikTok", href: "https://tiktok.com", icon: Music2 },
  { label: "YouTube", href: "https://youtube.com", icon: Youtube },
];

export function PublicLayout({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const dashboardHref = useMemo(() => getDashboardHref(user?.role), [user?.role]);
  const isCustomer = user?.role === "CUSTOMER";
  const notificationsQuery = useListNotifications({
    query: {
      enabled: isAuthenticated && isCustomer,
      queryKey: getListNotificationsQueryKey(),
      refetchInterval: isAuthenticated && isCustomer ? 60_000 : false,
    },
  });
  const unreadNotifications = (notificationsQuery.data ?? []).filter((notification) => !notification.read).length;
  const unreadNotificationsLabel = unreadNotifications > 99 ? "99+" : `${unreadNotifications}`;
  const isCarDetailPage = /^\/voitures\/\d+/.test(location);
  const isHomePage = location === "/";

  const isActive = (href: string) => {
    if (href === "/") return location === href;
    return location === href || location.startsWith(`${href}/`);
  };

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
  };

  const handleGoTo = (href: string) => {
    setLocation(href);
    setIsMenuOpen(false);
  };

  return (
    <div className={cn("public-site min-h-screen overflow-x-hidden text-foreground", isHomePage ? "bg-[#f4f6fb]" : "bg-transparent")}>
      <header
        className={cn(
          "sticky top-0 z-50 border-b backdrop-blur-xl transition-colors",
          isHomePage ? "border-slate-200/80 bg-white/92 text-slate-950 shadow-sm" : "border-border/60 bg-white/92",
        )}
      >
        <div className="container mx-auto flex h-[64px] items-center justify-between gap-4 px-4">
          <Link href="/" className="min-w-0">
            <SiteLogo tone="dark" />
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => {
              const active = isActive(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative inline-flex h-12 items-center px-3.5 text-sm font-medium transition-colors",
                    isHomePage
                      ? active
                        ? "text-primary"
                        : "text-slate-700 hover:text-slate-950"
                      : active
                      ? "text-primary"
                      : "text-foreground/72 hover:text-foreground",
                  )}
                >
                  {link.label}
                  {active && (
                    <span
                      className={cn(
                        "absolute bottom-0 left-3.5 right-3.5 h-0.5 rounded-full",
                        isHomePage ? "bg-[#ff4d43]" : "bg-primary",
                      )}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            {isAuthenticated ? (
              <>
                {isCustomer ? (
                  <Button
                    asChild
                    variant="outline"
                    className={cn(
                      "relative rounded-2xl px-4",
                      isHomePage
                        ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                        : "border-border/70 bg-white",
                    )}
                  >
                    <Link href="/dashboard/notifications" aria-label="Notifications">
                      <Bell className="h-4 w-4" />
                      Notifications
                      {unreadNotifications > 0 ? (
                        <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                          {unreadNotificationsLabel}
                        </span>
                      ) : null}
                    </Link>
                  </Button>
                ) : null}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "h-11 rounded-full border-slate-200 bg-white px-1.5 text-slate-700 hover:bg-slate-50 hover:text-slate-900",
                        !isHomePage && "border-border/70",
                      )}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-slate-900 text-xs font-semibold text-white">
                          {getInitials(user?.fullName ?? user?.email)}
                        </AvatarFallback>
                      </Avatar>
                      <ChevronDown className="h-4 w-4 opacity-60" />
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" className="w-64 rounded-[1.35rem] border-slate-200 p-2 shadow-xl">
                    <DropdownMenuLabel className="space-y-1 px-2 py-2">
                      <p className="text-sm font-semibold text-slate-950">{user?.fullName || "Mon compte"}</p>
                      <p className="text-xs text-slate-500">{user?.email}</p>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => handleGoTo(dashboardHref)} className="rounded-2xl px-3 py-2">
                      Mon espace
                    </DropdownMenuItem>
                    {isCustomer ? (
                      <DropdownMenuItem onSelect={() => handleGoTo("/dashboard/profil")} className="rounded-2xl px-3 py-2">
                        Mon profil
                      </DropdownMenuItem>
                    ) : null}
                    {isCustomer ? (
                      <DropdownMenuItem onSelect={() => handleGoTo("/dashboard/notifications")} className="rounded-2xl px-3 py-2">
                        Notifications
                      </DropdownMenuItem>
                    ) : null}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={() => handleLogout()}
                      className="rounded-2xl px-3 py-2 text-red-600 focus:text-red-600"
                    >
                      Déconnexion
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

              </>
            ) : (
              <Button
                asChild
                className={cn(
                  "rounded-2xl px-4 text-white",
                  isHomePage ? "bg-[#ff4d43] hover:bg-[#f03d32]" : "bg-primary text-primary-foreground",
                )}
              >
                <Link href="/connexion">Connexion</Link>
              </Button>
            )}
          </div>

          <button
            type="button"
            className={cn(
              "inline-flex h-10 w-10 items-center justify-center rounded-full border transition-colors lg:hidden",
              isHomePage
                ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                : "border-border/70 bg-white text-foreground hover:bg-muted/40",
            )}
            onClick={() => setIsMenuOpen((value) => !value)}
            aria-label={isMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {isMenuOpen && (
          <div className={cn("border-t lg:hidden", isHomePage ? "border-border/60 bg-white" : "border-border/60 bg-white")}>
            <div className="container mx-auto px-4 py-4">
              <div className="grid gap-2">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const active = isActive(link.href);

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={cn(
                        "flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-medium transition-colors",
                        isHomePage
                          ? active
                            ? "border-primary/15 bg-primary/10 text-primary"
                            : "border-slate-200 bg-white text-slate-900"
                          : active
                            ? "border-primary/15 bg-primary/10 text-primary"
                            : "border-border/70 bg-white text-foreground",
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <Icon className="h-4 w-4" />
                        {link.label}
                      </span>
                      <ArrowRight className={cn("h-4 w-4", isHomePage ? "text-muted-foreground" : "text-muted-foreground")} />
                    </Link>
                  );
                })}
              </div>

              <div className={cn("mt-4 grid gap-2", isAuthenticated && isCustomer ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
                <Button
                  asChild
                  variant="outline"
                  className={cn(
                    "w-full rounded-2xl",
                    isHomePage
                      ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                      : "border-border/70 bg-white",
                  )}
                >
                  <a href="https://wa.me/212600000000" target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </a>
                </Button>

                {isAuthenticated ? (
                  <>
                    {isCustomer && (
                        <Button
                          asChild
                          variant="outline"
                          className={cn(
                            "w-full rounded-2xl",
                            isHomePage
                            ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                            : "border-border/70 bg-white",
                        )}
                      >
                        <Link href="/dashboard/notifications" onClick={() => setIsMenuOpen(false)}>
                          <span className="flex items-center gap-2">
                            <Bell className="h-4 w-4" />
                            Notifications
                          </span>
                        </Link>
                      </Button>
                    )}

                    {isCustomer && (
                        <Button
                          asChild
                          variant="outline"
                          className={cn(
                            "w-full rounded-2xl",
                            isHomePage
                            ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                            : "border-border/70 bg-white",
                        )}
                      >
                        <Link href="/dashboard/profil" onClick={() => setIsMenuOpen(false)}>
                          <span className="flex items-center gap-2">
                            <UserCircle2 className="h-4 w-4" />
                            Profil
                          </span>
                        </Link>
                      </Button>
                    )}

                    <Button
                      asChild
                      variant="outline"
                      className={cn(
                        "w-full rounded-2xl",
                        isHomePage
                          ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                          : "border-border/70 bg-white",
                      )}
                    >
                      <Link href={dashboardHref} onClick={() => setIsMenuOpen(false)}>
                        Mon espace
                      </Link>
                    </Button>

                    <Button
                      type="button"
                      className={cn(
                        "w-full rounded-2xl text-white",
                        isHomePage ? "bg-[#ff4d43] hover:bg-[#f03d32]" : "bg-primary text-primary-foreground",
                      )}
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4" />
                      Déconnexion
                    </Button>
                  </>
                ) : (
                  <Button
                    asChild
                    className={cn(
                      "w-full rounded-2xl text-white",
                      isHomePage ? "bg-[#ff4d43] hover:bg-[#f03d32]" : "bg-primary text-primary-foreground",
                    )}
                  >
                    <Link href="/connexion" onClick={() => setIsMenuOpen(false)}>
                      Connexion
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 pb-28 md:pb-0">{children}</main>

      <footer
        className={cn(
          "border-t",
          "mt-16 border-border/70 bg-white text-foreground",
        )}
      >
        {false ? (
          <>
            <div className="container mx-auto grid gap-10 px-4 py-12 md:grid-cols-[1.25fr_0.7fr_0.9fr_1fr]">
              <div className="space-y-5">
                <SiteLogo tone="light" />
                <p className="max-w-md text-sm leading-7 text-white/70">
                  Plateforme de location de voitures au Maroc, pensée pour comparer les offres, consulter les prix et réserver rapidement.
                </p>
                <div className="flex flex-wrap gap-3">
                  {socialLinks.map((item) => {
                    const Icon = item.icon;

                    return (
                      <a
                        key={item.label}
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={item.label}
                        className="flex h-11 w-11 items-center justify-center rounded-full border border-white/12 bg-white/6 text-white/76 transition hover:bg-white/10 hover:text-white"
                      >
                        <Icon className="h-4 w-4" />
                      </a>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/62">Liens utiles</p>
                <div className="grid gap-3 text-sm text-white/78">
                  <Link href="/" className="transition-colors hover:text-white">
                    Accueil
                  </Link>
                  <Link href="/voitures" className="transition-colors hover:text-white">
                    Véhicules
                  </Link>
                  <Link href="/blog" className="transition-colors hover:text-white">
                    Blog
                  </Link>
                  <Link href="/contact" className="transition-colors hover:text-white">
                    Contact
                  </Link>
                                    <Link href="/mentions-legales" className="transition-colors hover:text-white">
                    Mentions légales
                  </Link>
                  <Link href="/confidentialite" className="transition-colors hover:text-white">
                    Confidentialité
                  </Link>
                  <Link href="/conditions-utilisation" className="transition-colors hover:text-white">
                    Conditions d'utilisation
                  </Link>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/62">Contact</p>
                <div className="grid gap-4 text-sm text-white/76">
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-white/56" />
                    <span>Casablanca, Maroc</span>
                  </div>
                  <a href="tel:+212600000000" className="flex items-start gap-3 transition-colors hover:text-white">
                    <Phone className="mt-0.5 h-4 w-4 shrink-0 text-white/56" />
                    <span>+212 6 00 00 00 00</span>
                  </a>
                  <a href="mailto:contact@locationautomaroc.ma" className="flex items-start gap-3 transition-colors hover:text-white">
                    <Mail className="mt-0.5 h-4 w-4 shrink-0 text-white/56" />
                    <span>contact@locationautomaroc.ma</span>
                  </a>
                </div>
              </div>

            </div>

            <div className="border-t border-white/8 py-5">
              <div className="container mx-auto px-4 text-center text-xs text-white/50">
                © {new Date().getFullYear()} Location Auto Maroc. Tous droits réservés.
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="container mx-auto grid gap-8 px-4 py-10 md:grid-cols-[1.1fr_0.7fr_0.7fr_0.9fr]">
              <div className="space-y-4">
                <SiteLogo />
                <p className="max-w-md text-sm leading-7 text-muted-foreground">
                  Plateforme de location de voitures au Maroc, pensée pour comparer les offres, consulter les prix et réserver rapidement.
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Liens utiles</p>
                <div className="grid gap-2 text-sm">
                  <Link href="/" className="transition-colors hover:text-primary">
                    Accueil
                  </Link>
                  <Link href="/voitures" className="transition-colors hover:text-primary">
                    Véhicules
                  </Link>
                  <Link href="/blog" className="transition-colors hover:text-primary">
                    Blog
                  </Link>
                  <Link href="/contact" className="transition-colors hover:text-primary">
                    Contact
                  </Link>
                                    <Link href="/mentions-legales" className="transition-colors hover:text-primary">
                    Mentions légales
                  </Link>
                  <Link href="/confidentialite" className="transition-colors hover:text-primary">
                    Confidentialité
                  </Link>
                  <Link href="/conditions-utilisation" className="transition-colors hover:text-primary">
                    Conditions d'utilisation
                  </Link>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Contact</p>
                <div className="grid gap-3 text-sm text-muted-foreground">
                  <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">Casablanca, Maroc</div>
                  <a href="tel:+212600000000" className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3 transition-colors hover:text-primary">
                    +212 6 00 00 00 00
                  </a>
                  <a href="mailto:contact@locationautomaroc.ma" className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3 transition-colors hover:text-primary">
                    contact@locationautomaroc.ma
                  </a>
                </div>
              </div>
            </div>

            <div className="border-t border-border/70 py-4">
              <div className="container mx-auto px-4 text-center text-xs text-muted-foreground">
                © {new Date().getFullYear()} Location Auto Maroc. Tous droits réservés.
              </div>
            </div>
          </>
        )}
      </footer>

      {!isCarDetailPage && (
        <div
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 border-t px-3 py-3 shadow-[0_-12px_36px_-24px_rgba(16,23,34,0.24)] backdrop-blur md:hidden",
            "border-border/70 bg-white/96",
          )}
        >
          <div className="mx-auto grid max-w-xl grid-cols-1 gap-3">
            <Button
              asChild
              variant="outline"
              className={cn(
                "h-12 w-full rounded-full",
                isHomePage
                  ? "border-border/70 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  : "border-border/70 bg-white",
              )}
            >
              <a href="https://wa.me/212600000000" target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </a>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

