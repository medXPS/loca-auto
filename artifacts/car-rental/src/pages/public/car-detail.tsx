import { useEffect, useMemo, useRef, useState, type ComponentType, type FormEvent } from "react";
import { Link, useLocation, useRoute } from "wouter";
import {
  getGetCarAvailabilityQueryKey,
  getGetCarQueryKey,
  useCreateRentalRequest,
  useGetCar,
  useGetCarAvailability,
} from "@workspace/api-client-react";
import { calculateRentalDays, doesIsoRangeOverlapBlocked, formatDisplayDate, todayIso } from "@workspace/api-client-react/availability";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Seo } from "@/components/seo";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { FUEL_TRANSLATIONS, formatPrice } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Fuel,
  ImageIcon,
  MessageCircle,
  MapPin,
  Settings2,
  ShieldCheck,
  Sparkles,
  Users,
  Wind,
} from "lucide-react";

type GalleryImage = {
  id: number;
  url: string;
  altText?: string | null;
  mediaType?: string | null;
};

function buildWhatsAppHref(carName: string, message: string) {
  return `https://wa.me/212600000000?text=${encodeURIComponent(`${carName}\n${message}`)}`;
}

function Gallery({
  images,
  mainImageUrl,
  brand,
  model,
}: {
  images: GalleryImage[];
  mainImageUrl?: string | null;
  brand: string;
  model: string;
}) {
  const media = images.length > 0 ? images : mainImageUrl ? [{ id: 0, url: mainImageUrl, altText: null, mediaType: "IMAGE" }] : [];
  const [current, setCurrent] = useState(0);
  const [failedUrls, setFailedUrls] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setCurrent(0);
    setFailedUrls(new Set());
  }, [mainImageUrl, images]);

  const visibleMedia = media.filter((item) => !failedUrls.has(item.url));
  const activeIndex = Math.min(current, Math.max(visibleMedia.length - 1, 0));

  if (visibleMedia.length === 0) {
    return (
      <div className="flex aspect-[16/10] items-center justify-center rounded-[2rem] border border-dashed border-border/70 bg-white text-muted-foreground">
        <div className="text-center">
          <ImageIcon className="mx-auto h-12 w-12 opacity-40" />
          <p className="mt-3 text-sm">Aucune image disponible</p>
        </div>
      </div>
    );
  }

  const activeMedia = visibleMedia[activeIndex];

  return (
    <div className="space-y-3">
      <div className="group relative overflow-hidden rounded-[2rem] bg-muted shadow-[0_24px_60px_-34px_rgba(16,23,34,0.18)]">
        <div className="aspect-[16/10]">
          {activeMedia.mediaType === "VIDEO" ? (
            <video src={activeMedia.url} className="h-full w-full object-cover" controls />
          ) : (
            <img
              src={activeMedia.url}
              alt={activeMedia.altText || `${brand} ${model}`}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              onError={() => setFailedUrls((previous) => new Set(previous).add(activeMedia.url))}
            />
          )}
        </div>

        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,15,31,0.08),rgba(7,15,31,0.34))]" />

        {visibleMedia.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => setCurrent((value) => (value - 1 + visibleMedia.length) % visibleMedia.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/45 p-2 text-white backdrop-blur transition hover:bg-black/65"
              aria-label="Image précédente"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setCurrent((value) => (value + 1) % visibleMedia.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/45 p-2 text-white backdrop-blur transition hover:bg-black/65"
              aria-label="Image suivante"
            >
              <ArrowRight className="h-5 w-5" />
            </button>
            <div className="absolute right-4 top-4 rounded-full bg-white/92 px-3 py-1 text-xs font-semibold text-primary shadow-sm">
              {activeIndex + 1} / {visibleMedia.length}
            </div>
          </>
        )}
      </div>

      {visibleMedia.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {visibleMedia.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setCurrent(index)}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                index === activeIndex ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              {item.mediaType === "VIDEO" ? (
                <video src={item.url} className="h-full w-full object-cover" muted />
              ) : (
                <img
                  src={item.url}
                  alt={item.altText || `${brand} ${model} ${index + 1}`}
                  className="h-full w-full object-cover"
                  onError={() => setFailedUrls((previous) => new Set(previous).add(item.url))}
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function StatPill({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        <Icon className="h-3.5 w-3.5 text-primary" />
        {label}
      </div>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

export default function CarDetail() {
  const [location, setLocation] = useLocation();
  const [match, params] = useRoute("/voitures/:id");
  const id = Number(params?.id);
  const isValidId = Boolean(match && params?.id && !Number.isNaN(id));
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const reservationRef = useRef<HTMLDivElement>(null);

  const searchParams = useMemo(
    () => new URLSearchParams(typeof window === "undefined" ? "" : window.location.search),
    [location],
  );

  const startDateFromQuery = searchParams.get("startDate") || "";
  const returnDateFromQuery = searchParams.get("returnDate") || "";
  const shouldFocusReservation = searchParams.get("reserve") === "1" || (typeof window !== "undefined" && window.location.hash === "#reservation");

  const { data: car, isLoading } = useGetCar(id, {
    query: { enabled: isValidId, queryKey: getGetCarQueryKey(id) },
  });
  const { data: availabilityBlocks = [] } = useGetCarAvailability(id, {
    query: { enabled: isValidId, queryKey: getGetCarAvailabilityQueryKey(id) },
  });
  const createRequest = useCreateRentalRequest();

  const [fullName, setFullName] = useState(user?.fullName || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [email, setEmail] = useState(user?.email || "");
  const [startDate, setStartDate] = useState(startDateFromQuery);
  const [returnDate, setReturnDate] = useState(returnDateFromQuery);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!fullName && user?.fullName) setFullName(user.fullName);
    if (!phone && user?.phone) setPhone(user.phone);
    if (!email && user?.email) setEmail(user.email);
  }, [email, fullName, phone, user]);

  useEffect(() => {
    setStartDate(startDateFromQuery);
    setReturnDate(returnDateFromQuery);
  }, [startDateFromQuery, returnDateFromQuery]);

  const rentalDays = useMemo(() => {
    if (!startDate || !returnDate) return 0;
    return calculateRentalDays(startDate, returnDate);
  }, [returnDate, startDate]);

  const estimatedTotalPrice = useMemo(() => {
    if (!car || rentalDays <= 0) return 0;

    if (rentalDays >= 7 && car.weeklyPrice) {
      return Math.floor(rentalDays / 7) * car.weeklyPrice + (rentalDays % 7) * car.dailyPrice;
    }

    return rentalDays * car.dailyPrice;
  }, [car, rentalDays]);

  const transmissionLabel = car?.transmission === "AUTOMATIQUE" ? "Automatique" : "Manuelle";
  const fuelLabel = car ? FUEL_TRANSLATIONS[car.fuelType] || car.fuelType : "";
  const hasAirConditioning = Boolean(car?.airConditioning);
  const images = useMemo(
    () =>
      car
        ? [
            ...(car.images || []),
            ...(car.mainImageUrl ? [{ id: -1, url: car.mainImageUrl, altText: `${car.brand} ${car.model}` }] : []),
          ].filter((item, index, array) => array.findIndex((candidate) => candidate.url === item.url) === index)
        : [],
    [car?.brand, car?.images, car?.mainImageUrl, car?.model],
  );
  const whatsappHref = buildWhatsAppHref(
    car ? `${car.brand} ${car.model}` : "Location Auto Maroc",
    `Bonjour, je souhaite réserver${car ? ` ${car.brand} ${car.model}` : ""}${startDate ? ` du ${formatDisplayDate(startDate)}` : ""}${returnDate ? ` au ${formatDisplayDate(returnDate)}` : ""}${estimatedTotalPrice > 0 ? `. Budget estimé : ${formatPrice(estimatedTotalPrice)}` : ""}.`,
  );

  const backHref = useMemo(() => {
    const paramsCopy = new URLSearchParams(searchParams);
    paramsCopy.delete("reserve");
    return paramsCopy.toString() ? `/voitures?${paramsCopy.toString()}` : "/voitures";
  }, [searchParams]);

  useEffect(() => {
    if (!car || !shouldFocusReservation) return;

    const timeout = window.setTimeout(() => {
      reservationRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);

    return () => window.clearTimeout(timeout);
  }, [car, shouldFocusReservation]);

  useEffect(() => {
    if (!startDate || !returnDate) {
      setFormError(null);
      return;
    }

    if (calculateRentalDays(startDate, returnDate) <= 0) {
      setFormError("La date de retour doit être après la date de départ.");
      return;
    }

    if (doesIsoRangeOverlapBlocked({ startDate, endDate: returnDate }, availabilityBlocks)) {
      setFormError("La période sélectionnée contient des dates indisponibles.");
      return;
    }

    setFormError(null);
  }, [availabilityBlocks, returnDate, startDate]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!car) return;

    if (!isAuthenticated) {
      toast({
        title: "Connexion requise",
        description: "Connectez-vous pour envoyer votre demande de réservation.",
      });
      setLocation("/connexion");
      return;
    }

    if (!fullName.trim() || !phone.trim() || !email.trim() || !startDate || !returnDate) {
      setFormError("Merci de compléter les champs essentiels.");
      toast({
        title: "Informations manquantes",
        description: "Remplissez votre nom, téléphone, email et les dates de location.",
        variant: "destructive",
      });
      return;
    }

    if (formError) {
      toast({
        title: "Dates invalides",
        description: formError,
        variant: "destructive",
      });
      return;
    }

    createRequest.mutate(
      {
        data: {
          carId: car.id,
          fullName: fullName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          startDate,
          returnDate,
          estimatedTotalPrice,
        },
      },
      {
        onSuccess: () => {
          toast({
            title: "Demande envoyée",
            description: "Notre équipe vous contactera très rapidement.",
          });
          setLocation("/dashboard/demandes");
        },
        onError: (error: any) => {
          toast({
            title: "Erreur",
            description: error?.message || "Impossible d'envoyer la demande.",
            variant: "destructive",
          });
        },
      },
    );
  };

  if (!isValidId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Link href="/voitures" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
          <ArrowLeft className="h-4 w-4" />
          Retour aux véhicules
        </Link>
        <div className="mt-6 rounded-[1.8rem] border border-border/70 bg-white p-8 text-center">
          <p className="text-lg font-semibold">Voiture introuvable</p>
          <p className="mt-2 text-sm text-muted-foreground">Le véhicule demandé n’existe pas ou n’est plus disponible.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 lg:py-10">
        <Skeleton className="h-[520px] w-full rounded-[2rem]" />
      </div>
    );
  }

  if (!car) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Link href={backHref} className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
          <ArrowLeft className="h-4 w-4" />
          Retour aux résultats
        </Link>
        <div className="mt-6 rounded-[1.8rem] border border-border/70 bg-white p-8 text-center">
          <p className="text-lg font-semibold">Voiture introuvable</p>
          <p className="mt-2 text-sm text-muted-foreground">Essayez un autre véhicule dans le catalogue.</p>
        </div>
      </div>
    );
  }

  const pageTitle = `${car.brand} ${car.model}`;
  const pageDescription = `Réservez ${car.brand} ${car.model} au Maroc. Prix, caractéristiques et demande rapide en ligne.`;
  const canonical = `https://demo-locationauto.shonenx.shop/voitures/${car.id}`;
  const mapLocation = `${car.city?.trim() || "Casablanca"}, Maroc`;
  const mapEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(mapLocation)}&z=13&output=embed`;
  const mapHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapLocation)}`;

  return (
    <div className="container mx-auto px-4 py-8 lg:py-10">
      <Seo
        title={pageTitle}
        description={pageDescription}
        canonical={canonical}
        image={car.mainImageUrl || "/opengraph.jpg"}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "Product",
            name: pageTitle,
            description: pageDescription,
            image: images.map((image) => image.url),
            brand: car.brand,
            offers: {
              "@type": "Offer",
              price: car.dailyPrice,
              priceCurrency: "MAD",
              availability: car.status === "AVAILABLE" ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
              url: canonical,
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "CarRental",
            name: "Location Auto Maroc",
            url: "https://demo-locationauto.shonenx.shop/",
            areaServed: "Morocco",
          },
        ]}
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Link href={backHref} className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
          <ArrowLeft className="h-4 w-4" />
          Retour aux résultats
        </Link>

        <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="hidden items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary/80 md:inline-flex">
          <MessageCircle className="h-4 w-4" />
          WhatsApp
        </a>
      </div>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-8">
          <Gallery images={images} mainImageUrl={car.mainImageUrl} brand={car.brand} model={car.model} />

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatPill icon={Settings2} label="Transmission" value={transmissionLabel} />
            <StatPill icon={Fuel} label="Carburant" value={fuelLabel} />
            <StatPill icon={Users} label="Places" value={`${car.seats} places`} />
            <StatPill icon={Wind} label="Climatisation" value={hasAirConditioning ? "Oui" : "Non"} />
          </div>

          <Card className="overflow-hidden rounded-[1.8rem] border border-border/70 bg-white shadow-[0_24px_60px_-36px_rgba(16,23,34,0.18)]" id="reservation" ref={reservationRef}>
            <CardContent className="space-y-6 p-6 scroll-mt-28">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/8 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                    <CalendarDays className="h-3.5 w-3.5" />
                    Réservation
                  </div>
                  <h2 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">Réserver ce véhicule</h2>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">
                    Remplissez les informations essentielles. L’équipe vous répond rapidement pour confirmer la disponibilité.
                  </p>
                </div>

                <div className="hidden rounded-2xl border border-border/70 bg-muted/20 px-4 py-3 text-right md:block">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Prix/jour</p>
                  <p className="text-2xl font-semibold text-primary">{formatPrice(car.dailyPrice)}</p>
                </div>
              </div>

              {formError && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {formError}
                </div>
              )}

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="fullName">
                      Nom complet
                    </label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      placeholder="Votre nom"
                      className="h-12 rounded-2xl border-border/70"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="phone">
                      Téléphone
                    </label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      placeholder="+212 6..."
                      className="h-12 rounded-2xl border-border/70"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="email">
                      Email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="email@exemple.com"
                      className="h-12 rounded-2xl border-border/70"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="startDate">
                      Date de départ
                    </label>
                    <Input
                      id="startDate"
                      type="date"
                      min={todayIso()}
                      value={startDate}
                      onChange={(event) => setStartDate(event.target.value)}
                      className="h-12 rounded-2xl border-border/70"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="returnDate">
                      Date de retour
                    </label>
                    <Input
                      id="returnDate"
                      type="date"
                      min={startDate || todayIso()}
                      value={returnDate}
                      onChange={(event) => setReturnDate(event.target.value)}
                      className="h-12 rounded-2xl border-border/70"
                    />
                  </div>

                  <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Infos utiles</p>
                    <div className="mt-2 grid gap-2 text-sm text-muted-foreground">
                      <p>{car.city || "Maroc"}</p>
                      <p>{car.year} · {car.category}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Prix journalier</span>
                    <span className="font-semibold text-foreground">{formatPrice(car.dailyPrice)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Durée</span>
                    <span className="font-semibold text-foreground">{rentalDays > 0 ? `${rentalDays} jour${rentalDays > 1 ? "s" : ""}` : "À choisir"}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-border/70 pt-3 text-lg font-semibold">
                    <span>Total estimé</span>
                    <span className="text-primary">{estimatedTotalPrice > 0 ? formatPrice(estimatedTotalPrice) : formatPrice(car.dailyPrice)}</span>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="h-12 w-full rounded-full text-base"
                  disabled={createRequest.isPending || car.status !== "AVAILABLE" || !!formError}
                >
                  {createRequest.isPending
                    ? "Envoi en cours..."
                    : car.status !== "AVAILABLE"
                      ? "Indisponible"
                      : isAuthenticated
                        ? "Envoyer la demande"
                        : "Se connecter pour réserver"}
                </Button>

                {!isAuthenticated && (
                  <p className="text-center text-xs text-muted-foreground">
                    Vous serez redirigé vers la connexion avant l’envoi de la demande.
                  </p>
                )}
              </form>
            </CardContent>
          </Card>
        </div>

        <aside className="order-first h-fit space-y-4 xl:sticky xl:top-24 xl:order-none">
          <Card className="overflow-hidden rounded-[1.8rem] border border-border/70 bg-white shadow-[0_24px_60px_-36px_rgba(16,23,34,0.18)]">
            <CardContent className="space-y-5 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                      car.status === "AVAILABLE"
                        ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border border-amber-200 bg-amber-50 text-amber-700"
                    }`}
                  >
                    {car.status === "AVAILABLE" ? <ShieldCheck className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
                    {car.status === "AVAILABLE" ? "Disponible" : "Sur demande"}
                  </div>
                  <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">
                    {car.brand} {car.model}
                  </h1>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {car.year} · {car.city || "Maroc"}
                  </p>
                </div>
              </div>

              <div className="rounded-[1.4rem] border border-primary/10 bg-primary/6 px-4 py-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Prix par jour</p>
                <p className="mt-1 text-4xl font-semibold tracking-tight text-primary">{formatPrice(car.dailyPrice)}</p>
                <p className="mt-1 text-sm text-muted-foreground">Paiement à l'agence</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Caractéristiques</p>
                  <div className="mt-3 grid gap-3 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">Transmission</span>
                      <span className="font-semibold text-foreground">{transmissionLabel}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">Carburant</span>
                      <span className="font-semibold text-foreground">{fuelLabel}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">Places</span>
                      <span className="font-semibold text-foreground">{car.seats}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">Climatisation</span>
                      <span className="font-semibold text-foreground">{hasAirConditioning ? "Oui" : "Non"}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-3">
                <Button asChild className="h-12 rounded-full bg-primary text-primary-foreground">
                  <a href="#reservation">
                    Réserver
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
                <Button asChild variant="outline" className="h-12 rounded-full border-border/70 bg-white">
                  <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>

      <section className="mt-10 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="overflow-hidden rounded-[1.8rem] border border-border/70 bg-white shadow-[0_24px_60px_-36px_rgba(16,23,34,0.18)]">
          <CardContent className="space-y-5 p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/8 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  <MapPin className="h-3.5 w-3.5" />
                  Localisation
                </div>
                <h2 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">Ou se situe l'agence ?</h2>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  {car.city || "Casablanca"} et ses environs sont indiques sur la carte pour aider le client a se reperer rapidement.
                </p>
              </div>

              <Button asChild variant="outline" className="rounded-full border-border/70 bg-white">
                <a href={mapHref} target="_blank" rel="noopener noreferrer">
                  Ouvrir dans Google Maps
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
            </div>

            <div className="overflow-hidden rounded-[1.5rem] border border-border/70 bg-muted">
              <iframe
                title={`Carte de ${mapLocation}`}
                src={mapEmbedUrl}
                className="h-[420px] w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="h-fit overflow-hidden rounded-[1.8rem] border border-border/70 bg-white shadow-[0_24px_60px_-36px_rgba(16,23,34,0.18)]">
          <CardContent className="space-y-4 p-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Adresse</p>
              <p className="mt-2 text-xl font-semibold text-foreground">{car.city || "Casablanca"}</p>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                Verifiez l'emplacement exact de l'agence sur la carte avant de confirmer votre reservation.
              </p>
            </div>

            <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Conseil</p>
              <p className="mt-1 leading-7">
                Utilisez la carte pour estimer le trajet jusqu'a l'agence et preparer votre arrivee.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border/70 bg-white/96 px-3 py-3 shadow-[0_-12px_36px_-24px_rgba(16,23,34,0.24)] backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-xl grid-cols-2 gap-3">
          <Button asChild className="h-12 rounded-full bg-primary text-primary-foreground">
            <a href="#reservation">
              Réserver
              <ArrowRight className="h-4 w-4" />
            </a>
          </Button>
          <Button asChild variant="outline" className="h-12 rounded-full border-border/70 bg-white">
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
