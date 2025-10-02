export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
  avatarUrl: string;
  avatarHint: string;
  vehicles: Vehicle[];
}

export type ClientFormData = Omit<Client, 'id' | 'createdAt' | 'vehicles' | 'avatarUrl' | 'avatarHint'>;

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  imageUrl: string;
  imageHint: string;
  serviceHistory: ServiceRecord[];
}

export type VehicleFormData = Omit<Vehicle, 'id' | 'imageUrl' | 'imageHint' | 'serviceHistory'>;


export interface ServiceRecord {
  id: string;
  serviceType: string;
  date: string;
  notes: string;
  cost: number;
  predictedExpirationDate?: string;
}

export type ServiceRecordFormData = Omit<ServiceRecord, 'id'>;


export interface Notification {
  id: string;
  clientName: string;
  vehicleModel: string;
  serviceType: string;
  dueDate: string;
  status: 'scheduled' | 'sent' | 'failed';
  channel: 'WhatsApp' | 'Email' | 'SMS';
}
