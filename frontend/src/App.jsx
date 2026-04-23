import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navbar } from './components/Navbar';

const Home             = lazy(() => import('./pages/Home'));
const Login            = lazy(() => import('./pages/Login'));
const Register         = lazy(() => import('./pages/Register'));
const RestaurantList   = lazy(() => import('./pages/RestaurantList'));
const RestaurantDetail = lazy(() => import('./pages/RestaurantDetail'));
const ReservationPage  = lazy(() => import('./pages/ReservationPage'));
const ClientDashboard  = lazy(() => import('./pages/ClientDashboard'));
const OwnerDashboard   = lazy(() => import('./pages/OwnerDashboard'));
const AdminDashboard   = lazy(() => import('./pages/AdminDashboard'));

const Loader = () => (
  <div className="loading-center"><div className="spinner" /></div>
);

export default function App() {
  return (
    <AuthProvider>
      <Navbar />
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route path="/"            element={<Home />} />
          <Route path="/login"       element={<Login />} />
          <Route path="/register"    element={<Register />} />
          <Route path="/restaurants" element={<RestaurantList />} />
          <Route path="/restaurants/:id" element={<RestaurantDetail />} />

          <Route path="/reservation/:id" element={
            <ProtectedRoute><ReservationPage /></ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute role="client"><ClientDashboard /></ProtectedRoute>
          } />
          <Route path="/owner" element={
            <ProtectedRoute role="owner"><OwnerDashboard /></ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <ToastContainer position="top-right" autoClose={4000} theme="light" />
    </AuthProvider>
  );
}