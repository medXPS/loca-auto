import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  getListCarsQueryKey,
  useCreateCar,
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
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ImagePlus, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { fetchAgencies, fetchBrands } from "@/lib/fleet-catalog";
import { uploadCarMedia } from "@/lib/car-media-upload";

const NO_VALUE = "__none__";

type MediaType = "IMAGE" | "VIDEO" | "IMAGE_360";
type MediaSourceType = "URL" | "UPLOAD";

type MediaDraft = {
  id: string;
  mediaType: MediaType;
  sourceType: MediaSourceType;
  url: string;
  file: File | null;
  altText: string;
  isMain: boolean;
};

function createMediaDraft(overrides: Partial<MediaDraft> = {}): MediaDraft {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    mediaType: "IMAGE",
    sourceType: "URL",
    url: "",
    file: null,
    altText: "",
    isMain: false,
    ...overrides,
  };
}

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
  depositAmount: z.coerce.number().min(0),
  city: z.string().min(1, "Requis"),
  licensePlate: z.string().optional(),
  description: z.string().optional(),
});

type CarFormValues = z.infer<typeof carSchema>;

export default function AdminNewCar() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const createCar = useCreateCar();
  const queryClient = useQueryClient();
  const basePath = location.startsWith("/agent") ? "/agent" : "/admin";
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [mediaItems, setMediaItems] = useState<MediaDraft[]>([
    createMediaDraft({ isMain: true }),
  ]);

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
      depositAmount: 0,
      city: "Casablanca",
      licensePlate: "",
      description: "",
    },
  });

  const selectedAgencyId = form.watch("agencyId");
  const selectedBrandId = form.watch("brandId");

  const setMediaField = (
    id: string,
    updater: (item: MediaDraft) => MediaDraft,
  ) => {
    setMediaItems((items) =>
      items.map((item) => (item.id === id ? updater(item) : item)),
    );
  };

  const handleMediaFileChange = (id: string, file?: File) => {
    if (!file) return;

    setMediaField(id, (item) => ({
      ...item,
      sourceType: "UPLOAD",
      file,
      url: "",
      mediaType: file.type.startsWith("video/")
        ? "VIDEO"
        : item.mediaType === "VIDEO"
          ? "IMAGE"
          : item.mediaType,
      isMain: file.type.startsWith("video/") ? false : item.isMain,
    }));
  };

  const handleMediaTypeChange = (id: string, mediaType: MediaType) => {
    setMediaField(id, (item) => ({
      ...item,
      mediaType,
      isMain: mediaType === "IMAGE" ? item.isMain : false,
    }));
  };

  const handleMainToggle = (id: string, checked: boolean) => {
    setMediaItems((items) =>
      items.map((item) => ({
        ...item,
        isMain: checked ? item.id === id : item.id === id ? false : item.isMain,
      })),
    );
  };

  const addMediaItem = () => {
    setMediaItems((items) => [...items, createMediaDraft()]);
  };

  const removeMediaItem = (id: string) => {
    setMediaItems((items) => {
      const nextItems = items.filter((item) => item.id !== id);
      if (nextItems.length === 0) {
        return [createMediaDraft({ isMain: true })];
      }

      if (
        !nextItems.some((item) => item.isMain && item.mediaType === "IMAGE")
      ) {
        const firstImage = nextItems.find((item) => item.mediaType === "IMAGE");
        if (firstImage) {
          return nextItems.map((item) => ({
            ...item,
            isMain: item.id === firstImage.id,
          }));
        }
      }

      return nextItems;
    });
  };

  const onSubmit = async (data: CarFormValues) => {
    try {
      const normalizedMedia = mediaItems
        .map((item) => ({
          ...item,
          url:
            item.sourceType === "UPLOAD"
              ? ""
              : item.url.trim(),
          altText: item.altText.trim(),
        }))
        .filter((item) =>
          item.sourceType === "UPLOAD" ? Boolean(item.file) : item.url.length > 0,
        );

      const mainMedia =
        normalizedMedia.find(
          (item) =>
            item.isMain &&
            item.mediaType === "IMAGE" &&
            item.sourceType === "URL",
        ) ??
        normalizedMedia.find(
          (item) => item.mediaType === "IMAGE" && item.sourceType === "URL",
        ) ??
        null;

      const payload = {
        ...data,
        mainImageUrl: mainMedia?.url,
      };

      const createdCar = await createCar.mutateAsync({ data: payload as any });

      setIsUploadingMedia(true);
      const uploadResults = await Promise.allSettled(
        normalizedMedia.map((item, index) =>
          uploadCarMedia(createdCar.id, {
            url: item.url,
            file: item.sourceType === "UPLOAD" ? item.file : null,
            altText:
              item.altText ||
              `${createdCar.brand ?? data.brand} ${createdCar.model ?? data.model}`.trim(),
            isMain: item.isMain && item.mediaType === "IMAGE",
            sortOrder: index + 1,
            mediaType: item.mediaType,
            sourceType: item.sourceType,
          }),
        ),
      );

      const failedUploads = uploadResults.filter(
        (result) => result.status === "rejected",
      ).length;

      await queryClient.invalidateQueries({ queryKey: getListCarsQueryKey() });

      toast(
        failedUploads > 0
          ? {
              title: "Vehicule ajoute",
              description: `${failedUploads} média(s) n'ont pas pu être ajoutés. Vous pourrez les compléter depuis la fiche du véhicule.`,
            }
          : { title: "Vehicule ajoute avec succes" },
      );

      setLocation(`${basePath}/voitures`);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploadingMedia(false);
    }
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
          <h1 className="text-2xl font-bold tracking-tight">
            Ajouter un véhicule
          </h1>
          <p className="text-sm text-muted-foreground">
            Rattachez la voiture a une agence et, si possible, a une marque du
            catalogue.
          </p>
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
                          const nextId =
                            value === NO_VALUE ? undefined : Number(value);
                          field.onChange(nextId);
                          const selected = brands.find(
                            (brand) => brand.id === nextId,
                          );
                          if (selected) {
                            form.setValue("brand", selected.name, {
                              shouldValidate: true,
                            });
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
                          const nextId =
                            value === NO_VALUE ? undefined : Number(value);
                          field.onChange(nextId);
                          const selected = agencies.find(
                            (agency) => agency.id === nextId,
                          );
                          if (selected) {
                            form.setValue("city", selected.city, {
                              shouldValidate: true,
                            });
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
                            <SelectItem
                              key={agency.id}
                              value={String(agency.id)}
                            >
                              {agency.name} - {agency.city}
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
                  name="brand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marque affichee</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Renault"
                          {...field}
                          disabled={Boolean(selectedBrandId)}
                          className={selectedBrandId ? "bg-muted" : ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Modèle</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Clio" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Annee</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ville</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Casablanca"
                          {...field}
                          disabled={Boolean(selectedAgencyId)}
                          className={selectedAgencyId ? "bg-muted" : ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="licensePlate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Matricule (optionnel)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 12345 | A | 1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dailyPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prix journalier (MAD)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          value={field.value ?? ""}
                          onChange={(event) =>
                            field.onChange(
                              event.target.value === ""
                                ? 0
                                : Number.isNaN(event.target.valueAsNumber)
                                  ? 0
                                  : event.target.valueAsNumber,
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="depositAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Caution remboursable (MAD)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          value={field.value ?? ""}
                          onChange={(event) =>
                            field.onChange(
                              event.target.value === ""
                                ? 0
                                : Number.isNaN(event.target.valueAsNumber)
                                  ? 0
                                  : event.target.valueAsNumber,
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Catégorie</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selectionnez" />
                          </SelectTrigger>
                        </FormControl>
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
                  )}
                />

                <FormField
                  control={form.control}
                  name="fuelType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Carburant</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selectionnez" />
                          </SelectTrigger>
                        </FormControl>
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
                  )}
                />

                <FormField
                  control={form.control}
                  name="transmission"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Boite de vitesses</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selectionnez" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="MANUELLE">Manuelle</SelectItem>
                          <SelectItem value="AUTOMATIQUE">
                            Automatique
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="seats"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Places</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="doors"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Portes</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Card className="border-primary/10 bg-muted/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ImagePlus className="h-5 w-5 text-primary" />
                    Médias du véhicule
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Ajoutez une image principale, puis autant d'images, de
                    videos ou de vues 360 que vous voulez. Le premier media
                    image sera utilise comme couverture si aucun media principal
                    n'est selectionne.
                  </p>

                  <div className="space-y-4">
                    {mediaItems.map((media, index) => (
                      <div
                        key={media.id}
                        className="rounded-2xl border border-border/70 bg-background p-4 shadow-sm"
                      >
                        <div className="mb-4 flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              Media #{index + 1}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {media.isMain && media.mediaType === "IMAGE"
                                ? "Image principale"
                                : "Media supplementaire"}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeMediaItem(media.id)}
                            aria-label={`Supprimer le media ${index + 1}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                          <div className="space-y-2">
                            <Label>Type</Label>
                            <Select
                              value={media.mediaType}
                              onValueChange={(value) =>
                                handleMediaTypeChange(
                                  media.id,
                                  value as MediaType,
                                )
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="IMAGE">Image</SelectItem>
                                <SelectItem value="VIDEO">Video</SelectItem>
                                <SelectItem value="IMAGE_360">
                                  Image 360
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Source</Label>
                            <Select
                              value={media.sourceType}
                              onValueChange={(value) =>
                                setMediaField(media.id, (item) => ({
                                  ...item,
                                  sourceType: value as MediaSourceType,
                                  url: value === "URL" ? item.url : "",
                                  file: value === "UPLOAD" ? item.file : null,
                                }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="URL">URL</SelectItem>
                                <SelectItem value="UPLOAD">
                                  Fichier local
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Texte alternatif</Label>
                            <Input
                              value={media.altText}
                              onChange={(event) =>
                                setMediaField(media.id, (item) => ({
                                  ...item,
                                  altText: event.target.value,
                                }))
                              }
                              placeholder="Ex: interieur, profil..."
                            />
                          </div>
                        </div>

                        <div className="mt-4 space-y-2">
                          <Label>
                            {media.sourceType === "UPLOAD" ? "Fichier" : "URL"}
                          </Label>
                          {media.sourceType === "UPLOAD" ? (
                            <div className="space-y-2">
                              <Input
                                type="file"
                                accept="image/*,video/*"
                                onChange={(event) =>
                                  handleMediaFileChange(
                                    media.id,
                                    event.target.files?.[0],
                                  )
                                }
                              />
                              {media.file && (
                                <p className="text-xs text-muted-foreground">
                                  Fichier choisi : {media.file.name}
                                </p>
                              )}
                            </div>
                          ) : (
                            <Input
                              value={media.url}
                              onChange={(event) =>
                                setMediaField(media.id, (item) => ({
                                  ...item,
                                  url: event.target.value,
                                }))
                              }
                              placeholder="https://..."
                            />
                          )}
                        </div>

                        <label className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                          <input
                            type="checkbox"
                            checked={media.isMain}
                            onChange={(event) =>
                              handleMainToggle(media.id, event.target.checked)
                            }
                            disabled={media.mediaType !== "IMAGE"}
                          />
                          Utiliser comme image principale
                        </label>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addMediaItem}
                    >
                      <ImagePlus className="mr-2 h-4 w-4" />
                      Ajouter un media
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Description du véhicule..."
                        className="h-32"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-4 border-t pt-6">
                <Link href={`${basePath}/voitures`}>
                  <Button variant="outline" type="button">
                    Annuler
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={createCar.isPending || isUploadingMedia}
                >
                  {createCar.isPending || isUploadingMedia
                    ? "Creation..."
                    : "Créer le véhicule"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
