import React, { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { LatLngExpression, Icon, DivIcon } from 'leaflet';
import { Bus, Route, BusLocationUpdate, BusOccupancyUpdate } from '../../types';
import io from 'socket.io-client';

// Fix for default markers
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface BusTrackingMapProps {
  buses: Bus[];
  selectedRoute?: Route;
  center?: LatLngExpression;
  zoom?: number;
  onBusClick?: (bus: Bus) => void;
  className?: string;
}

// Custom bus marker icons
const createBusIcon = (occupancyStatus: string, isSelected: boolean = false) => {
  const colors = {
    'Available': '#10b981',
    'Nearly Full': '#f59e0b',
    'Overcrowded': '#ef4444',
  };

  const color = colors[occupancyStatus as keyof typeof colors] || '#3b82f6';
  const size = isSelected ? 24 : 18;
  const borderWidth = isSelected ? 3 : 2;

  return new DivIcon({
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        border: ${borderWidth}px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: bold;
        color: white;
      ">
        🚌
      </div>
    `,
    className: 'bus-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

// Bus stop marker icon
const busStopIcon = new Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="10" r="8" fill="#3b82f6" stroke="white" stroke-width="2"/>
      <circle cx="10" cy="10" r="3" fill="white"/>
    </svg>
  `),
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// Component to update map view when route changes
const MapController: React.FC<{ route?: Route }> = ({ route }) => {
  const map = useMap();

  useEffect(() => {
    if (route && route.stops.length > 0 && map) {
      try {
        const bounds = route.stops.map(stop => [
          stop.coordinates.latitude,
          stop.coordinates.longitude
        ] as [number, number]);
        
        // Add a small delay to ensure map is fully initialized
        setTimeout(() => {
          if (map.getContainer() && map.getContainer().offsetWidth > 0) {
            map.fitBounds(bounds, { padding: [20, 20] });
          }
        }, 100);
      } catch (error) {
        console.warn('Error fitting bounds:', error);
      }
    }
  }, [route, map]);

  return null;
};

export const BusTrackingMap: React.FC<BusTrackingMapProps> = ({
  buses,
  selectedRoute,
  center = [17.3850, 78.4867], // Hyderabad coordinates
  zoom = 12,
  onBusClick,
  className = ''
}) => {
  const [busPositions, setBusPositions] = useState<Map<string, Bus>>(new Map());
  const [selectedBus, setSelectedBus] = useState<string | null>(null);
  const [socket, setSocket] = useState<any>(null);
  const [mapReady, setMapReady] = useState(false);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Initialize bus positions
  useEffect(() => {
    const positions = new Map<string, Bus>();
    buses.forEach(bus => {
      positions.set(bus._id, bus);
    });
    setBusPositions(positions);
  }, [buses]);

  // Socket event handlers
  const handleBusLocationUpdate = useCallback((data: BusLocationUpdate) => {
    setBusPositions(prev => {
      const updated = new Map(prev);
      const existingBus = updated.get(data.busId);
      if (existingBus) {
        updated.set(data.busId, {
          ...existingBus,
          currentLocation: data.location,
          speed: data.speed || (existingBus as any).speed,
          direction: data.direction || (existingBus as any).direction,
        });
      }
      return updated;
    });
  }, []);

  const handleBusOccupancyUpdate = useCallback((data: BusOccupancyUpdate) => {
    setBusPositions(prev => {
      const updated = new Map(prev);
      const existingBus = updated.get(data.busId);
      if (existingBus) {
        updated.set(data.busId, {
          ...existingBus,
          occupancy: data.occupancy,
          occupancyPercentage: data.occupancyPercentage,
          availableSeats: data.availableSeats,
        });
      }
      return updated;
    });
  }, []);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('busLocationUpdate', handleBusLocationUpdate);
    socket.on('busOccupancyUpdate', handleBusOccupancyUpdate);

    return () => {
      socket.off('busLocationUpdate', handleBusLocationUpdate);
      socket.off('busOccupancyUpdate', handleBusOccupancyUpdate);
    };
  }, [socket, handleBusLocationUpdate, handleBusOccupancyUpdate]);

  const handleBusMarkerClick = (bus: Bus) => {
    setSelectedBus(bus._id);
    onBusClick?.(bus);
  };

  // Generate route polyline coordinates
  const routeCoordinates: LatLngExpression[] = selectedRoute
    ? selectedRoute.stops
        .sort((a, b) => a.order - b.order)
        .map(stop => [stop.coordinates.latitude, stop.coordinates.longitude])
    : [];

  return (
    <div className={`relative ${className}`} style={{ height: '100%', minHeight: '400px' }}>
      <MapContainer
        center={center}
        zoom={zoom}
        className="w-full h-full"
        zoomControl={true}
        whenReady={() => {
          // Add delay to ensure DOM is fully ready
          setTimeout(() => {
            setMapReady(true);
          }, 200);
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController route={selectedRoute} />

        {/* Route polyline */}
        {selectedRoute && routeCoordinates.length > 1 && (
          <Polyline
            positions={routeCoordinates}
            color={selectedRoute.color}
            weight={4}
            opacity={0.7}
          />
        )}

        {/* Bus stop markers */}
        {selectedRoute?.stops.map((stop) => (
          <Marker
            key={stop.stopId}
            position={[stop.coordinates.latitude, stop.coordinates.longitude]}
            icon={busStopIcon}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold text-sm">{stop.name}</h3>
                <p className="text-xs text-gray-600">Stop #{stop.order}</p>
                <p className="text-xs text-gray-600">
                  ETA: {stop.estimatedTime} min from start
                </p>
                {stop.facilities && stop.facilities.length > 0 && (
                  <div className="mt-1">
                    <p className="text-xs font-medium">Facilities:</p>
                    <p className="text-xs text-gray-600">
                      {stop.facilities.join(', ')}
                    </p>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Bus markers */}
        {mapReady && Array.from(busPositions.values()).map((bus: Bus) => {
          try {
            return (
              <Marker
                key={bus._id}
                position={[bus.currentLocation.latitude, bus.currentLocation.longitude]}
                icon={createBusIcon(bus.occupancy.status, selectedBus === bus._id)}
                eventHandlers={{
                  click: () => handleBusMarkerClick(bus),
                }}
              >
                <Popup>
              <div className="p-3 min-w-[200px]">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-lg">{bus.busNumber}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    bus.status === 'Active' 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {bus.status}
                  </span>
                </div>

                {typeof bus.routeId === 'object' && (
                  <p className="text-sm text-gray-600 mb-2">
                    Route: {bus.routeId.routeName} ({bus.routeId.routeNumber})
                  </p>
                )}

                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-medium">Occupancy</p>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            bus.occupancy.status === 'Available'
                              ? 'bg-green-500'
                              : bus.occupancy.status === 'Nearly Full'
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{
                            width: `${bus.occupancyPercentage || 0}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-600">
                        {bus.occupancyPercentage || 0}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {bus.occupancy.occupiedSeats}/{bus.occupancy.totalSeats} seats
                      ({bus.availableSeats || 0} available)
                    </p>
                  </div>

                  {bus.speed !== undefined && (
                    <div>
                      <p className="text-sm font-medium">Speed</p>
                      <p className="text-sm text-gray-600">{bus.speed} km/h</p>
                    </div>
                  )}

                  {bus.driver && (
                    <div>
                      <p className="text-sm font-medium">Driver</p>
                      <p className="text-sm text-gray-600">{bus.driver.name}</p>
                      {bus.driver.phoneNumber && (
                        <p className="text-xs text-gray-500">{bus.driver.phoneNumber}</p>
                      )}
                    </div>
                  )}

                  <div>
                    <p className="text-xs text-gray-500">
                      Last updated: {new Date(bus.currentLocation.lastUpdated || Date.now()).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
                </Popup>
              </Marker>
            );
          } catch (error) {
            console.warn('Error rendering bus marker:', error);
            return null;
          }
        })}
      </MapContainer>

      {/* Map legend */}
      <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-3 z-[1000]">
        <h4 className="text-sm font-semibold mb-2">Legend</h4>
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
            <span className="text-xs">Available</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-500 rounded-full border-2 border-white"></div>
            <span className="text-xs">Nearly Full</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white"></div>
            <span className="text-xs">Overcrowded</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white"></div>
            <span className="text-xs">Bus Stop</span>
          </div>
        </div>
      </div>
    </div>
  );
};
