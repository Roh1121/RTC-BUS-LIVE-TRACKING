import React from 'react';
import { Bus, Route } from '../../types';

interface BusInfoPanelProps {
  buses: Bus[];
  selectedRoute?: Route;
  onBusSelect?: (bus: Bus) => void;
  className?: string;
}

export const BusInfoPanel: React.FC<BusInfoPanelProps> = ({
  buses,
  selectedRoute,
  onBusSelect,
  className = '',
}) => {
  const getOccupancyColor = (status: string) => {
    switch (status) {
      case 'Available':
        return 'text-green-600 bg-green-100';
      case 'Nearly Full':
        return 'text-yellow-600 bg-yellow-100';
      case 'Overcrowded':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'text-green-600 bg-green-100';
      case 'Inactive':
        return 'text-gray-600 bg-gray-100';
      case 'Maintenance':
        return 'text-yellow-600 bg-yellow-100';
      case 'Out of Service':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatLastUpdated = (date?: Date) => {
    if (!date) return 'Unknown';
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          {selectedRoute 
            ? `Buses on ${selectedRoute.routeNumber}` 
            : 'All Buses'
          }
        </h2>
        <p className="text-sm text-gray-600">
          {buses.length} bus{buses.length !== 1 ? 'es' : ''} found
        </p>
      </div>

      <div className="max-h-96 overflow-y-auto custom-scrollbar">
        {buses.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p>No buses available</p>
            {selectedRoute && (
              <p className="text-sm mt-1">
                Try selecting a different route or check back later
              </p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {buses.map((bus) => (
              <div
                key={bus._id}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onBusSelect?.(bus)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {bus.busNumber}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(bus.status)}`}>
                        {bus.status}
                      </span>
                    </div>

                    {typeof bus.routeId === 'object' && (
                      <p className="text-sm text-gray-600 mb-2">
                        {bus.routeId.routeName} ({bus.routeId.routeNumber})
                      </p>
                    )}

                    <div className="space-y-2">
                      {/* Occupancy Information */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">
                            Occupancy
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOccupancyColor(bus.occupancy.status)}`}>
                            {bus.occupancy.status}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${
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
                          <span className="text-sm text-gray-600 min-w-[3rem]">
                            {bus.occupancyPercentage || 0}%
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {bus.occupancy.occupiedSeats}/{bus.occupancy.totalSeats} seats
                          ({bus.availableSeats || 0} available)
                        </p>
                      </div>

                      {/* Speed and Direction */}
                      {(bus.speed !== undefined || bus.direction !== undefined) && (
                        <div className="flex items-center space-x-4 text-sm">
                          {bus.speed !== undefined && (
                            <div className="flex items-center space-x-1">
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              <span className="text-gray-600">{bus.speed} km/h</span>
                            </div>
                          )}
                          {bus.direction !== undefined && (
                            <div className="flex items-center space-x-1">
                              <svg 
                                className="w-4 h-4 text-gray-400" 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                                style={{ transform: `rotate(${bus.direction}deg)` }}
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                              </svg>
                              <span className="text-gray-600">{bus.direction}°</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Driver Information */}
                      {bus.driver && bus.driver.name && (
                        <div className="text-sm">
                          <span className="text-gray-600">Driver: </span>
                          <span className="font-medium">{bus.driver.name}</span>
                          {bus.driver.phoneNumber && (
                            <span className="text-gray-500 ml-2">
                              {bus.driver.phoneNumber}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Last Updated */}
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>
                          Location: {formatLastUpdated(bus.currentLocation.lastUpdated)}
                        </span>
                        <span>
                          Occupancy: {formatLastUpdated(bus.occupancy.lastUpdated)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onBusSelect?.(bus);
                    }}
                    className="ml-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="View on map"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary Footer */}
      {buses.length > 0 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm font-medium text-green-600">
                {buses.filter(b => b.occupancy.status === 'Available').length}
              </p>
              <p className="text-xs text-gray-600">Available</p>
            </div>
            <div>
              <p className="text-sm font-medium text-yellow-600">
                {buses.filter(b => b.occupancy.status === 'Nearly Full').length}
              </p>
              <p className="text-xs text-gray-600">Nearly Full</p>
            </div>
            <div>
              <p className="text-sm font-medium text-red-600">
                {buses.filter(b => b.occupancy.status === 'Overcrowded').length}
              </p>
              <p className="text-xs text-gray-600">Overcrowded</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
