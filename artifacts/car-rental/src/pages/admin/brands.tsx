import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, ImagePlus, Plus, Trash2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { deleteBrand, fetchBrands, saveBrand, type BrandRecord } from "@/lib/fleet-catalog";

const emptyBrand: Omit<BrandRecord, "id"> = {
  name: "",
  logoUrl: "",
  websiteUrl: "",
  description: "",
  carsCount: 0,
};

export default function AdminBrands() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: brands, isLoading } = useQuery({
    queryKey: ["brands"],
    queryFn: fetchBrands,
  });

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Partial<BrandRecord>>(emptyBrand);

  useEffect(() => {
    if (!selectedId) {
      setDraft(emptyBrand);
      return;
    }

    const selected = brands?.find((brand) => brand.id === selectedId);
    if (selected) {
      setDraft(selected);
    }
  }, [brands, selectedId]);

  const saveMutation = useMutation({
    mutationFn: saveBrand,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["brands"] });
      toast({ title: "Marque enregistrée" });
      setSelectedId(null);
      setDraft(emptyBrand);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error?.message || "Impossible d'enregistrer la marque",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBrand,
    onSuccess: async (_, deletedId) => {
      await queryClient.invalidateQueries({ queryKey: ["brands"] });
      toast({ title: "Marque supprimée" });

      if (selectedId === deletedId) {
        setSelectedId(null);
        setDraft(emptyBrand);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error?.message || "Impossible de supprimer la marque",
        variant: "destructive",
      });
    },
  });

  const handleLogoUpload = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setDraft((current) => ({ ...current, logoUrl: String(reader.result) }));
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!draft.name?.trim()) {
      toast({ title: "Nom requis", variant: "destructive" });
      return;
    }

    saveMutation.mutate({
      id: draft.id,
      name: draft.name.trim(),
      logoUrl: draft.logoUrl || "",
      websiteUrl: draft.websiteUrl || "",
      description: draft.description || "",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestion des marques</h1>
          <p className="text-sm text-muted-foreground">
            Ajoutez les marques, leurs logos et réutilisez-les ensuite dans les fiches véhicules.
          </p>
        </div>
        <Button
          type="button"
          className="gap-2"
          onClick={() => {
            setSelectedId(null);
            setDraft(emptyBrand);
          }}
        >
          <Plus className="h-4 w-4" />
          Nouvelle marque
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>{draft.id ? "Modifier la marque" : "Nouvelle marque"}</CardTitle>
            <CardDescription>
              Vous pouvez coller un lien, un domaine, ou charger un logo local.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nom</label>
              <Input
                value={draft.name || ""}
                onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                placeholder="Ex: Renault"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Site ou domaine</label>
              <Input
                value={draft.websiteUrl || ""}
                onChange={(event) => setDraft((current) => ({ ...current, websiteUrl: event.target.value }))}
                placeholder="renault.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Logo (URL ou data URL)</label>
              <Input
                value={draft.logoUrl || ""}
                onChange={(event) => setDraft((current) => ({ ...current, logoUrl: event.target.value }))}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Logo local</label>
              <Input type="file" accept="image/*" onChange={(event) => handleLogoUpload(event.target.files?.[0])} />
            </div>

            {draft.logoUrl ? (
              <div className="flex h-24 items-center justify-center rounded-2xl border bg-muted/20 p-4">
                <img src={draft.logoUrl} alt={draft.name || "Logo"} className="max-h-full max-w-full object-contain" />
              </div>
            ) : (
              <div className="flex h-24 items-center justify-center rounded-2xl border border-dashed text-sm text-muted-foreground">
                Aperçu du logo
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={draft.description || ""}
                onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
                className="min-h-28"
                placeholder="Électrique, SUV, premium..."
              />
            </div>

            <Button type="button" className="w-full" onClick={handleSubmit} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Enregistrement..." : draft.id ? "Mettre à jour" : "Créer la marque"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Marques disponibles</CardTitle>
            <CardDescription>
              Une marque bien renseignée simplifie la sélection des véhicules et le bandeau de logos public.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-24 w-full rounded-2xl" />)
            ) : brands && brands.length > 0 ? (
              brands.map((brand) => {
                const carsCount = brand.carsCount || 0;
                const canDelete = carsCount === 0;

                return (
                  <div
                    key={brand.id}
                    className={`grid gap-3 rounded-2xl border p-4 transition sm:grid-cols-[minmax(0,1fr)_auto] ${
                      selectedId === brand.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedId(brand.id)}
                      className="flex min-w-0 items-start gap-4 text-left"
                    >
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border bg-white p-3">
                        {brand.logoUrl ? (
                          <img src={brand.logoUrl} alt={brand.name} className="max-h-full max-w-full object-contain" />
                        ) : (
                          <ImagePlus className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold">{brand.name}</span>
                          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                            {carsCount} véhicule(s)
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                          {brand.websiteUrl || brand.description || "Aucune précision"}
                        </p>
                      </div>
                    </button>

                    <div className="flex items-center gap-2 sm:justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-full"
                        onClick={() => setSelectedId(brand.id)}
                      >
                        Modifier
                      </Button>

                      {canDelete ? (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="rounded-full text-destructive hover:text-destructive"
                              aria-label={`Supprimer ${brand.name}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Supprimer cette marque ?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Cette action est irréversible. La marque sera retirée du catalogue.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => deleteMutation.mutate(brand.id)}
                              >
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="rounded-full text-muted-foreground"
                          disabled
                          title="Impossible de supprimer une marque utilisée par des véhicules"
                          aria-label={`Supprimer ${brand.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}

                      <BadgeCheck className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                Aucune marque pour le moment.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
