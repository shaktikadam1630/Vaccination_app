import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import Navbar from '../../components/Navbar';
import StatusBadge from '../../components/StatusBadge';
import { Baby, Plus, Calendar, ArrowRight, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

export default function ParentDashboard() {
    const [children, setChildren] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newChild, setNewChild] = useState({ name: '', dob: '', gender: 'male', bloodGroup: '' });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const navigate = useNavigate();

    const fetchChildren = async () => {
        try {
            const res = await api.get('/parent/children');
            setChildren(res.data.children || []);
        } catch (err) {
            console.error('Error fetching children:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchChildren();
    }, []);

    const handleAddChild = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        try {
            await api.post('/parent/children', newChild);
            setShowModal(false);
            setNewChild({ name: '', dob: '', gender: 'male', bloodGroup: '' });
            fetchChildren();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add child profile.');
        } finally {
            setSubmitting(false);
        }
    };

    const totalDosesCompleted = children.reduce((acc, c) => acc + (c.stats?.completed || 0), 0);
    const totalDosesPending = children.reduce((acc, c) => acc + (c.stats?.pending || 0), 0);
    const totalDosesOverdue = children.reduce((acc, c) => acc + (c.stats?.overdue || 0), 0);

    return (
        <div className="min-h-screen bg-slate-950 pb-16">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-slate-900 p-6 rounded-2xl border border-slate-800">
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">My Children</h1>
                        <p className="text-xs text-slate-400 mt-1">Manage child profiles and view vaccination schedules</p>
                    </div>

                    <button
                        onClick={() => setShowModal(true)}
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition shadow-sm shrink-0"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Add Child Profile</span>
                    </button>
                </div>

                {/* Overview Stats */}
                {!loading && children.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                            <div>
                                <div className="text-xs text-emerald-400 font-semibold mb-0.5">Completed Doses</div>
                                <div className="text-2xl font-bold text-white">{totalDosesCompleted}</div>
                            </div>
                            <CheckCircle2 className="w-6 h-6 text-emerald-500/40" />
                        </div>

                        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                            <div>
                                <div className="text-xs text-amber-400 font-semibold mb-0.5">Upcoming Doses</div>
                                <div className="text-2xl font-bold text-white">{totalDosesPending}</div>
                            </div>
                            <Clock className="w-6 h-6 text-amber-500/40" />
                        </div>

                        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                            <div>
                                <div className="text-xs text-rose-400 font-semibold mb-0.5">Overdue Doses</div>
                                <div className="text-2xl font-bold text-white">{totalDosesOverdue}</div>
                            </div>
                            <AlertTriangle className="w-6 h-6 text-rose-500/40" />
                        </div>
                    </div>
                )}

                {/* Profiles Grid */}
                {loading ? (
                    <div className="py-12 text-center text-slate-500 text-xs">Loading children profiles...</div>
                ) : children.length === 0 ? (
                    <div className="bg-slate-900 p-12 rounded-2xl text-center border border-slate-800">
                        <Baby className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                        <h3 className="text-lg font-bold text-white mb-1">No Children Registered</h3>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto mb-5">
                            Add your child profile to generate their vaccination schedule.
                        </p>
                        <button
                            onClick={() => setShowModal(true)}
                            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs"
                        >
                            Add Child Profile
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {children.map((child) => {
                            const pct = child.stats.total ? Math.round((child.stats.completed / child.stats.total) * 100) : 0;

                            return (
                                <div
                                    key={child.id}
                                    className="bg-slate-900 rounded-2xl p-6 border border-slate-800 flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex items-center space-x-3 mb-4">
                                            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white text-lg">
                                                {child.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-white">{child.name}</h3>
                                                <p className="text-xs text-slate-400 mt-0.5">
                                                    DOB: {new Date(child.dob).toLocaleDateString()} ({child.gender})
                                                </p>
                                            </div>
                                        </div>

                                        <div className="my-4 p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                                            <div className="flex justify-between text-xs text-slate-300 font-semibold">
                                                <span>Vaccination Progress</span>
                                                <span className="text-blue-400">{pct}% ({child.stats.completed}/{child.stats.total})</span>
                                            </div>
                                            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                                <div
                                                    className="bg-blue-500 h-full rounded-full transition-all duration-300"
                                                    style={{ width: `${pct}%` }}
                                                ></div>
                                            </div>

                                            <div className="grid grid-cols-3 gap-2 pt-1 text-center text-[11px]">
                                                <div className="bg-emerald-500/10 p-1.5 rounded-lg text-emerald-400 font-semibold">
                                                    <div>{child.stats.completed} Done</div>
                                                </div>
                                                <div className="bg-amber-500/10 p-1.5 rounded-lg text-amber-400 font-semibold">
                                                    <div>{child.stats.pending} Pending</div>
                                                </div>
                                                <div className="bg-rose-500/10 p-1.5 rounded-lg text-rose-400 font-semibold">
                                                    <div>{child.stats.overdue} Overdue</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => navigate(`/parent/child/${child.id}`)}
                                        className="w-full py-2.5 bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white font-semibold rounded-xl text-xs flex items-center justify-center space-x-2 transition border border-slate-700 hover:border-blue-500"
                                    >
                                        <span>View Vaccination Schedule</span>
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modal: Add Child Profile */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80">
                    <div className="bg-slate-900 w-full max-w-md p-6 rounded-2xl border border-slate-800 shadow-xl">
                        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                            <h3 className="text-base font-bold text-white">Add Child Profile</h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white text-sm">✕</button>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleAddChild} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Child's Name</label>
                                <input
                                    type="text"
                                    required
                                    value={newChild.name}
                                    onChange={(e) => setNewChild({ ...newChild, name: e.target.value })}
                                    placeholder="Child Name"
                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Date of Birth</label>
                                <input
                                    type="date"
                                    required
                                    value={newChild.dob}
                                    onChange={(e) => setNewChild({ ...newChild, dob: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm text-slate-200"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Gender</label>
                                    <select
                                        value={newChild.gender}
                                        onChange={(e) => setNewChild({ ...newChild, gender: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm"
                                    >
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Blood Group</label>
                                    <input
                                        type="text"
                                        value={newChild.bloodGroup}
                                        onChange={(e) => setNewChild({ ...newChild, bloodGroup: e.target.value })}
                                        placeholder="O+"
                                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center space-x-3 pt-3 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="w-1/2 py-2.5 bg-slate-800 text-slate-300 text-sm font-semibold rounded-xl"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-1/2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50"
                                >
                                    {submitting ? 'Saving...' : 'Save & Schedule'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
