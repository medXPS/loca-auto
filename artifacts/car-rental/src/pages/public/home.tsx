import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Calendar, Star, CheckCircle, Shield, PhoneCall } from "lucide-react";
import { useListCars } from "@workspace/api-client-react";
import { CarCard } from "@/components/car-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

export default function Home() {
  const [, setLocation] = useLocation();
  const [ville, setVille] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");

  const { data: featuredCars, isLoading } = useListCars({
    limit: 3,
    sortBy: "popular",
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (ville) params.set("ville", ville);
    if (dateDebut) params.set("date_debut", dateDebut);
    if (dateFin) params.set("date_fin", dateFin);
    const query = params.toString();
    setLocation(`/voitures${query ? `?${query}` : ""}`);
  };

  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center pt-16 pb-24 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/40 z-10"></div>
          <img
            src="https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?q=80&w=2000&auto=format&fit=crop"
            alt="Moroccan landscape with car"
            className="w-full h-full object-cover object-center"
          />
        </div>

        <div className="container relative z-20 mx-auto px-4">
          <div className="max-w-2xl">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif font-bold tracking-tight text-foreground mb-6 leading-[1.1]">
              Location de voiture au <span className="text-primary">Maroc</span>
            </h1>
            <p className="text-lg md:text-xl text-foreground/80 mb-8 max-w-xl">
              Réservez facilement votre véhicule idéal pour explorer le Maroc. Processus simple,
              prix transparents, payez à l'agence.
            </p>

            {/* Quick Search Widget */}
            <div className="bg-card p-4 rounded-2xl shadow-xl mb-8">
              <form
                className="grid grid-cols-1 md:grid-cols-4 gap-4"
                onSubmit={handleSearch}
              >
                <div className="space-y-2">
                  <label className="text-sm font-medium ml-1">Ville de départ</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Ex: Casablanca"
                      className="pl-9"
                      value={ville}
                      onChange={(e) => setVille(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium ml-1">Date de départ</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="date"
                      className="pl-9"
                      value={dateDebut}
                      onChange={(e) => setDateDebut(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium ml-1">Date de retour</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="date"
                      className="pl-9"
                      value={dateFin}
                      onChange={(e) => setDateFin(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex items-end">
                  <Button type="submit" className="w-full h-10 gap-2 text-base">
                    <Search className="h-4 w-4" />
                    Trouver
                  </Button>
                </div>
              </form>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span>Assurance incluse</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span>Kilométrage illimité</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span>Assistance 24/7</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Cars Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">Véhicules Populaires</h2>
            <p className="text-muted-foreground">
              Découvrez notre sélection des voitures les plus demandées pour votre séjour au Maroc.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {isLoading ? (
              Array(3)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="flex flex-col h-[400px]">
                    <Skeleton className="w-full h-[200px] rounded-t-xl" />
                    <div className="p-4 space-y-4 border border-t-0 rounded-b-xl flex-1">
                      <Skeleton className="h-6 w-2/3" />
                      <Skeleton className="h-4 w-1/3" />
                      <div className="grid grid-cols-2 gap-4 mt-auto">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    </div>
                  </div>
                ))
            ) : featuredCars?.cars && featuredCars.cars.length > 0 ? (
              featuredCars.cars.map((car) => <CarCard key={car.id} car={car} />)
            ) : (
              <div className="col-span-full text-center py-10 text-muted-foreground">
                Aucune voiture trouvée pour le moment.
              </div>
            )}
          </div>

          <div className="text-center mt-12">
            <Link href="/voitures">
              <Button size="lg" variant="outline" className="px-8">
                Voir toutes nos voitures
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">Comment ça marche ?</h2>
            <p className="text-muted-foreground">
              Louer une voiture avec Location Auto Maroc est simple, rapide et sécurisé.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-0.5 bg-primary/20 -z-10"></div>

            <div className="text-center">
              <div className="w-24 h-24 mx-auto bg-card border-4 border-primary/20 rounded-full flex items-center justify-center mb-6 text-primary shadow-lg">
                <Search className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold mb-3">1. Choisissez votre voiture</h3>
              <p className="text-muted-foreground">
                Parcourez notre catalogue et sélectionnez le véhicule qui correspond à vos besoins
                et à votre budget.
              </p>
            </div>

            <div className="text-center">
              <div className="w-24 h-24 mx-auto bg-card border-4 border-primary/20 rounded-full flex items-center justify-center mb-6 text-primary shadow-lg">
                <Shield className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold mb-3">2. Envoyez votre demande</h3>
              <p className="text-muted-foreground">
                Remplissez le formulaire de réservation en ligne. Aucun paiement par carte n'est
                requis à cette étape.
              </p>
            </div>

            <div className="text-center">
              <div className="w-24 h-24 mx-auto bg-card border-4 border-primary/20 rounded-full flex items-center justify-center mb-6 text-primary shadow-lg">
                <PhoneCall className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold mb-3">3. Confirmation & Paiement</h3>
              <p className="text-muted-foreground">
                Notre agent vous appelle pour confirmer. Passez ensuite à l'agence pour régler et
                récupérer votre voiture.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-secondary text-secondary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6">
            Prêt pour votre voyage au Maroc ?
          </h2>
          <p className="text-lg opacity-90 mb-10 max-w-2xl mx-auto">
            Contactez-nous dès aujourd'hui ou réservez directement en ligne pour profiter de nos
            meilleures offres de location de voitures.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/voitures">
              <Button
                size="lg"
                className="w-full sm:w-auto px-8 bg-primary hover:bg-primary/90 text-primary-foreground border-none"
              >
                Réserver maintenant
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto px-8 bg-transparent border-secondary-foreground/20 hover:bg-secondary-foreground/10 text-secondary-foreground"
            >
              Contactez-nous
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
