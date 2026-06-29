import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, MapPinned, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { deleteAgency, fetchAgencies, saveAgency, type AgencyRecord } from "@/lib/fleet-catalog";

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

function extractCoordinatesFromGoogleMapsUrl(mapUrl?: string | null) {
  if (!mapUrl) return null;

  const decoded = decodeURIComponent(mapUrl);
  const patterns = [
    /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,
    /[?&](?:q|query)=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
  ];

  for (const pattern of patterns) {
    const match = decoded.match(pattern);
    if (!match) continue;

    const latitude = Number(match[1]);
    const longitude = Number(match[2]);

    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      return { latitude, longitude };
    }
  }

  return null;
}

function normalizeGoogleMapsUrl(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) return "";

  try {
    const url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
    const host = url.hostname.toLowerCase();
    const isGoogleMapsLink =
      host === "maps.app.goo.gl" ||
      host === "goo.gl" ||
      host === "maps.google.com" ||
      (host.includes("google.") && url.pathname.includes("/maps"));

    return isGoogleMapsLink ? url.toString() : null;
  } catch {
    return null;
  }
}

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
      setDraft({ ...selected, mapUrl: selected.mapUrl || "" });
    }
  }, [agencies, selectedId]);

  const saveMutation = useMutation({
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

  const deleteMutation = useMutation({
    mutationFn: deleteAgency,
    onSuccess: async (_, deletedId) => {
      await queryClient.invalidateQueries({ queryKey: ["agencies"] });
      toast({ title: "Agence supprimee" });

      if (selectedId === deletedId) {
        setSelectedId(null);
        setDraft(emptyAgency);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error?.message || "Impossible de supprimer l'agence",
        variant: "destructive",
      });
    },
  });

  const coordinatesFromLink = extractCoordinatesFromGoogleMapsUrl(draft.mapUrl);

  const startNewAgency = () => {
    setSelectedId(null);
    setDraft(emptyAgency);
  };

  const handleSubmit = () => {
    if (!draft.name?.trim() || !draft.city?.trim()) {
      toast({ title: "Nom et ville requis", variant: "destructive" });
      return;
    }

    const mapUrl = normalizeGoogleMapsUrl(draft.mapUrl);

    if (!mapUrl) {
      toast({
        title: "Lien Google Maps requis",
        description: "Collez un lien Google Maps valide pour l'agence.",
        variant: "destructive",
      });
      return;
    }

    const coordinates = extractCoordinatesFromGoogleMapsUrl(mapUrl);

    saveMutation.mutate({
      id: draft.id,
      name: draft.name.trim(),
      city: draft.city.trim(),
      address: draft.address || "",
      phone: draft.phone || "",
      email: draft.email || "",
      latitude: coordinates?.latitude ?? null,
      longitude: coordinates?.longitude ?? null,
      mapUrl,
      isActive: draft.isActive ?? true,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestion des agences</h1>
          <p className="text-sm text-muted-foreground">
            Ajoutez, modifiez ou supprimez vos agences. La position se gere avec un lien Google Maps.
          </p>
        </div>
        <Button type="button" className="gap-2" onClick={startNewAgency}>
          <Plus className="h-4 w-4" />
          Nouvelle agence
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_440px]">
        <Card>
          <CardHeader>
            <CardTitle>Agences disponibles</CardTitle>
            <CardDescription>Cliquez sur une agence pour modifier ses informations.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-24 w-full rounded-2xl" />)
            ) : agencies && agencies.length > 0 ? (
              agencies.map((agency) => (
                <div
                  key={agency.id}
                  className={cn(
                    "grid gap-3 rounded-2xl border p-4 transition sm:grid-cols-[minmax(0,1fr)_auto]",
                    selectedId === agency.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedId(agency.id)}
                    className="flex min-w-0 items-start gap-4 text-left"
                  >
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border bg-muted/20">
                      <MapPinned className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">{agency.name}</span>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          {agency.carsCount || 0} véhicule(s)
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

                  <div className="flex items-center gap-2 sm:justify-end">
                    <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => setSelectedId(agency.id)}>
                      <Pencil className="h-4 w-4" />
                      Modifier
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button type="button" variant="outline" size="icon" className="rounded-full text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer cette agence ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Les véhicules restent dans le catalogue, mais ils ne seront plus rattachés à cette agence.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => deleteMutation.mutate(agency.id)}
                          >
                            Supprimer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                Aucune agence pour le moment.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>{draft.id ? "Modifier l'agence" : "Nouvelle agence"}</CardTitle>
                <CardDescription>Collez simplement le lien Google Maps de l'agence.</CardDescription>
              </div>
              {draft.id && (
                <Button type="button" variant="ghost" size="icon" className="rounded-full" onClick={startNewAgency}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nom</label>
                <Input
                  value={draft.name || ""}
                  onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Agence Casablanca Centre"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Ville</label>
                <Input
                  value={draft.city || ""}
                  onChange={(event) => setDraft((current) => ({ ...current, city: event.target.value }))}
                  placeholder="Casablanca"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Adresse</label>
              <Input
                value={draft.address || ""}
                onChange={(event) => setDraft((current) => ({ ...current, address: event.target.value }))}
                placeholder="Boulevard, quartier, repere..."
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
              <div className="space-y-2">
                <label className="text-sm font-medium">Téléphone</label>
                <Input
                  value={draft.phone || ""}
                  onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))}
                  placeholder="+212 6..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  value={draft.email || ""}
                  onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))}
                  placeholder="agence@location.ma"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Lien Google Maps</label>
              <Input
                value={draft.mapUrl || ""}
                onChange={(event) => setDraft((current) => ({ ...current, mapUrl: event.target.value }))}
                placeholder="https://maps.app.goo.gl/..."
              />
              <p className="text-xs leading-5 text-muted-foreground">
                {coordinatesFromLink
                  ? `Coordonnees detectees: ${coordinatesFromLink.latitude.toFixed(6)}, ${coordinatesFromLink.longitude.toFixed(6)}`
                  : "Les liens courts Google Maps sont acceptes et seront enregistres tels quels."}
              </p>
            </div>

            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={draft.isActive ?? true}
                onChange={(event) => setDraft((current) => ({ ...current, isActive: event.target.checked }))}
              />
              Agence active
            </label>

            {draft.mapUrl && normalizeGoogleMapsUrl(draft.mapUrl) && (
              <a
                href={normalizeGoogleMapsUrl(draft.mapUrl) || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-2xl border bg-muted/20 px-4 py-3 text-sm text-primary"
              >
                <ExternalLink className="h-4 w-4" />
                Ouvrir dans Google Maps
              </a>
            )}

            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
              <Button type="button" className="w-full" onClick={handleSubmit} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Enregistrement..." : draft.id ? "Mettre a jour" : "Creer l'agence"}
              </Button>

              {draft.id && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="outline" className="w-full text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                      Supprimer l'agence
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Supprimer cette agence ?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Les véhicules restent dans le catalogue, mais ils ne seront plus rattachés à cette agence.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={() => draft.id && deleteMutation.mutate(draft.id)}
                      >
                        Supprimer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
