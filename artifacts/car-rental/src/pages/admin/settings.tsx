import { useGetCompanySettings, useUpdateCompanySettings, getGetCompanySettingsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const settingsSchema = z.object({
  brandName: z.string().min(1, "Requis"),
  slogan: z.string().optional(),
  phone: z.string().min(1, "Requis"),
  whatsapp: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  city: z.string().optional(),
  paymentDeadlineHours: z.coerce.number().min(24, "Le délai minimum est de 24 h"),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function AdminSettings() {
  const { data: settings, isLoading } = useGetCompanySettings();
  const updateSettings = useUpdateCompanySettings();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      brandName: "Location Auto Maroc",
      slogan: "",
      phone: "",
      whatsapp: "",
      email: "",
      address: "",
      city: "Casablanca",
      paymentDeadlineHours: 24,
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        brandName: settings.brandName || "",
        slogan: settings.slogan || "",
        phone: settings.phone || "",
        whatsapp: settings.whatsapp || "",
        email: settings.email || "",
        address: settings.address || "",
        city: settings.city || "",
        paymentDeadlineHours: Math.max(settings.paymentDeadlineHours || 24, 24),
      });
    }
  }, [settings, form]);

  const onSubmit = (data: SettingsFormValues) => {
    updateSettings.mutate({ data }, {
      onSuccess: () => {
        toast({ title: "Paramètres mis à jour avec succès" });
        queryClient.invalidateQueries({ queryKey: getGetCompanySettingsQueryKey() });
      },
      onError: (error: any) => {
        toast({ title: "Erreur", description: error.message, variant: "destructive" });
      }
    });
  };

  if (isLoading) return <div className="p-8"><Skeleton className="h-[600px] w-full rounded-xl" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <h1 className="text-2xl font-bold tracking-tight">Paramètres de l'entreprise</h1>

      <Card>
        <CardHeader>
          <CardTitle>Informations générales</CardTitle>
          <CardDescription>Ces informations sont affichées sur le site public.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="brandName" render={({ field }) => (
                  <FormItem><FormLabel>Nom de la marque</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="slogan" render={({ field }) => (
                  <FormItem><FormLabel>Slogan</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem><FormLabel>Téléphone principal</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="whatsapp" render={({ field }) => (
                  <FormItem><FormLabel>Numéro WhatsApp</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Email de contact</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="city" render={({ field }) => (
                  <FormItem><FormLabel>Ville principale</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="paymentDeadlineHours" render={({ field }) => (
                  <FormItem><FormLabel>Délai de paiement agence (24 h minimum)</FormLabel><FormControl><Input type="number" min={24} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              
              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem><FormLabel>Adresse complète</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />

              <div className="flex justify-end pt-4 border-t">
                <Button type="submit" disabled={updateSettings.isPending}>
                  {updateSettings.isPending ? "Sauvegarde..." : "Enregistrer les paramètres"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
