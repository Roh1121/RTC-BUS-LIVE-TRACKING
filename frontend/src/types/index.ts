export interface Location {
  latitude: number;
  longitude: number;
  lastUpdated?: Date;
}

export interface Occupancy {
  totalSeats: number;
  occupiedSeats: number;
  status: 'Available' | 'Nearly Full' | 'Overcrowded';
  lastUpdated?: Date;
}

export interface Driver {
  name?: string;
  phoneNumber?: string;
  licenseNumber?: string;
}

export interface Bus {
  _id: string;
  busNumber: string;
  routeId: Route | string;
  currentLocation: Location;
  occupancy: Occupancy;
  status: 'Active' | 'Inactive' | 'Maintenance' | 'Out of Service';
  driver?: Driver;
  speed?: number;
  direction?: number;
  nextStopId?: string;
  estimatedArrival?: Date;
  occupancyPercentage?: number;
  availableSeats?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Stop {
  stopId: string;
  name: string;
  coordinates: Location;
  order: number;
  estimatedTime: number;
  facilities?: string[];
}

export interface OperatingHours {
  start: string;
  end: string;
}

export interface Fare {
  adult: number;
  student?: number;
  senior?: number;
}

export interface Route {
  _id: string;
  routeName: string;
  routeNumber: string;
  description?: string;
  stops: Stop[];
  totalDistance: number;
  estimatedDuration: number;
  operatingHours: OperatingHours;
  frequency: number;
  fare: Fare;
  status: 'Active' | 'Inactive' | 'Maintenance' | 'Seasonal';
  routeType: 'City' | 'Express' | 'Intercity' | 'Shuttle';
  color: string;
  totalStops?: number;
  averageSpeed?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'driver' | 'operator';
  phoneNumber?: string;
  preferences?: {
    favoriteRoutes?: Route[];
    notifications?: {
      busArrival: boolean;
      routeUpdates: boolean;
      serviceAlerts: boolean;
    };
    defaultLocation?: {
      latitude: number;
      longitude: number;
      address: string;
    };
  };
  isActive: boolean;
  lastLogin?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
  total?: number;
  pagination?: {
    page: number;
    limit: number;
    pages: number;
  };
  errors?: Array<{
    field: string;
    message: string;
    value: any;
  }>;
}

export interface BusLocationUpdate {
  busId: string;
  busNumber?: string;
  routeId?: string;
  location: Location;
  speed?: number;
  direction?: number;
  timestamp?: Date;
}

export interface BusOccupancyUpdate {
  busId: string;
  busNumber?: string;
  occupancy: Occupancy;
  occupancyPercentage: number;
  availableSeats: number;
  timestamp?: Date;
}

export interface BusStatusChange {
  busId: string;
  busNumber?: string;
  status: string;
  timestamp?: Date;
}

export interface ServiceAlert {
  id: string;
  type: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  timestamp: Date;
  sender?: string;
  routeId?: string;
  busId?: string;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface FilterOptions {
  status?: string;
  routeType?: string;
  occupancyStatus?: string;
}

export interface SearchParams {
  query?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  page?: number;
  limit?: number;
  status?: string;
  routeType?: string;
}
