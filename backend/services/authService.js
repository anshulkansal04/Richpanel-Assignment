const jwt = require('jsonwebtoken');
const User = require('../models/User');

class AuthService {
  // Generate JWT token
  static generateToken(userId) {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET || 'your-super-secret-jwt-key',
      { 
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        issuer: 'facebook-helpdesk'
      }
    );
  }

  // Verify JWT token
  static verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key');
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  // Register new user
  static async registerUser(userData) {
    const { name, email, password } = userData;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Create new user
    const user = new User({
      name,
      email,
      password
    });

    await user.save();

    // Generate token
    const token = this.generateToken(user._id);

    return {
      user: user.toJSON(),
      token
    };
  }

  // Login user
  static async loginUser(credentials) {
    const { email, password } = credentials;

    // Find user with password
    const user = await User.findByEmailWithPassword(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error('Account has been deactivated');
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    await user.updateLastLogin();

    // Generate token
    const token = this.generateToken(user._id);

    return {
      user: user.toJSON(),
      token
    };
  }

  // Get user by ID
  static async getUserById(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  // Refresh token
  static async refreshToken(userId) {
    const user = await this.getUserById(userId);
    const token = this.generateToken(user._id);
    
    return {
      user: user.toJSON(),
      token
    };
  }

  // Change password
  static async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Update password
    user.password = newPassword;
    await user.save();

    return { message: 'Password updated successfully' };
  }

  // Deactivate user account
  static async deactivateAccount(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.isActive = false;
    await user.save();

    return { message: 'Account deactivated successfully' };
  }
}

module.exports = AuthService; 