import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { submitRating } from "@/lib/fleet-catalog";
import { cn } from "@/lib/utils";

interface RatingEditorProps {
  rentalRequestId: number;
  defaultCarScore?: number | null;
  defaultServiceScore?: number | null;
  defaultComment?: string | null;
  onSaved?: () => void;
}

function ScoreSelector({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="rounded-2xl border border-white/70 bg-background/90 p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-foreground">{label}</div>
          <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>
        </div>
        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
          {value}/5
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5].map((starValue) => {
          const selected = value >= starValue;

          return (
            <button
              key={starValue}
              type="button"
              onClick={() => onChange(starValue)}
              className={cn(
                "rounded-full p-2 transition",
                selected
                  ? "bg-amber-100 text-amber-500"
                  : "bg-slate-100 text-slate-400 hover:bg-primary/10 hover:text-primary",
              )}
              aria-label={`${starValue} etoile${starValue > 1 ? "s" : ""} pour ${label.toLowerCase()}`}
            >
              <Star className={cn("h-5 w-5", selected && "fill-current")} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function RatingEditor({
  rentalRequestId,
  defaultCarScore,
  defaultServiceScore,
  defaultComment,
  onSaved,
}: RatingEditorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [carScore, setCarScore] = useState(defaultCarScore ?? 5);
  const [serviceScore, setServiceScore] = useState(
    defaultServiceScore ?? defaultCarScore ?? 5,
  );
  const [comment, setComment] = useState(defaultComment || "");

  useEffect(() => {
    setCarScore(defaultCarScore ?? 5);
    setServiceScore(defaultServiceScore ?? defaultCarScore ?? 5);
    setComment(defaultComment || "");
  }, [defaultCarScore, defaultComment, defaultServiceScore]);

  const mutation = useMutation({
    mutationFn: submitRating,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["eligible-ratings"] }),
        queryClient.invalidateQueries({ queryKey: ["public-ratings"] }),
      ]);
      toast({ title: "Avis enregistre" });
      onSaved?.();
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error?.message || "Impossible d'enregistrer l'avis",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-4 rounded-[1.5rem] border border-primary/10 bg-gradient-to-br from-primary/8 via-background to-secondary/10 p-4 shadow-[0_16px_36px_-28px_hsl(var(--primary)/0.45)]">
      <div className="grid gap-3 md:grid-cols-2">
        <ScoreSelector
          label="Voiture"
          hint="Qualite du vehicule, confort, etat general"
          value={carScore}
          onChange={setCarScore}
        />
        <ScoreSelector
          label="Service"
          hint="Accueil, accompagnement et experience globale"
          value={serviceScore}
          onChange={setServiceScore}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-foreground">Commentaire</div>
            <div className="text-xs text-muted-foreground">
              Un seul retour par reservation, modifiable a tout moment.
            </div>
          </div>
        </div>

        <Textarea
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          className="min-h-24 rounded-2xl bg-background"
          placeholder="Racontez votre experience en quelques mots"
        />
      </div>

      <Button
        type="button"
        onClick={() =>
          mutation.mutate({
            rentalRequestId,
            score: carScore,
            serviceScore,
            comment,
          })
        }
        disabled={mutation.isPending}
        className="w-full rounded-full"
      >
        {mutation.isPending ? "Enregistrement..." : "Publier mon avis"}
      </Button>
    </div>
  );
}
