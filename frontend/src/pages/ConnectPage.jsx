import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { facebookAPI } from '../services/api';

const ConnectPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [availablePages, setAvailablePages] = useState([]);
  const [showPageSelector, setShowPageSelector] = useState(false);
  const [accessToken, setAccessToken] = useState('');

  useEffect(() => {
    // Load Facebook SDK
    const loadFacebookSDK = () => {
      if (window.FB) return;
      
      window.fbAsyncInit = function() {
        window.FB.init({
          appId: import.meta.env.VITE_FACEBOOK_APP_ID || '1234567890', // Replace with your App ID
          cookie: true,
          xfbml: true,
          version: 'v18.0'
        });
      };

      (function(d, s, id) {
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) return;
        js = d.createElement(s); js.id = id;
        js.src = "https://connect.facebook.net/en_US/sdk.js";
        fjs.parentNode.insertBefore(js, fjs);
      }(document, 'script', 'facebook-jssdk'));
    };

    loadFacebookSDK();
  }, []);

  const handleConnectPage = () => {
    if (!window.FB) {
      toast.error('Facebook SDK not loaded. Please refresh the page.');
      return;
    }

    setIsLoading(true);
    
    window.FB.login((response) => {
      console.log('Facebook login response:', response);
      
      if (response.authResponse && response.authResponse.accessToken) {
        const { accessToken } = response.authResponse;
        setAccessToken(accessToken);
        fetchAvailablePages(accessToken);
      } else {
        console.log('Login cancelled or failed:', response);
        toast.error('Facebook login cancelled or failed');
        setIsLoading(false);
      }
    }, { 
      scope: 'pages_manage_metadata,pages_read_engagement,pages_manage_posts,pages_messaging',
      return_scopes: true
    });
  };

  const fetchAvailablePages = async (token) => {
    try {
      console.log('Fetching available pages with token:', token);
      const response = await facebookAPI.getAvailablePages(token);
      console.log('Available pages response:', response);
      
      if (response.success && response.data.pages.length > 0) {
        setAvailablePages(response.data.pages);
        setShowPageSelector(true);
      } else {
        toast.error('No Facebook pages found. Please create a Facebook page first.');
      }
    } catch (error) {
      console.error('Error fetching pages:', error);
      if (error.message.includes('401')) {
        toast.error('Session expired. Please login again.');
        // Optionally redirect to login
      } else {
        toast.error(error.message || 'Failed to fetch Facebook pages');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageSelection = async (pageId) => {
    setIsLoading(true);
    try {
      console.log('Connecting page:', pageId);
      const response = await facebookAPI.connectPage(accessToken, pageId);
      console.log('Connect page response:', response);
      
      if (response.success) {
        toast.success('Facebook page connected successfully!');
        console.log('ConnectPage: Page connected successfully, navigating to /manage');
        // Add a small delay to ensure database save is complete
        setTimeout(() => {
          navigate('/manage');
        }, 1000);
      } else {
        toast.error(response.message || 'Failed to connect page');
      }
    } catch (error) {
      console.error('Error connecting page:', error);
      if (error.message.includes('401')) {
        toast.error('Session expired. Please login again.');
        // Optionally redirect to login
      } else if (error.message.includes('409')) {
        toast.error('This page is already connected to another account');
      } else {
        toast.error(error.message || 'Failed to connect page');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg mx-4">
      {!showPageSelector ? (
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-800 mb-6">
            Connect Your Facebook Page
          </h1>
          
          <p className="text-gray-600 mb-8">
            Connect your Facebook page to start managing messages and engaging with your customers.
          </p>
          
          <button
            onClick={handleConnectPage}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-3"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Connecting...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Connect with Facebook
              </>
            )}
          </button>
        </div>
      ) : (
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
            Select a Facebook Page
          </h1>
          
          <p className="text-gray-600 mb-6 text-center">
            Choose which Facebook page you want to connect:
          </p>
          
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {availablePages.map((page) => (
              <div
                key={page.id}
                onClick={() => handlePageSelection(page.id)}
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-colors duration-200"
              >
                <img
                  src={page.picture?.data?.url || '/default-page-avatar.png'}
                  alt={page.name}
                  className="w-12 h-12 rounded-full mr-4"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">{page.name}</h3>
                  <p className="text-sm text-gray-600">{page.category}</p>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            ))}
          </div>
          
          <button
            onClick={() => setShowPageSelector(false)}
            className="w-full mt-4 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-6 rounded-lg transition-colors duration-200"
          >
            Back
          </button>
        </div>
      )}
    </div>
  );
};

export default ConnectPage; 