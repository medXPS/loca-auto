import { useRoute, Link, useLocation } from "wouter";
import {
  getGetCarAvailabilityQueryKey,
  getGetCarQueryKey,
  getGetMyCustomerProfileQueryKey,
  useCreateRentalRequest,
  useGetCar,
  useGetCarAvailability,
  useGetMyCustomerProfile,
} from "@workspace/api-client-react";
import { calculateRentalDays, doesIsoRangeOverlapBlocked, todayIso } from "@workspace/api-client-react/availability";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { formatPrice } from "@/lib/utils";
import { isFavoriteCar, removeFavoriteCar, saveFavoriteCar } from "@/lib/favorites";
import { StatusBadge } from "@/components/status-badge";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock3,
  DoorClosed,
  FileText,
  Fuel,
  Heart,
  ImageIcon,
  Info,
  MapPin,
  Settings2,
  Share2,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import "react-day-picker/style.css";
import { DateRangeCalendar } from "@/components/date-range-calendar";
import { formatDisplayDate } from "@workspace/api-client-react/availability";

const requestSchema = z.object({
  fullName: z.string().min(2, { message: "Nom requis" }),
  phone: z.string().min(10, { message: "Téléphone requis" }),
  email: z.string().email({ message: "Email invalide" }),
  cinOrPassport: z.string().optional(),
  drivingLicenseNumber: z.string().optional(),
  startDate: z.string().min(1, { message: "Date de départ requise" }),
  returnDate: z.string().min(1, { message: "Date de retour requise" }),
});

