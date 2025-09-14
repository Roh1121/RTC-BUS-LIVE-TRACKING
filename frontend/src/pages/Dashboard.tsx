import React, { useState, useEffect } from 'react';
import { BusTrackingMap } from '../components/Map/BusTrackingMap';
import { RouteSelector } from '../components/RouteSelector/RouteSelector';
import { BusInfoPanel } from '../components/BusInfo/BusInfoPanel';
import { Bus, Route, ServiceAlert } from '../types';
import apiService from '../services/api';
import { useSocket } from '../hooks/useSocket';

export const Dashboard: React.FC = () => {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [, setSelectedBus] = useState<Bus | null>(null);
  const [loading, setLoading] = useState(false);
  const [alerts, setAlerts] = useState<ServiceAlert[]>([]);
  const [showAlerts, setShowAlerts] = useState(false);

  // Socket event handlers
  const handleServiceAlert = (alert: ServiceAlert) => {
    setAlerts(prev => [alert, ...prev.slice(0, 4)]); // Keep only 5 latest alerts
    setShowAlerts(true);
    
    // Auto-hide alert after 5 seconds for info alerts
    if (alert.severity === 'info') {
      setTimeout(() => {
        setAlerts(prev => prev.filter(a => a.id !== alert.id));
      }, 5000);
    }
  };

  useSocket({
    onServiceAlert: handleServiceAlert,
  });

  useEffect(() => {
    loadBuses();
  }, [selectedRoute]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadBuses = async () => {
    try {
      setLoading(true);
      let response;
      
      if (selectedRoute) {
        response = await apiService.getBusesByRoute(selectedRoute._id);
      } else {
        response = await apiService.getBuses({ status: 'Active', limit: 50 });
      }
      
      if (response.success && response.data) {
        setBuses(response.data);
      }
    } catch (error) {
      console.error('Failed to load buses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRouteSelect = (route: Route | null) => {
    setSelectedRoute(route);
    setSelectedBus(null);
  };

  const handleBusSelect = (bus: Bus) => {
    setSelectedBus(bus);
  };

  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return (
          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'success':
        return (
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <svg className="w-8 h-8 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
                  <path d="M3 4a1 1 0 00-1 1v1a1 1 0 001 1h1a1 1 0 001-1V5a1 1 0 00-1-1H3zM6 4a1 1 0 000 2v5H4a1 1 0 100 2h11a1 1 0 100-2h-5V6a1 1 0 10-2 0v5H6V4z"/>
                </svg>
                <h1 className="text-xl font-bold text-gray-900">RTC Bus Tracking</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {alerts.length > 0 && (
                <button
                  onClick={() => setShowAlerts(!showAlerts)}
                  className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM11 19H6.5A2.5 2.5 0 014 16.5v-9A2.5 2.5 0 016.5 5h11A2.5 2.5 0 0120 7.5v3.5" />
                  </svg>
                  {alerts.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {alerts.length}
                    </span>
                  )}
                </button>
              )}
              
              <div className="text-sm text-gray-600">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Service Alerts */}
      {showAlerts && alerts.length > 0 && (
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="space-y-2">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-start space-x-3 p-3 rounded-lg ${
                    alert.severity === 'error' ? 'bg-red-50 border border-red-200' :
                    alert.severity === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
                    alert.severity === 'success' ? 'bg-green-50 border border-green-200' :
                    'bg-blue-50 border border-blue-200'
                  }`}
                >
                  {getAlertIcon(alert.severity)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {alert.message}
                    </p>
                    <div className="flex items-center space-x-2 mt-1 text-xs text-gray-500">
                      <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                      {alert.sender && <span>• {alert.sender}</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => dismissAlert(alert.id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Route Selector */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Route</h2>
              <RouteSelector
                selectedRoute={selectedRoute || undefined}
                onRouteSelect={handleRouteSelect}
              />
            </div>

            {/* Bus Information Panel */}
            <BusInfoPanel
              buses={buses}
              selectedRoute={selectedRoute || undefined}
              onBusSelect={handleBusSelect}
              className="lg:max-h-[calc(100vh-300px)]"
            />
          </div>

          {/* Map */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="h-[600px] lg:h-[calc(100vh-200px)]">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <svg className="animate-spin h-8 w-8 text-primary-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      <p className="text-gray-600">Loading buses...</p>
                    </div>
                  </div>
                ) : (
                  <BusTrackingMap
                    buses={buses}
                    selectedRoute={selectedRoute || undefined}
                    onBusClick={handleBusSelect}
                    className="h-full"
                  />
                )}
              </div>
            </div>

            {/* Route Information */}
            {selectedRoute && (
              <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <span
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: selectedRoute.color }}
                      />
                      <h3 className="text-xl font-semibold text-gray-900">
                        {selectedRoute.routeName}
                      </h3>
                      <span className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm font-medium">
                        {selectedRoute.routeNumber}
                      </span>
                    </div>
                    {selectedRoute.description && (
                      <p className="text-gray-600 mb-4">{selectedRoute.description}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">{selectedRoute.stops.length}</p>
                    <p className="text-sm text-gray-600">Stops</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">{selectedRoute.totalDistance}</p>
                    <p className="text-sm text-gray-600">km</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">{selectedRoute.estimatedDuration}</p>
                    <p className="text-sm text-gray-600">min</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">₹{selectedRoute.fare.adult}</p>
                    <p className="text-sm text-gray-600">Fare</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                  <span>Operating: {selectedRoute.operatingHours.start} - {selectedRoute.operatingHours.end}</span>
                  <span>Frequency: Every {selectedRoute.frequency} minutes</span>
                  <span>Type: {selectedRoute.routeType}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
