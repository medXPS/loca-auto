import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, BadgeCheck, HelpCircle, MessageCircle, ShieldCheck } from "lucide-react";
import { Link } from "wouter";

const faqs = [
  {
    q: "Quels documents sont nécessaires pour louer une voiture ?",
    a: "Une pièce d'identité valide, un permis de conduire en cours de validité et des coordonnées fiables suffisent généralement pour démarrer la demande.",
  },
  {
    q: "Comment fonctionne le paiement ?",
    a: "Les tarifs et conditions sont affichés avant validation. Le règlement final dépend ensuite de l'agence et de l'offre choisie.",
  },
  {
    q: "Puis-je annuler ma réservation ?",
    a: "Oui. Les conditions d'annulation sont visibles avant la validation afin que vous puissiez réserver en toute confiance.",
  },
  {
    q: "L'assurance est-elle incluse ?",
    a: "La couverture varie selon le véhicule. Nous affichons clairement les protections incluses pour vous aider à comparer.",
  },
  {
    q: "Peut-on récupérer la voiture à l'aéroport ?",
    a: "Oui, selon l'offre et l'agence, vous pouvez choisir un retrait en ville ou à l'aéroport.",
  },
];

export default function Faq() {
  return (
    <div className="container mx-auto px-4 py-10">
      <section className="overflow-hidden rounded-[2rem] marketing-dark-panel marketing-grid px-6 py-10 text-white md:px-8">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[10px] marketing-kicker marketing-pill">
            <HelpCircle className="h-3.5 w-3.5 text-primary" />
            Aide
          </div>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-balance md:text-5xl">
            Les réponses les plus utiles, sans jargon ni détour.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-white/72">
            Nous avons regroupé les questions qui reviennent le plus souvent pour que vous puissiez réserver plus vite et avec plus de sérénité.
          </p>
        </div>
      </section>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="marketing-soft-panel">
          <CardContent className="p-6">
            <Accordion type="single" collapsible className="space-y-3">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="overflow-hidden rounded-2xl border border-black/8 bg-white/82 px-4">
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
          <Card className="marketing-soft-panel">
            <CardContent className="space-y-4 p-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-black/8 bg-white/72 px-4 py-1.5 text-xs font-semibold text-primary marketing-kicker">
                <BadgeCheck className="h-3.5 w-3.5" />
                Conseils rapides
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">Réservez avec plus de confiance.</h2>
              <p className="text-sm leading-7 text-muted-foreground">
                Les offres mettent en avant les éléments clés en premier: prix, disponibilité, assurance et conditions de prise en charge.
              </p>
              <div className="grid gap-3">
                {[
                  "La disponibilité se vérifie directement dans la page de résultats.",
                  "Les cartes véhicules résument l'essentiel avant l'ouverture de la fiche.",
                  "Le formulaire de réservation reste accessible et lisible sur mobile.",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-2xl border border-black/8 bg-[#faf7f2] px-4 py-3">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <p className="text-sm leading-6 text-muted-foreground">{item}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="surface-panel-strong overflow-hidden">
            <div className="marketing-dark-panel px-6 py-7 text-white">
              <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[10px] marketing-kicker marketing-pill">
                <MessageCircle className="h-3.5 w-3.5 text-primary" />
                Besoin d'aide ?
              </div>
              <h3 className="mt-5 text-3xl font-semibold leading-tight text-balance">Contactez-nous si votre cas est plus spécifique.</h3>
              <p className="mt-4 text-sm leading-7 text-white/72">
                Une question sur un véhicule, une date, une agence ou les documents ? Nous pouvons vous orienter plus précisément.
              </p>
            </div>
            <CardContent className="p-6">
              <Link href="/contact">
                <Button className="w-full rounded-full marketing-accent-button">
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
