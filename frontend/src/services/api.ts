import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { ApiResponse, Bus, Route, User, SearchParams } from '../types';

class ApiService {
  private api: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> {
    const response = await this.api.post('/auth/login', { email, password });
    return response.data;
  }

  async register(userData: {
    name: string;
    email: string;
    password: string;
    phoneNumber?: string;
    role?: string;
  }): Promise<ApiResponse<{ user: User; token: string }>> {
    const response = await this.api.post('/auth/register', userData);
    return response.data;
  }

  async getMe(): Promise<ApiResponse<{ user: User }>> {
    const response = await this.api.get('/auth/me');
    return response.data;
  }

  async updateProfile(userData: Partial<User>): Promise<ApiResponse<{ user: User }>> {
    const response = await this.api.put('/auth/me', userData);
    return response.data;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse<any>> {
    const response = await this.api.put('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  }

  // Bus endpoints
  async getBuses(params?: SearchParams): Promise<ApiResponse<Bus[]>> {
    const response = await this.api.get('/buses', { params });
    return response.data;
  }

  async getBus(id: string): Promise<ApiResponse<Bus>> {
    const response = await this.api.get(`/buses/${id}`);
    return response.data;
  }

  async getBusesByRoute(routeId: string): Promise<ApiResponse<Bus[]>> {
    const response = await this.api.get(`/buses/route/${routeId}`);
    return response.data;
  }

  async getNearbyBuses(
    latitude: number,
    longitude: number,
    radius?: number
  ): Promise<ApiResponse<Bus[]>> {
    const response = await this.api.get('/buses/nearby', {
      params: { latitude, longitude, radius },
    });
    return response.data;
  }

  async updateBusLocation(data: {
    busId: string;
    latitude: number;
    longitude: number;
    speed?: number;
    direction?: number;
    occupiedSeats?: number;
  }): Promise<ApiResponse<any>> {
    const response = await this.api.post('/buses/update-location', data);
    return response.data;
  }

  async createBus(busData: Partial<Bus>): Promise<ApiResponse<Bus>> {
    const response = await this.api.post('/buses', busData);
    return response.data;
  }

  async updateBus(id: string, busData: Partial<Bus>): Promise<ApiResponse<Bus>> {
    const response = await this.api.put(`/buses/${id}`, busData);
    return response.data;
  }

  async updateBusStatus(id: string, status: string): Promise<ApiResponse<Bus>> {
    const response = await this.api.patch(`/buses/${id}/status`, { status });
    return response.data;
  }

  async deleteBus(id: string): Promise<ApiResponse<any>> {
    const response = await this.api.delete(`/buses/${id}`);
    return response.data;
  }

  // Route endpoints
  async getRoutes(params?: SearchParams): Promise<ApiResponse<Route[]>> {
    const response = await this.api.get('/routes', { params });
    return response.data;
  }

  async getRoute(id: string): Promise<ApiResponse<{ route: Route; activeBuses: Bus[]; busCount: number }>> {
    const response = await this.api.get(`/routes/${id}`);
    return response.data;
  }

  async getRoutesByArea(
    latitude: number,
    longitude: number,
    radius?: number
  ): Promise<ApiResponse<Route[]>> {
    const response = await this.api.get('/routes/nearby', {
      params: { latitude, longitude, radius },
    });
    return response.data;
  }

  async getRouteStops(id: string): Promise<ApiResponse<{
    routeId: string;
    routeName: string;
    routeNumber: string;
    stops: any[];
    totalStops: number;
  }>> {
    const response = await this.api.get(`/routes/${id}/stops`);
    return response.data;
  }

  async getRouteArrivals(id: string): Promise<ApiResponse<any>> {
    const response = await this.api.get(`/routes/${id}/arrivals`);
    return response.data;
  }

  async searchRoutes(query: string, limit?: number): Promise<ApiResponse<Route[]>> {
    const response = await this.api.get('/routes/search', {
      params: { q: query, limit },
    });
    return response.data;
  }

  async createRoute(routeData: Partial<Route>): Promise<ApiResponse<Route>> {
    const response = await this.api.post('/routes', routeData);
    return response.data;
  }

  async updateRoute(id: string, routeData: Partial<Route>): Promise<ApiResponse<Route>> {
    const response = await this.api.put(`/routes/${id}`, routeData);
    return response.data;
  }

  async deleteRoute(id: string): Promise<ApiResponse<any>> {
    const response = await this.api.delete(`/routes/${id}`);
    return response.data;
  }

  // Utility methods
  setAuthToken(token: string): void {
    localStorage.setItem('token', token);
  }

  removeAuthToken(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  getAuthToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }
}

export const apiService = new ApiService();
export default apiService;
