import React, { useState } from 'react';
import { Bot, CheckCircle2, MessageCircle, RotateCcw, Send, ShieldCheck, Sparkles, User } from 'lucide-react';
import Navbar from '../../components/Navbar';
import api from '../../api/client';

const suggestedQuestions = [
    'What vaccines are due next for my children?',
    'Does my child have any overdue or missed doses?',
    'Show my child vaccination history.',
    'Which approved centres have vaccine stock?'
];

const initialMessage = {
    role: 'assistant',
    content: 'Hello! I can help you understand vaccination schedules, dose reminders, and centre visits using the information in your portal.'
};

export default function ParentAssistant() {
    const [messages, setMessages] = useState([initialMessage]);
    const [question, setQuestion] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const askQuestion = async (event) => {
        event?.preventDefault();
        const trimmedQuestion = question.trim();
        if (!trimmedQuestion || loading) return;

        setMessages((current) => [...current, { role: 'user', content: trimmedQuestion }]);
        setQuestion('');
        setError('');
        setLoading(true);

        try {
            const response = await api.post('/parent/assistant', { question: trimmedQuestion });
            setMessages((current) => [...current, { role: 'assistant', content: response.data.answer }]);
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'The assistant is temporarily unavailable. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const resetChat = () => {
        setMessages([initialMessage]);
        setQuestion('');
        setError('');
    };

    return (
        <div className="min-h-screen bg-slate-950 pb-12">
            <Navbar />

            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
                <div className="grid lg:grid-cols-[280px_minmax(0,1fr)] gap-6 items-start">
                    <aside className="space-y-4">
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-5 rounded-2xl shadow-xl shadow-blue-950/30">
                            <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center mb-4">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <h1 className="text-xl font-bold text-white">Parent Assistant</h1>
                            <p className="text-xs text-blue-100 leading-relaxed mt-2">
                                Clear answers about your child&apos;s vaccination journey, grounded in your portal&apos;s health information.
                            </p>
                        </div>

                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-200 mb-3">
                                <MessageCircle className="w-4 h-4 text-blue-400" />
                                Try asking
                            </div>
                            <div className="space-y-2">
                                {suggestedQuestions.map((suggestion) => (
                                    <button
                                        key={suggestion}
                                        type="button"
                                        onClick={() => setQuestion(suggestion)}
                                        className="w-full text-left text-[11px] leading-relaxed text-slate-400 hover:text-blue-300 border border-slate-800 hover:border-blue-500/40 rounded-xl p-3 transition"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-start gap-2.5 px-1 text-[11px] text-slate-500 leading-relaxed">
                            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            <span>Use this assistant for general information. A qualified healthcare professional should guide urgent or personal medical decisions.</span>
                        </div>
                    </aside>

                    <section className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl shadow-black/20">
                        <header className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center">
                                    <Bot className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold text-white">VaccineTrack AI</h2>
                                    <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 mt-0.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                        Ready to help
                                    </div>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={resetChat}
                                title="Start a new conversation"
                                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                            >
                                <RotateCcw className="w-4 h-4" />
                            </button>
                        </header>

                        <div className="min-h-[440px] max-h-[calc(100vh-290px)] overflow-y-auto p-5 space-y-5">
                            {messages.map((message, index) => (
                                <div key={`${message.role}-${index}`} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                                    {message.role === 'assistant' && (
                                        <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0 mt-1">
                                            <Bot className="w-4 h-4 text-blue-400" />
                                        </div>
                                    )}
                                    <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${message.role === 'user' ? 'bg-blue-600 text-white rounded-br-md' : 'bg-slate-800/80 text-slate-300 rounded-bl-md'}`}>
                                        {message.content}
                                    </div>
                                    {message.role === 'user' && (
                                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 mt-1">
                                            <User className="w-4 h-4 text-slate-400" />
                                        </div>
                                    )}
                                </div>
                            ))}

                            {loading && (
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0">
                                        <Bot className="w-4 h-4 text-blue-400" />
                                    </div>
                                    <div className="bg-slate-800/80 rounded-2xl rounded-bl-md px-4 py-3 text-xs text-slate-400 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" />
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:120ms]" />
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:240ms]" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {error && <div className="mx-5 mb-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">{error}</div>}

                        <form onSubmit={askQuestion} className="p-4 border-t border-slate-800 bg-slate-950/40">
                            <div className="flex items-end gap-2 bg-slate-950 border border-slate-700 rounded-xl p-2 focus-within:border-blue-500/70 transition">
                                <textarea
                                    value={question}
                                    onChange={(event) => setQuestion(event.target.value)}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter' && !event.shiftKey) {
                                            event.preventDefault();
                                            askQuestion(event);
                                        }
                                    }}
                                    rows="2"
                                    placeholder="Ask about your child&apos;s vaccination..."
                                    className="flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-white placeholder-slate-600 focus:outline-none"
                                />
                                <button
                                    type="submit"
                                    disabled={!question.trim() || loading}
                                    title="Send question"
                                    className="w-10 h-10 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white flex items-center justify-center transition shrink-0"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-600 mt-2 px-1">
                                <CheckCircle2 className="w-3 h-3" />
                                Answers are generated from vaccination knowledge in the portal
                            </div>
                        </form>
                    </section>
                </div>
            </main>
        </div>
    );
}