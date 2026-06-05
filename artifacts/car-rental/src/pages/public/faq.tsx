import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  {
    q: "Quels documents sont nécessaires pour louer une voiture ?",
    a: "Pour louer une voiture, vous aurez besoin d'une pièce d'identité valide (CIN ou passeport), d'un permis de conduire valide, et d'un moyen de paiement pour la caution. Les conducteurs étrangers doivent présenter un permis de conduire international.",
  },
  {
    q: "Comment fonctionne le paiement ?",
    a: "Nous fonctionnons uniquement par paiement en espèces ou par carte directement à l'agence. Après confirmation de votre demande par téléphone, vous avez 12 heures pour vous présenter à l'agence et effectuer le paiement.",
  },
  {
    q: "Quel est le montant de la caution ?",
    a: "La caution varie selon le modèle de voiture, généralement entre 1 500 MAD et 8 000 MAD. Elle vous est restituée intégralement au retour du véhicule en bon état.",
  },
  {
    q: "Puis-je annuler ma réservation ?",
    a: "Oui, vous pouvez annuler votre demande de location avant la date de prise en charge. Si vous avez déjà payé, contactez-nous pour connaître les conditions de remboursement.",
  },
  {
    q: "L'assurance est-elle incluse ?",
    a: "L'assurance de base est incluse dans la plupart de nos véhicules. Certains modèles proposent également une assurance tous risques en option. Consultez la fiche de chaque véhicule pour les détails.",
  },
  {
    q: "Y a-t-il un kilométrage limité ?",
    a: "Certains de nos véhicules proposent un kilométrage illimité, d'autres ont une limite journalière. Ces informations sont clairement indiquées sur la fiche de chaque voiture.",
  },
  {
    q: "Puis-je conduire en dehors du Maroc ?",
    a: "Non, nos véhicules sont réservés à un usage au Maroc uniquement. Toute sortie du territoire marocain est strictement interdite.",
  },
  {
    q: "Que se passe-t-il en cas de panne ?",
    a: "En cas de panne ou d'accident, contactez-nous immédiatement au numéro d'urgence fourni lors de la remise des clés. Nous assurerons une assistance rapide.",
  },
  {
    q: "Peut-on livrer la voiture à domicile ou à l'aéroport ?",
    a: "Oui, nous proposons la livraison et la récupération à domicile, à l'aéroport, ou à l'hôtel dans les villes où nous opérons. Des frais supplémentaires peuvent s'appliquer.",
  },
  {
    q: "Comment estimer le prix de ma location ?",
    a: "Sur la fiche de chaque voiture, vous pouvez voir le tarif journalier, hebdomadaire et mensuel. Le prix total est calculé automatiquement lors de votre demande de réservation.",
  },
];

export default function Faq() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Questions fréquentes</h1>
        <p className="text-lg text-slate-600">Tout ce que vous devez savoir sur la location de voiture au Maroc.</p>
      </div>

      <Accordion type="single" collapsible className="space-y-3">
        {faqs.map((faq, i) => (
          <AccordionItem key={i} value={`item-${i}`} className="border border-slate-200 rounded-xl px-6 bg-white shadow-sm">
            <AccordionTrigger className="text-left font-medium text-slate-900 py-5 hover:no-underline">
              {faq.q}
            </AccordionTrigger>
            <AccordionContent className="text-slate-600 pb-5 leading-relaxed">
              {faq.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="mt-12 bg-amber-50 rounded-2xl p-8 text-center border border-amber-100">
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Vous n'avez pas trouvé votre réponse ?</h2>
        <p className="text-slate-600 mb-4">Notre équipe est disponible pour répondre à toutes vos questions.</p>
        <a href="/contact" className="inline-block px-6 py-2 bg-amber-700 text-white rounded-lg font-medium hover:bg-amber-800 transition-colors">
          Contactez-nous
        </a>
      </div>
    </div>
  );
}
