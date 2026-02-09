import { AppShell } from "@/components/AppShell";
import { useAppointments } from "@/hooks/use-appointments";
import { useServices } from "@/hooks/use-services";
import { StatusBadge } from "@/components/StatusBadge";
import { Currency } from "@/components/Currency";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2 } from "lucide-react";

export default function ProfessionalHistory() {
  // Filter by current professional ID logic needs to be handled by backend usually based on auth user
  // but we can pass explicit ID if needed. Here `useAppointments` without filters fetches all, 
  // backend should filter for non-managers? 
  // Let's assume the List endpoint returns ALL for manager, and OWN for pro. 
  // The route implementation typically handles this policy.
  const { data: appointments, isLoading } = useAppointments();
  const { data: services } = useServices();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <AppShell>
      <header className="mb-8">
        <h1 className="text-3xl font-display font-bold text-primary premium-outline">Meus Cortes</h1>
        <p className="text-muted-foreground mt-2">Histórico de atendimentos realizados.</p>
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
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments?.map((apt) => (
                <TableRow key={apt.id}>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(apt.date), "dd/MM 'às' HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell className="font-medium">{apt.customerName}</TableCell>
                  <TableCell>{services?.find(s => s.id === apt.serviceId)?.name}</TableCell>
                  <TableCell><Currency value={apt.price} /></TableCell>
                  <TableCell className="capitalize">{apt.paymentMethod}</TableCell>
                  <TableCell><StatusBadge status={apt.status} /></TableCell>
                </TableRow>
              ))}
              {appointments?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Você ainda não registrou nenhum corte.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
        </Table>
      </div>

      <div className="md:hidden space-y-4">
        {appointments?.map((apt) => (
          <div key={apt.id} className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cliente</p>
                <p className="font-semibold">{apt.customerName}</p>
              </div>
              <StatusBadge status={apt.status} />
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Serviço: <span className="text-foreground">{services?.find(s => s.id === apt.serviceId)?.name}</span></p>
              <p>Data: <span className="text-foreground">{format(new Date(apt.date), "dd/MM 'às' HH:mm", { locale: ptBR })}</span></p>
              <p>Pagamento: <span className="text-foreground capitalize">{apt.paymentMethod}</span></p>
              <p>Valor: <span className="text-foreground"><Currency value={apt.price} /></span></p>
            </div>
          </div>
        ))}
        {appointments?.length === 0 && (
          <div className="rounded-xl border border-border bg-card p-6 text-center text-muted-foreground">
            Você ainda não registrou nenhum corte.
          </div>
        )}
      </div>
    </AppShell>
  );
}
