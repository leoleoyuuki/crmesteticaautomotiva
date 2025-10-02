import type { Client, Vehicle, ServiceRecord, Notification } from './types';

const MOCK_VEHICLES: Vehicle[] = [
  {
    id: 'veh-001',
    make: 'Honda',
    model: 'Civic',
    year: 2022,
    licensePlate: 'ABC-1234',
    imageUrl: 'https://picsum.photos/seed/hondacivic/600/400',
    imageHint: 'gray sedan',
    serviceHistory: [
      { id: 'srv-001', serviceType: 'Polimento Técnico', date: '2023-10-15', notes: 'Polimento completo da carroceria.', cost: 500 },
      { id: 'srv-002', serviceType: 'Higienização Interna', date: '2023-10-15', notes: 'Limpeza detalhada do interior.', cost: 300 },
    ],
  },
  {
    id: 'veh-002',
    make: 'Toyota',
    model: 'Corolla',
    year: 2021,
    licensePlate: 'DEF-5678',
    imageUrl: 'https://picsum.photos/seed/corolla/600/400',
    imageHint: 'white sedan',
    serviceHistory: [
      { id: 'srv-003', serviceType: 'Vitrificação de Pintura', date: '2023-08-20', notes: 'Aplicação de coating cerâmico.', cost: 1200 },
    ],
  },
];

const MOCK_CLIENTS: Client[] = [
  {
    id: 'cli-001',
    name: 'Ana Silva',
    email: 'ana.silva@example.com',
    phone: '(11) 98765-4321',
    createdAt: '2023-01-20',
    avatarUrl: 'https://picsum.photos/seed/ana/100/100',
    avatarHint: 'woman smiling',
    vehicles: [MOCK_VEHICLES[0]],
  },
  {
    id: 'cli-002',
    name: 'Bruno Costa',
    email: 'bruno.costa@example.com',
    phone: '(21) 91234-5678',
    createdAt: '2022-11-05',
    avatarUrl: 'https://picsum.photos/seed/bruno/100/100',
    avatarHint: 'man portrait',
    vehicles: [MOCK_VEHICLES[1]],
  },
  {
    id: 'cli-003',
    name: 'Carlos Pereira',
    email: 'carlos.pereira@example.com',
    phone: '(31) 95555-8888',
    createdAt: '2023-05-12',
    avatarUrl: 'https://picsum.photos/seed/carlos/100/100',
    avatarHint: 'man glasses',
    vehicles: [],
  },
];

const MOCK_NOTIFICATIONS: Notification[] = [
    { id: 'not-001', clientName: 'Ana Silva', vehicleModel: 'Civic', serviceType: 'Polimento Técnico', dueDate: '2024-08-15', status: 'scheduled', channel: 'WhatsApp' },
    { id: 'not-002', clientName: 'Bruno Costa', vehicleModel: 'Corolla', serviceType: 'Vitrificação de Pintura', dueDate: '2024-07-20', status: 'sent', channel: 'Email' },
];


// Data fetching functions
export async function getClients(): Promise<Client[]> {
  return Promise.resolve(MOCK_CLIENTS);
}

export async function getClientById(id: string): Promise<Client | undefined> {
  return Promise.resolve(MOCK_CLIENTS.find(c => c.id === id));
}

export async function getDashboardStats() {
    return Promise.resolve({
        clientRetention: 85,
        upsellConversion: 23,
        averageTicketSize: 450.75,
    });
}

export async function getClientGrowth() {
    return Promise.resolve([
        { month: 'Jan', clients: 10 },
        { month: 'Fev', clients: 15 },
        { month: 'Mar', clients: 20 },
        { month: 'Abr', clients: 18 },
        { month: 'Mai', clients: 25 },
        { month: 'Jun', clients: 30 },
    ]);
}

export async function getMonthlyRevenue() {
    return Promise.resolve([
        { month: 'Jan', revenue: 4500 },
        { month: 'Fev', revenue: 6750 },
        { month: 'Mar', revenue: 9000 },
        { month: 'Abr', revenue: 8100 },
        { month: 'Mai', revenue: 11250 },
        { month: 'Jun', revenue: 13500 },
    ]);
}

export async function getUpcomingExpirations(): Promise<Notification[]> {
    return Promise.resolve(MOCK_NOTIFICATIONS);
}
