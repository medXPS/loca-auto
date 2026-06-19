import { useGetCompanySettings } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { Link } from "wouter";

export default function Contact() {
  const { data: settings } = useGetCompanySettings();
  const whatsapp = settings?.whatsapp ?? "+212600000000";
  const whatsappHref = `https://wa.me/${whatsapp.replace(/\D/g, "")}`;

  const contactItems = [
    {
      title: "Telephone",
      icon: Phone,
      value: settings?.phone ?? "+212600000000",
      detail: "Reponse directe pendant les heures ouvrables.",
    },
    {
      title: "WhatsApp",
      icon: MessageCircle,
      value: whatsapp,
      detail: "Le canal le plus rapide pour un echange immediat.",
    },
    {
      title: "Email",
      icon: Mail,
      value: settings?.email ?? "contact@locationauto.ma",
      detail: "Pour les demandes detaillees ou la documentation.",
    },
    {
      title: "Adresse",
      icon: MapPin,
      value: settings?.address ?? "Casablanca, Maroc",
      detail: "Accueil et accompagnement locaux.",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-10">
      <section className="overflow-hidden rounded-[2.2rem] marketing-dark-panel marketing-grid px-6 py-10 text-white md:px-8">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs marketing-kicker marketing-pill">
            <MessageCircle className="h-3.5 w-3.5 text-primary" />
            Contact
          </div>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-balance md:text-5xl">
            Parlez-nous de votre besoin, on vous repond vite.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-white/72">
            WhatsApp, telephone, email ou adresse: gardez le canal qui vous arrange pour lancer votre demande sans friction.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
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

      <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {contactItems.map((item) => {
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
    </div>
  );
}
