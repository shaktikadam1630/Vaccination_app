import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import Navbar from '../../components/Navbar';
import StatusBadge from '../../components/StatusBadge';
import { Syringe, Search, CheckCircle2, Phone, Calendar, Clock, Edit2, Smartphone } from 'lucide-react';

export default function CentreDashboard() {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Administer Dose Modal state
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [administerForm, setAdministerForm] = useState({
        administeredDate: new Date().toISOString().split('T')[0],
        batchNumber: '',
        notes: ''
    });

    // Reschedule Modal state (Centre Authority)
    const [rescheduleRecord, setRescheduleRecord] = useState(null);
    const [rescheduleForm, setRescheduleForm] = useState({
        preferredDate: '',
        preferredTimeSlot: '09:00 AM - 11:00 AM',
        notes: ''
    });

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [smsAlert, setSmsAlert] = useState('');

    const fetchRecords = async () => {
        setLoading(true);
        try {
            let url = `/centre/records?`;
            if (statusFilter) url += `status=${statusFilter}&`;
            if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}&`;

            const res = await api.get(url);
            setRecords(res.data.records || []);
        } catch (err) {
            console.error('Error fetching centre records:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecords();
    }, [statusFilter]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        fetchRecords();
    };

    const handleMarkAdministered = async (e) => {
        e.preventDefault();
        if (!selectedRecord) return;
        setError('');
        setSubmitting(true);

        try {
            await api.patch(`/centre/records/${selectedRecord.id}/administer`, administerForm);
            setSelectedRecord(null);
            setAdministerForm({
                administeredDate: new Date().toISOString().split('T')[0],
                batchNumber: '',
                notes: ''
            });
            fetchRecords();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update record.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleOpenRescheduleModal = (rec) => {
        setRescheduleRecord(rec);
        setRescheduleForm({
            preferredDate: rec.preferred_date ? new Date(rec.preferred_date).toISOString().split('T')[0] : new Date(rec.due_date).toISOString().split('T')[0],
            preferredTimeSlot: rec.preferred_time_slot || '09:00 AM - 11:00 AM',
            notes: rec.notes || ''
        });
    };

    const handleSaveCentreReschedule = async (e) => {
        e.preventDefault();
        if (!rescheduleRecord) return;
        setError('');
        setSubmitting(true);

        try {
            const res = await api.patch(`/centre/records/${rescheduleRecord.id}/reschedule`, rescheduleForm);
            setSmsAlert(res.data.smsAlert || 'Appointment rescheduled. Parent notified via SMS.');
            setRescheduleRecord(null);
            fetchRecords();
            setTimeout(() => setSmsAlert(''), 6000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reschedule appointment.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 pb-16">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
                {/* Simulated SMS Notification Banner */}
                {smsAlert && (
                    <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center space-x-3 animate-fade-in shadow-xl">
                        <Smartphone className="w-5 h-5 shrink-0 text-emerald-400" />
                        <div>
                            <div className="font-bold text-white uppercase text-[10px] tracking-wider text-emerald-400">SMS Notification Triggered</div>
                            <div className="text-slate-200 mt-0.5">{smsAlert}</div>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 bg-slate-900 p-6 rounded-2xl border border-slate-800">
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Vaccination Doses Queue</h1>
                        <p className="text-xs text-slate-400 mt-1">Verify child records, reschedule appointments, and log administered vaccine batch numbers</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <form onSubmit={handleSearchSubmit} className="relative">
                            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                            <input
                                type="text"
                                placeholder="Search child or phone..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-blue-500 focus:outline-none w-48"
                            />
                        </form>

                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-semibold"
                        >
                            <option value="">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="overdue">Overdue</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>
                </div>

                {/* Queue Table */}
                <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
                    {loading ? (
                        <div className="py-12 text-center text-slate-500 text-xs">Loading queue...</div>
                    ) : records.length === 0 ? (
                        <div className="p-10 text-center text-slate-400 text-xs">No vaccination records found.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider border-b border-slate-800 font-semibold">
                                    <tr>
                                        <th className="px-5 py-3.5">Child Name & DOB</th>
                                        <th className="px-5 py-3.5">Parent Contact</th>
                                        <th className="px-5 py-3.5">Vaccine & Dose</th>
                                        <th className="px-5 py-3.5">Scheduled Date & Slot</th>
                                        <th className="px-5 py-3.5">Status</th>
                                        <th className="px-5 py-3.5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/80">
                                    {records.map((rec) => {
                                        const apptDate = rec.preferred_date ? new Date(rec.preferred_date).toLocaleDateString() : new Date(rec.due_date).toLocaleDateString();
                                        const timeSlot = rec.preferred_time_slot || '09:00 AM - 11:00 AM';

                                        return (
                                            <tr key={rec.id} className="hover:bg-slate-800/40 transition">
                                                <td className="px-5 py-3.5">
                                                    <div className="font-bold text-white text-sm">{rec.child_name}</div>
                                                    <div className="text-[11px] text-slate-400">DOB: {new Date(rec.child_dob).toLocaleDateString()}</div>
                                                </td>

                                                <td className="px-5 py-3.5">
                                                    <div className="font-medium text-slate-200">{rec.parent_name}</div>
                                                    <div className="text-slate-400 flex items-center gap-1 text-[11px]">
                                                        <Phone className="w-3 h-3 text-slate-500" />
                                                        {rec.parent_phone}
                                                    </div>
                                                </td>

                                                <td className="px-5 py-3.5">
                                                    <div className="font-semibold text-blue-400">{rec.vaccine_name}</div>
                                                    <div className="text-[11px] text-slate-400">Dose {rec.dose_number}</div>
                                                </td>

                                                <td className="px-5 py-3.5">
                                                    <div className="font-medium text-slate-200 flex items-center space-x-1.5">
                                                        <Calendar className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                                        <span>{apptDate}</span>
                                                    </div>
                                                    {rec.status !== 'completed' && (
                                                        <div className="text-[11px] text-slate-400 flex items-center space-x-1 mt-0.5 font-mono">
                                                            <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                                                            <span>{timeSlot}</span>
                                                        </div>
                                                    )}
                                                    {rec.rescheduled_by && (
                                                        <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-amber-400 font-semibold border border-slate-700">
                                                            Rescheduled ({rec.rescheduled_by})
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="px-5 py-3.5">
                                                    <StatusBadge status={rec.status} />
                                                </td>

                                                <td className="px-5 py-3.5 text-right">
                                                    {rec.status === 'completed' ? (
                                                        <div className="text-emerald-400 font-mono text-[11px]">
                                                            Batch: {rec.batch_number}
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center justify-end space-x-2">
                                                            <button
                                                                onClick={() => handleOpenRescheduleModal(rec)}
                                                                className="px-2.5 py-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white text-xs font-semibold rounded-lg border border-blue-500/30 flex items-center space-x-1 transition"
                                                            >
                                                                <Edit2 className="w-3.5 h-3.5" />
                                                                <span>Reschedule</span>
                                                            </button>

                                                            <button
                                                                onClick={() => setSelectedRecord(rec)}
                                                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition"
                                                            >
                                                                Administer
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal: Administer Dose */}
            {selectedRecord && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80">
                    <div className="bg-slate-900 w-full max-w-md p-6 rounded-2xl border border-slate-800 shadow-xl">
                        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                            <h3 className="text-base font-bold text-white">Record Administered Dose</h3>
                            <button onClick={() => setSelectedRecord(null)} className="text-slate-400 hover:text-white text-sm">✕</button>
                        </div>

                        <div className="bg-slate-950 p-3 rounded-xl mb-4 border border-slate-800 text-xs space-y-1">
                            <p className="text-white font-bold">{selectedRecord.child_name} — {selectedRecord.vaccine_name}</p>
                            <p className="text-slate-400">Parent: {selectedRecord.parent_name} ({selectedRecord.parent_phone})</p>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleMarkAdministered} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Date Administered</label>
                                <input
                                    type="date"
                                    required
                                    value={administerForm.administeredDate}
                                    onChange={(e) => setAdministerForm({ ...administerForm, administeredDate: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Batch Number</label>
                                <input
                                    type="text"
                                    required
                                    value={administerForm.batchNumber}
                                    onChange={(e) => setAdministerForm({ ...administerForm, batchNumber: e.target.value })}
                                    placeholder="BATCH-2026-X99"
                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm font-mono"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Notes (Optional)</label>
                                <textarea
                                    rows="2"
                                    value={administerForm.notes}
                                    onChange={(e) => setAdministerForm({ ...administerForm, notes: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm"
                                ></textarea>
                            </div>

                            <div className="flex items-center space-x-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setSelectedRecord(null)}
                                    className="w-1/2 py-2.5 bg-slate-800 text-slate-300 text-sm font-semibold rounded-xl"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50"
                                >
                                    {submitting ? 'Saving...' : 'Confirm Administered'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Centre Staff Reschedule Appointment */}
            {rescheduleRecord && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80">
                    <div className="bg-slate-900 w-full max-w-md p-6 rounded-2xl border border-slate-800 shadow-xl">
                        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-blue-400" />
                                <span>Reschedule Child Appointment</span>
                            </h3>
                            <button onClick={() => setRescheduleRecord(null)} className="text-slate-400 hover:text-white text-sm">✕</button>
                        </div>

                        <div className="bg-slate-950 p-3 rounded-xl mb-4 border border-slate-800 text-xs">
                            <div className="text-white font-bold">{rescheduleRecord.child_name} — {rescheduleRecord.vaccine_name}</div>
                            <div className="text-slate-400 mt-0.5">Parent Phone: <strong className="text-emerald-400">{rescheduleRecord.parent_phone}</strong></div>
                        </div>

                        <form onSubmit={handleSaveCentreReschedule} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">New Appointment Date</label>
                                <input
                                    type="date"
                                    required
                                    value={rescheduleForm.preferredDate}
                                    onChange={(e) => setRescheduleForm({ ...rescheduleForm, preferredDate: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">New Time Slot</label>
                                <select
                                    value={rescheduleForm.preferredTimeSlot}
                                    onChange={(e) => setRescheduleForm({ ...rescheduleForm, preferredTimeSlot: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono"
                                >
                                    <option value="09:00 AM - 11:00 AM">09:00 AM - 11:00 AM (Morning Slot)</option>
                                    <option value="11:00 AM - 01:00 PM">11:00 AM - 01:00 PM (Midday Slot)</option>
                                    <option value="02:00 PM - 04:00 PM">02:00 PM - 04:00 PM (Afternoon Slot)</option>
                                    <option value="04:00 PM - 06:00 PM">04:00 PM - 06:00 PM (Evening Slot)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Reason / Notes for Parent</label>
                                <textarea
                                    rows="2"
                                    value={rescheduleForm.notes}
                                    onChange={(e) => setRescheduleForm({ ...rescheduleForm, notes: e.target.value })}
                                    placeholder="e.g. Doctor unavailable on original date, rescheduled to morning slot."
                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                                ></textarea>
                            </div>

                            <div className="flex items-center space-x-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setRescheduleRecord(null)}
                                    className="w-1/2 py-2.5 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-1/2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition disabled:opacity-50"
                                >
                                    {submitting ? 'Sending SMS...' : 'Confirm & Send SMS'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
