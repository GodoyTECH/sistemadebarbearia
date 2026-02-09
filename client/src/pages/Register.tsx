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

const registerSchema = z.object({
  firstName: z.string().min(2, "Informe seu nome"),
  lastName: z.string().optional(),
  email: z.string().email("Informe um e-mail válido"),
  password: z.string().min(6, "Senha inválida"),
  phone: z.string().min(10, "Telefone inválido"),
  role: z.enum(["manager", "professional"]),
  storeName: z.string().optional(),
  storeNumber: z.string().optional(),
  rememberData: z.boolean().default(false),
});

type RegisterValues = z.infer<typeof registerSchema>;

const STORAGE_KEY = "luxe_register_remember";

export default function Register() {
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      phone: "",
      role: "manager",
      storeName: "",
      storeNumber: "",
      rememberData: false,
    },
  });

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored) as Partial<RegisterValues>;
      form.reset({
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        email: data.email || "",
        phone: data.phone || "",
        role: data.role || "manager",
        storeName: data.storeName || "",
        storeNumber: data.storeNumber || "",
        password: "",
        rememberData: true,
      });
    }
  }, [form]);

  async function onSubmit(values: RegisterValues) {
    setIsSubmitting(true);
    setError(null);

    if (values.role === "manager" && !values.storeName) {
      setError("Informe o nome da loja para gerentes.");
      setIsSubmitting(false);
      return;
    }

    if (values.role === "professional" && !values.storeNumber) {
      setError("Informe o número da loja para profissionais.");
      setIsSubmitting(false);
      return;
    }

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(values),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.detail || "Falha ao cadastrar. Verifique os dados.");
      setIsSubmitting(false);
      return;
    }

    if (values.rememberData) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          phone: values.phone,
          role: values.role,
          storeName: values.storeName,
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
            <CardTitle className="text-2xl font-display premium-outline">Criar Conta</CardTitle>
            <CardDescription>Cadastre-se para acessar o sistema.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="role"
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
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl><Input placeholder="Seu nome" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sobrenome</FormLabel>
                    <FormControl><Input placeholder="Opcional" {...field} /></FormControl>
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
                    <FormControl><Input type="email" placeholder="godoy26@luxe.com" {...field} /></FormControl>
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
                    <FormControl><Input type="password" placeholder="Senha (letras e números)" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WhatsApp</FormLabel>
                    <FormControl><Input placeholder="(00) 00000-0000" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {form.watch("role") === "manager" && (
                <FormField
                  control={form.control}
                  name="storeName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da loja</FormLabel>
                      <FormControl><Input placeholder="Ex: Luxe Bela Vista" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {form.watch("role") === "professional" && (
                <FormField
                  control={form.control}
                  name="storeNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número da loja</FormLabel>
                      <FormControl><Input placeholder="Ex: 12345678" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
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
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Cadastrar"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Já tem conta?{" "}
                <Link href="/login" className="text-primary hover:underline">Entrar</Link>
              </p>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
