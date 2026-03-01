
import React, { useState } from 'react';
import { AppContextType, AppState, StudentProfile } from '../types';

interface ProfileSetupViewProps {
    context: AppContextType;
}

const FloatingMath: React.FC<{ symbol: string; delay: number; className: string }> = ({ symbol, delay, className }) => (
    <div
        className={`absolute text-6xl font-black opacity-10 pointer-events-none select-none animate-float ${className}`}
        style={{ animationDelay: `${delay}s` }}
    >
        {symbol}
    </div>
);

const ProfileSetupView: React.FC<ProfileSetupViewProps> = ({ context }) => {
    const { user, studentProfile, setStudentProfile, setAppState } = context;
    const [name, setName] = useState(studentProfile?.name || '');
    const [grade, setGrade] = useState(studentProfile?.grade || 5);
    const [subject, setSubject] = useState(studentProfile?.subject || 'Science');
    const [selectedAvatar, setSelectedAvatar] = useState(studentProfile?.avatar_url || '');

    const defaultAvatars = [
        `https://api.dicebear.com/9.x/micah/svg?seed=student1`,
        `https://api.dicebear.com/9.x/micah/svg?seed=student2`,
        `https://api.dicebear.com/9.x/micah/svg?seed=student3`,
        `https://api.dicebear.com/9.x/micah/svg?seed=student4`,
        `https://api.dicebear.com/9.x/micah/svg?seed=student5`,
        `https://api.dicebear.com/9.x/micah/svg?seed=student6`,
        `https://api.dicebear.com/9.x/micah/svg?seed=student7`,
        `https://api.dicebear.com/9.x/micah/svg?seed=student8`,
    ];

    // Auto-select a default if none selected
    React.useEffect(() => {
        if (!selectedAvatar && name) {
            setSelectedAvatar(`https://api.dicebear.com/9.x/micah/svg?seed=${encodeURIComponent(name.trim())}`);
        }
    }, [name, selectedAvatar]);

    const grades = Array.from({ length: 12 }, (_, i) => i + 1);
    const subjects = [
        'Mathematics', 'Science', 'English', 'English Grammar',
        'Hindi', 'Kannada', 'VED', 'GK', 'Computer',
        'Social Studies', 'History', 'Physics', 'Chemistry',
        'Biology', 'Business Studies', 'Economics'
    ];

    const handleSubmit = async () => {
        if (!user) return;
        if (!name.trim()) {
            alert("Please enter your name.");
            return;
        }

        const newProfile: StudentProfile = {
            ...(studentProfile || {}),
            id: user.id,
            name: name.trim(),
            grade,
            subject,
            topic_performance: studentProfile?.topic_performance || {},
            score: studentProfile?.score || 0,
            streak: studentProfile?.streak || 1,
            completed_modules: studentProfile?.completed_modules || [],
            avatar_url: selectedAvatar || `https://api.dicebear.com/9.x/micah/svg?seed=${encodeURIComponent(name.trim())}`,
            theme: studentProfile?.theme || 'midnight-bloom',
            role: 'student'
        };

        await setStudentProfile(newProfile);
        setAppState(AppState.DASHBOARD);
    };

    return (
        <div className="fixed inset-0 min-h-screen bg-[#0a0a1a] flex flex-col items-center justify-center p-4 overflow-hidden z-[100]">
            {/* Dynamic Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2.5s' }}></div>

                <FloatingMath symbol="√" delay={0} className="top-[15%] left-[10%]" />
                <FloatingMath symbol="x²" delay={2} className="top-[25%] right-[15%]" />
                <FloatingMath symbol="Σ" delay={4} className="bottom-[20%] left-[20%]" />
                <FloatingMath symbol="÷" delay={1} className="bottom-[30%] right-[10%]" />
            </div>

            <div className="relative z-10 w-full max-w-xl flex flex-col items-center animate-fade-in">
                {/* Header Section */}
                <div className="text-center mb-10">
                    <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 px-4">
                        {studentProfile ? 'Polish Your Profile' : 'Almost There!'}
                    </h1>
                    <p className="text-slate-400 mt-4 text-lg font-medium max-w-md mx-auto">
                        {studentProfile
                            ? 'Update your preferences to keep your learning journey fresh.'
                            : 'Personalize your StudyBuddy AI experience so we can learn together.'}
                    </p>
                </div>

                {/* Glass Card */}
                <div className="w-full backdrop-blur-3xl bg-white/5 border border-white/10 rounded-[2.5rem] shadow-2xl p-8 md:p-12 space-y-8">
                    <div className="grid md:grid-cols-1 gap-6">
                        <div className="space-y-3">
                            <label className="block text-sm font-black text-slate-300 ml-1 uppercase tracking-widest">What should we call you?</label>
                            <div className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl blur opacity-0 group-focus-within:opacity-30 transition duration-500"></div>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="Ninja Learner"
                                    className="relative w-full p-5 bg-slate-900/60 border border-white/10 rounded-2xl text-white text-xl placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all font-bold"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="block text-sm font-black text-slate-300 ml-1 uppercase tracking-widest">Choose Your Avatar</label>
                            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                                {defaultAvatars.map((url, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedAvatar(url)}
                                        className={`flex-shrink-0 w-16 h-16 rounded-full border-4 transition-all ${selectedAvatar === url ? 'border-cyan-400 scale-110 shadow-lg shadow-cyan-400/50' : 'border-slate-700 hover:border-slate-500 opacity-70 hover:opacity-100'}`}
                                    >
                                        <img src={url} alt={`Avatar ${idx + 1}`} className="w-full h-full rounded-full bg-slate-800" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <label className="block text-sm font-black text-slate-300 ml-1 uppercase tracking-widest">Your Grade</label>
                                <div className="relative group">
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur opacity-0 group-focus-within:opacity-30 transition duration-500"></div>
                                    <select
                                        value={grade}
                                        onChange={e => setGrade(parseInt(e.target.value))}
                                        className="relative w-full p-5 bg-slate-900/60 border border-white/10 rounded-2xl text-white text-xl appearance-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-bold cursor-pointer"
                                    >
                                        {grades.map(g => <option key={g} value={g} className="bg-slate-900">{g}th Grade</option>)}
                                    </select>
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="block text-sm font-black text-slate-300 ml-1 uppercase tracking-widest">Focus Subject</label>
                                <div className="relative group">
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl blur opacity-0 group-focus-within:opacity-30 transition duration-500"></div>
                                    <select
                                        value={subject}
                                        onChange={e => setSubject(e.target.value)}
                                        className="relative w-full p-5 bg-slate-900/60 border border-white/10 rounded-2xl text-white text-xl appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-bold cursor-pointer"
                                    >
                                        {subjects.map(s => <option key={s} value={s} className="bg-slate-900">{s}</option>)}
                                    </select>
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4">
                        {studentProfile ? (
                            <div className="flex flex-col md:flex-row gap-4">
                                <button
                                    onClick={() => setAppState(AppState.DASHBOARD)}
                                    className="flex-1 py-5 px-8 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black text-xl transition-all active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    className="flex-2 py-5 px-12 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white rounded-2xl font-black text-xl transition-all hover:scale-[1.02] active:scale-95 shadow-[0_15px_30px_-5px_rgba(6,182,212,0.5)] animate-glow-strong"
                                >
                                    Secure Profile
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                className="w-full py-6 px-12 bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 text-white rounded-[2rem] font-black text-2xl transition-all hover:scale-[1.02] active:scale-95 shadow-[0_20px_40px_-5px_rgba(6,182,212,0.4)] group overflow-hidden relative"
                            >
                                <span className="relative z-10">Blast Off! 🚀</span>
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Accent */}
            <div className="absolute bottom-10 left-10 flex gap-2">
                {[1, 2, 3].map(i => (
                    <div key={i} className="w-8 h-2 bg-white/20 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.3}s` }}></div>
                ))}
            </div>
        </div>
    );
};

export default ProfileSetupView;