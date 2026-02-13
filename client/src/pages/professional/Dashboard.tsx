import { useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { useServices } from "@/hooks/use-services";
import { useCreateAppointment } from "@/hooks/use-appointments";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertAppointmentSchema } from "@shared/routes";
import { Loader2, CheckCircle } from "lucide-react";
import { Currency } from "@/components/Currency";

const formSchema = insertAppointmentSchema.extend({
  serviceId: z.coerce.number().min(1, "Selecione um serviço"),
});

type FormValues = z.infer<typeof formSchema>;

export default function ProfessionalDashboard() {
  const { data: services } = useServices();
  const { user } = useAuth();
  const { mutate, isPending } = useCreateAppointment();
  const { toast } = useToast();
  
  // Custom upload state
  const [uploadedProof, setUploadedProof] = useState<string | null>(null);
  const [availability, setAvailability] = useState(true);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerName: "",
      transactionId: "",
      paymentMethod: "cash",
      price: 0,
      serviceId: 0,
    },
  });

  const paymentMethod = form.watch("paymentMethod");
  const selectedServiceId = form.watch("serviceId");

  useEffect(() => {
    fetch("/api/me", { credentials: "include" }).then((r) => r.ok ? r.json() : null).then((d) => { if (d?.profile) setAvailability(Boolean(d.profile.availability)); });


    if (paymentMethod === "cash") {
      form.setValue("transactionId", "");
      setUploadedProof(null);

    }
  }, [paymentMethod, form]);
  
  // Update price when service changes

  const uploadReceipt = async (file?: File) => {
    if (!file) return;
    const dataBase64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Falha ao ler arquivo"));
      reader.readAsDataURL(file);
    });
    const res = await fetch("/api/uploads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ type: "receipt", dataBase64 }),
    });
    const payload = await res.json();
    if (!res.ok) throw new Error(payload?.message || "Falha no upload");
    setUploadedProof(payload.secure_url);
    toast({ title: "Comprovante enviado com sucesso!" });
  };

  const handleServiceChange = (val: string) => {
    const serviceId = parseInt(val);
    form.setValue("serviceId", serviceId);
    const service = services?.find(s => s.id === serviceId);
    if (service) {
      form.setValue("price", service.price);
    }
  };


  function onSubmit(values: FormValues) {
    if (paymentMethod !== 'cash' && (!uploadedProof || !form.watch("transactionId"))) {
      toast({ title: "Erro", description: "É necessário anexar o comprovante para pagamentos digitais.", variant: "destructive" });
      return;
    }

    const transactionId = values.transactionId?.trim() || undefined;
    mutate({
      ...values,
      transactionId,
      proofUrl: uploadedProof,
    }, {
      onSuccess: () => {
        toast({ title: "Corte registrado com sucesso!" });
        form.reset();
        setUploadedProof(null);

      }
    });
  }

  return (
    <AppShell>
      <header className="mb-8">
        <h1 className="text-3xl font-display font-bold text-primary premium-outline">Registrar Corte</h1>
        <p className="text-muted-foreground mt-2">Olá, {user?.firstName}. Vamos registrar um novo atendimento?</p>
        <Button variant={availability ? "default" : "outline"} className="mt-4" onClick={async () => { const next = !availability; setAvailability(next); await fetch("/api/professional/availability", { method: "PATCH", headers: {"Content-Type":"application/json"}, credentials:"include", body: JSON.stringify({ availability: next }) }); }}>
          {availability ? "Disponível" : "Indisponível"}
        </Button>
      </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-lg shadow-primary/5 border-border premium-outline">
              <CardHeader>
                <CardTitle>Detalhes do Atendimento</CardTitle>
                <CardDescription>Preencha os dados do serviço realizado.</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="customerName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome do Cliente</FormLabel>
                            <FormControl><Input placeholder="Ex: João Silva" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="serviceId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Serviço</FormLabel>
                            <Select onValueChange={handleServiceChange} defaultValue={field.value?.toString()}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {services?.map(s => (
                                  <SelectItem key={s.id} value={s.id.toString()}>
                                    {s.name} - <Currency value={s.price} />
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <FormField
                        control={form.control}
                        name="paymentMethod"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Forma de Pagamento</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="cash">Dinheiro</SelectItem>
                                <SelectItem value="pix">Pix</SelectItem>
                                <SelectItem value="card">Cartão</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormItem>
                        <FormLabel>Valor (R$)</FormLabel>
                        <div className="h-10 px-3 py-2 rounded-md border bg-muted/50 text-muted-foreground flex items-center">
                          {selectedServiceId ? (
                            <Currency value={form.watch('price')} />
                          ) : (
                            <span className="text-sm">Selecione um serviço</span>
                          )}
                        </div>
                      </FormItem>
                    </div>

                    {paymentMethod !== 'cash' && (
                      <div className="p-4 bg-muted/30 rounded-lg border border-border space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium">Comprovante de Pagamento</label>
                          {uploadedProof && <span className="text-xs text-emerald-600 font-medium flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Anexado</span>}
                        </div>

                        <FormField
                          control={form.control}
                          name="transactionId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>ID da Transação (E2E/NSU/TID)</FormLabel>
                              <FormControl>
                                <Input placeholder="Informe o identificador" {...field} value={field.value ?? ""} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Input type="file" accept="image/*" onChange={(e) => uploadReceipt(e.target.files?.[0])} />
                        <p className="text-xs text-muted-foreground">
                          Necessário para pagamentos via Pix ou Cartão para conferência do caixa.
                        </p>
                      </div>
                    )}

                    <Button size="lg" className="w-full shadow-lg shadow-primary/20" type="submit" disabled={isPending}>
                      {isPending ? <Loader2 className="animate-spin mr-2" /> : "Confirmar Corte"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Quick Stats or Tips for the Pro */}
            <Card className="bg-gradient-to-br from-primary to-primary/90 text-primary-foreground border-none shadow-xl">
              <CardHeader>
                <CardTitle className="text-lg">Dica do Dia</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-primary-foreground/80 leading-relaxed">
                  Lembre-se de sempre confirmar o nome do cliente e conferir o valor antes de finalizar. Mantenha seus registros em dia para garantir sua comissão correta!
                </p>
              </CardContent>
            </Card>
            
            <div className="rounded-xl border border-border bg-card p-4 premium-outline">
              <h3 className="font-semibold mb-4">Resumo do Serviço</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Serviço Base</span>
                  <span className="font-medium">
                    {selectedServiceId ? <Currency value={form.watch('price')} /> : '-'}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Sua Comissão</span>
                  <span className="font-medium text-emerald-600">
                    {selectedServiceId ? (
                      <Currency value={Math.round(form.watch('price') * ((services?.find(s => s.id === selectedServiceId)?.commissionRate || 0) / 100))} />
                    ) : '-'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
    </AppShell>
  );
}
