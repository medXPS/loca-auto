import { useListExpenses, useCreateExpense, useListCars, getListExpensesQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Plus, Receipt } from "lucide-react";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const expenseSchema = z.object({
  carId: z.coerce.number().min(1, "Véhicule requis"),
  type: z.string().min(1, "Type requis"),
  amount: z.coerce.number().min(1, "Montant invalide"),
  date: z.string().min(1, "Date requise"),
  description: z.string().optional(),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

export default function AdminExpenses() {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createExpense = useCreateExpense();
  
  const { data: expensesData, isLoading: expensesLoading } = useListExpenses({ limit: 100 });
  const { data: carsData } = useListCars({ limit: 100 });

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      carId: 0,
      type: "MAINTENANCE",
      amount: 0,
      date: new Date().toISOString().split("T")[0],
      description: "",
    },
  });

  const onSubmit = (data: ExpenseFormValues) => {
    createExpense.mutate({ data }, {
      onSuccess: () => {
        toast({ title: "Charge ajoutée" });
        queryClient.invalidateQueries({ queryKey: getListExpensesQueryKey() });
        setIsOpen(false);
        form.reset();
      },
      onError: (error: any) => {
        toast({ title: "Erreur", description: error.message, variant: "destructive" });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Gestion des charges</h1>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" /> Ajouter une charge
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouvelle charge</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <FormField control={form.control} name="carId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Véhicule concerné</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value.toString()}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Sélectionnez un véhicule" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {carsData?.cars.map(car => (
                          <SelectItem key={car.id} value={car.id.toString()}>{car.brand} {car.model} ({car.licensePlate || "Sans plaque"})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="type" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type de charge</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                          <SelectItem value="INSURANCE">Assurance</SelectItem>
                          <SelectItem value="TAX">Taxe / Vignette</SelectItem>
                          <SelectItem value="CLEANING">Lavage</SelectItem>
                          <SelectItem value="OTHER">Autre</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="amount" render={({ field }) => (
                    <FormItem><FormLabel>Montant (MAD)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="date" render={({ field }) => (
                  <FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem><FormLabel>Description (Optionnelle)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />

                <Button type="submit" className="w-full" disabled={createExpense.isPending}>
                  {createExpense.isPending ? "Ajout en cours..." : "Ajouter la charge"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-destructive/10 rounded-full text-destructive">
              <Receipt className="w-5 h-5" />
            </div>
            <p className="font-medium text-muted-foreground">Total des charges (Période)</p>
          </div>
          <p className="text-3xl font-bold ml-16">{formatPrice(expensesData?.totalAmount || 0)}</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
              <tr>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Véhicule (ID)</th>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium">Description</th>
                <th className="px-6 py-4 font-medium text-right">Montant</th>
              </tr>
            </thead>
            <tbody>
              {expensesLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="border-b">
                    <td className="px-6 py-4"><Skeleton className="h-5 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-40" /></td>
                    <td className="px-6 py-4 text-right"><Skeleton className="h-5 w-20 ml-auto" /></td>
                  </tr>
                ))
              ) : expensesData?.expenses && expensesData.expenses.length > 0 ? (
                expensesData.expenses.map((expense) => (
                  <tr key={expense.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-6 py-4 font-medium">
                      {new Date(expense.date).toLocaleDateString("fr-MA")}
                    </td>
                    <td className="px-6 py-4">
                      Voiture #{expense.carId}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-muted rounded text-xs font-medium">
                        {expense.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {expense.description || "—"}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-destructive">
                      {formatPrice(expense.amount)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-2">
                    <Empty className="border-0">
                      <EmptyHeader>
                        <EmptyMedia variant="icon"><Receipt /></EmptyMedia>
                        <EmptyTitle>Aucune charge enregistrée</EmptyTitle>
                        <EmptyDescription>Enregistrez les charges (maintenance, assurance…) liées à vos véhicules.</EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
