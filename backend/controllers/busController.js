const Bus = require('../models/Bus');
const Route = require('../models/Route');
const { AppError, asyncHandler } = require('../middleware/errorHandler');

// @desc    Get all buses
// @route   GET /api/buses
// @access  Public
exports.getAllBuses = asyncHandler(async (req, res) => {
  try {
    console.log('🚌 getAllBuses called with query:', req.query);
    
    const { page = 1, limit = 10, status, routeId } = req.query;
    
    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (routeId) filter.routeId = routeId;

    console.log('🔍 Filter object:', filter);

    const buses = await Bus.find(filter)
      .populate('routeId', 'routeName routeNumber color')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    console.log('📊 Found buses count:', buses.length);

    const total = await Bus.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: buses.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      },
      data: buses
    });
  } catch (error) {
    console.error('❌ Error in getAllBuses:', error);
    throw error;
  }
});

// @desc    Get single bus
// @route   GET /api/buses/:id
// @access  Public
exports.getBus = asyncHandler(async (req, res, next) => {
  const bus = await Bus.findById(req.params.id).populate('routeId');

  if (!bus) {
    return next(new AppError('Bus not found', 404));
  }

  res.status(200).json({
    success: true,
    data: bus
  });
});

// @desc    Create new bus
// @route   POST /api/buses
// @access  Private (Admin/Operator)
exports.createBus = asyncHandler(async (req, res, next) => {
  // Verify route exists
  const route = await Route.findById(req.body.routeId);
  if (!route) {
    return next(new AppError('Route not found', 404));
  }

  const bus = await Bus.create(req.body);
  await bus.populate('routeId', 'routeName routeNumber color');

  // Emit socket event for new bus
  req.app.get('io').emit('bus-created', bus);

  res.status(201).json({
    success: true,
    data: bus
  });
});

// @desc    Update bus location and occupancy
// @route   POST /api/buses/update-location
// @access  Public (for GPS devices/drivers)
exports.updateBusLocation = asyncHandler(async (req, res, next) => {
  const { busId, latitude, longitude, speed, direction, occupiedSeats } = req.body;

  const bus = await Bus.findById(busId);
  if (!bus) {
    return next(new AppError('Bus not found', 404));
  }

  // Update location
  bus.currentLocation.latitude = latitude;
  bus.currentLocation.longitude = longitude;
  bus.currentLocation.lastUpdated = new Date();

  // Update optional fields
  if (speed !== undefined) bus.speed = speed;
  if (direction !== undefined) bus.direction = direction;
  if (occupiedSeats !== undefined) {
    bus.occupancy.occupiedSeats = occupiedSeats;
    bus.occupancy.lastUpdated = new Date();
  }

  await bus.save();
  await bus.populate('routeId', 'routeName routeNumber color');

  // Emit socket events for real-time updates
  const io = req.app.get('io');
  io.emit('bus-location-updated', {
    busId: bus._id,
    busNumber: bus.busNumber,
    routeId: bus.routeId._id,
    location: bus.currentLocation,
    speed: bus.speed,
    direction: bus.direction
  });

  if (occupiedSeats !== undefined) {
    io.emit('bus-occupancy-updated', {
      busId: bus._id,
      busNumber: bus.busNumber,
      occupancy: bus.occupancy,
      occupancyPercentage: bus.occupancyPercentage,
      availableSeats: bus.availableSeats
    });
  }

  res.status(200).json({
    success: true,
    message: 'Bus location updated successfully',
    data: {
      busId: bus._id,
      location: bus.currentLocation,
      occupancy: bus.occupancy
    }
  });
});

// @desc    Update bus details
// @route   PUT /api/buses/:id
// @access  Private (Admin/Operator)
exports.updateBus = asyncHandler(async (req, res, next) => {
  let bus = await Bus.findById(req.params.id);

  if (!bus) {
    return next(new AppError('Bus not found', 404));
  }

  // If routeId is being updated, verify new route exists
  if (req.body.routeId && req.body.routeId !== bus.routeId.toString()) {
    const route = await Route.findById(req.body.routeId);
    if (!route) {
      return next(new AppError('Route not found', 404));
    }
  }

  bus = await Bus.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  }).populate('routeId', 'routeName routeNumber color');

  // Emit socket event for bus update
  req.app.get('io').emit('bus-updated', bus);

  res.status(200).json({
    success: true,
    data: bus
  });
});

// @desc    Delete bus
// @route   DELETE /api/buses/:id
// @access  Private (Admin)
exports.deleteBus = asyncHandler(async (req, res, next) => {
  const bus = await Bus.findById(req.params.id);

  if (!bus) {
    return next(new AppError('Bus not found', 404));
  }

  await Bus.findByIdAndDelete(req.params.id);

  // Emit socket event for bus deletion
  req.app.get('io').emit('bus-deleted', { busId: req.params.id });

  res.status(200).json({
    success: true,
    message: 'Bus deleted successfully'
  });
});

// @desc    Get buses by route
// @route   GET /api/buses/route/:routeId
// @access  Public
exports.getBusesByRoute = asyncHandler(async (req, res, next) => {
  try {
    console.log('🚌 getBusesByRoute called with routeId:', req.params.routeId);
    
    const route = await Route.findById(req.params.routeId);
    if (!route) {
      return next(new AppError('Route not found', 404));
    }

    const buses = await Bus.find({ 
      routeId: req.params.routeId,
      status: 'Active'
    }).populate('routeId', 'routeName routeNumber color');

    console.log('📊 Found buses for route:', buses.length);

    res.status(200).json({
      success: true,
      count: buses.length,
      data: buses
    });
  } catch (error) {
    console.error('❌ Error in getBusesByRoute:', error);
    throw error;
  }
});

// @desc    Get nearby buses
// @route   GET /api/buses/nearby
// @access  Public
exports.getNearbyBuses = asyncHandler(async (req, res, next) => {
  const { latitude, longitude, radius = 5000 } = req.query;

  if (!latitude || !longitude) {
    return next(new AppError('Latitude and longitude are required', 400));
  }

  const buses = await Bus.findNearby(
    parseFloat(latitude), 
    parseFloat(longitude), 
    parseInt(radius)
  ).populate('routeId', 'routeName routeNumber color');

  res.status(200).json({
    success: true,
    count: buses.length,
    data: buses
  });
});

// @desc    Update bus status
// @route   PATCH /api/buses/:id/status
// @access  Private (Admin/Driver)
exports.updateBusStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;
  
  if (!['Active', 'Inactive', 'Maintenance', 'Out of Service'].includes(status)) {
    return next(new AppError('Invalid status value', 400));
  }

  const bus = await Bus.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true }
  ).populate('routeId', 'routeName routeNumber color');

  if (!bus) {
    return next(new AppError('Bus not found', 404));
  }

  // Emit socket event for status change
  req.app.get('io').emit('bus-status-changed', {
    busId: bus._id,
    busNumber: bus.busNumber,
    status: bus.status
  });

  res.status(200).json({
    success: true,
    data: bus
  });
});
