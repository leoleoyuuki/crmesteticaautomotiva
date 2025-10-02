import { getDashboardStats, getClientGrowth, getMonthlyRevenue, getUpcomingExpirations } from '@/lib/data';
import { StatCard } from '@/components/dashboard/stat-card';
import { ClientGrowthChart } from '@/components/dashboard/client-growth-chart';
import { RevenueChart } from '@/components/dashboard/revenue-chart';
import { UpcomingExpirations } from '@/components/dashboard/upcoming-expirations';
import { DollarSign, Users, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default async function DashboardPage() {
  const stats = await getDashboardStats();
  const clientGrowthData = await getClientGrowth();
  const monthlyRevenueData = await getMonthlyRevenue();
  const upcomingExpirations = await getUpcomingExpirations();

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Retenção de Clientes" value={`${stats.clientRetention}%`} icon={Users} description="nos últimos 30 dias" />
        <StatCard title="Conversão de Upsell" value={`${stats.upsellConversion}%`} icon={TrendingUp} description="aumento de 5% vs. mês passado" />
        <StatCard title="Ticket Médio" value={`R$${stats.averageTicketSize.toFixed(2).replace('.', ',')}`} icon={DollarSign} description="por serviço" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="font-headline">Crescimento de Clientes</CardTitle>
            <CardDescription>Novos clientes nos últimos 6 meses.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ClientGrowthChart data={clientGrowthData} />
          </CardContent>
        </Card>
        <Card className="col-span-4 lg:col-span-3">
          <CardHeader>
            <CardTitle className="font-headline">Receita Mensal</CardTitle>
            <CardDescription>Receita gerada nos últimos 6 meses.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <RevenueChart data={monthlyRevenueData} />
          </CardContent>
        </Card>
      </div>
      <UpcomingExpirations expirations={upcomingExpirations} />
    </div>
  );
}
