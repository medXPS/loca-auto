import { useRoute } from "wouter";
import { useGetCar, useCreateRentalRequest, getGetCarQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { Users, Fuel, Settings2, DoorClosed, MapPin, CheckCircle, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";

const requestSchema = z.object({
  fullName: z.string().min(2, { message: "Nom requis" }),
  phone: z.string().min(10, { message: "Téléphone requis" }),
  email: z.string().email({ message: "Email invalide" }),
  startDate: z.string().min(1, { message: "Date de départ requise" }),
  returnDate: z.string().min(1, { message: "Date de retour requise" }),
});

export default function CarDetail() {
  const [, params] = useRoute("/voitures/:id");
  const id = Number(params?.id);
  const { data: car, isLoading } = useGetCar(id, { query: { enabled: !!id, queryKey: getGetCarQueryKey(id) } });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const createRequest = useCreateRentalRequest();

  const [days, setDays] = useState(1);

  const form = useForm<z.infer<typeof requestSchema>>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      phone: user?.phone || "",
      email: user?.email || "",
      startDate: "",
      returnDate: "",
    },
  });

  const startDate = form.watch("startDate");
  const returnDate = form.watch("returnDate");

  useEffect(() => {
    if (startDate && returnDate) {
      const start = new Date(startDate);
      const end = new Date(returnDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDays(diffDays > 0 ? diffDays : 1);
    }
  }, [startDate, returnDate]);

  const estimatedPrice = car ? (days >= 7 && car.weeklyPrice ? Math.floor(days/7) * car.weeklyPrice + (days%7)*car.dailyPrice : days * car.dailyPrice) : 0;

  const onSubmit = (values: z.infer<typeof requestSchema>) => {
    if (!isAuthenticated) {
      toast({
        title: "Connexion requise",
        description: "Veuillez vous connecter pour envoyer une demande de location",
      });
      setLocation("/connexion");
      return;
    }

    createRequest.mutate({
      data: {
        ...values,
        carId: id,
        estimatedTotalPrice: estimatedPrice,
      }
    }, {
      onSuccess: () => {
        toast({
          title: "Demande envoyée !",
          description: "Notre équipe vous contactera sous peu pour confirmer.",
        });
        setLocation("/dashboard/demandes");
      },
      onError: (error: any) => {
        toast({
          title: "Erreur",
          description: error.message || "Impossible d'envoyer la demande",
          variant: "destructive",
        });
      }
    });
  };

  if (isLoading) return <div className="container mx-auto px-4 py-8"><Skeleton className="h-96 w-full rounded-xl" /></div>;
  if (!car) return <div className="container mx-auto px-4 py-8 text-center">Voiture introuvable</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-8">
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-muted">
            {car.mainImageUrl ? (
              <img src={car.mainImageUrl} alt={car.brand} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">Aucune image</div>
            )}
            <div className="absolute top-4 right-4">
              <StatusBadge status={car.status} type="car" className="text-sm px-3 py-1" />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-serif font-bold">{car.brand} {car.model}</h1>
                <p className="text-xl text-muted-foreground mt-1">{car.year} • {car.category}</p>
              </div>
              <div className="text-right bg-primary/5 p-4 rounded-xl border border-primary/20">
                <p className="text-3xl font-bold text-primary">{formatPrice(car.dailyPrice)}</p>
                <p className="text-sm text-muted-foreground">/jour</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6 border-y my-6">
              <div className="flex flex-col items-center justify-center p-4 bg-muted/30 rounded-xl">
                <Settings2 className="w-6 h-6 text-muted-foreground mb-2" />
                <span className="font-medium">{car.transmission === "AUTOMATIC" ? "Automatique" : "Manuelle"}</span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-muted/30 rounded-xl">
                <Fuel className="w-6 h-6 text-muted-foreground mb-2" />
                <span className="font-medium">{car.fuelType}</span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-muted/30 rounded-xl">
                <Users className="w-6 h-6 text-muted-foreground mb-2" />
                <span className="font-medium">{car.seats} places</span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-muted/30 rounded-xl">
                <DoorClosed className="w-6 h-6 text-muted-foreground mb-2" />
                <span className="font-medium">{car.doors} portes</span>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold">Description</h3>
              <p className="text-muted-foreground leading-relaxed">
                {car.description || "Aucune description fournie pour ce véhicule. Il est cependant entretenu selon les normes les plus strictes pour assurer votre sécurité et votre confort lors de vos déplacements au Maroc."}
              </p>
            </div>

            <div className="mt-8 space-y-4">
              <h3 className="text-xl font-bold">Équipements & Conditions</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <span>Climatisation: {car.airConditioning ? "Oui" : "Non"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <span>Assurance incluse: {car.insuranceIncluded ? "Oui" : "Standard"}</span>
                </div>
                {car.mileageLimit && (
                  <div className="flex items-center gap-2">
                    <Info className="w-5 h-5 text-blue-500" />
                    <span>Limite km: {car.mileageLimit} km/jour</span>
                  </div>
                )}
                {car.depositAmount && (
                  <div className="flex items-center gap-2">
                    <Info className="w-5 h-5 text-amber-500" />
                    <span>Caution: {formatPrice(car.depositAmount)}</span>
                  </div>
                )}
                {car.city && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    <span>Ville: {car.city}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div>
          <Card className="sticky top-24 shadow-xl border-primary/10">
            <CardHeader className="bg-primary/5 border-b">
              <CardTitle>Réserver ce véhicule</CardTitle>
              <CardDescription>
                Remplissez le formulaire, aucun paiement immédiat n'est requis.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date de départ</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="returnDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date de retour</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom complet</FormLabel>
                        <FormControl>
                          <Input placeholder="Votre nom" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Téléphone</FormLabel>
                          <FormControl>
                            <Input placeholder="+212 6..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="email@ex.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="bg-muted p-4 rounded-xl mt-6 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Prix journalier</span>
                      <span>{formatPrice(car.dailyPrice)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Durée</span>
                      <span>{days} jour(s)</span>
                    </div>
                    <div className="border-t pt-2 mt-2 flex justify-between font-bold text-lg">
                      <span>Total estimé</span>
                      <span className="text-primary">{formatPrice(estimatedPrice)}</span>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 text-lg mt-4" 
                    disabled={createRequest.isPending || car.status !== "AVAILABLE"}
                  >
                    {createRequest.isPending ? "Envoi en cours..." : car.status !== "AVAILABLE" ? "Non disponible" : "Demander la location"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
