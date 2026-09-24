import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Building2, Mail, Lock, Phone, MapPin, Clock, FileCheck, ArrowRight, Compass } from 'lucide-react';

export default function RegisterCentre() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        address: '',
        latitude: '28.6139',
        longitude: '77.2090',
        workingHours: '09:00 AM - 05:00 PM',
        licenseNumber: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const { registerCentre } = useAuth();
    const navigate = useNavigate();

    const handleFetchLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setFormData(prev => ({
                        ...prev,
                        latitude: pos.coords.latitude.toFixed(6),
                        longitude: pos.coords.longitude.toFixed(6)
                    }));
                },
                (err) => {
                    alert('Could not auto-detect location. Please enter manually.');
                }
            );
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        try {
            await registerCentre({
                ...formData,
                latitude: parseFloat(formData.latitude),
                longitude: parseFloat(formData.longitude)
            });
            setSuccess(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit centre registration.');
        } finally {
            setSubmitting(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950">
                <div className="w-full max-w-md text-center glass-panel p-8 rounded-2xl border border-slate-800">
                    <div className="w-16 h-16 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-500/30">
                        <Clock className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Registration Submitted!</h2>
                    <p className="text-sm text-slate-300 mb-6">
                        Your healthcare centre registration request has been submitted successfully with status <span className="text-amber-400 font-semibold">PENDING</span>.
                        <br/><br/>
                        An Administrator will review your license and location details before activating your login access.
                    </p>
                    <button
                        onClick={() => navigate('/login')}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl"
                    >
                        Return to Sign In
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 py-12">
            <div className="w-full max-w-xl">
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-purple-600 mb-3 shadow-lg shadow-purple-500/20">
                        <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Register Healthcare Centre</h1>
                    <p className="text-xs text-slate-400 mt-1">Submit your facility details for system admin approval</p>
                </div>

                <div className="glass-panel p-8 rounded-2xl border border-slate-800 shadow-xl">
                    {error && (
                        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Centre Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="City Primary Health Centre"
                                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:border-purple-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Contact Email</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="centre@health.gov.in"
                                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:border-purple-500 focus:outline-none"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Password</label>
                                <input
                                    type="password"
                                    required
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="••••••••••••"
                                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:border-purple-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Phone Number</label>
                                <input
                                    type="tel"
                                    required
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="+91 98765 43210"
                                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:border-purple-500 focus:outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Physical Address</label>
                            <input
                                type="text"
                                required
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                placeholder="12 Health Avenue, Central District"
                                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:border-purple-500 focus:outline-none"
                            />
                        </div>

                        {/* Coordinates & Geolocation Helper */}
                        <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold text-purple-400 flex items-center space-x-1">
                                    <MapPin className="w-4 h-4" />
                                    <span>Geo Coordinates (For Nearby Search)</span>
                                </span>
                                <button
                                    type="button"
                                    onClick={handleFetchLocation}
                                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1"
                                >
                                    <Compass className="w-3.5 h-3.5" />
                                    <span>Auto-Detect My GPS</span>
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] text-slate-400 uppercase">Latitude</label>
                                    <input
                                        type="number"
                                        step="any"
                                        required
                                        value={formData.latitude}
                                        onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] text-slate-400 uppercase">Longitude</label>
                                    <input
                                        type="number"
                                        step="any"
                                        required
                                        value={formData.longitude}
                                        onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Working Hours</label>
                                <input
                                    type="text"
                                    value={formData.workingHours}
                                    onChange={(e) => setFormData({ ...formData, workingHours: e.target.value })}
                                    placeholder="09:00 AM - 05:00 PM"
                                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:border-purple-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">License / Reg Number</label>
                                <input
                                    type="text"
                                    value={formData.licenseNumber}
                                    onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                                    placeholder="PHC-DEL-2024-001"
                                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:border-purple-500 focus:outline-none"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl flex items-center justify-center space-x-2 transition disabled:opacity-50 mt-2"
                        >
                            <span>{submitting ? 'Submitting Request...' : 'Submit Centre Request'}</span>
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </form>

                    <div className="mt-6 text-center text-xs text-slate-400">
                        Already registered?{' '}
                        <Link to="/login" className="text-purple-400 hover:underline font-semibold">
                            Sign In
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
