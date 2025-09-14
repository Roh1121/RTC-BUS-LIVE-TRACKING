const Joi = require('joi');

// Validation schemas
const schemas = {
  // Bus validation
  createBus: Joi.object({
    busNumber: Joi.string().required().trim().uppercase(),
    routeId: Joi.string().required().pattern(/^[0-9a-fA-F]{24}$/),
    currentLocation: Joi.object({
      latitude: Joi.number().min(-90).max(90).required(),
      longitude: Joi.number().min(-180).max(180).required()
    }).required(),
    occupancy: Joi.object({
      totalSeats: Joi.number().integer().min(1).required(),
      occupiedSeats: Joi.number().integer().min(0).required()
    }).required(),
    driver: Joi.object({
      name: Joi.string().trim(),
      phoneNumber: Joi.string().pattern(/^\+?[\d\s-()]+$/),
      licenseNumber: Joi.string().trim()
    }).optional(),
    speed: Joi.number().min(0).optional(),
    direction: Joi.number().min(0).max(360).optional()
  }),

  updateBusLocation: Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
    speed: Joi.number().min(0).optional(),
    direction: Joi.number().min(0).max(360).optional(),
    occupiedSeats: Joi.number().integer().min(0).optional()
  }),

  // Route validation
  createRoute: Joi.object({
    routeName: Joi.string().required().trim(),
    routeNumber: Joi.string().required().trim().uppercase(),
    description: Joi.string().trim().optional(),
    stops: Joi.array().items(
      Joi.object({
        stopId: Joi.string().required(),
        name: Joi.string().required().trim(),
        coordinates: Joi.object({
          latitude: Joi.number().min(-90).max(90).required(),
          longitude: Joi.number().min(-180).max(180).required()
        }).required(),
        order: Joi.number().integer().min(1).required(),
        estimatedTime: Joi.number().min(0).required(),
        facilities: Joi.array().items(
          Joi.string().valid('Shelter', 'Seating', 'Digital Display', 'Wheelchair Access', 'Restroom', 'Parking')
        ).optional()
      })
    ).min(2).required(),
    totalDistance: Joi.number().min(0).required(),
    estimatedDuration: Joi.number().min(1).required(),
    operatingHours: Joi.object({
      start: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
      end: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required()
    }).required(),
    frequency: Joi.number().min(1).required(),
    fare: Joi.object({
      adult: Joi.number().min(0).required(),
      student: Joi.number().min(0).optional(),
      senior: Joi.number().min(0).optional()
    }).required(),
    routeType: Joi.string().valid('City', 'Express', 'Intercity', 'Shuttle').optional(),
    color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).optional()
  }),

  // User validation
  registerUser: Joi.object({
    name: Joi.string().required().trim().max(50),
    email: Joi.string().required().email().lowercase(),
    password: Joi.string().required().min(6),
    phoneNumber: Joi.string().pattern(/^\+?[\d\s-()]+$/).optional(),
    role: Joi.string().valid('user', 'admin', 'driver', 'operator').optional()
  }),

  loginUser: Joi.object({
    email: Joi.string().required().email().lowercase(),
    password: Joi.string().required()
  }),

  updateUser: Joi.object({
    name: Joi.string().trim().max(50).optional(),
    phoneNumber: Joi.string().pattern(/^\+?[\d\s-()]+$/).optional(),
    preferences: Joi.object({
      favoriteRoutes: Joi.array().items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/)).optional(),
      notifications: Joi.object({
        busArrival: Joi.boolean().optional(),
        routeUpdates: Joi.boolean().optional(),
        serviceAlerts: Joi.boolean().optional()
      }).optional(),
      defaultLocation: Joi.object({
        latitude: Joi.number().min(-90).max(90).optional(),
        longitude: Joi.number().min(-180).max(180).optional(),
        address: Joi.string().trim().optional()
      }).optional()
    }).optional()
  }),

  // Query validation
  locationQuery: Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
    radius: Joi.number().min(100).max(50000).optional() // 100m to 50km
  }),

  paginationQuery: Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    sort: Joi.string().optional(),
    order: Joi.string().valid('asc', 'desc').optional()
  })
};

// Validation middleware factory
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const data = source === 'query' ? req.query : 
                  source === 'params' ? req.params : req.body;

    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context.value
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    // Replace the original data with validated and sanitized data
    if (source === 'query') {
      req.query = value;
    } else if (source === 'params') {
      req.params = value;
    } else {
      req.body = value;
    }

    next();
  };
};

// Custom validation for occupancy
const validateOccupancy = (req, res, next) => {
  if (req.body.occupancy) {
    const { totalSeats, occupiedSeats } = req.body.occupancy;
    if (occupiedSeats > totalSeats) {
      return res.status(400).json({
        success: false,
        message: 'Occupied seats cannot exceed total seats'
      });
    }
  }
  next();
};

// Validate MongoDB ObjectId
const validateObjectId = (paramName) => {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName} format`
      });
    }
    next();
  };
};

module.exports = {
  schemas,
  validate,
  validateOccupancy,
  validateObjectId
};
