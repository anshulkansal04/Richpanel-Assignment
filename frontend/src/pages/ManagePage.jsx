import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { facebookAPI } from '../services/api';

const ManagePage = () => {
  const navigate = useNavigate();
  const [connectedPages, setConnectedPages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchConnectedPages();
  }, []);

  // Add a secondary fetch after component mounts to handle timing issues
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('ManagePage: Secondary fetch after 2 seconds...');
      fetchConnectedPages();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const fetchConnectedPages = async () => {
    try {
      console.log('ManagePage: Fetching connected pages...');
      
      // TEMPORARY: Test authentication first
      try {
        console.log('Testing authentication...');
        const authTest = await facebookAPI.testAuth();
        console.log('Auth test result:', authTest);
      } catch (authError) {
        console.error('Auth test failed:', authError);
      }
      
      const response = await facebookAPI.getConnectedPages();
      console.log('ManagePage: API Response:', response);
      
      if (response.success) {
        console.log('ManagePage: Pages data:', response.data.pages);
        setConnectedPages(response.data.pages);
        if (response.data.pages.length === 0) {
          console.log('ManagePage: No pages found in response');
        }
      } else {
        console.log('ManagePage: API response not successful:', response);
        toast.error(response.message || 'Failed to fetch connected pages');
      }
    } catch (error) {
      console.error('ManagePage: Error fetching connected pages:', error);
      toast.error(error.message || 'Failed to fetch connected pages');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteIntegration = async (pageId) => {
    try {
      const response = await facebookAPI.disconnectPage(pageId);
      if (response.success) {
        toast.success('Facebook page disconnected successfully');
        setConnectedPages(connectedPages.filter(page => page.id !== pageId));
        if (connectedPages.length === 1) {
          navigate('/connect');
        }
      }
    } catch (error) {
      toast.error(error.message || 'Failed to disconnect page');
    }
  };

  const handleReplyToMessages = (pageId) => {
    navigate(`/dashboard/${pageId}`);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-4xl mx-4 text-center">
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-3 text-gray-600">Loading connected pages...</span>
        </div>
      </div>
    );
  }

  if (connectedPages.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm mx-4 text-center">
        <h1 className="text-xl font-semibold text-gray-800 mb-4">
          No Connected Pages
        </h1>
        <p className="text-gray-600 mb-6">
          You haven't connected any Facebook pages yet.
        </p>
        <button
          onClick={() => navigate('/connect')}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
        >
          Connect a Page
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-4xl mx-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">
          Connected Facebook Pages
        </h1>
        <div className="flex gap-3">
          <button
            onClick={() => {
              console.log('Manual refresh clicked');
              setIsLoading(true);
              fetchConnectedPages();
            }}
            className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          <button
            onClick={() => navigate('/connect')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Connect Another Page
          </button>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {connectedPages.map((page) => (
          <div key={page.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center mb-4">
              <img
                src={page.picture || '/default-page-avatar.png'}
                alt={page.name}
                className="w-16 h-16 rounded-full mr-4"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 text-lg">{page.name}</h3>
                <p className="text-sm text-gray-600">{page.category}</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => handleReplyToMessages(page.id)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
              >
                Manage Messages
              </button>
              
              <button
                onClick={() => handleDeleteIntegration(page.id)}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
              >
                Disconnect
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ManagePage;