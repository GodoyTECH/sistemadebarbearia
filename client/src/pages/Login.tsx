import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Scissors } from "lucide-react";
import { useLocation, Link } from "wouter";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const loginSchema = z.object({
  accountType: z.enum(["manager", "professional"]),
  email: z.string().email("Informe um e-mail válido"),
  password: z.string().min(6, "Senha inválida"),
  storeNumber: z.string().optional(),
  rememberMe: z.boolean().default(false),
  rememberData: z.boolean().default(false),
});

type LoginValues = z.infer<typeof loginSchema>;

const STORAGE_KEY = "luxe_login_remember";

export default function Login() {
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      accountType: "manager",
      email: "",
      password: "",
      storeNumber: "",
      rememberMe: false,
      rememberData: false,
    },
  });

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored) as Partial<LoginValues>;
      form.reset({
        accountType: data.accountType || "manager",
        email: data.email || "",
        storeNumber: data.storeNumber || "",
        password: "",
        rememberMe: false,
        rememberData: true,
      });
    }
  }, [form]);

  async function onSubmit(values: LoginValues) {
    setIsSubmitting(true);
    setError(null);

    if (values.accountType === "professional" && !values.storeNumber) {
      setError("Informe o número da loja para profissionais.");
      setIsSubmitting(false);
      return;
    }

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        email: values.email,
        password: values.password,
        storeNumber: values.accountType === "professional" ? values.storeNumber : undefined,
        rememberMe: values.rememberMe,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.detail || "Credenciais inválidas. Verifique e tente novamente.");
      setIsSubmitting(false);
      return;
    }

    if (values.rememberData) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          accountType: values.accountType,
          email: values.email,
          storeNumber: values.storeNumber,
        }),
      );
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }

    setLocation("/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md border-border/60 shadow-2xl shadow-black/20">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30 logo-pulse">
            <Scissors className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-2xl font-display premium-outline">Acesso Profissional</CardTitle>
            <CardDescription>Entre com suas credenciais para continuar.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="accountType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de conta</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="manager">Gerente</SelectItem>
                        <SelectItem value="professional">Profissional</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="godoy26@luxe.com" {...field} />
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
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Senha (letras e números)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {form.watch("accountType") === "professional" && (
                <FormField
                  control={form.control}
                  name="storeNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número da loja</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 12345678" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="rememberMe"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel className="text-sm">Manter conectado</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rememberData"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel className="text-sm">Lembrar meus dados neste dispositivo</FormLabel>
                    </FormItem>
                  )}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Entrar"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Ainda não tem conta?{" "}
                <Link href="/register" className="text-primary hover:underline">Criar cadastro</Link>
              </p>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
