import React, { useState, useEffect } from 'react';
import { AppState, AppContextType } from '../types';
import { generateDailyChallenge, DailyChallenge, checkChallengeAnswer } from '../services/geminiService';
import { upsertProfile } from '../services/databaseService';
import { ArrowLeftOnRectangleIcon } from './icons/ArrowLeftOnRectangleIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { StarIcon } from './icons/StarIcon';

interface DailyChallengeViewProps {
    context: AppContextType;
}

const DailyChallengeView: React.FC<DailyChallengeViewProps> = ({ context }) => {
    const { setAppState, studentProfile, setStudentProfile } = context;
    const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
    const [userAnswer, setUserAnswer] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState<{ isCorrect: boolean, feedback: string } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCompleted, setIsCompleted] = useState(false);

    const todayStr = new Date().toISOString().split('T')[0];
    const challengeKey = `daily_challenge_${todayStr}`;

    useEffect(() => {
        const fetchChallenge = async () => {
            setIsLoading(true);
            try {
                // Check if already completed
                const completed = studentProfile?.completed_modules || [];
                if (completed.includes(challengeKey)) {
                    setIsCompleted(true);
                }

                const data = await generateDailyChallenge(studentProfile?.grade || 8, studentProfile?.subject || 'Science');
                setChallenge(data);
            } catch (error) {
                console.error('Failed to fetch daily challenge:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchChallenge();
    }, [studentProfile?.grade, studentProfile?.subject, challengeKey, studentProfile?.completed_modules]);

    const handleSubmit = async () => {
        if (!userAnswer || !challenge) return;
        setIsSubmitting(true);
        try {
            const evaluation = await checkChallengeAnswer(challenge.question, userAnswer, challenge.answer);
            setResult(evaluation);

            if (evaluation.isCorrect && !isCompleted) {
                // Award points and mark as completed
                const newScore = (studentProfile?.score || 0) + 50;
                const newCompleted = [...(studentProfile?.completed_modules || []), challengeKey];
                const updatedProfile = {
                    ...(studentProfile as any),
                    score: newScore,
                    completed_modules: newCompleted
                };

                await upsertProfile(updatedProfile);
                setStudentProfile(updatedProfile);
                setIsCompleted(true);
            }
        } catch (error) {
            console.error('Failed to check answer:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="h-full flex flex-col items-center justify-center space-y-6">
                <div className="relative">
                    <div className="w-24 h-24 border-8 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin"></div>
                    <StarIcon className="absolute inset-0 m-auto w-10 h-10 text-yellow-400 animate-pulse" />
                </div>
                <div className="text-center">
                    <h3 className="text-2xl font-black text-white uppercase tracking-widest">Generating Your Quest...</h3>
                    <p className="text-slate-500 font-bold mt-2">The daily challenge is being summoned 🧙‍♂️</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full animate-fade-in text-white overflow-y-auto custom-scrollbar p-1">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-gradient-to-br from-yellow-400 to-orange-600 rounded-2xl shadow-xl shadow-orange-500/30">
                        <SparklesIcon className="w-10 h-10 text-white" />
                    </div>
                    <div>
                        <h2 className="text-4xl font-black tracking-tight bg-gradient-to-r from-yellow-200 to-orange-400 bg-clip-text text-transparent">Daily Quest</h2>
                        <p className="text-slate-400 text-sm font-black uppercase tracking-widest">Master one concept every day</p>
                    </div>
                </div>
                <button
                    onClick={() => setAppState(AppState.DASHBOARD)}
                    className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 hover:text-white transition-all border border-white/5"
                >
                    <ArrowLeftOnRectangleIcon className="w-8 h-8" />
                </button>
            </div>

            {/* Status Banner */}
            {isCompleted && (
                <div className="bg-gradient-to-r from-green-500/20 to-emerald-600/20 border border-green-500/50 p-6 rounded-3xl mb-8 flex items-center gap-6 animate-bounce-subtle shadow-lg shadow-green-500/10">
                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-3xl shadow-lg shadow-green-500/40">✅</div>
                    <div>
                        <h3 className="text-2xl font-black text-green-400">Quest Completed!</h3>
                        <p className="text-green-300/70 font-bold tracking-tight">You've earned <span className="text-white">+50 Bonus Points</span> today! 🔥</p>
                    </div>
                </div>
            )}

            {/* Challenge Card */}
            <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-[2.5rem] border border-white/10 p-8 md:p-12 shadow-2xl backdrop-blur-3xl relative overflow-hidden mb-8">
                <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 blur-3xl rounded-full -translate-x-1/2 translate-y-1/2"></div>

                <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-6 py-2 bg-yellow-400/10 rounded-full border border-yellow-400/20 mb-8">
                        <StarIcon className="w-5 h-5 text-yellow-400" />
                        <span className="text-yellow-400 text-sm font-black uppercase tracking-[0.2em]">{challenge?.topic || 'Daily Mystery'}</span>
                    </div>

                    <h3 className="text-3xl md:text-4xl font-black text-white leading-relaxed mb-10 tracking-tight">
                        {challenge?.question}
                    </h3>

                    {challenge?.hint && (
                        <div className="bg-blue-900/10 border border-blue-500/20 p-6 rounded-2xl mb-10 group hover:bg-blue-900/20 transition-all cursor-pointer">
                            <p className="text-blue-400 text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                                <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
                                Helpful Hint (Tap to toggle)
                            </p>
                            <p className="text-blue-200/70 font-medium italic group-hover:text-blue-100 transition-colors">"{challenge.hint}"</p>
                        </div>
                    )}

                    {!result?.isCorrect ? (
                        <div className="space-y-6">
                            <textarea
                                value={userAnswer}
                                onChange={(e) => setUserAnswer(e.target.value)}
                                className="w-full bg-slate-950/50 border-2 border-white/10 rounded-3xl p-8 text-xl font-bold text-white placeholder:text-slate-600 focus:border-yellow-500/50 focus:bg-slate-950 transition-all outline-none resize-none shadow-inner"
                                placeholder="Your brave answer goes here..."
                                rows={4}
                                disabled={isSubmitting}
                            />

                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting || !userAnswer}
                                className="w-full h-20 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 hover:from-yellow-300 hover:to-red-500 rounded-[2rem] text-white font-black text-2xl uppercase tracking-[0.2em] shadow-2xl shadow-orange-500/30 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed group"
                            >
                                <span className="group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all">
                                    {isSubmitting ? 'Evaluating...' : 'Slay the Challenge 🚀'}
                                </span>
                            </button>
                        </div>
                    ) : (
                        <div className="animate-fade-in">
                            <div className="bg-emerald-500/10 border border-emerald-500/30 p-8 rounded-3xl mb-8">
                                <h4 className="text-emerald-400 font-black text-2xl mb-4">Masterful!</h4>
                                <p className="text-emerald-100 text-lg leading-relaxed">{result.feedback}</p>
                            </div>
                            <button
                                onClick={() => setAppState(AppState.DASHBOARD)}
                                className="w-full py-6 bg-slate-700 hover:bg-slate-600 rounded-2xl text-white font-black text-xl uppercase tracking-widest transition-all"
                            >
                                Back to Dashboard
                            </button>
                        </div>
                    )}

                    {result && !result.isCorrect && (
                        <div className="mt-8 bg-red-900/10 border border-red-500/30 p-8 rounded-3xl animate-shake">
                            <h4 className="text-red-400 font-black text-2xl mb-4">Not quite...</h4>
                            <p className="text-red-100 text-lg leading-relaxed mb-6">{result.feedback}</p>
                            <button
                                onClick={() => setResult(null)}
                                className="px-8 py-4 bg-red-500/20 hover:bg-red-500/30 text-red-300 font-black rounded-2xl transition-all uppercase text-xs tracking-widest"
                            >
                                Try Again
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Rewards Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {[
                    { label: "XP Points", value: "+50", icon: "✨", color: "from-blue-500 to-indigo-600" },
                    { label: "Bonus Streak", value: "+1", icon: "🔥", color: "from-orange-500 to-red-600" },
                    { label: "Level Up", value: "Rare", icon: "💎", color: "from-purple-500 to-pink-600" },
                ].map((reward, i) => (
                    <div key={i} className={`bg-gradient-to-br ${reward.color} p-6 rounded-3xl shadow-xl flex items-center justify-between group hover:scale-[1.05] transition-all cursor-default`}>
                        <div>
                            <p className="text-white/70 text-xs font-black uppercase tracking-widest mb-1">{reward.label}</p>
                            <p className="text-white text-3xl font-black">{reward.value}</p>
                        </div>
                        <div className="text-4xl group-hover:rotate-12 transition-transform">{reward.icon}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DailyChallengeView;
