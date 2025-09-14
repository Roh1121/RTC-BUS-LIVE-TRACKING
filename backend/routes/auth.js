const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  logout
} = require('../controllers/authController');

const { protect } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

// Public routes
router.post('/register', validate(schemas.registerUser), register);
router.post('/login', validate(schemas.loginUser), login);

// Protected routes
router.use(protect); // All routes below require authentication

router.get('/me', getMe);
router.put('/me', validate(schemas.updateUser), updateProfile);
router.put('/change-password', changePassword);
router.post('/logout', logout);

module.exports = router;
