import { useGetMyCustomerProfile, useUpdateMyCustomerProfile, getGetMyCustomerProfileQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

const profileSchema = z.object({
  fullName: z.string().min(2, { message: "Nom requis" }),
  phone: z.string().min(10, { message: "Téléphone requis" }),
  cin: z.string().optional(),
  passportNumber: z.string().optional(),
  drivingLicenseNumber: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function CustomerProfile() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useGetMyCustomerProfile();
  const updateProfile = useUpdateMyCustomerProfile();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      phone: user?.phone || "",
      cin: "",
      passportNumber: "",
      drivingLicenseNumber: "",
      address: "",
      city: "",
    },
  });

  useEffect(() => {
    if (profile && user) {
      form.reset({
        fullName: user.fullName,
        phone: user.phone,
        cin: profile.cin || "",
        passportNumber: profile.passportNumber || "",
        drivingLicenseNumber: profile.drivingLicenseNumber || "",
        address: profile.address || "",
        city: profile.city || "",
      });
    }
  }, [profile, user, form]);

  const onSubmit = (data: ProfileFormValues) => {
    // Note: The API might expect updating user fields (fullName, phone) separately from customer fields (cin, etc.)
    // We send everything to the update endpoint and let the backend handle it
    updateProfile.mutate({ data }, {
      onSuccess: () => {
        toast({ title: "Profil mis à jour avec succès" });
        queryClient.invalidateQueries({ queryKey: getGetMyCustomerProfileQueryKey() });
      },
      onError: (error: any) => {
        toast({ title: "Erreur", description: error.message, variant: "destructive" });
      }
    });
  };

  if (isLoading) return <div className="p-8 max-w-2xl mx-auto"><Skeleton className="h-[500px] w-full rounded-xl" /></div>;

  return (
    <div className="space-y-6 max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-serif font-bold tracking-tight mb-8">Mon Profil</h1>

      <Card>
        <CardHeader>
          <CardTitle>Informations personnelles</CardTitle>
          <CardDescription>Mettez à jour vos coordonnées et documents pour faciliter vos futures locations.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Contact</h3>
                  <FormField control={form.control} name="fullName" render={({ field }) => (
                    <FormItem><FormLabel>Nom complet</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem><FormLabel>Téléphone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <div className="space-y-2">
                    <FormLabel>Email (Non modifiable)</FormLabel>
                    <Input value={user?.email} disabled className="bg-muted" />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Documents</h3>
                  <FormField control={form.control} name="cin" render={({ field }) => (
                    <FormItem><FormLabel>CIN (Carte Nationale)</FormLabel><FormControl><Input placeholder="Ex: AB123456" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="passportNumber" render={({ field }) => (
                    <FormItem><FormLabel>N° Passeport</FormLabel><FormControl><Input placeholder="Optionnel" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="drivingLicenseNumber" render={({ field }) => (
                    <FormItem><FormLabel>N° Permis de conduire</FormLabel><FormControl><Input placeholder="Ex: 12/34567" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>

                <div className="space-y-4 md:col-span-2">
                  <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Adresse</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="address" render={({ field }) => (
                      <FormItem><FormLabel>Adresse complète</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="city" render={({ field }) => (
                      <FormItem><FormLabel>Ville</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end">
                <Button type="submit" disabled={updateProfile.isPending}>
                  {updateProfile.isPending ? "Enregistrement..." : "Enregistrer les modifications"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
