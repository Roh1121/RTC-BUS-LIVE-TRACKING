import React, { useState, useEffect } from 'react';
import { Route } from '../../types';
import apiService from '../../services/api';

interface RouteSelectorProps {
  selectedRoute?: Route;
  onRouteSelect: (route: Route | null) => void;
  className?: string;
}

export const RouteSelector: React.FC<RouteSelectorProps> = ({
  selectedRoute,
  onRouteSelect,
  className = '',
}) => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadRoutes();
  }, []);

  const loadRoutes = async () => {
    try {
      setLoading(true);
      const response = await apiService.getRoutes({ status: 'Active' });
      if (response.success && response.data) {
        setRoutes(response.data);
      }
    } catch (error) {
      console.error('Failed to load routes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRoutes = routes.filter(route =>
    route.routeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    route.routeNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRouteSelect = (route: Route) => {
    onRouteSelect(route);
    setIsOpen(false);
    setSearchTerm('');
  };

  const clearSelection = () => {
    onRouteSelect(null);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-2 text-left bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <div className="flex items-center justify-between">
            <span className="block truncate">
              {selectedRoute 
                ? `${selectedRoute.routeNumber} - ${selectedRoute.routeName}`
                : 'Select a route'
              }
            </span>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${
                isOpen ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </button>

        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
            <div className="p-2 border-b border-gray-200">
              <input
                type="text"
                placeholder="Search routes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div className="max-h-60 overflow-y-auto custom-scrollbar">
              {selectedRoute && (
                <button
                  onClick={clearSelection}
                  className="w-full px-4 py-2 text-left text-sm text-gray-500 hover:bg-gray-50 border-b border-gray-100"
                >
                  Clear selection
                </button>
              )}

              {loading ? (
                <div className="px-4 py-3 text-sm text-gray-500">
                  Loading routes...
                </div>
              ) : filteredRoutes.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500">
                  {searchTerm ? 'No routes found' : 'No routes available'}
                </div>
              ) : (
                filteredRoutes.map((route) => (
                  <button
                    key={route._id}
                    onClick={() => handleRouteSelect(route)}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                      selectedRoute?._id === route._id ? 'bg-primary-50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: route.color }}
                          />
                          <span className="font-medium text-sm">
                            {route.routeNumber}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {route.routeName}
                        </p>
                        <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                          <span>{route.totalStops || route.stops.length} stops</span>
                          <span>{route.totalDistance} km</span>
                          <span>{route.routeType}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          ₹{route.fare.adult}
                        </div>
                        <div className="text-xs text-gray-500">
                          {route.frequency} min freq
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};
