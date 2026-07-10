import { useGetCompanySettings } from "@workspace/api-client-react";
import { Link } from "wouter";
import { BadgeCheck, CalendarDays, CreditCard, FileText, ShieldCheck, UserCog } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Seo } from "@/components/seo";

const sections = [
  {
    title: "Objet",
    body:
      "Les présentes conditions d'utilisation définissent les règles d'accès et de navigation sur le site, ainsi que les grandes lignes du service de location proposé par l'entreprise.",
    icon: FileText,
  },
  {
    title: "Accès au service",
    body:
      "L'accès au site est gratuit. Certaines fonctionnalités, comme la réservation ou la gestion d'un dossier client, peuvent nécessiter la création d'un compte et la fourniture d'informations exactes et à jour.",
    icon: UserCog,
  },
  {
    title: "Réservations",
    body:
      "Toute demande de réservation doit être vérifiée et validée par notre équipe. Les conditions finales, notamment les tarifs, les dépôts et les disponibilités, sont confirmées au moment du traitement du dossier.",
    icon: CalendarDays,
  },
  {
    title: "Paiement et documents",
    body:
      "Le règlement, les justificatifs demandés et les délais de dépôt sont indiqués dans l'espace client ou lors de la confirmation de la réservation. Les documents téléversés doivent être lisibles, valides et conformes aux pièces demandées.",
    icon: CreditCard,
  },
];

export default function Terms() {
  const { data: settings } = useGetCompanySettings();
  const companyName = settings?.brandName?.trim() || "Location Auto Maroc";
  const companyEmail = settings?.email?.trim() || "contact@locationauto.ma";
  const companyPhone = settings?.phone?.trim() || "+212 6 00 00 00 00";

  return (
    <div className="container mx-auto px-4 py-12">
      <Seo
        title={`Conditions d'utilisation - ${companyName}`}
        description="Consultez les conditions d'utilisation du site et les règles applicables à la réservation de véhicules."
        canonical="/conditions-utilisation"
      />

      <section className="overflow-hidden rounded-[2.2rem] marketing-dark-panel marketing-grid px-5 py-8 text-white sm:px-6 md:px-8 md:py-10">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs marketing-kicker marketing-pill">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            Conditions d'utilisation
          </div>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-balance sm:text-4xl md:text-5xl">
            Les règles d'utilisation du service proposé par {companyName}.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-white/72">
            Cette page résume les principaux engagements de l'utilisateur et les modalités générales qui s'appliquent à la navigation, à la création de compte et aux réservations.
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

            <article className="rounded-[1.35rem] border border-black/8 bg-white/80 p-5 shadow-[0_16px_36px_-28px_rgba(15,23,42,0.14)]">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <BadgeCheck className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">Obligations de l'utilisateur</h2>
              </div>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                L'utilisateur s'engage à fournir des informations exactes, à respecter les règles de circulation, à conserver les documents transmis et à utiliser le service de manière loyale et conforme à la loi.
              </p>
            </article>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="marketing-soft-panel">
            <CardContent className="space-y-4 p-6">
              <h2 className="text-lg font-semibold text-foreground">Suspension et modification</h2>
              <p className="text-sm leading-7 text-muted-foreground">
                Nous pouvons suspendre temporairement l'accès à un compte ou adapter ces conditions si cela est nécessaire pour des raisons de sécurité, de conformité ou de maintenance du service.
              </p>
              <p className="text-sm leading-7 text-muted-foreground">
                La version la plus récente de cette page prévaut sur toute version antérieure.
              </p>
            </CardContent>
          </Card>

          <Card className="surface-panel-strong">
            <CardContent className="space-y-4 p-6">
              <h2 className="text-lg font-semibold text-foreground">Contact</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <a href={`mailto:${companyEmail}`} className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3 transition-colors hover:text-primary">
                  {companyEmail}
                </a>
                <a href={`tel:${companyPhone.replace(/\s+/g, "")}`} className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3 transition-colors hover:text-primary">
                  {companyPhone}
                </a>
              </div>
            </CardContent>
          </Card>

          <Card className="surface-panel-strong">
            <CardContent className="space-y-4 p-6">
              <h2 className="text-lg font-semibold text-foreground">Liens utiles</h2>
              <div className="grid gap-2 text-sm">
                <Link href="/mentions-legales" className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3 transition-colors hover:text-primary">
                  Mentions légales
                </Link>
                <Link href="/confidentialite" className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3 transition-colors hover:text-primary">
                  Politique de confidentialité
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
