import { useGetCompanySettings } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, Mail, MapPin, MessageCircle } from "lucide-react";

export default function Contact() {
  const { data: settings } = useGetCompanySettings();
  const whatsapp = settings?.whatsapp ?? "+212600000000";

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Contactez-nous</h1>
        <p className="text-lg text-slate-600">Notre équipe est disponible 7j/7 pour répondre à vos questions.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Phone className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">Téléphone</h3>
                <p className="text-slate-600">{settings?.phone ?? "+212600000000"}</p>
                <p className="text-sm text-slate-500 mt-1">Lun-Sam, 8h-20h</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-5 h-5 text-green-700" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">WhatsApp</h3>
                <p className="text-slate-600">{whatsapp}</p>
                <a
                  href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2"
                >
                  <Button size="sm" className="bg-green-600 hover:bg-green-700">
                    Envoyer un message
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-blue-700" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">Email</h3>
                <p className="text-slate-600">{settings?.email ?? "contact@locationauto.ma"}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">Adresse</h3>
                <p className="text-slate-600">{settings?.address ?? "Casablanca, Maroc"}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="bg-gradient-to-br from-amber-700 to-amber-900 rounded-2xl p-8 text-white flex flex-col justify-center">
          <h2 className="text-2xl font-bold mb-4">Réservez par WhatsApp</h2>
          <p className="text-amber-100 mb-6 leading-relaxed">
            Le moyen le plus rapide de réserver votre voiture. Envoyez-nous un message et nous vous répondrons en quelques minutes.
          </p>
          <a
            href={`https://wa.me/${whatsapp.replace(/\D/g, "")}?text=Bonjour, je souhaite louer une voiture`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button size="lg" className="w-full bg-white text-amber-800 hover:bg-amber-50 font-semibold">
              <MessageCircle className="w-5 h-5 mr-2" />
              Démarrer sur WhatsApp
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
