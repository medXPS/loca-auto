import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, BadgeCheck, CheckCircle2, Clock3, MapPin, ShieldCheck, Sparkles, Users } from "lucide-react";

const values = [
  {
    title: "Clarté",
    description: "Des prix et des étapes de réservation qui restent lisibles du premier clic jusqu'à la validation.",
    icon: BadgeCheck,
  },
  {
    title: "Service local",
    description: "Une logique pensée pour les villes, les aéroports et les besoins réels des voyageurs au Maroc.",
    icon: MapPin,
  },
  {
    title: "Confiance",
    description: "Des informations utiles avant la prise de décision, pour réduire les frictions et les doutes.",
    icon: ShieldCheck,
  },
];

export default function About() {
  return (
    <div className="flex flex-col">
      <section className="container mx-auto px-4 py-10">
        <div className="overflow-hidden rounded-[2.2rem] marketing-dark-panel marketing-grid px-6 py-10 text-white md:px-8 md:py-12">
          <div className="relative z-10 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs marketing-kicker marketing-pill">
                <Sparkles className="h-3.5 w-3.5 text-primary" />À propos
              </div>
              <h1 className="mt-6 text-4xl font-semibold leading-tight tracking-tight text-balance md:text-5xl">
                Une plateforme de location pensée pour être plus claire, plus crédible et plus agréable à utiliser.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-white/72 md:text-lg">
                Notre objectif reste simple: garder une logique de réservation familière tout en la transformant en une vitrine plus premium, plus structurée et plus convaincante.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/voitures">
                  <Button className="rounded-full px-6 marketing-accent-button">
                    Voir les voitures
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button variant="outline" className="rounded-full border-white/14 bg-white/6 px-6 text-white hover:bg-white/10 hover:text-white">
                    Nous contacter
                  </Button>
                </Link>
              </div>
            </div>

            <Card className="overflow-hidden border-white/10 bg-white/6 text-white backdrop-blur">
              <CardContent className="space-y-5 p-6">
                <img
                  src="https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80"
                  alt="Flotte de véhicules"
                  className="h-64 w-full rounded-[1.5rem] object-cover"
                />
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { label: "Villes", value: "30+" },
                    { label: "Agences", value: "60+" },
                    { label: "Support", value: "7j/7" },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-white/56">{stat.label}</p>
                      <p className="mt-1 text-2xl font-semibold text-white">{stat.value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="pb-16">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <Card className="overflow-hidden marketing-soft-panel">
              <CardContent className="p-0">
                <img
                  src="https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1200&q=80"
                  alt="Notre équipe et nos véhicules"
                  className="h-full min-h-[420px] w-full object-cover"
                />
              </CardContent>
            </Card>

            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-black/8 bg-white/72 px-4 py-1.5 text-xs font-semibold text-primary marketing-kicker">
                <Clock3 className="h-3.5 w-3.5" />
                Notre mission
              </div>
              <h2 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                Un service plus lisible, du choix jusqu'à la remise des clés.
              </h2>
              <p className="text-base leading-8 text-muted-foreground">
                Nous avons reconstruit l'expérience pour qu'elle soit rapide à comprendre: moteur de recherche clair, cartes plus fortes, prix visibles et pages de détail plus rassurantes.
              </p>

              <div className="grid gap-4 md:grid-cols-3">
                {values.map((value) => {
                  const Icon = value.icon;
                  return (
                    <Card key={value.title} className="marketing-soft-panel">
                      <CardContent className="p-5">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          <Icon className="h-5 w-5" />
                        </div>
                        <h3 className="mt-4 text-lg font-semibold text-foreground">{value.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">{value.description}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="rounded-[1.5rem] border border-black/8 bg-white/88 p-5 shadow-[0_18px_35px_-28px_rgba(16,23,34,0.14)]">
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  <Users className="h-4 w-4 text-primary" />
                  Ce que nous gardons au centre
                </div>
                <ul className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    Une hiérarchie visuelle forte pour lire les offres sans effort.
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    Des filtres utiles qui reprennent la logique des grands comparateurs.
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    Une identité plus premium sans sacrifier la lisibilité.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
