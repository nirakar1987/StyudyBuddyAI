import React, { useState } from 'react';
import { AppState, AppContextType } from '../types';
import { generateCareerPath, CareerPath } from '../services/geminiService';
import { ArrowLeftOnRectangleIcon } from './icons/ArrowLeftOnRectangleIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { GlobeAltIcon } from './icons/GlobeAltIcon';

interface CareerCounselorViewProps {
    context: AppContextType;
}

const CareerCounselorView: React.FC<CareerCounselorViewProps> = ({ context }) => {
    const { setAppState, studentProfile } = context;
    const [career, setCareer] = useState<CareerPath | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [interests, setInterests] = useState('');

    const handlePredict = async () => {
        if (!interests) return;
        setIsLoading(true);
        try {
            const topSubjects = studentProfile?.subject ? [studentProfile.subject] : ['Science', 'General Knowledge'];
            const data = await generateCareerPath(studentProfile?.grade || 8, interests, topSubjects);
            setCareer(data);
        } catch (error) {
            console.error('Failed to generate career path:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full animate-fade-in text-white overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-gradient-to-br from-indigo-500 to-blue-700 rounded-[2rem] shadow-2xl shadow-blue-500/20">
                        <GlobeAltIcon className="w-10 h-10 text-white" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black tracking-tight bg-gradient-to-r from-blue-200 via-indigo-200 to-white bg-clip-text text-transparent italic">AI Future Predictor 🚀</h2>
                        <p className="text-slate-400 text-sm font-black uppercase tracking-widest opacity-80">Discover your destiny</p>
                    </div>
                </div>
                <button
                    onClick={() => career ? setCareer(null) : setAppState(AppState.DASHBOARD)}
                    className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 hover:text-white transition-all border border-white/5"
                >
                    <ArrowLeftOnRectangleIcon className="w-8 h-8" />
                </button>
            </div>

            {isLoading ? (
                <div className="flex-grow flex flex-col items-center justify-center space-y-8 animate-pulse">
                    <div className="relative">
                        <div className="w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl animate-neon-pulse"></div>
                        <SparklesIcon className="absolute inset-0 m-auto w-16 h-16 text-indigo-400 animate-spin-slow" />
                    </div>
                    <div className="text-center">
                        <h3 className="text-3xl font-black italic mb-4">Reading your potential...</h3>
                        <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-xs">Simulating 1,000,000 Future Timelines</p>
                    </div>
                </div>
            ) : career ? (
                <div className="flex-grow flex flex-col items-center overflow-y-auto pr-2 custom-scrollbar pb-10">
                    <div className="w-full max-w-4xl space-y-8">
                        {/* THE TITLE CARD */}
                        <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900/60 p-12 rounded-[3.5rem] border border-white/10 text-center shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50"></div>
                            <p className="text-cyan-400 font-black uppercase tracking-[0.5em] text-xs mb-4">Level 100 Character Unlocked</p>
                            <h3 className="text-5xl md:text-7xl font-black italic bg-gradient-to-r from-white via-indigo-100 to-slate-400 bg-clip-text text-transparent mb-6">
                                {career.title}
                            </h3>
                            <p className="text-xl text-slate-300 font-medium leading-relaxed max-w-2xl mx-auto italic">
                                "{career.description}"
                            </p>
                        </div>

                        {/* WHY YOU? */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-slate-800/40 border border-white/5 p-8 rounded-3xl hover:bg-slate-800/60 transition-all">
                                <h4 className="text-2xl font-black text-indigo-300 mb-6 flex items-center gap-3">
                                    <span>🧠</span> Why this fits you
                                </h4>
                                <p className="text-slate-300 leading-relaxed font-medium">{career.why}</p>
                            </div>
                            <div className="bg-slate-800/40 border border-white/5 p-8 rounded-3xl hover:bg-slate-800/60 transition-all">
                                <h4 className="text-2xl font-black text-cyan-300 mb-6 flex items-center gap-3">
                                    <span>🛡️</span> Skills to build
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {career.skillsToDevelop.map((skill, i) => (
                                        <span key={i} className="px-4 py-2 bg-indigo-500/20 text-indigo-200 border border-indigo-500/30 rounded-full font-bold text-sm tracking-tight">{skill}</span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* ROADMAP */}
                        <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10">
                            <h4 className="text-3xl font-black mb-8 text-center italic">Your Secret Map 🗺️</h4>
                            <div className="space-y-6">
                                {career.roadmap.map((step, i) => (
                                    <div key={i} className="flex gap-6 group">
                                        <div className="flex flex-col items-center">
                                            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center font-black text-lg shadow-lg group-hover:scale-110 transition-transform">
                                                {i + 1}
                                            </div>
                                            {i < career.roadmap.length - 1 && <div className="w-1 bg-white/10 flex-grow my-2 rounded-full"></div>}
                                        </div>
                                        <div className="flex-grow pt-2">
                                            <p className="text-lg font-bold text-slate-200 group-hover:text-white transition-colors">{step}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* FUN FACT */}
                        <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500/30 p-8 rounded-3xl text-center shadow-xl">
                            <h5 className="text-yellow-400 font-black text-xs uppercase tracking-widest mb-2">⚡ Future Vision ⚡</h5>
                            <p className="text-yellow-100 italic text-xl font-bold font-serif leading-relaxed">"{career.funFact}"</p>
                        </div>

                        <button
                            onClick={() => setCareer(null)}
                            className="w-full py-6 bg-slate-800 hover:bg-slate-700 rounded-2xl text-white font-black uppercase tracking-widest transition-all shadow-inner"
                        >
                            Analyze Another Dream
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex-grow flex flex-col items-center justify-center space-y-10 max-w-2xl mx-auto w-full px-4">
                    <div className="text-center space-y-4">
                        <div className="inline-block p-4 bg-indigo-500/10 rounded-full border border-indigo-500/20 mb-4">
                            <SparklesIcon className="w-8 h-8 text-indigo-400 animate-pulse" />
                        </div>
                        <h3 className="text-4xl font-black italic tracking-tight">What sparks joy? 🔥</h3>
                        <p className="text-slate-400 font-medium">Tell the AI what you love doing (coding, space, animals, gaming...) and let it reveal your future.</p>
                    </div>

                    <div className="w-full space-y-6">
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                            <textarea
                                value={interests}
                                onChange={(e) => setInterests(e.target.value)}
                                className="relative w-full bg-slate-900/90 border-2 border-white/5 rounded-[2rem] p-8 text-xl font-bold text-white placeholder:text-slate-600 focus:border-indigo-500 transition-all outline-none resize-none shadow-2xl backdrop-blur-xl"
                                placeholder="I love exploring new planets and building robots that can cook pancakes..."
                                rows={4}
                            />
                        </div>

                        <button
                            onClick={handlePredict}
                            disabled={!interests || isLoading}
                            className="w-full h-24 bg-gradient-to-r from-indigo-600 via-blue-700 to-cyan-700 hover:from-indigo-500 hover:via-blue-600 hover:to-cyan-600 rounded-[2.5rem] text-white font-black text-2xl uppercase tracking-[0.2em] shadow-[0_20px_40px_-10px_rgba(37,99,235,0.4)] transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed italic"
                        >
                            Reveal My Destiny 🔭
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CareerCounselorView;
