import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import Navbar from '../../components/Navbar';
import StatusBadge from '../../components/StatusBadge';
import { Building2, MapPin, Phone } from 'lucide-react';

export default function ApproveCentres() {
    const [centres, setCentres] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');

    const fetchCentres = async () => {
        setLoading(true);
        try {
            const url = statusFilter ? `/admin/centres?status=${statusFilter}` : '/admin/centres';
            const res = await api.get(url);
            setCentres(res.data.centres || []);
        } catch (err) {
            console.error('Error fetching centres:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCentres();
    }, [statusFilter]);

    const handleUpdateStatus = async (centreId, status) => {
        try {
            await api.patch(`/admin/centres/${centreId}/status`, { status });
            fetchCentres();
        } catch (err) {
            alert('Failed to update status.');
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 pb-16">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-slate-900 p-6 rounded-2xl border border-slate-800">
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Healthcare Centres Directory</h1>
                        <p className="text-xs text-slate-400 mt-1">Review registrations, manage statuses, and approve healthcare centres</p>
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-semibold"
                    >
                        <option value="">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>

                <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
                    {loading ? (
                        <div className="py-12 text-center text-slate-500 text-xs">Loading centres...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider border-b border-slate-800 font-semibold">
                                    <tr>
                                        <th className="px-5 py-3.5">Centre Name & License</th>
                                        <th className="px-5 py-3.5">Address & Coordinates</th>
                                        <th className="px-5 py-3.5">Contact Info</th>
                                        <th className="px-5 py-3.5">Status</th>
                                        <th className="px-5 py-3.5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/80">
                                    {centres.map((centre) => (
                                        <tr key={centre.id} className="hover:bg-slate-800/40 transition">
                                            <td className="px-5 py-3.5">
                                                <div className="font-bold text-white text-sm">{centre.name}</div>
                                                <div className="text-xs text-slate-400 font-mono">Lic: {centre.license_number || 'N/A'}</div>
                                            </td>

                                            <td className="px-5 py-3.5 text-slate-300">
                                                <div>{centre.address}</div>
                                                <div className="text-slate-500 font-mono text-[10px] flex items-center gap-1 mt-0.5">
                                                    <MapPin className="w-3 h-3 text-slate-500" />
                                                    {centre.latitude}, {centre.longitude}
                                                </div>
                                            </td>

                                            <td className="px-5 py-3.5">
                                                <div className="text-slate-200">{centre.email}</div>
                                                <div className="text-slate-400 flex items-center gap-1 mt-0.5">
                                                    <Phone className="w-3 h-3 text-slate-500" />
                                                    {centre.phone}
                                                </div>
                                            </td>

                                            <td className="px-5 py-3.5">
                                                <StatusBadge status={centre.status} />
                                            </td>

                                            <td className="px-5 py-3.5 text-right space-x-2">
                                                {centre.status !== 'approved' && (
                                                    <button
                                                        onClick={() => handleUpdateStatus(centre.id, 'approved')}
                                                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg"
                                                    >
                                                        Approve
                                                    </button>
                                                )}
                                                {centre.status !== 'rejected' && (
                                                    <button
                                                        onClick={() => handleUpdateStatus(centre.id, 'rejected')}
                                                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg"
                                                    >
                                                        Reject
                                                    </button>
                                                )}
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