function PhotoGallery({
  images,
  mainImageUrl,
  brand,
  model,
}: {
  images: { id: number; url: string; altText?: string | null; mediaType?: string | null }[];
  mainImageUrl?: string | null;
  brand: string;
  model: string;
}) {
  const allImages = images.length > 0 ? images : mainImageUrl ? [{ id: 0, url: mainImageUrl, altText: null }] : [];
  const [current, setCurrent] = useState(0);
  const [failedUrls, setFailedUrls] = useState<Set<string>>(() => new Set());
  const visibleImages = allImages.filter((image) => !failedUrls.has(image.url));
  const safeCurrent = Math.min(current, Math.max(visibleImages.length - 1, 0));

  const markFailed = useCallback((url: string) => {
    setFailedUrls((previous) => new Set(previous).add(url));
    setCurrent(0);
  }, []);

  const prev = useCallback(
    () => setCurrent((value) => (value - 1 + visibleImages.length) % visibleImages.length),
    [visibleImages.length],
  );
  const next = useCallback(() => setCurrent((value) => (value + 1) % visibleImages.length), [visibleImages.length]);

  if (visibleImages.length === 0) {
    return (
      <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-[2rem] bg-muted text-muted-foreground">
        <ImageIcon className="h-12 w-12 opacity-40" />
        <span className="ml-3">Aucune image disponible</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="group relative aspect-[16/10] overflow-hidden bg-muted">
        {visibleImages[safeCurrent].mediaType === "VIDEO" ? (
          <video src={visibleImages[safeCurrent].url} className="h-full w-full object-cover" controls />
        ) : (
          <img
            src={visibleImages[safeCurrent].url}
            alt={visibleImages[safeCurrent].altText || `${brand} ${model}`}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            onError={() => markFailed(visibleImages[safeCurrent].url)}
          />
        )}

        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,15,31,0.12),rgba(7,15,31,0.46))]" />

        {visibleImages[safeCurrent].mediaType === "IMAGE_360" && (
          <div className="absolute left-4 top-4 rounded-full bg-black/55 px-3 py-1 text-xs font-semibold text-white">
            360°
          </div>
        )}

        {visibleImages.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100"
              aria-label="Image précédente"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={next}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100"
              aria-label="Image suivante"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
              {visibleImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrent(index)}
                  className={`h-2 rounded-full transition-all ${index === safeCurrent ? "w-4 bg-white" : "w-2 bg-white/60"}`}
                  aria-label={`Image ${index + 1}`}
                />
              ))}
            </div>
            <div className="absolute right-4 top-4 rounded-full bg-black/50 px-3 py-1 text-xs text-white">
              {safeCurrent + 1} / {visibleImages.length}
            </div>
          </>
        )}
      </div>

      {visibleImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {visibleImages.map((img, index) => (
            <button
              key={img.id}
              onClick={() => setCurrent(index)}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${index === safeCurrent ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"}`}
            >
              {img.mediaType === "VIDEO" ? (
                <video src={img.url} className="h-full w-full object-cover" muted />
              ) : (
                <img
                  src={img.url}
                  alt={img.altText || `${brand} ${model} ${index + 1}`}
                  className="h-full w-full object-cover"
                  onError={() => markFailed(img.url)}
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CarDetail() {
  const [, params] = useRoute("/voitures/:id");
  const id = Number(params?.id);
  const { data: car, isLoading } = useGetCar(id, { query: { enabled: !!id, queryKey: getGetCarQueryKey(id) } });
  const { data: availabilityBlocks = [] } = useGetCarAvailability(id, {
    query: { enabled: !!id, queryKey: getGetCarAvailabilityQueryKey(id) },
  });

  const { toast } = useToast();
  const { user, isAuthenticated, isCustomer } = useAuth();
  const [, setLocation] = useLocation();
  const createRequest = useCreateRentalRequest();

  const [days, setDays] = useState(1);
  const [dateError, setDateError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const searchParams = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const outerStartDate = searchParams.get("startDate") || "";
  const outerReturnDate = searchParams.get("returnDate") || "";
  const outerCity = searchParams.get("city") || "";
  const pickupTime = searchParams.get("pickupTime") || "10:00";
  const returnTime = searchParams.get("returnTime") || "10:00";
  const modifySearchHref = `/voitures${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

  const { data: profile } = useGetMyCustomerProfile({
    query: {
      enabled: isAuthenticated && isCustomer,
      queryKey: getGetMyCustomerProfileQueryKey(),
    },
  });

  const profileDocuments = (profile?.documents ?? []).filter((doc) => doc.rentalRequestId == null);
  const hasIdentityDocument = profileDocuments.some((doc) => doc.type === "CIN" || doc.type === "PASSPORT");
  const hasLicenseDocument = profileDocuments.some((doc) => doc.type === "PERMIS_CONDUIRE");
  const profileReady = Boolean((profile?.cin || profile?.passportNumber || hasIdentityDocument) && (profile?.drivingLicenseNumber || hasLicenseDocument));

  const form = useForm<z.infer<typeof requestSchema>>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      cinOrPassport: "",
      drivingLicenseNumber: "",
      startDate: outerStartDate,
      returnDate: outerReturnDate,
    },
  });

  const startDate = form.watch("startDate");
  const returnDate = form.watch("returnDate");

  useEffect(() => {
    if (car) setIsFavorite(isFavoriteCar(car.id));
  }, [car]);

  useEffect(() => {
    form.reset({
      fullName: profile?.user?.fullName || user?.fullName || "",
      phone: profile?.user?.phone || user?.phone || "",
      email: profile?.user?.email || user?.email || "",
      cinOrPassport: profile?.cin || profile?.passportNumber || "",
      drivingLicenseNumber: profile?.drivingLicenseNumber || "",
      startDate: outerStartDate,
      returnDate: outerReturnDate,
    });
  }, [profile, user, outerStartDate, outerReturnDate, form]);

  useEffect(() => {
    if (startDate && returnDate) {
      const diffDays = calculateRentalDays(startDate, returnDate);

      if (diffDays <= 0) {
        setDateError("La date de retour doit être après la date de départ.");
        setDays(1);
        return;
      }

      if (doesIsoRangeOverlapBlocked({ startDate, endDate: returnDate }, availabilityBlocks)) {
        setDateError("La période sélectionnée contient des dates indisponibles. Veuillez choisir d'autres dates.");
        setDays(diffDays);
        return;
      }

      setDateError(null);
      setDays(diffDays);
    } else {
      setDateError(null);
      setDays(1);
    }
  }, [startDate, returnDate, availabilityBlocks]);

  const estimatedPrice =
    car && days > 0
      ? days >= 7 && car.weeklyPrice
        ? Math.floor(days / 7) * car.weeklyPrice + (days % 7) * car.dailyPrice
        : days * car.dailyPrice
      : 0;
  const today = todayIso();

  const handleDateRangeChange = (range: { startDate: string; returnDate: string }) => {
    form.setValue("startDate", range.startDate, { shouldValidate: true, shouldDirty: true });
    form.setValue("returnDate", range.returnDate, { shouldValidate: true, shouldDirty: true });
  };

  const handleShare = async () => {
    if (!car) return;

    const url = window.location.href;
    const text = `${car.brand} ${car.model} - ${formatPrice(car.dailyPrice)}/jour\n${url}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${car.brand} ${car.model}`,
          text,
          url,
        });
        return;
      }
    } catch {
      return;
    }

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };

  const handleToggleFavorite = () => {
    if (!car) return;

    if (!isAuthenticated) {
      toast({
        title: "Connexion requise",
        description: "Connectez-vous pour enregistrer vos voitures favorites.",
      });
      setLocation("/connexion");
      return;
    }

    if (isFavorite) {
      removeFavoriteCar(car.id);
      setIsFavorite(false);
      toast({ title: "Retiré des favoris" });
    } else {
      saveFavoriteCar(car);
      setIsFavorite(true);
      toast({ title: "Ajouté aux favoris" });
    }
  };

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

    if (doesIsoRangeOverlapBlocked({ startDate: values.startDate, endDate: values.returnDate }, availabilityBlocks)) {
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
          carId: id,
          fullName: values.fullName.trim(),
          phone: values.phone.trim(),
          email: values.email.trim(),
          cinOrPassport: values.cinOrPassport?.trim() || undefined,
          drivingLicenseNumber: values.drivingLicenseNumber?.trim() || undefined,
          startDate: values.startDate,
          returnDate: values.returnDate,
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
      },
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-96 w-full rounded-[2rem]" />
      </div>
    );
  }

  if (!car) {
    return <div className="container mx-auto px-4 py-8 text-center">Voiture introuvable</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 lg:py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Link href="/voitures" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
          <ArrowLeft className="h-4 w-4" />
          Retour aux résultats
        </Link>

        <Button asChild variant="outline" className="rounded-full border-border/70 bg-white">
          <Link href={modifySearchHref}>Modifier la recherche</Link>
        </Button>
      </div>

      <Card className="surface-panel mb-8 overflow-hidden">
        <CardContent className="grid gap-4 p-4 lg:grid-cols-[1.15fr_1fr_0.9fr_auto] lg:items-center">
          <div className="rounded-2xl border border-border/70 bg-white px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Prise en charge</p>
            <p className="mt-1 text-base font-bold">{outerCity || car.city || "Casablanca"}</p>
            <p className="text-sm text-muted-foreground">
              {outerStartDate ? formatDisplayDate(outerStartDate) : "Date à choisir"} · {pickupTime}
            </p>
          </div>

          <div className="rounded-2xl border border-border/70 bg-white px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Restitution</p>
            <p className="mt-1 text-base font-bold">{outerCity || car.city || "Casablanca"}</p>
            <p className="text-sm text-muted-foreground">
              {outerReturnDate ? formatDisplayDate(outerReturnDate) : "Date à choisir"} · {returnTime}
            </p>
          </div>

          <div className="rounded-2xl border border-primary/10 bg-primary/6 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Votre offre</p>
            <p className="mt-1 text-lg font-extrabold text-primary">
              {car.brand} {car.model}
            </p>
            <p className="text-sm text-muted-foreground">{car.city || outerCity || "Maroc"}</p>
          </div>

          <Button asChild className="rounded-full bg-emerald-500 px-5 text-white hover:bg-emerald-600">
            <Link href="#reservation">Continuer</Link>
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.15fr)_360px]">
        <div className="space-y-8">
          <div className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-white shadow-[0_28px_70px_-34px_hsl(var(--primary)/0.24)]">
            <PhotoGallery images={car.images || []} mainImageUrl={car.mainImageUrl} brand={car.brand} model={car.model} />
            <div className="absolute left-4 top-4 z-10">
              <StatusBadge status={car.status} type="car" className="px-3 py-1 text-sm" />
            </div>
            <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl rounded-[1.4rem] border border-white/20 bg-black/45 px-5 py-4 text-white backdrop-blur">
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/70">Sélection recommandée</p>
                <h1 className="mt-1 text-3xl font-extrabold tracking-tight">
                  {car.brand} {car.model}
                </h1>
                <p className="mt-1 text-sm text-white/80">
                  {car.year} · {car.category} · {car.city || outerCity || "Maroc"}
                </p>
              </div>

              <div className="rounded-[1.4rem] border border-white/20 bg-white/92 px-5 py-4 text-right shadow-[0_18px_30px_-18px_hsl(var(--primary)/0.45)]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">À partir de</p>
                <p className="text-3xl font-extrabold text-primary">{formatPrice(car.dailyPrice)}</p>
                <p className="text-xs text-muted-foreground">/jour</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="flex flex-col items-center justify-center rounded-[1.4rem] border border-border/70 bg-white p-5 text-center shadow-sm">
              <Settings2 className="mb-2 h-6 w-6 text-primary" />
              <span className="text-sm font-semibold">{car.transmission === "AUTOMATIQUE" ? "Automatique" : "Manuelle"}</span>
            </div>
            <div className="flex flex-col items-center justify-center rounded-[1.4rem] border border-border/70 bg-white p-5 text-center shadow-sm">
              <Fuel className="mb-2 h-6 w-6 text-primary" />
              <span className="text-sm font-semibold">{car.fuelType}</span>
            </div>
            <div className="flex flex-col items-center justify-center rounded-[1.4rem] border border-border/70 bg-white p-5 text-center shadow-sm">
              <Users className="mb-2 h-6 w-6 text-primary" />
              <span className="text-sm font-semibold">{car.seats} places</span>
            </div>
            <div className="flex flex-col items-center justify-center rounded-[1.4rem] border border-border/70 bg-white p-5 text-center shadow-sm">
              <DoorClosed className="mb-2 h-6 w-6 text-primary" />
              <span className="text-sm font-semibold">{car.doors} portes</span>
            </div>
          </div>

          <Card className="surface-panel">
            <CardContent className="p-6">
              <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/6 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    Excellent choix
                  </div>
                  <h2 className="text-2xl font-extrabold tracking-tight">Une voiture pensée pour voyager sans stress.</h2>
                  <p className="leading-7 text-muted-foreground">
                    {car.description ||
                      "Aucune description détaillée n’est renseignée pour ce véhicule. Il reste toutefois entretenu selon les standards les plus stricts pour garantir votre confort et votre sécurité sur la route."}
                  </p>
                </div>

                <div className="grid gap-3">
                  {[
                    { title: "Comptoir dans le terminal", text: "Retrait rapide, sans détour, pour partir dès votre arrivée." },
                    { title: "Annulation gratuite", text: "Des repères clairs avant validation pour éviter les mauvaises surprises." },
                    { title: "Politique carburant", text: "Des informations visibles pour comprendre exactement ce qui est inclus." },
                  ].map((item) => (
                    <div key={item.title} className="rounded-2xl border border-border/70 bg-white p-4 shadow-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
                        <p className="font-semibold">{item.title}</p>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="surface-panel">
            <CardContent className="p-6">
              <h2 className="text-2xl font-extrabold tracking-tight">Inclus dans cette offre</h2>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-white p-4">
                  <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                  <div>
                    <p className="font-semibold">Annulation gratuite jusqu’à 48 heures à l’avance</p>
                    <p className="mt-1 text-sm text-muted-foreground">Ajustez vos plans sans vous sentir bloqué.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-white p-4">
                  <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                  <div>
                    <p className="font-semibold">Protection en cas de vol avec une franchise de 0 MAD</p>
                    <p className="mt-1 text-sm text-muted-foreground">Des garanties présentées de façon simple.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-white p-4">
                  <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                  <div>
                    <p className="font-semibold">Couverture partielle en cas de collision</p>
                    <p className="mt-1 text-sm text-muted-foreground">Une lecture plus claire des protections incluses.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-white p-4">
                  <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                  <div>
                    <p className="font-semibold">Kilométrage</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {car.mileageLimit ? `${car.mileageLimit} km/jour` : "À vérifier dans les conditions de l’offre."}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="surface-panel">
            <CardContent className="p-6">
              <h2 className="text-2xl font-extrabold tracking-tight">Tout sur votre prise en charge</h2>
              <Tabs defaultValue="arrival" className="mt-5">
                <TabsList className="grid h-auto w-full grid-cols-3 bg-muted/40 p-1">
                  <TabsTrigger value="arrival" className="rounded-2xl px-3 py-2 text-sm font-semibold">
                    Arrivez à l’heure
                  </TabsTrigger>
                  <TabsTrigger value="needs" className="rounded-2xl px-3 py-2 text-sm font-semibold">
                    Ce dont vous avez besoin
                  </TabsTrigger>
                  <TabsTrigger value="deposit" className="rounded-2xl px-3 py-2 text-sm font-semibold">
                    Dépôt remboursable
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="arrival" className="mt-4 rounded-2xl border border-border/70 bg-white p-5">
                  <p className="text-sm leading-7 text-muted-foreground">
                    Les agences gardent votre véhicule uniquement à l’horaire de prise en charge confirmé.
                    Votre arrivée à {pickupTime} permet de lancer la remise des clés sans attente inutile.
                  </p>
                  <p className="mt-4 text-sm font-semibold">
                    Votre prise en charge est prévue à {pickupTime} {outerStartDate ? `le ${formatDisplayDate(outerStartDate)}` : ""}
                  </p>
                </TabsContent>

                <TabsContent value="needs" className="mt-4 rounded-2xl border border-border/70 bg-white p-5">
                  <p className="text-sm leading-7 text-muted-foreground">
                    Préparez votre pièce d’identité, votre permis de conduire et, si nécessaire, les références de votre
                    réservation. Les informations essentielles sont réunies dans votre profil client.
                  </p>
                  {car.requiredDocuments && <p className="mt-4 text-sm font-semibold">Documents demandés: {car.requiredDocuments}</p>}
                </TabsContent>

                <TabsContent value="deposit" className="mt-4 rounded-2xl border border-border/70 bg-white p-5">
                  <p className="text-sm leading-7 text-muted-foreground">
                    Le dépôt est remboursable selon l’état du véhicule au retour. Le montant exact est communiqué avant validation
                    pour que vous gardiez une vue claire sur le budget.
                  </p>
                  {car.depositAmount && <p className="mt-4 text-sm font-semibold">Caution: {formatPrice(car.depositAmount)}</p>}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4" id="reservation">
          <Card className="surface-panel-strong overflow-hidden">
            <CardHeader className="border-b bg-gradient-to-br from-primary/10 via-background to-secondary/10">
              <CardTitle>Prise en charge et restitution du véhicule</CardTitle>
              <CardDescription>Vos horaires de recherche sont repris ici pour une lecture plus rapide.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="space-y-4">
                <div className="relative pl-6">
                  <span className="absolute left-0 top-2 h-3 w-3 rounded-full border-2 border-primary bg-white" />
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Prise en charge</p>
                  <p className="mt-1 text-base font-bold">
                    {outerStartDate ? formatDisplayDate(outerStartDate) : "À choisir"} · {pickupTime}
                  </p>
                  <p className="text-sm text-muted-foreground">{outerCity || car.city || "Casablanca"}</p>
                </div>

                <div className="relative pl-6">
                  <span className="absolute left-0 top-2 h-3 w-3 rounded-full border-2 border-emerald-500 bg-white" />
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Restitution</p>
                  <p className="mt-1 text-base font-bold">
                    {outerReturnDate ? formatDisplayDate(outerReturnDate) : "À choisir"} · {returnTime}
                  </p>
                  <p className="text-sm text-muted-foreground">{outerCity || car.city || "Casablanca"}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Prix journalier</span>
                  <span className="font-semibold">{formatPrice(car.dailyPrice)}</span>
                </div>
                {estimatedPrice && (
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Prix total estimé</span>
                    <span className="font-bold text-primary">{formatPrice(estimatedPrice)}</span>
                  </div>
                )}
                <div className="mt-3 flex items-center justify-between text-sm font-bold">
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(estimatedPrice || car.dailyPrice)}</span>
                </div>
              </div>

              <Button asChild className="w-full rounded-full bg-emerald-500 px-5 text-white hover:bg-emerald-600">
                <Link href="#booking-form">Continuer la réservation</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="surface-panel-strong overflow-hidden" id="booking-form">
            <CardHeader className="border-b bg-gradient-to-br from-primary/10 via-background to-secondary/10">
              <CardTitle>Réservez ce véhicule</CardTitle>
              <CardDescription>Remplissez le formulaire, aucun paiement immédiat n’est requis.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {isAuthenticated && (
                <div
                  className={`mb-5 rounded-2xl border px-4 py-3 ${profileReady ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-amber-200 bg-amber-50 text-amber-900"}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 rounded-full p-2 ${profileReady ? "bg-emerald-100" : "bg-amber-100"}`}>
                      {profileReady ? <ShieldCheck className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold">{profileReady ? "Profil prêt pour la réservation" : "Profil à compléter"}</p>
                      <p className="mt-1 text-sm">
                        {profileReady
                          ? "Vos informations et documents principaux sont déjà disponibles."
                          : "Ajoutez votre CIN et votre permis dans votre profil pour gagner du temps. Vous pouvez aussi les téléverser depuis la page profil."}
                      </p>
                      {!profileReady && (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="mt-3"
                          onClick={() => setLocation("/dashboard/profil")}
                        >
                          Compléter mon profil
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-semibold leading-none">Dates de location</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Touchez une date de départ puis une date de retour. Les jours rouges sont bloqués.
                      </p>
                    </div>
                    <DateRangeCalendar
                      label="Dates de location"
                      blockedRanges={availabilityBlocks}
                      minDate={outerStartDate || today}
                      maxDate={outerReturnDate || undefined}
                      startDate={startDate}
                      returnDate={returnDate}
                      onChange={handleDateRangeChange}
                      compact
                    />
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="rounded-xl bg-muted/60 px-3 py-2">
                        <span className="block text-muted-foreground">Départ</span>
                        <span className="font-medium">{startDate || "À choisir"}</span>
                      </div>
                      <div className="rounded-xl bg-muted/60 px-3 py-2">
                        <span className="block text-muted-foreground">Retour</span>
                        <span className="font-medium">{returnDate || "À choisir"}</span>
                      </div>
                    </div>
                    {(form.formState.errors.startDate || form.formState.errors.returnDate) && (
                      <p className="text-sm font-medium text-destructive">Sélectionnez une période complète.</p>
                    )}
                  </div>

                  <div className="hidden">
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
                    <div className="flex items-start gap-2 rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
                      <Info className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{dateError}</span>
                    </div>
                  )}

                  <div className="grid gap-4">
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom complet</FormLabel>
                          <FormControl>
                            <Input placeholder="Votre nom" className="rounded-2xl" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Téléphone</FormLabel>
                            <FormControl>
                              <Input placeholder="+212 6..." className="rounded-2xl" {...field} />
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
                              <Input placeholder="email@ex.com" className="rounded-2xl" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="cinOrPassport"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CIN / Passeport</FormLabel>
                            <FormControl>
                              <Input placeholder="AB123456" className="rounded-2xl" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="drivingLicenseNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Permis de conduire</FormLabel>
                            <FormControl>
                              <Input placeholder="12/34567" className="rounded-2xl" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {startDate && returnDate && !dateError && days > 0 && (
                    <div className="space-y-2 rounded-2xl bg-muted p-4">
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
                        <span>
                          {days} jour{days > 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="mt-2 flex justify-between border-t pt-2 text-lg font-bold">
                        <span>Total estimé</span>
                        <span className="text-primary">{formatPrice(estimatedPrice)}</span>
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="mt-4 h-12 w-full rounded-full text-base"
                    disabled={createRequest.isPending || car.status !== "AVAILABLE" || !!dateError}
                  >
                    {createRequest.isPending
                      ? "Envoi en cours..."
                      : car.status !== "AVAILABLE"
                        ? "Non disponible"
                        : "Demander la location"}
                  </Button>

                  {!isAuthenticated && (
                    <p className="text-center text-xs text-muted-foreground">
                      Vous devrez vous connecter avant d’envoyer la demande.
                    </p>
                  )}
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card className="surface-panel">
            <CardHeader className="border-b">
              <CardTitle>Informations complémentaires</CardTitle>
              <CardDescription>Quelques rappels utiles avant la validation.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <Accordion type="single" collapsible className="space-y-3">
                <AccordionItem value="advanced-search" className="rounded-2xl border border-border/70 px-4">
                  <AccordionTrigger className="py-4 text-left text-sm font-semibold hover:no-underline">
                    Recherche avancée
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 text-sm leading-7 text-muted-foreground">
                    Utilisez la page de résultats pour changer la ville, les dates, la catégorie et la période sans
                    recommencer la réservation depuis zéro.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="documents" className="rounded-2xl border border-border/70 px-4">
                  <AccordionTrigger className="py-4 text-left text-sm font-semibold hover:no-underline">
                    Documents
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 text-sm leading-7 text-muted-foreground">
                    Les pièces d’identité et le permis sont généralement demandés au moment de la remise des clés.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="airports" className="rounded-2xl border border-border/70 px-4">
                  <AccordionTrigger className="py-4 text-left text-sm font-semibold hover:no-underline">
                    Aéroports
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 text-sm leading-7 text-muted-foreground">
                    Plusieurs agences peuvent proposer un retrait en ville ou à l’aéroport selon les disponibilités.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="agencies" className="rounded-2xl border border-border/70 px-4">
                  <AccordionTrigger className="py-4 text-left text-sm font-semibold hover:no-underline">
                    Sociétés de location
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 text-sm leading-7 text-muted-foreground">
                    Les offres proviennent de partenaires et d’agences locales qui précisent leurs conditions avant validation.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
