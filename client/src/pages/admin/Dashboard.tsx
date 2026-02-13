import { useStats } from "@/hooks/use-stats";
import { useProfile } from "@/hooks/use-profile";
import { AppShell } from "@/components/AppShell";
import { Currency } from "@/components/Currency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { DollarSign, Scissors, Clock, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
  const { data: stats, isLoading } = useStats();
  const { data: me } = useProfile();
  const queryClient = useQueryClient();
  const { data: pending } = useQuery({ queryKey: [api.approvals.pending.path], queryFn: async () => (await fetch(api.approvals.pending.path, { credentials: "include" })).json() });
  const decide = useMutation({
    mutationFn: async ({ userId, action }: { userId: string; action: "approve" | "reject" }) => fetch(buildUrl(api.approvals.decide.path, { professionalUserId: userId }), { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ action }) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [api.approvals.pending.path] }); queryClient.invalidateQueries({ queryKey: [api.stats.get.path] }); },
  });

  const chartData = (stats?.revenueByDay || []).map((entry) => ({ name: entry.day, total: entry.total }));

  return <AppShell><header className="mb-8"><h1 className="text-3xl font-display font-bold text-primary premium-outline">Dashboard Administrativo</h1><p className="text-muted-foreground mt-2">Visão geral do desempenho do salão.</p>{me?.shop && <div className="mt-3"><p className="text-lg font-semibold">{me.shop.name}</p><p className="text-sm text-muted-foreground">ID da loja: {me.shop.code}</p></div>}</header>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"><StatCard title="Receita Total" value={isLoading ? <Skeleton className="h-8 w-24" /> : <Currency value={stats?.totalRevenue || 0} />} icon={DollarSign} description="Acumulado do mês" /><StatCard title="Total de Cortes" value={isLoading ? <Skeleton className="h-8 w-16" /> : stats?.totalCuts} icon={Scissors} description="Cortes realizados" /><StatCard title="Comissões" value={isLoading ? <Skeleton className="h-8 w-24" /> : <Currency value={stats?.totalCommission || 0} />} icon={Clock} description="A pagar aos profissionais" alert /><StatCard title="Pendentes" value={isLoading ? <Skeleton className="h-8 w-12" /> : stats?.pendingApprovals} icon={AlertTriangle} description="Aguardando aprovação" highlight={!!stats?.pendingApprovals} /></div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><Card className="shadow-lg"><CardHeader><CardTitle>Receita Semanal</CardTitle></CardHeader><CardContent><div className="h-[280px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="total" fill="hsl(var(--primary))" /></BarChart></ResponsiveContainer></div></CardContent></Card>
      <Card><CardHeader><CardTitle>Solicitações de Profissionais</CardTitle></CardHeader><CardContent className="space-y-3">{pending?.length ? pending.map((item: any) => <div key={item.userId} className="border rounded p-3"><p className="font-medium">{item.name}</p><p className="text-xs text-muted-foreground">{item.email} • {item.phone}</p><div className="flex gap-2 mt-2"><Button size="sm" onClick={() => decide.mutate({ userId: item.userId, action: "approve" })}>Aprovar</Button><Button size="sm" variant="outline" onClick={() => decide.mutate({ userId: item.userId, action: "reject" })}>Recusar</Button></div></div>) : <p className="text-sm text-muted-foreground">Nenhuma solicitação pendente.</p>}</CardContent></Card>
    </div>
  </AppShell>;
}

function StatCard({ title, value, icon: Icon, description, alert, highlight }: any) {
  return <Card className={`${highlight ? "ring-1 ring-amber-400" : ""}`}><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm text-muted-foreground">{title}</CardTitle><Icon className={`h-4 w-4 ${alert ? "text-amber-500" : "text-primary"}`} /></CardHeader><CardContent><div className="text-2xl font-bold">{value}</div><p className="text-xs text-muted-foreground">{description}</p></CardContent></Card>;
}
