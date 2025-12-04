import React from 'react';
import { Navigate } from 'react-router-dom';

const PublicRoute = ({ children, isAuthenticated, isLoading }) => {
  // Show loading while authentication is being checked
  if (isLoading) {
    return (
      <div className="h-screen w-full bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If authenticated, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // If not authenticated, render the public component (landing page)
  return children;
};

export default PublicRoute;