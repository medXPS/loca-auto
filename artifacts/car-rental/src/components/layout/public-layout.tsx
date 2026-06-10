import { useMemo, useState, type ComponentType, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  BadgeCheck,
  CarFront,
  CircleHelp,
  Clock3,
  House,
  LogOut,
  MapPinned,
  Menu,
  MessageCircle,
  Newspaper,
  Phone,
  UserRound,
  X,
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

export function PublicLayout({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const dashboardHref = useMemo(() => getDashboardHref(user?.role), [user?.role]);

  const navLinks: NavItem[] = [
    { href: "/", label: "Accueil", icon: House },
    { href: "/voitures", label: "Voitures", icon: CarFront },
    { href: "/blog", label: "Blog", icon: Newspaper },
    { href: "/faq", label: "FAQ", icon: CircleHelp },
    { href: "/contact", label: "Contact", icon: Phone },
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
    <div className="public-site min-h-screen overflow-x-hidden bg-transparent text-foreground">
      <div className="bg-[#0c111b] text-white">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-xs">
          <div className="flex flex-wrap items-center gap-3 text-white/78">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1.5 marketing-kicker">
              <BadgeCheck className="h-3.5 w-3.5 text-primary" />
              Commercial ready
            </span>
            <span className="hidden items-center gap-2 sm:inline-flex">
              <Clock3 className="h-3.5 w-3.5 text-primary" />
              Réservations confirmées rapidement
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-white/72">
            <span className="inline-flex items-center gap-2">
              <MapPinned className="h-3.5 w-3.5 text-primary" />
              Agences au Maroc
            </span>
            <a href="tel:+212600000000" className="inline-flex items-center gap-2 transition-colors hover:text-white">
              <Phone className="h-3.5 w-3.5 text-primary" />
              +212 6 00 00 00 00
            </a>
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-50 border-b border-black/6 bg-[rgba(250,247,241,0.88)] backdrop-blur-xl">
        <div className="container mx-auto flex h-20 items-center justify-between gap-4 px-4">
          <Link href="/" className="group flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#101722] text-white shadow-[0_18px_35px_-24px_rgba(16,23,34,0.75)] transition-transform group-hover:-translate-y-0.5">
              <CarFront className="h-5 w-5 text-primary" />
            </span>
            <span className="leading-tight">
              <span className="block text-lg font-semibold tracking-tight text-foreground md:text-xl">Location Auto Maroc</span>
              <span className="block text-[0.7rem] uppercase text-muted-foreground marketing-kicker">
                Réservez. Roulez. Revenez.
              </span>
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
                      ? "border-black/8 bg-[#101722] text-white shadow-[0_18px_35px_-24px_rgba(16,23,34,0.75)]"
                      : "border-transparent text-foreground/80 hover:border-black/8 hover:bg-white/70 hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <span className="inline-flex items-center gap-2 rounded-full border border-black/8 bg-white/70 px-3 py-2 text-xs text-muted-foreground">
              <Phone className="h-3.5 w-3.5 text-primary" />
              Support 7j/7
            </span>

            {isAuthenticated ? (
              <>
                <Button asChild className="rounded-full px-5 marketing-accent-button">
                  <Link href={dashboardHref}>Mon espace</Link>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full border-black/10 bg-white/78 px-5"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  Déconnexion
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="outline" className="rounded-full border-black/10 bg-white/78 px-5">
                  <Link href="/connexion">Connexion</Link>
                </Button>
                <Button asChild className="rounded-full px-5 marketing-accent-button">
                  <Link href="/voitures">
                    Voir les offres
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </>
            )}
          </div>

          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/8 bg-white/78 text-foreground transition-colors hover:bg-white lg:hidden"
            onClick={() => setIsMenuOpen((value) => !value)}
            aria-label={isMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="border-t border-black/6 bg-[rgba(250,247,241,0.94)] lg:hidden">
            <div className="container mx-auto px-4 py-4">
              <div className="space-y-3 rounded-[1.75rem] marketing-soft-panel p-3">
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
                          ? "border-transparent bg-[#101722] text-white"
                          : "border-black/8 bg-white/82 text-foreground hover:bg-white",
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <Icon className="h-4 w-4" />
                        {link.label}
                      </span>
                      <ArrowRight className={cn("h-4 w-4", active ? "text-primary" : "text-muted-foreground")} />
                    </Link>
                  );
                })}

                <div className="grid gap-2 pt-2">
                  <Button asChild className="w-full rounded-2xl marketing-accent-button" onClick={() => setIsMenuOpen(false)}>
                    <Link href={dashboardHref}>
                      <UserRound className="h-4 w-4" />
                      {isAuthenticated ? "Mon espace" : "Commencer"}
                    </Link>
                  </Button>

                  {isAuthenticated ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full rounded-2xl border-black/8 bg-white/82"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4" />
                      Déconnexion
                    </Button>
                  ) : (
                    <Button asChild variant="outline" className="w-full rounded-2xl border-black/8 bg-white/82">
                      <Link href="/connexion" onClick={() => setIsMenuOpen(false)}>
                        Connexion
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="mt-20 bg-[#0c111b] text-white">
        <div className="container mx-auto px-4 pt-10">
          <div className="rounded-[2rem] marketing-dark-panel marketing-grid px-6 py-8 md:px-8">
            <div className="relative z-10 grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs marketing-kicker marketing-pill">
                  <BadgeCheck className="h-3.5 w-3.5 text-primary" />
                  Vente prête à convertir
                </div>
                <h2 className="mt-5 max-w-2xl text-3xl font-semibold leading-tight text-balance text-white md:text-4xl">
                  Une vitrine plus claire, plus rassurante et prête pour la mise en ligne.
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-white/72 md:text-base">
                  Recherche rapide, catalogue soigné, parcours de réservation simple et points de contact visibles dès les premiers écrans.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.5rem] border border-white/10 bg-white/6 p-4 backdrop-blur">
                  <p className="text-xs text-white/58 marketing-kicker">Temps de réponse</p>
                  <p className="mt-2 text-2xl font-semibold text-white">&lt; 15 min</p>
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-white/6 p-4 backdrop-blur">
                  <p className="text-xs text-white/58 marketing-kicker">Canal direct</p>
                  <p className="mt-2 text-2xl font-semibold text-white">WhatsApp</p>
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-white/6 p-4 backdrop-blur">
                  <p className="text-xs text-white/58 marketing-kicker">Couverture</p>
                  <p className="mt-2 text-2xl font-semibold text-white">Grandes villes</p>
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-white/6 p-4 backdrop-blur">
                  <p className="text-xs text-white/58 marketing-kicker">Objectif</p>
                  <p className="mt-2 text-2xl font-semibold text-white">Réserver vite</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto grid gap-10 px-4 py-12 lg:grid-cols-[1.1fr_0.75fr_0.75fr_0.8fr]">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/8">
                <CarFront className="h-5 w-5 text-primary" />
              </span>
              <div>
                <p className="text-lg font-semibold text-white">Location Auto Maroc</p>
                <p className="text-[0.72rem] uppercase text-white/52 marketing-kicker">Expérience premium</p>
              </div>
            </div>

            <p className="max-w-md text-sm leading-7 text-white/68">
              Plateforme de location pensée pour convertir: catalogue structuré, navigation nette et appels à l’action visibles sur chaque étape importante.
            </p>

            <div className="flex flex-wrap gap-2 text-xs">
              {["Réservation fluide", "Assistance locale", "Paiement transparent"].map((item) => (
                <span key={item} className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-white/74">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-sm font-semibold text-white marketing-kicker">Navigation</p>
            <div className="grid gap-3 text-sm text-white/68">
              <Link href="/" className="transition-colors hover:text-white">
                Accueil
              </Link>
              <Link href="/voitures" className="transition-colors hover:text-white">
                Toutes les voitures
              </Link>
              <Link href="/blog" className="transition-colors hover:text-white">
                Blog
              </Link>
              <Link href="/faq" className="transition-colors hover:text-white">
                FAQ
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-sm font-semibold text-white marketing-kicker">Légal</p>
            <div className="grid gap-3 text-sm text-white/68">
              <Link href="/mentions-legales" className="transition-colors hover:text-white">
                Mentions légales
              </Link>
              <Link href="/confidentialite" className="transition-colors hover:text-white">
                Confidentialité
              </Link>
              <Link href="/contact" className="transition-colors hover:text-white">
                Nous contacter
              </Link>
              <Link href="/connexion" className="transition-colors hover:text-white">
                Connexion
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-sm font-semibold text-white marketing-kicker">Contact</p>
            <div className="grid gap-3 text-sm text-white/72">
              <div className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3">Casablanca, Maroc</div>
              <a
                href="tel:+212600000000"
                className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 transition-colors hover:text-white"
              >
                +212 6 00 00 00 00
              </a>
              <a
                href="mailto:contact@locationautomaroc.ma"
                className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 transition-colors hover:text-white"
              >
                contact@locationautomaroc.ma
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/8 py-4">
          <div className="container mx-auto flex flex-col gap-2 px-4 text-xs text-white/46 md:flex-row md:items-center md:justify-between">
            <span>© {new Date().getFullYear()} Location Auto Maroc. Tous droits réservés.</span>
            <span>Design commercial inspiré des codes visuels modernes de plateformes produit.</span>
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
