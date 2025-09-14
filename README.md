# RTC Bus Tracking System

A complete MERN stack application for real-time bus tracking with live location updates, occupancy status, and route information.

## Features

- 🚌 **Live Bus Tracking**: Real-time location updates on interactive maps
- 👥 **Occupancy Status**: Live seat availability and overcrowding alerts
- 🗺️ **Route Details**: Complete route information with stops and timings
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile
- ⚡ **Real-time Updates**: WebSocket-based live data streaming

## Tech Stack

### Frontend
- React.js with Hooks
- Leaflet.js for interactive maps
- Socket.io-client for real-time updates
- Tailwind CSS for styling
- Axios for API calls

### Backend
- Node.js with Express.js
- MongoDB with Mongoose ODM
- Socket.io for WebSocket connections
- JWT authentication (optional)
- CORS and security middlewares

## Project Structure

```
rtc-bus-tracking/
├── backend/
│   ├── config/
│   │   ├── database.js
│   │   └── config.js
│   ├── controllers/
│   │   ├── busController.js
│   │   └── routeController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── validation.js
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── Bus.js
│   │   ├── Route.js
│   │   └── User.js
│   ├── routes/
│   │   ├── buses.js
│   │   ├── routes.js
│   │   └── auth.js
│   ├── scripts/
│   │   ├── populateData.js
│   │   └── simulateRealTime.js
│   ├── socket/
│   │   └── socketHandler.js
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── utils/
│   │   └── App.js
│   ├── package.json
│   └── tailwind.config.js
└── README.md
```

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Configure your environment variables
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

### Populate Sample Data
```bash
cd backend
npm run populate-data
```

### Simulate Real-time Updates
```bash
cd backend
npm run simulate
```

## Environment Variables

Create a `.env` file in the backend directory:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/rtc-bus-tracking
JWT_SECRET=your-jwt-secret-key
CORS_ORIGIN=http://localhost:3000
```

## API Endpoints

### Buses
- `GET /api/buses` - Get all buses
- `GET /api/buses/:id` - Get specific bus
- `POST /api/buses/update-location` - Update bus location
- `GET /api/buses/route/:routeId` - Get buses by route

### Routes
- `GET /api/routes` - Get all routes
- `GET /api/routes/:id` - Get specific route
- `POST /api/routes` - Create new route (admin)

### Real-time Events
- `bus-location-updated` - Bus location changed
- `bus-occupancy-updated` - Occupancy status changed
- `bus-status-changed` - Bus operational status changed

## Data Flow

1. **Bus Location Updates**: GPS devices send location data to backend API
2. **WebSocket Broadcasting**: Server broadcasts updates to connected clients
3. **Frontend Updates**: React components receive real-time updates via Socket.io
4. **Map Rendering**: Leaflet.js updates bus markers on the map
5. **Occupancy Tracking**: Sensors/manual updates track passenger count

## Deployment

### Frontend (Vercel)
```bash
cd frontend
npm run build
# Deploy to Vercel
```

### Backend (Render/Heroku)
```bash
# Configure environment variables on platform
# Deploy backend with MongoDB Atlas connection
```

## Development Simulation

The system includes scripts to simulate real-time bus movements and occupancy changes for development and testing purposes.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details
