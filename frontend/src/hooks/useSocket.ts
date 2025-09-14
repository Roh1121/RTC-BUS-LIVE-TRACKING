import { useEffect, useCallback, useRef } from 'react';
import { socketService } from '../services/socketService';
import { BusLocationUpdate, BusOccupancyUpdate, BusStatusChange, ServiceAlert } from '../types';

interface UseSocketOptions {
  onBusLocationUpdate?: (data: BusLocationUpdate) => void;
  onBusOccupancyUpdate?: (data: BusOccupancyUpdate) => void;
  onBusStatusChange?: (data: BusStatusChange) => void;
  onServiceAlert?: (data: ServiceAlert) => void;
  autoConnect?: boolean;
}

export const useSocket = (options: UseSocketOptions = {}) => {
  const {
    onBusLocationUpdate,
    onBusOccupancyUpdate,
    onBusStatusChange,
    onServiceAlert,
    autoConnect = true,
  } = options;

  const isConnectedRef = useRef(false);

  const connect = useCallback(async (token?: string) => {
    try {
      if (!isConnectedRef.current) {
        await socketService.connect(token);
        isConnectedRef.current = true;
      }
    } catch (error) {
      console.error('Failed to connect to socket:', error);
      isConnectedRef.current = false;
    }
  }, []);

  const disconnect = useCallback(() => {
    socketService.disconnect();
    isConnectedRef.current = false;
  }, []);

  const subscribeToRoute = useCallback((routeId: string) => {
    socketService.subscribeToRoute(routeId);
  }, []);

  const unsubscribeFromRoute = useCallback((routeId: string) => {
    socketService.unsubscribeFromRoute(routeId);
  }, []);

  const subscribeToBus = useCallback((busId: string) => {
    socketService.subscribeToBus(busId);
  }, []);

  const unsubscribeFromBus = useCallback((busId: string) => {
    socketService.unsubscribeFromBus(busId);
  }, []);

  const subscribeToArea = useCallback((latitude: number, longitude: number, radius?: number) => {
    socketService.subscribeToArea(latitude, longitude, radius);
  }, []);

  const shareLocation = useCallback((data: {
    busId: string;
    latitude: number;
    longitude: number;
    speed?: number;
    direction?: number;
  }) => {
    socketService.shareLocation(data);
  }, []);

  const updateOccupancy = useCallback((data: {
    busId: string;
    occupiedSeats: number;
    totalSeats: number;
  }) => {
    socketService.updateOccupancy(data);
  }, []);

  const sendAlert = useCallback((data: {
    type: string;
    message: string;
    routeId?: string;
    busId?: string;
    severity?: 'info' | 'warning' | 'error' | 'success';
  }) => {
    socketService.sendAlert(data);
  }, []);

  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      if (autoConnect) {
        disconnect();
      }
    };
  }, [autoConnect, connect, disconnect]);

  useEffect(() => {
    if (onBusLocationUpdate) {
      socketService.onBusLocationUpdate(onBusLocationUpdate);
    }

    if (onBusOccupancyUpdate) {
      socketService.onBusOccupancyUpdate(onBusOccupancyUpdate);
    }

    if (onBusStatusChange) {
      socketService.onBusStatusChange(onBusStatusChange);
    }

    if (onServiceAlert) {
      socketService.onServiceAlert(onServiceAlert);
    }

    return () => {
      socketService.offBusLocationUpdate();
      socketService.offBusOccupancyUpdate();
      socketService.offBusStatusChange();
      socketService.offServiceAlert();
    };
  }, [onBusLocationUpdate, onBusOccupancyUpdate, onBusStatusChange, onServiceAlert]);

  return {
    connect,
    disconnect,
    subscribeToRoute,
    unsubscribeFromRoute,
    subscribeToBus,
    unsubscribeFromBus,
    subscribeToArea,
    shareLocation,
    updateOccupancy,
    sendAlert,
    isConnected: () => socketService.isConnected(),
  };
};
