import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useProfile } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Redirect, useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { useState } from "react";

const managerSchema = z
  .object({
    name: z.string().min(2, "Informe o nome do responsável"),
    storeName: z.string().min(2, "Informe o nome da loja/salão"),
    phone: z
      .string()
      .min(10, "Informe um telefone válido")
      .refine((value) => value.replace(/\D/g, "").length >= 10, "Informe um telefone válido"),
    emailPrefix: z
      .string()
      .min(3, "Informe o usuário do e-mail")
      .max(40, "Usuário do e-mail muito longo")
      .regex(/^[a-zA-Z0-9]+$/, "Use apenas letras e números no e-mail"),
    password: z
      .string()
      .min(8, "A senha deve ter no mínimo 8 caracteres")
      .regex(/^[A-Za-z0-9]+$/, "A senha deve conter apenas letras e números, sem espaços"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "A confirmação de senha deve ser igual à senha",
    path: ["confirmPassword"],
  });

type ManagerValues = z.infer<typeof managerSchema>;
type RegisterType = "manager" | "professional" | null;

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { data, isLoading } = useProfile();
  const [registerType, setRegisterType] = useState<RegisterType>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ManagerValues>({
    resolver: zodResolver(managerSchema),
    defaultValues: {
      name: "",
      storeName: "",
      phone: "",
      emailPrefix: "",
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
        name: values.name,
        storeName: values.storeName,
        phone: values.phone,
        email: `${values.emailPrefix.toLowerCase()}@luxic.com`,
        password: values.password,
      }),
    });

    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      setError(payload?.message || "Não foi possível concluir o cadastro. Verifique os dados.");
      setIsSubmitting(false);
      return;
    }

    setLocation("/admin");
  }

  if (!registerType) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4">
        <Card className="max-w-xl w-full shadow-2xl shadow-primary/5 border-border/50">
          <CardHeader className="text-center">
            <CardTitle className="font-display text-2xl font-bold text-primary premium-outline">Criar conta</CardTitle>
            <CardDescription>Escolha como deseja iniciar no sistema.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Button className="h-auto py-4 flex-col items-start" onClick={() => setRegisterType("manager")}>
              <span className="font-semibold">Cadastrar como gerente/ADM</span>
              <span className="text-xs text-primary-foreground/90">Cria loja automaticamente com ID único.</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col items-start" onClick={() => setRegisterType("professional")}>
              <span className="font-semibold">Cadastrar como profissional</span>
              <span className="text-xs text-muted-foreground">Fluxo será habilitado em breve.</span>
            </Button>
            <Button variant="ghost" onClick={() => setLocation("/login")}>Voltar para login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (registerType === "professional") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4">
        <Card className="max-w-md w-full shadow-2xl shadow-primary/5 border-border/50">
          <CardHeader className="text-center">
            <CardTitle>Cadastro profissional</CardTitle>
            <CardDescription>Estamos preparando este fluxo. Em breve você poderá concluir seu cadastro aqui.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full" onClick={() => setRegisterType("manager")}>Cadastrar como gerente/ADM</Button>
            <Button variant="outline" className="w-full" onClick={() => setRegisterType(null)}>Voltar</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4">
      <Card className="max-w-md w-full shadow-2xl shadow-primary/5 border-border/50">
        <CardHeader className="text-center pb-2">
          <CardTitle className="font-display text-2xl font-bold text-primary premium-outline">Cadastro de gerente/ADM</CardTitle>
          <CardDescription>Preencha os dados da loja para começar.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do responsável</FormLabel>
                  <FormControl><Input placeholder="Nome completo" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="storeName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da loja/salão</FormLabel>
                  <FormControl><Input placeholder="Nome da sua loja" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl><Input placeholder="(00) 00000-0000" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="emailPrefix" render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <div className="flex">
                      <Input placeholder="seuusuario" className="rounded-r-none" {...field} />
                      <div className="px-3 border border-l-0 rounded-r-md text-sm flex items-center bg-muted text-muted-foreground">@luxic.com</div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha</FormLabel>
                  <FormControl><Input type="password" placeholder="Apenas letras e números" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar senha</FormLabel>
                  <FormControl><Input type="password" placeholder="Repita a senha" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Finalizar cadastro"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
