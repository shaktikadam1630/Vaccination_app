import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Syringe, Mail, Lock, ArrowRight, ShieldCheck, HeartPulse, User } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        try {
            const user = await login(email, password);
            if (user.role === 'admin') navigate('/admin');
            else if (user.role === 'centre') navigate('/centre');
            else navigate('/parent');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to sign in. Please check your credentials.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 relative overflow-hidden">
            {/* Background Decorative Gradients */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="w-full max-w-md">
                {/* Brand Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-600 shadow-xl shadow-blue-500/20 mb-4">
                        <Syringe className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">VaccineTrack Portal</h1>
                    <p className="text-sm text-slate-400 mt-2">Digital Child Vaccination Management System</p>
                </div>

                {/* Login Card */}
                <div className="glass-panel p-8 rounded-2xl border border-slate-800 shadow-2xl">
                    <h2 className="text-xl font-bold text-white mb-6 text-center">Sign In to Your Account</h2>

                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="w-5 h-5 text-slate-500 absolute left-3.5 top-3.5" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@example.com"
                                    className="w-full pl-11 pr-4 py-3 bg-slate-900/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                    Password
                                </label>
                                <Link to="/forgot-password" className="text-xs text-blue-400 hover:text-blue-300 font-medium">
                                    Forgot Password?
                                </Link>
                            </div>
                            <div className="relative">
                                <Lock className="w-5 h-5 text-slate-500 absolute left-3.5 top-3.5" />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••••••"
                                    className="w-full pl-11 pr-4 py-3 bg-slate-900/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center space-x-2 transition disabled:opacity-50"
                        >
                            <span>{submitting ? 'Authenticating...' : 'Sign In'}</span>
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </form>

                    {/* Quick Registration Links */}
                    <div className="mt-8 pt-6 border-t border-slate-800 text-center space-y-3">
                        <p className="text-xs text-slate-400">Need to create an account?</p>
                        <div className="flex items-center justify-center space-x-4 text-xs font-semibold">
                            <Link to="/register-parent" className="text-blue-400 hover:text-blue-300 flex items-center space-x-1">
                                <User className="w-3.5 h-3.5" />
                                <span>Register as Parent</span>
                            </Link>
                            <span className="text-slate-600">•</span>
                            <Link to="/register-centre" className="text-purple-400 hover:text-purple-300 flex items-center space-x-1">
                                <HeartPulse className="w-3.5 h-3.5" />
                                <span>Register Health Centre</span>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Official Portal Trust Badge Footer */}
                <div className="mt-6 flex items-center justify-center space-x-2 text-xs text-slate-500">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>National Health Authority • Encrypted & Secure Digital Portal</span>
                </div>
            </div>
        </div>
    );
}
