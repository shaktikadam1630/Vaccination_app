import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { Syringe, LogOut, Bell, MessageSquare, Check, X, Sparkles } from 'lucide-react';

export default function Navbar() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifs, setShowNotifs] = useState(false);

    const fetchNotifications = async () => {
        if (!user || user.role === 'admin') return;
        try {
            const endpoint = user.role === 'parent' ? '/parent/notifications' : '/centre/notifications';
            const res = await api.get(endpoint);
            setNotifications(res.data.notifications || []);
            setUnreadCount(res.data.unreadCount || 0);
        } catch (err) {
            console.error('Error fetching notifications:', err);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, [user, location.pathname]);

    const handleMarkAllRead = async () => {
        if (user.role === 'parent') {
            try {
                await api.patch('/parent/notifications/read-all');
                setUnreadCount(0);
                setNotifications(notifications.map(n => ({ ...n, is_read: 1 })));
            } catch (err) {
                console.error(err);
            }
        }
    };

    if (!user) return null;

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="bg-slate-900 border-b border-slate-800 relative z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Brand */}
                    <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate(`/${user.role}`)}>
                        <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md">
                            <Syringe className="w-5 h-5" />
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="text-lg font-bold text-white tracking-tight">VaccineTrack</span>
                            <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-semibold capitalize">
                                {user.role}
                            </span>
                        </div>
                    </div>

                    {/* Navigation Links */}
                    <div className="hidden md:flex items-center space-x-1">
                        {user.role === 'parent' && (
                            <>
                                <Link
                                    to="/parent"
                                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
                                        isActive('/parent')
                                            ? 'bg-blue-600 text-white'
                                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                    }`}
                                >
                                    My Children
                                </Link>
                                <Link
                                    to="/parent/nearby"
                                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
                                        isActive('/parent/nearby')
                                            ? 'bg-blue-600 text-white'
                                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                    }`}
                                >
                                    Nearby Centres
                                </Link>
                                <Link
                                    to="/parent/assistant"
                                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                                        isActive('/parent/assistant')
                                            ? 'bg-blue-600 text-white'
                                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                    }`}
                                >
                                    <Sparkles className="w-3.5 h-3.5" />
                                    AI Assistant
                                </Link>
                            </>
                        )}

                        {user.role === 'centre' && (
                            <>
                                <Link
                                    to="/centre"
                                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
                                        isActive('/centre')
                                            ? 'bg-blue-600 text-white'
                                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                    }`}
                                >
                                    Doses Queue
                                </Link>
                                <Link
                                    to="/centre/inventory"
                                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
                                        isActive('/centre/inventory')
                                            ? 'bg-blue-600 text-white'
                                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                    }`}
                                >
                                    Vaccine Stock
                                </Link>
                                <Link
                                    to="/centre/profile"
                                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
                                        isActive('/centre/profile')
                                            ? 'bg-blue-600 text-white'
                                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                    }`}
                                >
                                    Profile
                                </Link>
                            </>
                        )}

                        {user.role === 'admin' && (
                            <>
                                <Link
                                    to="/admin"
                                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
                                        isActive('/admin')
                                            ? 'bg-blue-600 text-white'
                                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                    }`}
                                >
                                    Dashboard
                                </Link>
                                <Link
                                    to="/admin/rules"
                                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
                                        isActive('/admin/rules')
                                            ? 'bg-blue-600 text-white'
                                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                    }`}
                                >
                                    Vaccine Rules
                                </Link>
                                <Link
                                    to="/admin/centres"
                                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
                                        isActive('/admin/centres')
                                            ? 'bg-blue-600 text-white'
                                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                    }`}
                                >
                                    Centres
                                </Link>
                            </>
                        )}
                    </div>

                    {/* User Profile Info, Notifications & Sign Out */}
                    <div className="flex items-center space-x-3">
                        {/* Notifications Bell Button */}
                        {user.role !== 'admin' && (
                            <div className="relative">
                                <button
                                    onClick={() => setShowNotifs(!showNotifs)}
                                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition relative"
                                    title="Notifications & Mobile SMS Alerts"
                                >
                                    <Bell className="w-4 h-4" />
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                                            {unreadCount}
                                        </span>
                                    )}
                                </button>

                                {/* Dropdown Menu */}
                                {showNotifs && (
                                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50">
                                        <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                <MessageSquare className="w-4 h-4 text-blue-400" />
                                                <span className="text-xs font-bold text-white">Notifications & Mobile SMS</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                {unreadCount > 0 && (
                                                    <button
                                                        onClick={handleMarkAllRead}
                                                        className="text-[11px] text-blue-400 hover:underline flex items-center gap-1 font-medium"
                                                    >
                                                        <Check className="w-3 h-3" /> Mark read
                                                    </button>
                                                )}
                                                <button onClick={() => setShowNotifs(false)} className="text-slate-500 hover:text-white text-xs">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                                            {notifications.length === 0 ? (
                                                <div className="p-6 text-center text-xs text-slate-500">No notifications yet.</div>
                                            ) : (
                                                notifications.map((n) => (
                                                    <div
                                                        key={n.id}
                                                        className={`p-3.5 text-xs transition ${
                                                            !n.is_read ? 'bg-blue-500/5' : 'bg-transparent'
                                                        }`}
                                                    >
                                                        <div className="flex items-start justify-between">
                                                            <span className="font-bold text-slate-200">{n.title}</span>
                                                            <span className="text-[10px] text-slate-500 font-mono">
                                                                {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                        <p className="text-slate-400 mt-1 leading-relaxed">{n.message}</p>
                                                        {n.phone_number && (
                                                            <div className="mt-2 p-2 rounded-lg bg-slate-950 border border-slate-800/80 text-[11px] text-emerald-400 font-mono flex items-center space-x-1.5">
                                                                <span>📱 SMS to {n.phone_number}: Sent</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="text-right hidden sm:block">
                            <div className="text-xs font-bold text-white">
                                {user.fullName || user.name || user.email}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">{user.email}</div>
                        </div>

                        <button
                            onClick={logout}
                            title="Sign Out"
                            className="p-2 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}

