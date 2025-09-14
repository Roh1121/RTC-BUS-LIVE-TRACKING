require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const Bus = require('../models/Bus');
const Route = require('../models/Route');

class BusSimulator {
  constructor() {
    this.buses = [];
    this.routes = [];
    this.isRunning = false;
    this.intervals = [];
  }

  async initialize() {
    try {
      await connectDB();
      console.log('🔌 Connected to database');
      
      // Load all active buses and their routes
      this.buses = await Bus.find({ status: 'Active' }).populate('routeId');
      this.routes = await Route.find({ status: 'Active' });
      
      console.log(`📊 Loaded ${this.buses.length} buses and ${this.routes.length} routes`);
      
      if (this.buses.length === 0) {
        console.log('⚠️  No buses found. Please run the populate data script first.');
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Failed to initialize simulator:', error);
      process.exit(1);
    }
  }

  // Calculate next position along route
  calculateNextPosition(bus) {
    const route = bus.routeId;
    if (!route || !route.stops || route.stops.length < 2) {
      return bus.currentLocation;
    }

    // Find current closest stop
    let closestStopIndex = 0;
    let minDistance = Infinity;
    
    route.stops.forEach((stop, index) => {
      const distance = this.calculateDistance(
        bus.currentLocation.latitude,
        bus.currentLocation.longitude,
        stop.coordinates.latitude,
        stop.coordinates.longitude
      );
      if (distance < minDistance) {
        minDistance = distance;
        closestStopIndex = index;
      }
    });

    // Determine next stop (circular route)
    const nextStopIndex = (closestStopIndex + 1) % route.stops.length;
    const currentStop = route.stops[closestStopIndex];
    const nextStop = route.stops[nextStopIndex];

    // Calculate movement towards next stop
    const progress = Math.random() * 0.1; // Move 10% of the way each update
    const newLat = bus.currentLocation.latitude + 
      (nextStop.coordinates.latitude - bus.currentLocation.latitude) * progress;
    const newLng = bus.currentLocation.longitude + 
      (nextStop.coordinates.longitude - bus.currentLocation.longitude) * progress;

    // Add some random variation to simulate real movement
    const latVariation = (Math.random() - 0.5) * 0.001;
    const lngVariation = (Math.random() - 0.5) * 0.001;

    return {
      latitude: newLat + latVariation,
      longitude: newLng + lngVariation,
      lastUpdated: new Date()
    };
  }

  // Calculate distance between two coordinates (Haversine formula)
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Simulate occupancy changes
  simulateOccupancyChange(bus) {
    const currentOccupancy = bus.occupancy.occupiedSeats;
    const totalSeats = bus.occupancy.totalSeats;
    
    // Random change in occupancy (-5 to +8 passengers)
    const change = Math.floor(Math.random() * 14) - 5;
    let newOccupancy = Math.max(0, Math.min(totalSeats, currentOccupancy + change));
    
    // Bias towards realistic patterns
    const timeOfDay = new Date().getHours();
    
    // Rush hours (7-9 AM, 5-8 PM) - higher occupancy
    if ((timeOfDay >= 7 && timeOfDay <= 9) || (timeOfDay >= 17 && timeOfDay <= 20)) {
      newOccupancy = Math.min(totalSeats, newOccupancy + Math.floor(Math.random() * 5));
    }
    
    // Late night (10 PM - 5 AM) - lower occupancy
    if (timeOfDay >= 22 || timeOfDay <= 5) {
      newOccupancy = Math.max(0, Math.floor(newOccupancy * 0.3));
    }

    return {
      totalSeats: totalSeats,
      occupiedSeats: newOccupancy,
      lastUpdated: new Date()
    };
  }

  // Simulate speed changes
  simulateSpeedChange(currentSpeed) {
    // Random speed variation (-10 to +10 km/h)
    const variation = (Math.random() - 0.5) * 20;
    let newSpeed = Math.max(0, Math.min(60, currentSpeed + variation));
    
    // Realistic speed constraints
    const timeOfDay = new Date().getHours();
    
    // Rush hours - slower speeds
    if ((timeOfDay >= 7 && timeOfDay <= 9) || (timeOfDay >= 17 && timeOfDay <= 20)) {
      newSpeed = Math.min(25, newSpeed);
    }
    
    // Night time - moderate speeds
    if (timeOfDay >= 22 || timeOfDay <= 5) {
      newSpeed = Math.min(40, Math.max(15, newSpeed));
    }

    return Math.round(newSpeed);
  }

  // Update single bus
  async updateBus(bus) {
    try {
      // Calculate new position
      const newLocation = this.calculateNextPosition(bus);
      
      // Simulate occupancy change (20% chance)
      let newOccupancy = bus.occupancy;
      if (Math.random() < 0.2) {
        newOccupancy = this.simulateOccupancyChange(bus);
      }

      // Simulate speed change
      const newSpeed = this.simulateSpeedChange(bus.speed || 25);
      
      // Calculate direction (bearing to next position)
      const direction = this.calculateBearing(
        bus.currentLocation.latitude,
        bus.currentLocation.longitude,
        newLocation.latitude,
        newLocation.longitude
      );

      // Update bus in database
      await Bus.findByIdAndUpdate(bus._id, {
        currentLocation: newLocation,
        occupancy: newOccupancy,
        speed: newSpeed,
        direction: Math.round(direction)
      });

      // Update local bus object
      bus.currentLocation = newLocation;
      bus.occupancy = newOccupancy;
      bus.speed = newSpeed;
      bus.direction = Math.round(direction);

      console.log(`🚌 Updated ${bus.busNumber}: ${newLocation.latitude.toFixed(4)}, ${newLocation.longitude.toFixed(4)} | ${newSpeed} km/h | ${newOccupancy.occupiedSeats}/${newOccupancy.totalSeats} passengers`);

    } catch (error) {
      console.error(`❌ Error updating bus ${bus.busNumber}:`, error.message);
    }
  }

  // Calculate bearing between two points
  calculateBearing(lat1, lon1, lat2, lon2) {
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const lat1Rad = lat1 * Math.PI / 180;
    const lat2Rad = lat2 * Math.PI / 180;
    
    const y = Math.sin(dLon) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - 
              Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
    
    let bearing = Math.atan2(y, x) * 180 / Math.PI;
    return (bearing + 360) % 360;
  }

  // Start simulation
  start(updateInterval = 10000) { // Default 10 seconds
    if (this.isRunning) {
      console.log('⚠️  Simulation is already running');
      return;
    }

    this.isRunning = true;
    console.log(`🚀 Starting real-time simulation with ${updateInterval/1000}s intervals`);
    console.log('📍 Press Ctrl+C to stop simulation\n');

    // Update each bus at different intervals to simulate realistic patterns
    this.buses.forEach((bus, index) => {
      const busInterval = updateInterval + (Math.random() * 5000); // Stagger updates
      
      const interval = setInterval(() => {
        if (this.isRunning) {
          this.updateBus(bus);
        }
      }, busInterval);
      
      this.intervals.push(interval);
    });

    // Periodic status report
    const statusInterval = setInterval(() => {
      if (this.isRunning) {
        console.log(`\n📊 Status Report - ${new Date().toLocaleTimeString()}`);
        console.log(`   Active buses: ${this.buses.filter(b => b.status === 'Active').length}`);
        console.log(`   Average occupancy: ${Math.round(this.buses.reduce((sum, b) => sum + (b.occupancy.occupiedSeats / b.occupancy.totalSeats), 0) / this.buses.length * 100)}%`);
        console.log(`   Average speed: ${Math.round(this.buses.reduce((sum, b) => sum + (b.speed || 0), 0) / this.buses.length)} km/h\n`);
      }
    }, 60000); // Every minute

    this.intervals.push(statusInterval);
  }

  // Stop simulation
  stop() {
    if (!this.isRunning) {
      console.log('⚠️  Simulation is not running');
      return;
    }

    this.isRunning = false;
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];
    
    console.log('\n🛑 Simulation stopped');
  }

