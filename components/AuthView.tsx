
import React, { useState, useEffect } from 'react';
import { AppContextType, AppState } from '../types';
import { supabase } from '../services/supabaseClient';
import { SparklesIcon } from './icons/SparklesIcon';

interface AuthViewProps {
    context: AppContextType;
}

const FloatingElement: React.FC<{ icon: string; delay: number; className: string }> = ({ icon, delay, className }) => (
    <div
        className={`absolute text-4xl opacity-20 pointer-events-none select-none animate-float ${className}`}
        style={{ animationDelay: `${delay}s`, filter: 'blur(1px)' }}
    >
        {icon}
    </div>
);

const AuthView: React.FC<AuthViewProps> = ({ context }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const toggleMode = (mode: boolean) => {
        setIsLogin(mode);
        setError(null);
        setSuccessMessage(null);
    }

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMessage(null);
        try {
            if (isLogin) {
                const { error } = await supabase!.auth.signInWithPassword({ email, password });
                if (error) throw error;
            } else {
                const { error } = await supabase!.auth.signUp({ email, password });
                if (error) throw error;
                setSuccessMessage("✨ Awesome! We've sent a magic link to your email. Please check it to continue!");
                setEmail('');
                setPassword('');
            }
        } catch (err: any) {
            setError(err.error_description || err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 min-h-screen bg-[#0a0a1a] flex flex-col items-center justify-center p-4 overflow-hidden z-[100]">
            {/* Dynamic Animated Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
                <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-pink-600/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }}></div>

                {/* Floating Math Symbols */}
                <FloatingElement icon="Σ" delay={0} className="top-[10%] left-[15%]" />
                <FloatingElement icon="π" delay={2} className="top-[20%] right-[20%]" />
                <FloatingElement icon="√" delay={4} className="bottom-[15%] left-[25%]" />
                <FloatingElement icon="∞" delay={1} className="bottom-[25%] right-[15%]" />
                <FloatingElement icon="∫" delay={3} className="top-[50%] left-[5%]" />
                <FloatingElement icon="Δ" delay={5} className="bottom-[40%] right-[5%]" />
            </div>

            {/* Main Content Container */}
            <div className="relative z-10 w-full max-w-md animate-fade-in">
                {/* Logo Section */}
                <div className="flex flex-col items-center mb-10 group">
                    <div className="relative mb-4">
                        <div className="absolute -inset-4 bg-gradient-to-r from-magenta-500 to-cyan-500 rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
                        <SparklesIcon className="w-16 h-16 text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.8)] animate-bounce" style={{ animationDuration: '3s' }} />
                    </div>
                    <h1 className="text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 drop-shadow-2xl">
                        StudyBuddy AI
                    </h1>
                    <p className="text-slate-400 mt-2 font-medium tracking-widest uppercase text-xs opacity-70">Learning, Reimagined.</p>
                </div>

                {/* Glassmorphism Auth Card */}
                <div className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden">
                    {/* Tab Switcher */}
                    <div className="flex p-2 bg-black/20 m-4 rounded-2xl">
                        <button
                            onClick={() => toggleMode(true)}
                            className={`flex-1 py-3 rounded-xl font-bold transition-all duration-300 ${isLogin
                                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        >
                            Sign In
                        </button>
                        <button
                            onClick={() => toggleMode(false)}
                            className={`flex-1 py-3 rounded-xl font-bold transition-all duration-300 ${!isLogin
                                ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-500/20'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        >
                            Sign Up
                        </button>
                    </div>

                    <div className="p-8 pt-2">
                        <form onSubmit={handleAuth} className="space-y-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-300 ml-1">Email Address</label>
                                <div className="relative group">
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl blur opacity-0 group-focus-within:opacity-30 transition duration-500"></div>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="your@email.com"
                                        className="relative w-full p-4 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all font-medium"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-300 ml-1">Password</label>
                                <div className="relative group">
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl blur opacity-0 group-focus-within:opacity-30 transition duration-500"></div>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="relative w-full p-4 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all font-medium"
                                        required
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center animate-shake">
                                    ⚠️ {error}
                                </div>
                            )}

                            {successMessage && (
                                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm text-center animate-bounce">
                                    {successMessage}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-4 px-6 rounded-2xl font-black text-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 overflow-hidden group relative ${isLogin
                                        ? 'bg-gradient-to-r from-cyan-500 via-blue-600 to-cyan-500 bg-[length:200%_auto] hover:bg-right transition-all duration-500 shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                                        : 'bg-gradient-to-r from-purple-500 via-pink-600 to-purple-500 bg-[length:200%_auto] hover:bg-right transition-all duration-500 shadow-[0_0_20px_rgba(168,85,247,0.4)]'
                                    } text-white`}
                            >
                                {loading ? (
                                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        {isLogin ? 'Enter Study Hall' : 'Join the Squad'}
                                        <SparklesIcon className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-8 pt-6 border-t border-white/5 text-center">
                            <button
                                onClick={() => context.setAppState(AppState.DB_CHECK)}
                                className="text-xs font-bold text-slate-500 hover:text-cyan-400 transition-colors tracking-widest uppercase flex items-center justify-center gap-2 mx-auto decoration-transparent hover:decoration-cyan-400 underline underline-offset-4 decoration-2"
                            >
                                <div className="w-1.5 h-1.5 bg-slate-500 rounded-full group-hover:bg-cyan-400"></div>
                                Connection Status & Setup
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Credit */}
            <div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none opacity-30">
                <p className="text-white text-[10px] font-bold tracking-[0.3em] uppercase">Powered by Gemini Pro Vision</p>
            </div>
        </div>
    );
};

export default AuthView;
