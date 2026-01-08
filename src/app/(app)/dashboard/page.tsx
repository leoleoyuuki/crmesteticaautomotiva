'use client';

import { StatCard } from '@/components/dashboard/stat-card';
import { ClientGrowthChart } from '@/components/dashboard/client-growth-chart';
import { RevenueChart } from '@/components/dashboard/revenue-chart';
import { UpcomingExpirations } from '@/components/dashboard/upcoming-expirations';
import { DollarSign, Users, TrendingUp, Loader2, AlertTriangle, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useUser } from '@/firebase/auth/use-user';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { getClients, getUserProfile } from '@/lib/data';
import { Client, MonthlyRevenue, UserSummary } from '@/lib/types';
import { isAfter, parseISO } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { useSearch } from '@/context/search-provider';
import { Alert } from '@/components/ui/alert';
import { doc, getDoc, runTransaction, collection, getDocs, writeBatch } from 'firebase/firestore';
import { firestore } from '@/firebase/firebase';
import { Button } from '@/components/ui/button';

export type UpcomingExpiration = {
  clientId: string;
  clientName: string;
  clientPhone: string;
  vehicleId: string;
  vehicleMake: string;
  vehicleModel: string;
  serviceId: string;
  serviceType: string;
  expirationDate: string;
  imageUrl?: string;
};

