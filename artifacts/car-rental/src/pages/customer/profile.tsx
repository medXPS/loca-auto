import { useEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getGetMeQueryKey,
  getGetMyCustomerProfileQueryKey,
  customFetch,
  useGetMyCustomerProfile,
  useGetUploadUrl,
  useUpdateMe,
  useUpdateMyCustomerProfile,
  useUploadDocument,
} from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DocumentDownloadButton } from "@/components/document-download-button";
import { RatingEditor } from "@/components/rating-editor";
import { fetchEligibleRatings, type EligibleRatingRecord } from "@/lib/fleet-catalog";
import { cn, getStatusLabel } from "@/lib/utils";
import {
  CalendarDays,
  CheckCircle2,
  CloudUpload,
  ArrowRight,
  FileText,
  IdCard,
  LockKeyhole,
  Mail,
  MapPin,
  PenLine,
  Phone,
  ShieldCheck,
  Star,
  Upload,
  UserCircle2,
} from "lucide-react";

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

type CustomerDocument = {
  id: number;
  fileUrl: string;
  type?: string | null;
  status?: string | null;
  uploadedAt?: string | Date | null;
};

const documentTypeLabels: Record<string, string> = {
  CIN: "Carte nationale d'identité",
  PASSPORT: "Passeport",
  PERMIS_CONDUIRE: "Permis de conduire",
  AUTRE: "Autre document",
};

const profileDocumentUploadOptions = [
  { value: "CIN", label: "Carte nationale d'identité" },
  { value: "PERMIS_CONDUIRE", label: "Permis de conduire" },
  { value: "PASSPORT", label: "Passeport" },
  { value: "AUTRE", label: "Autre document" },
] as const;

function formatFileLabel(fileUrl: string) {
  const fileName = fileUrl.split("/").pop();
  return fileName && fileName.trim() ? fileName : fileUrl;
}

function formatDate(value?: string | Date | null) {
  if (!value) return "Non renseigné";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "Non renseigné";
  return date.toLocaleDateString("fr-MA");
}

function parseDateValue(value?: string | Date | null) {
  if (!value) return 0;
  const date = typeof value === "string" ? new Date(value) : value;
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function getDocumentTypeLabel(type?: string | null) {
  if (!type) return "Document";
  return documentTypeLabels[type] || type;
}

function sortDocumentsByRecency(left: CustomerDocument, right: CustomerDocument) {
  return parseDateValue(right.uploadedAt) - parseDateValue(left.uploadedAt) || right.id - left.id;
}

function getInitials(name?: string | null) {
  return (
    name
      ?.trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "U"
  );
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function renderStars(score: number) {
  const filled = Math.round(score);

  return Array.from({ length: 5 }).map((_, index) => (
    <Star
      key={index}
      className={cn("h-3.5 w-3.5", index < filled ? "fill-current text-amber-400" : "text-slate-300")}
    />
  ));
}

function renderRatingPill(label: string, score: number, tone: "neutral" | "accent" = "neutral") {
  const toneClasses =
    tone === "accent"
      ? "border-[#ff4d43]/15 bg-[#ff4d43]/10 text-[#ff4d43]"
      : "border-slate-200 bg-slate-50 text-slate-600";

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold", toneClasses)}>
      <span>{label} {score.toFixed(1)}</span>
      <Star className="h-3.5 w-3.5 shrink-0 fill-current" />
    </span>
  );
}

function HeroStatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone: "emerald" | "sky" | "rose";
}) {
  const toneClasses = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-600",
    sky: "border-sky-200 bg-sky-50 text-sky-600",
    rose: "border-rose-200 bg-rose-50 text-rose-600",
  };

  return (
    <div className="rounded-[1.3rem] border border-slate-200 bg-white p-4 shadow-[0_16px_40px_-28px_rgba(15,23,42,0.2)]">
      <div className="flex items-center gap-3">
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-2xl", toneClasses[tone])}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">{label}</p>
          <p className="mt-1 text-base font-semibold text-slate-950">{value}</p>
        </div>
      </div>
    </div>
  );
}

