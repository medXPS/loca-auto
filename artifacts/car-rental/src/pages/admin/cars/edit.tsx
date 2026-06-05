import { useLocation, useRoute } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useUpdateCar, useGetCar, getListCarsQueryKey, getGetCarQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect } from "react";

const carSchema = z.object({
  brand: z.string().min(1, "Requis"),
  model: z.string().min(1, "Requis"),
  year: z.coerce.number().min(2000),
  category: z.string().min(1, "Requis"),
  fuelType: z.string().min(1, "Requis"),
  transmission: z.string().min(1, "Requis"),
  seats: z.coerce.number().min(2),
  doors: z.coerce.number().min(2),
  dailyPrice: z.coerce.number().min(1),
  city: z.string().min(1, "Requis"),
  status: z.string().min(1, "Requis"),
  licensePlate: z.string().optional(),
  description: z.string().optional(),
  mainImageUrl: z.string().optional(),
});

type CarFormValues = z.infer<typeof carSchema>;

export default function AdminEditCar() {
  const [, params] = useRoute("/admin/voitures/:id");
  const id = Number(params?.id);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const { data: car, isLoading } = useGetCar(id, { query: { enabled: !!id, queryKey: getGetCarQueryKey(id) } });
  const updateCar = useUpdateCar();
  const queryClient = useQueryClient();

  const form = useForm<CarFormValues>({
    resolver: zodResolver(carSchema),
    defaultValues: {
      brand: "",
      model: "",
      year: new Date().getFullYear(),
      category: "ECONOMY",
      fuelType: "PETROL",
      transmission: "MANUAL",
      seats: 5,
      doors: 4,
      dailyPrice: 200,
      city: "Casablanca",
      status: "AVAILABLE",
      licensePlate: "",
      description: "",
      mainImageUrl: "",
    },
  });

  useEffect(() => {
    if (car) {
      form.reset({
        brand: car.brand,
        model: car.model,
        year: car.year,
        category: car.category,
        fuelType: car.fuelType,
        transmission: car.transmission,
        seats: car.seats,
        doors: car.doors,
        dailyPrice: car.dailyPrice,
        city: car.city || "Casablanca",
        status: car.status,
        licensePlate: car.licensePlate || "",
        description: car.description || "",
        mainImageUrl: car.mainImageUrl || "",
      });
    }
  }, [car, form]);

  const onSubmit = (data: CarFormValues) => {
    updateCar.mutate({ id, data }, {
      onSuccess: () => {
        toast({ title: "Véhicule mis à jour avec succès" });
        queryClient.invalidateQueries({ queryKey: getListCarsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetCarQueryKey(id) });
        setLocation("/admin/voitures");
      },
      onError: (error: any) => {
        toast({ title: "Erreur", description: error.message, variant: "destructive" });
      }
    });
  };

  if (isLoading) return <div className="p-6"><Skeleton className="h-[600px] w-full max-w-4xl mx-auto rounded-xl" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Link href="/admin/voitures">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Modifier le véhicule #{id}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Détails du véhicule</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="brand" render={({ field }) => (
                  <FormItem><FormLabel>Marque</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="model" render={({ field }) => (
                  <FormItem><FormLabel>Modèle</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="year" render={({ field }) => (
                  <FormItem><FormLabel>Année</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="city" render={({ field }) => (
                  <FormItem><FormLabel>Ville</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="licensePlate" render={({ field }) => (
                  <FormItem><FormLabel>Matricule (Optionnel)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="dailyPrice" render={({ field }) => (
                  <FormItem><FormLabel>Prix journalier (MAD)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />

                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Statut</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Sélectionnez" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="AVAILABLE">Disponible</SelectItem>
                        <SelectItem value="TEMPORARILY_HELD">En attente de paiement</SelectItem>
                        <SelectItem value="RESERVED">Réservée</SelectItem>
                        <SelectItem value="RENTED">Louée</SelectItem>
                        <SelectItem value="MAINTENANCE">En maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catégorie</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Sélectionnez" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="ECONOMY">Économique</SelectItem>
                        <SelectItem value="COMPACT">Compacte</SelectItem>
                        <SelectItem value="SEDAN">Berline</SelectItem>
                        <SelectItem value="SUV">SUV</SelectItem>
                        <SelectItem value="LUXURY">Luxe</SelectItem>
                        <SelectItem value="VAN">Van</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="fuelType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Carburant</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Sélectionnez" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="PETROL">Essence</SelectItem>
                        <SelectItem value="DIESEL">Diesel</SelectItem>
                        <SelectItem value="HYBRID">Hybride</SelectItem>
                        <SelectItem value="ELECTRIC">Électrique</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="transmission" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Boîte de vitesses</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Sélectionnez" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="MANUAL">Manuelle</SelectItem>
                        <SelectItem value="AUTOMATIC">Automatique</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="seats" render={({ field }) => (
                    <FormItem><FormLabel>Places</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="doors" render={({ field }) => (
                    <FormItem><FormLabel>Portes</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
              </div>

              <FormField control={form.control} name="mainImageUrl" render={({ field }) => (
                <FormItem><FormLabel>URL de l'image principale</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />

              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea className="h-32" {...field} /></FormControl><FormMessage /></FormItem>
              )} />

              <div className="flex justify-end gap-4 border-t pt-6">
                <Link href="/admin/voitures">
                  <Button variant="outline" type="button">Annuler</Button>
                </Link>
                <Button type="submit" disabled={updateCar.isPending}>
                  {updateCar.isPending ? "Enregistrement..." : "Enregistrer les modifications"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
