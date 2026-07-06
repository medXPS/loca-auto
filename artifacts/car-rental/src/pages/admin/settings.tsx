import {
  COMPANY_PRICING_DEFAULTS,
  getGetCompanySettingsQueryKey,
  useGetCompanySettings,
  useUpdateCompanySettings,
} from "@workspace/api-client-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const settingsSchema = z
  .object({
    brandName: z.string().min(1, "Requis"),
    slogan: z.string().optional(),
    phone: z.string().min(1, "Requis"),
    whatsapp: z.string().optional(),
    email: z.string().email().optional().or(z.literal("")),
    address: z.string().optional(),
    city: z.string().optional(),
    taxRatePercent: z.coerce.number().min(0, "Minimum 0 %").max(100, "Maximum 100 %"),
    discountTier1MinDays: z.coerce.number().int().min(1, "Minimum 1 jour"),
    discountTier1Percent: z.coerce.number().min(0, "Minimum 0 %").max(100, "Maximum 100 %"),
    discountTier2MinDays: z.coerce.number().int().min(1, "Minimum 1 jour"),
    discountTier2Percent: z.coerce.number().min(0, "Minimum 0 %").max(100, "Maximum 100 %"),
    discountTier3MinDays: z.coerce.number().int().min(1, "Minimum 1 jour"),
    discountTier3Percent: z.coerce.number().min(0, "Minimum 0 %").max(100, "Maximum 100 %"),
    paymentDeadlineHours: z.coerce.number().min(24, "Le delai minimum est de 24 h"),
  })
  .refine((data) => data.discountTier2MinDays > data.discountTier1MinDays, {
    path: ["discountTier2MinDays"],
    message: "Le palier 2 doit etre superieur au palier 1.",
  })
  .refine((data) => data.discountTier3MinDays > data.discountTier2MinDays, {
    path: ["discountTier3MinDays"],
    message: "Le palier 3 doit etre superieur au palier 2.",
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
      taxRatePercent: COMPANY_PRICING_DEFAULTS.taxRatePercent,
      discountTier1MinDays: COMPANY_PRICING_DEFAULTS.discountTier1MinDays,
      discountTier1Percent: COMPANY_PRICING_DEFAULTS.discountTier1Percent,
      discountTier2MinDays: COMPANY_PRICING_DEFAULTS.discountTier2MinDays,
      discountTier2Percent: COMPANY_PRICING_DEFAULTS.discountTier2Percent,
      discountTier3MinDays: COMPANY_PRICING_DEFAULTS.discountTier3MinDays,
      discountTier3Percent: COMPANY_PRICING_DEFAULTS.discountTier3Percent,
      paymentDeadlineHours: 24,
    },
  });

  useEffect(() => {
    if (!settings) return;

    form.reset({
      brandName: settings.brandName || "",
      slogan: settings.slogan || "",
      phone: settings.phone || "",
      whatsapp: settings.whatsapp || "",
      email: settings.email || "",
      address: settings.address || "",
      city: settings.city || "",
      taxRatePercent:
        settings.taxRatePercent ?? COMPANY_PRICING_DEFAULTS.taxRatePercent,
      discountTier1MinDays:
        settings.discountTier1MinDays ??
        COMPANY_PRICING_DEFAULTS.discountTier1MinDays,
      discountTier1Percent:
        settings.discountTier1Percent ??
        COMPANY_PRICING_DEFAULTS.discountTier1Percent,
      discountTier2MinDays:
        settings.discountTier2MinDays ??
        COMPANY_PRICING_DEFAULTS.discountTier2MinDays,
      discountTier2Percent:
        settings.discountTier2Percent ??
        COMPANY_PRICING_DEFAULTS.discountTier2Percent,
      discountTier3MinDays:
        settings.discountTier3MinDays ??
        COMPANY_PRICING_DEFAULTS.discountTier3MinDays,
      discountTier3Percent:
        settings.discountTier3Percent ??
        COMPANY_PRICING_DEFAULTS.discountTier3Percent,
      paymentDeadlineHours: Math.max(settings.paymentDeadlineHours || 24, 24),
    });
  }, [form, settings]);

  const onSubmit = (data: SettingsFormValues) => {
    updateSettings.mutate(
      { data },
      {
        onSuccess: () => {
          toast({ title: "Parametres mis a jour avec succes" });
          queryClient.invalidateQueries({
            queryKey: getGetCompanySettingsQueryKey(),
          });
        },
        onError: (error: any) => {
          toast({
            title: "Erreur",
            description: error.message,
            variant: "destructive",
          });
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <Skeleton className="h-[780px] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      <h1 className="text-2xl font-bold tracking-tight">
        Parametres de l&apos;entreprise
      </h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations generales</CardTitle>
              <CardDescription>
                Ces informations sont affichees sur le site public.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="brandName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom de la marque</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="slogan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slogan</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telephone principal</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="whatsapp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Numero WhatsApp</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email de contact</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ville principale</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="paymentDeadlineHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Delai de paiement agence (24 h minimum)</FormLabel>
                      <FormControl>
                        <Input type="number" min={24} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresse complete</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
              <CardHeader>
                <CardTitle>Parametrage des prix</CardTitle>
                <CardDescription>
                  Les remises sont appliquees par blocs, du plus grand palier vers
                  le plus petit, avant calcul de la TVA. Exemple: 69 jours = bloc
                  60 jours + bloc 7 jours + 2 jours au tarif normal.
                </CardDescription>
              </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="taxRatePercent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>TVA (%)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} max={100} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-border/70 p-4">
                  <p className="text-sm font-semibold text-foreground">Palier 1</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Premiere remise automatique.
                  </p>
                  <div className="mt-4 grid gap-4">
                    <FormField
                      control={form.control}
                      name="discountTier1MinDays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duree minimum (jours)</FormLabel>
                          <FormControl>
                            <Input type="number" min={1} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="discountTier1Percent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Remise (%)</FormLabel>
                          <FormControl>
                            <Input type="number" min={0} max={100} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-border/70 p-4">
                  <p className="text-sm font-semibold text-foreground">Palier 2</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Remise moyenne duree.
                  </p>
                  <div className="mt-4 grid gap-4">
                    <FormField
                      control={form.control}
                      name="discountTier2MinDays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duree minimum (jours)</FormLabel>
                          <FormControl>
                            <Input type="number" min={1} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="discountTier2Percent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Remise (%)</FormLabel>
                          <FormControl>
                            <Input type="number" min={0} max={100} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-border/70 p-4">
                  <p className="text-sm font-semibold text-foreground">Palier 3</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Remise longue duree.
                  </p>
                  <div className="mt-4 grid gap-4">
                    <FormField
                      control={form.control}
                      name="discountTier3MinDays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duree minimum (jours)</FormLabel>
                          <FormControl>
                            <Input type="number" min={1} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="discountTier3Percent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Remise (%)</FormLabel>
                          <FormControl>
                            <Input type="number" min={0} max={100} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end border-t pt-4">
            <Button type="submit" disabled={updateSettings.isPending}>
              {updateSettings.isPending
                ? "Sauvegarde..."
                : "Enregistrer les parametres"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
