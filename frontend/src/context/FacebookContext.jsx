import React, { createContext, useContext, useState, useEffect } from 'react';
import { facebookAPI } from '../services/api';
import { useAuth } from './AuthContext';

const FacebookContext = createContext();

export const useFacebook = () => {
  const context = useContext(FacebookContext);
  if (!context) {
    throw new Error('useFacebook must be used within a FacebookProvider');
  }
  return context;
};

export const FacebookProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [connectedPages, setConnectedPages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fbLoaded, setFbLoaded] = useState(false);

  // Initialize Facebook SDK
  useEffect(() => {
    const loadFacebookSDK = () => {
      if (window.FB) {
        setFbLoaded(true);
        return;
      }

      window.fbAsyncInit = function() {
        window.FB.init({
          appId: import.meta.env.VITE_FACEBOOK_APP_ID,
          cookie: true,
          xfbml: true,
          version: 'v18.0'
        });
        setFbLoaded(true);
      };

      // Load SDK
      const script = document.createElement('script');
      script.id = 'facebook-jssdk';
      script.src = 'https://connect.facebook.net/en_US/sdk.js';
      script.async = true;
      script.defer = true;
      script.crossOrigin = 'anonymous';
      document.body.appendChild(script);
    };

    loadFacebookSDK();
  }, []);

  // Load connected pages when authenticated
  useEffect(() => {
    if (isAuthenticated && fbLoaded) {
      loadConnectedPages();
    }
  }, [isAuthenticated, fbLoaded]);

  const loadConnectedPages = async () => {
    try {
      setLoading(true);
      const response = await facebookAPI.getConnectedPages();
      setConnectedPages(response.data.pages || []);
    } catch (error) {
      console.error('Error loading connected pages:', error);
    } finally {
      setLoading(false);
    }
  };

  const loginWithFacebook = () => {
    return new Promise((resolve, reject) => {
      if (!window.FB) {
        reject(new Error('Facebook SDK not loaded'));
        return;
      }

      window.FB.login(
        function(response) {
          if (response.authResponse) {
            resolve(response.authResponse);
          } else {
            reject(new Error('Facebook login was cancelled'));
          }
        },
        {
          scope: 'pages_manage_metadata,pages_messaging,pages_read_engagement',
          return_scopes: true
        }
      );
    });
  };

  const getAvailablePages = async (accessToken) => {
    try {
      const response = await facebookAPI.getAvailablePages(accessToken);
      return response.data.pages || [];
    } catch (error) {
      console.error('Error fetching available pages:', error);
      throw error;
    }
  };

  const connectPage = async (accessToken, pageId) => {
    try {
      setLoading(true);
      const response = await facebookAPI.connectPage(accessToken, pageId);
      
      // Reload connected pages
      await loadConnectedPages();
      
      return response;
    } catch (error) {
      console.error('Error connecting page:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const disconnectPage = async (pageId) => {
    try {
      setLoading(true);
      await facebookAPI.disconnectPage(pageId);
      
      // Remove from local state
      setConnectedPages(prev => 
        prev.filter(page => page.pageId !== pageId)
      );
      
      return true;
    } catch (error) {
      console.error('Error disconnecting page:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getConversations = async (pageId, params = {}) => {
    try {
      const response = await facebookAPI.getConversations(pageId, params);
      return response.data;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  };

  const getMessages = async (conversationId, params = {}) => {
    try {
      const response = await facebookAPI.getMessages(conversationId, params);
      return response.data;
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  };

  const sendMessage = async (conversationId, messageData) => {
    try {
      const response = await facebookAPI.sendMessage(conversationId, messageData);
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  const value = {
    connectedPages,
    loading,
    fbLoaded,
    loginWithFacebook,
    getAvailablePages,
    connectPage,
    disconnectPage,
    getConversations,
    getMessages,
    sendMessage,
    refreshConnectedPages: loadConnectedPages
  };

  return (
    <FacebookContext.Provider value={value}>
      {children}
    </FacebookContext.Provider>
  );
}; 