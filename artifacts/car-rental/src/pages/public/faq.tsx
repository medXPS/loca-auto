import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, BadgeCheck, HelpCircle, MessageCircle, ShieldCheck } from "lucide-react";
import { Link } from "wouter";

const faqs = [
  {
    q: "Quels documents sont nécessaires pour louer une voiture ?",
    a: "Une pièce d’identité valide, un permis de conduire en cours de validité et des coordonnées fiables sont généralement suffisants pour démarrer la demande.",
  },
  {
    q: "Comment fonctionne le paiement ?",
    a: "Nous mettons en avant les tarifs et les conditions avant validation. Le règlement final se fait selon l’agence et la réservation choisie.",
  },
  {
    q: "Puis-je annuler ma réservation ?",
    a: "Oui, les conditions d’annulation sont visibles avant la validation afin que vous puissiez réserver en toute confiance.",
  },
  {
    q: "L’assurance est-elle incluse ?",
    a: "La couverture varie selon le véhicule. Nous affichons clairement les protections incluses pour vous aider à comparer.",
  },
  {
    q: "Peut-on récupérer la voiture à l’aéroport ?",
    a: "Oui, selon l’offre et l’agence, vous pouvez choisir un retrait en ville ou à l’aéroport.",
  },
];

export default function Faq() {
  return (
    <div className="container mx-auto px-4 py-16">
      <section className="mb-10 overflow-hidden rounded-[2rem] border border-border/70 bg-[linear-gradient(135deg,hsl(214_90%_48%),hsl(223_45%_18%))] px-6 py-10 text-white shadow-[0_30px_80px_-40px_hsl(var(--primary)/0.8)] md:px-10">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/18 bg-white/12 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/85">
            <HelpCircle className="h-3.5 w-3.5" />
            Aide
          </div>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight md:text-5xl text-balance">
            Les réponses les plus utiles, sans jargon ni détour.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-white/85">
            Nous avons regroupé les questions qui reviennent le plus souvent pour que vous puissiez réserver plus vite et sans doute inutile.
          </p>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="surface-panel">
          <CardContent className="p-6">
            <Accordion type="single" collapsible className="space-y-3">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="overflow-hidden rounded-2xl border border-border/70 bg-white px-4">
                  <AccordionTrigger className="py-4 text-left font-semibold hover:no-underline">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 text-sm leading-7 text-muted-foreground">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="surface-panel">
            <CardContent className="space-y-4 p-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/6 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                <BadgeCheck className="h-3.5 w-3.5" />
                Conseils rapides
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight">Réservez avec plus de confiance.</h2>
              <p className="text-sm leading-7 text-muted-foreground">
                Les offres mettent en avant les éléments clés en premier: prix, disponibilité, assurance et conditions de prise en charge.
              </p>
              <div className="grid gap-3">
                {[
                  "La disponibilité se vérifie directement dans la page de résultats.",
                  "Les cartes de véhicules résument l’essentiel avant d’ouvrir la fiche.",
                  "Le formulaire de réservation reste accessible et lisible sur mobile.",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <p className="text-sm leading-6 text-muted-foreground">{item}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="surface-panel-strong overflow-hidden">
            <div className="bg-[linear-gradient(180deg,hsl(214_90%_48%),hsl(223_45%_18%))] px-6 py-7 text-white">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/18 bg-white/12 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/85">
                <MessageCircle className="h-3.5 w-3.5" />
                Besoin d’aide ?
              </div>
              <h3 className="mt-5 text-3xl font-extrabold leading-tight text-balance">Contactez-nous si votre cas est plus spécifique.</h3>
              <p className="mt-4 text-sm leading-7 text-white/85">
                Une question sur un véhicule, une date, une agence ou les documents ? Nous pouvons vous orienter plus précisément.
              </p>
            </div>
            <CardContent className="p-6">
              <Link href="/contact">
                <Button className="w-full rounded-full bg-emerald-500 px-6 text-white hover:bg-emerald-600">
                  Nous contacter
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
