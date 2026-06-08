import { useRoute } from "wouter";
import { useGetCar, useCreateRentalRequest, getGetCarQueryKey, useGetCarAvailability, getGetCarAvailabilityQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { Users, Fuel, Settings2, DoorClosed, MapPin, CheckCircle, Info, ChevronLeft, ChevronRight, CalendarX, ImageIcon } from "lucide-react";
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
import { useEffect, useState, useCallback } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { fr } from "date-fns/locale";
import type { AvailabilityBlock } from "@workspace/api-client-react";

const requestSchema = z.object({
  fullName: z.string().min(2, { message: "Nom requis" }),
  phone: z.string().min(10, { message: "Téléphone requis" }),
  email: z.string().email({ message: "Email invalide" }),
  startDate: z.string().min(1, { message: "Date de départ requise" }),
  returnDate: z.string().min(1, { message: "Date de retour requise" }),
});

function isDateBlocked(date: Date, blocks: AvailabilityBlock[]): boolean {
  const d = date.getTime();
  return blocks.some((block) => {
    const start = new Date(block.startDate).getTime();
    const end = new Date(block.endDate).getTime();
    return d >= start && d <= end;
  });
}

function doesRangeOverlapBlocked(startStr: string, endStr: string, blocks: AvailabilityBlock[]): boolean {
  const start = new Date(startStr).getTime();
  const end = new Date(endStr).getTime();
  return blocks.some((block) => {
    const bStart = new Date(block.startDate).getTime();
    const bEnd = new Date(block.endDate).getTime();
    return start <= bEnd && end >= bStart;
  });
}

function PhotoGallery({ images, mainImageUrl, brand, model }: {
  images: { id: number; url: string; altText?: string | null }[];
  mainImageUrl?: string | null;
  brand: string;
  model: string;
}) {
  const allImages = images.length > 0 ? images : (mainImageUrl ? [{ id: 0, url: mainImageUrl, altText: null }] : []);
  const [current, setCurrent] = useState(0);

  const prev = useCallback(() => setCurrent((c) => (c - 1 + allImages.length) % allImages.length), [allImages.length]);
  const next = useCallback(() => setCurrent((c) => (c + 1) % allImages.length), [allImages.length]);

  if (allImages.length === 0) {
    return (
      <div className="relative aspect-video rounded-2xl overflow-hidden bg-muted flex items-center justify-center text-muted-foreground flex-col gap-2">
        <ImageIcon className="w-12 h-12 opacity-40" />
        <span>Aucune image disponible</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-video rounded-2xl overflow-hidden bg-muted group">
        <img
          src={allImages[current].url}
          alt={allImages[current].altText || `${brand} ${model}`}
          className="w-full h-full object-cover transition-opacity duration-300"
        />
        {allImages.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Image précédente"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Image suivante"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {allImages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`w-2 h-2 rounded-full transition-all ${i === current ? "bg-white w-4" : "bg-white/60"}`}
                  aria-label={`Image ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
        {allImages.length > 1 && (
          <div className="absolute top-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
            {current + 1} / {allImages.length}
          </div>
        )}
      </div>

      {allImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {allImages.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setCurrent(i)}
              className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${i === current ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"}`}
            >
              <img src={img.url} alt={img.altText || `${brand} ${model} ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AvailabilityCalendar({ blocks, isLoading }: { blocks: AvailabilityBlock[]; isLoading: boolean }) {
  const disabledDays = blocks.map((b) => ({
    from: new Date(b.startDate),
    to: new Date(b.endDate),
  }));

  const today = new Date();

  if (isLoading) {
    return <Skeleton className="h-64 w-full rounded-xl" />;
  }

  return (
    <div className="border rounded-xl p-4 bg-muted/20">
      <div className="flex items-center gap-2 mb-3">
        <CalendarX className="w-5 h-5 text-muted-foreground" />
        <h3 className="font-semibold">Disponibilité</h3>
      </div>
      {blocks.length === 0 ? (
        <p className="text-sm text-muted-foreground mb-3">Ce véhicule est entièrement disponible.</p>
      ) : (
        <p className="text-sm text-muted-foreground mb-3">Les dates en rouge sont déjà réservées.</p>
      )}
      <DayPicker
        locale={fr}
        mode="single"
        disabled={[{ before: today }, ...disabledDays]}
        modifiers={{ booked: disabledDays }}
        modifiersClassNames={{ booked: "rdp-day--booked" }}
        classNames={{
          root: "!font-sans !text-sm",
        }}
        styles={{
          month: { width: "100%" },
        }}
      />
      <style>{`
        .rdp-day--booked:not(.rdp-day_disabled) { background-color: rgb(254 226 226); color: rgb(185 28 28); border-radius: 4px; }
        .rdp-day_disabled { opacity: 0.4; }
      `}</style>
      {blocks.length > 0 && (
        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
          <span className="w-3 h-3 rounded bg-red-100 border border-red-300 inline-block" />
          <span>Dates indisponibles</span>
        </div>
      )}
    </div>
  );
}

export default function CarDetail() {
  const [, params] = useRoute("/voitures/:id");
  const id = Number(params?.id);
  const { data: car, isLoading } = useGetCar(id, { query: { enabled: !!id, queryKey: getGetCarQueryKey(id) } });
  const { data: availabilityBlocks = [], isLoading: isLoadingAvailability } = useGetCarAvailability(id, { query: { enabled: !!id, queryKey: getGetCarAvailabilityQueryKey(id) } });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const createRequest = useCreateRentalRequest();

  const [days, setDays] = useState(1);
  const [dateError, setDateError] = useState<string | null>(null);

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
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) {
        setDateError("La date de retour doit être après la date de départ.");
        setDays(1);
        return;
      }

      if (doesRangeOverlapBlocked(startDate, returnDate, availabilityBlocks)) {
        setDateError("La période sélectionnée contient des dates indisponibles. Veuillez choisir d'autres dates.");
        setDays(diffDays);
        return;
      }

      setDateError(null);
      setDays(diffDays);
    }
  }, [startDate, returnDate, availabilityBlocks]);

  const estimatedPrice = car
    ? days >= 7 && car.weeklyPrice
      ? Math.floor(days / 7) * car.weeklyPrice + (days % 7) * car.dailyPrice
      : days * car.dailyPrice
    : 0;

  const today = new Date().toISOString().split("T")[0];

  const onSubmit = (values: z.infer<typeof requestSchema>) => {
    if (!isAuthenticated) {
      toast({
        title: "Connexion requise",
        description: "Veuillez vous connecter pour envoyer une demande de location",
      });
      setLocation("/connexion");
      return;
    }

    if (dateError) {
      toast({
        title: "Dates invalides",
        description: dateError,
        variant: "destructive",
      });
      return;
    }

    if (doesRangeOverlapBlocked(values.startDate, values.returnDate, availabilityBlocks)) {
      toast({
        title: "Dates indisponibles",
        description: "La période sélectionnée contient des dates déjà réservées.",
        variant: "destructive",
      });
      return;
    }

    createRequest.mutate(
      {
        data: {
          ...values,
          carId: id,
          estimatedTotalPrice: estimatedPrice,
        },
      },
      {
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
        },
      }
    );
  };

  if (isLoading)
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  if (!car)
    return (
      <div className="container mx-auto px-4 py-8 text-center">Voiture introuvable</div>
    );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="relative">
            <PhotoGallery
              images={car.images || []}
              mainImageUrl={car.mainImageUrl}
              brand={car.brand}
              model={car.model}
            />
            <div className="absolute top-4 left-4 z-10">
              <StatusBadge status={car.status} type="car" className="text-sm px-3 py-1" />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-serif font-bold">
                  {car.brand} {car.model}
                </h1>
                <p className="text-xl text-muted-foreground mt-1">
                  {car.year} • {car.category}
                </p>
              </div>
              <div className="text-right bg-primary/5 p-4 rounded-xl border border-primary/20">
                <p className="text-3xl font-bold text-primary">{formatPrice(car.dailyPrice)}</p>
                <p className="text-sm text-muted-foreground">/jour</p>
                {car.weeklyPrice && (
                  <p className="text-xs text-muted-foreground mt-1">{formatPrice(car.weeklyPrice)}/sem.</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6 border-y my-6">
              <div className="flex flex-col items-center justify-center p-4 bg-muted/30 rounded-xl">
                <Settings2 className="w-6 h-6 text-muted-foreground mb-2" />
                <span className="font-medium text-sm text-center">
                  {car.transmission === "AUTOMATIC" ? "Automatique" : "Manuelle"}
                </span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-muted/30 rounded-xl">
                <Fuel className="w-6 h-6 text-muted-foreground mb-2" />
                <span className="font-medium text-sm">{car.fuelType}</span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-muted/30 rounded-xl">
                <Users className="w-6 h-6 text-muted-foreground mb-2" />
                <span className="font-medium text-sm">{car.seats} places</span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-muted/30 rounded-xl">
                <DoorClosed className="w-6 h-6 text-muted-foreground mb-2" />
                <span className="font-medium text-sm">{car.doors} portes</span>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold">Description</h3>
              <p className="text-muted-foreground leading-relaxed">
                {car.description ||
                  "Aucune description fournie pour ce véhicule. Il est cependant entretenu selon les normes les plus strictes pour assurer votre sécurité et votre confort lors de vos déplacements au Maroc."}
              </p>
            </div>

            <div className="mt-8 space-y-4">
              <h3 className="text-xl font-bold">Équipements & Conditions</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span>Climatisation : {car.airConditioning ? "Oui" : "Non"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span>Assurance incluse : {car.insuranceIncluded ? "Oui" : "Standard"}</span>
                </div>
                {car.mileageLimit && (
                  <div className="flex items-center gap-2">
                    <Info className="w-5 h-5 text-blue-500 shrink-0" />
                    <span>Limite km : {car.mileageLimit} km/jour</span>
                  </div>
                )}
                {car.depositAmount && (
                  <div className="flex items-center gap-2">
                    <Info className="w-5 h-5 text-amber-500 shrink-0" />
                    <span>Caution : {formatPrice(car.depositAmount)}</span>
                  </div>
                )}
                {car.city && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary shrink-0" />
                    <span>Ville : {car.city}</span>
                  </div>
                )}
                {car.requiredDocuments && (
                  <div className="flex items-center gap-2">
                    <Info className="w-5 h-5 text-muted-foreground shrink-0" />
                    <span>Documents : {car.requiredDocuments}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <AvailabilityCalendar blocks={availabilityBlocks} isLoading={isLoadingAvailability} />
        </div>

        <div>
          <Card className="sticky top-24 shadow-xl border-primary/10">
            <CardHeader className="bg-primary/5 border-b">
              <CardTitle>Réserver ce véhicule</CardTitle>
              <CardDescription>Remplissez le formulaire, aucun paiement immédiat n'est requis.</CardDescription>
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
                            <Input type="date" min={today} {...field} />
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
                            <Input type="date" min={startDate || today} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {dateError && (
                    <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg flex items-start gap-2">
                      <CalendarX className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>{dateError}</span>
                    </div>
                  )}

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

                  {startDate && returnDate && !dateError && days > 0 && (
                    <div className="bg-muted p-4 rounded-xl space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Prix journalier</span>
                        <span>{formatPrice(car.dailyPrice)}</span>
                      </div>
                      {days >= 7 && car.weeklyPrice && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Tarif semaine</span>
                          <span>{formatPrice(car.weeklyPrice)}/sem.</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Durée</span>
                        <span>{days} jour{days > 1 ? "s" : ""}</span>
                      </div>
                      <div className="border-t pt-2 mt-2 flex justify-between font-bold text-lg">
                        <span>Total estimé</span>
                        <span className="text-primary">{formatPrice(estimatedPrice)}</span>
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-12 text-lg mt-4"
                    disabled={createRequest.isPending || car.status !== "AVAILABLE" || !!dateError}
                  >
                    {createRequest.isPending
                      ? "Envoi en cours..."
                      : car.status !== "AVAILABLE"
                      ? "Non disponible"
                      : "Demander la location"}
                  </Button>

                  {!isAuthenticated && (
                    <p className="text-xs text-center text-muted-foreground">
                      Vous devrez vous connecter avant d'envoyer la demande.
                    </p>
                  )}
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
