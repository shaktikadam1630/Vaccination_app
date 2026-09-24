import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Auth Pages
import Login from './pages/auth/Login';
import RegisterParent from './pages/auth/RegisterParent';
import RegisterCentre from './pages/auth/RegisterCentre';
import ForgotPassword from './pages/auth/ForgotPassword';

// Parent Pages
import ParentDashboard from './pages/parent/ParentDashboard';
import DigitalVaccineCard from './pages/parent/DigitalVaccineCard';
import NearbyCentres from './pages/parent/NearbyCentres';

// Healthcare Centre Pages
import CentreDashboard from './pages/centre/CentreDashboard';
import CentreInventory from './pages/centre/CentreInventory';
import CentreProfile from './pages/centre/CentreProfile';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageRules from './pages/admin/ManageRules';
import ApproveCentres from './pages/admin/ApproveCentres';

export default function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    {/* Public Auth Routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register-parent" element={<RegisterParent />} />
                    <Route path="/register-centre" element={<RegisterCentre />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />

                    {/* Parent Protected Routes */}
                    <Route element={<ProtectedRoute allowedRoles={['parent']} />}>
                        <Route path="/parent" element={<ParentDashboard />} />
                        <Route path="/parent/child/:id" element={<DigitalVaccineCard />} />
                        <Route path="/parent/nearby" element={<NearbyCentres />} />
                    </Route>

                    {/* Healthcare Centre Protected Routes */}
                    <Route element={<ProtectedRoute allowedRoles={['centre']} />}>
                        <Route path="/centre" element={<CentreDashboard />} />
                        <Route path="/centre/inventory" element={<CentreInventory />} />
                        <Route path="/centre/profile" element={<CentreProfile />} />
                    </Route>

                    {/* Admin Protected Routes */}
                    <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                        <Route path="/admin" element={<AdminDashboard />} />
                        <Route path="/admin/rules" element={<ManageRules />} />
                        <Route path="/admin/centres" element={<ApproveCentres />} />
                    </Route>

                    {/* Default Fallback */}
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}
