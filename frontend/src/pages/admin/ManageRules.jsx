import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import Navbar from '../../components/Navbar';
import { Calendar, Plus, Edit, Trash2 } from 'lucide-react';

export default function ManageRules() {
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingRule, setEditingRule] = useState(null);
    const [formData, setFormData] = useState({
        vaccineName: '',
        doseNumber: 1,
        offsetDays: 0,
        targetDisease: '',
        description: '',
        isMandatory: true
    });
    const [submitting, setSubmitting] = useState(false);

    const fetchRules = async () => {
        try {
            const res = await api.get('/admin/vaccine-rules');
            setRules(res.data.rules || []);
        } catch (err) {
            console.error('Error fetching vaccine rules:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRules();
    }, []);

    const handleOpenModal = (rule = null) => {
        if (rule) {
            setEditingRule(rule);
            setFormData({
                vaccineName: rule.vaccine_name,
                doseNumber: rule.dose_number,
                offsetDays: rule.offset_days,
                targetDisease: rule.target_disease,
                description: rule.description || '',
                isMandatory: rule.is_mandatory !== 0
            });
        } else {
            setEditingRule(null);
            setFormData({
                vaccineName: '',
                doseNumber: 1,
                offsetDays: 0,
                targetDisease: '',
                description: '',
                isMandatory: true
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingRule) {
                await api.put(`/admin/vaccine-rules/${editingRule.id}`, formData);
            } else {
                await api.post('/admin/vaccine-rules', formData);
            }
            setShowModal(false);
            fetchRules();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to save vaccine rule.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (ruleId) => {
        if (!window.confirm('Are you sure you want to delete this vaccine rule?')) return;
        try {
            await api.delete(`/admin/vaccine-rules/${ruleId}`);
            fetchRules();
        } catch (err) {
            alert('Failed to delete vaccine rule.');
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 pb-16">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
                <div className="flex items-center justify-between gap-4 mb-6 bg-slate-900 p-6 rounded-2xl border border-slate-800">
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Vaccine Schedule Rules</h1>
                        <p className="text-xs text-slate-400 mt-1">Configure target diseases, dose numbers, and offset days from DOB</p>
                    </div>

                    <button
                        onClick={() => handleOpenModal()}
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-xs flex items-center space-x-1.5 transition"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Add Vaccine Rule</span>
                    </button>
                </div>

                <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
                    {loading ? (
                        <div className="py-12 text-center text-slate-500 text-xs">Loading vaccine rules...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider border-b border-slate-800 font-semibold">
                                    <tr>
                                        <th className="px-5 py-3.5">Vaccine Name</th>
                                        <th className="px-5 py-3.5">Dose #</th>
                                        <th className="px-5 py-3.5">Offset Days</th>
                                        <th className="px-5 py-3.5">Target Disease</th>
                                        <th className="px-5 py-3.5">Description</th>
                                        <th className="px-5 py-3.5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/80">
                                    {rules.map((rule) => (
                                        <tr key={rule.id} className="hover:bg-slate-800/40 transition">
                                            <td className="px-5 py-3.5 font-bold text-white">
                                                {rule.vaccine_name}
                                            </td>

                                            <td className="px-5 py-3.5 text-slate-300">
                                                Dose {rule.dose_number}
                                            </td>

                                            <td className="px-5 py-3.5 font-mono text-blue-400 font-bold">
                                                +{rule.offset_days} Days
                                            </td>

                                            <td className="px-5 py-3.5 text-slate-200">
                                                {rule.target_disease}
                                            </td>

                                            <td className="px-5 py-3.5 text-slate-400 max-w-xs truncate">
                                                {rule.description || '-'}
                                            </td>

                                            <td className="px-5 py-3.5 text-right space-x-2">
                                                <button
                                                    onClick={() => handleOpenModal(rule)}
                                                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                                                >
                                                    <Edit className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(rule.id)}
                                                    className="p-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 rounded-lg"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
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

            {/* Modal: Add/Edit Rule */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80">
                    <div className="bg-slate-900 w-full max-w-md p-6 rounded-2xl border border-slate-800 shadow-xl">
                        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                            <h3 className="text-base font-bold text-white">
                                {editingRule ? 'Edit Vaccine Rule' : 'Add Vaccine Rule'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white text-sm">✕</button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Vaccine Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.vaccineName}
                                    onChange={(e) => setFormData({ ...formData, vaccineName: e.target.value })}
                                    placeholder="Pentavalent"
                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Dose Number</label>
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        value={formData.doseNumber}
                                        onChange={(e) => setFormData({ ...formData, doseNumber: parseInt(e.target.value) || 1 })}
                                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Offset Days from DOB</label>
                                    <input
                                        type="number"
                                        min="0"
                                        required
                                        value={formData.offsetDays}
                                        onChange={(e) => setFormData({ ...formData, offsetDays: parseInt(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Target Disease</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.targetDisease}
                                    onChange={(e) => setFormData({ ...formData, targetDisease: e.target.value })}
                                    placeholder="Diphtheria, Tetanus, Pertussis"
                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Description</label>
                                <textarea
                                    rows="2"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm"
                                ></textarea>
                            </div>

                            <div className="flex items-center space-x-3 pt-2">
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
                                    {submitting ? 'Saving...' : 'Save Rule'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
