import { Button } from "@/components/ui/button";
import { useUpdateRentalRequestStatus, useConfirmCall, useConfirmPayment } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Phone, Check, CreditCard, Ban, Key, Undo2, Flag } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface RequestActionsProps {
  requestId: number;
  status: string;
  estimatedPrice?: number | null;
  onSuccess: () => void;
}

export function RequestActions({ requestId, status, estimatedPrice, onSuccess }: RequestActionsProps) {
  const { toast } = useToast();
  const updateStatus = useUpdateRentalRequestStatus();
  const confirmCall = useConfirmCall();
  const confirmPayment = useConfirmPayment();

  const [notes, setNotes] = useState("");
  const [amount, setAmount] = useState("");
  const [finalPrice, setFinalPrice] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState<string | null>(null);

  const handleStatusUpdate = (newStatus: string) => {
    updateStatus.mutate(
      { id: requestId, data: { status: newStatus, notes } },
      {
        onSuccess: () => {
          toast({ title: "Statut mis à jour avec succès" });
          setIsDialogOpen(false);
          setFinalPrice("");
          setNotes("");
          onSuccess();
        },
        onError: (error: any) => {
          toast({ title: "Erreur", description: error.message, variant: "destructive" });
        }
      }
    );
  };

  const handleConfirmCall = () => {
    const parsedFinalPrice = Number(finalPrice);
    confirmCall.mutate(
      {
        id: requestId,
        data: {
          notes,
          ...(parsedFinalPrice > 0 ? { finalPrice: parsedFinalPrice } : {}),
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Appel confirmé avec succès" });
          setIsDialogOpen(false);
          setFinalPrice("");
          setNotes("");
          onSuccess();
        },
        onError: (error: any) => {
          toast({ title: "Erreur", description: error.message, variant: "destructive" });
        }
      }
    );
  };

  const handleConfirmPayment = () => {
    confirmPayment.mutate(
      { id: requestId, data: { amount: Number(amount) || undefined, notes } },
      {
        onSuccess: () => {
          toast({ title: "Paiement confirmé avec succès" });
          setIsDialogOpen(false);
          setAmount("");
          setFinalPrice("");
          setNotes("");
          onSuccess();
        },
        onError: (error: any) => {
          toast({ title: "Erreur", description: error.message, variant: "destructive" });
        }
      }
    );
  };

  const executeAction = () => {
    if (currentAction === "REJECTED" || currentAction === "ABANDONED" || currentAction === "CAR_DELIVERED" || currentAction === "CAR_RETURNED" || currentAction === "COMPLETED" || currentAction === "CALL_ATTEMPTED") {
      handleStatusUpdate(currentAction);
    } else if (currentAction === "CALL_CONFIRMED") {
      handleConfirmCall();
    } else if (currentAction === "PAYMENT_CONFIRMED") {
      handleConfirmPayment();
    }
  };

  const openDialog = (action: string) => {
    setCurrentAction(action);
    setFinalPrice(action === "CALL_CONFIRMED" && estimatedPrice ? String(estimatedPrice) : "");
    setIsDialogOpen(true);
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {(status === "PENDING" || status === "UNDER_REVIEW") && (
          <>
            <Button size="sm" variant="outline" onClick={() => openDialog("CALL_ATTEMPTED")} className="gap-2">
              <Phone className="w-4 h-4" /> Appel effectué
            </Button>
            <Button size="sm" onClick={() => openDialog("CALL_CONFIRMED")} className="gap-2">
              <Check className="w-4 h-4" /> Confirmer appel
            </Button>
            <Button size="sm" variant="destructive" onClick={() => openDialog("REJECTED")} className="gap-2">
              <Ban className="w-4 h-4" /> Refuser
            </Button>
          </>
        )}

        {status === "CALL_ATTEMPTED" && (
          <>
            <Button size="sm" onClick={() => openDialog("CALL_CONFIRMED")} className="gap-2">
              <Check className="w-4 h-4" /> Confirmer appel
            </Button>
            <Button size="sm" variant="destructive" onClick={() => openDialog("REJECTED")} className="gap-2">
              <Ban className="w-4 h-4" /> Refuser
            </Button>
          </>
        )}

        {status === "CALL_CONFIRMED" && (
          <>
            <Button size="sm" onClick={() => openDialog("PAYMENT_CONFIRMED")} className="gap-2">
              <CreditCard className="w-4 h-4" /> Confirmer paiement
            </Button>
            <Button size="sm" variant="destructive" onClick={() => openDialog("ABANDONED")} className="gap-2">
              <Flag className="w-4 h-4" /> Abandonner
            </Button>
          </>
        )}

        {status === "WAITING_AGENCY_PAYMENT" && (
          <>
            <Button size="sm" onClick={() => openDialog("PAYMENT_CONFIRMED")} className="gap-2">
              <CreditCard className="w-4 h-4" /> Confirmer paiement
            </Button>
            <Button size="sm" variant="destructive" onClick={() => openDialog("ABANDONED")} className="gap-2">
              <Flag className="w-4 h-4" /> Abandonner
            </Button>
          </>
        )}

        {status === "RESERVED" && (
          <>
            <Button size="sm" onClick={() => openDialog("CAR_DELIVERED")} className="gap-2">
              <Key className="w-4 h-4" /> Livrer voiture
            </Button>
            <Button size="sm" variant="destructive" onClick={() => openDialog("REJECTED")} className="gap-2">
              <Ban className="w-4 h-4" /> Refuser
            </Button>
          </>
        )}

        {status === "CAR_DELIVERED" && (
          <Button size="sm" onClick={() => openDialog("CAR_RETURNED")} className="gap-2">
            <Undo2 className="w-4 h-4" /> Voiture retournée
          </Button>
        )}

        {status === "CAR_RETURNED" && (
          <Button size="sm" onClick={() => openDialog("COMPLETED")} className="gap-2">
            <Check className="w-4 h-4" /> Terminer location
          </Button>
        )}
      </div>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setAmount("");
            setFinalPrice("");
            setNotes("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer l'action</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir effectuer cette action ? Vous pouvez ajouter des notes optionnelles.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {currentAction === "CALL_CONFIRMED" && (
              <div className="space-y-2">
                <Label>Prix final (MAD)</Label>
                <Input
                  type="number"
                  min="0"
                  value={finalPrice}
                  onChange={(e) => setFinalPrice(e.target.value)}
                  placeholder={estimatedPrice ? `Ex: ${estimatedPrice}` : "Ex: 1500"}
                />
              </div>
            )}
            {currentAction === "PAYMENT_CONFIRMED" && (
              <div className="space-y-2">
                <Label>Montant payé (MAD)</Label>
                <Input 
                  type="number" 
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)} 
                  placeholder="Ex: 1500" 
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>Notes (Optionnel)</Label>
              <Input 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
                placeholder="Ajouter un commentaire..." 
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
            <Button 
              onClick={executeAction}
              disabled={updateStatus.isPending || confirmCall.isPending || confirmPayment.isPending}
            >
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
