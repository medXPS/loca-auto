import { useLocation, useRoute } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { customFetch, useUpdateCar, useGetCar, useUploadCarImage, getListCarsQueryKey, getGetCarQueryKey } from "@workspace/api-client-react";
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
import { ArrowLeft, ImagePlus, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";

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
  const uploadMedia = useUploadCarImage();
  const queryClient = useQueryClient();
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaAlt, setMediaAlt] = useState("");
  const [mediaType, setMediaType] = useState<"IMAGE" | "VIDEO" | "IMAGE_360">("IMAGE");
  const [sourceType, setSourceType] = useState<"URL" | "UPLOAD">("URL");
  const [mediaFileData, setMediaFileData] = useState("");
  const [isMainMedia, setIsMainMedia] = useState(false);

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

  const refreshCar = () => {
    queryClient.invalidateQueries({ queryKey: getGetCarQueryKey(id) });
    queryClient.invalidateQueries({ queryKey: getListCarsQueryKey() });
  };

  const handleFileChange = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setMediaFileData(String(reader.result));
      setMediaUrl("");
      setSourceType("UPLOAD");
      if (file.type.startsWith("video/")) setMediaType("VIDEO");
    };
    reader.readAsDataURL(file);
  };

  const handleAddMedia = () => {
    const url = sourceType === "UPLOAD" ? mediaFileData : mediaUrl.trim();
    if (!url) {
      toast({ title: "Media requis", description: "Ajoutez une URL ou choisissez un fichier.", variant: "destructive" });
      return;
    }

    uploadMedia.mutate({
      id,
      data: {
        url,
        altText: mediaAlt || `${car?.brand ?? ""} ${car?.model ?? ""}`.trim(),
        isMain: isMainMedia && mediaType === "IMAGE",
        mediaType,
        sourceType,
        sortOrder: (car?.images?.length ?? 0) + 1,
      } as any,
    }, {
      onSuccess: () => {
        toast({ title: "Media ajoute" });
        setMediaUrl("");
        setMediaAlt("");
        setMediaFileData("");
        setIsMainMedia(false);
        setSourceType("URL");
        refreshCar();
      },
      onError: (error: any) => {
        toast({ title: "Erreur", description: error.message, variant: "destructive" });
      },
    });
  };

  const handleDeleteMedia = async (imageId: number) => {
    await customFetch(`/api/cars/${id}/images/${imageId}`, { method: "DELETE" });
    toast({ title: "Media supprime" });
    refreshCar();
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
                    <Select onValueChange={field.onChange} value={field.value}>
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
                      <FormLabel>Type</FormLabel>
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
                      <FormLabel>Source</FormLabel>
                      <Select value={sourceType} onValueChange={(value) => setSourceType(value as typeof sourceType)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="URL">URL</SelectItem>
                          <SelectItem value="UPLOAD">Fichier local</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <FormLabel>Texte alternatif</FormLabel>
                      <Input value={mediaAlt} onChange={(event) => setMediaAlt(event.target.value)} placeholder="Ex: interieur, profil..." />
                    </div>
                  </div>

                  {sourceType === "URL" ? (
                    <Input value={mediaUrl} onChange={(event) => setMediaUrl(event.target.value)} placeholder="https://..." />
                  ) : (
                    <Input type="file" accept="image/*,video/*" onChange={(event) => handleFileChange(event.target.files?.[0])} />
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
                    <Button type="button" onClick={handleAddMedia} disabled={uploadMedia.isPending}>
                      {uploadMedia.isPending ? "Ajout..." : "Ajouter le media"}
                    </Button>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    {(car?.images ?? []).map((media: any) => (
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
