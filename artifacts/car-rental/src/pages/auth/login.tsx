import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { customFetch, useLogin, setAuthTokenGetter } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { createPendingReservation } from "@/lib/pending-reservation";
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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Car } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email({ message: "Email invalide" }),
  password: z.string().min(6, { message: "Mot de passe requis (min. 6 caractères)" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const [_, setLocation] = useLocation();
  const { login: setAuthToken } = useAuth();
  const { toast } = useToast();
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaEmail, setMfaEmail] = useState("");
  const [isVerifyingMfa, setIsVerifyingMfa] = useState(false);
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useLogin();

  const completeLogin = async (res: any) => {
    setAuthToken(res.token);
    setAuthTokenGetter(() => res.token);

    toast({
      title: "Connexion réussie",
      description: "Bienvenue sur Location Auto Maroc",
    });

    if (res.user.role === "CUSTOMER") {
      try {
        const pendingRequest = await createPendingReservation();
        if (pendingRequest?.id) {
          setLocation(`/dashboard/demandes/${pendingRequest.id}`);
          return;
        }
      } catch (error: any) {
        toast({
          title: "Connexion réussie",
          description: error?.message || "Connecté, mais la réservation doit être relancée.",
          variant: "destructive",
        });
      }
    }

    if (res.user.role === "ADMIN") {
      setLocation("/admin");
    } else if (res.user.role === "AGENT") {
      setLocation("/agent");
    } else {
      setLocation("/dashboard");
    }
  };

  const onSubmit = (data: LoginFormValues) => {
    loginMutation.mutate({ data }, {
      onSuccess: (res) => {
        const response = res as any;
        if (response.mfaRequired) {
          setMfaToken(response.mfaToken);
          setMfaEmail(response.user?.email ?? data.email);
          toast({
            title: "Code de sécurité envoyé",
            description: "Entrez le code reçu par e-mail pour terminer la connexion.",
          });
          return;
        }
        void completeLogin(response);
        return;
        setAuthToken(res.token);
        setAuthTokenGetter(() => res.token);
        
        toast({
          title: "Connexion réussie",
          description: "Bienvenue sur Location Auto Maroc",
        });

        // Redirect based on role
        if (res.user.role === "ADMIN") {
          setLocation("/admin");
        } else if (res.user.role === "AGENT") {
          setLocation("/agent");
        } else {
          setLocation("/dashboard");
        }
      },
      onError: (error: any) => {
        toast({
          title: "Erreur de connexion",
          description: error?.data?.error || error?.message || "Email ou mot de passe incorrect",
          variant: "destructive",
        });
      }
    });
  };

  const verifyMfa = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!mfaToken || !mfaCode) return;
    setIsVerifyingMfa(true);
    try {
      const res = await customFetch<any>("/api/auth/verify-mfa", {
        method: "POST",
        body: JSON.stringify({ mfaToken, code: mfaCode }),
      });
      void completeLogin(res);
    } catch (error: any) {
      toast({
        title: "Code invalide",
        description: error?.message || "Vérifiez le code reçu par e-mail.",
        variant: "destructive",
      });
    } finally {
      setIsVerifyingMfa(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground p-2 rounded-xl">
              <Car className="w-8 h-8" />
            </div>
            <span className="text-2xl font-serif font-bold text-primary">Location Auto</span>
          </Link>
        </div>

        <Card className="border-border/50 shadow-xl">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold tracking-tight">
              {mfaToken ? "Vérification MFA" : "Bon retour"}
            </CardTitle>
            <CardDescription>
              Entrez vos identifiants pour accéder à votre compte
            </CardDescription>
          </CardHeader>
          <CardContent>
            {mfaToken ? (
              <form onSubmit={verifyMfa} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Code à 6 chiffres</label>
                  <Input
                    value={mfaCode}
                    onChange={(event) => setMfaCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="123456"
                    className="h-12 text-center text-xl tracking-[0.35em]"
                  />
                </div>
                <Button type="submit" className="w-full h-11" disabled={isVerifyingMfa || mfaCode.length !== 6}>
                  {isVerifyingMfa ? "Vérification..." : "Valider le code"}
                </Button>
                <Button type="button" variant="ghost" className="w-full" onClick={() => setMfaToken(null)}>
                  Revenir à la connexion
                </Button>
              </form>
            ) : (
              <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>Mot de passe</FormLabel>
                      </div>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full h-11" 
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Connexion..." : "Se connecter"}
                </Button>
              </form>
              </Form>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-center text-muted-foreground">
              Vous n'avez pas de compte ?{" "}
              <Link href="/inscription" className="text-primary hover:underline font-medium">
                S'inscrire
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
