export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
  vehicles: Vehicle[];
  avatarUrl?: string; // Optional
  avatarHint?: string; // Optional
}

export type ClientFormData = Omit<Client, 'id' | 'createdAt' | 'vehicles' | 'avatarUrl' | 'avatarHint'>;

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  serviceHistory: ServiceRecord[];
  imageUrl?: string; // Optional
  imageHint?: string; // Optional
}

export type VehicleFormData = Omit<Vehicle, 'id' | 'imageUrl' | 'imageHint' | 'serviceHistory'>;


export interface ServiceRecord {
  id: string;
  serviceType: string;
  date: string;
  notes?: string;
  cost: number;
  durationMonths: number;
  expirationDate: string;
  imageUrl?: string;
  isRenewed?: boolean;
}

export type ServiceRecordFormData = Omit<ServiceRecord, 'id' | 'expirationDate'>;


export interface Notification {
  id: string;
  clientName: string;
  vehicleModel: string;
  serviceType: string;
  dueDate: string;
  status: 'scheduled' | 'sent' | 'failed';
  channel: 'WhatsApp' | 'Email' | 'SMS';
}

export interface UserProfile {
    id: string;
    name: string;
    email: string;
    isActivated: boolean;
    activatedUntil?: string;
}

export interface ActivationCode {
    id: string;
    code: string;
    durationMonths: number;
    createdAt: string;
    isUsed: boolean;
    usedBy?: string;
    usedAt?: string;
}
