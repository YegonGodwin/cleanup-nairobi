import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user, loading } = useAuth();
  const { openLoginModal } = useModal();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      openLoginModal();
    }
  }, [user, loading, openLoginModal]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!user) {
    // Return null or a placeholder since the modal will handle the login
    return <div className="flex items-center justify-center h-screen">Checking authentication...</div>;
  }

  // Handle role-based redirection when accessing protected content
  if (requiredRole && user.role !== requiredRole) {
    // Redirect to appropriate dashboard based on user role
    if (user.role === 'Admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (user.role === 'Driver') {
      return <Navigate to="/driver/dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  // If no specific role required but current user is an admin and they're accessing user dashboard,
  // potentially redirect them appropriately, but only for the main dashboard route
  if (!requiredRole && user.role === 'Admin' && location.pathname === '/dashboard') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;