const Route = require('../models/Route');
const Bus = require('../models/Bus');
const { AppError, asyncHandler } = require('../middleware/errorHandler');

// @desc    Get all routes
// @route   GET /api/routes
// @access  Public
exports.getAllRoutes = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, routeType } = req.query;
  
  // Build filter object
  const filter = {};
  if (status) filter.status = status;
  if (routeType) filter.routeType = routeType;

  const routes = await Route.find(filter)
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ routeNumber: 1 });

  const total = await Route.countDocuments(filter);

  res.status(200).json({
    success: true,
    count: routes.length,
    total,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    },
    data: routes
  });
});

// @desc    Get single route
// @route   GET /api/routes/:id
// @access  Public
exports.getRoute = asyncHandler(async (req, res, next) => {
  const route = await Route.findById(req.params.id);

  if (!route) {
    return next(new AppError('Route not found', 404));
  }

  // Get active buses on this route
  const buses = await Bus.find({ 
    routeId: req.params.id, 
    status: 'Active' 
  }).select('busNumber currentLocation occupancy speed direction');

  res.status(200).json({
    success: true,
    data: {
      route,
      activeBuses: buses,
      busCount: buses.length
    }
  });
});

// @desc    Create new route
// @route   POST /api/routes
// @access  Private (Admin)
exports.createRoute = asyncHandler(async (req, res, next) => {
  // Validate stops order
  const stops = req.body.stops;
  const orders = stops.map(stop => stop.order);
  const uniqueOrders = [...new Set(orders)];
  
  if (orders.length !== uniqueOrders.length) {
    return next(new AppError('Stop orders must be unique', 400));
  }

  // Validate stop IDs are unique
  const stopIds = stops.map(stop => stop.stopId);
  const uniqueStopIds = [...new Set(stopIds)];
  
  if (stopIds.length !== uniqueStopIds.length) {
    return next(new AppError('Stop IDs must be unique', 400));
  }

  const route = await Route.create(req.body);

  res.status(201).json({
    success: true,
    data: route
  });
});

// @desc    Update route
// @route   PUT /api/routes/:id
// @access  Private (Admin)
exports.updateRoute = asyncHandler(async (req, res, next) => {
  let route = await Route.findById(req.params.id);

  if (!route) {
    return next(new AppError('Route not found', 404));
  }

  // If updating stops, validate them
  if (req.body.stops) {
    const stops = req.body.stops;
    const orders = stops.map(stop => stop.order);
    const uniqueOrders = [...new Set(orders)];
    
    if (orders.length !== uniqueOrders.length) {
      return next(new AppError('Stop orders must be unique', 400));
    }

    const stopIds = stops.map(stop => stop.stopId);
    const uniqueStopIds = [...new Set(stopIds)];
    
    if (stopIds.length !== uniqueStopIds.length) {
      return next(new AppError('Stop IDs must be unique', 400));
    }
  }

  route = await Route.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: route
  });
});

// @desc    Delete route
// @route   DELETE /api/routes/:id
// @access  Private (Admin)
exports.deleteRoute = asyncHandler(async (req, res, next) => {
  const route = await Route.findById(req.params.id);

  if (!route) {
    return next(new AppError('Route not found', 404));
  }

  // Check if any buses are assigned to this route
  const busCount = await Bus.countDocuments({ routeId: req.params.id });
  if (busCount > 0) {
    return next(new AppError('Cannot delete route with assigned buses', 400));
  }

  await Route.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Route deleted successfully'
  });
});

// @desc    Get routes by area
// @route   GET /api/routes/nearby
// @access  Public
exports.getRoutesByArea = asyncHandler(async (req, res, next) => {
  const { latitude, longitude, radius = 5000 } = req.query;

  if (!latitude || !longitude) {
    return next(new AppError('Latitude and longitude are required', 400));
  }

  const routes = await Route.findByArea(
    parseFloat(latitude), 
    parseFloat(longitude), 
    parseInt(radius)
  );

  res.status(200).json({
    success: true,
    count: routes.length,
    data: routes
  });
});

// @desc    Get route stops
// @route   GET /api/routes/:id/stops
// @access  Public
exports.getRouteStops = asyncHandler(async (req, res, next) => {
  const route = await Route.findById(req.params.id).select('stops routeName routeNumber');

  if (!route) {
    return next(new AppError('Route not found', 404));
  }

  res.status(200).json({
    success: true,
    data: {
      routeId: route._id,
      routeName: route.routeName,
      routeNumber: route.routeNumber,
      stops: route.stops,
      totalStops: route.stops.length
    }
  });
});

// @desc    Get estimated arrival times for route
// @route   GET /api/routes/:id/arrivals
// @access  Public
exports.getRouteArrivals = asyncHandler(async (req, res, next) => {
  const route = await Route.findById(req.params.id);

  if (!route) {
    return next(new AppError('Route not found', 404));
  }

  // Get all active buses on this route
  const buses = await Bus.find({ 
    routeId: req.params.id, 
    status: 'Active' 
  }).select('busNumber currentLocation speed nextStopId estimatedArrival');

  // Calculate estimated arrivals for each stop
  const arrivals = route.stops.map(stop => {
    const busArrivals = buses.map(bus => {
      // Simple estimation based on distance and average speed
      // In a real system, this would use more sophisticated algorithms
      const avgSpeed = 30; // km/h average city speed
      const distance = calculateDistance(
        bus.currentLocation.latitude,
        bus.currentLocation.longitude,
        stop.coordinates.latitude,
        stop.coordinates.longitude
      );
      
      const estimatedMinutes = (distance / avgSpeed) * 60;
      const estimatedTime = new Date(Date.now() + estimatedMinutes * 60000);

      return {
        busNumber: bus.busNumber,
        estimatedArrival: estimatedTime,
        distance: Math.round(distance * 100) / 100 // Round to 2 decimal places
      };
    });

    return {
      stopId: stop.stopId,
      stopName: stop.name,
      coordinates: stop.coordinates,
      buses: busArrivals.sort((a, b) => a.estimatedArrival - b.estimatedArrival)
    };
  });

  res.status(200).json({
    success: true,
    data: {
      routeId: route._id,
      routeName: route.routeName,
      routeNumber: route.routeNumber,
      arrivals
    }
  });
});

// @desc    Search routes by name or number
// @route   GET /api/routes/search
// @access  Public
exports.searchRoutes = asyncHandler(async (req, res, next) => {
  const { q, limit = 10 } = req.query;

  if (!q) {
    return next(new AppError('Search query is required', 400));
  }

  const routes = await Route.find({
    $or: [
      { routeName: { $regex: q, $options: 'i' } },
      { routeNumber: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } }
    ],
    status: 'Active'
  }).limit(parseInt(limit));

  res.status(200).json({
    success: true,
    count: routes.length,
    data: routes
  });
});

// Helper function to calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
}
