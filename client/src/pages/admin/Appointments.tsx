import { AppShell } from "@/components/AppShell";
import { useAppointments, useUpdateAppointmentStatus } from "@/hooks/use-appointments";
import { useServices } from "@/hooks/use-services";
import { StatusBadge } from "@/components/StatusBadge";
import { Currency } from "@/components/Currency";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2, Image as ImageIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

export default function AdminAppointments() {
  const { data: appointments, isLoading } = useAppointments();
  const { data: services } = useServices();
  
  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <AppShell>
      <header className="mb-8">
        <h1 className="text-3xl font-display font-bold text-primary premium-outline">Gestão de Cortes</h1>
        <p className="text-muted-foreground mt-2">Aprove ou rejeite comprovantes de pagamento.</p>
      </header>

      <div className="hidden md:block rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Serviço</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Comprovante</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments?.map((apt) => (
                <AppointmentRow key={apt.id} appointment={apt} serviceName={services?.find(s => s.id === apt.serviceId)?.name} />
              ))}
              {appointments?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Nenhum corte registrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
        </Table>
      </div>

      <div className="md:hidden space-y-4">
        {appointments?.map((apt) => (
          <AppointmentCard
            key={apt.id}
            appointment={apt}
            serviceName={services?.find(s => s.id === apt.serviceId)?.name}
          />
        ))}
        {appointments?.length === 0 && (
          <div className="rounded-xl border border-border bg-card p-6 text-center text-muted-foreground">
            Nenhum corte registrado.
          </div>
        )}
      </div>
    </AppShell>
  );
}

function AppointmentRow({ appointment, serviceName }: { appointment: any; serviceName?: string }) {
  const { mutate: updateStatus, isPending } = useUpdateAppointmentStatus();
  const { toast } = useToast();

  const handleAction = (status: "confirmed" | "rejected", id?: number) => {
    updateStatus({ id: id ?? appointment.id, status }, {
      onSuccess: () => toast({ title: `Agendamento ${status === 'confirmed' ? 'aprovado' : 'rejeitado'}` })
    });
  };

  return (
    <TableRow>
      <TableCell className="text-muted-foreground text-sm">
        {format(new Date(appointment.date), "dd/MM HH:mm", { locale: ptBR })}
      </TableCell>
      <TableCell className="font-medium">{appointment.customerName}</TableCell>
      <TableCell>
        {serviceName || "Serviço removido"}
        {appointment.possibleDuplicate && (
          <span className="ml-2 text-xs text-amber-400 font-semibold">Possível duplicidade</span>
        )}
      </TableCell>
      <TableCell><Currency value={appointment.price} /></TableCell>
      <TableCell className="capitalize">{appointment.paymentMethod}</TableCell>
      <TableCell>
        {appointment.proofUrl ? (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-2 text-primary/80">
                <ImageIcon className="w-4 h-4" /> Ver
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl p-0 overflow-hidden bg-transparent border-none shadow-none">
              <img src={appointment.proofUrl} alt="Comprovante" className="w-full h-auto rounded-lg shadow-2xl" />
            </DialogContent>
          </Dialog>
        ) : (
          <span className="text-xs text-muted-foreground italic">Sem comprovante</span>
        )}
      </TableCell>
      <TableCell><StatusBadge status={appointment.status} /></TableCell>
      <TableCell className="text-right">
        {appointment.status === 'pending' && (
          <div className="flex justify-end gap-1">
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
              onClick={() => handleAction('confirmed')}
              disabled={isPending}
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
              onClick={() => handleAction('rejected')}
              disabled={isPending}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}

function AppointmentCard({ appointment, serviceName }: { appointment: any; serviceName?: string }) {
  const { mutate: updateStatus, isPending } = useUpdateAppointmentStatus();
  const { toast } = useToast();

  const handleAction = (status: "confirmed" | "rejected") => {
    updateStatus({ id: appointment.id, status }, {
      onSuccess: () => toast({ title: `Agendamento ${status === 'confirmed' ? 'aprovado' : 'rejeitado'}` })
    });
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Cliente</p>
          <p className="font-semibold">{appointment.customerName}</p>
        </div>
        <StatusBadge status={appointment.status} />
      </div>
      <div className="text-sm text-muted-foreground space-y-1">
        <p>
          Serviço: <span className="text-foreground">{serviceName || "Serviço removido"}</span>
          {appointment.possibleDuplicate && (
            <span className="ml-2 text-xs text-amber-400 font-semibold">Possível duplicidade</span>
          )}
        </p>
        <p>Data: <span className="text-foreground">{format(new Date(appointment.date), "dd/MM HH:mm", { locale: ptBR })}</span></p>
        <p>Pagamento: <span className="text-foreground capitalize">{appointment.paymentMethod}</span></p>
        <p>Valor: <span className="text-foreground"><Currency value={appointment.price} /></span></p>
      </div>
      <div className="flex items-center justify-between">
        {appointment.proofUrl ? (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-2 text-primary/80">
                <ImageIcon className="w-4 h-4" /> Ver comprovante
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl p-0 overflow-hidden bg-transparent border-none shadow-none">
              <img src={appointment.proofUrl} alt="Comprovante" className="w-full h-auto rounded-lg shadow-2xl" />
            </DialogContent>
          </Dialog>
        ) : (
          <span className="text-xs text-muted-foreground italic">Sem comprovante</span>
        )}
        {appointment.status === "pending" && (
          <div className="flex gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
              onClick={() => handleAction('confirmed')}
              disabled={isPending}
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
              onClick={() => handleAction('rejected')}
              disabled={isPending}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
