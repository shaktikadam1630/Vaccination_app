import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ allowedRoles }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900 text-blue-400">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Redirect to their role dashboard
        if (user.role === 'admin') return <Navigate to="/admin" replace />;
        if (user.role === 'centre') return <Navigate to="/centre" replace />;
        if (user.role === 'parent') return <Navigate to="/parent" replace />;
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}
