const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/config');

// Socket authentication middleware
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (token) {
      const decoded = jwt.verify(token, config.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (user && user.isActive) {
        socket.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Allow connection even if authentication fails (for public access)
    next();
  }
};

// Socket.io connection handler
const handleConnection = (io) => {
  // Use authentication middleware
  io.use(authenticateSocket);
  
  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}${socket.user ? ` (User: ${socket.user.name})` : ' (Anonymous)'}`);
    
    // Join user to their personal room if authenticated
    if (socket.user) {
      socket.join(`user_${socket.user._id}`);
    }
    
    // Handle route subscription
    socket.on('subscribe-route', (routeId) => {
      if (routeId) {
        socket.join(`route_${routeId}`);
        console.log(`Client ${socket.id} subscribed to route ${routeId}`);
        
        socket.emit('subscription-confirmed', {
          type: 'route',
          id: routeId,
          message: `Subscribed to route ${routeId} updates`
        });
      }
    });
    
    // Handle route unsubscription
    socket.on('unsubscribe-route', (routeId) => {
      if (routeId) {
        socket.leave(`route_${routeId}`);
        console.log(`Client ${socket.id} unsubscribed from route ${routeId}`);
        
        socket.emit('subscription-confirmed', {
          type: 'route',
          id: routeId,
          message: `Unsubscribed from route ${routeId} updates`
        });
      }
    });
    
    // Handle bus subscription
    socket.on('subscribe-bus', (busId) => {
      if (busId) {
        socket.join(`bus_${busId}`);
        console.log(`Client ${socket.id} subscribed to bus ${busId}`);
        
        socket.emit('subscription-confirmed', {
          type: 'bus',
          id: busId,
          message: `Subscribed to bus ${busId} updates`
        });
      }
    });
    
    // Handle bus unsubscription
    socket.on('unsubscribe-bus', (busId) => {
      if (busId) {
        socket.leave(`bus_${busId}`);
        console.log(`Client ${socket.id} unsubscribed from bus ${busId}`);
        
        socket.emit('subscription-confirmed', {
          type: 'bus',
          id: busId,
          message: `Unsubscribed from bus ${busId} updates`
        });
      }
    });
    
    // Handle area subscription for nearby buses
    socket.on('subscribe-area', (data) => {
      const { latitude, longitude, radius } = data;
      if (latitude && longitude) {
        const areaId = `area_${latitude}_${longitude}_${radius || 5000}`;
        socket.join(areaId);
        console.log(`Client ${socket.id} subscribed to area ${areaId}`);
        
        socket.emit('subscription-confirmed', {
          type: 'area',
          id: areaId,
          message: `Subscribed to area updates`
        });
      }
    });
    
    // Handle location sharing (for drivers)
    socket.on('share-location', async (data) => {
      if (socket.user && ['driver', 'admin', 'operator'].includes(socket.user.role)) {
        const { busId, latitude, longitude, speed, direction } = data;
        
        // Emit location update to all subscribers
        io.emit('bus-location-updated', {
          busId,
          location: { latitude, longitude },
          speed,
          direction,
          timestamp: new Date()
        });
        
        // Emit to specific route subscribers
        // Note: In a real implementation, you'd get the routeId from the bus
        socket.to(`bus_${busId}`).emit('bus-location-updated', {
          busId,
          location: { latitude, longitude },
          speed,
          direction,
          timestamp: new Date()
        });
      }
    });
    
    // Handle occupancy updates (for drivers/conductors)
    socket.on('update-occupancy', async (data) => {
      if (socket.user && ['driver', 'admin', 'operator'].includes(socket.user.role)) {
        const { busId, occupiedSeats, totalSeats } = data;
        
        const occupancyPercentage = Math.round((occupiedSeats / totalSeats) * 100);
        let status = 'Available';
        if (occupancyPercentage >= 90) status = 'Overcrowded';
        else if (occupancyPercentage >= 70) status = 'Nearly Full';
        
        // Emit occupancy update
        io.emit('bus-occupancy-updated', {
          busId,
          occupancy: {
            totalSeats,
            occupiedSeats,
            status
          },
          occupancyPercentage,
          availableSeats: totalSeats - occupiedSeats,
          timestamp: new Date()
        });
      }
    });
    
    // Handle service alerts
    socket.on('send-alert', async (data) => {
      if (socket.user && ['admin', 'operator'].includes(socket.user.role)) {
        const { type, message, routeId, busId, severity } = data;
        
        const alert = {
          id: Date.now().toString(),
          type,
          message,
          severity: severity || 'info',
          timestamp: new Date(),
          sender: socket.user.name
        };
        
        // Broadcast alert based on type
        if (routeId) {
          io.to(`route_${routeId}`).emit('service-alert', { ...alert, routeId });
        } else if (busId) {
          io.to(`bus_${busId}`).emit('service-alert', { ...alert, busId });
        } else {
          // General alert to all connected clients
          io.emit('service-alert', alert);
        }
      }
    });
    
    // Handle ping/pong for connection health
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date() });
    });
    
    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`Client disconnected: ${socket.id} (Reason: ${reason})`);
    });
    
    // Handle connection errors
    socket.on('error', (error) => {
      console.error(`Socket error for client ${socket.id}:`, error);
    });
  });
};

// Helper functions to emit events from other parts of the application
const emitBusLocationUpdate = (io, busData) => {
  io.emit('bus-location-updated', busData);
  io.to(`route_${busData.routeId}`).emit('bus-location-updated', busData);
  io.to(`bus_${busData.busId}`).emit('bus-location-updated', busData);
};

const emitBusOccupancyUpdate = (io, occupancyData) => {
  io.emit('bus-occupancy-updated', occupancyData);
  io.to(`bus_${occupancyData.busId}`).emit('bus-occupancy-updated', occupancyData);
};

const emitBusStatusChange = (io, statusData) => {
  io.emit('bus-status-changed', statusData);
  io.to(`bus_${statusData.busId}`).emit('bus-status-changed', statusData);
};

const emitServiceAlert = (io, alertData) => {
  if (alertData.routeId) {
    io.to(`route_${alertData.routeId}`).emit('service-alert', alertData);
  } else if (alertData.busId) {
    io.to(`bus_${alertData.busId}`).emit('service-alert', alertData);
  } else {
    io.emit('service-alert', alertData);
  }
};

module.exports = {
  handleConnection,
  emitBusLocationUpdate,
  emitBusOccupancyUpdate,
  emitBusStatusChange,
  emitServiceAlert
};
