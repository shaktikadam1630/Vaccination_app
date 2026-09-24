import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/client';
import Navbar from '../../components/Navbar';
import StatusBadge from '../../components/StatusBadge';
import { Shield, Building2, Baby, Clock, CheckCircle2, AlertTriangle, Calendar, ArrowRight, UserCheck } from 'lucide-react';

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [pendingCentres, setPendingCentres] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchAdminData = async () => {
        try {
            const [statsRes, centresRes] = await Promise.all([
                api.get('/admin/stats'),
                api.get('/admin/centres?status=pending')
            ]);
            setStats(statsRes.data.stats);
            setPendingCentres(centresRes.data.centres || []);
        } catch (err) {
            console.error('Error fetching admin data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdminData();
    }, []);

    const handleApproveReject = async (centreId, status) => {
        try {
            await api.patch(`/admin/centres/${centreId}/status`, { status });
            fetchAdminData();
        } catch (err) {
            alert('Failed to update centre status.');
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 pb-16">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 bg-slate-900 p-6 rounded-2xl border border-slate-800">
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Admin Dashboard</h1>
                        <p className="text-xs text-slate-400 mt-1">Overview of system metrics and healthcare centre registration requests</p>
                    </div>

                    <div className="flex items-center space-x-3">
                        <Link
                            to="/admin/rules"
                            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-xs transition"
                        >
                            Vaccine Rules
                        </Link>
                        <Link
                            to="/admin/centres"
                            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg text-xs border border-slate-700 transition"
                        >
                            Manage Centres
                        </Link>
                    </div>
                </div>

                {/* Counters Grid */}
                {loading ? (
                    <div className="py-12 text-center text-slate-500 text-xs">Loading analytics...</div>
                ) : stats && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                            <div className="text-xs font-semibold text-amber-400 mb-1">Pending Approvals</div>
                            <div className="text-2xl font-bold text-white">{stats.pendingCentres}</div>
                        </div>

                        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                            <div className="text-xs font-semibold text-teal-400 mb-1">Approved Centres</div>
                            <div className="text-2xl font-bold text-white">{stats.approvedCentres}</div>
                        </div>

                        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                            <div className="text-xs font-semibold text-blue-400 mb-1">Total Parents</div>
                            <div className="text-2xl font-bold text-white">{stats.totalParents}</div>
                        </div>

                        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                            <div className="text-xs font-semibold text-purple-400 mb-1">Total Children</div>
                            <div className="text-2xl font-bold text-white">{stats.totalChildren}</div>
                        </div>

                        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                            <div className="text-xs font-semibold text-emerald-400 mb-1">Completed Doses</div>
                            <div className="text-2xl font-bold text-white">{stats.completedDoses}</div>
                        </div>

                        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                            <div className="text-xs font-semibold text-rose-400 mb-1">Overdue Doses</div>
                            <div className="text-2xl font-bold text-white">{stats.overdueDoses}</div>
                        </div>
                    </div>
                )}

                {/* Pending Centre Approvals Table */}
                <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-lg mb-8">
                    <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                        <h2 className="text-base font-bold text-white">Pending Centre Registrations</h2>
                        <Link to="/admin/centres" className="text-xs text-blue-400 hover:underline">View All Centres</Link>
                    </div>

                    {pendingCentres.length === 0 ? (
                        <div className="p-10 text-center text-slate-500 text-xs">No pending centre registrations.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider border-b border-slate-800 font-semibold">
                                    <tr>
                                        <th className="px-5 py-3">Centre Name</th>
                                        <th className="px-5 py-3">Address & Coordinates</th>
                                        <th className="px-5 py-3">Contact Email & Phone</th>
                                        <th className="px-5 py-3">Working Hours</th>
                                        <th className="px-5 py-3 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/80">
                                    {pendingCentres.map((centre) => (
                                        <tr key={centre.id} className="hover:bg-slate-800/40 transition">
                                            <td className="px-5 py-3.5 font-bold text-white">
                                                {centre.name}
                                                <div className="text-[11px] text-slate-400 font-normal">Lic: {centre.license_number || 'N/A'}</div>
                                            </td>

                                            <td className="px-5 py-3.5 text-slate-300">
                                                <div>{centre.address}</div>
                                                <div className="text-slate-500 font-mono text-[10px]">Lat: {centre.latitude}, Lng: {centre.longitude}</div>
                                            </td>

                                            <td className="px-5 py-3.5">
                                                <div className="text-slate-200">{centre.email}</div>
                                                <div className="text-slate-400">{centre.phone}</div>
                                            </td>

                                            <td className="px-5 py-3.5 text-slate-300">
                                                {centre.working_hours}
                                            </td>

                                            <td className="px-5 py-3.5 text-right space-x-2">
                                                <button
                                                    onClick={() => handleApproveReject(centre.id, 'approved')}
                                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleApproveReject(centre.id, 'rejected')}
                                                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg transition"
                                                >
                                                    Reject
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
