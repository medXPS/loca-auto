import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  CarFront,
  CircleHelp,
  House,
  LogOut,
  Menu,
  MessageCircle,
  Newspaper,
  PhoneCall,
  Pin,
  UserRound,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

function getDashboardHref(role?: string) {
  if (role === "ADMIN") return "/admin";
  if (role === "AGENT") return "/agent";
  return "/dashboard";
}

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const dashboardHref = useMemo(() => getDashboardHref(user?.role), [user?.role]);

  const navLinks: NavItem[] = [
    { href: "/", label: "Accueil", icon: House },
    { href: "/voitures", label: "Voitures", icon: CarFront },
    { href: "/blog", label: "Blog", icon: Newspaper },
    { href: "/faq", label: "Aide", icon: CircleHelp },
    { href: "/contact", label: "Contact", icon: PhoneCall },
  ];

  const isActive = (href: string) => {
    if (href === "/") return location === href;
    return location === href || location.startsWith(`${href}/`);
  };

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[linear-gradient(180deg,rgba(22,114,216,0.99),rgba(11,91,194,0.96))] text-white shadow-[0_18px_50px_-30px_rgba(2,18,45,0.75)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.08),transparent_24%)]" />

        <div className="relative border-b border-white/10">
          <div className="container mx-auto flex h-20 items-center justify-between px-4">
            <Link href="/" className="group flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-white/12 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] transition-transform group-hover:-translate-y-0.5">
                <CarFront className="h-5 w-5" />
              </span>
              <span className="leading-tight">
                <span className="block text-[1.05rem] font-extrabold tracking-tight md:text-[1.2rem]">Location Auto Maroc</span>
                <span className="block text-[0.7rem] uppercase tracking-[0.32em] text-white/72">
                  Comparez. Réservez. Roulez.
                </span>
              </span>
            </Link>

            <div className="hidden items-center gap-3 md:flex">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold tracking-[0.12em]">
                MAD
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/12 text-[11px] font-bold">
                FR
              </span>
              <Button asChild className="rounded-full border border-white/15 bg-white px-4 text-primary shadow-[0_16px_30px_-20px_rgba(255,255,255,0.55)] hover:bg-white/95">
                <Link href={dashboardHref}>Gérer ma réservation</Link>
              </Button>
            </div>

            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition-colors hover:bg-white/18 md:hidden"
              onClick={() => setIsMenuOpen((value) => !value)}
              aria-label={isMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div className="relative hidden border-b border-white/10 lg:block">
          <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-3">
            <nav className="flex flex-wrap items-center gap-2">
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
                        ? "border-white/25 bg-white/12 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]"
                        : "border-transparent text-white/82 hover:border-white/18 hover:bg-white/8 hover:text-white",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-4 text-xs text-white/82">
              <span className="inline-flex items-center gap-2">
                <Pin className="h-4 w-4" />
                Agences au Maroc
              </span>
              <span className="h-1 w-1 rounded-full bg-white/35" />
              <span>Annulation flexible</span>
            </div>
          </div>
        </div>

        {isMenuOpen && (
          <div className="relative border-b border-white/10 bg-white/96 text-foreground shadow-[0_20px_40px_-24px_rgba(2,18,45,0.35)] lg:hidden">
            <div className="container mx-auto px-4 py-4">
              <nav className="grid gap-2">
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
                        active
                          ? "border-primary/20 bg-primary/10 text-primary"
                          : "border-border/80 bg-white text-foreground hover:border-primary/20 hover:bg-primary/5",
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
              </nav>

              <div className="mt-4 grid gap-2 border-t border-border/70 pt-4">
                <Button asChild className="w-full rounded-2xl">
                  <Link href={dashboardHref} onClick={() => setIsMenuOpen(false)}>
                    <UserRound className="h-4 w-4" />
                    Gérer ma réservation
                  </Link>
                </Button>

                {isAuthenticated ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full rounded-2xl border-border/70 bg-white text-foreground"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" />
                    Déconnexion
                  </Button>
                ) : (
                  <Button asChild variant="outline" className="w-full rounded-2xl border-border/70 bg-white text-foreground">
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

      <main className="flex-1">{children}</main>

      <footer className="mt-auto">
        <div className="bg-[linear-gradient(180deg,rgba(11,91,194,1),rgba(9,73,161,1))] text-white">
          <div className="container mx-auto flex flex-wrap items-center justify-center gap-x-5 gap-y-2 px-4 py-3 text-sm">
            <Link href="/confidentialite" className="transition-colors hover:text-white/85">
              Charte de confidentialité
            </Link>
            <Link href="/mentions-legales" className="transition-colors hover:text-white/85">
              Mentions légales
            </Link>
            <Link href="/faq" className="transition-colors hover:text-white/85">
              Aide
            </Link>
            <Link href="/contact" className="transition-colors hover:text-white/85">
              Nous contacter
            </Link>
          </div>
        </div>

        <div className="border-t border-border/70 bg-[linear-gradient(180deg,hsl(216_55%_99%),hsl(216_45%_96%))]">
          <div className="container mx-auto grid gap-10 px-4 py-12 lg:grid-cols-[1.1fr_0.9fr_0.9fr]">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_16px_30px_-18px_hsl(var(--primary)/0.8)]">
                  <CarFront className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-lg font-extrabold tracking-tight text-foreground">Location Auto Maroc</p>
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Voyagez avec confiance</p>
                </div>
              </div>

              <p className="max-w-xl text-sm leading-6 text-muted-foreground">
                Une plateforme pensée comme un vrai comparateur de location: recherche rapide, filtres lisibles,
                offres claires et parcours de réservation rassurant du premier clic jusqu’à la remise des clés.
              </p>

              <div className="flex flex-wrap gap-2">
                {["Paiement à l'agence", "Assistance locale", "Annulation flexible"].map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center rounded-full border border-border/70 bg-white/85 px-3 py-1 text-xs font-semibold text-foreground shadow-sm"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">Navigation</p>
              <div className="grid gap-2 text-sm">
                <Link href="/voitures" className="transition-colors hover:text-primary">
                  Toutes les voitures
                </Link>
                <Link href="/blog" className="transition-colors hover:text-primary">
                  Blog et conseils
                </Link>
                <Link href="/faq" className="transition-colors hover:text-primary">
                  Questions fréquentes
                </Link>
                <Link href="/a-propos" className="transition-colors hover:text-primary">
                  À propos
                </Link>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">Contact</p>
              <div className="grid gap-3 text-sm text-muted-foreground">
                <div className="rounded-2xl border border-border/70 bg-white/80 px-4 py-3 shadow-sm">
                  Casablanca, Maroc
                </div>
                <div className="rounded-2xl border border-border/70 bg-white/80 px-4 py-3 shadow-sm">
                  +212 6 00 00 00 00
                </div>
                <div className="rounded-2xl border border-border/70 bg-white/80 px-4 py-3 shadow-sm">
                  contact@locationautomaroc.ma
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-border/70 py-4">
            <div className="container mx-auto px-4 text-center text-xs text-muted-foreground">
              © {new Date().getFullYear()} Location Auto Maroc. Tous droits réservés.
            </div>
          </div>
        </div>
      </footer>

      <a
        href="https://wa.me/212600000000"
        target="_blank"
        rel="noopener noreferrer"
        className="group fixed bottom-5 right-5 z-50 inline-flex items-center gap-3 rounded-full bg-[#25D366] px-4 py-3 text-white shadow-[0_24px_50px_-24px_rgba(37,211,102,0.75)] transition-transform hover:-translate-y-1"
        title="Contactez-nous sur WhatsApp"
      >
        <MessageCircle className="h-5 w-5" />
        <span className="hidden text-sm font-semibold sm:inline">WhatsApp</span>
      </a>
    </div>
  );
}
