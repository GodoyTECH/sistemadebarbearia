import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useProfile } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Redirect, useLocation } from "wouter";
import { Loader2, Store, UserRoundCog, Users } from "lucide-react";
import { useState } from "react";

const managerSchema = z
  .object({
    managerName: z.string().min(2, "Informe o nome do responsável."),
    shopName: z.string().min(2, "Informe o nome da loja/salão."),
    phone: z
      .string()
      .refine((value) => value.replace(/\D/g, "").length >= 10, "Informe um telefone válido com DDD."),
    emailPrefix: z
      .string()
      .min(3, "Digite pelo menos 3 caracteres no e-mail.")
      .max(50, "Prefixo muito longo.")
      .regex(/^[a-zA-Z0-9.]+$/, "Use apenas letras, números e ponto no e-mail."),
    password: z
      .string()
      .min(8, "A senha precisa ter no mínimo 8 caracteres.")
      .regex(/^[A-Za-z0-9]+$/, "A senha deve conter apenas letras e números, sem espaços ou símbolos."),
    confirmPassword: z.string().min(8, "Confirme sua senha."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "A confirmação deve ser igual à senha.",
  });

type ManagerValues = z.infer<typeof managerSchema>;

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { data, isLoading } = useProfile();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"choose" | "manager" | "professional">("choose");

  const form = useForm<ManagerValues>({
    resolver: zodResolver(managerSchema),
    defaultValues: {
      managerName: "",
      shopName: "",
      emailPrefix: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  if (isLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (data?.profile) return <Redirect to={data.profile.role === "manager" ? "/admin" : "/professional"} />;

  async function onSubmit(values: ManagerValues) {
    setIsSubmitting(true);
    setError(null);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        role: "manager",
        ...values,
      }),
    });

    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      setError(payload?.message ?? "Não foi possível concluir o cadastro. Revise os dados e tente novamente.");
      setIsSubmitting(false);
      return;
    }

    setLocation("/admin");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4">
      <Card className="max-w-xl w-full shadow-2xl shadow-primary/5 border-border/50">
        <CardHeader className="text-center pb-2">
          <CardTitle className="font-display text-2xl font-bold text-primary premium-outline">Cadastro Luxic</CardTitle>
          <CardDescription>Escolha como você deseja iniciar na plataforma.</CardDescription>
        </CardHeader>

        <CardContent>
          {mode === "choose" && (
            <div className="space-y-4">
              <button
                className="w-full text-left rounded-lg border p-4 hover:border-primary/50 transition"
                onClick={() => setMode("manager")}
                type="button"
              >
                <div className="flex items-center gap-3">
                  <UserRoundCog className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-semibold">Cadastrar como gerente/ADM</p>
                    <p className="text-sm text-muted-foreground">Cria loja automaticamente e libera acesso ao painel administrativo.</p>
                  </div>
                </div>
              </button>

              <button
                className="w-full text-left rounded-lg border p-4 hover:border-primary/50 transition"
                onClick={() => setMode("professional")}
                type="button"
              >
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-semibold">Cadastrar como profissional</p>
                    <p className="text-sm text-muted-foreground">Fluxo preparado para roteamento; ativação completa será entregue em próximo PR.</p>
                  </div>
                </div>
              </button>
            </div>
          )}

          {mode === "professional" && (
            <div className="space-y-4 text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <p className="font-semibold">Cadastro profissional em preparação</p>
              <p className="text-sm text-muted-foreground">Estamos finalizando o fluxo completo de cadastro e aprovação de profissionais.</p>
              <Button variant="outline" onClick={() => setMode("choose")}>Voltar</Button>
            </div>
          )}

          {mode === "manager" && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="managerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do responsável</FormLabel>
                        <FormControl><Input placeholder="Seu nome" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="shopName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome da loja/salão</FormLabel>
                        <FormControl><Input placeholder="Luxic Centro" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl><Input placeholder="(00) 00000-0000" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="emailPrefix"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail</FormLabel>
                      <FormControl>
                        <div className="flex rounded-md border border-input overflow-hidden">
                          <Input className="border-0 focus-visible:ring-0" placeholder="seu.usuario" {...field} />
                          <div className="px-3 bg-muted text-sm text-muted-foreground flex items-center border-l">@luxic.com</div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha</FormLabel>
                        <FormControl><Input type="password" placeholder="Mínimo 8 caracteres" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirmar senha</FormLabel>
                        <FormControl><Input type="password" placeholder="Repita a senha" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setMode("choose")} className="w-full">Voltar</Button>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <><Store className="w-4 h-4 mr-2" />Criar loja e acessar dashboard</>}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
