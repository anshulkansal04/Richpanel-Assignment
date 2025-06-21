import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import UserMenu from './components/UserMenu';
import Register from './pages/Register';
import Login from './pages/Login';
import ConnectPage from './pages/ConnectPage';
import ManagePage from './pages/ManagePage';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="h-screen w-full bg-gradient-to-br from-blue-800 to-blue-900 flex items-center justify-center overflow-hidden relative">
          {/* User Menu - Top Right */}
          <div className="absolute top-4 right-4 z-50">
            <UserMenu />
          </div>

          <Routes>
            <Route path="/" element={<Navigate to="/register" replace />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/connect" element={<ConnectPage />} />
            <Route path="/manage" element={<ManagePage />} />
          </Routes>

          {/* Toast Notifications */}
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#fff',
                color: '#363636',
                fontSize: '14px',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              },
              success: {
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;