import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function ProtectedRoute({ children, role }) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) return (
    <div className="loading-center"><div className="spinner" /></div>
  );

  if (!isAuthenticated)
    return <Navigate to="/login" state={{ from: location }} replace />;

  if (role && user?.role !== role)
    return <Navigate to="/" replace />;

  return children;
}