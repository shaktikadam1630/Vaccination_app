import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import Navbar from '../../components/Navbar';
import { MapPin, Navigation, Phone, Clock, Search, BookmarkCheck, CheckCircle2, AlertCircle } from 'lucide-react';

export default function NearbyCentres() {
    const [coords, setCoords] = useState({ lat: '28.6139', lng: '77.2090' });
    const radius = '50'; // Default 50km radius
    const [centres, setCentres] = useState([]);
    const [children, setChildren] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Save Centre Modal state
    const [selectedCentre, setSelectedCentre] = useState(null);
    const [selectedChildId, setSelectedChildId] = useState('');
    const [saving, setSaving] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    const fetchCentres = async (latitude, longitude) => {
        setLoading(true);
        try {
            const res = await api.get(`/parent/centres/nearby?lat=${latitude}&lng=${longitude}&radius=${radius}`);
            setCentres(res.data.centres || []);
        } catch (err) {
            console.error('Error fetching nearby centres:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchParentChildren = async () => {
        try {
            const res = await api.get('/parent/children');
            const childList = res.data.children || [];
            setChildren(childList);
            if (childList.length > 0) {
                setSelectedChildId(childList[0].id.toString());
            }
        } catch (err) {
            console.error('Error fetching children:', err);
        }
    };

    useEffect(() => {
        fetchParentChildren();
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const userLat = pos.coords.latitude.toFixed(6);
                    const userLng = pos.coords.longitude.toFixed(6);
                    setCoords({ lat: userLat, lng: userLng });
                    fetchCentres(userLat, userLng);
                },
                () => {
                    fetchCentres(coords.lat, coords.lng);
                }
            );
        } else {
            fetchCentres(coords.lat, coords.lng);
        }
    }, []);

    const handleSaveCentreForChild = async (e) => {
        e.preventDefault();
        if (!selectedCentre || !selectedChildId) return;

        setSaving(true);
        try {
            const res = await api.patch(`/parent/children/${selectedChildId}/preferred-centre`, {
                centreId: selectedCentre.id
            });

            setToastMessage(res.data.message || `Saved '${selectedCentre.name}' for child's upcoming doses.`);
            setSelectedCentre(null);
            setTimeout(() => setToastMessage(''), 4000);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to save centre.');
        } finally {
            setSaving(false);
        }
    };

    const filteredCentres = centres.filter((c) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            c.name.toLowerCase().includes(q) ||
            (c.address && c.address.toLowerCase().includes(q)) ||
            (c.phone && c.phone.toLowerCase().includes(q)) ||
            (c.license_number && c.license_number.toLowerCase().includes(q))
        );
    });

    return (
        <div className="min-h-screen bg-slate-950 pb-16">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
                {/* Toast Success Message */}
                {toastMessage && (
                    <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center space-x-2 animate-fade-in shadow-lg">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>{toastMessage}</span>
                    </div>
                )}

                {/* Header & Search Bar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 bg-slate-900 p-6 rounded-2xl border border-slate-800">
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Nearby Healthcare Centres</h1>
                    </div>

                    {/* Specific Search Option */}
                    <div className="relative w-full md:w-80">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search by centre name, location..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-8 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs font-bold"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                </div>

                {/* Directory Grid */}
                {loading ? (
                    <div className="py-16 text-center text-slate-500 text-xs">Finding healthcare centres...</div>
                ) : filteredCentres.length === 0 ? (
                    <div className="bg-slate-900 p-12 rounded-2xl text-center border border-slate-800 text-slate-400 text-xs">
                        <AlertCircle className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                        {searchQuery
                            ? `No healthcare centres matching "${searchQuery}" found.`
                            : 'No approved healthcare centres found.'}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCentres.map((centre) => (
                            <div key={centre.id} className="bg-slate-900 rounded-2xl p-6 border border-slate-800 flex flex-col justify-between">
                                <div>
                                    <div className="flex items-start justify-between mb-3">
                                        <h3 className="text-lg font-bold text-white tracking-tight">{centre.name}</h3>
                                        <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-lg text-xs font-bold shrink-0">
                                            {centre.distanceKm} km away
                                        </span>
                                    </div>

                                    <div className="space-y-2 text-xs text-slate-300 my-4">
                                        <div className="flex items-start space-x-2">
                                            <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                                            <span>{centre.address}</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                                            <span>Working Hours: {centre.working_hours}</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Phone className="w-4 h-4 text-slate-500 shrink-0" />
                                            <span>Contact: {centre.phone}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-3 border-t border-slate-800">
                                    <button
                                        onClick={() => setSelectedCentre(centre)}
                                        className="w-full py-2 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white font-semibold rounded-xl text-xs flex items-center justify-center space-x-1.5 border border-blue-500/30 transition"
                                    >
                                        <BookmarkCheck className="w-4 h-4" />
                                        <span>Set as Preferred Centre for Child</span>
                                    </button>

                                    <div className="flex items-center justify-between text-xs text-slate-500">
                                        <span className="font-mono text-[11px]">Lic: {centre.license_number || 'N/A'}</span>
                                        <a
                                            href={`https://maps.google.com/?q=${centre.latitude},${centre.longitude}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-slate-400 hover:text-blue-400 font-semibold flex items-center space-x-1"
                                        >
                                            <Navigation className="w-3.5 h-3.5" />
                                            <span>Directions</span>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal: Select Child & Save Preferred Centre */}
            {selectedCentre && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80">
                    <div className="bg-slate-900 w-full max-w-md p-6 rounded-2xl border border-slate-800 shadow-xl">
                        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                <BookmarkCheck className="w-4 h-4 text-blue-400" />
                                <span>Save Centre for Child</span>
                            </h3>
                            <button onClick={() => setSelectedCentre(null)} className="text-slate-400 hover:text-white text-sm">✕</button>
                        </div>

                        <div className="bg-slate-950 p-3.5 rounded-xl mb-4 border border-slate-800 text-xs">
                            <div className="text-white font-bold">{selectedCentre.name}</div>
                            <div className="text-slate-400 mt-0.5">{selectedCentre.address}</div>
                        </div>

                        <form onSubmit={handleSaveCentreForChild} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Select Child</label>
                                {children.length === 0 ? (
                                    <div className="text-xs text-slate-400">No children registered yet. Please add a child profile first.</div>
                                ) : (
                                    <select
                                        value={selectedChildId}
                                        onChange={(e) => setSelectedChildId(e.target.value)}
                                        className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-blue-500 focus:outline-none"
                                    >
                                        {children.map((c) => (
                                            <option key={c.id} value={c.id}>{c.name} (DOB: {new Date(c.dob).toLocaleDateString()})</option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            <div className="flex items-center space-x-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setSelectedCentre(null)}
                                    className="w-1/2 py-2.5 bg-slate-800 text-slate-300 text-sm font-semibold rounded-xl"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving || !selectedChildId}
                                    className="w-1/2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50"
                                >
                                    {saving ? 'Saving...' : 'Save Preferred Centre'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
