import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  setAuthTokenGetter,
  useRegister,
  useResendVerification,
  useVerifyEmail,
} from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, MailCheck, Sparkles } from "lucide-react";

const registerSchema = z.object({
  fullName: z.string().min(2, { message: "Nom complet requis" }),
  email: z.string().email({ message: "Email invalide" }),
  password: z.string().min(6, { message: "Le mot de passe doit contenir au moins 6 caracteres" }),
  phone: z.string().min(10, { message: "Numero de telephone invalide" }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Register() {
  const [, setLocation] = useLocation();
  const { login: setAuthToken } = useAuth();
  const { toast } = useToast();
  const [verificationEmail, setVerificationEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      phone: "",
    },
  });

  const registerMutation = useRegister();
  const verifyEmailMutation = useVerifyEmail();
  const resendVerificationMutation = useResendVerification();
  const getErrorMessage = (error: any, fallback: string) => error?.data?.error || error?.message || fallback;

  const onSubmit = (data: RegisterFormValues) => {
    registerMutation.mutate(
      { data },
      {
        onSuccess: (res) => {
          setVerificationEmail(res.email);
          setVerificationCode("");
          toast({
            title: "Compte cree",
            description: res.message,
          });
        },
        onError: (error: any) => {
          toast({
            title: "Erreur d'inscription",
            description: getErrorMessage(error, "Une erreur est survenue lors de l'inscription"),
            variant: "destructive",
          });
        },
      }
    );
  };

  const completeLogin = (res: any) => {
    setAuthToken(res.token);
    setAuthTokenGetter(() => res.token);

    toast({
      title: "Email verifie",
      description: "Bienvenue sur Location Auto Maroc",
    });

    if (res.user.role === "ADMIN") {
      setLocation("/admin");
    } else if (res.user.role === "AGENT") {
      setLocation("/agent");
    } else {
      setLocation("/dashboard");
    }
  };

  const onVerify = (event: React.FormEvent) => {
    event.preventDefault();
    if (!verificationEmail || !verificationCode) return;

    verifyEmailMutation.mutate(
      { data: { email: verificationEmail, code: verificationCode } },
      {
        onSuccess: (res) => {
          completeLogin(res);
        },
        onError: (error: any) => {
          toast({
            title: "Verification echouee",
            description: getErrorMessage(error, "Verifiez le code recu par email."),
            variant: "destructive",
          });
        },
      }
    );
  };

  const resendCode = () => {
    if (!verificationEmail) return;

    resendVerificationMutation.mutate(
      { data: { email: verificationEmail } },
      {
        onSuccess: () => {
          toast({
            title: "Code renvoye",
            description: "Un nouveau code de verification a ete envoye.",
          });
        },
        onError: (error: any) => {
          toast({
            title: "Impossible de renvoyer le code",
            description: getErrorMessage(error, "Veuillez reessayer dans quelques instants."),
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center p-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="rounded-xl bg-primary p-2 text-primary-foreground">
              <Car className="h-8 w-8" />
            </div>
            <span className="text-2xl font-serif font-bold text-primary">Location Auto</span>
          </Link>
        </div>

        <Card className="border-border/50 shadow-xl">
          <CardHeader className="space-y-3 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              {verificationEmail ? <MailCheck className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              {verificationEmail ? "Verifiez votre email" : "Creer un compte"}
            </CardTitle>
            <CardDescription>
              {verificationEmail
                ? `Saisissez le code envoye a ${verificationEmail}.`
                : "Inscrivez-vous pour gerer vos reservations facilement."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {verificationEmail ? (
              <form onSubmit={onVerify} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Code a 6 chiffres</label>
                  <Input
                    value={verificationCode}
                    onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="123456"
                    className="h-12 text-center text-xl tracking-[0.35em]"
                  />
                </div>
                <Button type="submit" className="h-11 w-full" disabled={verifyEmailMutation.isPending || verificationCode.length !== 6}>
                  {verifyEmailMutation.isPending ? "Verification..." : "Verifier mon email"}
                </Button>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button type="button" variant="outline" className="w-full" onClick={resendCode} disabled={resendVerificationMutation.isPending}>
                    {resendVerificationMutation.isPending ? "Renvoi..." : "Renvoyer le code"}
                  </Button>
                  <Button type="button" variant="ghost" className="w-full" onClick={() => setVerificationEmail("")}>
                    Modifier l'inscription
                  </Button>
                </div>
              </form>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="vous@exemple.com" type="email" {...field} />
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
                          <Input placeholder="+212 6..." type="tel" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mot de passe</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="mt-2 h-11 w-full" disabled={registerMutation.isPending}>
                    {registerMutation.isPending ? "Creation en cours..." : "Creer mon compte"}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-center text-sm text-muted-foreground">
              Vous avez deja un compte ?{" "}
              <Link href="/connexion" className="font-medium text-primary hover:underline">
                Se connecter
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
