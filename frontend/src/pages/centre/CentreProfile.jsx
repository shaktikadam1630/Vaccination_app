import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import Navbar from '../../components/Navbar';
import StatusBadge from '../../components/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { Building2, Save, AlertTriangle } from 'lucide-react';

export default function CentreProfile() {
    const [profile, setProfile] = useState({
        name: '',
        address: '',
        latitude: '',
        longitude: '',
        phone: '',
        working_hours: '',
        license_number: '',
        status: ''
    });
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const { updateUserState } = useAuth();

    const fetchProfile = async () => {
        try {
            const res = await api.get('/centre/profile');
            if (res.data.centre) {
                setProfile(res.data.centre);
            }
        } catch (err) {
            console.error('Error fetching centre profile:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setSubmitting(true);

        try {
            const res = await api.put('/centre/profile', profile);
            setMessage(res.data.message);
            if (res.data.status) {
                setProfile(prev => ({ ...prev, status: res.data.status }));
                updateUserState({ centreStatus: res.data.status });
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update profile.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950">
                <Navbar />
                <div className="py-20 text-center text-slate-500 text-xs">Loading profile...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 pb-16">
            <Navbar />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
                <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-lg">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Centre Profile</h1>
                            <p className="text-xs text-slate-400 mt-1">Manage facility details and operating hours</p>
                        </div>
                        <StatusBadge status={profile.status} />
                    </div>

                    {profile.status === 'pending' && (
                        <div className="mb-6 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs flex items-center space-x-2">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <span>Profile changes are currently PENDING Admin approval.</span>
                        </div>
                    )}

                    {message && (
                        <div className="mb-6 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
                            {message}
                        </div>
                    )}

                    {error && (
                        <div className="mb-6 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Facility Name</label>
                            <input
                                type="text"
                                required
                                value={profile.name}
                                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Address</label>
                            <input
                                type="text"
                                required
                                value={profile.address}
                                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Latitude</label>
                                <input
                                    type="number"
                                    step="any"
                                    required
                                    value={profile.latitude}
                                    onChange={(e) => setProfile({ ...profile, latitude: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm font-mono"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Longitude</label>
                                <input
                                    type="number"
                                    step="any"
                                    required
                                    value={profile.longitude}
                                    onChange={(e) => setProfile({ ...profile, longitude: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm font-mono"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Contact Phone</label>
                                <input
                                    type="text"
                                    required
                                    value={profile.phone}
                                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Working Hours</label>
                                <input
                                    type="text"
                                    value={profile.working_hours}
                                    onChange={(e) => setProfile({ ...profile, working_hours: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl flex items-center justify-center space-x-2 transition disabled:opacity-50 mt-4"
                        >
                            <Save className="w-4 h-4" />
                            <span>{submitting ? 'Updating...' : 'Save Profile Changes'}</span>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
