const mongoose = require('mongoose');
const connectDB = require('../config/database');
const Route = require('../models/Route');
const Bus = require('../models/Bus');
const User = require('../models/User');

// Sample route data for Hyderabad
const sampleRoutes = [
  {
    routeName: 'Secunderabad to Mehdipatnam',
    routeNumber: '5K',
    description: 'Main corridor connecting Secunderabad Railway Station to Mehdipatnam via Abids and Koti',
    stops: [
      {
        stopId: 'SEC001',
        name: 'Secunderabad Railway Station',
        coordinates: { latitude: 17.4435, longitude: 78.5012 },
        order: 1,
        estimatedTime: 0,
        facilities: ['Shelter', 'Digital Display', 'Wheelchair Access', 'Restroom']
      },
      {
        stopId: 'PAR001',
        name: 'Paradise Circle',
        coordinates: { latitude: 17.4326, longitude: 78.4926 },
        order: 2,
        estimatedTime: 8,
        facilities: ['Shelter', 'Seating']
      },
      {
        stopId: 'ABI001',
        name: 'Abids GPO',
        coordinates: { latitude: 17.4011, longitude: 78.4744 },
        order: 3,
        estimatedTime: 18,
        facilities: ['Shelter', 'Digital Display', 'Seating']
      },
      {
        stopId: 'KOT001',
        name: 'Koti Womens College',
        coordinates: { latitude: 17.3894, longitude: 78.4747 },
        order: 4,
        estimatedTime: 25,
        facilities: ['Shelter', 'Seating']
      },
      {
        stopId: 'SUL001',
        name: 'Sultan Bazaar',
        coordinates: { latitude: 17.3789, longitude: 78.4772 },
        order: 5,
        estimatedTime: 32,
        facilities: ['Shelter']
      },
      {
        stopId: 'MEH001',
        name: 'Mehdipatnam Bus Station',
        coordinates: { latitude: 17.3969, longitude: 78.4361 },
        order: 6,
        estimatedTime: 45,
        facilities: ['Shelter', 'Digital Display', 'Wheelchair Access', 'Restroom', 'Parking']
      }
    ],
    totalDistance: 18.5,
    estimatedDuration: 45,
    operatingHours: { start: '05:30', end: '23:00' },
    frequency: 8,
    fare: { adult: 25, student: 12, senior: 12 },
    status: 'Active',
    routeType: 'City',
    color: '#e74c3c'
  },
  {
    routeName: 'Jubilee Hills to LB Nagar',
    routeNumber: '216',
    description: 'Cross-city route connecting western suburbs to southeastern areas',
    stops: [
      {
        stopId: 'JUB001',
        name: 'Jubilee Hills Check Post',
        coordinates: { latitude: 17.4239, longitude: 78.4138 },
        order: 1,
        estimatedTime: 0,
        facilities: ['Shelter', 'Seating']
      },
      {
        stopId: 'BAN001',
        name: 'Banjara Hills Road No. 1',
        coordinates: { latitude: 17.4126, longitude: 78.4398 },
        order: 2,
        estimatedTime: 12,
        facilities: ['Shelter', 'Digital Display']
      },
      {
        stopId: 'PUN001',
        name: 'Punjagutta Metro Station',
        coordinates: { latitude: 17.4239, longitude: 78.4482 },
        order: 3,
        estimatedTime: 20,
        facilities: ['Shelter', 'Digital Display', 'Wheelchair Access']
      },
      {
        stopId: 'AME001',
        name: 'Ameerpet Metro Station',
        coordinates: { latitude: 17.4374, longitude: 78.4482 },
        order: 4,
        estimatedTime: 28,
        facilities: ['Shelter', 'Digital Display', 'Wheelchair Access', 'Restroom']
      },
      {
        stopId: 'DIL001',
        name: 'Dilsukhnagar',
        coordinates: { latitude: 17.3681, longitude: 78.5242 },
        order: 5,
        estimatedTime: 50,
        facilities: ['Shelter', 'Seating']
      },
      {
        stopId: 'LBN001',
        name: 'LB Nagar Metro Station',
        coordinates: { latitude: 17.3497, longitude: 78.5503 },
        order: 6,
        estimatedTime: 65,
        facilities: ['Shelter', 'Digital Display', 'Wheelchair Access', 'Restroom', 'Parking']
      }
    ],
    totalDistance: 28.2,
    estimatedDuration: 65,
    operatingHours: { start: '06:00', end: '22:30' },
    frequency: 12,
    fare: { adult: 35, student: 18, senior: 18 },
    status: 'Active',
    routeType: 'Express',
    color: '#3498db'
  },
  {
    routeName: 'Hitech City Circular',
    routeNumber: 'HTC1',
    description: 'Circular route serving IT corridor and business districts',
    stops: [
      {
        stopId: 'HIT001',
        name: 'Hitech City Metro Station',
        coordinates: { latitude: 17.4483, longitude: 78.3915 },
        order: 1,
        estimatedTime: 0,
        facilities: ['Shelter', 'Digital Display', 'Wheelchair Access', 'Restroom']
      },
      {
        stopId: 'CYB001',
        name: 'Cyber Towers',
        coordinates: { latitude: 17.4504, longitude: 78.3808 },
        order: 2,
        estimatedTime: 5,
        facilities: ['Shelter', 'Digital Display']
      },
      {
        stopId: 'GAC001',
        name: 'Gachibowli Stadium',
        coordinates: { latitude: 17.4399, longitude: 78.3489 },
        order: 3,
        estimatedTime: 15,
        facilities: ['Shelter', 'Seating', 'Parking']
      },
      {
        stopId: 'CON001',
        name: 'Kondapur',
        coordinates: { latitude: 17.4615, longitude: 78.3659 },
        order: 4,
        estimatedTime: 25,
        facilities: ['Shelter', 'Digital Display']
      },
      {
        stopId: 'MAD001',
        name: 'Madhapur',
        coordinates: { latitude: 17.4482, longitude: 78.3915 },
        order: 5,
        estimatedTime: 35,
        facilities: ['Shelter', 'Seating']
      }
    ],
    totalDistance: 15.8,
    estimatedDuration: 40,
    operatingHours: { start: '06:30', end: '21:30' },
    frequency: 15,
    fare: { adult: 20, student: 10, senior: 10 },
    status: 'Active',
    routeType: 'Shuttle',
    color: '#2ecc71'
  },
  {
    routeName: 'Airport Express',
    routeNumber: 'AP1',
    description: 'Direct service to Rajiv Gandhi International Airport',
    stops: [
      {
        stopId: 'SEC002',
        name: 'Secunderabad Railway Station',
        coordinates: { latitude: 17.4435, longitude: 78.5012 },
        order: 1,
        estimatedTime: 0,
        facilities: ['Shelter', 'Digital Display', 'Wheelchair Access', 'Restroom']
      },
      {
        stopId: 'BEG001',
        name: 'Begumpet Airport',
        coordinates: { latitude: 17.4532, longitude: 78.4613 },
        order: 2,
        estimatedTime: 20,
        facilities: ['Shelter', 'Digital Display']
      },
      {
        stopId: 'SHA001',
        name: 'Shamshabad Toll Plaza',
        coordinates: { latitude: 17.2403, longitude: 78.4294 },
        order: 3,
        estimatedTime: 55,
        facilities: ['Shelter']
      },
      {
        stopId: 'AIR001',
        name: 'RGIA Terminal',
        coordinates: { latitude: 17.2313, longitude: 78.4298 },
        order: 4,
        estimatedTime: 75,
        facilities: ['Shelter', 'Digital Display', 'Wheelchair Access', 'Restroom', 'Parking']
      }
    ],
    totalDistance: 42.5,
    estimatedDuration: 75,
    operatingHours: { start: '04:00', end: '23:59' },
    frequency: 30,
    fare: { adult: 80, student: 40, senior: 40 },
    status: 'Active',
    routeType: 'Express',
    color: '#f39c12'
  }
];

