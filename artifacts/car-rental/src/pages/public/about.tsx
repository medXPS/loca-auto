import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, BadgeCheck, CheckCircle2, Clock3, MapPin, ShieldCheck, Sparkles, Users } from "lucide-react";

const values = [
  {
    title: "Clarté",
    description: "Des prix et des étapes de réservation qui restent lisibles du premier clic jusqu’à la validation.",
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
      <section className="relative isolate overflow-hidden border-b border-border/60">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.16),transparent_28%),linear-gradient(135deg,hsl(214_90%_48%),hsl(223_45%_18%))]" />
        <div className="container relative mx-auto px-4 py-16 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="text-white">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/18 bg-white/12 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/85 backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" />
                À propos
              </div>
              <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight md:text-5xl text-balance">
                Une plateforme de location pensée pour être plus claire, plus élégante et plus rassurante.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-white/85 md:text-lg">
                Notre objectif est simple: conserver la logique que les utilisateurs connaissent déjà, tout en la
                transformant en une expérience plus premium, plus lisible et plus efficace sur tous les écrans.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/voitures">
                  <Button className="rounded-full bg-white px-6 text-primary hover:bg-white/95">
                    Voir les voitures
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button variant="outline" className="rounded-full border-white/20 bg-transparent px-6 text-white hover:bg-white/10 hover:text-white">
                    Nous contacter
                  </Button>
                </Link>
              </div>
            </div>

            <Card className="overflow-hidden border-white/18 bg-white/12 text-white shadow-[0_28px_70px_-34px_rgba(0,0,0,0.45)] backdrop-blur-xl">
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
                    <div key={stat.label} className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-white/70">{stat.label}</p>
                      <p className="mt-1 text-2xl font-extrabold">{stat.value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <Card className="surface-panel overflow-hidden">
              <CardContent className="p-0">
                <img
                  src="https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1200&q=80"
                  alt="Notre équipe et nos véhicules"
                  className="h-full min-h-[420px] w-full object-cover"
                />
              </CardContent>
            </Card>

            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/6 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                <Clock3 className="h-3.5 w-3.5" />
                Notre mission
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">Un service plus lisible, du choix jusqu’à la remise des clés.</h2>
              <p className="text-base leading-8 text-muted-foreground">
                Nous avons construit cette interface pour qu’elle reste rapide à comprendre: un moteur de recherche clair,
                des cartes plus riches, des prix visibles et des pages de détail qui rassurent sans surcharger.
              </p>

              <div className="grid gap-4 md:grid-cols-3">
                {values.map((value) => {
                  const Icon = value.icon;
                  return (
                    <Card key={value.title} className="surface-panel">
                      <CardContent className="p-5">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          <Icon className="h-5 w-5" />
                        </div>
                        <h3 className="mt-4 text-lg font-bold">{value.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">{value.description}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="rounded-[1.5rem] border border-border/70 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  <Users className="h-4 w-4 text-primary" />
                  Ce que nous gardons au centre
                </div>
                <ul className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    Une hiérarchie visuelle forte pour lire les offres sans effort.
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    Des filtres utiles qui reprennent la logique de recherche des grands comparateurs.
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    Une palette plus riche et plus premium, sans perdre la lisibilité.
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
