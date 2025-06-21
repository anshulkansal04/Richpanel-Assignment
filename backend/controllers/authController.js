const AuthService = require('../services/authService');

class AuthController {
  // Register new user
  static async register(req, res) {
    try {
      const { name, email, password } = req.body;
      
      const result = await AuthService.registerUser({
        name,
        email,
        password
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result
      });
    } catch (error) {
      console.error('Registration error:', error);
      
      res.status(error.statusCode || 400).json({
        success: false,
        message: error.message || 'Registration failed'
      });
    }
  }

  // Login user
  static async login(req, res) {
    try {
      const { email, password } = req.body;
      
      const result = await AuthService.loginUser({
        email,
        password
      });

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result
      });
    } catch (error) {
      console.error('Login error:', error);
      
      res.status(error.statusCode || 400).json({
        success: false,
        message: error.message || 'Login failed'
      });
    }
  }

  // Get current user
  static async getCurrentUser(req, res) {
    try {
      const user = req.user;

      res.status(200).json({
        success: true,
        data: {
          user: user.toJSON()
        }
      });
    } catch (error) {
      console.error('Get current user error:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to get user information'
      });
    }
  }

  // Refresh token
  static async refreshToken(req, res) {
    try {
      const userId = req.userId;
      
      const result = await AuthService.refreshToken(userId);

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: result
      });
    } catch (error) {
      console.error('Refresh token error:', error);
      
      res.status(error.statusCode || 400).json({
        success: false,
        message: error.message || 'Token refresh failed'
      });
    }
  }

  // Change password
  static async changePassword(req, res) {
    try {
      const userId = req.userId;
      const { currentPassword, newPassword } = req.body;
      
      const result = await AuthService.changePassword(
        userId,
        currentPassword,
        newPassword
      );

      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      console.error('Change password error:', error);
      
      res.status(error.statusCode || 400).json({
        success: false,
        message: error.message || 'Password change failed'
      });
    }
  }

  // Logout user (client-side token removal)
  static async logout(req, res) {
    try {
      // In a JWT implementation, logout is typically handled client-side
      // by removing the token. Here we just return a success message.
      // In a more complex implementation, you might want to blacklist tokens.
      
      res.status(200).json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      console.error('Logout error:', error);
      
      res.status(500).json({
        success: false,
        message: 'Logout failed'
      });
    }
  }

  // Deactivate account
  static async deactivateAccount(req, res) {
    try {
      const userId = req.userId;
      
      const result = await AuthService.deactivateAccount(userId);

      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      console.error('Deactivate account error:', error);
      
      res.status(error.statusCode || 400).json({
        success: false,
        message: error.message || 'Account deactivation failed'
      });
    }
  }

  // Update user profile
  static async updateProfile(req, res) {
    try {
      const userId = req.userId;
      const { name } = req.body;
      
      const user = await AuthService.getUserById(userId);
      
      if (name) {
        user.name = name;
      }
      
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: user.toJSON()
        }
      });
    } catch (error) {
      console.error('Update profile error:', error);
      
      res.status(error.statusCode || 400).json({
        success: false,
        message: error.message || 'Profile update failed'
      });
    }
  }
}

module.exports = AuthController; 