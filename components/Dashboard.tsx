
import React, { useEffect, useState } from 'react';
import { AppState, AppContextType, QuizAttempt } from '../types';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { UploadIcon } from './icons/UploadIcon';
import { BeakerIcon } from './icons/BeakerIcon';
import { ClockIcon } from './icons/ClockIcon';
import { LightBulbIcon } from './icons/LightBulbIcon';
import { VideoCameraIcon } from './icons/VideoCameraIcon';
import { UsersIcon } from './icons/UsersIcon';
import { PencilIcon } from './icons/PencilIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { ShoppingBagIcon } from './icons/ShoppingBagIcon';
import { useSoundEffects } from '../hooks/useSoundEffects';
import TopicPerformanceChart from './TopicPerformanceChart';
import { getQuizHistory } from '../services/databaseService';
import { SkeletonActivityItem } from './SkeletonCard';

interface DashboardProps {
    context: AppContextType;
}

const Dashboard: React.FC<DashboardProps> = ({ context }) => {
    const { user, studentProfile, setAppState, startLesson, startPracticeSession, startSolveIssue, startVideoGeneration, startGlobalChat, learningModules, completedModules } = context;
    const { playHoverSound } = useSoundEffects();
    const [recentQuizzes, setRecentQuizzes] = useState<QuizAttempt[]>([]);
    const [isLoadingRecent, setIsLoadingRecent] = useState(true);

    useEffect(() => {
        const fetchRecent = async () => {
            if (user) {
                setIsLoadingRecent(true);
                try {
                    const history = await getQuizHistory(user.id);
                    setRecentQuizzes(history.slice(0, 3));
                } finally {
                    setIsLoadingRecent(false);
                }
            } else {
                setIsLoadingRecent(false);
            }
        };
        fetchRecent();
    }, [user]);

    const handleStartQuizGeneration = () => {
        setAppState(AppState.UPLOAD);
    };

    const getTutorTip = () => {
        const weakTopics = Object.entries(studentProfile?.topic_performance || {})
            .filter(([_, status]) => status === 'weak');

        if (weakTopics.length > 0) {
            return `I noticed you're finding "${weakTopics[0][0]}" a bit tricky. Why don't we try a quick lesson on it?`;
        }
        return `You're doing great, ${studentProfile?.name}! Ready to master a new topic today?`;
    };

    return (
        <div className="flex flex-col h-full overflow-y-auto pb-8">
            {/* Parent / WhatsApp / Telegram – FIRST so it’s always visible */}
            <div
                onClick={() => setAppState(AppState.PARENT_NOTIFICATIONS)}
                onMouseEnter={playHoverSound}
                className="mb-6 p-4 rounded-2xl border-2 border-emerald-500/60 bg-gradient-to-r from-emerald-900/50 to-teal-900/50 cursor-pointer transition-all flex flex-wrap items-center justify-between gap-4 shadow-lg"
            >
                <div className="flex items-center gap-4">
                    <span className="text-4xl">📱</span>
                    <div>
                        <h3 className="text-lg font-bold text-white">Send activity to parent</h3>
                        <p className="text-sm text-slate-300">Parents get updates automatically via Telegram when you complete a quiz or practice.</p>
                    </div>
                </div>
                <span className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-sm whitespace-nowrap">Set up automatic Telegram →</span>
            </div>

            {/* Hero Section with Animated Gradient */}
            <div className="relative mb-8 animate-fade-in group">
                {/* Animated gradient background */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 rounded-3xl blur-2xl opacity-60 animate-pulse"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-3xl blur-xl opacity-40 group-hover:opacity-70 transition-opacity duration-1000"></div>

                <div className="relative bg-gradient-to-br from-purple-900/90 via-pink-900/90 to-red-900/90 backdrop-blur-sm rounded-3xl p-8 text-white shadow-2xl overflow-hidden border-2 border-white/30">
                    {/* Floating orbs */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-yellow-400/30 to-transparent rounded-full blur-3xl animate-float"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-cyan-400/20 to-transparent rounded-full blur-2xl animate-float" style={{ animationDelay: '1s' }}></div>

                    <div className="relative z-10">
                        <div className="flex items-start justify-between">
                            <div>
                                <h1 className="text-3xl md:text-5xl font-black mb-3 bg-gradient-to-r from-white via-yellow-200 to-white bg-clip-text text-transparent animate-neon-pulse drop-shadow-lg">
                                    🎓 Hey {studentProfile?.name}!
                                </h1>
                                <p className="text-white/95 text-xl mb-6 leading-relaxed">{getTutorTip()}</p>
                                <button
                                    onClick={startLesson}
                                    onMouseEnter={playHoverSound}
                                    className="group/btn px-8 py-4 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-gray-900 rounded-2xl font-black text-lg hover:scale-110 transition-all shadow-2xl hover:shadow-yellow-500/50 animate-button-glow relative overflow-hidden"
                                >
                                    <span className="relative z-10 flex items-center gap-2">
                                        🚀 Start Learning
                                        <span className="group-hover/btn:translate-x-1 transition-transform">→</span>
                                    </span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-300 to-orange-400 opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>
                                </button>
                            </div>
                            <div className="hidden md:flex flex-col items-center justify-center">
                                <div className="relative w-32 h-32 group-hover:scale-110 transition-transform duration-500">
                                    <svg className="transform -rotate-90 w-32 h-32">
                                        <circle
                                            cx="64"
                                            cy="64"
                                            r="58"
                                            stroke="rgba(255,255,255,0.2)"
                                            strokeWidth="10"
                                            fill="none"
                                        />
                                        <circle
                                            cx="64"
                                            cy="64"
                                            r="58"
                                            stroke="url(#scoreGradient)"
                                            strokeWidth="10"
                                            fill="none"
                                            strokeDasharray={`${((studentProfile?.score || 0) / 1000) * 364} 364`}
                                            className="transition-all duration-1000"
                                            strokeLinecap="round"
                                        />
                                        <defs>
                                            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#fbbf24" />
                                                <stop offset="50%" stopColor="#f97316" />
                                                <stop offset="100%" stopColor="#ef4444" />
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-3xl font-black text-white drop-shadow-lg">{studentProfile?.score || 0}</span>
                                        <span className="text-xs text-white/80 font-bold uppercase tracking-wider">Points</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <SparklesIcon className="absolute -right-8 -bottom-8 w-48 h-48 text-white/10 rotate-12 animate-float" />
                </div>
            </div>

            {/* Stats Cards with Enhanced Glassmorphism */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div onClick={() => setAppState(AppState.LEADERBOARD)} onMouseEnter={playHoverSound} className="cursor-pointer relative group bg-gradient-to-br from-blue-500/30 to-cyan-500/30 backdrop-blur-md p-8 rounded-3xl border-2 border-white/30 shadow-2xl hover:scale-105 hover:shadow-blue-500/50 transition-all duration-300 animate-slide-bounce overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="text-center relative z-10">
                        <div className="text-5xl font-black bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent animate-neon-pulse drop-shadow-lg">
                            {studentProfile?.score || 0}
                        </div>
                        <div className="text-sm uppercase font-black text-white/90 mt-2 tracking-wider">⭐ Points</div>
                    </div>
                    <div className="absolute top-2 right-2 w-12 h-12 bg-blue-400/20 rounded-full blur-xl group-hover:scale-150 transition-transform"></div>
                </div>
                <div onClick={() => setAppState(AppState.LEADERBOARD)} onMouseEnter={playHoverSound} className="cursor-pointer relative group bg-gradient-to-br from-orange-500/30 to-red-500/30 backdrop-blur-md p-8 rounded-3xl border-2 border-white/30 shadow-2xl hover:scale-105 hover:shadow-orange-500/50 transition-all duration-300 animate-slide-bounce overflow-hidden" style={{ animationDelay: '0.1s' }}>
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="text-center relative z-10">
                        <div className="text-5xl font-black bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent animate-neon-pulse drop-shadow-lg">
                            {studentProfile?.streak || 1}
                        </div>
                        <div className="text-sm uppercase font-black text-white/90 mt-2 tracking-wider">🔥 Streak</div>
                    </div>
                    <div className="absolute top-2 right-2 w-12 h-12 bg-orange-400/20 rounded-full blur-xl group-hover:scale-150 transition-transform"></div>
                </div>
                <div onMouseEnter={playHoverSound} className="relative group bg-gradient-to-br from-purple-500/30 to-pink-500/30 backdrop-blur-md p-8 rounded-3xl border-2 border-white/30 shadow-2xl hover:scale-105 hover:shadow-purple-500/50 transition-all duration-300 animate-slide-bounce overflow-hidden" style={{ animationDelay: '0.2s' }}>
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="text-center relative z-10">
                        <div className="text-3xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-lg">
                            Grade {studentProfile?.grade}
                        </div>
                        <div className="text-sm uppercase font-black text-white/90 mt-2 tracking-wider">📚 {studentProfile?.subject}</div>
                    </div>
                    <div className="absolute top-2 right-2 w-12 h-12 bg-purple-400/20 rounded-full blur-xl group-hover:scale-150 transition-transform"></div>
                </div>
            </div>

            {/* Main Action Grid - Animated Style */}
            <div className="mb-6">
                <h2 className="text-2xl font-black text-white mb-4 flex items-center gap-2">
                    <span className="animate-wiggle">✨</span> Quick Actions
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4 md:gap-5">
                    {[
                        { icon: <span className="text-4xl">👑</span>, label: "Daily Quest", emoji: "✨", gradient: "from-yellow-400 to-orange-500", onClick: () => setAppState(AppState.DAILY_CHALLENGE) },
                        { icon: <ChartBarIcon className="w-10 h-10" />, label: "Ranking", emoji: "🏆", gradient: "from-indigo-500 to-purple-600", onClick: () => setAppState(AppState.LEADERBOARD) },
                        { icon: <span className="text-4xl">📕</span>, label: "Mistakes", emoji: "❌", gradient: "from-red-600 to-rose-700", onClick: () => setAppState(AppState.MISTAKE_REVISION) },
                        { icon: <span className="text-4xl">📸</span>, label: "Scan HW", emoji: "🔍", gradient: "from-amber-500 to-orange-600", onClick: () => setAppState(AppState.HOMEWORK_SCANNER) },
                        { icon: <span className="text-4xl">📋</span>, label: "NCERT", emoji: "📚", gradient: "from-emerald-500 to-teal-600", onClick: () => setAppState(AppState.NCERT_SOLUTIONS) },
                        { icon: <BookOpenIcon className="w-10 h-10" />, label: "Learn", emoji: "📖", gradient: "from-blue-600 to-cyan-600", onClick: startLesson },
                        { icon: <UploadIcon className="w-10 h-10" />, label: "Quiz", emoji: "📝", gradient: "from-green-600 to-emerald-600", onClick: handleStartQuizGeneration },
                        { icon: <span className="text-4xl">📱</span>, label: "Parent", emoji: "📲", gradient: "from-emerald-600 to-teal-700", onClick: () => setAppState(AppState.PARENT_NOTIFICATIONS) },
                        { icon: <LightBulbIcon className="w-10 h-10" />, label: "Practice", emoji: "💡", gradient: "from-yellow-600 to-orange-600", onClick: startPracticeSession },
                        { icon: <BeakerIcon className="w-10 h-10" />, label: "Solve", emoji: "🧪", gradient: "from-purple-600 to-pink-600", onClick: startSolveIssue },
                        { icon: <VideoCameraIcon className="w-10 h-10" />, label: "Videos", emoji: "🎬", gradient: "from-red-600 to-rose-600", onClick: startVideoGeneration },
                        { icon: <UsersIcon className="w-10 h-10" />, label: "Chat", emoji: "💬", gradient: "from-indigo-600 to-blue-600", onClick: startGlobalChat },
                        { icon: <BeakerIcon className="w-10 h-10" />, label: "Math Helper", emoji: "🧮", gradient: "from-cyan-600 to-teal-600", onClick: () => setAppState(AppState.MATH_MASTERY) },
                        { icon: <CalendarIcon className="w-10 h-10" />, label: "Plan", emoji: "📅", gradient: "from-orange-600 to-amber-600", onClick: () => setAppState(AppState.STUDY_PLAN) },
                        { icon: <ChartBarIcon className="w-10 h-10" />, label: "Analytics", emoji: "📊", gradient: "from-pink-600 to-fuchsia-600", onClick: () => setAppState(AppState.ANALYTICS) },
                        { icon: <BookOpenIcon className="w-10 h-10" />, label: "Book Quiz", emoji: "📚", gradient: "from-indigo-600 to-blue-700", onClick: () => setAppState(AppState.BOOK_QUIZ) },
                        { icon: <UsersIcon className="w-10 h-10" />, label: "Challenges", emoji: "🏆", gradient: "from-teal-600 to-cyan-600", onClick: () => setAppState(AppState.MULTIPLAYER_CHALLENGE) },
                        { icon: <ShoppingBagIcon className="w-10 h-10" />, label: "Store", emoji: "🛍️", gradient: "from-yellow-500 to-amber-600", onClick: () => setAppState(AppState.POINT_SHOP) },
                        { icon: <span className="text-4xl">🚀</span>, label: "Future", emoji: "🔮", gradient: "from-indigo-600 to-blue-900", onClick: () => setAppState(AppState.CAREER_COUNSELOR) },
                        { icon: <span className="text-4xl">🕵️‍♂️</span>, label: "Patterns", emoji: "🔍", gradient: "from-cyan-700 to-blue-900", onClick: () => setAppState(AppState.PATTERN_DETECTIVE) },
                    ].map((action, index) => (
                        <ActionCardBento
                            key={action.label}
                            index={index}
                            icon={action.icon}
                            label={action.label}
                            emoji={action.emoji}
                            gradient={action.gradient}
                            onClick={action.onClick}
                            onHover={playHoverSound}
                        />
                    ))}
                </div>
            </div>



            {/* Performance & Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Chapter Mastery Row-wise Replacement */}
                <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10 shadow-xl overflow-hidden">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <PencilIcon className="w-6 h-6 text-yellow-400" />
                        {studentProfile?.subject} Chapter Mastery
                    </h3>

                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {(learningModules || [])
                            .filter(m => {
                                const ms = (m.subject || "").toLowerCase().trim();
                                const ps = (studentProfile?.subject || "").toLowerCase().trim();

                                // Robust Math check
                                const isMath = (s: string) => s === 'math' || s === 'maths' || s === 'mathematics';
                                if (isMath(ms) && isMath(ps)) return true;

                                return ms === ps || ms.includes(ps) || ps.includes(ms);
                            })
                            .map((module, index) => {
                                const isCompleted = completedModules.includes(module.id);
                                const isUnlocked = index === 0 || completedModules.includes(learningModules[index - 1]?.id);

                                return (
                                    <div
                                        key={module.id}
                                        onClick={() => setAppState(AppState.BOOK_QUIZ)}
                                        onMouseEnter={playHoverSound}
                                        className={`group relative bg-slate-700/30 hover:bg-slate-700/50 p-4 rounded-xl border ${isCompleted ? 'border-green-500/50' : isUnlocked ? 'border-slate-600/50 hover:border-yellow-500/50' : 'border-white/5 opacity-50'} transition-all cursor-pointer flex items-center justify-between`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shadow-lg ${isCompleted ? 'bg-green-500 text-white shadow-green-500/20' : isUnlocked ? 'bg-yellow-500 text-white shadow-yellow-500/20' : 'bg-slate-800 text-slate-500'}`}>
                                                {isCompleted ? '✓' : !isUnlocked ? '🔒' : index + 1}
                                            </div>
                                            <div>
                                                <h4 className={`font-bold text-sm ${isCompleted ? 'text-green-400' : 'text-white group-hover:text-yellow-400'} transition-colors`}>
                                                    {module.title}
                                                </h4>
                                                <div className="flex gap-2 mt-1">
                                                    {module.requiredTopics.slice(0, 2).map((topic, i) => (
                                                        <span key={i} className="text-[8px] bg-white/5 px-1.5 py-0.5 rounded text-slate-500 uppercase font-black uppercase">
                                                            {topic}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        {isUnlocked && !isCompleted && (
                                            <span className="text-[8px] font-black text-yellow-500 uppercase tracking-widest animate-pulse">
                                                Go →
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                    </div>
                </div>

                <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10 shadow-xl">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <ClockIcon className="w-6 h-6 text-cyan-400 animate-wiggle" />
                        Recent Activity
                    </h3>
                    {isLoadingRecent ? (
                        <div className="space-y-3">
                            <SkeletonActivityItem />
                            <SkeletonActivityItem />
                            <SkeletonActivityItem />
                        </div>
                    ) : recentQuizzes.length > 0 ? (
                        <div className="space-y-3">
                            {recentQuizzes.map((q) => (
                                <div key={q.id} onMouseEnter={playHoverSound} className="bg-slate-700/30 p-4 rounded-xl border border-slate-600/50 hover:border-cyan-500/50 transition-all hover:scale-102">
                                    <div className="flex justify-between items-center">
                                        <span className="text-white font-semibold">{q.subject} - Grade {q.grade}</span>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${q.score >= 80 ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}`}>
                                            {q.score}%
                                        </span>
                                    </div>
                                    <div className="text-xs text-slate-400 mt-1">
                                        {new Date(q.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-slate-400 text-center py-8">No recent activity. Start a quiz to see your progress!</p>
                    )}
                </div>
            </div>
        </div>
    );
};

// Animated Card Style - Staggered entrance, float, shimmer, glow
const ActionCardBento: React.FC<{
    index: number;
    icon: React.ReactNode;
    label: string;
    emoji: string;
    gradient: string;
    onClick: () => void;
    onHover: () => void
}> = ({ index, icon, label, emoji, gradient, onClick, onHover }) => {
    return (
        <button
            type="button"
            onClick={onClick}
            onMouseEnter={onHover}
            className="group relative aspect-square w-full rounded-2xl overflow-hidden transition-all duration-500 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-slate-900 opacity-0 animate-card-enter"
            style={{
                animationDelay: `${index * 45}ms`,
                animationFillMode: 'forwards',
            }}
        >
            {/* Gradient background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
            <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-transparent" />
            {/* Shimmer sweep on hover */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-20deg] w-1/2" />
            </div>
            {/* Glow pulse on hover - inner div for animation */}
            <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-white/40 transition-colors duration-300 pointer-events-none animate-card-glow" />
            {/* Content - subtle float animation */}
            <div className="relative z-10 flex flex-col items-center justify-center h-full p-4 animate-card-float">
                <span className="absolute top-2 right-2 text-2xl opacity-90 group-hover:scale-110 transition-transform duration-300">{emoji}</span>
                <div className="mb-2 text-white drop-shadow-lg group-hover:scale-125 group-hover:rotate-6 transition-all duration-300">
                    {icon}
                </div>
                <span className="text-xs font-bold text-white uppercase tracking-wider text-center drop-shadow-md group-hover:text-yellow-100 transition-colors">
                    {label}
                </span>
            </div>
        </button>
    );
};

export default Dashboard;
