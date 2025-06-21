const express = require('express');
const AuthController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { 
  validateRegister, 
  validateLogin, 
  validateChangePassword 
} = require('../middleware/validation');

const router = express.Router();

// Public routes (no authentication required)

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', validateRegister, AuthController.register);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', validateLogin, AuthController.login);

// Protected routes (authentication required)

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authenticateToken, AuthController.getCurrentUser);

// @route   POST /api/auth/refresh
// @desc    Refresh JWT token
// @access  Private
router.post('/refresh', authenticateToken, AuthController.refreshToken);

// @route   POST /api/auth/logout
// @desc    Logout user (client-side)
// @access  Private
router.post('/logout', authenticateToken, AuthController.logout);

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', 
  authenticateToken, 
  validateChangePassword, 
  AuthController.changePassword
);

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticateToken, AuthController.updateProfile);

// @route   DELETE /api/auth/deactivate
// @desc    Deactivate user account
// @access  Private
router.delete('/deactivate', authenticateToken, AuthController.deactivateAccount);

module.exports = router; 