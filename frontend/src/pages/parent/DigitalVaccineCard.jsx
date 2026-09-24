import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api/client';
import Navbar from '../../components/Navbar';
import StatusBadge from '../../components/StatusBadge';
import { ArrowLeft, Syringe, Calendar, Building2, CheckCircle2, MapPin, Printer, Clock, Edit2, Trash2, Smartphone, AlertCircle } from 'lucide-react';

export default function DigitalVaccineCard() {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [centres, setCentres] = useState([]);
    
    // Reschedule & Edit Modal State
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [rescheduleForm, setRescheduleForm] = useState({
        centreId: '',
        preferredDate: '',
        preferredTimeSlot: '09:00 AM - 11:00 AM'
    });
    const [saving, setSaving] = useState(false);
    const [smsAlert, setSmsAlert] = useState('');

    const navigate = useNavigate();

    const fetchSchedule = async () => {
        try {
            const res = await api.get(`/parent/children/${id}/schedule`);
            setData(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch vaccination schedule.');
        } finally {
            setLoading(false);
        }
    };

    const fetchCentres = async () => {
        try {
            const res = await api.get('/parent/centres/nearby?lat=28.6139&lng=77.2090&radius=all');
            setCentres(res.data.centres || []);
        } catch (err) {
            console.error('Error fetching centres:', err);
        }
    };

    useEffect(() => {
        fetchSchedule();
        fetchCentres();
    }, [id]);

    const handleOpenRescheduleModal = (record) => {
        setSelectedRecord(record);
        setRescheduleForm({
            centreId: record.preferred_centre_id ? record.preferred_centre_id.toString() : '',
            preferredDate: record.preferred_date ? new Date(record.preferred_date).toISOString().split('T')[0] : new Date(record.due_date).toISOString().split('T')[0],
            preferredTimeSlot: record.preferred_time_slot || '09:00 AM - 11:00 AM'
        });
    };

    const handleSaveReschedule = async (e) => {
        e.preventDefault();
        if (!selectedRecord) return;

        setSaving(true);
        try {
            const res = await api.patch(`/parent/records/${selectedRecord.id}/reschedule`, {
                centreId: rescheduleForm.centreId ? parseInt(rescheduleForm.centreId) : null,
                preferredDate: rescheduleForm.preferredDate,
                preferredTimeSlot: rescheduleForm.preferredTimeSlot
            });

            setSmsAlert(res.data.smsAlert || 'Appointment rescheduled successfully!');
            setSelectedRecord(null);
            fetchSchedule();
            setTimeout(() => setSmsAlert(''), 6000);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to reschedule vaccination.');
        } finally {
            setSaving(false);
        }
    };

    const handleClearCentre = async (recordId, vaccineName) => {
        if (!window.confirm(`Are you sure you want to remove the preferred centre for ${vaccineName}?`)) return;

        try {
            const res = await api.delete(`/parent/records/${recordId}/preferred-centre`);
            setSmsAlert(res.data.smsAlert || 'Preferred centre removed.');
            fetchSchedule();
            setTimeout(() => setSmsAlert(''), 6000);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to clear preferred centre.');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950">
                <Navbar />
                <div className="py-20 text-center text-slate-500 text-xs">Loading vaccination card...</div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-slate-950">
                <Navbar />
                <div className="max-w-4xl mx-auto px-4 pt-12 text-center">
                    <div className="bg-slate-900 p-8 rounded-2xl border border-rose-500/30 text-rose-400 text-sm">
                        {error || 'Child profile not found.'}
                    </div>
                </div>
            </div>
        );
    }

    const { child, schedule } = data;
    const completedDoses = schedule.filter(s => s.status === 'completed').length;
    const totalDoses = schedule.length;
    const completionPercentage = totalDoses ? Math.round((completedDoses / totalDoses) * 100) : 0;

    return (
        <div className="min-h-screen bg-slate-950 pb-16">
            <Navbar />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
                {/* Simulated SMS Alert Banner */}
                {smsAlert && (
                    <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center space-x-3 animate-fade-in shadow-xl">
                        <Smartphone className="w-5 h-5 shrink-0 text-emerald-400" />
                        <div>
                            <div className="font-bold text-white uppercase text-[10px] tracking-wider text-emerald-400">SMS Notification Alert</div>
                            <div className="text-slate-200 mt-0.5">{smsAlert}</div>
                        </div>
                    </div>
                )}

                {/* Header Back & Print */}
                <div className="flex items-center justify-between mb-6 no-print">
                    <button
                        onClick={() => navigate('/parent')}
                        className="flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-white transition"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to My Children</span>
                    </button>

                    <button
                        onClick={() => window.print()}
                        className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center space-x-2 border border-slate-700 transition"
                    >
                        <Printer className="w-4 h-4" />
                        <span>Print Vaccination Card</span>
                    </button>
                </div>

                {/* Card Header */}
                <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-lg mb-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
                        <div className="flex items-center space-x-5">
                            <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center font-bold text-white text-2xl shadow-md shrink-0">
                                {child.name.charAt(0)}
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white tracking-tight">{child.name}</h1>
                                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1.5">
                                    <span>DOB: <strong className="text-slate-200">{new Date(child.dob).toLocaleDateString()}</strong></span>
                                    <span>•</span>
                                    <span className="capitalize">Gender: <strong className="text-slate-200">{child.gender}</strong></span>
                                    {child.blood_group && (
                                        <>
                                            <span>•</span>
                                            <span>Blood Group: <strong className="text-rose-400">{child.blood_group}</strong></span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center space-x-5 text-center shrink-0">
                            <div>
                                <div className="text-xl font-bold text-emerald-400">{completedDoses}</div>
                                <div className="text-[11px] text-slate-400 font-medium">Completed</div>
                            </div>
                            <div className="h-6 w-px bg-slate-800"></div>
                            <div>
                                <div className="text-xl font-bold text-amber-400">
                                    {schedule.filter(s => s.status === 'pending').length}
                                </div>
                                <div className="text-[11px] text-slate-400 font-medium">Pending</div>
                            </div>
                            <div className="h-6 w-px bg-slate-800"></div>
                            <div>
                                <div className="text-xl font-bold text-rose-400">
                                    {schedule.filter(s => s.status === 'overdue').length}
                                </div>
                                <div className="text-[11px] text-slate-400 font-medium">Overdue</div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-5">
                        <div className="flex justify-between text-xs text-slate-300 font-semibold mb-2">
                            <span>Immunization Progress</span>
                            <span className="text-blue-400">{completedDoses} of {totalDoses} Doses Administered ({completionPercentage}%)</span>
                        </div>
                        <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                            <div
                                className="bg-blue-500 h-full rounded-full transition-all duration-500"
                                style={{ width: `${completionPercentage}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Schedule Table */}
                <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
                    <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                        <h2 className="text-base font-bold text-white flex items-center gap-2">
                            <Syringe className="w-4 h-4 text-blue-400" />
                            <span>Vaccination Schedule & Records</span>
                        </h2>
                        <Link
                            to="/parent/nearby"
                            className="no-print text-xs text-blue-400 hover:underline font-semibold"
                        >
                            Find Nearby Centre
                        </Link>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider border-b border-slate-800 font-semibold">
                                <tr>
                                    <th className="px-5 py-3.5">Vaccine & Target Disease</th>
                                    <th className="px-5 py-3.5">Dose #</th>
                                    <th className="px-5 py-3.5">Scheduled Date & Slot</th>
                                    <th className="px-5 py-3.5">Status</th>
                                    <th className="px-5 py-3.5">Administered Details</th>
                                    <th className="px-5 py-3.5">Preferred Centre</th>
                                    <th className="px-5 py-3.5 text-right no-print">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/80">
                                {schedule.map((item) => {
                                    const apptDate = item.preferred_date ? new Date(item.preferred_date).toLocaleDateString() : new Date(item.due_date).toLocaleDateString();
                                    const timeSlot = item.preferred_time_slot || '09:00 AM - 11:00 AM';

                                    return (
                                        <tr key={item.id} className="hover:bg-slate-800/40 transition">
                                            <td className="px-5 py-3.5">
                                                <div className="font-bold text-white text-sm">{item.vaccine_name}</div>
                                                <div className="text-[11px] text-slate-400 mt-0.5">{item.target_disease}</div>
                                            </td>

                                            <td className="px-5 py-3.5 font-semibold text-slate-300">
                                                Dose {item.dose_number}
                                            </td>

                                            <td className="px-5 py-3.5">
                                                <div className="font-medium text-slate-200 flex items-center space-x-1.5">
                                                    <Calendar className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                                    <span>{apptDate}</span>
                                                </div>
                                                {item.status !== 'completed' && (
                                                    <div className="text-[11px] text-slate-400 flex items-center space-x-1 mt-0.5 font-mono">
                                                        <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                                                        <span>{timeSlot}</span>
                                                    </div>
                                                )}
                                                {item.rescheduled_by && (
                                                    <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-amber-400 font-semibold border border-slate-700">
                                                        Rescheduled by {item.rescheduled_by}
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-5 py-3.5">
                                                <StatusBadge status={item.status} />
                                            </td>

                                            <td className="px-5 py-3.5">
                                                {item.status === 'completed' ? (
                                                    <div className="space-y-0.5 text-slate-300">
                                                        <div className="text-emerald-400 font-semibold">
                                                            Given: {new Date(item.administered_date).toLocaleDateString()}
                                                        </div>
                                                        <div>Batch #: <span className="font-mono text-slate-200">{item.batch_number}</span></div>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-500 italic">Not administered</span>
                                                )}
                                            </td>

                                            <td className="px-5 py-3.5">
                                                {item.preferred_centre_name ? (
                                                    <div className="text-blue-400 font-medium">
                                                        {item.preferred_centre_name}
                                                    </div>
                                                ) : item.status !== 'completed' ? (
                                                    <span className="text-slate-500 italic">No centre selected</span>
                                                ) : (
                                                    <span className="text-slate-600">-</span>
                                                )}
                                            </td>

                                            <td className="px-5 py-3.5 text-right no-print">
                                                {item.status !== 'completed' && (
                                                    <div className="flex items-center justify-end space-x-2">
                                                        <button
                                                            onClick={() => handleOpenRescheduleModal(item)}
                                                            className="px-2.5 py-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white text-xs font-semibold rounded-lg border border-blue-500/30 flex items-center space-x-1 transition"
                                                            title="Reschedule Date & Preferred Centre"
                                                        >
                                                            <Edit2 className="w-3.5 h-3.5" />
                                                            <span>Reschedule</span>
                                                        </button>

                                                        {item.preferred_centre_id && (
                                                            <button
                                                                onClick={() => handleClearCentre(item.id, item.vaccine_name)}
                                                                className="p-1.5 bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white rounded-lg transition"
                                                                title="Clear Preferred Centre"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal: Parent Reschedule Date, Time Slot & Preferred Centre */}
            {selectedRecord && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80">
                    <div className="bg-slate-900 w-full max-w-md p-6 rounded-2xl border border-slate-800 shadow-xl">
                        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-blue-400" />
                                <span>Reschedule Dose & Preferred Centre</span>
                            </h3>
                            <button onClick={() => setSelectedRecord(null)} className="text-slate-400 hover:text-white text-sm">✕</button>
                        </div>

                        <div className="bg-slate-950 p-3 rounded-xl mb-4 border border-slate-800 text-xs">
                            <div className="text-white font-bold">{selectedRecord.vaccine_name} (Dose {selectedRecord.dose_number})</div>
                            <div className="text-slate-400 mt-0.5">Target: {selectedRecord.target_disease}</div>
                        </div>

                        <form onSubmit={handleSaveReschedule} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Preferred Healthcare Centre</label>
                                <select
                                    value={rescheduleForm.centreId}
                                    onChange={(e) => setRescheduleForm({ ...rescheduleForm, centreId: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                                >
                                    <option value="">-- No Centre Selected --</option>
                                    {centres.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name} ({c.address})</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Preferred Vaccination Date</label>
                                <input
                                    type="date"
                                    required
                                    value={rescheduleForm.preferredDate}
                                    onChange={(e) => setRescheduleForm({ ...rescheduleForm, preferredDate: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Preferred Time Slot</label>
                                <select
                                    value={rescheduleForm.preferredTimeSlot}
                                    onChange={(e) => setRescheduleForm({ ...rescheduleForm, preferredTimeSlot: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono"
                                >
                                    <option value="09:00 AM - 11:00 AM">09:00 AM - 11:00 AM (Morning)</option>
                                    <option value="11:00 AM - 01:00 PM">11:00 AM - 01:00 PM (Midday)</option>
                                    <option value="02:00 PM - 04:00 PM">02:00 PM - 04:00 PM (Afternoon)</option>
                                    <option value="04:00 PM - 06:00 PM">04:00 PM - 06:00 PM (Evening)</option>
                                </select>
                            </div>

                            <div className="flex items-center space-x-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setSelectedRecord(null)}
                                    className="w-1/2 py-2.5 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-1/2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition disabled:opacity-50"
                                >
                                    {saving ? 'Saving...' : 'Confirm Reschedule'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
