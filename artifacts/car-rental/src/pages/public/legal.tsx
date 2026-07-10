import { useGetCompanySettings } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Building2, FileText, Globe2, Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Seo } from "@/components/seo";

const sections = [
  {
    title: "Éditeur du site",
    body:
      "Ce site est édité par Location Auto Maroc, société spécialisée dans la location de véhicules au Maroc. Les informations de contact ci-dessous correspondent aux données renseignées dans l'administration du site.",
    icon: Building2,
  },
  {
    title: "Hébergement technique",
    body:
      "Le service repose sur l’infrastructure de déploiement de cette application. Pour toute demande technique ou juridique, vous pouvez nous écrire aux coordonnées indiquées plus bas.",
    icon: Globe2,
  },
  {
    title: "Propriété intellectuelle",
    body:
      "L’ensemble des contenus présents sur ce site, notamment les textes, visuels, logos et éléments graphiques, est protégé par le droit de la propriété intellectuelle. Toute reproduction non autorisée est interdite.",
    icon: FileText,
  },
  {
    title: "Responsabilité",
    body:
      "Nous veillons à publier des informations exactes et à jour. Toutefois, nous ne pouvons garantir l'absence totale d'erreur ou d'interruption de service. L'utilisation du site reste sous la responsabilité de l'utilisateur.",
    icon: ShieldCheck,
  },
];

export default function Legal() {
  const { data: settings } = useGetCompanySettings();
  const companyName = settings?.brandName?.trim() || "Location Auto Maroc";
  const companyCity = settings?.city?.trim() || "Casablanca";
  const companyAddress = settings?.address?.trim() || `${companyCity}, Maroc`;
  const companyEmail = settings?.email?.trim() || "contact@locationauto.ma";
  const companyPhone = settings?.phone?.trim() || "+212 6 00 00 00 00";

  return (
    <div className="container mx-auto px-4 py-12">
      <Seo
        title={`Mentions légales - ${companyName}`}
        description="Consultez les mentions légales du site de location de voitures et les coordonnées de contact officielles."
        canonical="/mentions-legales"
      />

      <section className="overflow-hidden rounded-[2.2rem] marketing-dark-panel marketing-grid px-5 py-8 text-white sm:px-6 md:px-8 md:py-10">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs marketing-kicker marketing-pill">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            Mentions légales
          </div>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-balance sm:text-4xl md:text-5xl">
            Informations juridiques et coordonnées officielles de {companyName}.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-white/72">
            Cette page rassemble les informations nécessaires pour identifier l'éditeur du site, comprendre le cadre d'utilisation et nous contacter facilement.
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
              <h2 className="text-lg font-semibold text-foreground">Coordonnées de contact</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{companyAddress}</span>
                </div>
                <a href={`tel:${companyPhone.replace(/\s+/g, "")}`} className="flex items-start gap-3 transition-colors hover:text-primary">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{companyPhone}</span>
                </a>
                <a href={`mailto:${companyEmail}`} className="flex items-start gap-3 transition-colors hover:text-primary">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{companyEmail}</span>
                </a>
              </div>
            </CardContent>
          </Card>

          <Card className="surface-panel-strong">
            <CardContent className="space-y-4 p-6">
              <h2 className="text-lg font-semibold text-foreground">Pages liées</h2>
              <div className="grid gap-2 text-sm">
                <Link href="/conditions-utilisation" className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3 transition-colors hover:text-primary">
                  Conditions d'utilisation
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
