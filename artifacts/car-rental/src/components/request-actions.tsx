import { useState } from "react";
import { Phone, Check, CreditCard, Ban, Key, Undo2, Flag, TimerReset } from "lucide-react";
import { customFetch, useUpdateRentalRequestStatus, useConfirmCall, useConfirmPayment } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { downloadReceiptPdf } from "@/lib/receipt";

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
  const [paymentMethod, setPaymentMethod] = useState("CASH_AT_AGENCY");
  const [finalPrice, setFinalPrice] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState<string | null>(null);

  const handleStatusUpdate = (newStatus: string) => {
    updateStatus.mutate(
      { id: requestId, data: { status: newStatus, notes } as any },
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
        },
      },
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
        } as any,
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
        },
      },
    );
  };

  const handleConfirmPayment = () => {
    const parsedAmount = Number(amount);
    confirmPayment.mutate(
      {
        id: requestId,
        data: {
          amount: Number.isFinite(parsedAmount) && parsedAmount > 0 ? parsedAmount : undefined,
          paymentMethod,
          notes,
        } as any,
      },
      {
        onSuccess: async () => {
          toast({ title: "Paiement confirmé avec succès" });
          setIsDialogOpen(false);
          setAmount("");
          setPaymentMethod("CASH_AT_AGENCY");
          setFinalPrice("");
          setNotes("");
          onSuccess();

          try {
            await downloadReceiptPdf(requestId, `receipt-${String(requestId).padStart(6, "0")}.pdf`);
          } catch (error: any) {
            toast({
              title: "Reçu disponible",
              description: error?.message || "Le paiement est validé, mais le téléchargement automatique a échoué.",
            });
          }
        },
        onError: (error: any) => {
          toast({ title: "Erreur", description: error.message, variant: "destructive" });
        },
      },
    );
  };

  const handleExtendDeadline = async (hours: 12 | 24) => {
    try {
      await customFetch(`/api/rental-requests/${requestId}/extend-payment-deadline`, {
        method: "PATCH",
        body: JSON.stringify({ hours }),
      });
      toast({ title: `Delai prolonge de ${hours}h` });
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error?.message || "Impossible de prolonger le delai.",
        variant: "destructive",
      });
    }
  };

  const executeAction = () => {
    if (
      currentAction === "REJECTED" ||
      currentAction === "ABANDONED" ||
      currentAction === "CAR_DELIVERED" ||
      currentAction === "CAR_RETURNED" ||
      currentAction === "RETURNED" ||
      currentAction === "COMPLETED" ||
      currentAction === "CALL_ATTEMPTED"
    ) {
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
    setAmount(action === "PAYMENT_CONFIRMED" && estimatedPrice ? String(estimatedPrice) : "");
    setPaymentMethod("CASH_AT_AGENCY");
    setIsDialogOpen(true);
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {(status === "PENDING" || status === "UNDER_REVIEW" || status === "PENDING_CALL_CONFIRMATION") && (
          <>
            <Button size="sm" variant="outline" onClick={() => openDialog("CALL_ATTEMPTED")} className="gap-2">
              <Phone className="w-4 h-4" /> Appel tenté
            </Button>
            <Button size="sm" onClick={() => openDialog("CALL_CONFIRMED")} className="gap-2">
              <Check className="w-4 h-4" /> Appel confirmé
            </Button>
            <Button size="sm" variant="destructive" onClick={() => openDialog("REJECTED")} className="gap-2">
              <Ban className="w-4 h-4" /> Refuser
            </Button>
          </>
        )}

        {status === "CALL_ATTEMPTED" && (
          <>
            <Button size="sm" onClick={() => openDialog("CALL_CONFIRMED")} className="gap-2">
              <Check className="w-4 h-4" /> Appel confirmé
            </Button>
            <Button size="sm" variant="destructive" onClick={() => openDialog("REJECTED")} className="gap-2">
              <Ban className="w-4 h-4" /> Refuser
            </Button>
          </>
        )}

        {(status === "CALL_CONFIRMED" || status === "EXTENDED_PAYMENT_DEADLINE" || status === "WAITING_AGENCY_PAYMENT") && (
          <>
            <Button size="sm" onClick={() => openDialog("PAYMENT_CONFIRMED")} className="gap-2">
              <CreditCard className="w-4 h-4" /> Enregistrer paiement
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleExtendDeadline(12)} className="gap-2">
              <TimerReset className="w-4 h-4" /> +12h
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleExtendDeadline(24)} className="gap-2">
              <TimerReset className="w-4 h-4" /> +24h
            </Button>
            <Button size="sm" variant="destructive" onClick={() => openDialog("ABANDONED")} className="gap-2">
              <Flag className="w-4 h-4" /> Marquer abandonné
            </Button>
          </>
        )}

        {(status === "RESERVED" || status === "PAID") && (
          <>
            <Button size="sm" onClick={() => openDialog("CAR_DELIVERED")} className="gap-2">
              <Key className="w-4 h-4" /> Remettre le véhicule
            </Button>
            <Button size="sm" variant="outline" onClick={() => openDialog("ABANDONED")} className="gap-2">
              <Flag className="w-4 h-4" /> Abandonner
            </Button>
          </>
        )}

        {(status === "CAR_DELIVERED" || status === "RENTED") && (
          <Button size="sm" onClick={() => openDialog("CAR_RETURNED")} className="gap-2">
            <Undo2 className="w-4 h-4" /> Retour du véhicule
          </Button>
        )}

        {(status === "CAR_RETURNED" || status === "RETURNED") && (
          <Button size="sm" onClick={() => openDialog("COMPLETED")} className="gap-2">
            <Check className="w-4 h-4" /> Clôturer
          </Button>
        )}
      </div>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setAmount("");
            setPaymentMethod("CASH_AT_AGENCY");
            setFinalPrice("");
            setNotes("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer l'action</DialogTitle>
            <DialogDescription>
              Vous pouvez ajouter des notes optionnelles avant d'enregistrer cette étape du workflow.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {currentAction === "CALL_CONFIRMED" && (
              <div className="space-y-2">
                <Label>Prix final estimé (MAD)</Label>
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
              <>
                <div className="space-y-2">
                  <Label>Montant payé (MAD)</Label>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Ex: 1500"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mode de paiement</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH_AT_AGENCY">Espèces à l'agence</SelectItem>
                      <SelectItem value="CARD_AT_AGENCY">Carte à l'agence</SelectItem>
                      <SelectItem value="BANK_TRANSFER">Virement bancaire</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label>Notes (optionnel)</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ajouter un commentaire..." />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={executeAction} disabled={updateStatus.isPending || confirmCall.isPending || confirmPayment.isPending}>
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
