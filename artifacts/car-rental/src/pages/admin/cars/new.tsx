import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateCar, getListCarsQueryKey } from "@workspace/api-client-react";
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
  licensePlate: z.string().optional(),
  description: z.string().optional(),
  mainImageUrl: z.string().optional(),
});

type CarFormValues = z.infer<typeof carSchema>;

export default function AdminNewCar() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createCar = useCreateCar();
  const queryClient = useQueryClient();

  const form = useForm<CarFormValues>({
    resolver: zodResolver(carSchema),
    defaultValues: {
      brand: "",
      model: "",
      year: new Date().getFullYear(),
      category: "CITADINE",
      fuelType: "ESSENCE",
      transmission: "MANUELLE",
      seats: 5,
      doors: 4,
      dailyPrice: 200,
      city: "Casablanca",
      licensePlate: "",
      description: "",
      mainImageUrl: "",
    },
  });

  const onSubmit = (data: CarFormValues) => {
    createCar.mutate({ data }, {
      onSuccess: () => {
        toast({ title: "Véhicule ajouté avec succès" });
        queryClient.invalidateQueries({ queryKey: getListCarsQueryKey() });
        setLocation("/admin/voitures");
      },
      onError: (error: any) => {
        toast({ title: "Erreur", description: error.message, variant: "destructive" });
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Link href="/admin/voitures">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Ajouter un véhicule</h1>
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
                  <FormItem><FormLabel>Marque</FormLabel><FormControl><Input placeholder="Ex: Renault" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="model" render={({ field }) => (
                  <FormItem><FormLabel>Modèle</FormLabel><FormControl><Input placeholder="Ex: Clio" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="year" render={({ field }) => (
                  <FormItem><FormLabel>Année</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="city" render={({ field }) => (
                  <FormItem><FormLabel>Ville</FormLabel><FormControl><Input placeholder="Ex: Casablanca" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="licensePlate" render={({ field }) => (
                  <FormItem><FormLabel>Matricule (Optionnel)</FormLabel><FormControl><Input placeholder="Ex: 12345 | A | 1" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="dailyPrice" render={({ field }) => (
                  <FormItem><FormLabel>Prix journalier (MAD)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />

                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catégorie</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Sélectionnez" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="CITADINE">Citadine</SelectItem>
                        <SelectItem value="BERLINE">Berline</SelectItem>
                        <SelectItem value="SUV">SUV</SelectItem>
                        <SelectItem value="MONOSPACE">Monospace</SelectItem>
                        <SelectItem value="UTILITAIRE">Utilitaire</SelectItem>
                        <SelectItem value="LUXE">Luxe</SelectItem>
                        <SelectItem value="SPORT">Sport</SelectItem>
                        <SelectItem value="4X4">4x4</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="fuelType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Carburant</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Sélectionnez" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="ESSENCE">Essence</SelectItem>
                        <SelectItem value="DIESEL">Diesel</SelectItem>
                        <SelectItem value="HYBRIDE">Hybride</SelectItem>
                        <SelectItem value="ELECTRIQUE">Électrique</SelectItem>
                        <SelectItem value="GPL">GPL</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="transmission" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Boîte de vitesses</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Sélectionnez" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="MANUELLE">Manuelle</SelectItem>
                        <SelectItem value="AUTOMATIQUE">Automatique</SelectItem>
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
                <FormItem><FormLabel>URL de l'image principale</FormLabel><FormControl><Input placeholder="https://..." {...field} /></FormControl><FormMessage /></FormItem>
              )} />

              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Description du véhicule..." className="h-32" {...field} /></FormControl><FormMessage /></FormItem>
              )} />

              <div className="flex justify-end gap-4 border-t pt-6">
                <Link href="/admin/voitures">
                  <Button variant="outline" type="button">Annuler</Button>
                </Link>
                <Button type="submit" disabled={createCar.isPending}>
                  {createCar.isPending ? "Création..." : "Créer le véhicule"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
