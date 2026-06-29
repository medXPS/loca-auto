import { useEffect, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  customFetch,
  useUpdateCar,
  useGetCar,
  getListCarsQueryKey,
  getGetCarQueryKey,
} from "@workspace/api-client-react";
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
import { ArrowLeft, ImagePlus, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { fetchAgencies, fetchBrands } from "@/lib/fleet-catalog";
import { uploadCarMedia } from "@/lib/car-media-upload";

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
  status: z.string().min(1, "Requis"),
  licensePlate: z.string().optional(),
  description: z.string().optional(),
  mainImageUrl: z.string().optional(),
});

type CarFormValues = z.infer<typeof carSchema>;

export default function AdminEditCar() {
  const [, adminParams] = useRoute("/admin/voitures/:id");
  const [, agentParams] = useRoute("/agent/voitures/:id");
  const params = adminParams ?? agentParams;
  const id = Number(params?.id);
  const [location, setLocation] = useLocation();
  const basePath = location.startsWith("/agent") ? "/agent" : "/admin";
  const { toast } = useToast();

  const { data: car, isLoading } = useGetCar(id, { query: { enabled: !!id, queryKey: getGetCarQueryKey(id) } });
  const { data: brands = [] } = useQuery({
    queryKey: ["brands"],
    queryFn: fetchBrands,
  });
  const { data: agencies = [] } = useQuery({
    queryKey: ["agencies"],
    queryFn: fetchAgencies,
  });
  const updateCar = useUpdateCar();
  const queryClient = useQueryClient();
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaAlt, setMediaAlt] = useState("");
  const [mediaType, setMediaType] = useState<"IMAGE" | "VIDEO" | "IMAGE_360">("IMAGE");
  const [sourceType, setSourceType] = useState<"URL" | "UPLOAD">("URL");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [isMainMedia, setIsMainMedia] = useState(false);
  const [isAddingMedia, setIsAddingMedia] = useState(false);

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
      status: "AVAILABLE",
      licensePlate: "",
      description: "",
      mainImageUrl: "",
    },
  });

  useEffect(() => {
    if (!car) return;

    const resolvedBrandId = (car as any).brandId ?? brands.find((brand) => brand.name.toLowerCase() === car.brand.toLowerCase())?.id;
    const resolvedAgencyId = (car as any).agencyId ?? agencies.find((agency) => agency.city.toLowerCase() === (car.city || "").toLowerCase())?.id;

    form.reset({
      brandId: resolvedBrandId,
      agencyId: resolvedAgencyId,
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
  }, [agencies, brands, car, form]);

  const selectedAgencyId = form.watch("agencyId");
  const selectedBrandId = form.watch("brandId");

  const onSubmit = (data: CarFormValues) => {
    updateCar.mutate({ id, data: data as any }, {
      onSuccess: () => {
        toast({ title: "Vehicule mis a jour avec succes" });
        queryClient.invalidateQueries({ queryKey: getListCarsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetCarQueryKey(id) });
        setLocation(`${basePath}/voitures`);
      },
      onError: (error: any) => {
        toast({ title: "Erreur", description: error.message, variant: "destructive" });
      },
    });
  };

  const refreshCar = () => {
    queryClient.invalidateQueries({ queryKey: getGetCarQueryKey(id) });
    queryClient.invalidateQueries({ queryKey: getListCarsQueryKey() });
  };

  const handleFileChange = (file?: File) => {
    if (!file) return;
    setMediaFile(file);
    setMediaUrl("");
    setSourceType("UPLOAD");
    setMediaType((current) =>
      file.type.startsWith("video/")
        ? "VIDEO"
        : current === "VIDEO"
          ? "IMAGE"
          : current,
    );
    if (file.type.startsWith("video/")) {
      setIsMainMedia(false);
    }
  };

  const handleAddMedia = async () => {
    const url = sourceType === "UPLOAD" ? "" : mediaUrl.trim();
    if (sourceType === "UPLOAD" ? !mediaFile : !url) {
      toast({ title: "Media requis", description: "Ajoutez une URL ou choisissez un fichier.", variant: "destructive" });
      return;
    }

    try {
      setIsAddingMedia(true);
      await uploadCarMedia(id, {
        url,
        file: sourceType === "UPLOAD" ? mediaFile : null,
        altText: mediaAlt || `${car?.brand ?? ""} ${car?.model ?? ""}`.trim(),
        isMain: isMainMedia && mediaType === "IMAGE",
        mediaType,
        sourceType,
        sortOrder: ((car as any)?.images?.length ?? 0) + 1,
      });
      toast({ title: "Media ajoute" });
      setMediaUrl("");
      setMediaAlt("");
      setMediaFile(null);
      setIsMainMedia(false);
      setSourceType("URL");
      refreshCar();
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setIsAddingMedia(false);
    }
  };

  const handleDeleteMedia = async (imageId: number) => {
    await customFetch(`/api/cars/${id}/images/${imageId}`, { method: "DELETE" });
    toast({ title: "Media supprime" });
    refreshCar();
  };

  if (isLoading) return <div className="p-6"><Skeleton className="h-[600px] w-full max-w-4xl mx-auto rounded-xl" /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Link href={`${basePath}/voitures`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Modifier le véhicule #{id}</h1>
          <p className="text-sm text-muted-foreground">Ajustez la marque, l'agence, les médias et la disponibilité depuis la même fiche.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Détails du véhicule</CardTitle>
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
                  <FormItem><FormLabel>Marque affichee</FormLabel><FormControl><Input {...field} disabled={Boolean(selectedBrandId)} className={selectedBrandId ? "bg-muted" : ""} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="model" render={({ field }) => (
                  <FormItem><FormLabel>Modèle</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="year" render={({ field }) => (
                  <FormItem><FormLabel>Annee</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="city" render={({ field }) => (
                  <FormItem><FormLabel>Ville</FormLabel><FormControl><Input {...field} disabled={Boolean(selectedAgencyId)} className={selectedAgencyId ? "bg-muted" : ""} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="licensePlate" render={({ field }) => (
                  <FormItem><FormLabel>Matricule (optionnel)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="dailyPrice" render={({ field }) => (
                  <FormItem><FormLabel>Prix journalier (MAD)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />

                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Statut</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selectionnez" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="AVAILABLE">Disponible</SelectItem>
                        <SelectItem value="TEMPORARILY_HELD">En attente de paiement</SelectItem>
                        <SelectItem value="RESERVED">Réservée</SelectItem>
                        <SelectItem value="RENTED">Louee</SelectItem>
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
                    <Select onValueChange={field.onChange} value={field.value}>
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
                    <Select onValueChange={field.onChange} value={field.value}>
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
                <FormItem><FormLabel>URL de l'image principale</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />

              <Card className="border-primary/10 bg-muted/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ImagePlus className="h-5 w-5 text-primary" />
                    Images, videos et vues 360
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select value={mediaType} onValueChange={(value) => setMediaType(value as typeof mediaType)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="IMAGE">Image</SelectItem>
                          <SelectItem value="VIDEO">Video</SelectItem>
                          <SelectItem value="IMAGE_360">Image 360</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Source</Label>
                      <Select
                        value={sourceType}
                        onValueChange={(value) => {
                          const nextSourceType = value as typeof sourceType;
                          setSourceType(nextSourceType);
                          if (nextSourceType === "URL") {
                            setMediaFile(null);
                          } else {
                            setMediaUrl("");
                          }
                        }}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="URL">URL</SelectItem>
                          <SelectItem value="UPLOAD">Fichier local</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Texte alternatif</Label>
                      <Input value={mediaAlt} onChange={(event) => setMediaAlt(event.target.value)} placeholder="Ex: interieur, profil..." />
                    </div>
                  </div>

                  {sourceType === "URL" ? (
                    <Input value={mediaUrl} onChange={(event) => setMediaUrl(event.target.value)} placeholder="https://..." />
                  ) : (
                    <div className="space-y-2">
                      <Input type="file" accept="image/*,video/*" onChange={(event) => handleFileChange(event.target.files?.[0])} />
                      {mediaFile && (
                        <p className="text-xs text-muted-foreground">
                          Fichier choisi : {mediaFile.name}
                        </p>
                      )}
                    </div>
                  )}

                  <label className="flex items-center gap-2 text-sm text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={isMainMedia}
                      onChange={(event) => setIsMainMedia(event.target.checked)}
                      disabled={mediaType !== "IMAGE"}
                    />
                    Utiliser comme image principale
                  </label>

                  <div className="flex justify-end">
                    <Button type="button" onClick={handleAddMedia} disabled={isAddingMedia}>
                      {isAddingMedia ? "Ajout..." : "Ajouter le media"}
                    </Button>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    {((car as any)?.images ?? []).map((media: any) => (
                      <div key={media.id} className="flex gap-3 rounded-xl border bg-background p-3">
                        <div className="h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-muted">
                          {media.mediaType === "VIDEO" ? (
                            <video src={media.url} className="h-full w-full object-cover" muted />
                          ) : (
                            <img src={media.url} alt={media.altText || "media"} className="h-full w-full object-cover" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 text-xs font-semibold uppercase text-primary">
                            <span>{media.mediaType || "IMAGE"}</span>
                            <span>{media.sourceType || "URL"}</span>
                            {media.isMain && <span>Principal</span>}
                          </div>
                          <p className="mt-1 truncate text-sm text-muted-foreground">{media.altText || media.url}</p>
                        </div>
                        <Button type="button" variant="ghost" size="icon" onClick={() => handleDeleteMedia(media.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea className="h-32" {...field} /></FormControl><FormMessage /></FormItem>
              )} />

              <div className="flex justify-end gap-4 border-t pt-6">
                <Link href={`${basePath}/voitures`}>
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
