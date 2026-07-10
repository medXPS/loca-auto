import { useGetCompanySettings } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Eye, LockKeyhole, Mail, ShieldCheck, Trash2, UserCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Seo } from "@/components/seo";

const sections = [
  {
    title: "Données collectées",
    body:
      "Nous collectons uniquement les informations nécessaires à la gestion des demandes de location, à la création du compte et au suivi administratif du dossier. Cela peut inclure votre nom, vos coordonnées, vos documents d'identité et les éléments utiles à la réservation.",
    icon: Eye,
  },
  {
    title: "Finalités",
    body:
      "Vos données servent à traiter les réservations, vérifier l'éligibilité au service, vous contacter au sujet d'une demande et améliorer la qualité de l'expérience proposée sur le site.",
    icon: UserCheck,
  },
  {
    title: "Sécurité",
    body:
      "Nous appliquons des mesures techniques et organisationnelles adaptées afin de protéger les données contre l'accès non autorisé, la perte, l'altération ou la divulgation non désirée.",
    icon: ShieldCheck,
  },
  {
    title: "Conservation et suppression",
    body:
      "Les données sont conservées pendant la durée nécessaire à la relation commerciale, puis archivées ou supprimées selon les obligations légales applicables. Vous pouvez demander une correction ou une suppression lorsque cela est possible.",
    icon: Trash2,
  },
];

export default function Privacy() {
  const { data: settings } = useGetCompanySettings();
  const companyName = settings?.brandName?.trim() || "Location Auto Maroc";
  const companyEmail = settings?.email?.trim() || "contact@locationauto.ma";
  const companyPhone = settings?.phone?.trim() || "+212 6 00 00 00 00";

  return (
    <div className="container mx-auto px-4 py-12">
      <Seo
        title={`Politique de confidentialité - ${companyName}`}
        description="Consultez la politique de confidentialité et les règles de traitement des données personnelles."
        canonical="/confidentialite"
      />

      <section className="overflow-hidden rounded-[2.2rem] marketing-dark-panel marketing-grid px-5 py-8 text-white sm:px-6 md:px-8 md:py-10">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs marketing-kicker marketing-pill">
            <LockKeyhole className="h-3.5 w-3.5 text-primary" />
            Politique de confidentialité
          </div>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-balance sm:text-4xl md:text-5xl">
            Comment {companyName} traite et protège vos données personnelles.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-white/72">
            Cette politique explique quelles données nous collectons, pourquoi nous les utilisons et quels droits vous pouvez exercer à tout moment.
          </p>
        </div>
      </section>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="marketing-soft-panel">
          <CardContent className="space-y-6 p-6">
            {sections.map((section) => {
              const Icon = section.icon;

              return (
                <article key={section.title} className="rounded-[1.35rem] border border-black/8 bg-white/80 p-5 shadow-[0_16px_36px_-28px_rgba(15,23,42,0.14)]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h2 className="text-lg font-semibold text-foreground">{section.title}</h2>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-muted-foreground">{section.body}</p>
                </article>
              );
            })}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="marketing-soft-panel">
            <CardContent className="space-y-4 p-6">
              <h2 className="text-lg font-semibold text-foreground">Vos droits</h2>
              <p className="text-sm leading-7 text-muted-foreground">
                Vous pouvez demander l'accès à vos données, leur rectification, leur mise à jour ou leur suppression lorsqu'une telle demande est compatible avec nos obligations légales et contractuelles.
              </p>
              <p className="text-sm leading-7 text-muted-foreground">
                Pour exercer vos droits, contactez-nous par e-mail ou téléphone. Nous reviendrons vers vous dans les meilleurs délais.
              </p>
            </CardContent>
          </Card>

          <Card className="surface-panel-strong">
            <CardContent className="space-y-4 p-6">
              <h2 className="text-lg font-semibold text-foreground">Contact confidentialité</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <a href={`mailto:${companyEmail}`} className="flex items-start gap-3 transition-colors hover:text-primary">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{companyEmail}</span>
                </a>
                <a href={`tel:${companyPhone.replace(/\s+/g, "")}`} className="flex items-start gap-3 transition-colors hover:text-primary">
                  <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{companyPhone}</span>
                </a>
              </div>
            </CardContent>
          </Card>

          <Card className="surface-panel-strong">
            <CardContent className="space-y-4 p-6">
              <h2 className="text-lg font-semibold text-foreground">Pages utiles</h2>
              <div className="grid gap-2 text-sm">
                <Link href="/mentions-legales" className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3 transition-colors hover:text-primary">
                  Mentions légales
                </Link>
                <Link href="/conditions-utilisation" className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3 transition-colors hover:text-primary">
                  Conditions d'utilisation
                </Link>
                <Link href="/contact" className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3 transition-colors hover:text-primary">
                  Contact
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