  // Simulate service alerts
  async simulateAlert() {
    const alertTypes = [
      { type: 'delay', message: 'Bus running 10 minutes late due to traffic', severity: 'warning' },
      { type: 'breakdown', message: 'Bus temporarily out of service - mechanical issue', severity: 'error' },
      { type: 'route_change', message: 'Route diverted due to road construction', severity: 'info' },
      { type: 'overcrowding', message: 'Bus is overcrowded - next bus in 5 minutes', severity: 'warning' },
      { type: 'service_update', message: 'Additional bus added to route due to high demand', severity: 'success' }
    ];

    const randomAlert = alertTypes[Math.floor(Math.random() * alertTypes.length)];
    const randomBus = this.buses[Math.floor(Math.random() * this.buses.length)];

    console.log(`🚨 Alert: ${randomAlert.message} (Bus: ${randomBus.busNumber})`);
    
    return {
      ...randomAlert,
      busId: randomBus._id,
      routeId: randomBus.routeId._id,
      timestamp: new Date()
    };
  }
}

// Main execution
async function main() {
  const simulator = new BusSimulator();
  
  try {
    await simulator.initialize();
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Received interrupt signal');
      simulator.stop();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('\n🛑 Received terminate signal');
      simulator.stop();
      process.exit(0);
    });

    // Start simulation
    const updateInterval = process.argv[2] ? parseInt(process.argv[2]) * 1000 : 10000;
    simulator.start(updateInterval);

    // Simulate random alerts every 2-5 minutes
    setInterval(() => {
      if (Math.random() < 0.3) { // 30% chance every interval
        simulator.simulateAlert();
      }
    }, 120000 + Math.random() * 180000); // 2-5 minutes

  } catch (error) {
    console.error('❌ Simulation failed:', error);
    process.exit(1);
  }
}

// Run simulation if called directly
if (require.main === module) {
  console.log('🚌 RTC Bus Real-Time Simulator');
  console.log('================================\n');
  main();
}

module.exports = { BusSimulator };
