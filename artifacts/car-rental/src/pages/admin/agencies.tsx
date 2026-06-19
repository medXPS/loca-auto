import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPinned, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { LocationMapPicker } from "@/components/location-map-picker";
import { useToast } from "@/hooks/use-toast";
import { fetchAgencies, saveAgency, type AgencyRecord } from "@/lib/fleet-catalog";

function buildGoogleMapsLink(latitude: number, longitude: number) {
  return `https://www.google.com/maps/search/?api=1&query=${latitude.toFixed(6)},${longitude.toFixed(6)}`;
}

function extractCoordinatesFromMapUrl(mapUrl?: string | null) {
  if (!mapUrl) return null;

  const patterns = [
    /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    /[?&]q=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    /[?&]query=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
  ];

  for (const pattern of patterns) {
    const match = mapUrl.match(pattern);
    if (match) {
      const latitude = Number(match[1]);
      const longitude = Number(match[2]);

      if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
        return { latitude, longitude };
      }
    }
  }

  return null;
}

const emptyAgency: Partial<AgencyRecord> = {
  name: "",
  city: "",
  address: "",
  phone: "",
  email: "",
  latitude: null,
  longitude: null,
  mapUrl: "",
  isActive: true,
};

export default function AdminAgencies() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: agencies, isLoading } = useQuery({
    queryKey: ["agencies"],
    queryFn: fetchAgencies,
  });

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Partial<AgencyRecord>>(emptyAgency);

  useEffect(() => {
    if (!selectedId) {
      setDraft(emptyAgency);
      return;
    }

    const selected = agencies?.find((agency) => agency.id === selectedId);
    if (selected) {
      setDraft(selected);
    }
  }, [agencies, selectedId]);

  const mutation = useMutation({
    mutationFn: saveAgency,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["agencies"] });
      toast({ title: "Agence enregistree" });
      setSelectedId(null);
      setDraft(emptyAgency);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error?.message || "Impossible d'enregistrer l'agence",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!draft.name?.trim() || !draft.city?.trim()) {
      toast({ title: "Nom et ville requis", variant: "destructive" });
      return;
    }

    const selectedCoordinates =
      draft.latitude != null && draft.longitude != null
        ? { latitude: draft.latitude, longitude: draft.longitude }
        : extractCoordinatesFromMapUrl(draft.mapUrl);

    if (!selectedCoordinates) {
      toast({
        title: "Position requise",
        description: "Choisissez l'emplacement sur la carte avant d'enregistrer l'agence.",
        variant: "destructive",
      });
      return;
    }

    mutation.mutate({
      id: draft.id,
      name: draft.name.trim(),
      city: draft.city.trim(),
      address: draft.address || "",
      phone: draft.phone || "",
      email: draft.email || "",
      latitude: selectedCoordinates.latitude,
      longitude: selectedCoordinates.longitude,
      mapUrl: buildGoogleMapsLink(selectedCoordinates.latitude, selectedCoordinates.longitude),
      isActive: draft.isActive ?? true,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestion des agences</h1>
          <p className="text-sm text-muted-foreground">Chaque voiture peut maintenant etre rattachee a une agence precise avec ville et position carte.</p>
        </div>
        <Button
          type="button"
          className="gap-2"
          onClick={() => {
            setSelectedId(null);
            setDraft(emptyAgency);
          }}
        >
          <Plus className="h-4 w-4" />
          Nouvelle agence
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>{draft.id ? "Modifier l'agence" : "Nouvelle agence"}</CardTitle>
            <CardDescription>Renseignez la ville, puis cherchez le lieu sur la carte et cliquez dessus pour fixer la position.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nom</label>
                <Input value={draft.name || ""} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} placeholder="Agence Casablanca Centre" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Ville</label>
                <Input value={draft.city || ""} onChange={(event) => setDraft((current) => ({ ...current, city: event.target.value }))} placeholder="Casablanca" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Adresse</label>
              <Input value={draft.address || ""} onChange={(event) => setDraft((current) => ({ ...current, address: event.target.value }))} placeholder="Boulevard, quartier, repere..." />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Telephone</label>
                <Input value={draft.phone || ""} onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))} placeholder="+212 6..." />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input value={draft.email || ""} onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))} placeholder="agence@location.ma" />
              </div>
            </div>

            <LocationMapPicker
              key={draft.id ?? "new-agency"}
              latitude={draft.latitude ?? extractCoordinatesFromMapUrl(draft.mapUrl)?.latitude ?? null}
              longitude={draft.longitude ?? extractCoordinatesFromMapUrl(draft.mapUrl)?.longitude ?? null}
              initialQuery={draft.city || draft.address || draft.name || ""}
              onChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  latitude: value.latitude,
                  longitude: value.longitude,
                  mapUrl: value.mapUrl,
                }))
              }
            />

            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={draft.isActive ?? true}
                onChange={(event) => setDraft((current) => ({ ...current, isActive: event.target.checked }))}
              />
              Agence active
            </label>

            {draft.latitude != null && draft.longitude != null && (
              <a
                href={buildGoogleMapsLink(draft.latitude, draft.longitude)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-2xl border bg-muted/20 px-4 py-3 text-sm text-primary"
              >
                <MapPinned className="h-4 w-4" />
                Ouvrir l'emplacement
              </a>
            )}

            <Button type="button" className="w-full" onClick={handleSubmit} disabled={mutation.isPending}>
              {mutation.isPending ? "Enregistrement..." : draft.id ? "Mettre a jour" : "Creer l'agence"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Agences disponibles</CardTitle>
            <CardDescription>Le catalogue public et la fiche vehicule reutilisent directement ces agences.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-24 w-full rounded-2xl" />)
            ) : agencies && agencies.length > 0 ? (
              agencies.map((agency) => (
                <button
                  key={agency.id}
                  type="button"
                  onClick={() => setSelectedId(agency.id)}
                  className={`flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition ${
                    selectedId === agency.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                  }`}
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border bg-muted/20">
                    <MapPinned className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{agency.name}</span>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {agency.carsCount || 0} vehicule(s)
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {agency.city}
                      {agency.address ? ` - ${agency.address}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {agency.isActive ? "Active" : "Inactive"}
                    </p>
                  </div>
                </button>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                Aucune agence pour le moment.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
