import { useGetCompanySettings } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Clock3, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { Link } from "wouter";

export default function Contact() {
  const { data: settings } = useGetCompanySettings();
  const whatsapp = settings?.whatsapp ?? "+212600000000";

  return (
    <div className="container mx-auto px-4 py-10">
      <section className="overflow-hidden rounded-[2.2rem] marketing-dark-panel marketing-grid px-6 py-10 text-white md:px-8">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs marketing-kicker marketing-pill">
            <MessageCircle className="h-3.5 w-3.5 text-primary" />
            Contact
          </div>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-balance md:text-5xl">
            Parlez-nous de votre trajet, nous vous répondons rapidement.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-white/72">
            WhatsApp, téléphone, email ou adresse: choisissez le canal qui vous convient et gardez un vrai support humain à portée de main.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
              <Button className="rounded-full px-6 marketing-accent-button">
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </Button>
            </a>
            <Link href="/voitures">
              <Button variant="outline" className="rounded-full border-white/14 bg-white/6 px-6 text-white hover:bg-white/10 hover:text-white">
                Voir les voitures
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <div className="mt-10 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          {[
            {
              title: "Téléphone",
              icon: Phone,
              value: settings?.phone ?? "+212600000000",
              detail: "Lun-Sam, 8h-20h",
            },
            {
              title: "WhatsApp",
              icon: MessageCircle,
              value: whatsapp,
              detail: "Réponse rapide par message",
            },
            {
              title: "Email",
              icon: Mail,
              value: settings?.email ?? "contact@locationauto.ma",
              detail: "Pour les demandes détaillées",
            },
            {
              title: "Adresse",
              icon: MapPin,
              value: settings?.address ?? "Casablanca, Maroc",
              detail: "Retrait et assistance locale",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.title} className="marketing-soft-panel">
                <CardContent className="flex items-start gap-4 p-6">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                    <p className="mt-1 text-muted-foreground">{item.value}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="surface-panel-strong overflow-hidden">
          <div className="marketing-dark-panel px-6 py-7 text-white">
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[10px] marketing-kicker marketing-pill">
              <Clock3 className="h-3.5 w-3.5 text-primary" />
              Assistance directe
            </div>
            <h2 className="mt-5 text-3xl font-semibold leading-tight text-balance">Le moyen le plus rapide de nous joindre reste WhatsApp.</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/72">
              Envoyez votre ville, votre période et le modèle souhaité. Nous vous répondrons avec une proposition claire et un parcours simple.
            </p>
          </div>

          <CardContent className="space-y-4 p-6">
            <div className="rounded-2xl border border-black/8 bg-white/88 p-5 shadow-[0_18px_35px_-28px_rgba(16,23,34,0.14)]">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Message type</p>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                Bonjour, je souhaite louer une voiture à {settings?.address ?? "Casablanca"} pour ma prochaine période de voyage.
                Pouvez-vous me proposer les disponibilités et les tarifs ?
              </p>
            </div>

            <a
              href={`https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent("Bonjour, je souhaite louer une voiture")}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="w-full rounded-full marketing-accent-button">
                <MessageCircle className="h-4 w-4" />
                Démarrer sur WhatsApp
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
