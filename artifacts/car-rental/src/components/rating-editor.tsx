import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { submitRating } from "@/lib/fleet-catalog";
import { cn } from "@/lib/utils";

interface RatingEditorProps {
  rentalRequestId: number;
  defaultScore?: number | null;
  defaultComment?: string | null;
  onSaved?: () => void;
}

export function RatingEditor({
  rentalRequestId,
  defaultScore,
  defaultComment,
  onSaved,
}: RatingEditorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [score, setScore] = useState(defaultScore || 5);
  const [comment, setComment] = useState(defaultComment || "");

  const mutation = useMutation({
    mutationFn: submitRating,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["eligible-ratings"] });
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
    <div className="space-y-4 rounded-2xl border border-primary/10 bg-primary/5 p-4">
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setScore(value)}
            className={cn(
              "rounded-full p-2 transition",
              score >= value ? "bg-primary/10 text-primary" : "bg-background text-muted-foreground hover:text-primary",
            )}
            aria-label={`${value} etoile${value > 1 ? "s" : ""}`}
          >
            <Star className={cn("h-5 w-5", score >= value && "fill-current")} />
          </button>
        ))}
      </div>

      <Textarea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        className="min-h-24 bg-background"
        placeholder="Comment s'est passee votre location ?"
      />

      <Button
        type="button"
        onClick={() => mutation.mutate({ rentalRequestId, score, comment })}
        disabled={mutation.isPending}
      >
        {mutation.isPending ? "Enregistrement..." : "Publier mon avis"}
      </Button>
    </div>
  );
}
