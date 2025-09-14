const express = require('express');
const router = express.Router();
const {
  getAllRoutes,
  getRoute,
  createRoute,
  updateRoute,
  deleteRoute,
  getRoutesByArea,
  getRouteStops,
  getRouteArrivals,
  searchRoutes
} = require('../controllers/routeController');

const { protect, authorize } = require('../middleware/auth');
const { validate, validateObjectId, schemas } = require('../middleware/validation');

// Public routes
router.get('/', validate(schemas.paginationQuery, 'query'), getAllRoutes);
router.get('/search', searchRoutes);
router.get('/nearby', validate(schemas.locationQuery, 'query'), getRoutesByArea);
router.get('/:id', validateObjectId('id'), getRoute);
router.get('/:id/stops', validateObjectId('id'), getRouteStops);
router.get('/:id/arrivals', validateObjectId('id'), getRouteArrivals);

// Protected routes
router.use(protect); // All routes below require authentication

// Admin only routes
router.post('/', 
  authorize('admin'), 
  validate(schemas.createRoute), 
  createRoute
);

router.put('/:id', 
  validateObjectId('id'),
  authorize('admin'), 
  validate(schemas.createRoute), 
  updateRoute
);

router.delete('/:id', 
  validateObjectId('id'),
  authorize('admin'), 
  deleteRoute
);

module.exports = router;
