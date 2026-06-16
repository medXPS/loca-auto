import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getGetMeQueryKey,
  getGetMyCustomerProfileQueryKey,
  useGetMyCustomerProfile,
  useUpdateMyCustomerProfile,
} from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, FileText, ShieldCheck, Star, UserCircle2 } from "lucide-react";
import { DocumentUploadField } from "@/components/document-upload-field";
import { RatingEditor } from "@/components/rating-editor";
import { fetchEligibleRatings } from "@/lib/fleet-catalog";

const profileSchema = z.object({
  fullName: z.string().min(2, { message: "Nom requis" }),
  phone: z.string().min(10, { message: "Telephone requis" }),
  cin: z.string().optional(),
  passportNumber: z.string().optional(),
  drivingLicenseNumber: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

function formatFileLabel(fileUrl: string) {
  const fileName = fileUrl.split("/").pop();
  return fileName && fileName.trim() ? fileName : fileUrl;
}

export default function CustomerProfile() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useGetMyCustomerProfile();
  const updateProfile = useUpdateMyCustomerProfile();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: eligibleRatings = [] } = useQuery({
    queryKey: ["eligible-ratings"],
    queryFn: fetchEligibleRatings,
    enabled: !!user,
  });

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      cin: "",
      passportNumber: "",
      drivingLicenseNumber: "",
      address: "",
      city: "",
    },
  });

  useEffect(() => {
    if (!profile) return;

    form.reset({
      fullName: profile.user?.fullName ?? "",
      phone: profile.user?.phone ?? "",
      cin: profile.cin || "",
      passportNumber: profile.passportNumber || "",
      drivingLicenseNumber: profile.drivingLicenseNumber || "",
      address: profile.address || "",
      city: profile.city || "",
    });
  }, [profile, form]);

  const profileDocs = (profile?.documents ?? []).filter((doc) => doc.rentalRequestId == null);
  const cinDoc = profileDocs.find((doc) => doc.type === "CIN");
  const passportDoc = profileDocs.find((doc) => doc.type === "PASSPORT");
  const drivingDoc = profileDocs.find((doc) => doc.type === "PERMIS_CONDUIRE");
  const profileComplete = Boolean((profile?.cin || profile?.passportNumber || cinDoc || passportDoc) && (profile?.drivingLicenseNumber || drivingDoc));

  const onSubmit = (data: ProfileFormValues) => {
    updateProfile.mutate(
      { data },
      {
        onSuccess: () => {
          toast({ title: "Profil mis a jour avec succes" });
          queryClient.invalidateQueries({ queryKey: getGetMyCustomerProfileQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        },
        onError: (error: any) => {
          toast({ title: "Erreur", description: error.message, variant: "destructive" });
        },
      }
    );
  };

  const refreshProfile = () => {
    queryClient.invalidateQueries({ queryKey: getGetMyCustomerProfileQueryKey() });
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Skeleton className="h-[560px] w-full rounded-[1.5rem]" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 py-8">
      <div className="flex flex-col gap-4 rounded-[1.75rem] border border-primary/10 bg-gradient-to-br from-primary/8 via-background to-secondary/10 p-6 shadow-[0_24px_70px_-45px_hsl(var(--primary)/0.55)] sm:p-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <Badge variant="secondary" className="w-fit gap-2 rounded-full px-3 py-1">
              <UserCircle2 className="h-3.5 w-3.5" />
              Mon espace client
            </Badge>
            <div>
              <h1 className="text-3xl font-serif font-bold tracking-tight sm:text-4xl">Mon profil</h1>
              <p className="mt-2 max-w-2xl text-muted-foreground">
                Mettez a jour vos coordonnees, enregistrez votre CIN et votre permis, puis remplacez
                vos documents quand vous voulez.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="rounded-2xl border border-primary/10 bg-background/80 px-4 py-3 shadow-sm">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Compte</div>
              <div className="mt-1 flex items-center gap-2 text-sm font-medium">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                {user?.emailVerifiedAt ? "Email verifie" : "Email a verifier"}
              </div>
            </div>
            <div className="rounded-2xl border border-primary/10 bg-background/80 px-4 py-3 shadow-sm">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Dossier</div>
              <div className="mt-1 flex items-center gap-2 text-sm font-medium">
                <CheckCircle2 className={`h-4 w-4 ${profileComplete ? "text-emerald-500" : "text-amber-500"}`} />
                {profileComplete ? "Complet" : "A completer"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-border/60 shadow-[0_18px_45px_-28px_hsl(var(--primary)/0.45)]">
          <CardHeader className="border-b bg-muted/20">
            <CardTitle>Informations personnelles</CardTitle>
            <CardDescription>Ces informations sont reprises dans vos reservations et votre dossier client.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom complet</FormLabel>
                        <FormControl>
                          <Input placeholder="Mohammed Alami" {...field} />
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
                        <FormLabel>Telephone</FormLabel>
                        <FormControl>
                          <Input placeholder="+212 6..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={user?.email || ""} disabled className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Input value="Client" disabled className="bg-muted" />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="cin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CIN</FormLabel>
                        <FormControl>
                          <Input placeholder="AB123456" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="passportNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Passport</FormLabel>
                        <FormControl>
                          <Input placeholder="Optionnel" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="drivingLicenseNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Permis de conduire</FormLabel>
                        <FormControl>
                          <Input placeholder="12/34567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="space-y-2">
                    <Label>Conseil</Label>
                    <div className="rounded-2xl border border-dashed border-primary/15 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
                      Completez la CIN et le permis pour pre-remplir vos futures reservations.
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Adresse</FormLabel>
                        <FormControl>
                          <Input placeholder="Adresse complete" {...field} />
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
                        <FormLabel>Ville</FormLabel>
                        <FormControl>
                          <Input placeholder="Casablanca" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end border-t pt-4">
                  <Button type="submit" disabled={updateProfile.isPending}>
                    {updateProfile.isPending ? "Enregistrement..." : "Enregistrer les modifications"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-[0_18px_45px_-28px_hsl(var(--primary)/0.35)]">
          <CardHeader className="border-b bg-muted/20">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Mes documents
            </CardTitle>
            <CardDescription>Vous pouvez televerser puis remplacer vos fichiers sans perdre votre dossier.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <DocumentUploadField
              label="CIN"
              docType="CIN"
              existingDocument={cinDoc}
              onUploaded={refreshProfile}
              helperText="Ajoutez une copie de votre carte d'identite nationale."
            />

            <DocumentUploadField
              label="Passeport"
              docType="PASSPORT"
              existingDocument={passportDoc}
              onUploaded={refreshProfile}
              helperText="Ajoutez votre passeport si vous preferez ce document."
            />

            <DocumentUploadField
              label="Permis de conduire"
              docType="PERMIS_CONDUIRE"
              existingDocument={drivingDoc}
              onUploaded={refreshProfile}
              helperText="Ajoutez votre permis pour accelerer la reservation."
            />

            <div className="rounded-2xl border border-primary/10 bg-primary/5 p-4">
              <div className="mb-3 text-sm font-medium">Documents charges</div>
              {profileDocs.length > 0 ? (
                <ul className="space-y-2">
                  {profileDocs.map((doc) => (
                    <li key={doc.id} className="flex items-center justify-between gap-3 rounded-xl border border-background/70 bg-background/80 px-3 py-2 text-sm shadow-sm">
                      <div className="min-w-0">
                        <div className="font-medium">
                          {doc.type === "CIN" ? "CIN" : doc.type === "PASSPORT" ? "Passeport" : "Permis de conduire"}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">{formatFileLabel(doc.fileUrl)}</div>
                      </div>
                      <Badge variant="outline">{doc.status}</Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Aucun document televerse pour le moment.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 shadow-[0_18px_45px_-28px_hsl(var(--primary)/0.25)]">
        <CardHeader className="border-b bg-muted/20">
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            Mes avis
          </CardTitle>
          <CardDescription>Seuls les clients ayant termine une location peuvent laisser une note ou la modifier.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          {eligibleRatings.length > 0 ? (
            eligibleRatings.map((item) => (
              <div key={item.requestId} className="rounded-[1.5rem] border border-border/70 bg-background p-4 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex gap-4">
                    {item.car?.mainImageUrl ? (
                      <img
                        src={item.car.mainImageUrl}
                        alt={`${item.car.brand} ${item.car.model}`}
                        className="h-24 w-32 rounded-2xl object-cover"
                      />
                    ) : (
                      <div className="flex h-24 w-32 items-center justify-center rounded-2xl border bg-muted/20 text-sm text-muted-foreground">
                        Sans image
                      </div>
                    )}
                    <div>
                      <div className="text-lg font-semibold">
                        {item.car ? `${item.car.brand} ${item.car.model}` : `Reservation #${item.requestId}`}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Du {item.startDate} au {item.returnDate}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.existingRating ? "Avis deja publie, vous pouvez le mettre a jour." : "Partagez votre retour apres cette location."}
                      </p>
                    </div>
                  </div>

                  <div className="min-w-[320px] max-w-xl flex-1">
                    <RatingEditor
                      rentalRequestId={item.requestId}
                      defaultScore={item.existingRating?.score}
                      defaultComment={item.existingRating?.comment}
                    />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-primary/20 bg-primary/5 px-4 py-6 text-sm text-muted-foreground">
              Aucune location terminee a noter pour le moment.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
