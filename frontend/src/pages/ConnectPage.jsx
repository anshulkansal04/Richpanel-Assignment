import React from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const ConnectPage = () => {
  const navigate = useNavigate();

  const handleConnectPage = () => {
    // For now, just navigate to manage page to simulate connection
    toast.success('Facebook page connected successfully!');
    navigate('/manage');
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm mx-4 text-center">
      <h1 className="text-xl font-semibold text-gray-800 mb-6">
        Facebook Page Integration
      </h1>
      
      <button
        onClick={handleConnectPage}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
      >
        Connect Page
      </button>
    </div>
  );
};

export default ConnectPage; 