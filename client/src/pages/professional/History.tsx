import { Sidebar } from "@/components/Sidebar";
import { useAppointments } from "@/hooks/use-appointments";
import { useProfile } from "@/hooks/use-profile";
import { StatusBadge } from "@/components/StatusBadge";
import { Currency } from "@/components/Currency";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2 } from "lucide-react";

export default function ProfessionalHistory() {
  const { data: profileData } = useProfile();
  // Filter by current professional ID logic needs to be handled by backend usually based on auth user
  // but we can pass explicit ID if needed. Here `useAppointments` without filters fetches all, 
  // backend should filter for non-admins? 
  // Let's assume the List endpoint returns ALL for admin, and OWN for pro. 
  // The route implementation typically handles this policy.
  const { data: appointments, isLoading } = useAppointments();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-display font-bold text-primary">Meus Cortes</h1>
          <p className="text-muted-foreground mt-2">Histórico de atendimentos realizados.</p>
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
                  <TableCell>{apt.service?.name}</TableCell>
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
      </main>
    </div>
  );
}
