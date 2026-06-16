import { Link, useLocation } from "wouter";
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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { fetchAgencies, fetchBrands } from "@/lib/fleet-catalog";

const NO_VALUE = "__none__";

const carSchema = z.object({
  brandId: z.coerce.number().optional(),
  agencyId: z.coerce.number().optional(),
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
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const createCar = useCreateCar();
  const queryClient = useQueryClient();
  const basePath = location.startsWith("/agent") ? "/agent" : "/admin";

  const { data: brands = [] } = useQuery({
    queryKey: ["brands"],
    queryFn: fetchBrands,
  });
  const { data: agencies = [] } = useQuery({
    queryKey: ["agencies"],
    queryFn: fetchAgencies,
  });

  const form = useForm<CarFormValues>({
    resolver: zodResolver(carSchema),
    defaultValues: {
      brandId: undefined,
      agencyId: undefined,
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

  const selectedAgencyId = form.watch("agencyId");
  const selectedBrandId = form.watch("brandId");

  const onSubmit = (data: CarFormValues) => {
    createCar.mutate({ data: data as any }, {
      onSuccess: () => {
        toast({ title: "Vehicule ajoute avec succes" });
        queryClient.invalidateQueries({ queryKey: getListCarsQueryKey() });
        setLocation(`${basePath}/voitures`);
      },
      onError: (error: any) => {
        toast({ title: "Erreur", description: error.message, variant: "destructive" });
      },
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Link href={`${basePath}/voitures`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ajouter un vehicule</h1>
          <p className="text-sm text-muted-foreground">Rattachez la voiture a une agence et, si possible, a une marque du catalogue.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details du vehicule</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="brandId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marque catalogue</FormLabel>
                      <Select
                        value={field.value ? String(field.value) : NO_VALUE}
                        onValueChange={(value) => {
                          const nextId = value === NO_VALUE ? undefined : Number(value);
                          field.onChange(nextId);
                          const selected = brands.find((brand) => brand.id === nextId);
                          if (selected) {
                            form.setValue("brand", selected.name, { shouldValidate: true });
                          }
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choisir une marque" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={NO_VALUE}>Aucune</SelectItem>
                          {brands.map((brand) => (
                            <SelectItem key={brand.id} value={String(brand.id)}>
                              {brand.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="agencyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Agence</FormLabel>
                      <Select
                        value={field.value ? String(field.value) : NO_VALUE}
                        onValueChange={(value) => {
                          const nextId = value === NO_VALUE ? undefined : Number(value);
                          field.onChange(nextId);
                          const selected = agencies.find((agency) => agency.id === nextId);
                          if (selected) {
                            form.setValue("city", selected.city, { shouldValidate: true });
                          }
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choisir une agence" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={NO_VALUE}>Aucune</SelectItem>
                          {agencies.map((agency) => (
                            <SelectItem key={agency.id} value={String(agency.id)}>
                              {agency.name} - {agency.city}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField control={form.control} name="brand" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marque affichee</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Renault" {...field} disabled={Boolean(selectedBrandId)} className={selectedBrandId ? "bg-muted" : ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="model" render={({ field }) => (
                  <FormItem><FormLabel>Modele</FormLabel><FormControl><Input placeholder="Ex: Clio" {...field} /></FormControl><FormMessage /></FormItem>
                )} />

                <FormField control={form.control} name="year" render={({ field }) => (
                  <FormItem><FormLabel>Annee</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />

                <FormField control={form.control} name="city" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ville</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Casablanca" {...field} disabled={Boolean(selectedAgencyId)} className={selectedAgencyId ? "bg-muted" : ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="licensePlate" render={({ field }) => (
                  <FormItem><FormLabel>Matricule (optionnel)</FormLabel><FormControl><Input placeholder="Ex: 12345 | A | 1" {...field} /></FormControl><FormMessage /></FormItem>
                )} />

                <FormField control={form.control} name="dailyPrice" render={({ field }) => (
                  <FormItem><FormLabel>Prix journalier (MAD)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />

                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categorie</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selectionnez" /></SelectTrigger></FormControl>
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
                      <FormControl><SelectTrigger><SelectValue placeholder="Selectionnez" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="ESSENCE">Essence</SelectItem>
                        <SelectItem value="DIESEL">Diesel</SelectItem>
                        <SelectItem value="HYBRIDE">Hybride</SelectItem>
                        <SelectItem value="ELECTRIQUE">Electrique</SelectItem>
                        <SelectItem value="GPL">GPL</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="transmission" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Boite de vitesses</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selectionnez" /></SelectTrigger></FormControl>
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
                <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Description du vehicule..." className="h-32" {...field} /></FormControl><FormMessage /></FormItem>
              )} />

              <div className="flex justify-end gap-4 border-t pt-6">
                <Link href={`${basePath}/voitures`}>
                  <Button variant="outline" type="button">Annuler</Button>
                </Link>
                <Button type="submit" disabled={createCar.isPending}>
                  {createCar.isPending ? "Creation..." : "Creer le vehicule"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
