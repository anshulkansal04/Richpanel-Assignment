import axios from 'axios';

// Create axios instance with base configuration
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true', // Skip ngrok browser warning
  },
});

// Request interceptor to add token to requests
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration
API.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API functions
export const authAPI = {
  // Register new user
  register: async (userData) => {
    try {
      const response = await API.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Registration failed' };
    }
  },

  // Login user
  login: async (credentials) => {
    try {
      const response = await API.post('/auth/login', credentials);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Login failed' };
    }
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      const response = await API.get('/auth/me');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get user' };
    }
  },

  // Refresh token
  refreshToken: async () => {
    try {
      const response = await API.post('/auth/refresh');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Token refresh failed' };
    }
  },

  // Logout user
  logout: async () => {
    try {
      const response = await API.post('/auth/logout');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Logout failed' };
    }
  },

  // Change password
  changePassword: async (passwordData) => {
    try {
      const response = await API.put('/auth/change-password', passwordData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Password change failed' };
    }
  },

  // Update profile
  updateProfile: async (profileData) => {
    try {
      const response = await API.put('/auth/profile', profileData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Profile update failed' };
    }
  }
};

// Facebook API functions
export const facebookAPI = {
  // Get available Facebook pages
  getAvailablePages: async (accessToken) => {
    try {
      const response = await API.post('/facebook/pages/available', { accessToken });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch available pages' };
    }
  },

  // Connect Facebook page
  connectPage: async (accessToken, pageId) => {
    try {
      const response = await API.post('/facebook/pages/connect', { accessToken, pageId });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to connect page' };
    }
  },

  // Get connected pages
  getConnectedPages: async () => {
    try {
      const response = await API.get('/facebook/pages');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch connected pages' };
    }
  },

  // Disconnect page
  disconnectPage: async (pageId) => {
    try {
      const response = await API.delete(`/facebook/pages/${pageId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to disconnect page' };
    }
  },

  // Get conversations
  getConversations: async (pageId, params = {}) => {
    try {
      const response = await API.get(`/facebook/pages/${pageId}/conversations`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch conversations' };
    }
  },

  // Get messages
  getMessages: async (conversationId, params = {}) => {
    try {
      const response = await API.get(`/facebook/conversations/${conversationId}/messages`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch messages' };
    }
  },

  // Send message
  sendMessage: async (conversationId, messageData) => {
    try {
      const response = await API.post(`/facebook/conversations/${conversationId}/messages`, {
        text: messageData.message
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to send message' };
    }
  },

  // Test authentication (temporary)
  testAuth: async () => {
    try {
      const response = await API.get('/facebook/test-auth');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Test auth failed' };
    }
  }
};

// Health check
export const healthCheck = async () => {
  try {
    const response = await API.get('/health');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Health check failed' };
  }
};

export default API; 