// Sample bus data
const generateBusesForRoute = (routeId, routeStops, count = 3, routeIndex = 0) => {
  const buses = [];
  
  for (let i = 0; i < count; i++) {
    // Random position along the route
    const randomStop = routeStops[Math.floor(Math.random() * routeStops.length)];
    const latVariation = (Math.random() - 0.5) * 0.01; // Small variation around stop
    const lngVariation = (Math.random() - 0.5) * 0.01;
    
    const totalSeats = Math.floor(Math.random() * 20) + 30; // 30-50 seats
    const occupiedSeats = Math.floor(Math.random() * totalSeats);
    
    buses.push({
      busNumber: `TS07U${String.fromCharCode(65 + routeIndex)}${String.fromCharCode(65 + i)}${Math.floor(Math.random() * 900) + 100}`,
      routeId: routeId,
      currentLocation: {
        latitude: randomStop.coordinates.latitude + latVariation,
        longitude: randomStop.coordinates.longitude + lngVariation,
        lastUpdated: new Date(Date.now() - Math.random() * 300000) // Within last 5 minutes
      },
      occupancy: {
        totalSeats: totalSeats,
        occupiedSeats: occupiedSeats,
        lastUpdated: new Date(Date.now() - Math.random() * 600000) // Within last 10 minutes
      },
      status: Math.random() > 0.1 ? 'Active' : 'Inactive',
      driver: {
        name: ['Rajesh Kumar', 'Suresh Reddy', 'Venkat Rao', 'Mahesh Singh', 'Prakash Sharma'][Math.floor(Math.random() * 5)],
        phoneNumber: `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        licenseNumber: `AP${Math.floor(Math.random() * 900000) + 100000}`
      },
      speed: Math.floor(Math.random() * 40) + 10, // 10-50 km/h
      direction: Math.floor(Math.random() * 360), // 0-360 degrees
      nextStopId: routeStops[Math.floor(Math.random() * routeStops.length)].stopId
    });
  }
  
  return buses;
};

// Sample users
const sampleUsers = [
  {
    name: 'Admin User',
    email: 'admin@rtcbus.com',
    password: 'admin123',
    role: 'admin',
    phoneNumber: '+919876543210'
  },
  {
    name: 'Bus Operator',
    email: 'operator@rtcbus.com',
    password: 'operator123',
    role: 'operator',
    phoneNumber: '+919876543211'
  },
  {
    name: 'Driver One',
    email: 'driver1@rtcbus.com',
    password: 'driver123',
    role: 'driver',
    phoneNumber: '+919876543212'
  },
  {
    name: 'Regular User',
    email: 'user@example.com',
    password: 'user123',
    role: 'user',
    phoneNumber: '+919876543213',
    preferences: {
      notifications: {
        busArrival: true,
        routeUpdates: true,
        serviceAlerts: true
      },
      defaultLocation: {
        latitude: 17.4065,
        longitude: 78.4772,
        address: 'Abids, Hyderabad'
      }
    }
  }
];

async function populateData() {
  try {
    console.log('🔌 Connecting to database...');
    await connectDB();

    console.log('🗑️  Clearing existing data...');
    await Promise.all([
      Bus.deleteMany({}),
      Route.deleteMany({}),
      User.deleteMany({})
    ]);

    console.log('📍 Creating routes...');
    const createdRoutes = [];
    for (const routeData of sampleRoutes) {
      const route = await Route.create(routeData);
      createdRoutes.push(route);
      console.log(`   ✅ Created route: ${route.routeNumber} - ${route.routeName}`);
    }

    console.log('🚌 Creating buses...');
    let totalBuses = 0;
    for (let routeIndex = 0; routeIndex < createdRoutes.length; routeIndex++) {
      const route = createdRoutes[routeIndex];
      const busCount = Math.floor(Math.random() * 3) + 2; // 2-4 buses per route
      const buses = generateBusesForRoute(route._id, route.stops, busCount, routeIndex);
      
      for (const busData of buses) {
        const bus = await Bus.create(busData);
        console.log(`   ✅ Created bus: ${bus.busNumber} on route ${route.routeNumber}`);
        totalBuses++;
      }
    }

    console.log('👥 Creating users...');
    for (const userData of sampleUsers) {
      const user = await User.create(userData);
      console.log(`   ✅ Created user: ${user.name} (${user.role})`);
    }

    console.log('\n🎉 Data population completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   • Routes: ${createdRoutes.length}`);
    console.log(`   • Buses: ${totalBuses}`);
    console.log(`   • Users: ${sampleUsers.length}`);
    console.log(`   • Total stops: ${createdRoutes.reduce((sum, route) => sum + route.stops.length, 0)}`);

    console.log('\n🔐 Default login credentials:');
    console.log('   Admin: admin@rtcbus.com / admin123');
    console.log('   Operator: operator@rtcbus.com / operator123');
    console.log('   Driver: driver1@rtcbus.com / driver123');
    console.log('   User: user@example.com / user123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error populating data:', error);
    process.exit(1);
  }
}

// Run the population script
if (require.main === module) {
  populateData();
}

module.exports = { populateData };
