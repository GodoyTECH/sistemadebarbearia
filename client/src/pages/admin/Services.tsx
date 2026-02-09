import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useServices, useCreateService, useDeleteService } from "@/hooks/use-services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertServiceSchema } from "@shared/routes";
import { z } from "zod";
import { Plus, Trash2, Edit2, Loader2 } from "lucide-react";
import { Currency } from "@/components/Currency";
import { useToast } from "@/hooks/use-toast";

type FormValues = z.infer<typeof insertServiceSchema>;

export default function ServicesPage() {
  const { data: services, isLoading } = useServices();
  const [open, setOpen] = useState(false);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <AppShell>
      <header className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-primary premium-outline">Serviços & Promoções</h1>
          <p className="text-muted-foreground mt-2">Gerencie os tipos de corte e valores.</p>
        </div>
        <ServiceDialog open={open} onOpenChange={setOpen} />
      </header>

      <div className="hidden md:block rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Comissão (%)</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services?.map((service) => (
              <ServiceRow key={service.id} service={service} />
            ))}
            {services?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Nenhum serviço cadastrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="md:hidden space-y-4">
        {services?.map((service) => (
          <ServiceCard key={service.id} service={service} />
        ))}
        {services?.length === 0 && (
          <div className="rounded-xl border border-border bg-card p-6 text-center text-muted-foreground">
            Nenhum serviço cadastrado.
          </div>
        )}
      </div>
    </AppShell>
  );
}

function ServiceRow({ service }: { service: any }) {
  const { mutate: deleteService } = useDeleteService();
  const { toast } = useToast();

  const handleDelete = () => {
    if (confirm("Tem certeza que deseja excluir este serviço?")) {
      deleteService(service.id, {
        onSuccess: () => toast({ title: "Serviço excluído com sucesso" })
      });
    }
  };

  return (
    <TableRow>
      <TableCell className="font-medium">{service.name}</TableCell>
      <TableCell className="capitalize">
        {service.type === 'promo' ? 'Promoção' : service.type === 'male' ? 'Masculino' : service.type === 'female' ? 'Feminino' : 'Geral'}
      </TableCell>
      <TableCell><Currency value={service.price} /></TableCell>
      <TableCell>{service.commissionRate}%</TableCell>
      <TableCell className="text-right space-x-2">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={handleDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

function ServiceCard({ service }: { service: any }) {
  const { mutate: deleteService } = useDeleteService();
  const { toast } = useToast();

  const handleDelete = () => {
    if (confirm("Tem certeza que deseja excluir este serviço?")) {
      deleteService(service.id, {
        onSuccess: () => toast({ title: "Serviço excluído com sucesso" })
      });
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-3">
      <div>
        <p className="text-sm text-muted-foreground">Serviço</p>
        <p className="font-semibold">{service.name}</p>
      </div>
      <div className="text-sm text-muted-foreground space-y-1">
        <p>Tipo: <span className="text-foreground capitalize">{service.type === 'promo' ? 'Promoção' : service.type === 'male' ? 'Masculino' : service.type === 'female' ? 'Feminino' : 'Geral'}</span></p>
        <p>Preço: <span className="text-foreground"><Currency value={service.price} /></span></p>
        <p>Comissão: <span className="text-foreground">{service.commissionRate}%</span></p>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={handleDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function ServiceDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (v: boolean) => void }) {
  const { mutate, isPending } = useCreateService();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(insertServiceSchema),
    defaultValues: {
      name: "",
      price: 0,
      commissionRate: 50,
      type: "male",
      active: true,
      description: ""
    }
  });

  function onSubmit(values: FormValues) {
    mutate(values, {
      onSuccess: () => {
        toast({ title: "Serviço criado com sucesso" });
        onOpenChange(false);
        form.reset();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2 shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4" /> Novo Serviço
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Novo Serviço</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Serviço</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço (Centavos)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="commissionRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comissão (%)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="male">Masculino</SelectItem>
                      <SelectItem value="female">Feminino</SelectItem>
                      <SelectItem value="general">Geral</SelectItem>
                      <SelectItem value="promo">Promoção</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Salvando..." : "Salvar Serviço"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
