'use client';

import { StatCard } from '@/components/dashboard/stat-card';
import { ClientGrowthChart } from '@/components/dashboard/client-growth-chart';
import { RevenueChart } from '@/components/dashboard/revenue-chart';
import { UpcomingExpirations } from '@/components/dashboard/upcoming-expirations';
import { DollarSign, Users, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useUser } from '@/firebase/auth/use-user';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { getClients } from '@/lib/data';
import { Client } from '@/lib/types';
import { subMonths, isAfter, parseISO } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

export type UpcomingExpiration = {
  clientId: string;
  clientName: string;
  clientAvatar: string;
  clientPhone: string;
  vehicleId: string;
  vehicleMake: string;
  vehicleModel: string;
  serviceId: string;
  serviceType: string;
  expirationDate: string;
};

export default function DashboardPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login');
    }
    
    async function fetchData() {
        if (!user) return;
        const clientData = await getClients(user.uid);
        setClients(clientData);
        setLoading(false);
    }
    
    if (user) {
        fetchData();
    }
  }, [user, userLoading, router]);
  
  const { stats, clientGrowthData, monthlyRevenueData, upcomingExpirations } = useMemo(() => {
    if (!clients.length) {
      return {
        stats: { totalRevenue: 0, totalClients: 0, totalServices: 0 },
        clientGrowthData: [],
        monthlyRevenueData: [],
        upcomingExpirations: [],
      };
    }

    const now = new Date();
    const sixMonthsAgo = subMonths(now, 6);

    let totalRevenue = 0;
    let totalServices = 0;
    const clientGrowth: { [key: string]: number } = {};
    const monthlyRevenue: { [key: string]: number } = {};
    const expirations: UpcomingExpiration[] = [];

    for (let i = 5; i >= 0; i--) {
        const month = subMonths(now, i);
        const monthKey = `${month.getFullYear()}-${(month.getMonth() + 1).toString().padStart(2, '0')}`;
        clientGrowth[monthKey] = 0;
        monthlyRevenue[monthKey] = 0;
    }

    clients.forEach(client => {
      // Ensure createdAt is a valid date string before parsing
      if(client.createdAt && typeof client.createdAt === 'string') {
        const clientCreatedAt = parseISO(client.createdAt);
        if (isAfter(clientCreatedAt, sixMonthsAgo)) {
          const monthKey = `${clientCreatedAt.getFullYear()}-${(clientCreatedAt.getMonth() + 1).toString().padStart(2, '0')}`;
          if (clientGrowth[monthKey] !== undefined) {
            clientGrowth[monthKey]++;
          }
        }
      }

      client.vehicles?.forEach(vehicle => {
        vehicle.serviceHistory?.forEach(service => {
          totalServices++;
          totalRevenue += service.cost;
          
          if(service.date && typeof service.date === 'string') {
            const serviceDate = parseISO(service.date);
            if (isAfter(serviceDate, sixMonthsAgo)) {
              const monthKey = `${serviceDate.getFullYear()}-${(serviceDate.getMonth() + 1).toString().padStart(2, '0')}`;
              if (monthlyRevenue[monthKey] !== undefined) {
                  monthlyRevenue[monthKey] += service.cost;
              }
            }
          }

          if(service.expirationDate && typeof service.expirationDate === 'string') {
            const expirationDate = parseISO(service.expirationDate);
            if(isAfter(expirationDate, now)) {
              expirations.push({
                clientId: client.id,
                clientName: client.name,
                clientAvatar: client.avatarUrl,
                clientPhone: client.phone,
                vehicleId: vehicle.id,
                vehicleMake: vehicle.make,
                vehicleModel: vehicle.model,
                serviceId: service.id,
                serviceType: service.serviceType,
                expirationDate: service.expirationDate,
              });
            }
          }
        });
      });
    });

    const clientGrowthData = Object.entries(clientGrowth).map(([month, count]) => ({ month: new Date(`${month}-02T00:00:00`).toLocaleString('default', { month: 'long' }), clients: count }));
    const monthlyRevenueData = Object.entries(monthlyRevenue).map(([month, revenue]) => ({ month: new Date(`${month}-02T00:00:00`).toLocaleString('default', { month: 'long' }), revenue }));
    
    expirations.sort((a, b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime());

    return {
      stats: {
        totalRevenue,
        totalClients: clients.length,
        totalServices,
      },
      clientGrowthData,
      monthlyRevenueData,
      upcomingExpirations: expirations,
    };

  }, [clients]);

  if (userLoading || loading || !user) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-[126px]" />
            <Skeleton className="h-[126px]" />
            <Skeleton className="h-[126px]" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Skeleton className="col-span-4 h-[330px]" />
            <Skeleton className="col-span-4 lg:col-span-3 h-[330px]" />
          </div>
          <Skeleton className="h-[400px]" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatCard title="Receita Total" value={`R$${stats.totalRevenue.toFixed(2).replace('.', ',')}`} icon={DollarSign} description="Receita de todos os serviços" />
          <StatCard title="Total de Clientes" value={stats.totalClients.toString()} icon={Users} description="Clientes cadastrados na base" />
          <StatCard title="Total de Serviços" value={stats.totalServices.toString()} icon={TrendingUp} description="Serviços prestados" />
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
    </AppLayout>
  );
}
