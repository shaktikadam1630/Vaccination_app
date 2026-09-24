import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import Navbar from '../../components/Navbar';
import { Package, Save } from 'lucide-react';

export default function CentreInventory() {
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newItem, setNewItem] = useState({ vaccineName: 'BCG', availableDoses: 50 });
    const [submitting, setSubmitting] = useState(false);

    const vaccineOptions = [
        'BCG', 'OPV-0', 'Hepatitis B-0', 'OPV-1', 'Pentavalent-1', 'Rota-1', 'fIPV-1', 'PCV-1',
        'OPV-2', 'Pentavalent-2', 'Rota-2', 'OPV-3', 'Pentavalent-3', 'Rota-3', 'fIPV-2', 'PCV-2',
        'MR-1', 'JE-1', 'PCV-Booster', 'MR-2', 'JE-2', 'DPT-Booster 1', 'OPV-Booster', 'DPT-Booster 2', 'Td (10 Yrs)', 'Td (16 Yrs)'
    ];

    const fetchInventory = async () => {
        try {
            const res = await api.get('/centre/inventory');
            setInventory(res.data.inventory || []);
        } catch (err) {
            console.error('Error fetching inventory:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInventory();
    }, []);

    const handleUpdateStock = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.put('/centre/inventory', newItem);
            fetchInventory();
        } catch (err) {
            alert('Failed to update inventory stock.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 pb-16">
            <Navbar />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-slate-900 p-6 rounded-2xl border border-slate-800">
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Vaccine Stock</h1>
                        <p className="text-xs text-slate-400 mt-1">Manage available vaccine dose counts at your centre</p>
                    </div>

                    <form onSubmit={handleUpdateStock} className="flex items-center space-x-2 shrink-0">
                        <select
                            value={newItem.vaccineName}
                            onChange={(e) => setNewItem({ ...newItem, vaccineName: e.target.value })}
                            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white text-xs"
                        >
                            {vaccineOptions.map(v => (
                                <option key={v} value={v}>{v}</option>
                            ))}
                        </select>

                        <input
                            type="number"
                            min="0"
                            value={newItem.availableDoses}
                            onChange={(e) => setNewItem({ ...newItem, availableDoses: parseInt(e.target.value) || 0 })}
                            className="w-20 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white text-xs text-center font-mono"
                        />

                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg flex items-center space-x-1"
                        >
                            <Save className="w-3.5 h-3.5" />
                            <span>Update Stock</span>
                        </button>
                    </form>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {loading ? (
                        <div className="col-span-full text-center py-12 text-slate-500 text-xs">Loading stock levels...</div>
                    ) : inventory.length === 0 ? (
                        <div className="col-span-full text-center py-12 text-slate-500 text-xs">
                            No vaccine stock records initialized yet.
                        </div>
                    ) : (
                        inventory.map(item => (
                            <div key={item.id} className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-bold text-white">{item.vaccine_name}</h3>
                                    <p className="text-[11px] text-slate-400 mt-0.5">Available Doses</p>
                                </div>

                                <div className={`text-xl font-bold px-3 py-1 rounded-lg border font-mono ${
                                    item.available_doses > 20
                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                        : item.available_doses > 0
                                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                }`}>
                                    {item.available_doses}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
