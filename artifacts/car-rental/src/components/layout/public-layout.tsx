import { useMemo, useState, type ComponentType, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ArrowRight, CarFront, House, LogOut, Menu, MessageCircle, Newspaper, Phone, X } from "lucide-react";
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

export function PublicLayout({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const dashboardHref = useMemo(() => getDashboardHref(user?.role), [user?.role]);
  const isCarDetailPage = /^\/voitures\/\d+/.test(location);

  const navLinks: NavItem[] = [
    { href: "/", label: "Accueil", icon: House },
    { href: "/voitures", label: "Véhicules", icon: CarFront },
    { href: "/blog", label: "Blog", icon: Newspaper },
    { href: "/contact", label: "Contact", icon: Phone },
  ];

  const isActive = (href: string) => {
    if (href === "/") return location === href;
    if (href === "/blog") return location === href || location.startsWith("/blog/");
    return location === href || location.startsWith(`${href}/`);
  };

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
  };

  return (
    <div className="public-site min-h-screen overflow-x-hidden bg-transparent text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/70 bg-white/94 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
          <Link href="/" className="group flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_18px_35px_-24px_hsl(var(--primary)/0.55)] transition-transform group-hover:-translate-y-0.5">
              <CarFront className="h-5 w-5" />
            </span>
            <span className="leading-tight">
              <span className="block text-[1.02rem] font-semibold tracking-tight md:text-[1.1rem]">Location Auto Maroc</span>
              <span className="block text-[0.68rem] uppercase tracking-[0.24em] text-muted-foreground">Location simple et rapide</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-2 lg:flex">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all",
                    active
                      ? "border-primary/15 bg-primary/10 text-primary"
                      : "border-transparent text-foreground/78 hover:border-border/70 hover:bg-muted/40 hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            {isAuthenticated ? (
              <>
                <Button asChild variant="outline" className="rounded-full border-border/70 bg-white px-5">
                  <Link href={dashboardHref}>Mon espace</Link>
                </Button>
                <Button type="button" className="rounded-full bg-primary px-5 text-primary-foreground" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                  Déconnexion
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="outline" className="rounded-full border-border/70 bg-white px-5">
                  <Link href="/connexion">Connexion</Link>
                </Button>
                <Button asChild className="rounded-full bg-primary px-5 text-primary-foreground">
                  <Link href="/reservation">
                    Réserver
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </>
            )}
          </div>

          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border/70 bg-white text-foreground transition-colors hover:bg-muted/40 lg:hidden"
            onClick={() => setIsMenuOpen((value) => !value)}
            aria-label={isMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="border-t border-border/70 bg-white lg:hidden">
            <div className="container mx-auto px-4 py-4">
              <div className="space-y-2">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const active = isActive(link.href);

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={cn(
                        "flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-medium",
                        active ? "border-primary/15 bg-primary/10 text-primary" : "border-border/70 bg-white text-foreground",
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <Icon className="h-4 w-4" />
                        {link.label}
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  );
                })}
              </div>

              <div className="mt-4 grid gap-2">
                <Button asChild className="w-full rounded-2xl bg-primary text-primary-foreground" onClick={() => setIsMenuOpen(false)}>
                  <Link href="/reservation">
                    Réserver
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>

                {isAuthenticated ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full rounded-2xl border-border/70 bg-white"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" />
                    Déconnexion
                  </Button>
                ) : (
                  <Button asChild variant="outline" className="w-full rounded-2xl border-border/70 bg-white">
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

      <main className="flex-1 pb-24 md:pb-0">{children}</main>

      <footer className="mt-16 border-t border-border/70 bg-white">
        <div className="container mx-auto grid gap-8 px-4 py-10 md:grid-cols-[1.1fr_0.7fr_0.7fr_0.9fr]">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <CarFront className="h-5 w-5" />
              </span>
              <div>
                <p className="text-lg font-semibold">Location Auto Maroc</p>
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Location au Maroc</p>
              </div>
            </div>
            <p className="max-w-md text-sm leading-7 text-muted-foreground">
              Une vitrine simple et premium pour comparer les véhicules, voir les prix et réserver en quelques clics.
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

          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">WhatsApp</p>
            <p className="text-sm leading-7 text-muted-foreground">
              Contact rapide pour vérifier la disponibilité d’un véhicule et finaliser la réservation.
            </p>
            <Button asChild variant="outline" className="rounded-full border-border/70 bg-white px-4 py-2 text-sm font-medium">
              <a href="https://wa.me/212600000000" target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </a>
            </Button>
          </div>
        </div>

        <div className="border-t border-border/70 py-4">
          <div className="container mx-auto px-4 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} Location Auto Maroc. Tous droits réservés.
          </div>
        </div>
      </footer>

      {!isCarDetailPage && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border/70 bg-white/96 px-3 py-3 shadow-[0_-12px_36px_-24px_rgba(16,23,34,0.24)] backdrop-blur md:hidden">
          <div className="mx-auto grid max-w-xl grid-cols-2 gap-3">
            <Button asChild className="h-12 rounded-full bg-primary text-primary-foreground">
              <Link href="/reservation">
                Réserver
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-12 w-full rounded-full border-border/70 bg-white">
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
