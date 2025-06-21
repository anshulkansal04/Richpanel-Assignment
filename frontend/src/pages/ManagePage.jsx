import React from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const ManagePage = () => {
  const navigate = useNavigate();

  const handleDeleteIntegration = () => {
    // For demo purposes, navigate back to connect page
    toast.success('Facebook page integration deleted successfully');
    navigate('/connect');
  };

  const handleReplyToMessages = () => {
    // This would navigate to the main dashboard (not implemented yet)
    toast.info('Reply To Messages functionality - Dashboard coming soon!');
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm mx-4 text-center">
      <h1 className="text-xl font-semibold text-gray-800 mb-4">
        Facebook Page Integration
      </h1>
      
      <p className="text-gray-700 mb-6">
        Integrated Page: <span className="font-semibold">Amazon Business</span>
      </p>
      
      <div className="space-y-3">
        <button
          onClick={handleDeleteIntegration}
          className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
        >
          Delete Integration
        </button>
        
        <button
          onClick={handleReplyToMessages}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
        >
          Reply To Messages
        </button>
      </div>
    </div>
  );
};

export default ManagePage; 