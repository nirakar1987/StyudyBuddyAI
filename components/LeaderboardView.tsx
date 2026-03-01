import React, { useState, useEffect } from 'react';
import { AppState, AppContextType } from '../types';
import { getLeaderboard, getStudentRank } from '../services/databaseService';
import { ArrowLeftOnRectangleIcon } from './icons/ArrowLeftOnRectangleIcon';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { SparklesIcon } from './icons/SparklesIcon';

interface LeaderboardViewProps {
    context: AppContextType;
}

interface LeaderboardEntry {
    id: string;
    name: string;
    avatar_style: string;
    score: number;
    streak: number;
    grade?: number;
}

const LeaderboardView: React.FC<LeaderboardViewProps> = ({ context }) => {
    const { setAppState, studentProfile } = context;
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [userRank, setUserRank] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [tab, setTab] = useState<'status_points' | 'streak'>('status_points');
    const [filter, setFilter] = useState<'global' | 'grade'>('global');

    useEffect(() => {
        const fetchLeaderboard = async () => {
            setIsLoading(true);
            try {
                const gradeFilter = filter === 'grade' ? studentProfile?.grade : undefined;
                const data = await getLeaderboard(50, tab, gradeFilter);
                setEntries(data as LeaderboardEntry[]);

                if (studentProfile?.id) {
                    const rank = await getStudentRank(studentProfile.id, tab);
                    setUserRank(rank);
                }
            } catch (error) {
                console.error('Failed to fetch leaderboard:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLeaderboard();
    }, [tab, filter, studentProfile?.id, studentProfile?.grade]);

    const getRankIcon = (index: number) => {
        if (index === 0) return '🥇';
        if (index === 1) return '🥈';
        if (index === 2) return '🥉';
        return null;
    };

    const getAvatarEmoji = (style: string) => {
        switch (style) {
            case 'fun': return '🌟';
            case 'smart': return '🧠';
            case 'cool': return '😎';
            case 'kind': return '💖';
            default: return '👤';
        }
    };

    return (
        <div className="flex flex-col h-full animate-fade-in text-white">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-yellow-400 to-orange-600 rounded-2xl shadow-lg shadow-orange-500/30">
                        <ChartBarIcon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black tracking-tight bg-gradient-to-r from-yellow-200 to-orange-400 bg-clip-text text-transparent">Global Hall of Fame</h2>
                        <p className="text-slate-400 text-sm font-medium">Top students of the week</p>
                    </div>
                </div>
                <button
                    onClick={() => setAppState(AppState.DASHBOARD)}
                    className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 hover:text-white transition-all border border-white/5"
                >
                    <ArrowLeftOnRectangleIcon className="w-6 h-6" />
                </button>
            </div>

            {/* Your Rank Card */}
            {!isLoading && userRank !== null && (
                <div className="bg-gradient-to-r from-slate-800/80 to-slate-900/80 p-5 rounded-3xl border border-white/10 mb-6 flex items-center justify-between shadow-2xl backdrop-blur-xl">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-3xl shadow-lg shadow-indigo-500/20">
                                {getAvatarEmoji(studentProfile?.avatar_style || 'fun')}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-yellow-500 border-4 border-slate-900 rounded-full flex items-center justify-center text-xs font-black text-black">
                                #{userRank}
                            </div>
                        </div>
                        <div>
                            <h3 className="font-black text-xl text-white">Your Ranking</h3>
                            <p className="text-slate-400 text-sm font-bold uppercase tracking-wider">Keep pushing, {studentProfile?.name.split(' ')[0]}!</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-black text-yellow-500">
                            {tab === 'status_points' ? (studentProfile?.score || 0) : (studentProfile?.streak || 1)}
                            <span className="text-xs ml-1 text-slate-500">{tab === 'status_points' ? 'pts' : '🔥'}</span>
                        </div>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{tab === 'status_points' ? 'Total Score' : 'Daily Streak'}</p>
                    </div>
                </div>
            )}

            {/* Tabs & Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex bg-slate-800/50 p-1 rounded-2xl border border-white/5 flex-grow">
                    <button
                        onClick={() => setTab('status_points')}
                        className={`flex-1 py-3 px-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${tab === 'status_points' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        🏆 Points
                    </button>
                    <button
                        onClick={() => setTab('streak')}
                        className={`flex-1 py-3 px-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${tab === 'streak' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        🔥 Streak
                    </button>
                </div>
                <div className="flex bg-slate-800/50 p-1 rounded-2xl border border-white/5">
                    <button
                        onClick={() => setFilter('global')}
                        className={`py-3 px-6 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${filter === 'global' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Global
                    </button>
                    <button
                        onClick={() => setFilter('grade')}
                        className={`py-3 px-6 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${filter === 'grade' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Class {studentProfile?.grade}
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
                {isLoading ? (
                    <div className="h-full flex flex-col items-center justify-center space-y-4">
                        <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                        <p className="text-slate-500 font-black animate-pulse uppercase tracking-[0.2em] text-xs">Summoning Champions...</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {entries.map((entry, index) => (
                            <div
                                key={entry.id}
                                className={`group p-4 rounded-2xl border transition-all flex items-center justify-between ${entry.id === studentProfile?.id
                                    ? 'bg-indigo-600/20 border-indigo-500/50 shadow-inner'
                                    : 'bg-slate-800/30 border-white/5 hover:border-white/10 hover:bg-slate-800/50'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 text-center font-black text-slate-500 text-xl italic group-hover:scale-110 transition-transform">
                                        {getRankIcon(index) || `#${index + 1}`}
                                    </div>
                                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-2xl group-hover:rotate-12 transition-transform shadow-inner">
                                        {getAvatarEmoji(entry.avatar_style)}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-black text-lg text-white group-hover:text-indigo-300 transition-colors uppercase tracking-tight">{entry.name}</h4>
                                            {index === 0 && <SparklesIcon className="w-4 h-4 text-yellow-400 animate-pulse" />}
                                        </div>
                                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Grade {entry.grade || '?'}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={`text-2xl font-black ${index < 3 ? 'text-white' : 'text-slate-400'}`}>
                                        {tab === 'status_points' ? entry.score : entry.streak}
                                        <span className="text-[10px] ml-1 uppercase opacity-50">{tab === 'status_points' ? 'pts' : '🔥'}</span>
                                    </div>
                                    {entry.id === studentProfile?.id && (
                                        <span className="text-[10px] bg-indigo-500 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">You</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LeaderboardView;
