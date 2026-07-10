import { useMemo, type ComponentType } from "react";
import { useGetCompanySettings, useListCars } from "@workspace/api-client-react";
import {
  BadgeCheck,
  CarFront,
  CheckCircle2,
  FileText,
  MapPin,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Seo } from "@/components/seo";

type Metric = {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  detail: string;
};

type Feature = {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
};

type Step = {
  number: string;
  title: string;
  description: string;
};

function formatCount(value: number) {
  return new Intl.NumberFormat("fr-MA").format(value);
}

function MetricCard({ icon: Icon, label, value, detail }: Metric) {
  return (
    <div className="rounded-[1.35rem] border border-white/10 bg-white/6 p-4 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/52">{label}</p>
          <p className="mt-1 text-lg font-semibold text-white">{value}</p>
          <p className="mt-1 text-xs leading-5 text-white/65">{detail}</p>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }: Feature) {
  return (
    <Card className="overflow-hidden rounded-[1.6rem] border-slate-200 bg-white shadow-[0_18px_45px_-30px_rgba(15,23,42,0.18)]">
      <CardContent className="space-y-4 p-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ff4d43]/10 text-[#ff4d43]">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-950">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function StepCard({ number, title, description }: Step) {
  return (
    <div className="rounded-[1.45rem] border border-slate-200 bg-white p-5 shadow-[0_16px_34px_-28px_rgba(15,23,42,0.14)]">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white">
          {number}
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-slate-950">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        </div>
      </div>
    </div>
  );
}

export default function About() {
  const { data: settings } = useGetCompanySettings();
  const { data: fleetData } = useListCars({
    limit: 200,
    sortBy: "year_desc",
  });

  const companyName = settings?.brandName?.trim() || "Location Auto Maroc";
  const slogan = settings?.slogan?.trim() || "Une plateforme claire pour louer une voiture en toute confiance.";
  const cars = fleetData?.cars ?? [];
  const totalCars = fleetData?.total ?? cars.length;

  const cities = useMemo(() => {
    const values = new Set<string>();

    for (const car of cars) {
      if (car.city?.trim()) {
        values.add(car.city.trim());
      }
    }

    if (values.size === 0 && settings?.city?.trim()) {
      values.add(settings.city.trim());
    }

    if (values.size === 0) {
      ["Casablanca", "Marrakech", "Rabat", "Tanger"].forEach((city) => values.add(city));
    }

    return Array.from(values).sort((left, right) => left.localeCompare(right, "fr"));
  }, [cars, settings?.city]);

  const brandCount = useMemo(() => {
    const values = new Set<string>();

    for (const car of cars) {
      const brand = car.brand?.trim().toLowerCase();
      if (brand) {
        values.add(brand);
      }
    }

    return values.size;
  }, [cars]);

  const metrics: Metric[] = [
    {
      icon: CarFront,
      label: "Véhicules",
      value: formatCount(totalCars),
      detail: "publiés dans le catalogue",
    },
    {
      icon: BadgeCheck,
      label: "Marques",
      value: formatCount(brandCount),
      detail: "intégrées à la plateforme",
    },
    {
      icon: MapPin,
      label: "Villes",
      value: formatCount(cities.length),
      detail: "couvertes par l’offre",
    },
    {
      icon: Workflow,
      label: "Étapes",
      value: "4",
      detail: "de la sélection au suivi",
    },
  ];

  const platformFeatures: Feature[] = [
    {
      icon: CarFront,
      title: "Catalogue réel",
      description:
        "Les véhicules affichés dans l’interface proviennent des données du site et reflètent la flotte disponible.",
    },
    {
      icon: FileText,
      title: "Documents centralisés",
      description:
        "La CIN, le permis et les pièces justificatives sont regroupés dans un espace unique, plus simple à gérer.",
    },
    {
      icon: ShieldCheck,
      title: "Suivi lisible",
      description:
        "Les statuts du dossier restent visibles et compréhensibles pour suivre l’avancement sans ambiguïté.",
    },
    {
      icon: Workflow,
      title: "Parcours guidé",
      description:
        "La plateforme accompagne l’utilisateur de la recherche du véhicule jusqu’à la validation du dossier.",
    },
  ];

  const steps: Step[] = [
    {
      number: "01",
      title: "Choix du véhicule",
      description: "L’utilisateur parcourt le catalogue et sélectionne une voiture adaptée à son besoin.",
    },
    {
      number: "02",
      title: "Création de la demande",
      description: "Les dates, les coordonnées et les informations utiles sont renseignées dans l’espace client.",
    },
    {
      number: "03",
      title: "Téléversement des pièces",
      description: "Les documents demandés sont ajoutés dans un espace centralisé et facile à retrouver.",
    },
    {
      number: "04",
      title: "Suivi du dossier",
      description: "Le client et l’équipe voient les statuts et l’état du dossier au même endroit.",
    },
  ];

  const summaryPoints = [
    "Les contenus sont alimentés par les données réelles du site.",
    "L’expérience reste cohérente entre le mobile, le bureau et l’espace client.",
    "Les informations importantes sont regroupées pour éviter les allers-retours inutiles.",
    "La plateforme privilégie la clarté, la lisibilité et la simplicité.",
  ];

  return (
    <div className="relative overflow-hidden bg-slate-50">
      <Seo
        title={`Présentation de ${companyName}`}
        description="Découvrez une présentation simple de la plateforme de location: catalogue réel, documents centralisés et suivi clair."
        canonical="/a-propos"
      />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,77,67,0.10),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(15,23,42,0.08),_transparent_28%)]" />

      <div className="container mx-auto px-4 py-10 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[2.2rem] border border-slate-200 bg-white shadow-[0_30px_80px_-42px_rgba(15,23,42,0.28)]">
          <div className="grid gap-10 px-6 py-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:px-10 lg:py-10">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#ff4d43]/15 bg-[#ff4d43]/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#ff4d43]">
                <Sparkles className="h-3.5 w-3.5" />
                Présentation de la plateforme
              </div>

              <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-slate-950 sm:text-5xl">
                Une plateforme de location pensée pour être claire, rapide et rassurante.
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
                {companyName} centralise la recherche de véhicules, la gestion des documents et le suivi des demandes dans une
                interface simple. L’idée est de rendre le parcours plus lisible, du premier clic jusqu’à la validation du dossier.
              </p>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500">
                {slogan}
              </p>
            </div>

            <Card className="overflow-hidden border-slate-200 bg-slate-950 text-white shadow-[0_26px_70px_-38px_rgba(15,23,42,0.55)]">
              <CardContent className="space-y-5 p-6">
                <div className="rounded-[1.6rem] border border-white/10 bg-white/6 p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/55">
                    Vue d’ensemble de la plateforme
                  </p>
                  <p className="mt-3 text-xl font-semibold tracking-tight text-white">
                    Un seul espace pour voir, comprendre et suivre.
                  </p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {metrics.map((metric) => (
                      <MetricCard key={metric.label} {...metric} />
                    ))}
                  </div>
                </div>

                <div className="rounded-[1.45rem] border border-white/10 bg-white/6 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/55">
                    Ce que la plateforme met en avant
                  </p>
                  <div className="mt-4 grid gap-3">
                    {summaryPoints.map((point) => (
                      <div key={point} className="flex items-start gap-3 rounded-2xl bg-white/6 px-3 py-3">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#ff4d43]" />
                        <span className="text-sm leading-6 text-white/78">{point}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="pb-16 pt-12">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[#ff4d43]">
              Ce que la plateforme permet
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Une présentation simple des fonctions principales.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
              La page se concentre sur l’essentiel: ce que la solution propose, comment elle accompagne le client et pourquoi
              l’expérience reste facile à lire.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {platformFeatures.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </section>

        <section className="pb-12">
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <Card className="overflow-hidden rounded-[1.6rem] border-slate-200 bg-white shadow-[0_18px_45px_-30px_rgba(15,23,42,0.18)]">
              <CardContent className="space-y-5 p-6">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[#ff4d43]">Comment ça fonctionne</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                    Un parcours fluide, en quatre étapes.
                  </h2>
                </div>

                <div className="grid gap-3">
                  {steps.map((step) => (
                    <StepCard key={step.number} {...step} />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden rounded-[1.6rem] border-slate-200 bg-white shadow-[0_18px_45px_-30px_rgba(15,23,42,0.18)]">
              <CardContent className="space-y-5 p-6">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[#ff4d43]">Couverture locale</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                    Des données organisées par villes et par flotte.
                  </h2>
                </div>

                <p className="text-sm leading-7 text-slate-600">
                  Les informations visibles sur la plateforme sont construites à partir du catalogue et des villes renseignées
                  dans l’application. Cela permet de garder une présentation cohérente avec les données disponibles.
                </p>

                <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Villes affichées</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {cities.map((city) => (
                      <span
                        key={city}
                        className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700"
                      >
                        <MapPin className="mr-1.5 h-3.5 w-3.5 text-[#ff4d43]" />
                        {city}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
