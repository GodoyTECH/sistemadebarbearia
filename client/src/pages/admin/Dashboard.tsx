import { useStats } from "@/hooks/use-stats";
import { Sidebar } from "@/components/Sidebar";
import { Currency } from "@/components/Currency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { DollarSign, Scissors, Clock, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboard() {
  const { data: stats, isLoading } = useStats();

  const chartData = [
    { name: 'Seg', total: Math.floor(Math.random() * 5000) },
    { name: 'Ter', total: Math.floor(Math.random() * 5000) },
    { name: 'Qua', total: Math.floor(Math.random() * 5000) },
    { name: 'Qui', total: Math.floor(Math.random() * 5000) },
    { name: 'Sex', total: Math.floor(Math.random() * 8000) },
    { name: 'Sab', total: Math.floor(Math.random() * 10000) },
    { name: 'Dom', total: Math.floor(Math.random() * 4000) },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-display font-bold text-primary">Dashboard Administrativo</h1>
          <p className="text-muted-foreground mt-2">Visão geral do desempenho do salão.</p>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Receita Total"
            value={isLoading ? <Skeleton className="h-8 w-24" /> : <Currency value={stats?.totalRevenue || 0} />}
            icon={DollarSign}
            description="Acumulado do mês"
            trend="+12% vs mês anterior"
          />
          <StatCard
            title="Total de Cortes"
            value={isLoading ? <Skeleton className="h-8 w-16" /> : stats?.totalCuts}
            icon={Scissors}
            description="Cortes realizados"
          />
          <StatCard
            title="Comissões"
            value={isLoading ? <Skeleton className="h-8 w-24" /> : <Currency value={stats?.totalCommission || 0} />}
            icon={Clock}
            description="A pagar aos profissionais"
            alert={true}
          />
          <StatCard
            title="Pendentes"
            value={isLoading ? <Skeleton className="h-8 w-12" /> : stats?.pendingApprovals}
            icon={AlertTriangle}
            description="Aguardando aprovação"
            highlight={stats?.pendingApprovals && stats.pendingApprovals > 0}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <Card className="col-span-1 shadow-lg shadow-black/5 border-border/50">
            <CardHeader>
              <CardTitle>Receita Semanal</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(value) => `R$${value}`} 
                    />
                    <Tooltip 
                      cursor={{fill: 'hsl(var(--muted)/0.3)'}}
                      contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                    />
                    <Bar 
                      dataKey="total" 
                      fill="hsl(var(--primary))" 
                      radius={[4, 4, 0, 0]} 
                      barSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Alert Card */}
          <Card className="col-span-1 border-amber-200 bg-amber-50/50 shadow-none">
            <CardHeader>
              <CardTitle className="text-amber-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Alertas Trabalhistas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-amber-800">
                  Atenção às regras de parceria. Verifique se os contratos de todos os profissionais estão atualizados e se os repasses estão dentro da faixa permitida.
                </p>
                <div className="p-4 bg-white rounded-lg border border-amber-100">
                  <h4 className="font-semibold text-amber-900 text-sm mb-1">Dica Jurídica</h4>
                  <p className="text-xs text-muted-foreground">
                    Para evitar vínculo empregatício, certifique-se de que os profissionais tenham autonomia na gestão de agenda e não recebam ordens diretas de subordinação.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, description, trend, alert, highlight }: any) {
  return (
    <Card className={`shadow-sm border-border/60 transition-all duration-200 hover:shadow-md ${highlight ? 'ring-2 ring-amber-400 border-amber-400 bg-amber-50/30' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={`h-4 w-4 ${alert ? 'text-amber-500' : 'text-primary'}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold font-display">{value}</div>
        <p className="text-xs text-muted-foreground mt-1 flex items-center justify-between">
          {description}
          {trend && <span className="text-emerald-600 font-medium">{trend}</span>}
        </p>
      </CardContent>
    </Card>
  );
}
