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

const base = {
  phone: z.string().refine((v) => v.replace(/\D/g, "").length >= 10, "Informe um telefone válido com DDD."),
  emailPrefix: z.string().min(3).max(50).regex(/^[a-zA-Z0-9.]+$/, "Use apenas letras, números e ponto no e-mail."),
  password: z.string().min(8).regex(/^[A-Za-z0-9]+$/, "A senha deve conter apenas letras e números."),
  confirmPassword: z.string().min(8),
};

const managerSchema = z.object({ managerName: z.string().min(2), shopName: z.string().min(2), ...base }).refine((v) => v.password === v.confirmPassword, { path: ["confirmPassword"], message: "A confirmação deve ser igual à senha." });
const professionalSchema = z.object({ name: z.string().min(2), shopCode: z.string().min(4), ...base }).refine((v) => v.password === v.confirmPassword, { path: ["confirmPassword"], message: "A confirmação deve ser igual à senha." });

type ManagerValues = z.infer<typeof managerSchema>;
type ProfessionalValues = z.infer<typeof professionalSchema>;

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { data, isLoading } = useProfile();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"choose" | "manager" | "professional">("choose");

  const managerForm = useForm<ManagerValues>({ resolver: zodResolver(managerSchema), defaultValues: { managerName: "", shopName: "", emailPrefix: "", phone: "", password: "", confirmPassword: "" } });
  const professionalForm = useForm<ProfessionalValues>({ resolver: zodResolver(professionalSchema), defaultValues: { name: "", shopCode: "", emailPrefix: "", phone: "", password: "", confirmPassword: "" } });

  if (isLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (data?.profile) return <Redirect to={data.profile.role === "manager" ? "/admin" : "/professional"} />;

  async function submit(payload: any) {
    setIsSubmitting(true); setError(null);
    const res = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(payload) });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.message ?? "Não foi possível concluir o cadastro.");
      setIsSubmitting(false); return;
    }
    if (payload.role === "manager") setLocation("/admin"); else setLocation("/login");
  }

  return <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4"><Card className="max-w-xl w-full shadow-2xl shadow-primary/5 border-border/50"><CardHeader className="text-center pb-2"><CardTitle className="font-display text-2xl font-bold text-primary premium-outline">Cadastro Luxe</CardTitle><CardDescription>Escolha como você deseja iniciar na plataforma.</CardDescription></CardHeader><CardContent>
    {mode === "choose" && <div className="space-y-4"><button className="w-full text-left rounded-lg border p-4 hover:border-primary/50 transition" onClick={() => setMode("manager")} type="button"><div className="flex items-center gap-3"><UserRoundCog className="h-5 w-5 text-primary" /><div><p className="font-semibold">Cadastrar como gerente/ADM</p><p className="text-sm text-muted-foreground">Cria loja automaticamente e libera acesso ao painel administrativo.</p></div></div></button><button className="w-full text-left rounded-lg border p-4 hover:border-primary/50 transition" onClick={() => setMode("professional")} type="button"><div className="flex items-center gap-3"><Users className="h-5 w-5 text-primary" /><div><p className="font-semibold">Cadastrar como profissional</p><p className="text-sm text-muted-foreground">Use o ID da loja para solicitar seu vínculo.</p></div></div></button></div>}

    {mode === "manager" && <Form {...managerForm}><form onSubmit={managerForm.handleSubmit((v) => submit({ role: "manager", ...v }))} className="space-y-4"><FormField control={managerForm.control} name="managerName" render={({ field }) => <FormItem><FormLabel>Nome do responsável</FormLabel><FormControl><Input placeholder="Seu nome" {...field} /></FormControl><FormMessage /></FormItem>} /><FormField control={managerForm.control} name="shopName" render={({ field }) => <FormItem><FormLabel>Nome da loja/salão</FormLabel><FormControl><Input placeholder="Luxe Centro" {...field} /></FormControl><FormMessage /></FormItem>} /><FormField control={managerForm.control} name="phone" render={({ field }) => <FormItem><FormLabel>Telefone</FormLabel><FormControl><Input placeholder="(00) 00000-0000" {...field} /></FormControl><FormMessage /></FormItem>} /><FormField control={managerForm.control} name="emailPrefix" render={({ field }) => <FormItem><FormLabel>E-mail</FormLabel><FormControl><div className="flex rounded-md border border-input overflow-hidden"><Input className="border-0 focus-visible:ring-0" placeholder="seu.usuario" {...field} /><div className="px-3 bg-muted text-sm text-muted-foreground flex items-center border-l">@luxe.com</div></div></FormControl><FormMessage /></FormItem>} /><FormField control={managerForm.control} name="password" render={({ field }) => <FormItem><FormLabel>Senha</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>} /><FormField control={managerForm.control} name="confirmPassword" render={({ field }) => <FormItem><FormLabel>Confirmar senha</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>} />{error && <p className="text-sm text-destructive">{error}</p>}<div className="flex gap-3"><Button type="button" variant="outline" onClick={() => setMode("choose")} className="w-full">Voltar</Button><Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <><Store className="w-4 h-4 mr-2" />Criar loja</>}</Button></div></form></Form>}

    {mode === "professional" && <Form {...professionalForm}><form onSubmit={professionalForm.handleSubmit((v) => submit({ role: "professional", ...v, shopCode: v.shopCode.toUpperCase() }))} className="space-y-4"><FormField control={professionalForm.control} name="name" render={({ field }) => <FormItem><FormLabel>Nome</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} /><FormField control={professionalForm.control} name="shopCode" render={({ field }) => <FormItem><FormLabel>ID da loja</FormLabel><FormControl><Input placeholder="LX-ABC123" {...field} /></FormControl><FormMessage /></FormItem>} /><FormField control={professionalForm.control} name="phone" render={({ field }) => <FormItem><FormLabel>Telefone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} /><FormField control={professionalForm.control} name="emailPrefix" render={({ field }) => <FormItem><FormLabel>E-mail</FormLabel><FormControl><div className="flex rounded-md border border-input overflow-hidden"><Input className="border-0 focus-visible:ring-0" {...field} /><div className="px-3 bg-muted text-sm text-muted-foreground flex items-center border-l">@luxe.com</div></div></FormControl><FormMessage /></FormItem>} /><FormField control={professionalForm.control} name="password" render={({ field }) => <FormItem><FormLabel>Senha</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>} /><FormField control={professionalForm.control} name="confirmPassword" render={({ field }) => <FormItem><FormLabel>Confirmar senha</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>} />{error && <p className="text-sm text-destructive">{error}</p>}<div className="flex gap-3"><Button type="button" variant="outline" onClick={() => setMode("choose")} className="w-full">Voltar</Button><Button type="submit" className="w-full" disabled={isSubmitting || !professionalForm.formState.isValid}>{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Solicitar vínculo"}</Button></div></form></Form>}
  </CardContent></Card></div>;
}