function ProfileRow({
  icon: Icon,
  label,
  value,
  secondary,
  action,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  secondary?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start gap-4 py-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-slate-500">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-400">{label}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-slate-950">{value}</p>
          {secondary ? <span className="text-xs text-slate-500">{secondary}</span> : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

function DocumentSlot({
  label,
  helperText,
  icon: Icon,
  accentClassName,
  existingDocument,
  onUploaded,
  docType,
}: {
  label: string;
  helperText: string;
  icon: ComponentType<{ className?: string }>;
  accentClassName: string;
  existingDocument?: CustomerDocument | null;
  onUploaded: () => void;
  docType: "CIN" | "PASSPORT" | "PERMIS_CONDUIRE" | "AUTRE";
}) {
  const { toast } = useToast();
  const getUploadUrl = useGetUploadUrl();
  const uploadDocument = useUploadDocument();
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const existingName = existingDocument ? formatFileLabel(existingDocument.fileUrl) : null;
  const updatedAt = existingDocument?.uploadedAt ? formatDate(existingDocument.uploadedAt) : null;

  const pickFile = () => {
    inputRef.current?.click();
  };

  const handleUpload = async () => {
    if (!selectedFile || isUploading) return;

    setIsUploading(true);

    try {
      const presign = await getUploadUrl.mutateAsync({
        data: { fileName: selectedFile.name, fileType: selectedFile.type, context: "documents" },
      });

      const response = await customFetch<{ fileUrl: string }>(presign.uploadUrl, {
        method: "PUT",
        body: selectedFile,
        ...(selectedFile.type ? { headers: { "Content-Type": selectedFile.type } } : {}),
      });

      await uploadDocument.mutateAsync({
        data: {
          type: docType,
          fileUrl: response.fileUrl || presign.fileUrl,
        },
      });

      setSelectedFile(null);
      if (inputRef.current) inputRef.current.value = "";
      onUploaded();
      toast({ title: `${label} téléversé avec succès` });
    } catch {
      toast({
        title: "Erreur de téléversement",
        description: "Réessayez ou contactez le support.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="rounded-[1.2rem] border border-slate-200 bg-white p-4 shadow-[0_16px_34px_-28px_rgba(15,23,42,0.16)]">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl", accentClassName)}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-semibold text-slate-950">{label}</p>
              {existingDocument ? (
                <Badge
                  variant="secondary"
                  className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em]"
                >
                  {existingDocument.status ? getStatusLabel(existingDocument.status, "document") : "Actif"}
                </Badge>
              ) : null}
            </div>
            <p className="mt-1 text-xs text-slate-500">{existingName ? existingName : helperText}</p>
            {updatedAt ? <p className="mt-1 text-[11px] text-slate-400">Mis à jour le {updatedAt}</p> : null}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {existingDocument ? (
            <DocumentDownloadButton
              fileUrl={existingDocument.fileUrl}
              filename={existingName || undefined}
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full border-slate-200 bg-white text-slate-700"
            />
          ) : null}

          <Button
            type="button"
            variant={existingDocument ? "outline" : "default"}
            size="sm"
            className={cn("rounded-full", !existingDocument && "bg-[#ff4d43] text-white hover:bg-[#f03d32]")}
            onClick={pickFile}
            disabled={isUploading}
          >
            <Upload className="h-4 w-4" />
            {existingDocument ? "Remplacer" : "Téléverser"}
          </Button>
        </div>
      </div>

      {selectedFile ? (
        <div className="mt-3 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <CloudUpload className="h-4 w-4 shrink-0" />
            <span className="min-w-0 truncate">{selectedFile.name}</span>
          </div>
          <Button
            type="button"
            className="rounded-full bg-[#ff4d43] text-white hover:bg-[#f03d32]"
            onClick={() => void handleUpload()}
            disabled={isUploading}
          >
            {isUploading ? "Téléversement..." : "Envoyer le fichier"}
          </Button>
        </div>
      ) : null}

      <input ref={inputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={(event) => {
        const file = event.target.files?.[0] ?? null;
        event.target.value = "";
        setSelectedFile(file);
      }} />
    </div>
  );
}

function QuickDocumentDropzone({ onUploaded }: { onUploaded: () => void }) {
  const { toast } = useToast();
  const getUploadUrl = useGetUploadUrl();
  const uploadDocument = useUploadDocument();
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedType, setSelectedType] = useState<(typeof profileDocumentUploadOptions)[number]["value"]>("AUTRE");
  const [isUploading, setIsUploading] = useState(false);

  const pickFile = () => {
    inputRef.current?.click();
  };

  const handleUpload = async () => {
    if (!selectedFile || isUploading) return;

    setIsUploading(true);

    try {
      const presign = await getUploadUrl.mutateAsync({
        data: { fileName: selectedFile.name, fileType: selectedFile.type, context: "documents" },
      });

      const response = await customFetch<{ fileUrl: string }>(presign.uploadUrl, {
        method: "PUT",
        body: selectedFile,
        ...(selectedFile.type ? { headers: { "Content-Type": selectedFile.type } } : {}),
      });

      await uploadDocument.mutateAsync({
        data: {
          type: selectedType,
          fileUrl: response.fileUrl || presign.fileUrl,
        },
      });

      setSelectedFile(null);
      if (inputRef.current) inputRef.current.value = "";
      onUploaded();
      toast({ title: "Document téléversé avec succès" });
    } catch {
      toast({
        title: "Erreur de téléversement",
        description: "Réessayez ou contactez le support.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50/80 p-5 shadow-[0_16px_34px_-28px_rgba(15,23,42,0.12)]">
      <div className="space-y-4">
        <div className="min-w-0 space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#ff4d43]/10 text-[#ff4d43]">
              <CloudUpload className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-950">Téléverser un document</p>
              <p className="mt-1 text-xs text-slate-500">
                Choisissez le type de document, sélectionnez votre fichier puis envoyez-le.
              </p>
            </div>
          </div>

          <div className="grid min-w-0 gap-3 md:grid-cols-[minmax(0,240px)_minmax(0,1fr)]">
            <div className="min-w-0 space-y-1.5">
              <Label className="text-xs font-medium text-slate-500">Type de document</Label>
              <Select value={selectedType} onValueChange={(value) => setSelectedType(value as typeof selectedType)}>
                <SelectTrigger className="h-11 rounded-2xl border-slate-200 bg-white">
                  <SelectValue placeholder="Choisir un type" />
                </SelectTrigger>
                <SelectContent>
                  {profileDocumentUploadOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-0 rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Fichier sélectionné</p>
              <p className="mt-1 truncate text-sm font-medium text-slate-950">
                {selectedFile ? selectedFile.name : "Aucun fichier sélectionné"}
              </p>
              <p className="mt-1 text-xs text-slate-500">PDF, JPG ou PNG, 5 Mo maximum.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <Button type="button" variant="outline" className="w-full rounded-full border-slate-200 sm:w-auto" onClick={pickFile} disabled={isUploading}>
            Choisir un fichier
          </Button>
          <Button
            type="button"
            className="w-full rounded-full bg-[#ff4d43] text-white hover:bg-[#f03d32] sm:w-auto"
            onClick={() => void handleUpload()}
            disabled={!selectedFile || isUploading}
          >
            <Upload className="h-4 w-4" />
            {isUploading ? "Téléversement..." : "Téléverser"}
          </Button>
        </div>
      </div>

      <input ref={inputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={(event) => {
        const file = event.target.files?.[0] ?? null;
        event.target.value = "";
        setSelectedFile(file);
      }} />
    </div>
  );
}

function ReviewDialog({
  entry,
  onSaved,
}: {
  entry: EligibleRatingRecord & { existingRating: NonNullable<EligibleRatingRecord["existingRating"]> };
  onSaved?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const rating = entry.existingRating;
  const carName = entry.car ? `${entry.car.brand} ${entry.car.model}` : `Réservation #${entry.requestId}`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full border border-slate-200 text-slate-500 hover:text-slate-900"
          aria-label={`Modifier l'avis pour ${carName}`}
        >
          <PenLine className="h-4 w-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">{carName}</DialogTitle>
          <DialogDescription>
            Réservation #{entry.requestId} - avis modifiable à tout moment.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
          <div className="overflow-hidden rounded-[1.35rem] border border-slate-200 bg-slate-50">
            {entry.car?.mainImageUrl ? (
              <img
                src={entry.car.mainImageUrl}
                alt={carName}
                className="h-48 w-full object-cover"
              />
            ) : (
              <div className="flex h-48 items-center justify-center bg-slate-100 text-slate-400">
                <FileText className="h-10 w-10" />
              </div>
            )}
            <div className="space-y-2 p-4">
              <p className="text-sm font-semibold text-slate-950">{carName}</p>
              <p className="text-xs text-slate-500">
                Du {entry.startDate} au {entry.returnDate}
              </p>
              <div className="flex flex-wrap gap-2">
                {renderRatingPill("Voiture", rating.score)}
                {renderRatingPill("Service", rating.serviceScore ?? rating.score, "accent")}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <RatingEditor
              rentalRequestId={entry.requestId}
              defaultCarScore={rating.score}
              defaultServiceScore={rating.serviceScore ?? rating.score}
              defaultComment={rating.comment}
              onSaved={() => {
                setOpen(false);
                onSaved?.();
              }}
            />

            <Button asChild variant="outline" className="w-full rounded-full">
              <Link href={`/dashboard/demandes/${entry.requestId}`}>Voir la réservation</Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ReviewCard({ entry }: { entry: EligibleRatingRecord & { existingRating: NonNullable<EligibleRatingRecord["existingRating"]> } }) {
  const rating = entry.existingRating;
  const carName = entry.car ? `${entry.car.brand} ${entry.car.model}` : `Réservation #${entry.requestId}`;

  return (
    <article className="rounded-[1.2rem] border border-slate-200 bg-white p-3 shadow-[0_16px_34px_-28px_rgba(15,23,42,0.12)]">
      <div className="flex items-start gap-3">
        {entry.car?.mainImageUrl ? (
          <img
            src={entry.car.mainImageUrl}
            alt={carName}
            className="h-14 w-14 shrink-0 rounded-2xl object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <FileText className="h-5 w-5" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-950">{carName}</p>
              <div className="mt-1 flex items-center gap-1 text-amber-400">
                {renderStars(rating.score)}
                <span className="ml-1 text-xs font-semibold text-slate-600">{Math.round(rating.score)}/5</span>
              </div>
            </div>

            <Button asChild variant="ghost" className="h-8 px-0 text-sm font-semibold text-[#2f7de1] hover:bg-transparent hover:text-[#2469c2]">
              <Link href={`/dashboard/demandes/${entry.requestId}`}>Voir le détail</Link>
            </Button>
          </div>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            "{rating.comment?.trim() || "Pas de commentaire"}"
          </p>
        </div>
      </div>
    </article>
  );
}

export default function CustomerProfile() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useGetMyCustomerProfile();
  const updateMe = useUpdateMe();
  const updateProfile = useUpdateMyCustomerProfile();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(Boolean(user?.mfaEnabled));
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

  useEffect(() => {
    if (!profile?.user) return;
    setMfaEnabled(Boolean(profile.user.mfaEnabled));
  }, [profile?.user?.mfaEnabled]);

  const profileDocs = useMemo(
    () =>
      ((profile?.documents ?? [])
        .filter((doc) => doc.rentalRequestId == null)
        .sort(sortDocumentsByRecency) as CustomerDocument[]),
    [profile?.documents],
  );
  const documentsByType = useMemo(() => {
    const map = new Map<string, CustomerDocument>();

    for (const document of profileDocs) {
      if (document.type && !map.has(document.type)) {
        map.set(document.type, document);
      }
    }

    return map;
  }, [profileDocs]);

  const cinDoc = documentsByType.get("CIN") ?? null;
  const passportDoc = documentsByType.get("PASSPORT") ?? null;
  const drivingDoc = documentsByType.get("PERMIS_CONDUIRE") ?? null;
  const profileComplete = Boolean((profile?.cin || profile?.passportNumber || cinDoc || passportDoc) && (profile?.drivingLicenseNumber || drivingDoc));

  const refreshIdentity = () => {
    queryClient.invalidateQueries({ queryKey: getGetMyCustomerProfileQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
  };

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      await updateMe.mutateAsync({
        data: {
          fullName: data.fullName,
          phone: data.phone,
        },
      });

      await updateProfile.mutateAsync({
        data: {
          cin: data.cin || undefined,
          passportNumber: data.passportNumber || undefined,
          drivingLicenseNumber: data.drivingLicenseNumber || undefined,
          address: data.address || undefined,
          city: data.city || undefined,
        },
      });

      toast({ title: "Profil mis à jour avec succès" });
      setEditProfileOpen(false);
      refreshIdentity();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error?.message || "Impossible de mettre à jour votre profil",
        variant: "destructive",
      });
    }
  };

  const isSaving = updateMe.isPending || updateProfile.isPending;

  const refreshProfile = () => {
    queryClient.invalidateQueries({ queryKey: getGetMyCustomerProfileQueryKey() });
    void queryClient.refetchQueries({ queryKey: getGetMyCustomerProfileQueryKey(), type: "active" });
  };

  const handleMfaToggle = async (enabled: boolean) => {
    if (!user?.emailVerifiedAt) {
      toast({
        title: "Vérification requise",
        description: "Veuillez vérifier votre adresse e-mail avant de gérer le MFA.",
      });
      return;
    }

    const previousValue = mfaEnabled;
    setMfaEnabled(enabled);

    try {
      await updateMe.mutateAsync({
        data: { mfaEnabled: enabled },
      });
      toast({ title: enabled ? "MFA activée" : "MFA désactivée" });
      refreshIdentity();
    } catch (error: any) {
      setMfaEnabled(previousValue);
      toast({
        title: "Erreur",
        description: error?.message || "Impossible de mettre à jour le MFA",
        variant: "destructive",
      });
    }
  };

  const ratedEntries = useMemo(
    () =>
      eligibleRatings
        .filter((item): item is EligibleRatingRecord & { existingRating: NonNullable<EligibleRatingRecord["existingRating"]> } =>
          Boolean(item.existingRating),
        )
        .sort((left, right) => {
          const leftValue = new Date(left.existingRating!.updatedAt || left.existingRating!.createdAt || left.createdAt).getTime();
          const rightValue = new Date(right.existingRating!.updatedAt || right.existingRating!.createdAt || right.createdAt).getTime();
          return rightValue - leftValue;
        }),
    [eligibleRatings],
  );

  const pendingEntries = useMemo(
    () => eligibleRatings.filter((item) => !item.existingRating),
    [eligibleRatings],
  );

  const reviewStats = useMemo(() => {
    const carScores = ratedEntries.map((item) => item.existingRating.score);
    const serviceScores = ratedEntries.map((item) => item.existingRating.serviceScore ?? item.existingRating.score);
    const carAverage = average(carScores);
    const serviceAverage = average(serviceScores);
    const overallAverage = average([carAverage, serviceAverage]);

    return {
      total: ratedEntries.length,
      carAverage,
      serviceAverage,
      overallAverage,
    };
  }, [ratedEntries]);

  const reviewBreakdown = [
    { label: "Qualité des véhicules", value: reviewStats.carAverage },
    { label: "Service client", value: reviewStats.serviceAverage },
    { label: "Rapport qualité/prix", value: reviewStats.overallAverage },
  ];

  const recentReviews = ratedEntries.slice(0, 3);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Skeleton className="h-[560px] w-full rounded-[1.5rem]" />
      </div>
    );
  }

  return (
    <div className="bg-[radial-gradient(circle_at_top_right,rgba(255,77,67,0.06),transparent_24%),linear-gradient(180deg,#f7f8fc_0%,#eef2f8_100%)]">
      <div className="mx-auto max-w-[1220px] space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[2.15rem] border border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(247,249,253,0.98)_100%)] shadow-[0_24px_70px_-40px_rgba(15,23,42,0.18)]">
          <div className="grid gap-8 px-6 py-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-8 lg:py-10">
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                Mon profil
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
                Gérez vos informations personnelles, vos documents et la sécurité de votre compte.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <HeroStatCard
                icon={CheckCircle2}
                label="COMPTE"
                value={user?.emailVerifiedAt ? "Vérifié" : "À vérifier"}
                tone="emerald"
              />
              <HeroStatCard
                icon={FileText}
                label="DOSSIER"
                value={profileComplete ? "Complet" : "À compléter"}
                tone="rose"
              />
              <HeroStatCard
                icon={ShieldCheck}
                label="SÉCURITÉ"
                value={mfaEnabled ? "MFA activée" : "MFA désactivée"}
                tone="sky"
              />
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="overflow-hidden rounded-[1.6rem] border-slate-200 bg-white shadow-[0_18px_45px_-30px_rgba(15,23,42,0.18)]">
            <CardHeader className="border-b border-slate-200 pb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#ff4d43]/10 text-[#ff4d43]">
                  <UserCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">Informations personnelles</CardTitle>
                  <CardDescription>Vos informations personnelles, vos documents et votre adresse.</CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-2">
              <div className="divide-y divide-slate-200">
                <ProfileRow
                  icon={UserCircle2}
                  label="Nom complet"
                  value={profile?.user?.fullName || "Non renseigné"}
                />
                <ProfileRow
                  icon={Phone}
                  label="Téléphone"
                  value={profile?.user?.phone || "Non renseigné"}
                />
                <ProfileRow
                  icon={Mail}
                  label="Email"
                  value={profile?.user?.email || "Non renseigné"}
                  secondary={user?.emailVerifiedAt ? "Vérifié" : "À vérifier"}
                  action={
                    user?.emailVerifiedAt ? (
                      <Badge className="rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                        Vérifié
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="rounded-full">
                        À vérifier
                      </Badge>
                    )
                  }
                />
                <ProfileRow
                  icon={CalendarDays}
                  label="Date de naissance"
                  value="Non renseignée"
                />
                <ProfileRow
                  icon={IdCard}
                  label="CIN"
                  value={profile?.cin || "Non renseigné"}
                />
                <ProfileRow
                  icon={IdCard}
                  label="Permis de conduire"
                  value={profile?.drivingLicenseNumber || "Non renseigné"}
                />
                <ProfileRow
                  icon={MapPin}
                  label="Adresse"
                  value={profile?.address || "Non renseigné"}
                  secondary={profile?.city || undefined}
                />
              </div>

              <div className="pt-4">
                <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline" className="w-full rounded-full">
                      <PenLine className="h-4 w-4" />
                      Modifier mes informations
                    </Button>
                  </DialogTrigger>

                  <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
                    <DialogHeader>
                      <DialogTitle className="text-2xl">Modifier mes informations</DialogTitle>
                      <DialogDescription>
                        Mettez à jour votre identité et vos coordonnées personnelles.
                      </DialogDescription>
                    </DialogHeader>

                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="fullName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nom complet</FormLabel>
                                <FormControl>
                                  <Input className="rounded-2xl bg-white" placeholder="Mohammed Alami" {...field} />
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
                                <FormLabel>Téléphone</FormLabel>
                                <FormControl>
                                  <Input className="rounded-2xl bg-white" placeholder="+212 6..." {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="cin"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>CIN</FormLabel>
                                <FormControl>
                                  <Input className="rounded-2xl bg-white" placeholder="AB123456" {...field} />
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
                              <FormLabel>Passeport</FormLabel>
                              <FormControl>
                                  <Input className="rounded-2xl bg-white" placeholder="Facultatif" {...field} />
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
                                  <Input className="rounded-2xl bg-white" placeholder="12/34567" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Adresse</FormLabel>
                                <FormControl>
                                  <Input className="rounded-2xl bg-white" placeholder="Adresse complète" {...field} />
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
                                  <Input className="rounded-2xl bg-white" placeholder="Casablanca" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="flex justify-end pt-2">
                          <Button type="submit" disabled={isSaving} className="rounded-full px-6">
                            {isSaving ? "Enregistrement..." : "Enregistrer les modifications"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

            <Card className="overflow-hidden rounded-[1.6rem] border-slate-200 bg-white shadow-[0_18px_45px_-30px_rgba(15,23,42,0.18)]">
              <CardHeader className="border-b border-slate-200 pb-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#ff4d43]/10 text-[#ff4d43]">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Mes documents</CardTitle>
                    <CardDescription>Téléversez un document et consultez vos derniers envois.</CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 pt-5">
                <QuickDocumentDropzone onUploaded={refreshProfile} />

                <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50/80 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">Dernier téléversement</p>
                      <p className="mt-1 text-xs text-slate-500">Le fichier le plus récent apparaît en premier.</p>
                    </div>
                    <span className="text-xs text-slate-400">
                      {profileDocs.length} fichier{profileDocs.length > 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="mt-4 space-y-3">
                    {profileDocs.length > 0 ? (
                      <>
                        <div className="rounded-2xl border border-white bg-white px-4 py-4 shadow-[0_12px_28px_-22px_rgba(15,23,42,0.16)]">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge
                                  variant="secondary"
                                  className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em]"
                                >
                                  Dernier téléversement
                                </Badge>
                                <p className="text-sm font-semibold text-slate-950">
                                  {getDocumentTypeLabel(profileDocs[0].type)}
                                </p>
                              </div>
                              <p className="mt-1 truncate text-sm text-slate-600">
                                {formatFileLabel(profileDocs[0].fileUrl)}
                              </p>
                              <p className="mt-1 text-[11px] text-slate-400">
                                Téléversé le {formatDate(profileDocs[0].uploadedAt)}
                              </p>
                            </div>

                            <DocumentDownloadButton
                              fileUrl={profileDocs[0].fileUrl}
                              filename={formatFileLabel(profileDocs[0].fileUrl)}
                              variant="outline"
                              size="sm"
                              className="rounded-full border-slate-200 bg-white text-slate-700"
                            >
                              Télécharger
                            </DocumentDownloadButton>
                          </div>
                        </div>

                        {profileDocs.length > 1 ? (
                          <div className="space-y-3 rounded-2xl border border-dashed border-slate-200 bg-white/80 p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                              Autres documents récents
                            </p>
                            {profileDocs.slice(1, 4).map((document) => (
                              <div
                                key={document.id}
                                className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                              >
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-sm font-semibold text-slate-950">
                                      {getDocumentTypeLabel(document.type)}
                                    </p>
                                    <Badge
                                      variant="secondary"
                                      className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em]"
                                    >
                                      {document.status ? getStatusLabel(document.status, "document") : "Actif"}
                                    </Badge>
                                  </div>
                                  <p className="mt-1 truncate text-sm text-slate-600">
                                    {formatFileLabel(document.fileUrl)}
                                  </p>
                                  <p className="mt-1 text-[11px] text-slate-400">
                                    Téléversé le {formatDate(document.uploadedAt)}
                                  </p>
                                </div>

                                <DocumentDownloadButton
                                  fileUrl={document.fileUrl}
                                  filename={formatFileLabel(document.fileUrl)}
                                  variant="outline"
                                  size="sm"
                                  className="rounded-full border-slate-200 bg-white text-slate-700"
                                >
                                  Télécharger
                                </DocumentDownloadButton>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-6 text-sm text-slate-500">
                        Aucun document n’a encore été téléversé.
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden rounded-[1.6rem] border-slate-200 bg-white shadow-[0_18px_45px_-30px_rgba(15,23,42,0.18)]">
              <CardHeader className="border-b border-slate-200 pb-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#ff4d43]/10 text-[#ff4d43]">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Sécurité du compte</CardTitle>
                    <CardDescription>Gardez le contrôle sur votre accès et vos identifiants.</CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 pt-5">
                <div className="rounded-[1.2rem] border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50 text-slate-500">
                        <LockKeyhole className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-400">Mot de passe</p>
                        <p className="mt-1 text-sm font-semibold text-slate-950">••••••••••••</p>
                      </div>
                    </div>
                    <Button type="button" variant="outline" className="rounded-full">
                      Changer
                    </Button>
                  </div>
                </div>

                <div className="rounded-[1.2rem] border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50 text-slate-500">
                        <ShieldCheck className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-400">Authentification à deux facteurs (MFA)</p>
                        <p className="mt-1 text-sm text-slate-600">Activée pour plus de sécurité</p>
                      </div>
                    </div>
                    <Switch checked={mfaEnabled} onCheckedChange={handleMfaToggle} disabled={!user?.emailVerifiedAt || isSaving} />
                  </div>
                </div>

                <div className="rounded-[1.2rem] border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50 text-slate-500">
                        <CalendarDays className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-400">Sessions actives</p>
                        <p className="mt-1 text-sm font-semibold text-slate-950">1 session active</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full"
                      onClick={() =>
                        toast({
                          title: "Sessions actives",
                          description: "La gestion détaillée des sessions sera bientôt disponible.",
                        })
                      }
                    >
                      Voir
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden rounded-[1.6rem] border-slate-200 bg-white shadow-[0_18px_45px_-30px_rgba(15,23,42,0.18)]">
              <CardHeader className="border-b border-slate-200 pb-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#ff4d43]/10 text-[#ff4d43]">
                    <Star className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Mes avis</CardTitle>
                    <CardDescription>
                      Une seule fiche par réservation : note du véhicule, note du service et commentaire, modifiables à tout moment.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-5 pt-5">
                {ratedEntries.length > 0 ? (
                  <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
                    <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50/70 p-5">
                      <div className="text-center">
                        <p className="text-4xl font-semibold tracking-tight text-slate-950">
                          {reviewStats.overallAverage.toFixed(1)}
                        </p>
                        <div className="mt-3 flex items-center justify-center gap-1 text-amber-400">
                          {renderStars(reviewStats.overallAverage)}
                        </div>
                        <p className="mt-2 text-sm text-slate-500">Basé sur {reviewStats.total} avis</p>
                      </div>

                      <div className="mt-5 space-y-3">
                        {reviewBreakdown.map((item) => (
                          <div key={item.label} className="space-y-1">
                            <div className="flex items-center justify-between gap-3 text-sm">
                              <span className="text-slate-500">{item.label}</span>
                              <span className="font-semibold text-slate-900">{item.value.toFixed(1)}</span>
                            </div>
                            <div className="h-2 rounded-full bg-slate-200">
                              <div
                                className="h-2 rounded-full bg-gradient-to-r from-[#ffb347] to-[#ff7c3d]"
                                style={{ width: `${Math.min(100, Math.max(0, (item.value / 5) * 100))}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      {recentReviews.map((entry) => (
                        <ReviewCard key={entry.requestId} entry={entry} />
                      ))}

                      {ratedEntries.length > recentReviews.length ? (
                        <Button asChild variant="ghost" className="w-full justify-center gap-2 rounded-full text-slate-600 hover:text-slate-950">
                          <Link href="/dashboard/avis">
                            Voir tous mes avis
                          </Link>
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                    Aucun avis client publié pour le moment.
                  </div>
                )}
              </CardContent>
            </Card>
        </div>

      </div>
    </div>
  );
}
