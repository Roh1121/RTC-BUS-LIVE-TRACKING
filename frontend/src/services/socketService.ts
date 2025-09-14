import { io, Socket } from 'socket.io-client';
import { BusLocationUpdate, BusOccupancyUpdate, BusStatusChange, ServiceAlert } from '../types';

class SocketService {
  private socket: Socket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor() {
    this.url = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
  }

  connect(token?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(this.url, {
          auth: {
            token: token || localStorage.getItem('token'),
          },
          transports: ['websocket', 'polling'],
        });

        this.socket.on('connect', () => {
          console.log('Connected to server');
          this.reconnectAttempts = 0;
          resolve();
        });

        this.socket.on('disconnect', (reason) => {
          console.log('Disconnected from server:', reason);
          if (reason === 'io server disconnect') {
            // Server initiated disconnect, try to reconnect
            this.handleReconnect();
          }
        });

        this.socket.on('connect_error', (error) => {
          console.error('Connection error:', error);
          this.handleReconnect();
          reject(error);
        });

        this.socket.on('subscription-confirmed', (data) => {
          console.log('Subscription confirmed:', data);
        });

        // Set up ping/pong for connection health
        this.socket.on('pong', (data) => {
          console.log('Pong received:', data);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      setTimeout(() => {
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.connect();
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  // Subscription methods
  subscribeToRoute(routeId: string): void {
    if (this.socket) {
      this.socket.emit('subscribe-route', routeId);
    }
  }

  unsubscribeFromRoute(routeId: string): void {
    if (this.socket) {
      this.socket.emit('unsubscribe-route', routeId);
    }
  }

  subscribeToBus(busId: string): void {
    if (this.socket) {
      this.socket.emit('subscribe-bus', busId);
    }
  }

  unsubscribeFromBus(busId: string): void {
    if (this.socket) {
      this.socket.emit('unsubscribe-bus', busId);
    }
  }

  subscribeToArea(latitude: number, longitude: number, radius?: number): void {
    if (this.socket) {
      this.socket.emit('subscribe-area', { latitude, longitude, radius });
    }
  }

  // Event listeners
  onBusLocationUpdate(callback: (data: BusLocationUpdate) => void): void {
    if (this.socket) {
      this.socket.on('bus-location-updated', callback);
    }
  }

  onBusOccupancyUpdate(callback: (data: BusOccupancyUpdate) => void): void {
    if (this.socket) {
      this.socket.on('bus-occupancy-updated', callback);
    }
  }

  onBusStatusChange(callback: (data: BusStatusChange) => void): void {
    if (this.socket) {
      this.socket.on('bus-status-changed', callback);
    }
  }

  onServiceAlert(callback: (data: ServiceAlert) => void): void {
    if (this.socket) {
      this.socket.on('service-alert', callback);
    }
  }

  // Remove event listeners
  offBusLocationUpdate(): void {
    if (this.socket) {
      this.socket.off('bus-location-updated');
    }
  }

  offBusOccupancyUpdate(): void {
    if (this.socket) {
      this.socket.off('bus-occupancy-updated');
    }
  }

  offBusStatusChange(): void {
    if (this.socket) {
      this.socket.off('bus-status-changed');
    }
  }

  offServiceAlert(): void {
    if (this.socket) {
      this.socket.off('service-alert');
    }
  }

  // Driver/operator methods
  shareLocation(data: {
    busId: string;
    latitude: number;
    longitude: number;
    speed?: number;
    direction?: number;
  }): void {
    if (this.socket) {
      this.socket.emit('share-location', data);
    }
  }

  updateOccupancy(data: {
    busId: string;
    occupiedSeats: number;
    totalSeats: number;
  }): void {
    if (this.socket) {
      this.socket.emit('update-occupancy', data);
    }
  }

  sendAlert(data: {
    type: string;
    message: string;
    routeId?: string;
    busId?: string;
    severity?: 'info' | 'warning' | 'error' | 'success';
  }): void {
    if (this.socket) {
      this.socket.emit('send-alert', data);
    }
  }

  // Utility methods
  ping(): void {
    if (this.socket) {
      this.socket.emit('ping');
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

export const socketService = new SocketService();
export default socketService;
