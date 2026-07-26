import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login.js';
import Dashboard from './pages/Dashboard.js';
import NewCollection from './pages/NewCollection.js';
import Register from './pages/Register.js';
import Members from './pages/Members.js';
import MemberDetail from './pages/MemberDetail.js';
import Payments from './pages/Payments.js';
import AttentionQueue from './pages/AttentionQueue.js';
import Reports from './pages/Reports.js';
import DashboardLayout from './layouts/DashboardLayout.js';
import { getAuthToken } from './lib/api.js';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);

  useEffect(() => {
    const token = getAuthToken();
    setIsAuthenticated(!!token);
    setCheckingAuth(false);
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogoutSuccess = () => {
    setIsAuthenticated(false);
  };

  if (checkingAuth) {
    return (
      <div className="flex h-screen items-center justify-center bg-warm-cream">
        <div className="animate-pulse text-sm text-text-muted font-bold">Checking session...</div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public Login Route */}
        <Route 
          path="/login" 
          element={
            isAuthenticated 
              ? <Navigate to="/" replace /> 
              : <Login onLogin={handleLoginSuccess} />
          } 
        />

        {/* Protected Dashboard Layout and Sub-pages */}
        <Route 
          path="/" 
          element={
            isAuthenticated 
              ? <DashboardLayout onLogout={handleLogoutSuccess} /> 
              : <Navigate to="/login" replace />
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="collection/new" element={<NewCollection />} />
          <Route path="register" element={<Register />} />
          <Route path="members" element={<Members />} />
          <Route path="members/:id" element={<MemberDetail />} />
          <Route path="payments" element={<Payments />} />
          <Route path="attention" element={<AttentionQueue />} />
          <Route path="reports" element={<Reports />} />
        </Route>

        {/* Wildcard redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
