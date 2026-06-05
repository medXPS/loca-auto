import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function About() {
  return (
    <div className="flex flex-col">
      <section className="relative py-20 bg-primary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6">À propos de Location Auto Maroc</h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Nous sommes une agence de location de voitures de premier plan basée au Maroc, dédiée à offrir une expérience de conduite exceptionnelle à nos clients locaux et internationaux.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <img 
                src="https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=1000&auto=format&fit=crop" 
                alt="Notre flotte de voitures" 
                className="rounded-2xl shadow-xl w-full h-[500px] object-cover"
              />
            </div>
            <div className="space-y-6">
              <h2 className="text-3xl font-serif font-bold">Notre Mission</h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Notre mission est de simplifier la location de voitures au Maroc en offrant un service transparent, fiable et de haute qualité. Nous croyons que votre voyage doit commencer dès que vous prenez le volant.
              </p>
              <ul className="space-y-4 pt-4">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5">✓</div>
                  <span>Flotte moderne et régulièrement révisée</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5">✓</div>
                  <span>Transparence totale sur les prix, sans frais cachés</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5">✓</div>
                  <span>Service client réactif et à l'écoute</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-serif font-bold mb-8">Prêt à prendre la route ?</h2>
          <Link href="/voitures">
            <Button size="lg" className="px-8">Voir nos véhicules</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
