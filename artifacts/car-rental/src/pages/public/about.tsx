import { useMemo, type ComponentType } from "react";
import { Link } from "wouter";
import { useGetCompanySettings, useListCars } from "@workspace/api-client-react";
import {
  ArrowRight,
  BadgeCheck,
  CarFront,
  CheckCircle2,
  FileText,
  MapPin,
  MessageCircle,
  Phone,
  Search,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

const features: Feature[] = [
  {
    icon: Search,
    title: "Recherche claire",
    description:
      "Le catalogue est filtré par ville, catégorie, transmission et budget pour trouver rapidement la bonne voiture.",
  },
  {
    icon: FileText,
    title: "Documents centralisés",
    description:
      "La CIN, le permis et les justificatifs sont regroupés dans un seul espace pour éviter les allers-retours inutiles.",
  },
  {
    icon: Workflow,
    title: "Parcours guidé",
    description:
      "Chaque étape de la demande est structurée pour que la réservation reste simple, du choix du véhicule au suivi du dossier.",
  },
  {
    icon: ShieldCheck,
    title: "Suivi transparent",
    description:
      "Le client et l’équipe voient l’avancement du dossier avec des statuts clairs et des actions faciles à comprendre.",
  },
];

const steps: Step[] = [
  {
    number: "01",
    title: "Choisissez votre véhicule",
    description: "Consultez le catalogue et ouvrez la fiche qui correspond à votre besoin.",
  },
  {
    number: "02",
    title: "Créez votre demande",
    description: "Renseignez les dates, les informations utiles et les coordonnées de contact.",
  },
  {
    number: "03",
    title: "Téléversez vos documents",
    description: "Ajoutez la pièce d’identité, le permis et les justificatifs demandés dans votre espace.",
  },
  {
    number: "04",
    title: "Suivez la validation",
    description: "L’état du dossier reste visible jusqu’à la confirmation finale.",
  },
];

const supportPoints = [
  "Données synchronisées avec le catalogue réel.",
  "Interface pensée pour le mobile et le desktop.",
  "Un seul espace pour les véhicules, les documents et le suivi.",
  "Assistance rapide par téléphone, e-mail ou WhatsApp.",
];

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
      detail: "pour aller de la sélection au suivi",
    },
  ];

  const whatsapp = settings?.whatsapp ?? "+212600000000";
  const whatsappHref = `https://wa.me/${whatsapp.replace(/\D/g, "")}`;
  const contactEmail = settings?.email ?? "contact@locationauto.ma";
  const contactPhone = settings?.phone ?? "+212600000000";

  return (
    <div className="relative overflow-hidden bg-slate-50">
      <Seo
        title={`Présentation de ${companyName}`}
        description="Découvrez la plateforme de location: catalogue réel, réservation guidée, documents centralisés et suivi clair du dossier."
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
                Une plateforme claire pour louer une voiture au Maroc.
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
                {companyName} centralise le catalogue, les marques, les documents et le suivi des demandes dans une interface
                simple. L’objectif est de faire gagner du temps, de réduire les frictions et de garder chaque dossier lisible
                du début à la fin.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Button asChild className="rounded-full bg-[#ff4d43] px-6 text-white hover:bg-[#f03d32]">
                  <Link href="/voitures">
                    Explorer le catalogue
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="rounded-full px-6">
                  <Link href="/contact">Nous contacter</Link>
                </Button>
              </div>

              <div className="mt-8 flex flex-wrap gap-3 text-sm text-slate-600">
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm">
                  <BadgeCheck className="h-4 w-4 text-[#ff4d43]" />
                  Catalogue en temps réel
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm">
                  <FileText className="h-4 w-4 text-[#ff4d43]" />
                  Documents centralisés
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm">
                  <ShieldCheck className="h-4 w-4 text-[#ff4d43]" />
                  Suivi transparent
                </span>
              </div>
            </div>

            <Card className="overflow-hidden border-slate-200 bg-slate-950 text-white shadow-[0_26px_70px_-38px_rgba(15,23,42,0.55)]">
              <CardContent className="space-y-5 p-6">
                <div className="rounded-[1.6rem] border border-white/10 bg-white/6 p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/55">
                    Vue d’ensemble de la plateforme
                  </p>
                  <p className="mt-3 text-xl font-semibold tracking-tight text-white">
                    Une expérience guidée, un dossier clair, une seule interface.
                  </p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {metrics.map((metric) => (
                      <MetricCard key={metric.label} {...metric} />
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 rounded-[1.45rem] border border-white/10 bg-white/6 p-4">
                  {features.map((feature) => {
                    const Icon = feature.icon;

                    return (
                      <div key={feature.title} className="flex items-start gap-3 rounded-2xl bg-white/6 px-3 py-3">
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white">{feature.title}</p>
                          <p className="mt-1 text-xs leading-5 text-white/65">{feature.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="pb-16 pt-12">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-3xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[#ff4d43]">
                Ce que la plateforme permet
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                Un seul espace pour chercher, réserver et suivre.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
                La page d’accueil et l’espace client parlent le même langage: moins d’étapes inutiles, plus de clarté et des
                informations faciles à retrouver.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {features.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </section>

        <section className="pb-16">
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <Card className="overflow-hidden rounded-[1.6rem] border-slate-200 bg-white shadow-[0_18px_45px_-30px_rgba(15,23,42,0.18)]">
              <CardContent className="space-y-5 p-6">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[#ff4d43]">Comment ça marche</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                    Le parcours est pensé pour rester simple du début à la fin.
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
                  <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[#ff4d43]">Pourquoi c’est utile</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                    Une présentation claire pour rassurer et faire gagner du temps.
                  </h2>
                </div>

                <ul className="space-y-3">
                  {supportPoints.map((point) => (
                    <li key={point} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#ff4d43]" />
                      <span className="text-sm leading-6 text-slate-600">{point}</span>
                    </li>
                  ))}
                </ul>

                <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Couverture locale</p>
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

        <section className="pb-10">
          <Card className="overflow-hidden rounded-[1.8rem] border-slate-200 bg-white shadow-[0_18px_45px_-30px_rgba(15,23,42,0.18)]">
            <CardContent className="grid gap-6 p-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:p-8">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[#ff4d43]">Besoin d’aide ?</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                  {slogan}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                  Si vous avez une question sur le catalogue, les documents ou le suivi de votre dossier, l’équipe reste
                  joignable rapidement.
                </p>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Button asChild className="rounded-full bg-[#ff4d43] px-6 text-white hover:bg-[#f03d32]">
                    <Link href="/contact">
                      Contacter l’équipe
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-full px-6">
                    <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                      Ouvrir WhatsApp
                    </a>
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                    <Phone className="h-4 w-4 text-[#ff4d43]" />
                    Téléphone
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{contactPhone}</p>
                </div>

                <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                    <MessageCircle className="h-4 w-4 text-[#ff4d43]" />
                    WhatsApp
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{whatsapp}</p>
                </div>

                <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4 sm:col-span-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                    <FileText className="h-4 w-4 text-[#ff4d43]" />
                    E-mail
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{contactEmail}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