// Helper to safely convert Firestore timestamp or string to a Date object
const toDate = (timestamp: any): Date => {
    if (timestamp && typeof timestamp.seconds === 'number') {
      return new Date(timestamp.seconds * 1000);
    }
    if (typeof timestamp === 'string') {
      const date = new Date(timestamp);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    return new Date(); // Fallback to now if conversion fails
};


export default function DashboardPage() {
  const { user } = useUser()!;
  const [summary, setSummary] = useState<UserSummary | null>(null);
  const [monthlyRevenues, setMonthlyRevenues] = useState<MonthlyRevenue[]>([]);
  const [upcomingExpirations, setUpcomingExpirations] = useState<UpcomingExpiration[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMigrating, setIsMigrating] = useState(false);
  const { searchTerm } = useSearch();

  const runMigration = useCallback(async () => {
    if (!user) return;
    setIsMigrating(true);

    const allClients = await getClients(user.uid);
    let totalRevenue = 0;
    let totalServices = 0;
    const clientGrowth: { [key: string]: { month: string, clients: number } } = {};
    const revenueByMonth: { [key: string]: { id: string, month: string, revenue: number } } = {};

    allClients.forEach(client => {
      // Client Growth
      const clientDate = toDate(client.createdAt);
      const clientMonthKey = `${clientDate.getFullYear()}-${(clientDate.getMonth() + 1).toString().padStart(2, '0')}`;
      if (!clientGrowth[clientMonthKey]) {
        clientGrowth[clientMonthKey] = { month: clientMonthKey, clients: 0 };
      }
      clientGrowth[clientMonthKey].clients++;
      
      client.vehicles?.forEach(vehicle => {
        vehicle.serviceHistory?.forEach(service => {
          totalServices++;
          totalRevenue += service.cost;
          // Monthly Revenue
          const serviceDate = toDate(service.date);
          const serviceMonthKey = `${serviceDate.getFullYear()}-${(serviceDate.getMonth() + 1).toString().padStart(2, '0')}`;
          if (!revenueByMonth[serviceMonthKey]) {
            revenueByMonth[serviceMonthKey] = { id: serviceMonthKey, month: serviceMonthKey, revenue: 0 };
          }
          revenueByMonth[serviceMonthKey].revenue += service.cost;
        });
      });
    });

    try {
      const batch = writeBatch(firestore);

      // Write summary
      const summaryRef = doc(firestore, 'users', user.uid, 'summary', 'allTime');
      const newSummary: UserSummary = {
        totalRevenue,
        totalClients: allClients.length,
        totalServices,
        clientGrowth: Object.values(clientGrowth),
        lastUpdated: new Date().toISOString()
      };
      batch.set(summaryRef, newSummary);
      
      // Write monthly revenues
      Object.values(revenueByMonth).forEach(monthData => {
        const monthRef = doc(firestore, 'users', user.uid, 'monthlyRevenues', monthData.id);
        batch.set(monthRef, monthData);
      });
      
      // Mark migration as complete
      const userProfileRef = doc(firestore, 'users', user.uid);
      batch.update(userProfileRef, { migrationCompleted: true });

      await batch.commit();

      // Fetch data again after migration
      fetchDashboardData();

    } catch (error) {
      console.error("Error during data migration:", error);
    } finally {
      setIsMigrating(false);
    }
  }, [user]);

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      const userProfile = await getUserProfile(user.uid);
      
      // If migration not done, run it.
      if (userProfile && !userProfile.migrationCompleted) {
        await runMigration();
        return; // runMigration will recall fetchDashboardData
      }

      // Fetch Summary
      const summaryRef = doc(firestore, 'users', user.uid, 'summary', 'allTime');
      const summarySnap = await getDoc(summaryRef);
      if (summarySnap.exists()) {
        setSummary(summarySnap.data() as UserSummary);
      }

      // Fetch Monthly Revenues
      const revenuesRef = collection(firestore, 'users', user.uid, 'monthlyRevenues');
      const revenuesSnap = await getDocs(revenuesRef);
      const revenuesData = revenuesSnap.docs.map(d => d.data() as MonthlyRevenue);
      
      // Format for chart
      const last6Months: { month: string, revenue: number }[] = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
        const monthName = d.toLocaleString('default', { month: 'long' });
        const revenueData = revenuesData.find(r => r.id === monthKey);
        last6Months.push({ month: monthName, revenue: revenueData?.revenue || 0 });
      }
      setMonthlyRevenues(last6Months as any);

      // Fetch upcoming expirations (this still requires fetching clients, might be optimizable later)
      const clientData = await getClients(user.uid);
      const expirations: UpcomingExpiration[] = [];
      clientData.forEach(client => {
        client.vehicles?.forEach(vehicle => {
          vehicle.serviceHistory?.forEach(service => {
            if (service.expirationDate && typeof service.expirationDate === 'string') {
              const expirationDate = parseISO(service.expirationDate);
              if (isAfter(expirationDate, new Date())) {
                expirations.push({
                  clientId: client.id,
                  clientName: client.name,
                  clientPhone: client.phone,
                  vehicleId: vehicle.id,
                  vehicleMake: vehicle.make,
                  vehicleModel: vehicle.model,
                  serviceId: service.id,
                  serviceType: service.serviceType,
                  expirationDate: service.expirationDate,
                  imageUrl: service.imageUrl,
                });
              }
            }
          });
        });
      });
      expirations.sort((a, b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime());
      setUpcomingExpirations(expirations);

    } catch (error) {
      console.error("Error fetching dashboard data: ", error);
    } finally {
      setLoading(false);
    }
  }, [user, runMigration]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const clientGrowthChartData = useMemo(() => {
    if (!summary?.clientGrowth) return [];
    
    const last6Months: { month: string, clients: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      const monthName = d.toLocaleString('default', { month: 'long' });
      const growthData = summary.clientGrowth.find(g => g.month === monthKey);
      last6Months.push({ month: monthName, clients: growthData?.clients || 0 });
    }
    return last6Months;
  }, [summary]);
  

  const filteredExpirations = useMemo(() => {
    if (!searchTerm) {
      return upcomingExpirations;
    }
    const lowercasedFilter = searchTerm.toLowerCase();
    return upcomingExpirations.filter(
      (exp) =>
        exp.clientName.toLowerCase().includes(lowercasedFilter) ||
        exp.vehicleMake.toLowerCase().includes(lowercasedFilter) ||
        exp.vehicleModel.toLowerCase().includes(lowercasedFilter) ||
        exp.serviceType.toLowerCase().includes(lowercasedFilter)
    );
  }, [upcomingExpirations, searchTerm]);

  if (loading) {
    return (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-[126px]" />
            <Skeleton className="h-[126px]" />
            <Skeleton className="h-[126px]" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Skeleton className="col-span-full lg:col-span-4 h-[330px]" />
            <Skeleton className="col-span-full lg:col-span-3 h-[330px]" />
          </div>
          <Skeleton className="h-[400px]" />
        </div>
    );
  }

  if (isMigrating) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center">
        <Card className="max-w-lg p-8">
            <CardHeader>
                <div className="mx-auto bg-primary/10 text-primary p-3 rounded-full w-fit">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
                <CardTitle className="mt-4 font-headline">Otimizando sua Conta</CardTitle>
                <CardDescription>
                    Estamos calculando seus totais pela primeira vez. Isso pode levar alguns segundos e acontecerá apenas uma vez para garantir que seu painel carregue rapidamente no futuro.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">Por favor, não feche ou atualize esta página.</p>
            </CardContent>
        </Card>
      </div>
    );
  }

  return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatCard title="Receita Total" value={`R$${(summary?.totalRevenue || 0).toFixed(2).replace('.', ',')}`} icon={DollarSign} description="Receita de todos os serviços" />
          <StatCard title="Total de Clientes" value={(summary?.totalClients || 0).toString()} icon={Users} description="Clientes cadastrados na base" />
          <StatCard title="Total de Serviços" value={(summary?.totalServices || 0).toString()} icon={TrendingUp} description="Serviços prestados" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
          <Card className="lg:col-span-4">
             <CardHeader>
              <CardTitle className="font-headline">Receita Mensal</CardTitle>
              <CardDescription>Receita gerada nos últimos 6 meses.</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <RevenueChart data={monthlyRevenues} />
            </CardContent>
          </Card>
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="font-headline">Crescimento de Clientes</CardTitle>
              <CardDescription>Novos clientes nos últimos 6 meses.</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <ClientGrowthChart data={clientGrowthChartData} />
            </CardContent>
          </Card>
        </div>
        <UpcomingExpirations expirations={filteredExpirations} />
      </div>
  );
}
