import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { MessageCircle, Menu, X, User } from "lucide-react";
import { useState } from "react";

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Accueil" },
    { href: "/voitures", label: "Nos Voitures" },
    { href: "/blog", label: "Blog" },
    { href: "/a-propos", label: "À propos" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-serif font-bold text-primary">Location Auto</span>
            <span className="text-xl font-serif font-bold text-foreground">Maroc</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className={`text-sm font-medium transition-colors hover:text-primary ${location === link.href ? "text-primary" : "text-muted-foreground"}`}>
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <Link href={user?.role === "SUPER_ADMIN" ? "/admin" : user?.role === "AGENT" ? "/agent" : "/dashboard"}>
                  <Button variant="outline" size="sm" className="gap-2">
                    <User className="h-4 w-4" />
                    Tableau de bord
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={logout}>Déconnexion</Button>
              </div>
            ) : (
              <>
                <Link href="/connexion">
                  <Button variant="ghost" size="sm">Connexion</Button>
                </Link>
                <Link href="/inscription">
                  <Button size="sm">S'inscrire</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button className="md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Nav */}
        {isMenuOpen && (
          <div className="md:hidden border-t bg-background px-4 py-4 space-y-4">
            <nav className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} className="text-sm font-medium" onClick={() => setIsMenuOpen(false)}>
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="pt-4 border-t flex flex-col gap-2">
              {isAuthenticated ? (
                <>
                  <Link href={user?.role === "SUPER_ADMIN" ? "/admin" : user?.role === "AGENT" ? "/agent" : "/dashboard"} onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <User className="h-4 w-4" />
                      Tableau de bord
                    </Button>
                  </Link>
                  <Button variant="ghost" className="w-full justify-start" onClick={() => { logout(); setIsMenuOpen(false); }}>Déconnexion</Button>
                </>
              ) : (
                <>
                  <Link href="/connexion" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" className="w-full">Connexion</Button>
                  </Link>
                  <Link href="/inscription" onClick={() => setIsMenuOpen(false)}>
                    <Button className="w-full">S'inscrire</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 flex flex-col">
        {children}
      </main>

      <footer className="bg-secondary text-secondary-foreground py-12 mt-auto">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-serif font-bold text-primary mb-4">Location Auto Maroc</h3>
            <p className="text-sm text-secondary-foreground/70">
              Votre partenaire de confiance pour la location de voitures au Maroc. Service premium, prix transparents.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-4">Liens rapides</h4>
            <ul className="space-y-2 text-sm text-secondary-foreground/70">
              <li><Link href="/voitures" className="hover:text-primary transition-colors">Nos Voitures</Link></li>
              <li><Link href="/a-propos" className="hover:text-primary transition-colors">À propos</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
              <li><Link href="/faq" className="hover:text-primary transition-colors">FAQ</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-4">Informations légales</h4>
            <ul className="space-y-2 text-sm text-secondary-foreground/70">
              <li><Link href="/mentions-legales" className="hover:text-primary transition-colors">Mentions légales</Link></li>
              <li><Link href="/confidentialite" className="hover:text-primary transition-colors">Politique de confidentialité</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-secondary-foreground/70">
              <li>Casablanca, Maroc</li>
              <li>+212 6 00 00 00 00</li>
              <li>contact@locationautomaroc.ma</li>
            </ul>
          </div>
        </div>
        <div className="container mx-auto px-4 mt-8 pt-8 border-t border-secondary-foreground/10 text-center text-sm text-secondary-foreground/50">
          © {new Date().getFullYear()} Location Auto Maroc. Tous droits réservés.
        </div>
      </footer>

      {/* WhatsApp FAB */}
      <a 
        href="https://wa.me/212600000000" 
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-[#25D366] text-white p-4 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-200 group"
        title="Contactez-nous sur WhatsApp"
      >
        <MessageCircle className="w-6 h-6" />
        <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-white text-gray-800 text-sm py-1 px-3 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none font-medium">
          Contactez-nous sur WhatsApp
        </span>
      </a>
    </div>
  );
}
