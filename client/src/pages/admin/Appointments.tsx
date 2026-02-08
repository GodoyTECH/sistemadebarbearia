import { Sidebar } from "@/components/Sidebar";
import { useAppointments, useUpdateAppointmentStatus } from "@/hooks/use-appointments";
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
  
  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-display font-bold text-primary">Gestão de Cortes</h1>
          <p className="text-muted-foreground mt-2">Aprove ou rejeite comprovantes de pagamento.</p>
        </header>

        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
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
                <AppointmentRow key={apt.id} appointment={apt} />
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
      </main>
    </div>
  );
}

function AppointmentRow({ appointment }: { appointment: any }) {
  const { mutate: updateStatus, isPending } = useUpdateAppointmentStatus();
  const { toast } = useToast();

  const handleAction = (status: "confirmed" | "rejected") => {
    updateStatus({ id: appointment.id, status }, {
      onSuccess: () => toast({ title: `Agendamento ${status === 'confirmed' ? 'aprovado' : 'rejeitado'}` })
    });
  };

  return (
    <TableRow>
      <TableCell className="text-muted-foreground text-sm">
        {format(new Date(appointment.date), "dd/MM HH:mm", { locale: ptBR })}
      </TableCell>
      <TableCell className="font-medium">{appointment.customerName}</TableCell>
      <TableCell>{appointment.service?.name || "Serviço removido"}</TableCell>
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
