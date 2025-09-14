const express = require('express');
const router = express.Router();
const {
  getAllBuses,
  getBus,
  createBus,
  updateBusLocation,
  updateBus,
  deleteBus,
  getBusesByRoute,
  getNearbyBuses,
  updateBusStatus
} = require('../controllers/busController');

const { protect, authorize } = require('../middleware/auth');
const { validate, validateObjectId, schemas } = require('../middleware/validation');

// Public routes
router.get('/', validate(schemas.paginationQuery, 'query'), getAllBuses);
router.get('/nearby', validate(schemas.locationQuery, 'query'), getNearbyBuses);
router.get('/route/:routeId', validateObjectId('routeId'), getBusesByRoute);
router.get('/:id', validateObjectId('id'), getBus);

// Location update route (public for GPS devices)
router.post('/update-location', validate(schemas.updateBusLocation), updateBusLocation);

// Protected routes
router.use(protect); // All routes below require authentication

// Admin/Operator only routes
router.post('/', 
  authorize('admin', 'operator'), 
  validate(schemas.createBus), 
  createBus
);

router.put('/:id', 
  validateObjectId('id'),
  authorize('admin', 'operator'), 
  validate(schemas.createBus), 
  updateBus
);

router.patch('/:id/status', 
  validateObjectId('id'),
  authorize('admin', 'operator', 'driver'), 
  updateBusStatus
);

// Admin only routes
router.delete('/:id', 
  validateObjectId('id'),
  authorize('admin'), 
  deleteBus
);

module.exports = router;
